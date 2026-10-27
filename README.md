# Pour-over Coffee

A multilingual, source-backed library of original pour-over coffee recipes.

The interface follows a warm coffee editorial design. The homepage introduces recipes; brewing instructions and pour timelines belong on recipe detail pages.

Stack: Next.js App Router, React, TypeScript, Tailwind CSS, next-intl, and GitHub Pages static export.

Languages: Traditional Chinese, Simplified Chinese, English, Japanese, Korean, Spanish, French, German, and Brazilian Portuguese.

The library currently contains eight verified records, including V60, Switch and W60 methods.

Content is independently researched and attributed to its original sources. This project is not affiliated with the recipe authors or equipment manufacturers.

## Development

Use Node.js 24 and `npm ci`. Run `npm run dev`, then open `/pour-over-coffee/zh-Hant/` on the local server.

## Checks and static preview

Run `npm run validate`, `npm run typecheck`, `npm test`, and `npm run build`. For browser journeys, install Chromium with `npx playwright install chromium`, then run `npm run test:e2e`. To inspect the production export manually, run `node scripts/serve.mjs` and open `http://127.0.0.1:4173/pour-over-coffee/`.

## Publishing

The public repository belongs to `imycc`. GitHub Actions verifies pull requests and publishes checked main commits to `https://imycc.github.io/pour-over-coffee/`. Configure Pages to use GitHub Actions. See `docs/research.md` for source decisions and `docs/architecture.md` for data and localization contracts.
