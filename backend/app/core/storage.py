"""Thin wrapper around the S3 API of our object storage (RustFS)."""

import json
import logging
from functools import lru_cache
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings
from app.core.media import bucket_key

logger = logging.getLogger(__name__)


class StorageUnavailable(Exception):
    """Storage is not configured or could not be reached."""


@lru_cache
def _client() -> Any:
    if not settings.media_enabled:
        raise StorageUnavailable("Image storage is not configured")
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            connect_timeout=5,
            read_timeout=15,
            retries={"max_attempts": 2},
        ),
    )


def ensure_bucket() -> None:
    """Create the bucket if needed and allow anonymous reads of images only.

    Reads are public by design (they are portfolio images shown to visitors),
    but nothing else is: no bucket listing and no access outside images/.
    """
    client = _client()
    try:
        client.create_bucket(Bucket=settings.S3_BUCKET)
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") not in (
            "BucketAlreadyOwnedByYou",
            "BucketAlreadyExists",
        ):
            raise
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadImages",
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{settings.S3_BUCKET}/images/*"],
            }
        ],
    }
    client.put_bucket_policy(Bucket=settings.S3_BUCKET, Policy=json.dumps(policy))


def check_bucket() -> None:
    """Raise StorageUnavailable unless the bucket is reachable (readiness probe)."""
    try:
        _client().head_bucket(Bucket=settings.S3_BUCKET)
    except (BotoCoreError, ClientError) as e:
        raise StorageUnavailable("Image storage is unavailable") from e


def put_image(path: str, data: bytes) -> None:
    try:
        _client().put_object(
            Bucket=settings.S3_BUCKET,
            Key=bucket_key(path),
            Body=data,
            ContentType="image/webp",
            # File names are random and never reused, so they can be cached forever
            CacheControl="public, max-age=31536000, immutable",
        )
    except (BotoCoreError, ClientError) as e:
        logger.exception("Image upload to storage failed")
        raise StorageUnavailable("Image storage is unavailable") from e


def delete_image(path: str) -> None:
    """Best-effort: a failed delete only leaves an orphaned file behind."""
    try:
        _client().delete_object(Bucket=settings.S3_BUCKET, Key=bucket_key(path))
    except (StorageUnavailable, BotoCoreError, ClientError):
        logger.warning("Could not delete stored image %s", path, exc_info=True)
