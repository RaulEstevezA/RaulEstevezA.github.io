# Raúl Estévez — Personal Portfolio

Personal website and professional portfolio for Raúl Estévez, a software developer focused on backend development, desktop applications and applied artificial intelligence.

## Public Profile Files

- `index.html`, `experience.html`, `projects.html`, `courses.html`, `lab/index.html`, `contact/index.html`, `demos/index.html`, `games/index.html` and `tools/index.html` provide the public portfolio pages.
- `llms.txt` (AI-readable profile summary) and `profile.json` (structured profile data) are published at the site root. They are generated on deploy from `data/*.json` and are not in the repository (see *Generated files*).
- `robots.txt` points crawlers to `sitemap.xml` and the AI-readable profile files; `sitemap.xml` is generated on deploy (see *Generated files*).

## Project Curation Notes

Featured projects prioritize larger, more independently scoped work: CS50 AI, DuckyWare and OnlineStore.

Secondary coursework projects remain listed for completeness. E-Plant is intentionally treated as a lower-priority IBM course exercise because it was completed from a provided starter base, although it includes a visual GitHub Pages demo and demonstrates a React/Redux plant store with product listings, categories and cart-flow state management.

## Demo deployments

- `demos/Cinema_App/` is managed by the `RaulEstevezA/Cinema_App_Demo` deployment workflow.
- `demos/Flutter_Shop_Admin/` is managed by the `RaulEstevezA/Flutter_Shop_Admin_Demo` deployment workflow.
- Future demos follow the same `demos/<Name>/` convention and are managed by their source repositories.
- Demo deployments use `rsync --delete`; do not manually edit files inside a managed demo directory.
- Run `git pull --rebase` before pushing because demo workflows commit generated files to `main` as `github-actions[bot]`.
- Keep shared card images outside managed demo directories, under `img/demos/` or the existing `img/thumbs/` directory.

## Tool deployments

- Tools follow the `tools/<Name>/` convention and can be managed by their source repositories in the same way as demos.
- Add each public tool to `data/tools.json` using the same card fields as `data/demos.json`, replacing `demo_url` with `tool_url`.
- Tool deployments may use `rsync --delete`; do not manually edit files inside a managed tool directory.
- Keep shared tool card images outside managed tool directories, under `img/tools/` or `img/thumbs/`.

## Pre-rendered content

The `data/*.json` files are the single source of truth. The pages that list them (`projects.html`, `experience.html`, `courses.html`, `lab/`, `demos/`, `games/` and `tools/`) contain empty `<!-- generated:start NAME -->` / `<!-- generated:end NAME -->` blocks.

- On every push to `main`, `.github/workflows/deploy-pages.yml` runs `python3 scripts/build_content.py`, which fills those blocks from the JSON, and publishes the result to GitHub Pages. The filled pages are never committed: just edit the JSON and push.
- GitHub Pages must use **Settings → Pages → Source: GitHub Actions**.
- The published pages are complete on first paint and readable by crawlers and agents. The scripts in `js/` still load the JSON, re-render the blocks when the language changes and resolve platform-specific download buttons. Local previews therefore keep working with the empty blocks.
- To preview the published version locally, run `python3 scripts/build_content.py`, and `python3 scripts/build_content.py --clean` before committing.
- The generated markup mirrors what `js/*.js` renders in English. If you change how a card is rendered in a script, change `scripts/build_content.py` the same way.

## Shared head

The tags every page needs (canonical, Open Graph, Twitter, icons, `llms.txt`/`profile.json` alternates, theme colour and the language script) live in one file: `scripts/templates/head.html`. On deploy, `scripts/build_content.py` fills each page's `<!-- generated:start head -->` block from it.

- Each page keeps only what is its own: `<title>`, `<meta name="description">` and the stylesheet. Open Graph and Twitter reuse the title and description; the canonical URL and relative paths come from the page location.
- Do not add `preload`/`prefetch` links to the pages. The data JSON is not preloaded on purpose (the content is already in the HTML, and Safari downloads preloaded `fetch()` files twice); the template's Speculation Rules prefetch any internal page when a link is hovered (Chrome and Edge).
- To override a template tag on one page, declare it in that page, e.g. `<meta property="og:type" content="profile" />` on the home page or a custom `og:image` on `tools/index.html` (which also switches Twitter to a large image card).

## Structured data (JSON-LD)

The schema.org JSON-LD of every page is generated on deploy by `scripts/jsonld.py` (called from `build_content.py`) into each page's `<!-- generated:start jsonld -->` block. Never write it by hand:

- The person (name, title, contact, profiles, languages, `knows_about`) comes from `data/person.json`; studies and certificates from `data/education.json` and `data/certificates.json`; the internship from `data/experience.json`; the lists of Projects, Demos, Games and Tools from their `data/*.json` files.
- Collection pages take their name and description from the page's `<title>` and `<meta name="description">`.
- Schema.org properties that the site itself does not display (`applicationCategory`, `operatingSystem`, `license`, exact dates, addresses…) go in an optional `"schema"` object on the item in its data file, and are merged into the JSON-LD as is.

## Cache busting

Never add `?v=` to stylesheet or script references by hand: the site pages reference local CSS/JS files without it. On deploy, `scripts/build_content.py` appends a hash of each file's content (`css/styles.css?v=1a2b3c4d5e`), so browsers download a file again exactly when it changes. `--clean` removes the versions again.

## Generated files

These files are published at the site root but are not in the repository (they are ignored by git; `build_content.py --clean` removes local copies):

- `profile.json` and `llms.txt`: generated by `scripts/agent_files.py` from `data/person.json` and the other `data/*.json` files, so their counts, lists and descriptions always match the site.
- `sitemap.xml`: generated by `scripts/sitemap.py` from the site pages, the visible tools, the demos (plus their optional `sitemap_pages`) and the games. Each `lastmod` is the date of the last commit that changed that page or its data, which is why the deploy checks out the full git history.

## Adding content

Edit only the data file; everything else (cards, counters, JSON-LD, `profile.json`, `llms.txt`) follows on the next deploy:

| To add… | Edit |
|---|---|
| A course certificate | `data/certificates.json` → `courses` |
| A professional certificate | `data/certificates.json` → `programs` |
| A degree or qualification | `data/education.json` |
| A job or internship | `data/experience.json` |
| A featured project | `data/bestProjects.json` |
| Another project | `data/projects.json` |
| A tool / demo / game | `data/tools.json` / `data/demos.json` / `data/games.json` |
| Personal details, skills, languages | `data/person.json` |

## Content validation

Run `python3 scripts/validate_content.py` before publishing. It checks that the data files are readable and complete, and that every listed tool, demo (and its `sitemap_pages`), game and logo exists. It runs automatically on deploy and on pull requests.
