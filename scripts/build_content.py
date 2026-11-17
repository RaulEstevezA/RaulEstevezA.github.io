#!/usr/bin/env python3
"""Prepare the site pages for publishing.

1. Fill the shared part of every page's <head> (canonical, Open Graph, Twitter,
   icons...) from scripts/templates/head.html.
2. Generate each page's schema.org JSON-LD from the data (see jsonld.py).
3. Pre-render portfolio data from data/*.json into the static HTML pages.
4. Generate profile.json and llms.txt for agents (see agent_files.py).
5. Generate sitemap.xml with accurate lastmod dates (see sitemap.py).
6. Version every local CSS/JS reference with a hash of the file's content
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

Every page is complete on first paint (and readable by crawlers and agents).
Some blocks are rendered only here, in both languages (the shared layout and
courses.html: see bilingual()); js/i18n.js translates them. The other content
blocks mirror what js/*.js renders in English, and those scripts re-render them
when the language changes, so a change to one of those cards goes in both places.

Usage:
    python3 scripts/build_content.py          # fill blocks + add versions (used by the deploy)
    python3 scripts/build_content.py --clean  # back to the committed state, before committing
    python3 scripts/preview.py                # local preview: build, serve, clean on exit
"""

from __future__ import annotations

import hashlib
import html as html_lib
import json
import math
import re
import sys
from pathlib import Path
from string import Template
from urllib.parse import quote

from agent_files import write_agent_files
from jsonld import build_jsonld
from sitemap import write_sitemap


ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://raulesteveza.github.io"


# ---------------------------------------------------------------------------
# Helpers that reproduce the escaping used by the browser scripts
# ---------------------------------------------------------------------------

def load_json(relative_path: str):
    """Read a JSON file given its path relative to the repository root."""
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
    """Escape a value for use inside a double-quoted HTML attribute."""
    return esc(value).replace('"', "&quot;")


def encode_uri(value: str) -> str:
    """JavaScript encodeURI()."""
    return quote(value, safe=";,/?:@&=+$-_.!~*'()#")


def encode_uri_component(value: str) -> str:
    """JavaScript encodeURIComponent()."""
    return quote(value, safe="-_.!~*'()")


def is_finite_number(value) -> bool:
    """True for int or float values that are finite; booleans are excluded (JavaScript's Number.isFinite)."""
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def by_display_order(items: list[dict]) -> list[dict]:
    """Order of the cards: display_order first, then the rest in file order."""
    def key(pair):
        """Sort key: display_order when it is a finite number, otherwise after all ordered items, in file order."""
        index, item = pair
        order = item.get("display_order")
        return order if is_finite_number(order) else 1000 + index

    return [item for _, item in sorted(enumerate(items), key=key)]


def visible(items: list[dict]) -> list[dict]:
    """Entries marked "hidden": true stay in the JSON but are not published."""
    return [item for item in items if not item.get("hidden")]


def render_tags(tech: str | None) -> str:
    """Render a comma-separated technology list as <span class="tag"> elements."""
    return "".join(
        '<span class="tag">' + esc(tag.strip()) + "</span>"
        for tag in (tech or "").split(",")
    )


def render_tag_list(technologies: list[str] | None) -> str:
    """Render a list of technologies as <span class="tag"> elements."""
    return "".join('<span class="tag">' + esc(t) + "</span>" for t in technologies or [])


def new_tab(link_type: str) -> str:
    """Target attributes for a link: site pages open in the same tab, external links in a new one."""
    return "" if link_type in ("demo", "live_demo", "web") else ' target="_blank" rel="noopener"'


# ---------------------------------------------------------------------------
# Translations inside the generated markup
# ---------------------------------------------------------------------------
#
# The cards are rendered only here, never in the browser. They are written in
# English and carry what js/i18n.js needs to show them in Spanish:
#
# - Texts from the data (titles, descriptions...): data-en / data-es with both
#   versions (tr, bilingual, bilingual_list).
# - Interface texts (button labels...): data-i18n="<page>.<key>", the same
#   mechanism as the rest of the page, with the English text taken from
#   locales/en/<page>.json (label).

LANGS = ("en", "es")
_locales: dict[tuple[str, str], dict] = {}


def locale(lang: str, page: str) -> dict:
    """Parsed locales/<lang>/<page>.json, read once."""
    if (lang, page) not in _locales:
        _locales[lang, page] = load_json(f"locales/{lang}/{page}.json")
    return _locales[lang, page]


def tr(tag: str, texts: dict[str, str], attrs: str = "") -> str:
    """Element showing the English text that also carries every translation.

    Args:
        tag: Element name ('strong', 'p'...).
        texts: Text per language code; all of LANGS are required.
        attrs: Extra attributes, written right after the tag name (' class="x"').
    """
    data = "".join(f' data-{lang}="{esc_attr(texts[lang])}"' for lang in LANGS)
    return f"<{tag}{attrs}{data}>{esc(texts['en'])}</{tag}>"


def bilingual(tag: str, item: dict, field: str, attrs: str = "") -> str:
    """tr() for a translated data field: item[field + '_en'] and item[field + '_es'].

    A missing Spanish text falls back to English.
    """
    en = item.get(field + "_en") or ""
    return tr(tag, {"en": en, "es": item.get(field + "_es") or en}, attrs)


def bilingual_list(tag: str, item: dict, field: str) -> str:
    """One tr() element per entry of a translated list (paragraphs, highlights).

    Raises:
        SystemExit: If the English and Spanish lists have different lengths,
            since each entry is shown in place of its translation.
    """
    en = item.get(field + "_en") or []
    es = item.get(field + "_es") or en
    if len(en) != len(es):
        raise SystemExit(f"{field}_en and {field}_es must have the same number of entries ({len(en)} vs {len(es)})")
    return "".join(tr(tag, {"en": a, "es": b}) for a, b in zip(en, es))


def label(tag: str, page: str, key: str, attrs: str = "") -> str:
    """Interface text from the locale files, translated by js/i18n.js through data-i18n."""
    return f'<{tag}{attrs} data-i18n="{page}.{key}">{esc(locale("en", page)[key])}</{tag}>'


def download_link(page: str, key: str, releases_url: str, assets, attrs: str, icon: str = "") -> str:
    """Download button resolved per visitor by js/downloads.js.

    The static link goes to the releases page with the generic label
    (<page>.<key>). downloads.js reads data-releases-url and data-assets and,
    when there is an installer for the visitor's system, links to it and uses
    the <page>.<key>_for label ('Download for {platform}'), in every language.
    """
    texts = {lang: locale(lang, page)[key] for lang in LANGS}
    templates = "".join(
        f' data-{lang}-for="{esc_attr(locale(lang, page)[key + "_for"])}"' for lang in LANGS
    )
    data = ' data-releases-url="' + esc_attr(releases_url) + '"'
    if assets:
        data += ' data-assets="' + esc_attr(json.dumps(assets, ensure_ascii=False, separators=(",", ":"))) + '"'
    return (
        "<a" + attrs + data + ' target="_blank" rel="noopener">'
        + icon + tr("span", texts, " data-download-label" + templates)
        + "</a>"
    )


# ---------------------------------------------------------------------------
# projects.html
# ---------------------------------------------------------------------------

# Style of each featured-project link type; the label is projects.link_<type>.
FEATURED_LINK_CLASSES = {
    "github": "btn primary",
    "demo": "btn btn-demo",
    "live_demo": "btn btn-web",
    "web": "btn btn-web",
    "download": "btn btn-download",
}

# Link texts of the "other projects" list (same in both languages).
OTHER_LINK_LABELS = {
    "github": "GitHub",
    "demo": "Demo",
    "live_demo": "Demo",
    "web": "Web",
    "download": "Download",
    "repo1": "Repo 1",
    "repo2": "Repo 2",
}


def render_featured_link(link: dict) -> str:
    """One button of a featured project. Unknown types look like github."""
    link_type = link["type"] if link["type"] in FEATURED_LINK_CLASSES else "github"
    cls = ' class="' + FEATURED_LINK_CLASSES[link_type] + '"'
    if link_type == "download":
        return download_link("projects", "link_download", link["url"], link.get("assets"), ' href="' + esc_attr(link["url"]) + '"' + cls)
    return (
        '<a href="' + esc_attr(link["url"]) + '"' + cls + new_tab(link["type"]) + ">"
        + label("span", "projects", "link_" + link_type) + "</a>"
    )


def render_featured_project(project: dict) -> str:
    """Render one featured project card (projects.html).

    The thumbnail wrapper carries the modal content in data-* attributes, in
    both languages, so lightbox.js can open the project detail; the modal
    copies the card's own buttons.
    """
    badge_class = (
        "project-badge project-badge-personal"
        if project.get("badge_variant") == "personal"
        else "project-badge"
    )
    buttons = "".join(render_featured_link(link) for link in project.get("links") or [])

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
        + (' data-portrait="true"' if project.get("portrait") else "") + ">"
        + '<img src="' + esc_attr(project["thumb"]) + '"'
        + ' alt="' + esc_attr(project["thumb_alt"]) + '"'
        + ' class="project-thumb"'
        + ' width="160" height="120" decoding="async"'
        + " onerror=\"this.parentElement.style.display='none'\">"
        + "</div>"
        + '<div class="project-card-body">'
        + (bilingual("span", project, "badge", ' class="' + badge_class + '"') if project.get("badge_en") else "")
        + bilingual("h3", project, "title")
        + bilingual("p", project, "card_desc")
        + "</div>"
        + '<div class="project-card-footer">'
        + '<p class="tech-tags">' + render_tags(project.get("card_tech")) + "</p>"
        + '<div class="project-card-buttons">' + buttons + "</div>"
        + "</div>"
        + "</article>"
    )


def render_other_project(project: dict) -> str:
    """Render one entry of the "other projects" list, with its links separated by commas."""
    links = ", ".join(
        '<a href="' + esc_attr(link["url"]) + '" class="link-' + esc_attr(link["type"]) + '"'
        + new_tab(link["type"]) + ">"
        + esc(OTHER_LINK_LABELS.get(link["type"], link["type"])) + "</a>"
        for link in project.get("links") or []
    )
    return (
        "<li><strong>" + esc(project["name"]) + "</strong> &mdash; "
        + bilingual("span", project, "desc") + " " + links + "</li>"
    )


def build_projects() -> dict:
    """Generated blocks of projects.html: featured cards, other projects list and its count."""
    featured = by_display_order(load_json("data/bestProjects.json")["projects"])
    other = load_json("data/projects.json")["other"]
    return {
        "projects-featured": [render_featured_project(p) for p in featured],
        "projects-other-list": [render_other_project(p) for p in other],
        "projects-other-count": str(len(other)),
    }


# ---------------------------------------------------------------------------
# experience.html  (js/experience.js only opens the recommendation letters)
# ---------------------------------------------------------------------------

def render_job(job: dict) -> str:
    """Render one job card (experience.html).

    The recommendation letter button carries the PDF URL (data-url) that
    experience.js opens in its dialog.
    """
    meta_parts = []
    if job.get("company"):
        meta_parts.append(esc(job["company"]))
    if job.get("period_en"):
        meta_parts.append(bilingual("span", job, "period"))
    meta = '<p class="job-meta">' + " &middot; ".join(meta_parts) + "</p>" if meta_parts else ""
    highlights = bilingual_list("li", job, "highlights")

    demo = ""
    if job.get("demo_url"):
        demo = (
            '<div class="job-demo-callout">'
            + "<div>" + label("strong", "experience", "live_demo")
            + (bilingual("p", job, "demo_note") if job.get("demo_note_en") else "") + "</div>"
            + label("a", "experience", "live_demo", ' class="btn btn-web" href="' + esc_attr(job["demo_url"]) + '"')
            + "</div>"
        )

    letter = ""
    if job.get("rec_letter"):
        letter = (
            '<p class="job-letter">'
            + label("button", "experience", "rec_letter",
                    ' type="button" class="btn primary letter-btn" data-url="' + esc_attr(job["rec_letter"]) + '"')
            + "</p>"
            + label("p", "experience", "rec_letter_note", ' class="job-meta"')
        )

    return (
        '<article class="job-card">'
        + bilingual("h3", job, "title")
        + meta
        + bilingual_list("p", job, "paragraphs")
        + ("<ul>" + highlights + "</ul>" if highlights else "")
        + "<p>" + label("strong", "experience", "tech_label") + " "
        + '<span class="tech-tags">' + render_tags(job.get("tech")) + "</span>"
        + "</p>"
        + demo + letter
        + "</article>"
    )


def build_experience() -> dict:
    """Generated blocks of experience.html: the list of job cards."""
    jobs = load_json("data/experience.json")["jobs"]
    return {"experience-list": [render_job(job) for job in jobs]}


# ---------------------------------------------------------------------------
# courses.html  (js/certs.js only opens the education documents)
# ---------------------------------------------------------------------------

def render_education(item: dict) -> str:
    """Render one education card (courses.html).

    Each document button carries its PDF URL (data-url) and its label in both
    languages, which is all certs.js needs to open it in the dialog.
    """
    documents = "".join(
        bilingual(
            "button", doc, "label",
            ' type="button" class="btn education-document-btn" data-url="' + esc_attr(doc["url"]) + '"',
        )
        for doc in item.get("documents") or []
    )
    # The institution name follows the logos, so the icons are decorative.
    logos = "".join(
        '<img class="edu-logo" src="' + esc_attr(src) + '" alt="" decoding="async">'
        for src in item.get("logos") or []
    )
    return (
        '<article class="edu-card">'
        + '<p class="edu-title">' + bilingual("strong", item, "title") + "</p>"
        + '<p class="edu-institution">'
        + ('<span class="edu-logos">' + logos + "</span>" if logos else "")
        + "<span>" + esc(item["institution"]) + "</span>"
        + "</p>"
        + bilingual("p", item, "period")
        + '<div class="edu-footer">'
        + "<p>" + bilingual("em", item, "grade") + "</p>"
        + ('<div class="edu-documents">' + documents + "</div>" if documents else "")
        + "</div>"
        + "</article>"
    )


def cert_badges(certs: list[dict]) -> str:
    """Render the certificate links of a program or course as badges (one per label: PDF, Credly...)."""
    return "".join(
        '<a href="' + esc(cert["url"]) + '" class="cert-badge cert-badge--' + cert["label"].lower()
        + '" target="_blank" rel="noopener">' + esc(cert["label"]) + "</a>"
        for cert in certs
    )


def render_program(program: dict) -> str:
    """Render one professional certificate program card (shown in English in both languages)."""
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
    """Render one individual course in the collapsible course list."""
    return (
        '<li class="cert-item">'
        + '<span class="cert-item-name">' + esc(course["name"]) + "</span>"
        + '<span class="cert-item-provider">' + esc(course["provider"]) + " &middot; " + esc(course["year"]) + "</span>"
        + '<span class="cert-badges">' + cert_badges(course["certs"]) + "</span>"
        + "</li>"
    )


def build_courses() -> dict:
    """Generated blocks of courses.html: education, certificate programs, course list and its count."""
    education = load_json("data/education.json")["education"]
    certificates = load_json("data/certificates.json")
    courses = certificates.get("courses") or []
    return {
        "education-list": [render_education(item) for item in education],
        "certs-programs": [render_program(p) for p in certificates.get("programs") or []],
        "certs-all-list": [render_course(c) for c in courses],
        "certs-all-count": str(len(courses)),
    }


# ---------------------------------------------------------------------------
# demos/, games/, tools/ and lab/
# ---------------------------------------------------------------------------

def render_demo(demo: dict) -> str:
    """Render one demo card (demos/). Badge and description fall back to English."""
    image = (
        '<img class="demo-card-image" src="' + encode_uri(demo["image"]) + '" alt="" loading="lazy">'
        if demo.get("image") else ""
    )
    code = (
        label("a", "demos", "view_code", ' class="btn" href="' + encode_uri(demo["repository_url"]) + '" target="_blank" rel="noopener"')
        if demo.get("repository_url") else ""
    )
    return (
        '<article class="demo-card demo-card-row' + (" demo-card-featured" if demo.get("featured") else "") + '">'
        + image
        + '<div class="demo-card-content">'
        + (bilingual("span", demo, "badge", ' class="project-badge"') if demo.get("badge_en") else "")
        + "<h3>" + esc(demo["name"]) + "</h3>"
        + bilingual("p", demo, "description")
        + '<div class="tech-tags">' + render_tag_list(demo["technologies"]) + "</div>"
        + '<div class="demo-card-actions">'
        + label("a", "demos", "open_demo", ' class="btn btn-web" href="' + encode_uri(demo["demo_url"]) + '"')
        + code
        + "</div>"
        + "</div>"
        + "</article>"
    )


def render_game(game: dict) -> str:
    """Render one game card (games/).

    Logos marked pixel_art_logo get a class that keeps them sharp when scaled.
    """
    logo_class = " pixel-art-logo" if game.get("pixel_art_logo") else ""
    logo = (
        '<img class="demo-card-image' + logo_class + '" src="' + encode_uri(game["logo"]) + '" alt="'
        + esc(game["name"]) + ' logo" loading="lazy">'
        if game.get("logo") else ""
    )
    return (
        '<article class="demo-card">'
        + logo
        + "<h3>" + esc(game["name"]) + "</h3>"
        + bilingual("p", game, "description")
        + '<div class="tech-tags">' + render_tag_list(game.get("technologies")) + "</div>"
        + '<div class="demo-card-actions tool-card-actions">'
        + label("a", "games", "play", ' class="btn btn-web" href="' + encode_uri(game["game_url"]) + '"')
        + "</div>"
        + "</article>"
    )


TOOL_ICONS = {
    "download": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
    "code": '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/></svg>',
}


def render_tool(tool: dict) -> str:
    """Render one tool card (tools/). Badge and description fall back to English."""
    image = (
        '<img class="demo-card-image" src="' + encode_uri(tool["image"]) + '" alt="" loading="lazy">'
        if tool.get("image") else ""
    )
    download = tool.get("download") or {}
    download_button = (
        download_link("tools", "download", download["releases_url"], download.get("assets"),
                      ' class="btn btn-download" href="' + encode_uri(download["releases_url"]) + '"',
                      TOOL_ICONS["download"])
        if download.get("releases_url") else ""
    )
    code = (
        '<a class="btn btn-code" href="' + encode_uri(tool["repository_url"]) + '" target="_blank" rel="noopener">'
        + TOOL_ICONS["code"] + label("span", "tools", "view_code") + "</a>"
        if tool.get("repository_url") else ""
    )
    return (
        '<article class="demo-card' + (" demo-card-featured" if tool.get("featured") else "") + '">'
        + image
        + (bilingual("span", tool, "badge", ' class="project-badge"') if tool.get("badge_en") else "")
        + "<h3>" + esc(tool["name"]) + "</h3>"
        + bilingual("p", tool, "description")
        + '<div class="demo-card-actions tool-card-actions">'
        + label("a", "tools", "open_tool", ' class="btn btn-web" href="' + encode_uri(tool["tool_url"]) + '"')
        + download_button + code
        + "</div>"
        + "</article>"
    )


def empty_state(page: str, items: list) -> list[str]:
    """The "nothing available" message of a list page, only when the list is empty."""
    return [] if items else [label("p", page, "empty", ' class="empty-state"')]


def format_count(locale_data: dict, key: str, count: int) -> str:
    """Format a count with the singular or plural template of a locale.

    Args:
        locale_data: The parsed locale file.
        key: Base key; the template is read from key + '_one' or key + '_other'.
        count: The number that replaces {count}.
    """
    template = locale_data[key + ("_one" if count == 1 else "_other")]
    return template.replace("{count}", str(count))


def build_demos() -> dict:
    """Generated blocks of demos/: the demo cards in display order."""
    demos = by_display_order(load_json("data/demos.json")["demos"])
    return {"demos-list": [render_demo(d) for d in demos]}


def build_games() -> dict:
    """Generated blocks of games/: the game cards in display order, or the empty message."""
    games = by_display_order(load_json("data/games.json").get("games") or [])
    return {"games-list": [render_game(g) for g in games], "games-empty": empty_state("games", games)}


def build_tools() -> dict:
    """Generated blocks of tools/: the visible tool cards in display order, or the empty message."""
    tools = by_display_order(visible(load_json("data/tools.json").get("tools") or []))
    return {"tools-list": [render_tool(t) for t in tools], "tools-empty": empty_state("tools", tools)}


def build_lab() -> dict:
    """Generated blocks of lab/: the demo and game counts shown on its two cards, in both languages."""
    demos = load_json("data/demos.json").get("demos") or []
    games = load_json("data/games.json").get("games") or []

    def kicker(name: str, count: int) -> list[str]:
        texts = {lang: format_count(locale(lang, "lab"), name + "_kicker", count) for lang in LANGS}
        return [tr("span", texts, f' id="lab-{name}-count" class="lab-card-kicker"')]

    return {"lab-demos-count": kicker("demos", len(demos)), "lab-games-count": kicker("games", len(games))}


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
# Shared <head>: scripts/templates/head.html
# ---------------------------------------------------------------------------
#
# Each page keeps in its own <head> only what is specific to it: <title>,
# <meta name="description"> and the stylesheet (so local previews are
# styled). The template provides everything else; the JSON-LD comes from
# jsonld.py.
#
# A page can override a template tag by declaring it itself, e.g.
# <meta property="og:type" content="profile" /> or a custom og:image; the
# template then skips that tag and uses the page's value where it is reused
# (a custom og:image also becomes the twitter:image, as a large card).

HEAD_TEMPLATE = ROOT / "scripts" / "templates" / "head.html"

# No <link rel="preload"> for the data JSON: the content is already in the
# HTML, the page scripts request the JSON right away anyway, and Safari does
# not match fetch() calls to preloaded files (it downloads them twice and
# warns that the preload was unused).
DEFAULT_IMAGE = BASE_URL + "/img/raulestevezio.jpg"
META_TAG = re.compile(r'<meta\s+(?:name|property)="(?P<key>[^"]+)"\s+content="(?P<value>[^"]*)"')


def page_url(page: str) -> str:
    """Canonical URL of a page ('contact/index.html' -> '.../contact/')."""
    if page == "index.html":
        return BASE_URL + "/"
    if page.endswith("/index.html"):
        return BASE_URL + "/" + page[: -len("index.html")]
    return BASE_URL + "/" + page


def render_head(html: str, page: str) -> list[str]:
    """Build the shared <head> block of a page from scripts/templates/head.html.

    The page's own <title> and description fill the template, and any meta tag
    the page declares itself is left out of the template output.

    Raises:
        SystemExit: If the page has no <title> or no meta description.
    """
    head = html[: html.index("</head>")]
    own = re.sub(r"<!-- generated:start head -->.*?<!-- generated:end head -->", "", head, flags=re.S)
    own_meta = {m.group("key"): html_lib.unescape(m.group("value")) for m in META_TAG.finditer(own)}

    title_match = re.search(r"<title>(.*?)</title>", own, re.S)
    if not title_match or not own_meta.get("description"):
        raise SystemExit(f"{page}: every page needs its own <title> and <meta name=\"description\">")

    custom_image = own_meta.get("og:image")
    values = {
        "url": page_url(page),
        "root": page_root(page),
        "title": esc_attr(html_lib.unescape(title_match.group(1).strip())),
        "description": esc_attr(own_meta["description"]),
        "og_type": own_meta.get("og:type", "website"),
        "image": esc_attr(custom_image or DEFAULT_IMAGE),
        "twitter_card": "summary_large_image" if custom_image else "summary",
    }
    lines = Template(HEAD_TEMPLATE.read_text(encoding="utf-8")).substitute(values).splitlines()

    def declared_by_page(line: str) -> bool:
        """True if this template line is a meta tag the page already declares."""
        match = META_TAG.search(line)
        return bool(match) and match.group("key") in own_meta

    return [line for line in lines if line.strip() and not declared_by_page(line)]


# ---------------------------------------------------------------------------
# Shared layout: header, navigation buttons and footer
# ---------------------------------------------------------------------------
#
# Every page has the same three blocks; they are written once here and in
# scripts/templates/, never in the pages:
#
#   <!-- generated:start header -->  logo and language selector  (templates/header.html)
#   <!-- generated:start nav -->     the row of section buttons   (NAV_ITEMS below)
#   <!-- generated:start footer -->  contact prompt and email     (templates/footer.html)
#
# English texts come from locales/en/common.json and the email from
# data/person.json; js/i18n.js translates them through their data-i18n keys.

TEMPLATES = ROOT / "scripts" / "templates"

# Section buttons, in order: (locale key common.btn_<key>, target relative to the site root).
NAV_ITEMS = [
    ("experience", "experience.html"),
    ("projects", "projects.html"),
    ("tools", "tools/"),
    ("lab", "lab/"),
    ("courses", "courses.html"),
    ("contact", "contact/"),
]

# The button highlighted as the main call to action.
NAV_PRIMARY = "experience"

# Section each page belongs to (Demos and Games belong to the Lab). Its button
# is highlighted by css/styles.css: not clickable on the section's own page
# (aria-current="page"), still a link back on a page inside it (aria-current="true").
# Every page shows all the buttons, so the row never changes.
NAV_CURRENT = {
    "experience.html": "experience",
    "projects.html": "projects",
    "courses.html": "courses",
    "tools/index.html": "tools",
    "contact/index.html": "contact",
    "lab/index.html": "lab",
    "demos/index.html": "lab",
    "games/index.html": "lab",
}


def page_root(page: str) -> str:
    """Relative path from a page back to the site root ('' or '../')."""
    return "../" * page.count("/")


def render_template(name: str, values: dict) -> list[str]:
    """Fill a template from scripts/templates/ and return its non-empty lines."""
    text = Template((TEMPLATES / name).read_text(encoding="utf-8")).substitute(values)
    return [line for line in text.splitlines() if line.strip()]


def render_header(page: str) -> list[str]:
    """Logo (linking to the home page) and EN/ES language selector."""
    return render_template("header.html", {"root": page_root(page)})


def render_footer(page: str) -> list[str]:
    """Contact prompt and email shown below every page."""
    email = load_json("data/person.json")["email"]
    prompt = locale("en", "common")["contact_prompt"]
    return render_template("footer.html", {"email": esc_attr(email), "contact_prompt": esc(prompt)})


def render_nav(page: str) -> list[str]:
    """Row of section buttons, with the page's own section marked."""
    labels = locale("en", "common")
    current = NAV_CURRENT.get(page)
    links = []
    for key, target in NAV_ITEMS:
        is_current = key == current
        is_own_page = page in (target, target + "index.html")
        href = "./" if page == target + "index.html" else page_root(page) + target
        cls = "btn primary" if key == NAV_PRIMARY else "btn"
        # "page" on the section's own page (nothing to open); "true" on a page
        # inside it (Demos, Games in the Lab), where the button leads back to it.
        aria = f' aria-current="{"page" if is_own_page else "true"}"' if is_current else ""
        links.append(
            f'  <a href="{href}" class="{cls}" data-i18n="common.btn_{key}"{aria}>'
            + esc(labels["btn_" + key]) + "</a>"
        )
    return ['<div class="actions site-actions">', *links, "</div>"]


LAYOUT_BLOCKS = {
    "header": render_header,
    "nav": render_nav,
    "footer": render_footer,
}


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
    """First 10 hex characters of the SHA-256 of a file, used as its ?v= version."""
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def version_assets(html: str, page: str, clean: bool) -> str:
    """Add (or, with clean, remove) the ?v=<hash> version on local CSS and JS references.

    Paths are resolved relative to the page, so the same file gets the same
    hash on every page.

    Raises:
        SystemExit: If a referenced file does not exist.
    """
    page_dir = (ROOT / page).parent

    def replace(match: re.Match) -> str:
        """Rewrite one href/src reference."""
        ref = match.group("path")
        if clean:
            return f'{match.group("attr")}="{ref}"'
        asset = (page_dir / ref).resolve()
        if not asset.is_file():
            raise SystemExit(f"{page}: referenced file does not exist: {ref}")
        return f'{match.group("attr")}="{ref}?v={content_hash(asset)}"'

    return ASSET_REF.sub(replace, html)


def main() -> int:
    """Fill (or, with --clean, empty) every generated part of the site.

    For each page in SITE_PAGES: shared <head>, JSON-LD, the page's content
    blocks and asset versions. Then profile.json, llms.txt and sitemap.xml.
    Only files whose content changes are written.

    Returns:
        The process exit code (always 0; errors stop the script with SystemExit).
    """
    clean = "--clean" in sys.argv[1:]
    changed: list[str] = []

    for page in SITE_PAGES:
        path = ROOT / page
        original = path.read_text(encoding="utf-8")
        updated = fill_block(original, "head", [] if clean else render_head(original, page), page)
        updated = fill_block(updated, "jsonld", [] if clean else build_jsonld(page), page)
        for name, render in LAYOUT_BLOCKS.items():
            updated = fill_block(updated, name, [] if clean else render(page), page)

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

    changed += write_agent_files(clean)
    changed += write_sitemap(clean)

    action = "Restored" if clean else "Prepared"
    print(f"{action}: " + ", ".join(changed) if changed else "Nothing to change.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
