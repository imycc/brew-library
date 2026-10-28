# Architecture and maintenance

## Frontend

Next.js App Router with React, TypeScript, Tailwind CSS and next-intl. Localized routes are prebuilt with `generateStaticParams`; no runtime middleware or locale negotiation is required. All routes carry a locale prefix. The root HTML is a static entry to Traditional Chinese.

The homepage is an editorial discovery surface. Full brewing instructions and timelines exist only on recipe details. The comparison page compares original facts and source links, without ranking or adapting recipes.

## Data interfaces

Optional source conditions are structured as `grinder` (identity and literal setting), `paper` (identity and optional shape), and `coffee` (name, origin, variety, processing, roast). The recipe’s `source` supports these fields. AND filters use the shareable query keys `grinder`, `paper`, `process`, `roast`; missing conditions do not match. Model names and source dial notation remain unchanged across locales; no setting conversion is performed.

`duration: null` means the source does not specify total brew time and displays the localized unknown label. Steps can carry their own `temperature`. See [analytics.md](analytics.md) for the optional GoatCounter integration.

- `content/recipes.json`: version 1 canonical recipe records. Validated by Zod in `src/lib/recipes.ts`.
- `content/equipment.json`: version 1 source-backed catalogue for drippers, grinders and filters. Validated by Zod in `src/lib/equipment.ts`; explicit recipe IDs connect equipment to the current recipe catalogue. Unresolved model records remain visible and are labelled rather than guessed. Material values use canonical IDs and render through nine-language `equipmentMaterials` translations.
- `content/editorial.json`: source-independent editorial overlay for every recipe and equipment record. It stores concise overview metadata (recipe best-for, equipment role), up to three strengths, up to three considerations, and optional official image metadata. Canonical quantities and source links remain in the recipe/equipment files; this overlay must not change them.
- `messages/{locale}.json`: full UI and recipe text in nine locales. Message keys, parameters, required recipe content and step instruction coverage are checked before publishing.
- `messages/editorial-{locale}.json`: nine-language editorial copy and translated equipment-material/trait vocabulary. `src/i18n/request.ts` deep-merges this overlay at build time so the UI can use the same message contract as the core catalogue.
- Numeric quantities, original units, exact/ranged times, author identity and source provenance live in canonical data; copy is localized separately.
- Steps may override the recipe’s water unit, and may provide their own translated instruction. Mixed g/mL source statements remain visibly distinct. Temperature distinguishes boiling water from an unspecified temperature; daily teaching and competition recipes have separate context labels.
- Null means unspecified, not zero. Scott Rao's total water is marked as derived from source ratio. Source dates remain explicit ISO dates rather than approximate relative dates.

## State and future integrations

Search (`q`), brewer, author, style, dose and selected recipe IDs (`ids`) live in query parameters. Shared links survive refresh and language changes. Invalid recipe IDs are excluded with a visible message. IDs are deduplicated and limited to three. Equipment-page search and category state are local UI state; equipment records link directly to their related recipes.

Data access, filtering, selection and UI are separate. A future CMS or API can replace the data loader while preserving recipe IDs and component contracts. Server features require a host with server support; GitHub Pages remains a static host.

## Photography

The homepage keeps its editorial hero photography, but recipe cards and comparison headers remain text/data-first. Recipe details and equipment cards may show a credited image from the record's official source page. Images are hotlinked only when the source page exposes a usable HTTPS image URL; the credit links back to that page. Missing metadata or a failed image request renders a localized neutral fallback and never blocks the page. Collection or brand imagery is labelled with its actual source and is not presented as unique product evidence. Design references are kept in the local ignored `outputs/design-concepts/` directory.

## Verification and delivery

`npm run validate`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Build verifies every exported localized page has the correct HTML language and canonical URL. GitHub Actions repeats checks and browser journeys before publishing main through Pages.

CI pins the official Ubuntu 24.04 hosted runner and tests with its preinstalled Chrome (`PLAYWRIGHT_CHANNEL=chrome`). The same Playwright suite runs without repeatedly downloading system fonts from the slow Ubuntu mirror. The website supplies explicit CJK serif/sans web fonts; ordinary system-font fallbacks remain available.

Deployment rollback: revert the offending main commit in a PR and rerun the same verified publishing workflow. Do not rewrite repository history to roll back.

The header language control is a disclosure of ordinary language links, not an ARIA application menu. Enter/Space opens it, Tab follows links, Escape closes and returns focus; outside click and focus leaving the control also close it. Language links preserve the localized path and query state.
