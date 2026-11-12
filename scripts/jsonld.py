"""Build each page's schema.org JSON-LD from the portfolio data.

Sources:
- profile.json             -> the person (name, title, contact, profiles, languages, knows_about)
- data/education.json      -> alumniOf
- data/certificates.json   -> hasCredential (professional certificates)
- data/experience.json     -> hasOccupation (one Role per job)
- data/bestProjects.json, demos.json, games.json, tools.json -> item lists
- each page's <title> and <meta name="description"> -> collection page name/description

Any item in those data files can carry a "schema" object with extra schema.org
properties (applicationCategory, operatingSystem, startDate...). It is merged
into that item's JSON-LD as is.

Used by build_content.py; see build_jsonld().
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://raulesteveza.github.io"
PHOTO = BASE_URL + "/img/raulestevezio.jpg"


def load(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def absolute(url: str) -> str:
    return BASE_URL + url if url.startswith("/") else url


def merge(base: dict, extra: dict | None) -> dict:
    """Deep-merge the optional "schema" object of a data item into its JSON-LD."""
    for key, value in (extra or {}).items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            merge(base[key], value)
        else:
            base[key] = value
    return base


def ordered(items: list[dict]) -> list[dict]:
    """display_order first, then file order (same rule as the page scripts)."""
    def key(pair):
        index, item = pair
        order = item.get("display_order")
        return order if isinstance(order, (int, float)) and not isinstance(order, bool) else 1000 + index
    return [item for _, item in sorted(enumerate(items), key=key)]


def page_meta(page: str) -> tuple[str, str]:
    """Short page name (title before " | ") and meta description."""
    text = (ROOT / page).read_text(encoding="utf-8")
    title = html.unescape(re.search(r"<title>(.*?)</title>", text, re.S).group(1).strip())
    description = re.search(r'<meta name="description" content="([^"]*)"', text).group(1)
    return title.split(" | ")[0], html.unescape(description)


# ---------------------------------------------------------------------------
# The person
# ---------------------------------------------------------------------------

def person_ref() -> dict:
    profile = load("profile.json")
    return {"@type": "Person", "name": profile["name"], "url": profile["website"] + "/"}


def person(page_url: str | None = None, *, full: bool = False) -> dict:
    profile = load("profile.json")
    data = {
        "@type": "Person",
        "name": profile["name"],
        "url": profile["website"] + "/",
    }
    if page_url:
        data["mainEntityOfPage"] = page_url
    data.update({
        "image": PHOTO,
        "email": "mailto:" + profile["email"],
        "jobTitle": profile["title"],
        "sameAs": [profile["github"], profile["linkedin"]],
    })
    if full:
        skills = profile["skills"]
        data["description"] = profile["summary"]
        data["knowsAbout"] = profile["knows_about"]
        data["knowsLanguage"] = languages()
        data["homeLocation"] = {"@type": "Country", "name": profile["location"]}
        data["hasOccupation"] = {
            "@type": "Occupation",
            "name": profile["title"],
            "occupationLocation": {"@type": "Country", "name": profile["location"]},
            "skills": ", ".join(skills["languages"] + skills["frameworks"]),
        }
    return data


def languages() -> list[dict]:
    return [
        {"@type": "Language", "name": lang["language"],
         "description": " ".join(filter(None, [lang.get("level"), lang.get("cert")]))}
        for lang in load("profile.json")["languages"]
    ]


def alumni_of() -> list[dict]:
    return [
        {
            "@type": "EducationalOrganization",
            "name": item["institution"],
            "description": f'{item["title_en"]}, {item["grade_en"]}, {item["period_en"]}',
        }
        for item in load("data/education.json")["education"]
    ]


def credentials() -> list[dict]:
    result = []
    for program in load("data/certificates.json")["programs"]:
        credential = {
            "@type": "EducationalOccupationalCredential",
            "name": program["name"],
            "credentialCategory": "Professional Certificate",
        }
        if program.get("certs"):
            credential["url"] = program["certs"][0]["url"]
        credential["recognizedBy"] = {"@type": "Organization", "name": program["provider"]}
        result.append(credential)
    return result


def roles() -> list[dict]:
    result = []
    for job in load("data/experience.json")["jobs"]:
        role = {
            "@type": "Role",
            "roleName": job["title_en"],
            "description": (job.get("paragraphs_en") or [""])[0],
            "skills": job.get("tech", ""),
            "worksFor": {"@type": "Organization", "name": job["company"]},
        }
        result.append(merge(role, job.get("schema")))
    return result


# ---------------------------------------------------------------------------
# Item lists
# ---------------------------------------------------------------------------

def collection(page: str, items: list[dict]) -> dict:
    name, description = page_meta(page)
    url = BASE_URL + "/" + page.replace("index.html", "")
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"{name} by Raúl Estévez",
        "url": url,
        "description": description,
        "author": person_ref(),
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": len(items),
            "itemListElement": [dict(item, position=i) for i, item in enumerate(items, start=1)],
        },
    }


def project_item(project: dict) -> dict:
    links = {link["type"]: link for link in project.get("links") or []}
    item = {
        "@type": "SoftwareApplication",
        "name": project["title_en"].split(" — ")[0],
        "description": project["card_desc_en"],
    }
    if "github" in links:
        item["codeRepository"] = links["github"]["url"]
    page_link = links.get("live_demo") or links.get("web")
    if page_link:
        item["url"] = absolute(page_link["url"])
    if "download" in links:
        item["downloadUrl"] = links["download"]["url"]
    if "demo" in links:
        item["video"] = links["demo"]["url"]
    return merge(item, project.get("schema"))


def demo_item(demo: dict) -> dict:
    item = {
        "@type": "SoftwareApplication",
        "name": demo["name"],
        "description": demo["description_en"],
        "url": absolute(demo["demo_url"]),
        "operatingSystem": "Web",
    }
    if demo.get("repository_url"):
        item["codeRepository"] = demo["repository_url"]
    return merge(item, demo.get("schema"))


def game_item(game: dict) -> dict:
    item = {
        "@type": "VideoGame",
        "name": game["name"],
        "description": game["description_en"],
        "url": absolute(game["game_url"]),
        "operatingSystem": "Web",
        "playMode": "SinglePlayer",
    }
    if game.get("repository_url"):
        item["codeRepository"] = game["repository_url"]
    return merge(item, game.get("schema"))


def tool_item(tool: dict) -> dict:
    download = tool.get("download") or {}
    item = {
        "@type": "SoftwareApplication",
        "name": tool["name"],
        "description": tool["description_en"],
        "url": absolute(tool["tool_url"]),
        "operatingSystem": ["Web"] + sorted((download.get("assets") or {}).keys()),
        "isAccessibleForFree": True,
    }
    if tool.get("repository_url"):
        item["codeRepository"] = tool["repository_url"]
    if download.get("releases_url"):
        item["downloadUrl"] = download["releases_url"]
    return merge(item, tool.get("schema"))


# ---------------------------------------------------------------------------
# One JSON-LD document per page
# ---------------------------------------------------------------------------

def page_documents() -> dict:
    home = BASE_URL + "/"
    return {
        "index.html": lambda: dict(
            {"@context": "https://schema.org"},
            **person(home, full=True),
            alumniOf=alumni_of(),
            hasCredential=credentials(),
        ),
        "experience.html": lambda: dict(
            {"@context": "https://schema.org"},
            **person(BASE_URL + "/experience.html"),
            hasOccupation=roles(),
        ),
        "courses.html": lambda: dict(
            {"@context": "https://schema.org"},
            **person(BASE_URL + "/courses.html"),
            alumniOf=alumni_of(),
            hasCredential=credentials(),
            knowsLanguage=languages(),
        ),
        "contact/index.html": lambda: {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": f'{page_meta("contact/index.html")[0]} {load("profile.json")["name"]}',
            "url": BASE_URL + "/contact/",
            "mainEntity": person(),
        },
        "lab/index.html": lambda: {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": f'{page_meta("lab/index.html")[0]} by Raúl Estévez',
            "url": BASE_URL + "/lab/",
            "description": page_meta("lab/index.html")[1],
            "author": person_ref(),
            "hasPart": [
                {"@type": "CollectionPage", "name": page_meta(sub)[0], "url": BASE_URL + "/" + sub.replace("index.html", "")}
                for sub in ("demos/index.html", "games/index.html")
            ],
        },
        "projects.html": lambda: collection(
            "projects.html",
            [project_item(p) for p in ordered(load("data/bestProjects.json")["projects"])],
        ),
        "demos/index.html": lambda: collection(
            "demos/index.html",
            [demo_item(d) for d in ordered(load("data/demos.json")["demos"])],
        ),
        "games/index.html": lambda: collection(
            "games/index.html",
            # games.js sorts with (display_order || 1000)
            [game_item(g) for g in sorted(load("data/games.json")["games"], key=lambda g: g.get("display_order") or 1000)],
        ),
        "tools/index.html": lambda: collection(
            "tools/index.html",
            [tool_item(t) for t in ordered([t for t in load("data/tools.json")["tools"] if not t.get("hidden")])],
        ),
    }


def build_jsonld(page: str) -> list[str]:
    """The <script type="application/ld+json"> block for a page, as lines."""
    document = page_documents()[page]()
    text = json.dumps(document, ensure_ascii=False, indent=2).replace("</", "<\\/")
    return ['<script type="application/ld+json">'] + text.splitlines() + ["</script>"]
