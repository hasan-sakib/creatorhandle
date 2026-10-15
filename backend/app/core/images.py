"""Turn an untrusted upload into a safe, small WebP image.

Decoding and re-encoding with Pillow means the stored file is always a real
image (no polyglots or scripts), with metadata such as EXIF GPS removed, and
sized for the web. The client-declared type is never trusted: Pillow sniffs the
actual bytes.
"""

import io
from typing import Literal

from PIL import Image, ImageOps, UnidentifiedImageError

Kind = Literal["avatar", "cover", "thumbnail"]

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}
# Refuse absurdly large images before decoding them (decompression bombs)
MAX_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

# Longest side for each kind; avatars are cropped to a square.
MAX_SIDE: dict[str, int] = {"avatar": 512, "cover": 2400, "thumbnail": 1600}


class ImageError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def process_image(data: bytes, kind: Kind) -> tuple[bytes, int, int]:
    try:
        probe = Image.open(io.BytesIO(data))
        if probe.format not in ALLOWED_FORMATS:
            raise ImageError(415, "Use a JPEG, PNG, WebP or GIF image.")
        if probe.width * probe.height > MAX_PIXELS:
            raise ImageError(413, "That image has too many pixels. Please use a smaller one.")
        probe.verify()  # cheap integrity check; the file must be reopened after

        image = Image.open(io.BytesIO(data))
        image = ImageOps.exif_transpose(image)  # honour camera rotation, then drop EXIF
        image.load()
    except ImageError:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError, ValueError):
        raise ImageError(415, "That file is not a valid image.") from None

    # Normalise colour modes WebP can store
    if image.mode in ("P", "LA", "PA"):
        image = image.convert("RGBA")
    elif image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")

    side = MAX_SIDE[kind]
    if kind == "avatar":
        image = ImageOps.fit(image, (side, side), Image.Resampling.LANCZOS)
    else:
        image.thumbnail((side, side), Image.Resampling.LANCZOS)  # never upscales

    out = io.BytesIO()
    image.save(out, format="WEBP", quality=85, method=4)
    return out.getvalue(), image.width, image.height
