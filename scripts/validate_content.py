#!/usr/bin/env python3
"""Validate that portfolio data, SEO metadata and AI-readable files agree."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://raulesteveza.github.io"
ERRORS: list[str] = []


def load_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def check(condition: bool, message: str) -> None:
    if not condition:
        ERRORS.append(message)


class JsonLdParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_json_ld = False
        self.buffer: list[str] = []
        self.blocks: list[dict] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attributes = dict(attrs)
        if tag == "script" and attributes.get("type") == "application/ld+json":
            self.in_json_ld = True
            self.buffer = []

    def handle_data(self, data: str) -> None:
        if self.in_json_ld:
            self.buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self.in_json_ld:
            self.in_json_ld = False
            self.blocks.append(json.loads("".join(self.buffer)))


def public_url(path: str) -> str:
    return BASE_URL + path


def validate_counts() -> tuple[dict, list[dict], list[dict], list[dict]]:
    profile = load_json("profile.json")
    featured = load_json("data/bestProjects.json")["projects"]
    other = load_json("data/projects.json")["other"]
    demos = load_json("data/demos.json")["demos"]
    # "hidden": true keeps a tool in data/tools.json without publishing it.
    tools = [tool for tool in load_json("data/tools.json")["tools"] if not tool.get("hidden")]
    games = load_json("data/games.json")["games"]
    certificates = load_json("data/certificates.json")

    expected = {
        "featured_projects": len(featured),
        "other_projects": len(other),
        "interactive_demos": len(demos),
        "browser_tools": len(tools),
        "browser_games": len(games),
        "professional_certificates": len(certificates["programs"]),
        "individual_course_certificates": len(certificates["courses"]),
    }
    for key, count in expected.items():
        check(
            profile["portfolio_sections"].get(key) == count,
            f"profile.json portfolio_sections.{key} must be {count}",
        )

    return profile, demos, tools, games


def validate_tools(profile: dict, tools: list[dict]) -> None:
    data_names = [tool["name"] for tool in tools]
    profile_names = [tool["name"] for tool in profile["tools"]]
    project_names = {project["name"] for project in profile["projects"]}

    check(profile_names == data_names, "profile.json tools must match data/tools.json")
    check(
        set(data_names).issubset(project_names),
        "Every public tool must have a structured entry in profile.json projects",
    )

    tools_html = (ROOT / "tools/index.html").read_text(encoding="utf-8")
    parser = JsonLdParser()
    parser.feed(tools_html)
    check(len(parser.blocks) == 1, "tools/index.html must contain one JSON-LD block")
    if parser.blocks:
        item_list = parser.blocks[0]["mainEntity"]
        ordered_tools = sorted(tools, key=lambda tool: tool.get("display_order", 1000))
        expected_items = [
            (tool["name"], public_url(tool["tool_url"])) for tool in ordered_tools
        ]
        actual_items = [
            (item["name"], item["url"]) for item in item_list["itemListElement"]
        ]
        check(item_list["numberOfItems"] == len(tools), "Tools JSON-LD count is stale")
        check(actual_items == expected_items, "Tools JSON-LD items are stale or out of order")

    for tool in tools:
        check(tool["name"] in tools_html, f"tools/index.html does not mention {tool['name']}")
        local_index = ROOT / tool["tool_url"].lstrip("/") / "index.html"
        check(local_index.exists(), f"Missing deployed tool entry point: {local_index.relative_to(ROOT)}")


def validate_llms(profile: dict, tools: list[dict]) -> None:
    llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
    date_match = re.search(r"^Last updated: (\d{4}-\d{2}-\d{2})$", llms, re.MULTILINE)
    check(bool(date_match), "llms.txt must contain a valid Last updated date")
    if date_match:
        check(date_match.group(1) == profile["last_updated"], "llms.txt and profile.json dates differ")

    count_match = re.search(r"^- Browser tools: (\d+)", llms, re.MULTILINE)
    check(bool(count_match), "llms.txt must declare the browser tool count")
    if count_match:
        check(int(count_match.group(1)) == len(tools), "llms.txt browser tool count is stale")

    for required_url in (f"{BASE_URL}/lab/", f"{BASE_URL}/contact/"):
        check(required_url in llms, f"llms.txt is missing {required_url}")

    for tool in tools:
        check(tool["name"] in llms, f"llms.txt is missing {tool['name']}")
        check(public_url(tool["tool_url"]) in llms, f"llms.txt is missing {tool['tool_url']}")
        check(tool["repository_url"] in llms, f"llms.txt is missing {tool['repository_url']}")


def validate_education() -> None:
    for item in load_json("data/education.json")["education"]:
        for logo in item.get("logos") or []:
            check((ROOT / logo).is_file(), f"Missing education logo: {logo}")


def validate_sitemap(
    profile: dict, demos: list[dict], tools: list[dict], games: list[dict]
) -> None:
    tree = ET.parse(ROOT / "sitemap.xml")
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = {
        node.text for node in tree.findall("sm:url/sm:loc", namespace) if node.text
    }
    sitemap_dates = {
        url.find("sm:loc", namespace).text: url.find("sm:lastmod", namespace).text
        for url in tree.findall("sm:url", namespace)
        if url.find("sm:loc", namespace) is not None
        and url.find("sm:lastmod", namespace) is not None
    }

    required_paths = {
        "/",
        "/experience.html",
        "/projects.html",
        "/courses.html",
        "/tools/",
        "/demos/",
        "/games/",
        "/lab/",
        "/contact/",
        "/llms.txt",
        "/profile.json",
    }
    required_paths.update(tool["tool_url"] for tool in tools)
    required_paths.update(demo["demo_url"] for demo in demos)
    required_paths.update(game["game_url"] for game in games)

    for path in sorted(required_paths):
        check(public_url(path) in sitemap_urls, f"sitemap.xml is missing {path}")

        parsed = urlparse(path)
        local_path = ROOT / parsed.path.lstrip("/")
        if path.endswith("/"):
            local_path /= "index.html"
        check(local_path.exists(), f"Sitemap target does not exist locally: {path}")

    for path in ("/llms.txt", "/profile.json"):
        check(
            sitemap_dates.get(public_url(path)) == profile["last_updated"],
            f"sitemap.xml date for {path} must match profile.json last_updated",
        )


def main() -> int:
    try:
        profile, demos, tools, games = validate_counts()
        validate_tools(profile, tools)
        validate_llms(profile, tools)
        validate_sitemap(profile, demos, tools, games)
        validate_education()
    except (KeyError, json.JSONDecodeError, ET.ParseError) as error:
        ERRORS.append(f"Could not parse required content: {error}")

    if ERRORS:
        print("Content validation failed:", file=sys.stderr)
        for error in ERRORS:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Content validation passed: SEO, profile and catalog data are synchronized.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
