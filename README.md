# Raúl Estévez — Personal Portfolio

Personal website and professional portfolio for Raúl Estévez, a software developer focused on backend development, desktop applications and applied artificial intelligence.

## Public Profile Files

- `index.html`, `experience.html`, `projects.html`, `courses.html`, `lab/index.html`, `contact/index.html`, `demos/index.html` and `tools/index.html` provide the public portfolio pages.
- `llms.txt` provides a concise AI-readable professional profile summary.
- `profile.json` provides structured profile data for automated readers and profile parsers.
- `sitemap.xml` and `robots.txt` expose the site map and point crawlers to the AI-readable profile files.

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

- Each page keeps only what is its own: `<title>`, `<meta name="description">`, the stylesheet and its JSON-LD. Open Graph and Twitter reuse the title and description; the canonical URL and relative paths come from the page location.
- Do not add `preload`/`prefetch` links to the pages. The data files a page's script needs are preloaded from the `PRELOADS` map in `build_content.py`, and the template's Speculation Rules prefetch any internal page when a link is hovered (Chrome and Edge).
- To override a template tag on one page, declare it in that page, e.g. `<meta property="og:type" content="profile" />` on the home page or a custom `og:image` on `tools/index.html` (which also switches Twitter to a large image card).

## Cache busting

Never add `?v=` to stylesheet or script references by hand: the site pages reference local CSS/JS files without it. On deploy, `scripts/build_content.py` appends a hash of each file's content (`css/styles.css?v=1a2b3c4d5e`), so browsers download a file again exactly when it changes. `--clean` removes the versions again.

## Content validation

Run `python3 scripts/validate_content.py` before publishing changes to the portfolio catalog. The check keeps counts, public tool entries, `profile.json`, `llms.txt`, JSON-LD and `sitemap.xml` synchronized. The same validation runs automatically in GitHub Actions on pushes to `main` and pull requests.
