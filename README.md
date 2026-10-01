# Raúl Estévez — Personal Portfolio

Personal website and professional portfolio for Raúl Estévez, a software developer focused on backend development, desktop applications and applied artificial intelligence.

## Public Profile Files

- `index.html`, `experience.html`, `projects.html`, `courses.html` and `demos/index.html` provide the public portfolio pages.
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
