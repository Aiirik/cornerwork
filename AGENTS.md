# Cornerwork project workflow

Cornerwork is a static web application hosted exclusively on GitHub Pages.

## Source and deployment

- Make all website changes inside `dist/`.
- Keep asset links relative so the site works at `/cornerwork/` on GitHub Pages.
- Publish from the `main` branch of `Aiirik/cornerwork`.
- `.github/workflows/deploy-pages.yml` deploys the complete `dist/` directory.
- Do not create, configure, save, or deploy an OpenAI Site for this project.

## Required checks

- Read `PROJECT_GUIDE.md` before planning or implementing product changes.
- Run `npx --yes prettier@3.6.2 --check .` after editing text files.
- Run `node .github/scripts/generate-icon-catalog.mjs` before icon-related changes are published.
- Run `node --check dist/assets/js/app.js`, `node --check dist/assets/js/bootstrap.js`, `node --check dist/assets/js/enhancements.js`, `node --check dist/assets/js/icon-themes.js`, `node --check dist/sw.js`, and `node --check .github/scripts/generate-icon-catalog.mjs` after JavaScript changes.
- Run `git diff --check` before committing.
- When changing page scripts or styles, increment their query-string versions in `dist/index.html`, the enhancement version in `dist/assets/js/bootstrap.js`, and the cache version in `dist/sw.js`.
- Confirm the GitHub Pages workflow completes successfully after publishing.

## Product direction

- Preserve the established Cornerwork dark boxing-gym interface.
- Keep desktop behavior stable when making mobile-specific changes.
- Preserve browser-local settings and Firebase workout syncing unless a request explicitly changes them.

## Voice changes

- Cornerwork's bundled coaches are generated assets, not browser speech voices. When adding or
  changing any spoken move, announcement, cue, focus, drill instruction, or other callout, update
  `.github/scripts/voice-lines.mjs`, run `npm run voice:generate`, and run
  `npm run voice:check`.
- Follow `dist/assets/voices/README.md` for the complete regeneration and testing workflow.
- Keep the Device voice option and its automatic fallback so an unrecognized bundled line is never
  silently skipped.
