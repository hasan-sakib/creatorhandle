"""Share image (Open Graph, 1200x630) for a creator's public page.

Drawn with Pillow's built-in font so the image needs no font files. Colors
follow the creator's accent; hex values are the sRGB equivalents of the
oklch presets in frontend/packages/shared/src/accents.ts.
"""

import io
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont, ImageOps

WIDTH, HEIGHT = 1200, 630
AVATAR = 260
PADDING = 80

ACCENT_HEX = {
    "teal": "#009485",
    "indigo": "#4779d2",
    "violet": "#7c67d0",
    "rose": "#cc4b68",
    "orange": "#d97025",
    "green": "#288f49",
    "sky": "#008caf",
    "slate": "#56606d",
    "sunset": "#d3584c",
    "aurora": "#7c6bcf",
}
# Gradient accents use their two CSS gradient stops
GRADIENTS = {"sunset": ("#f97316", "#ec4899"), "aurora": ("#8b5cf6", "#06b6d4")}


def _rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _darken(rgb: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    r, g, b = rgb
    return int(r * factor), int(g * factor), int(b * factor)


def _background(accent: str | None) -> Image.Image:
    """Diagonal gradient between the accent's two stops."""
    key = accent if accent in ACCENT_HEX else "teal"
    if key in GRADIENTS:
        start, end = (_rgb(c) for c in GRADIENTS[key])
    else:
        start = _rgb(ACCENT_HEX[key])
        end = _darken(start, 0.55)
    # Build a small gradient and scale it up: fast and smooth enough
    small = Image.new("RGB", (64, 34))
    px = small.load()
    assert px is not None
    for x in range(64):
        for y in range(34):
            t = (x / 63 + y / 33) / 2
            px[x, y] = tuple(
                round(s + (e - s) * t) for s, e in zip(start, end, strict=True)
            )
    return small.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC)


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    return ImageFont.load_default(size=size)


def _wrap(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    width: int,
    max_lines: int,
) -> list[str]:
    words, lines, line = text.split(), [], ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if draw.textlength(candidate, font=font) <= width:
            line = candidate
            continue
        if line:
            lines.append(line)
        line = word
        if len(lines) == max_lines:
            break
    if line and len(lines) < max_lines:
        lines.append(line)
    if len(lines) == max_lines and " ".join(lines) != " ".join(words):
        last = lines[-1]
        while last and draw.textlength(f"{last}…", font=font) > width:
            last = last[:-1]
        lines[-1] = f"{last.rstrip()}…"
    return lines


def _initials(name: str) -> str:
    parts = [p for p in name.split() if p[:1].isalnum()]
    return "".join(p[0] for p in parts[:2]).upper() or "@"


def _avatar(
    avatar: bytes | None, name: str, accent_rgb: tuple[int, int, int]
) -> Image.Image:
    """Round avatar with a white ring; initials when there is no photo."""
    size = AVATAR
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    face: Image.Image | None = None
    if avatar:
        try:
            face = ImageOps.fit(
                Image.open(io.BytesIO(avatar)).convert("RGB"), (size, size)
            )
        except Exception:
            face = None
    if face is None:
        face = Image.new("RGB", (size, size), (255, 255, 255))
        d = ImageDraw.Draw(face)
        font = _font(110)
        d.text(
            (size / 2, size / 2),
            _initials(name),
            font=font,
            fill=accent_rgb,
            anchor="mm",
        )
    ring = Image.new("RGBA", (size + 16, size + 16), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse(
        (0, 0, size + 15, size + 15), fill=(255, 255, 255, 230)
    )
    ring.paste(face, (8, 8), mask)
    return ring


@lru_cache(maxsize=256)
def render_profile_image(
    *,
    name: str,
    headline: str | None,
    handle: str,
    site: str,
    accent: str | None,
    avatar: bytes | None,
) -> bytes:
    """PNG bytes. Cached: inputs (incl. the avatar bytes) form the cache key."""
    image = _background(accent).convert("RGBA")
    draw = ImageDraw.Draw(image)
    accent_rgb = _rgb(ACCENT_HEX.get(accent or "", ACCENT_HEX["teal"]))

    ring = _avatar(avatar, name, accent_rgb)
    image.alpha_composite(ring, (PADDING, (HEIGHT - ring.height) // 2))

    left = PADDING + ring.width + 60
    text_width = WIDTH - left - PADDING
    white, soft = (255, 255, 255), (255, 255, 255, 215)

    name_font = _font(72)
    headline_font = _font(36)
    name_lines = _wrap(draw, name, name_font, text_width, 2)
    headline_lines = _wrap(draw, headline or "", headline_font, text_width, 3)

    block = len(name_lines) * 84 + (
        24 + len(headline_lines) * 46 if headline_lines else 0
    )
    y = (HEIGHT - block) // 2 - 20
    for line in name_lines:
        draw.text((left, y), line, font=name_font, fill=white)
        y += 84
    if headline_lines:
        y += 24
        for line in headline_lines:
            draw.text((left, y), line, font=headline_font, fill=soft)
            y += 46

    footer_font = _font(30)
    draw.text(
        (left, HEIGHT - PADDING - 30),
        f"{site}/@{handle}",
        font=footer_font,
        fill=soft,
    )

    out = io.BytesIO()
    image.convert("RGB").save(out, format="PNG", optimize=True)
    return out.getvalue()
