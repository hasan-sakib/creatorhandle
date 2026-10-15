import logging

from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core import storage
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60 * 2  # 2 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init() -> None:
    storage.ensure_bucket()


def main() -> None:
    if not settings.media_enabled:
        logger.info("Image storage is not configured; uploads are disabled")
        return
    logger.info("Preparing image storage")
    init()
    logger.info("Image storage ready")


if __name__ == "__main__":
    main()
