"""Generate sitemap.xml on deploy.

URLs come from the site pages and the data files (visible tools, demos and
their optional "sitemap_pages", games), plus the generated llms.txt and
profile.json.

Each <lastmod> is the date of the last commit that changed the page or the
data it is built from, so it is always accurate. That needs the full git
history: the deploy workflow checks out with fetch-depth: 0.

Used by build_content.py; see write_sitemap().
"""

from __future__ import annotations

import json
import subprocess
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://raulesteveza.github.io"
OUTPUT = "sitemap.xml"

# Site pages and the files their content comes from.
PAGES = {
    "/": ["index.html", "locales/en/home.json", "data/person.json"],
    "/experience.html": ["experience.html", "locales/en/experience.json", "data/experience.json"],
    "/projects.html": ["projects.html", "locales/en/projects.json", "data/bestProjects.json", "data/projects.json"],
    "/courses.html": ["courses.html", "locales/en/courses.json", "data/education.json", "data/certificates.json"],
    "/lab/": ["lab/index.html", "locales/en/lab.json", "data/demos.json", "data/games.json"],
    "/tools/": ["tools/index.html", "locales/en/tools.json", "data/tools.json"],
    "/demos/": ["demos/index.html", "locales/en/demos.json", "data/demos.json"],
    "/games/": ["games/index.html", "locales/en/games.json", "data/games.json"],
    "/contact/": ["contact/index.html", "locales/en/contact.json", "data/person.json"],
}


def load(relative_path: str):
    """Read a JSON file given its path relative to the repository root."""
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def last_changed(paths: list[str]) -> str:
    """Date of the last commit touching any of these paths (today if none)."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", *paths],
            cwd=ROOT, capture_output=True, text=True, check=True,
        )
        return result.stdout.strip() or date.today().isoformat()
    except (OSError, subprocess.CalledProcessError):
        return date.today().isoformat()


def local_dir(url_path: str) -> str:
    """'/tools/Mapper/' -> 'tools/Mapper' (the deployed folder in the repository)."""
    folder = url_path.strip("/")
    if not (ROOT / folder / "index.html").is_file():
        raise SystemExit(f"sitemap: {url_path} has no index.html in the repository")
    return folder


def entries() -> list[tuple[str, str]]:
    """List every public URL of the site with its last modification date.

    Returns (path, date) pairs: the pages in PAGES, then each visible tool, each
    demo (and its sitemap_pages) and each game, then llms.txt and profile.json.
    The list can contain duplicates; build_sitemap() skips them.

    Raises SystemExit (through local_dir) if a listed URL is not deployed.
    """
    result = [(path, last_changed(files)) for path, files in PAGES.items()]

    tools = [t for t in load("data/tools.json")["tools"] if not t.get("hidden")]
    demos = load("data/demos.json")["demos"]
    games = load("data/games.json")["games"]

    for url in [t["tool_url"] for t in tools]:
        result.append((url, last_changed([local_dir(url)])))
    for demo in demos:
        for url in [demo["demo_url"], *(demo.get("sitemap_pages") or [])]:
            result.append((url, last_changed([local_dir(url)])))
    for url in [g["game_url"] for g in games]:
        result.append((url, last_changed([local_dir(url)])))

    # Generated from all the data files.
    data_date = last_changed(["data"])
    result += [("/llms.txt", data_date), ("/profile.json", data_date)]
    return result


def build_sitemap() -> str:
    """Render the sitemap.xml document.

    Keeps the first occurrence of each path, in the order given by entries().
    """
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    seen = set()
    for path, lastmod in entries():
        if path in seen:
            continue
        seen.add(path)
        lines += ["  <url>", f"    <loc>{escape(BASE_URL + path)}</loc>", f"    <lastmod>{lastmod}</lastmod>", "  </url>"]
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def write_sitemap(clean: bool) -> list[str]:
    """Write sitemap.xml, or remove it when clean is true.

    The file is only rewritten when its content changes.

    Args:
        clean: True restores the committed state (no sitemap.xml in the repository).

    Returns:
        The names of the files that were written or removed.
    """
    path = ROOT / OUTPUT
    if clean:
        if path.exists():
            path.unlink()
            return [OUTPUT]
        return []
    text = build_sitemap()
    if not path.exists() or path.read_text(encoding="utf-8") != text:
        path.write_text(text, encoding="utf-8")
        return [OUTPUT]
    return []
