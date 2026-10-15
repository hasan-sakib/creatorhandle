import io

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlmodel import Session

from app.core.config import settings
from app.core.media import bucket_key, is_media_path
from tests.api.routes.test_portfolio import make_brand, make_project, published_creator
from tests.utils.user import create_random_user_with_headers

pytestmark = pytest.mark.skipif(
    not settings.media_enabled, reason="object storage is not configured"
)

API = settings.API_V1_STR


def png(width=64, height=48, color=(200, 30, 30), mode="RGB") -> bytes:
    out = io.BytesIO()
    Image.new(mode, (width, height), color).save(out, format="PNG")
    return out.getvalue()


def jpeg_with_exif(width=80, height=40) -> bytes:
    img = Image.new("RGB", (width, height), (10, 120, 200))
    exif = Image.Exif()
    exif[0x010F] = "SecretCameraMaker"  # Make
    exif[0x0112] = 6  # Orientation: rotate 90
    out = io.BytesIO()
    img.save(out, format="JPEG", exif=exif)
    return out.getvalue()


def upload(client: TestClient, headers: dict, data: bytes, kind="thumbnail", name="x.png"):
    return client.post(
        f"{API}/uploads/images",
        headers=headers,
        files={"file": (name, data, "image/png")},
        data={"kind": kind},
    )


def public_get(path: str) -> httpx.Response:
    """Anonymous read straight from storage (what Caddy proxies for /media)."""
    return httpx.get(f"{settings.S3_ENDPOINT_URL}{path}", timeout=10)


def stored_image(path: str) -> Image.Image:
    r = public_get(path)
    assert r.status_code == 200, r.status_code
    return Image.open(io.BytesIO(r.content))


def test_upload_returns_a_public_webp(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    r = upload(client, headers, png())
    assert r.status_code == 200, r.text
    body = r.json()
    assert is_media_path(body["url"])
    assert (body["width"], body["height"]) == (64, 48)

    anon = public_get(body["url"])
    assert anon.status_code == 200
    assert anon.headers["content-type"] == "image/webp"
    assert "immutable" in anon.headers["cache-control"]
    img = Image.open(io.BytesIO(anon.content))
    assert img.format == "WEBP"


def test_metadata_is_stripped_and_rotation_applied(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    body = upload(client, headers, jpeg_with_exif(80, 40), name="photo.jpg").json()
    img = stored_image(body["url"])
    assert not img.getexif()  # no EXIF (camera make, GPS, ...) survives
    assert (img.width, img.height) == (40, 80)  # orientation 6 = rotated


def test_images_are_resized_but_never_upscaled(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    big = png(3000, 2000)
    thumb = upload(client, headers, big, kind="thumbnail").json()
    assert max(thumb["width"], thumb["height"]) == 1600 and thumb["width"] > thumb["height"]
    cover = upload(client, headers, big, kind="cover").json()
    assert cover["width"] == 2400
    avatar = upload(client, headers, big, kind="avatar").json()
    assert (avatar["width"], avatar["height"]) == (512, 512)  # square crop
    small = upload(client, headers, png(100, 50), kind="thumbnail").json()
    assert (small["width"], small["height"]) == (100, 50)


def test_transparent_png_keeps_alpha(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    body = upload(client, headers, png(20, 20, (255, 0, 0, 0), mode="RGBA")).json()
    assert stored_image(body["url"]).mode == "RGBA"


def test_gif_is_accepted(client: TestClient, db: Session) -> None:
    out = io.BytesIO()
    Image.new("P", (30, 30)).save(out, format="GIF")
    _, headers = create_random_user_with_headers(client, db)
    assert upload(client, headers, out.getvalue(), name="a.gif").status_code == 200


@pytest.mark.parametrize(
    "data,name",
    [
        (b"just some text, not an image", "notes.png"),
        (b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "x.svg"),
        (b"%PDF-1.4 fake", "a.pdf"),
        (png()[:40], "truncated.png"),
    ],
)
def test_non_images_and_corrupt_files_are_rejected(
    client: TestClient, db: Session, data: bytes, name: str
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    r = upload(client, headers, data, name=name)
    assert r.status_code == 415, r.text


def test_empty_and_oversized_uploads_are_rejected(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    assert upload(client, headers, b"").status_code == 400
    too_big = b"\x89PNG" + b"0" * (settings.MEDIA_MAX_UPLOAD_MB * 1024 * 1024 + 10)
    assert upload(client, headers, too_big).status_code == 413


def test_upload_requires_login_and_valid_kind(client: TestClient, db: Session) -> None:
    assert upload(client, {}, png()).status_code == 401
    _, headers = create_random_user_with_headers(client, db)
    assert upload(client, headers, png(), kind="banner").status_code == 422


def test_bucket_is_not_listable_and_only_images_are_public(client: TestClient) -> None:
    assert public_get(f"/{settings.S3_BUCKET}/").status_code in (403, 404)
    assert public_get(f"/{settings.S3_BUCKET}/other/file.webp").status_code in (403, 404)


def test_user_can_use_own_upload_as_avatar_and_public_page_shows_it(
    client: TestClient, db: Session
) -> None:
    username, headers, _ = published_creator(client, db)
    url = upload(client, headers, png(), kind="avatar").json()["url"]
    r = client.patch(f"{API}/users/me", headers=headers, json={"avatar_url": url})
    assert r.status_code == 200 and r.json()["avatar_url"] == url
    assert client.get(f"{API}/public/{username}").json()["avatar_url"] == url


def test_cannot_use_someone_elses_upload(client: TestClient, db: Session) -> None:
    _, owner_headers = create_random_user_with_headers(client, db)
    _, other_headers = create_random_user_with_headers(client, db)
    url = upload(client, owner_headers, png()).json()["url"]

    r = client.patch(f"{API}/users/me", headers=other_headers, json={"cover_image_url": url})
    assert r.status_code == 400
    # the original is untouched and still public
    assert public_get(url).status_code == 200


def test_arbitrary_media_paths_are_rejected(client: TestClient, db: Session) -> None:
    _, headers = create_random_user_with_headers(client, db)
    for bad in (
        "/media/images/zz/evil.webp",
        "/media/../secret",
        f"/media/images/{'a' * 16}/{'b' * 32}.png",
        "/other/images/x/y.webp",
    ):
        r = client.patch(f"{API}/users/me", headers=headers, json={"avatar_url": bad})
        assert r.status_code == 422, bad


def test_replacing_or_clearing_an_image_deletes_the_old_file(
    client: TestClient, db: Session
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    first = upload(client, headers, png()).json()["url"]
    second = upload(client, headers, png(color=(0, 0, 255))).json()["url"]
    client.patch(f"{API}/users/me", headers=headers, json={"cover_image_url": first})
    assert public_get(first).status_code == 200

    client.patch(f"{API}/users/me", headers=headers, json={"cover_image_url": second})
    assert public_get(first).status_code in (403, 404)  # old one removed
    assert public_get(second).status_code == 200

    client.patch(f"{API}/users/me", headers=headers, json={"cover_image_url": None})
    assert public_get(second).status_code in (403, 404)


def test_external_urls_still_work_and_are_never_deleted(
    client: TestClient, db: Session
) -> None:
    _, headers = create_random_user_with_headers(client, db)
    r = client.patch(
        f"{API}/users/me", headers=headers, json={"avatar_url": "https://example.com/me.png"}
    )
    assert r.status_code == 200
    r = client.patch(f"{API}/users/me", headers=headers, json={"avatar_url": None})
    assert r.status_code == 200


def test_project_thumbnail_ownership_and_cleanup(client: TestClient, db: Session) -> None:
    _, headers, ws = published_creator(client, db)
    _, other_headers = create_random_user_with_headers(client, db)
    mine = upload(client, headers, png()).json()["url"]
    foreign = upload(client, other_headers, png()).json()["url"]

    bad = client.post(
        f"{API}/projects/", headers=ws, json={"title": "X", "thumbnail_url": foreign}
    )
    assert bad.status_code == 400

    project = make_project(client, ws, "Y", thumbnail_url=mine)
    assert project["thumbnail_url"] == mine

    # replacing deletes the old thumbnail
    newer = upload(client, headers, png(color=(1, 2, 3))).json()["url"]
    r = client.put(f"{API}/projects/{project['id']}", headers=ws, json={"thumbnail_url": newer})
    assert r.status_code == 200
    assert public_get(mine).status_code in (403, 404)

    # deleting the project deletes its thumbnail
    assert client.delete(f"{API}/projects/{project['id']}", headers=ws).status_code == 200
    assert public_get(newer).status_code in (403, 404)
    assert public_get(foreign).status_code == 200  # others' files are untouched


def test_public_response_returns_project_thumbnail_path(client: TestClient, db: Session) -> None:
    username, headers, ws = published_creator(client, db)
    thumb = upload(client, headers, png()).json()["url"]
    brand = make_brand(client, ws, "Brand")
    make_project(client, ws, "Shown", platform_status="Published", brand_id=brand, thumbnail_url=thumb)
    data = client.get(f"{API}/public/{username}").json()
    assert data["projects"][0]["thumbnail_url"] == thumb


def test_bucket_key_maps_path_to_bucket_object() -> None:
    assert bucket_key("/media/images/a/b.webp") == "images/a/b.webp"
