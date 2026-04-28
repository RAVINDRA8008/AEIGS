from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:
    raise SystemExit("Pillow is required. Install with: pip install pillow") from exc


W, H = 1920, 1080
TEXT = "#111111"
SUBTEXT = "#3a3a3a"
LINE = "#111111"

COLORS = {
    "blue": "#111111",
    "violet": "#111111",
    "teal": "#111111",
    "amber": "#111111",
    "rose": "#111111",
    "emerald": "#111111",
    "cyan": "#111111",
}


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def hex_to_rgb(code: str) -> tuple[int, int, int]:
    code = code.lstrip("#")
    return int(code[0:2], 16), int(code[2:4], 16), int(code[4:6], 16)


def draw_gradient_bg(img: Image.Image, c1: str = "#ffffff", c2: str = "#f6f6f6") -> None:
    d = ImageDraw.Draw(img)
    r1, g1, b1 = hex_to_rgb(c1)
    r2, g2, b2 = hex_to_rgb(c2)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t)))

    # Keep background minimal for clean PPT readability.
    d.rectangle((40, 40, W - 40, H - 40), outline="#e5e5e5", width=2)


def draw_node(draw: ImageDraw.ImageDraw, rect: tuple[int, int, int, int], accent: str, title: str, subtitle: str) -> None:
    x1, y1, x2, y2 = rect

    # Subtle depth with monochrome card.
    draw.rounded_rectangle((x1 + 8, y1 + 10, x2 + 8, y2 + 10), radius=26, fill="#0000001f")
    draw.rounded_rectangle(rect, radius=26, fill="#ffffff", outline="#111111", width=2)
    draw.rounded_rectangle((x1, y1, x2, y1 + 10), radius=26, fill=accent)

    title_font = get_font(42, bold=True)
    sub_font = get_font(31)
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    sub_bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    tw = title_bbox[2] - title_bbox[0]
    sw = sub_bbox[2] - sub_bbox[0]
    th = title_bbox[3] - title_bbox[1]
    sh = sub_bbox[3] - sub_bbox[1]

    cx = (x1 + x2) // 2
    y = (y1 + y2 - (th + sh + 14)) // 2 + 8
    draw.text((cx - tw // 2, y), title, font=title_font, fill=TEXT)
    draw.text((cx - sw // 2, y + th + 14), subtitle, font=sub_font, fill=SUBTEXT)


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int]) -> None:
    sx, sy = start
    ex, ey = end
    draw.line([start, end], fill=LINE, width=7)

    dx = ex - sx
    dy = ey - sy
    if abs(dx) >= abs(dy):
        sign = 1 if dx > 0 else -1
        head = [(ex, ey), (ex - 22 * sign, ey - 12), (ex - 22 * sign, ey + 12)]
    else:
        sign = 1 if dy > 0 else -1
        head = [(ex, ey), (ex - 12, ey - 22 * sign), (ex + 12, ey - 22 * sign)]
    draw.polygon(head, fill=LINE)


def draw_orthogonal_arrow(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]]) -> None:
    if len(points) < 2:
        return
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=LINE, width=7)
    draw_arrow(draw, points[-2], points[-1])


def make_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), "#ffffff")
    draw_gradient_bg(img)
    return img, ImageDraw.Draw(img)


def draw_heading(draw: ImageDraw.ImageDraw, title: str) -> None:
    title_font = get_font(50, bold=True)
    subtitle_font = get_font(28)
    draw.text((84, 58), title, font=title_font, fill=TEXT)
    draw.text((84, 118), "AEGIS Process Flow", font=subtitle_font, fill=SUBTEXT)
    draw.line([(84, 158), (640, 158)], fill="#111111", width=3)


def draw_arch_heading(draw: ImageDraw.ImageDraw) -> None:
    title_font = get_font(50, bold=True)
    subtitle_font = get_font(28)
    draw.text((84, 58), "Architecture Diagram", font=title_font, fill=TEXT)
    draw.text((84, 118), "AEGIS Proposed Solution", font=subtitle_font, fill=SUBTEXT)
    draw.line([(84, 158), (640, 158)], fill="#111111", width=3)


def part1(out: Path) -> None:
    img, d = make_canvas()
    draw_heading(d, "Part 1: Asset Intake and Detection")

    draw_node(d, (110, 220, 500, 410), COLORS["blue"], "Upload Asset", "Image | Video | Document")
    draw_node(d, (590, 220, 1020, 410), COLORS["violet"], "AI Fingerprint", "Gemini feature signature")
    draw_node(d, (1110, 220, 1500, 410), COLORS["cyan"], "Index", "Metadata + ownership")

    draw_node(d, (430, 610, 910, 840), COLORS["amber"], "Live Scan", "Continuous web and social scan")
    draw_node(d, (1030, 610, 1780, 840), COLORS["rose"], "Detection Event", "Match url + confidence + timestamp")

    draw_arrow(d, (500, 315), (590, 315))
    draw_arrow(d, (1020, 315), (1110, 315))
    draw_arrow(d, (1305, 410), (770, 610))
    draw_arrow(d, (910, 725), (1030, 725))

    img.save(out / "process_flow_part1.png", optimize=True)


def part2(out: Path) -> None:
    img, d = make_canvas()
    draw_heading(d, "Part 2: Intelligence and Prioritization")

    draw_node(d, (150, 220, 620, 410), COLORS["amber"], "Risk Scoring", "Impact + spread + offender history")
    draw_node(d, (730, 220, 1220, 410), COLORS["violet"], "Offender Graph", "Cross-platform alias linkage")
    draw_node(d, (1330, 220, 1780, 410), COLORS["rose"], "Leak Prediction", "Where piracy spreads next")

    draw_node(d, (180, 630, 710, 880), COLORS["emerald"], "Critical", "Immediate enforcement SLA")
    draw_node(d, (780, 630, 1280, 880), COLORS["cyan"], "Medium", "Scheduled enforcement")
    draw_node(d, (1350, 630, 1780, 880), COLORS["blue"], "Low", "Observe and re-score")

    draw_arrow(d, (620, 315), (730, 315))
    draw_arrow(d, (1220, 315), (1330, 315))
    draw_arrow(d, (385, 410), (445, 630))
    draw_arrow(d, (975, 410), (1030, 630))
    draw_arrow(d, (1555, 410), (1565, 630))

    img.save(out / "process_flow_part2.png", optimize=True)


def part3(out: Path) -> None:
    img, d = make_canvas()
    draw_heading(d, "Part 3: Enforcement, Evidence, and Recovery")

    draw_node(d, (120, 220, 620, 410), COLORS["rose"], "DMCA Action", "Automated takedown request")
    draw_node(d, (710, 220, 1240, 410), COLORS["emerald"], "License Conversion", "Offer legal monetization path")
    draw_node(d, (1330, 220, 1810, 410), COLORS["amber"], "Escalation", "Repeat offender legal escalation")

    draw_node(d, (420, 640, 1060, 900), COLORS["cyan"], "Evidence Chain", "Hash + timestamp + source capture set")
    draw_node(d, (1140, 640, 1810, 900), COLORS["violet"], "Compliance Reporting", "Audit trail + recovery analytics")

    draw_arrow(d, (370, 410), (640, 640))
    draw_arrow(d, (975, 410), (760, 640))
    draw_arrow(d, (1570, 410), (880, 640))
    draw_arrow(d, (1060, 770), (1140, 770))

    img.save(out / "process_flow_part3.png", optimize=True)


def architecture(out: Path) -> None:
    img, d = make_canvas()
    draw_arch_heading(d)

    # Client and delivery layer
    draw_node(d, (90, 210, 470, 380), COLORS["blue"], "Web Client", "React + Vite dashboard")
    draw_node(d, (560, 210, 980, 380), COLORS["blue"], "API Gateway", "FastAPI routes + auth")
    draw_node(d, (1050, 210, 1450, 380), COLORS["blue"], "Realtime Stream", "WebSocket and SSE")

    # Service layer
    draw_node(d, (90, 470, 500, 660), COLORS["violet"], "Detection Service", "Scan, match, fingerprint")
    draw_node(d, (560, 470, 980, 660), COLORS["violet"], "Intelligence Service", "Risk score + leak prediction")
    draw_node(d, (1050, 470, 1450, 660), COLORS["violet"], "Enforcement Service", "DMCA + licensing workflow")

    # Data and integrations layer
    draw_node(d, (90, 760, 500, 950), COLORS["teal"], "Operational DB", "SQLite or PostgreSQL")
    draw_node(d, (560, 760, 980, 950), COLORS["teal"], "Vector Store", "ChromaDB embeddings")
    draw_node(d, (1050, 760, 1450, 950), COLORS["teal"], "Object Storage", "Evidence + reports + media")

    # External systems
    draw_node(d, (1510, 240, 1860, 430), COLORS["amber"], "Gemini API", "AI narration + analysis")
    draw_node(d, (1510, 700, 1860, 950), COLORS["amber"], "Platform APIs", "Search, social, video sources")

    # Main request path
    draw_arrow(d, (470, 295), (560, 295))
    draw_arrow(d, (980, 295), (1050, 295))

    # Gateway to services
    draw_orthogonal_arrow(d, [(700, 380), (700, 430), (295, 430), (295, 470)])
    draw_arrow(d, (770, 380), (770, 470))
    draw_orthogonal_arrow(d, [(840, 380), (840, 430), (1250, 430), (1250, 470)])

    # Services to data
    draw_arrow(d, (295, 660), (295, 760))
    draw_arrow(d, (770, 660), (770, 760))
    draw_arrow(d, (1250, 660), (1250, 760))

    # AI and platform integrations
    draw_orthogonal_arrow(d, [(1450, 530), (1480, 530), (1480, 335), (1510, 335)])
    draw_orthogonal_arrow(d, [(1450, 600), (1480, 600), (1480, 825), (1510, 825)])

    # Keep top row clean by using one-way client -> gateway -> realtime flow.

    img.save(out / "architecture_diagram.png", optimize=True)


def main() -> None:
    out = Path("docs/diagrams")
    out.mkdir(parents=True, exist_ok=True)
    part1(out)
    part2(out)
    part3(out)
    architecture(out)
    print("Generated:")
    print(out / "process_flow_part1.png")
    print(out / "process_flow_part2.png")
    print(out / "process_flow_part3.png")
    print(out / "architecture_diagram.png")


if __name__ == "__main__":
    main()
