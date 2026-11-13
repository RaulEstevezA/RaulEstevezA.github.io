"""Generate the agent-readable profile files: profile.json and llms.txt.

Both are built on deploy from the same data as the website, so they can never
fall out of date:

- data/person.json        -> name, contact, summary, skills, languages
- data/experience.json    -> experience and recommendation letter
- data/education.json     -> education
- data/certificates.json  -> professional and individual course certificates
- data/bestProjects.json, projects.json, tools.json, demos.json, games.json

Used by build_content.py; see write_agent_files().
"""

from __future__ import annotations

import json
import subprocess
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUTS = ("profile.json", "llms.txt")


def load(relative_path: str):
    """Read a JSON file given its path relative to the repository root."""
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def ordered(items: list[dict]) -> list[dict]:
    """Sort items by display_order, then by file order (same rule as the page scripts)."""
    def key(pair):
        """Sort key: display_order when it is a number, otherwise after all ordered items, in file order."""
        index, item = pair
        order = item.get("display_order")
        return order if isinstance(order, (int, float)) and not isinstance(order, bool) else 1000 + index
    return [item for _, item in sorted(enumerate(items), key=key)]


def last_updated() -> str:
    """Date of the commit being published (today when git is unavailable)."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cs"], cwd=ROOT, capture_output=True, text=True, check=True
        )
        return result.stdout.strip() or date.today().isoformat()
    except (OSError, subprocess.CalledProcessError):
        return date.today().isoformat()


def site(person: dict, path: str) -> str:
    """Turn a site-relative path into an absolute URL on the person's website; leave full URLs unchanged."""
    return person["website"] + path if path.startswith("/") else path


def join_names(names: list[str]) -> str:
    """Join names as readable English: 'A', 'A and B', 'A, B and C'."""
    return names[0] if len(names) == 1 else ", ".join(names[:-1]) + " and " + names[-1]


def split_tags(text: str | None) -> list[str]:
    """Split a comma-separated technology list into clean tags, dropping empty ones."""
    return [tag.strip() for tag in (text or "").split(",") if tag.strip()]


# ---------------------------------------------------------------------------
# Collect everything once
# ---------------------------------------------------------------------------

def collect() -> dict:
    """Load and order all the data both outputs need, once.

    The order matches what the website shows: certificate programs newest first,
    projects, tools and demos by display_order, games by display_order or 1000
    (the rule games.js uses). Hidden tools are excluded.
    """
    person = load("data/person.json")
    certificates = load("data/certificates.json")
    return {
        "person": person,
        "updated": last_updated(),
        "jobs": load("data/experience.json")["jobs"],
        "education": load("data/education.json")["education"],
        "programs": sorted(certificates.get("programs") or [], key=lambda c: -int(c.get("year") or 0)),
        "courses": certificates.get("courses") or [],
        "featured": ordered(load("data/bestProjects.json")["projects"]),
        "other": load("data/projects.json")["other"],
        "tools": ordered([t for t in load("data/tools.json")["tools"] if not t.get("hidden")]),
        "demos": ordered(load("data/demos.json")["demos"]),
        "games": sorted(load("data/games.json")["games"], key=lambda g: g.get("display_order") or 1000),
    }


def project_links(person: dict, links: list[dict]) -> dict:
    """{type: absolute url} for a project's links (first of each type)."""
    result: dict[str, str] = {}
    for link in links or []:
        result.setdefault(link["type"], site(person, link["url"]))
    return result


# ---------------------------------------------------------------------------
# profile.json
# ---------------------------------------------------------------------------

def build_profile(d: dict) -> dict:
    """Build the profile.json document from the collected data.

    Empty fields (None, empty lists, empty strings) are dropped so agents only
    see values that exist.
    """
    person = d["person"]

    def cert(item: dict) -> dict:
        """Certificate summary: name, provider, year and the URL of its first certificate."""
        entry = {"name": item["name"], "provider": item["provider"], "year": item.get("year")}
        if item.get("certs"):
            entry["url"] = item["certs"][0]["url"]
        return entry

    experience = []
    for job in d["jobs"]:
        entry = {
            "role": job["title_en"],
            "company": job["company"],
            "period": job.get("period_en"),
            "hours": job.get("hours"),
            "stack": split_tags(job.get("tech")),
            "description": " ".join(job.get("paragraphs_en") or []),
            "highlights": job.get("highlights_en") or [],
            "demo": job.get("demo_url"),
            "demo_note": job.get("demo_note_en"),
        }
        if job.get("recommendation"):
            entry["recommendation"] = dict(
                job["recommendation"],
                company=job["company"],
                pdf=site(person, "/" + job["rec_letter"]) if job.get("rec_letter") else None,
            )
        experience.append({k: v for k, v in entry.items() if v not in (None, [], "")})

    projects = []
    for project in d["featured"]:
        links = project_links(person, project.get("links"))
        entry = {
            "name": project["title_en"].split(" — ")[0],
            "context": project.get("badge_en"),
            "description": project["modal_desc_en"],
            "features": project.get("modal_features_en") or [],
            "stack": split_tags(project.get("modal_tech") or project.get("card_tech")),
            "repository": links.get("github"),
            "demo": links.get("live_demo") or links.get("web"),
            "video": links.get("demo"),
            "downloads": links.get("download"),
            "featured": True,
        }
        projects.append({k: v for k, v in entry.items() if v not in (None, [])})
    for project in d["other"]:
        links = project.get("links") or []
        repositories = [l["url"] for l in links if l["type"] in ("github", "repo1", "repo2")]
        demo = next((site(person, l["url"]) for l in links if l["type"] in ("live_demo", "web", "demo")), None)
        entry = {"name": project["name"], "description": project["desc_en"], "repositories": repositories, "demo": demo, "featured": False}
        projects.append({k: v for k, v in entry.items() if v not in (None, [])})

    def item(entry: dict, url_key: str) -> dict:
        """Tool, demo or game summary.

        Args:
            entry: The data item.
            url_key: Field holding its site URL (tool_url, demo_url or game_url).
        """
        result = {
            "name": entry["name"],
            "description": entry.get("description_en"),
            "url": site(person, entry[url_key]),
            "repository": entry.get("repository_url"),
            "stack": entry.get("technologies"),
        }
        downloads = (entry.get("download") or {}).get("releases_url")
        if downloads:
            result["downloads"] = downloads
        return {k: v for k, v in result.items() if v}

    return {
        "_generated": "Generated from the website data on every deploy; see llms.txt for a readable version.",
        "name": person["name"],
        "title": person["title"],
        "focus": person["focus"],
        "location": person["location"],
        "website": person["website"],
        "email": person["email"],
        "github": person["github"],
        "linkedin": person["linkedin"],
        "last_updated": d["updated"],
        "summary": person["summary"],
        "portfolio_sections": {
            "featured_projects": len(d["featured"]),
            "other_projects": len(d["other"]),
            "interactive_demos": len(d["demos"]),
            "browser_tools": len(d["tools"]),
            "browser_games": len(d["games"]),
            "professional_certificates": len(d["programs"]),
            "individual_course_certificates": len(d["courses"]),
        },
        "skills": person["skills"],
        "knows_about": person["knows_about"],
        "experience": experience,
        "education": [
            {"degree": e["title_en"], "institution": e["institution"], "period": e["period_en"], "result": e["grade_en"]}
            for e in d["education"]
        ],
        "professional_certificates": [cert(c) for c in d["programs"]],
        "individual_course_certificates": [cert(c) for c in d["courses"]],
        "certificate_catalog": {
            "individual_course_certificates": len(d["courses"]),
            "providers": sorted({c["provider"] for c in d["programs"] + d["courses"]}),
            "url": person["website"] + "/courses.html",
        },
        "tools": [item(t, "tool_url") for t in d["tools"]],
        "demos": [item(x, "demo_url") for x in d["demos"]],
        "games": [item(g, "game_url") for g in d["games"]],
        "projects": projects,
        "languages": person["languages"],
    }


# ---------------------------------------------------------------------------
# llms.txt
# ---------------------------------------------------------------------------

def build_llms(d: dict) -> str:
    """Build the llms.txt document (Markdown) from the collected data.

    Sections are written in a fixed order; to add one, append its lines with
    add() at the right place.
    """
    person, out = d["person"], []
    web = person["website"]
    add = out.append

    add(f'# {person["name"]} — {person["title"]}')
    add("")
    for line in person["llms_intro"]:
        add(f"> {line}")
    add("")
    add(f'Last updated: {d["updated"]}')
    add("")
    add("This file is intended to help language models and search systems understand")
    add(f"{person['name']}'s professional profile accurately. It is generated from the")
    add(f"same data as the website, so it always matches {web}.")

    add("")
    add("## Portfolio Sections")
    add("")
    add(f'- Featured projects: {len(d["featured"])} — {web}/projects.html')
    add(f'- Other projects: {len(d["other"])} — {web}/projects.html')
    add(f'- Interactive demos: {len(d["demos"])} ({join_names([x["name"] for x in d["demos"]])}) — {web}/demos/')
    add(f'- Browser tools: {len(d["tools"])} ({join_names([x["name"] for x in d["tools"]])}) — {web}/tools/')
    add(f'- Browser games: {len(d["games"])} ({join_names([x["name"] for x in d["games"]])}) — {web}/games/')
    add(f"- Lab: technical demos and browser games — {web}/lab/")
    add(f"- Contact: email, GitHub and LinkedIn — {web}/contact/")
    add(f'- Professional certificates: {len(d["programs"])}; individual course certificates: {len(d["courses"])} — {web}/courses.html')

    add("")
    add("## Summary")
    add("")
    add(person["summary"])

    add("")
    add("## Experience")
    for job in d["jobs"]:
        period = job.get("period_en", "")
        add("")
        add(f'- **Role:** {job["title_en"]} — {job["company"]}')
        add(f"- **Period:** {period}")
        add(f'- **Stack:** {job.get("tech", "")}')
        for paragraph in job.get("paragraphs_en") or []:
            add(f"- {paragraph}")
        if job.get("highlights_en"):
            add("- **Highlights:**")
            for highlight in job["highlights_en"]:
                add(f"  - {highlight}")
        if job.get("demo_url"):
            note = f' ({job["demo_note_en"]})' if job.get("demo_note_en") else ""
            add(f'- **Interactive demo:** {job["demo_url"]}{note}')

        letter = job.get("recommendation")
        if letter:
            add("")
            add("### Recommendation Letter")
            add("")
            add(f'- **Issued by:** {letter["issued_by"]} — {job["company"]}')
            add(f'- **Date:** {letter["date"]}')
            if job.get("rec_letter"):
                add(f'- **PDF:** {web}/{job["rec_letter"]}')
            add("")
            add("Highlights noted by the direct supervisor:")
            for highlight in letter.get("highlights") or []:
                add(f'- **{highlight["title"]}:** {highlight["text"]}')
            if letter.get("conclusion"):
                add("")
                add(f'> {letter["conclusion"]}')

    add("")
    add("## Education")
    add("")
    for e in d["education"]:
        add(f'- **{e["title_en"]}**')
        add(f'  {e["institution"]} — {e["period_en"]} — {e["grade_en"]}')

    add("")
    add("### Professional Program Certificates")
    add("")
    for c in d["programs"]:
        url = f' — {c["certs"][0]["url"]}' if c.get("certs") else ""
        add(f'- **{c["name"]}** — {c["provider"]} ({c["year"]}){url}')

    add("")
    add("### Individual Course Certificates")
    add("")
    for c in d["courses"]:
        add(f'- {c["name"]} — {c["provider"]} ({c["year"]})')

    add("")
    add("## Featured Projects")
    for project in d["featured"]:
        links = project_links(person, project.get("links"))
        add("")
        add(f'- **{project["title_en"].split(" — ")[0]}** — {project["modal_desc_en"]}')
        if project.get("badge_en"):
            add(f'  Context: {project["badge_en"]}')
        add(f'  Stack: {project.get("modal_tech") or project.get("card_tech")}')
        for feature in project.get("modal_features_en") or []:
            add(f"  - {feature}")
        for label, key in (("Repository", "github"), ("Web app", "web"), ("Interactive demo", "live_demo"), ("Video", "demo"), ("Downloads", "download")):
            if key in links:
                add(f"  {label}: {links[key]}")

    add("")
    add("## Browser Tools")
    for tool in d["tools"]:
        add("")
        add(f'- **{tool["name"]}** — {tool["description_en"]}')
        add(f'  Web app: {site(person, tool["tool_url"])}')
        if tool.get("repository_url"):
            add(f'  Repository: {tool["repository_url"]}')
        if (tool.get("download") or {}).get("releases_url"):
            add(f'  Desktop downloads: {tool["download"]["releases_url"]}')

    add("")
    add("## Interactive Demos")
    for demo in d["demos"]:
        add("")
        add(f'- **{demo["name"]}** — {demo["description_en"]}')
        if demo.get("technologies"):
            add(f'  Stack: {", ".join(demo["technologies"])}')
        add(f'  Demo: {site(person, demo["demo_url"])}')
        if demo.get("repository_url"):
            add(f'  Repository: {demo["repository_url"]}')

    add("")
    add("## Browser Games")
    for game in d["games"]:
        add("")
        add(f'- **{game["name"]}** — {game.get("description_en", "")}')
        if game.get("technologies"):
            add(f'  Stack: {", ".join(game["technologies"])}')
        add(f'  Play: {site(person, game["game_url"])}')
        if game.get("repository_url"):
            add(f'  Repository: {game["repository_url"]}')

    add("")
    add("## Other Projects")
    add("")
    for project in d["other"]:
        urls = " · ".join(site(person, l["url"]) for l in project.get("links") or [])
        add(f'- **{project["name"]}** — {project["desc_en"]}' + (f" {urls}" if urls else ""))

    skills = person["skills"]
    add("")
    add("## Technical Skills")
    add("")
    add(f'- **Languages:** {", ".join(skills["languages"])}')
    add(f'- **Frameworks & Libraries:** {", ".join(skills["frameworks"])}')
    add(f'- **Tools:** {", ".join(skills["tools"])}')
    add(f'- **Paradigms:** {", ".join(skills["paradigms"])}')

    add("")
    add("## Human Languages")
    add("")
    for lang in person["languages"]:
        extra = ", ".join(filter(None, [lang.get("cert"), lang.get("note")]))
        add(f'- {lang["language"]} — {lang["level"]}' + (f" ({extra})" if extra else ""))

    add("")
    add("## Contact & Profiles")
    add("")
    add(f"- Website: {web}")
    add(f'- Email: {person["email"]}')
    add(f'- GitHub: {person["github"]}')
    add(f'- LinkedIn: {person["linkedin"]}')
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------------------

def write_agent_files(clean: bool) -> list[str]:
    """Write (or, with clean, remove) profile.json and llms.txt; returns changed files."""
    changed = []
    if clean:
        for name in OUTPUTS:
            path = ROOT / name
            if path.exists():
                path.unlink()
                changed.append(name)
        return changed

    data = collect()
    contents = {
        "profile.json": json.dumps(build_profile(data), ensure_ascii=False, indent=2) + "\n",
        "llms.txt": build_llms(data),
    }
    for name, text in contents.items():
        path = ROOT / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8")
            changed.append(name)
    return changed
