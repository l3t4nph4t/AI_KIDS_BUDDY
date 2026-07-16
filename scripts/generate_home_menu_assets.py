from __future__ import annotations

from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "web" / "static" / "assets" / "menu"
CANVAS = (512, 300)
SCALE = 3


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


def scaled_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    size = (CANVAS[0] * SCALE, CANVAS[1] * SCALE)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def s(value: float) -> int:
    return round(value * SCALE)


def box(x0: float, y0: float, x1: float, y1: float) -> tuple[int, int, int, int]:
    return (s(x0), s(y0), s(x1), s(y1))


def draw_soft_shadow(img: Image.Image, rect: tuple[float, float, float, float], radius: float, alpha: int) -> None:
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    d.rounded_rectangle(box(*rect), radius=s(radius), fill=(88, 45, 26, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(s(10)))
    img.alpha_composite(shadow)


def draw_platform(draw: ImageDraw.ImageDraw, img: Image.Image, base: str, dark: str) -> None:
    draw_soft_shadow(img, (82, 174, 430, 238), 42, 72)
    draw.rounded_rectangle(box(82, 160, 430, 232), radius=s(36), fill=rgba(base))
    draw.rounded_rectangle(box(82, 196, 430, 232), radius=s(36), fill=rgba(dark))
    draw.rounded_rectangle(box(112, 169, 400, 196), radius=s(16), fill=(255, 255, 255, 80))
    draw.ellipse(box(70, 139, 112, 181), fill=rgba("#ffd85e"))
    draw.polygon([(s(91), s(131)), (s(98), s(151)), (s(120), s(151)), (s(102), s(164)), (s(109), s(185)), (s(91), s(172)), (s(73), s(185)), (s(80), s(164)), (s(62), s(151)), (s(84), s(151))], fill=rgba("#ffe56d"))
    draw.ellipse(box(404, 137, 440, 173), fill=rgba("#ffd85e"))
    draw.polygon([(s(422), s(130)), (s(428), s(148)), (s(447), s(148)), (s(431), s(159)), (s(437), s(178)), (s(422), s(166)), (s(406), s(178)), (s(412), s(159)), (s(396), s(148)), (s(416), s(148))], fill=rgba("#ffe56d"))


def draw_book(draw: ImageDraw.ImageDraw) -> None:
    draw_soft_icon(draw, (176, 74, 348, 178), 16)
    draw.rounded_rectangle(box(170, 76, 258, 178), radius=s(14), fill=rgba("#fbf3d3"), outline=rgba("#8bc47d"), width=s(5))
    draw.rounded_rectangle(box(258, 76, 346, 178), radius=s(14), fill=rgba("#fff8e1"), outline=rgba("#8bc47d"), width=s(5))
    draw.line([s(258), s(84), s(258), s(180)], fill=rgba("#e2c77a"), width=s(4))
    for y in (104, 126, 148):
        draw.line([s(188), s(y), s(240), s(y - 6)], fill=rgba("#b8895e"), width=s(3))
        draw.line([s(276), s(y - 6), s(328), s(y)], fill=rgba("#b8895e"), width=s(3))
    draw.ellipse(box(282, 106, 318, 142), fill=rgba("#ff8da6"))
    draw.ellipse(box(298, 118, 334, 154), fill=rgba("#7ed7a3"))


def draw_decor(draw: ImageDraw.ImageDraw) -> None:
    draw_soft_icon(draw, (176, 92, 342, 166), 16)
    draw.rounded_rectangle(box(174, 106, 330, 164), radius=s(20), fill=rgba("#f6d0f3"), outline=rgba("#9266d8"), width=s(5))
    draw.rounded_rectangle(box(202, 70, 292, 116), radius=s(14), fill=rgba("#fff0dc"), outline=rgba("#b9886a"), width=s(4))
    draw.rectangle(box(238, 112, 258, 164), fill=rgba("#aa7df0"))
    draw.rounded_rectangle(box(158, 150, 356, 184), radius=s(17), fill=rgba("#8053d8"))
    draw.rounded_rectangle(box(172, 150, 342, 164), radius=s(7), fill=(255, 255, 255, 80))


def draw_games(draw: ImageDraw.ImageDraw) -> None:
    draw_soft_icon(draw, (158, 70, 360, 176), 22)
    draw.rounded_rectangle(box(154, 96, 358, 176), radius=s(34), fill=rgba("#fff0c8"), outline=rgba("#8053d8"), width=s(6))
    draw.ellipse(box(150, 118, 218, 188), fill=rgba("#fff0c8"), outline=rgba("#8053d8"), width=s(6))
    draw.ellipse(box(294, 118, 362, 188), fill=rgba("#fff0c8"), outline=rgba("#8053d8"), width=s(6))
    draw.rounded_rectangle(box(190, 126, 248, 146), radius=s(6), fill=rgba("#6f4ac7"))
    draw.rounded_rectangle(box(209, 107, 229, 165), radius=s(6), fill=rgba("#6f4ac7"))
    draw.ellipse(box(282, 112, 308, 138), fill=rgba("#ff7198"))
    draw.ellipse(box(316, 132, 342, 158), fill=rgba("#58b8ed"))
    draw.ellipse(box(288, 152, 314, 178), fill=rgba("#51c978"))
    draw.line([s(234), s(92), s(256), s(70), s(278), s(92)], fill=rgba("#8053d8"), width=s(7))
    draw.ellipse(box(248, 64, 268, 84), fill=rgba("#ffd85e"))


def draw_library(draw: ImageDraw.ImageDraw) -> None:
    draw_soft_icon(draw, (178, 58, 336, 178), 16)
    draw.rounded_rectangle(box(180, 64, 336, 178), radius=s(14), fill=rgba("#dca66b"), outline=rgba("#7a5237"), width=s(5))
    draw.rectangle(box(194, 82, 322, 102), fill=rgba("#8ad0f4"))
    draw.rectangle(box(194, 112, 322, 132), fill=rgba("#9ddd8a"))
    draw.rectangle(box(194, 142, 322, 162), fill=rgba("#f7cb6c"))
    for x in (214, 252, 292):
        draw.line([s(x), s(72), s(x), s(170)], fill=rgba("#7a5237"), width=s(4))
    draw.rounded_rectangle(box(154, 104, 202, 178), radius=s(8), fill=rgba("#fff5d6"), outline=rgba("#5478b8"), width=s(4))
    draw.line([s(166), s(124), s(190), s(124)], fill=rgba("#b8895e"), width=s(3))
    draw.line([s(166), s(146), s(190), s(146)], fill=rgba("#b8895e"), width=s(3))


def draw_art(draw: ImageDraw.ImageDraw) -> None:
    draw_soft_icon(draw, (170, 62, 348, 178), 18)
    draw.ellipse(box(176, 68, 334, 174), fill=rgba("#fff0c8"), outline=rgba("#a87043"), width=s(5))
    draw.ellipse(box(280, 126, 322, 168), fill=(255, 255, 255, 0))
    for color, x, y in [("#ff5d7e", 214, 100), ("#7ed7a3", 252, 90), ("#6db9f2", 286, 106), ("#ffd75e", 238, 132)]:
        draw.ellipse(box(x, y, x + 24, y + 24), fill=rgba(color))
    draw.line([s(306), s(78), s(356), s(30)], fill=rgba("#8a5a35"), width=s(12))
    draw.line([s(314), s(86), s(364), s(38)], fill=rgba("#fff7de"), width=s(5))
    draw.polygon([(s(358), s(28)), (s(384), s(10)), (s(374), s(46))], fill=rgba("#573629"))


def draw_music(draw: ImageDraw.ImageDraw) -> None:
    draw_soft_icon(draw, (188, 54, 334, 178), 18)
    draw.rounded_rectangle(box(190, 94, 298, 176), radius=s(18), fill=rgba("#fff0d8"), outline=rgba("#d85a7c"), width=s(5))
    draw.rectangle(box(266, 68, 286, 150), fill=rgba("#ff7b9b"))
    draw.ellipse(box(232, 136, 274, 178), fill=rgba("#ff7b9b"))
    draw.polygon([(s(284), s(68)), (s(348), s(84)), (s(348), s(108)), (s(284), s(92))], fill=rgba("#ffb7c6"))
    draw.arc(box(122, 82, 196, 158), start=292, end=72, fill=rgba("#7ac6f3"), width=s(8))
    draw.arc(box(104, 64, 214, 176), start=292, end=72, fill=rgba("#7ac6f3"), width=s(7))


def draw_soft_icon(draw: ImageDraw.ImageDraw, rect: tuple[float, float, float, float], radius: float) -> None:
    # Local soft base behind object; drawn with low alpha so it reads as integrated with the platform.
    draw.rounded_rectangle(box(*rect), radius=s(radius), fill=(255, 255, 255, 48))


ITEMS: dict[str, tuple[str, str, Callable[[ImageDraw.ImageDraw], None]]] = {
    "menu_learn.webp": ("#51c978", "#248956", draw_book),
    "menu_decor.webp": ("#b88cff", "#7a4fd2", draw_decor),
    "menu_games.webp": ("#b384ff", "#6d49cc", draw_games),
    "menu_library.webp": ("#58b8ed", "#237db9", draw_library),
    "menu_art.webp": ("#ffb34e", "#df7224", draw_art),
    "menu_music.webp": ("#ff7198", "#ce3466", draw_music),
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, (base, dark, draw_icon) in ITEMS.items():
        img, draw = scaled_canvas()
        draw_platform(draw, img, base, dark)
        draw_icon(draw)
        img = img.resize(CANVAS, Image.Resampling.LANCZOS)
        img.save(OUT_DIR / filename, "WEBP", quality=92, method=4)


if __name__ == "__main__":
    main()
