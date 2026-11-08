"""
Brand assets for "Chnowa Ntayeb?" generated from the reference image, without redrawing anything.

    npm run brand        (= python scripts/build_brand.py)

Source: brand/reference/logo-reference.png (transparent PNG provided by Chef Souhed).
Steps:
  1. 4x upscale with Real-ESRGAN (realesrgan-x4plus-anime) when the executable is available
     (%USERPROFILE%/tools/realesrgan or REALESRGAN_EXE), otherwise a plain Lanczos upscale.
  2. Every file is cut / resized from that upscaled image:
     - logo, app icons, share image: the whole image, untouched
     - mark (header symbol): the illustration without the text, bottom faded out
     - favicon: the chef hat + cloche in a round cream badge with a brown ring
Requires Python 3 + Pillow (pip install pillow).
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
REFERENCE = ROOT / "brand" / "reference" / "logo-reference.png"
PUBLIC = ROOT / "public"

CREAM = (255, 248, 236, 255)  # #FFF8EC, background of the opaque icons / share image

# Regions in the reference image coordinates (1536 x 1024)
HERO_BOX = (230, 0, 1335, 480)  # illustration without the name
HERO_FADE = (405, 470)  # the name's bubble starts below: fade the bottom out between these rows
FAV_BOX = (425, 0, 1080, 472)  # chef hat + cloche
FAV_FADE = (415, 472)  # bottom of the cloche fades into the badge's cream (the name bubble starts below)
RING = (90, 46, 26, 255)  # brown ring of the favicon badge, same as the logo outlines


def log(msg: str) -> None:
    print(f"  {msg}")


# ---------------------------------------------------------------------------
# 1. Upscale
# ---------------------------------------------------------------------------
def find_realesrgan() -> Path | None:
    candidates = [
        os.environ.get("REALESRGAN_EXE"),
        str(Path.home() / "tools" / "realesrgan" / "realesrgan-ncnn-vulkan.exe"),
        shutil.which("realesrgan-ncnn-vulkan"),
    ]
    for c in candidates:
        if c and Path(c).is_file():
            return Path(c)
    return None


def upscale(src: Image.Image) -> tuple[Image.Image, float]:
    """Returns the 4x image and the scale factor (to convert reference coordinates)."""
    exe = find_realesrgan()
    if exe:
        with tempfile.TemporaryDirectory() as tmp:
            # RGB is upscaled by the AI; alpha separately (Lanczos) so edges stay clean.
            # Transparent pixels get the colour of their neighbours first, so no dark fringe bleeds in.
            rgb = bleed_edges(src).convert("RGB")
            inp, out = Path(tmp) / "in.png", Path(tmp) / "out.png"
            rgb.save(inp)
            result = subprocess.run(
                [str(exe), "-i", str(inp), "-o", str(out), "-n", "realesrgan-x4plus-anime", "-s", "4"],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0 and out.exists():
                up_rgb = Image.open(out).convert("RGB")
                alpha = src.getchannel("A").resize(up_rgb.size, Image.LANCZOS)
                up_rgb.putalpha(alpha)
                log(f"Real-ESRGAN x4: {src.size} -> {up_rgb.size}")
                return up_rgb, up_rgb.width / src.width
            log("Real-ESRGAN failed, falling back to Lanczos")
    else:
        log("Real-ESRGAN not found, Lanczos upscale (install it for sharper results)")
    up = src.resize((src.width * 4, src.height * 4), Image.LANCZOS)
    return up, 4.0


def bleed_edges(img: Image.Image, passes: int = 6) -> Image.Image:
    """Fills fully transparent pixels with the colour of nearby opaque ones (alpha unchanged)."""
    rgba = img.copy()
    alpha = rgba.getchannel("A")
    filled = rgba.copy()
    filled.putalpha(Image.new("L", rgba.size, 255))
    known = alpha.point(lambda v: 255 if v > 0 else 0)
    for _ in range(passes):
        blurred = filled.filter(ImageFilter.MaxFilter(5))
        filled = Image.composite(filled, blurred, known)
        known = known.filter(ImageFilter.MaxFilter(5))
    filled.putalpha(alpha)
    return filled


# ---------------------------------------------------------------------------
# 2. Helpers
# ---------------------------------------------------------------------------
def scale_box(box, k):
    return tuple(int(round(v * k)) for v in box)


def content_crop(img: Image.Image, margin_ratio: float = 0.0) -> Image.Image:
    """Crops to non-transparent content, with an optional transparent margin."""
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    cropped = img.crop(bbox)
    if margin_ratio <= 0:
        return cropped
    m = int(max(cropped.size) * margin_ratio)
    canvas = Image.new("RGBA", (cropped.width + 2 * m, cropped.height + 2 * m), (0, 0, 0, 0))
    canvas.alpha_composite(cropped, (m, m))
    return canvas


def fit_on(img: Image.Image, size: tuple[int, int], fill_ratio: float, background) -> Image.Image:
    """Centers img inside a canvas, scaled so it fills `fill_ratio` of the canvas (by its larger side)."""
    canvas = Image.new("RGBA", size, background)
    k = min(size[0] * fill_ratio / img.width, size[1] * fill_ratio / img.height)
    resized = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return canvas


def resize_width(img: Image.Image, width: int) -> Image.Image:
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def fade_bottom(img: Image.Image, y0: int, y1: int) -> Image.Image:
    w, h = img.size
    ramp = Image.new("L", (1, h), 255)
    for y in range(h):
        if y >= y1:
            v = 0
        elif y > y0:
            v = int(255 * (1 - ((y - y0) / (y1 - y0)) ** 1.6))
        else:
            v = 255
        ramp.putpixel((0, y), v)
    ramp = ramp.resize((w, h))
    out = img.copy()
    out.putalpha(Image.composite(img.getchannel("A"), Image.new("L", (w, h), 0), ramp))
    return out


def circle_mask(size: int, inset: int = 0) -> Image.Image:
    """Anti-aliased disc mask (drawn at 4x then reduced)."""
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).ellipse([inset * 4, inset * 4, size * 4 - 1 - inset * 4, size * 4 - 1 - inset * 4], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def favicon_badge(big: Image.Image, k: float, size: int = 1024) -> Image.Image:
    """Round cream badge with a brown ring, containing the chef hat + cloche of the reference."""
    y0, y1 = FAV_FADE
    hat = content_crop(fade_bottom(big, int(y0 * k), int(y1 * k)).crop(scale_box(FAV_BOX, k)))
    canvas = Image.new("RGBA", (size, size), CREAM)
    scale = min(size * 0.86 / hat.width, size * 0.86 / hat.height)
    hat = hat.resize((round(hat.width * scale), round(hat.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(hat, ((size - hat.width) // 2, (size - hat.height) // 2 + int(size * 0.03)))
    canvas.putalpha(circle_mask(size, inset=6))
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([10, 10, size - 11, size - 11], outline=RING, width=24)
    canvas.alpha_composite(ring)
    return canvas


def save(img: Image.Image, name: str, opaque: bool = False) -> None:
    path = PUBLIC / name
    if opaque:
        img = img.convert("RGB")
    img.save(path, optimize=True)
    log(f"public/{name}  {img.size[0]}x{img.size[1]}  {round(path.stat().st_size / 1024)} KB")


# ---------------------------------------------------------------------------
# 3. Build
# ---------------------------------------------------------------------------
def main() -> int:
    if not REFERENCE.exists():
        print(f"Missing reference image: {REFERENCE}")
        return 1
    src = Image.open(REFERENCE).convert("RGBA")
    print(f"Reference: {REFERENCE.relative_to(ROOT)} {src.size}")
    big, k = upscale(src)

    # Whole logo, untouched (transparent margin of 3 %)
    logo = content_crop(big, margin_ratio=0.03)
    print("Logo:")
    save(resize_width(logo, 1024), "logo-full.png")
    save(resize_width(logo, 512), "logo.png")

    # App icons: whole logo on a plain cream background
    print("App icons:")
    save(fit_on(logo, (512, 512), 0.92, CREAM), "icon-512.png", opaque=True)
    save(fit_on(logo, (192, 192), 0.92, CREAM), "icon-192.png", opaque=True)
    save(fit_on(logo, (180, 180), 0.92, CREAM), "apple-touch-icon.png", opaque=True)
    save(fit_on(logo, (512, 512), 0.70, CREAM), "icon-512-maskable.png", opaque=True)  # 80 % safe circle

    # Share image 1200 x 630
    print("Share image:")
    save(fit_on(logo, (1200, 630), 0.9, CREAM), "og-image.png", opaque=True)

    # Header symbol: illustration without the name, bottom faded out
    print("Header symbol:")
    y0, y1 = HERO_FADE
    hero = fade_bottom(big, int(y0 * k), int(y1 * k)).crop(scale_box(HERO_BOX, k))
    save(resize_width(content_crop(hero), 360), "mark.png")  # shown ~40 px high: 360 px covers 2-3x screens

    # Favicon: chef hat + cloche (bottom faded into the cream) inside a round cream badge with a brown ring
    print("Favicon:")
    fav = favicon_badge(big, k)
    for s in (16, 32, 48):
        save(fav.resize((s, s), Image.LANCZOS), f"favicon-{s}.png")
    fav.resize((256, 256), Image.LANCZOS).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    log("public/favicon.ico  16/32/48/64")

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
