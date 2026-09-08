# Cornerwork project workflow

Cornerwork is a static web application hosted exclusively on GitHub Pages.

## Source and deployment

- Make all website changes inside `dist/`.
- Keep asset links relative so the site works at `/cornerwork/` on GitHub Pages.
- Publish from the `main` branch of `Aiirik/cornerwork`.
- `.github/workflows/deploy-pages.yml` deploys the complete `dist/` directory.
- Do not create, configure, save, or deploy an OpenAI Site for this project.

## Required checks

- Run `node --check dist/features.js` and `node --check dist/sw.js` after JavaScript changes.
- Run `git diff --check` before committing.
- When changing page scripts or styles, increment their query-string version in `dist/index.html` and the cache version in `dist/sw.js`.
- Confirm the GitHub Pages workflow completes successfully after publishing.

## Product direction

- Preserve the established Cornerwork dark boxing-gym interface.
- Keep desktop behavior stable when making mobile-specific changes.
- Preserve browser-local settings and Firebase workout syncing unless a request explicitly changes them.
