"""
AEGIS Demo Video Recorder
Automatically visits every page with smooth scrolling and produces
a high-quality 1920x1080 WebM video ready for upload as a demo link.
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
OUT_DIR = Path("docs/demo_video")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("/",            "Dashboard",          6),
    ("/scan",        "Scan & Upload",       7),
    ("/assets",      "Asset Library",       5),
    ("/matches",     "Detected Matches",    5),
    ("/identity",    "Offender Identity Graph", 7),
    ("/geo",         "Geographic Heatmap",  6),
    ("/risk",        "Risk Intelligence",   5),
    ("/prediction",  "Leak Prediction",     5),
    ("/licensing",   "Revenue Recovery",    6),
    ("/enforcement", "Enforcement",         5),
    ("/evidence",    "Evidence Chain",      5),
    ("/compliance",  "Compliance Audit",    5),
    ("/reports",     "Reports",             5),
    ("/watermark",   "Watermark Studio",    5),
    ("/realtime",    "Realtime Monitor",    6),
]

INTRO_SCRIPT = [
    "🛡️ AEGIS — Digital Asset Protection Platform",
    "Powered by Google Gemini 2.0 · Built for Google Solution Challenge 2025",
    "Automated Demo — All features live",
]


def smooth_scroll(page, direction: str = "down", steps: int = 4, delay: float = 0.3) -> None:
    for _ in range(steps):
        page.mouse.wheel(0, 400 if direction == "down" else -400)
        time.sleep(delay)


def wait_network_idle(page, timeout: int = 5000) -> None:
    try:
        page.wait_for_load_state("networkidle", timeout=timeout)
    except Exception:
        pass


def run_demo() -> Path:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=False,
            args=[
                "--start-maximized",
                "--disable-infobars",
                "--no-default-browser-check",
            ],
        )

        ctx = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(OUT_DIR),
            record_video_size={"width": 1920, "height": 1080},
        )
        page = ctx.new_page()

        # Opening splash — visit dashboard and pause
        print("▶ Opening AEGIS dashboard …")
        page.goto(BASE, wait_until="domcontentloaded")
        wait_network_idle(page)
        time.sleep(3)

        # Tour every page
        for route, label, hold in PAGES:
            print(f"  → {label} ({route})")
            page.goto(f"{BASE}{route}", wait_until="domcontentloaded")
            wait_network_idle(page)
            time.sleep(1.5)                   # let animations settle
            smooth_scroll(page, "down", steps=3, delay=0.4)
            time.sleep(hold * 0.6)            # hold so viewer can read
            smooth_scroll(page, "up", steps=2, delay=0.3)
            time.sleep(0.8)

        # Return to dashboard for closing shot
        print("  → Closing shot: Dashboard")
        page.goto(BASE, wait_until="domcontentloaded")
        wait_network_idle(page)
        time.sleep(4)

        ctx.close()
        browser.close()

    # Playwright saves the file with a generated UUID name — rename it
    videos = sorted(OUT_DIR.glob("*.webm"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not videos:
        print("ERROR: no video file found in", OUT_DIR)
        sys.exit(1)

    raw = videos[0]
    final = OUT_DIR / "aegis_demo.webm"
    raw.rename(final)
    print(f"\n✅ Raw video saved: {final}")
    return final


def convert_to_mp4(src: Path) -> Path | None:
    """Try to convert WebM → MP4 using ffmpeg if available."""
    mp4 = src.with_suffix(".mp4")
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-c:v", "libx264", "-crf", "18",
         "-preset", "fast", "-c:a", "aac", str(mp4)],
        capture_output=True,
    )
    if result.returncode == 0:
        print(f"✅ MP4 saved:       {mp4}")
        return mp4
    else:
        print("ℹ  FFmpeg not found or failed — upload the .webm directly to YouTube/Drive.")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("  AEGIS Demo Recorder")
    print("  Make sure backend (8000) and frontend (5173) are running!")
    print("=" * 60)
    video = run_demo()
    convert_to_mp4(video)
    print("\nDone! Upload docs/demo_video/aegis_demo.webm (or .mp4) as your demo link.")
