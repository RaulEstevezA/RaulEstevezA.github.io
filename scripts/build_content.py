#!/usr/bin/env python3
"""Prepare the site pages for publishing.

1. Pre-render portfolio data from data/*.json into the static HTML pages.
2. Version every local CSS/JS reference with a hash of the file's content
   (styles.css?v=1a2b3c4d5e), so browsers fetch a file again exactly when it
   changes. The repository keeps the references without ?v=.

The JSON files stay the single source of truth. Each page marks the blocks this
script owns with:

    <!-- generated:start NAME -->
    ...generated markup...
    <!-- generated:end NAME -->

In the repository these blocks stay empty. The deploy workflow
(.github/workflows/deploy-pages.yml) runs this script on every push and
publishes the filled pages, so the generated markup never gets committed.

The generated markup mirrors what js/*.js renders in English, so every page is
complete on first paint (and readable by crawlers and agents). The scripts keep
fetching the same JSON and re-render the blocks when the language changes; that
also keeps local previews working with the empty blocks.

Usage:
    python3 scripts/build_content.py          # fill blocks + add versions (used by the deploy)
    python3 scripts/build_content.py --clean  # back to the committed state, before committing
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import sys
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# Helpers that reproduce the escaping used by the browser scripts
# ---------------------------------------------------------------------------

def load_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def esc(value) -> str:
    """Same output as span.textContent = value; span.innerHTML."""
    text = "" if value is None else str(value)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace(" ", "&nbsp;")
    )


def esc_attr(value) -> str:
    return esc(value).replace('"', "&quot;")


def encode_uri(value: str) -> str:
    """JavaScript encodeURI()."""
    return quote(value, safe=";,/?:@&=+$-_.!~*'()#")


def encode_uri_component(value: str) -> str:
    """JavaScript encodeURIComponent()."""
    return quote(value, safe="-_.!~*'()")


def is_finite_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def by_display_order(items: list[dict]) -> list[dict]:
    """Order used by projects.js, demos.js and tools.js."""
    def key(pair):
        index, item = pair
        order = item.get("display_order")
        return order if is_finite_number(order) else 1000 + index

    return [item for _, item in sorted(enumerate(items), key=key)]


def visible(items: list[dict]) -> list[dict]:
    """Entries marked "hidden": true stay in the JSON but are not published."""
    return [item for item in items if not item.get("hidden")]


def render_tags(tech: str | None) -> str:
    return "".join(
        '<span class="tag">' + esc(tag.strip()) + "</span>"
        for tag in (tech or "").split(",")
    )


def new_tab(link_type: str) -> str:
    return "" if link_type in ("demo", "live_demo", "web") else ' target="_blank" rel="noopener"'


# ---------------------------------------------------------------------------
# projects.html  (js/projects.js)
# ---------------------------------------------------------------------------

FEATURED_LINK_TYPES = {
    "github": ("View on GitHub", "btn primary"),
    "demo": ("Watch demo", "btn btn-demo"),
    "live_demo": ("Open demo", "btn btn-web"),
    "web": ("View website", "btn btn-web"),
    "download": ("Download app", "btn btn-download"),
}

OTHER_LINK_LABELS = {
    "github": "GitHub",
    "demo": "Demo",
    "live_demo": "Demo",
    "web": "Web",
    "download": "Download",
    "repo1": "Repo 1",
    "repo2": "Repo 2",
}


def render_featured_project(project: dict) -> str:
    links = project.get("links") or []
    badge_class = (
        "project-badge project-badge-personal"
        if project.get("badge_variant") == "personal"
        else "project-badge"
    )
    # The download button is resolved per platform in the browser; the static
    # version links to the releases page with the generic label.
    buttons = "".join(
        '<a href="' + esc_attr(link["url"]) + '" class="'
        + FEATURED_LINK_TYPES.get(link["type"], FEATURED_LINK_TYPES["github"])[1] + '"'
        + new_tab(link["type"]) + ">"
        + esc(FEATURED_LINK_TYPES.get(link["type"], FEATURED_LINK_TYPES["github"])[0])
        + "</a>"
        for link in links
    )
    links_json = json.dumps(links, ensure_ascii=False, separators=(",", ":"))

    return (
        '<article class="project-card">'
        + '<div class="project-thumb-wrap"'
        + ' data-title="' + esc_attr(project["title_en"]) + '"'
        + ' data-title-es="' + esc_attr(project["title_es"]) + '"'
        + ' data-desc="' + esc_attr(project["modal_desc_en"]) + '"'
        + ' data-desc-es="' + esc_attr(project["modal_desc_es"]) + '"'
        + ' data-features="' + esc_attr("|".join(project["modal_features_en"])) + '"'
        + ' data-features-es="' + esc_attr("|".join(project["modal_features_es"])) + '"'
        + ' data-tech="' + esc_attr(project["modal_tech"]) + '"'
        + ' data-images="' + esc_attr("|".join(project["modal_images"])) + '"'
        + ' data-links="' + esc_attr(links_json) + '"'
        + (' data-portrait="true"' if project.get("portrait") else "") + ">"
        + '<img src="' + esc_attr(project["thumb"]) + '"'
        + ' alt="' + esc_attr(project["thumb_alt"]) + '"'
        + ' class="project-thumb"'
        + ' width="160" height="120" decoding="async"'
        + " onerror=\"this.parentElement.style.display='none'\">"
        + "</div>"
        + '<div class="project-card-body">'
        + ('<span class="' + badge_class + '">' + esc(project["badge_en"]) + "</span>" if project.get("badge_en") else "")
        + "<h3>" + esc(project["title_en"]) + "</h3>"
        + "<p>" + esc(project["card_desc_en"]) + "</p>"
        + "</div>"
        + '<div class="project-card-footer">'
        + '<p class="tech-tags">' + render_tags(project.get("card_tech")) + "</p>"
        + '<div class="project-card-buttons">' + buttons + "</div>"
        + "</div>"
        + "</article>"
    )


def render_other_project(project: dict) -> str:
    links = ", ".join(
        '<a href="' + esc_attr(link["url"]) + '" class="link-' + esc_attr(link["type"]) + '"'
        + new_tab(link["type"]) + ">"
        + esc(OTHER_LINK_LABELS.get(link["type"], link["type"])) + "</a>"
        for link in project.get("links") or []
    )
    return (
        "<li><strong>" + esc(project["name"]) + "</strong> &mdash; "
        + esc(project["desc_en"]) + " " + links + "</li>"
    )


def build_projects() -> dict:
    featured = by_display_order(load_json("data/bestProjects.json")["projects"])
    other = load_json("data/projects.json")["other"]
    return {
        "projects-featured": [render_featured_project(p) for p in featured],
        "projects-other-list": [render_other_project(p) for p in other],
        "projects-other-count": str(len(other)),
    }


# ---------------------------------------------------------------------------
# experience.html  (js/experience.js)
# ---------------------------------------------------------------------------

def render_job(job: dict, index: int) -> str:
    meta_parts = [esc(part) for part in (job.get("company"), job.get("period_en")) if part]
    meta = '<p class="job-meta">' + " &middot; ".join(meta_parts) + "</p>" if meta_parts else ""
    paragraphs = "".join("<p>" + esc(p) + "</p>" for p in job.get("paragraphs_en") or [])
    highlights = job.get("highlights_en") or []
    bullets = "<ul>" + "".join("<li>" + esc(h) + "</li>" for h in highlights) + "</ul>" if highlights else ""

    demo = ""
    if job.get("demo_url"):
        note = job.get("demo_note_en")
        demo = (
            '<div class="job-demo-callout">'
            + "<div><strong>Explore the interactive demo</strong>"
            + ("<p>" + esc(note) + "</p>" if note else "") + "</div>"
            + '<a class="btn btn-web" href="' + esc(job["demo_url"]) + '">Explore the interactive demo</a>'
            + "</div>"
        )

    letter = ""
    if job.get("rec_letter"):
        letter = (
            '<p class="job-letter"><button type="button" class="btn primary letter-btn" data-letter-index="'
            + str(index) + '">View recommendation letter</button></p>'
            + '<p class="job-meta">The original unredacted version is available upon request.</p>'
        )

    return (
        '<article class="job-card">'
        + "<h3>" + esc(job["title_en"]) + "</h3>"
        + meta + paragraphs + bullets
        + "<p><strong>Technologies:</strong> "
        + '<span class="tech-tags">' + render_tags(job.get("tech")) + "</span>"
        + "</p>"
        + demo + letter
        + "</article>"
    )


def build_experience() -> dict:
    jobs = load_json("data/experience.json")["jobs"]
    return {"experience-list": [render_job(job, i) for i, job in enumerate(jobs)]}


# ---------------------------------------------------------------------------
# courses.html  (js/certs.js)
# ---------------------------------------------------------------------------

def render_education(item: dict, index: int) -> str:
    documents = "".join(
        '<button type="button" class="btn education-document-btn" data-education-index="' + str(index)
        + '" data-document-index="' + str(doc_index) + '">' + esc(doc["label_en"]) + "</button>"
        for doc_index, doc in enumerate(item.get("documents") or [])
    )
    logos = "".join(
        '<img class="edu-logo" src="' + esc(src) + '" alt="" decoding="async">'
        for src in item.get("logos") or []
    )
    return (
        '<article class="edu-card">'
        + '<p class="edu-title">'
        + ('<span class="edu-logos">' + logos + "</span>" if logos else "")
        + "<strong>" + esc(item["title_en"]) + "</strong>"
        + "</p>"
        + "<p>" + esc(item["institution"]) + "</p>"
        + "<p>" + esc(item["period_en"]) + "</p>"
        + '<div class="edu-footer">'
        + "<p><em>" + esc(item["grade_en"]) + "</em></p>"
        + ('<div class="edu-documents">' + documents + "</div>" if documents else "")
        + "</div>"
        + "</article>"
    )


def cert_badges(certs: list[dict]) -> str:
    return "".join(
        '<a href="' + esc(cert["url"]) + '" class="cert-badge cert-badge--' + cert["label"].lower()
        + '" target="_blank" rel="noopener">' + esc(cert["label"]) + "</a>"
        for cert in certs
    )


def render_program(program: dict) -> str:
    return (
        '<div class="cert-card">'
        + '<div class="cert-card-meta">'
        + '<span class="cert-provider">' + esc(program["provider"]) + "</span>"
        + '<span class="cert-year">' + esc(program["year"]) + "</span>"
        + "</div>"
        + '<p class="cert-name">' + esc(program["name"]) + "</p>"
        + '<div class="cert-badges">' + cert_badges(program["certs"]) + "</div>"
        + "</div>"
    )


def render_course(course: dict) -> str:
    return (
        '<li class="cert-item">'
        + '<span class="cert-item-name">' + esc(course["name"]) + "</span>"
        + '<span class="cert-item-provider">' + esc(course["provider"]) + " &middot; " + esc(course["year"]) + "</span>"
        + '<span class="cert-badges">' + cert_badges(course["certs"]) + "</span>"
        + "</li>"
    )


def build_courses() -> dict:
    education = load_json("data/education.json")["education"]
    certificates = load_json("data/certificates.json")
    courses = certificates.get("courses") or []
    return {
        "education-list": [render_education(item, i) for i, item in enumerate(education)],
        "certs-programs": [render_program(p) for p in certificates.get("programs") or []],
        "certs-all-list": [render_course(c) for c in courses],
        "certs-all-count": str(len(courses)),
    }


# ---------------------------------------------------------------------------
# demos/, games/, tools/ and lab/  (js/demos.js, games.js, tools.js, lab.js)
# ---------------------------------------------------------------------------

def render_demo(demo: dict) -> str:
    image = (
        '<img class="demo-card-image" src="' + encode_uri(demo["image"]) + '" alt="" loading="lazy">'
        if demo.get("image") else ""
    )
    tags = "".join('<span class="tag">' + esc(t) + "</span>" for t in demo["technologies"])
    badge = demo.get("badge_en")
    code = (
        '<a class="btn" href="' + encode_uri(demo["repository_url"]) + '" target="_blank" rel="noopener">View code</a>'
        if demo.get("repository_url") else ""
    )
    return (
        '<article class="demo-card demo-card-row' + (" demo-card-featured" if demo.get("featured") else "") + '">'
        + image
        + '<div class="demo-card-content">'
        + ('<span class="project-badge">' + esc(badge) + "</span>" if badge else "")
        + "<h3>" + esc(demo["name"]) + "</h3>"
        + "<p>" + esc(demo.get("description_en")) + "</p>"
        + '<div class="tech-tags">' + tags + "</div>"
        + '<div class="demo-card-actions">'
        + '<a class="btn btn-web" href="' + encode_uri(demo["demo_url"]) + '">Open demo</a>'
        + code
        + "</div>"
        + "</div>"
        + "</article>"
    )


def render_game(game: dict) -> str:
    logo_class = " pixel-art-logo" if game.get("pixel_art_logo") else ""
    logo = (
        '<img class="demo-card-image' + logo_class + '" src="' + encode_uri(game["logo"]) + '" alt="'
        + esc(game["name"]) + ' logo" loading="lazy">'
        if game.get("logo") else ""
    )
    tags = "".join('<span class="tag">' + esc(t) + "</span>" for t in game.get("technologies") or [])
    return (
        '<article class="demo-card">'
        + logo
        + "<h3>" + esc(game["name"]) + "</h3>"
        + "<p>" + esc(game.get("description_en") or "") + "</p>"
        + '<div class="tech-tags">' + tags + "</div>"
        + '<div class="demo-card-actions tool-card-actions">'
        + '<a class="btn btn-web" href="' + encode_uri(game["game_url"]) + '">Play</a>'
        + "</div>"
        + "</article>"
    )


TOOL_ICONS = {
    "download": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
    "code": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/></svg>',
}


def render_tool(tool: dict) -> str:
    image = (
        '<img class="demo-card-image" src="' + encode_uri(tool["image"]) + '" alt="" loading="lazy">'
        if tool.get("image") else ""
    )
    badge = tool.get("badge_en")
    download = tool.get("download") or {}
    # Resolved per platform in the browser; the static version links to releases.
    download_link = (
        '<a class="btn btn-download" href="' + encode_uri(download["releases_url"])
        + '" target="_blank" rel="noopener">' + TOOL_ICONS["download"] + "Download</a>"
        if download.get("releases_url") else ""
    )
    code = (
        '<a class="btn btn-code" href="' + encode_uri(tool["repository_url"]) + '" target="_blank" rel="noopener">'
        + TOOL_ICONS["code"] + "View code</a>"
        if tool.get("repository_url") else ""
    )
    return (
        '<article class="demo-card' + (" demo-card-featured" if tool.get("featured") else "") + '">'
        + image
        + ('<span class="project-badge">' + esc(badge) + "</span>" if badge else "")
        + "<h3>" + esc(tool["name"]) + "</h3>"
        + "<p>" + esc(tool.get("description_en") or "") + "</p>"
        + '<div class="demo-card-actions tool-card-actions">'
        + '<a class="btn btn-web" href="' + encode_uri(tool["tool_url"]) + '">Open tool</a>'
        + download_link + code
        + "</div>"
        + "</article>"
    )


def format_count(locale: dict, key: str, count: int) -> str:
    template = locale[key + ("_one" if count == 1 else "_other")]
    return template.replace("{count}", str(count))


def build_demos() -> dict:
    demos = by_display_order(load_json("data/demos.json")["demos"])
    return {"demos-list": [render_demo(d) for d in demos]}


def build_games() -> dict:
    games = load_json("data/games.json").get("games") or []
    # games.js sorts with (display_order || 1000)
    games = sorted(games, key=lambda g: g.get("display_order") or 1000)
    return {"games-list": [render_game(g) for g in games]}


def build_tools() -> dict:
    tools = by_display_order(visible(load_json("data/tools.json").get("tools") or []))
    return {"tools-list": [render_tool(t) for t in tools]}


def build_lab() -> dict:
    locale = load_json("locales/en/lab.json")
    demos = load_json("data/demos.json").get("demos") or []
    games = load_json("data/games.json").get("games") or []
    return {
        "lab-demos-count": format_count(locale, "demos_kicker", len(demos)),
        "lab-games-count": format_count(locale, "games_kicker", len(games)),
    }


PAGES = {
    "projects.html": build_projects,
    "experience.html": build_experience,
    "courses.html": build_courses,
    "demos/index.html": build_demos,
    "games/index.html": build_games,
    "tools/index.html": build_tools,
    "lab/index.html": build_lab,
}


# ---------------------------------------------------------------------------
# Writing the blocks into the pages
# ---------------------------------------------------------------------------

def fill_block(html: str, name: str, content: list[str] | str, page: str) -> str:
    """Replace the body of one generated block; an empty list empties a block."""
    pattern = re.compile(
        r"(?P<indent>[ \t]*)(?P<start><!-- generated:start " + re.escape(name) + r" -->)"
        r"(?P<body>.*?)"
        r"(?P<end><!-- generated:end " + re.escape(name) + r" -->)",
        re.DOTALL,
    )
    matches = list(pattern.finditer(html))
    if len(matches) != 1:
        raise SystemExit(f"{page}: expected one '{name}' generated block, found {len(matches)}")

    match = matches[0]
    indent = match.group("indent")
    if isinstance(content, str):
        body = esc(content)
    else:
        body = "".join("\n" + indent + item for item in content) + "\n" + indent

    return (
        html[: match.start("body")] + body + html[match.end("body"):]
    )


# ---------------------------------------------------------------------------
# Cache busting: ?v=<content hash> on local stylesheets and scripts
# ---------------------------------------------------------------------------

# Site pages owned by this repository (not the apps under demos/, games/, tools/).
SITE_PAGES = [
    "index.html",
    "experience.html",
    "projects.html",
    "courses.html",
    "contact/index.html",
    "lab/index.html",
    "demos/index.html",
    "games/index.html",
    "tools/index.html",
]

# href="..." / src="..." pointing to a local .css or .js file, with or without ?v=.
ASSET_REF = re.compile(r'\b(?P<attr>href|src)="(?P<path>[^":?#]+\.(?:css|js))(?:\?v=[^"]*)?"')


def content_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def version_assets(html: str, page: str, clean: bool) -> str:
    page_dir = (ROOT / page).parent

    def replace(match: re.Match) -> str:
        ref = match.group("path")
        if clean:
            return f'{match.group("attr")}="{ref}"'
        asset = (page_dir / ref).resolve()
        if not asset.is_file():
            raise SystemExit(f"{page}: referenced file does not exist: {ref}")
        return f'{match.group("attr")}="{ref}?v={content_hash(asset)}"'

    return ASSET_REF.sub(replace, html)


def main() -> int:
    clean = "--clean" in sys.argv[1:]
    changed: list[str] = []

    for page in SITE_PAGES:
        path = ROOT / page
        original = path.read_text(encoding="utf-8")
        updated = original

        build = PAGES.get(page)
        if build:
            for name, content in build().items():
                if clean:
                    content = "" if isinstance(content, str) else []
                updated = fill_block(updated, name, content, page)

        updated = version_assets(updated, page, clean)

        if updated != original:
            changed.append(page)
            path.write_text(updated, encoding="utf-8")

    action = "Restored" if clean else "Prepared"
    print(f"{action}: " + ", ".join(changed) if changed else "Nothing to change.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
