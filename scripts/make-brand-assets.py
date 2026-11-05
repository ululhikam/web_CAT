"""Generate favicon, app icons, and OG image from logo.png.

Run from repo root: python scripts/make-brand-assets.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo.png"
OUT = ROOT / "apps" / "web" / "static"

BG = (23, 0, 91)
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"


def load_mark() -> Image.Image:
    """Return the logo with the flat navy background turned transparent."""
    image = Image.open(SRC).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            # Only the flat backdrop is replaced; the artwork keeps its own
            # gradients because it is much brighter than (23, 0, 91).
            if abs(r - BG[0]) < 26 and abs(g - BG[1]) < 26 and abs(b - BG[2]) < 26:
                pixels[x, y] = (r, g, b, 0)
    return image.crop(image.getbbox())


def rounded_tile(mark: Image.Image, size: int, radius_ratio: float = 0.22) -> Image.Image:
    """Composite the mark on a rounded navy tile (for favicon/app icons)."""
    tile = Image.new("RGBA", (size, size), BG + (255,))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255
    )
    tile.putalpha(mask)

    inner = int(size * 0.74)
    icon = mark.copy()
    icon.thumbnail((inner, inner), Image.LANCZOS)
    tile.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    return tile


def footer_logo(mark: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon = mark.copy()
    icon.thumbnail((size, size), Image.LANCZOS)
    canvas.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    return canvas


def build_og(mark: Image.Image) -> Image.Image:
    width, height = 1200, 630
    canvas = Image.new("RGBA", (width, height), BG + (255,))
    draw = ImageDraw.Draw(canvas)

    # Soft diagonal glow so the card does not look flat.
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for i in range(220, 0, -1):
        alpha = int(58 * (1 - i / 220))
        glow_draw.ellipse(
            (width - 460 - i, -260 - i, width + 220 + i, 420 + i),
            fill=(90, 60, 255, alpha),
        )
    canvas.alpha_composite(glow)

    logo = mark.copy()
    logo.thumbnail((300, 300), Image.LANCZOS)
    canvas.alpha_composite(logo, (88, (height - logo.height) // 2))

    title_font = ImageFont.truetype(FONT_BOLD, 112)
    sub_font = ImageFont.truetype(FONT_REGULAR, 34)
    pill_font = ImageFont.truetype(FONT_BOLD, 24)

    left = 88 + 300 + 64
    draw.text((left, 214), "TES CAT", font=title_font, fill=(255, 255, 255, 255))
    draw.text(
        (left, 352),
        "Computer Assisted Test seleksi Polri",
        font=sub_font,
        fill=(196, 190, 255, 255),
    )
    draw.text(
        (left, 398),
        "Psikologi - TKK - TPK - sistem gugur",
        font=sub_font,
        fill=(196, 190, 255, 255),
    )

    pill = "tes-cat.vercel.app"
    pill_box = draw.textbbox((0, 0), pill, font=pill_font)
    pill_w = pill_box[2] - pill_box[0] + 56
    pill_h = pill_box[3] - pill_box[1] + 34
    draw.rounded_rectangle(
        (left, 486, left + pill_w, 486 + pill_h),
        radius=pill_h // 2,
        outline=(150, 130, 255, 255),
        width=2,
    )
    draw.text(
        (left + 28, 486 + 12),
        pill,
        font=pill_font,
        fill=(230, 226, 255, 255),
    )
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mark = load_mark()

    mark.resize((512, 512), Image.LANCZOS).save(OUT / "logo-mark.png")
    # Header/sidebar sit on white, where the mark's white page disappears.
    # A navy tile keeps the artwork legible there.
    rounded_tile(mark, 128, 0.24).save(OUT / "logo-badge.png")
    for size in (192, 512):
        rounded_tile(mark, size).save(OUT / f"icon-{size}.png")
    rounded_tile(mark, 180, 0.0).save(OUT / "apple-touch-icon.png")
    favicon = rounded_tile(mark, 64, 0.22)
    favicon.save(OUT / "favicon.png")
    favicon.save(
        OUT / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    build_og(mark).convert("RGB").save(OUT / "og.png", optimize=True)

    for name in (
        "logo-mark.png",
        "logo-badge.png",
        "icon-192.png",
        "icon-512.png",
        "apple-touch-icon.png",
        "favicon.png",
        "favicon.ico",
        "og.png",
    ):
        path = OUT / name
        print(f"{name:24s} {path.stat().st_size / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
