# Architecture and maintenance

## Frontend

Next.js App Router with React, TypeScript, Tailwind CSS and next-intl. Localized routes are prebuilt with `generateStaticParams`; no runtime middleware or locale negotiation is required. All routes carry a locale prefix. The root HTML is a tiny entry that picks a locale from `navigator.languages` (English when nothing matches) and redirects, so the bare site URL lands on a readable homepage; it falls back to English without JavaScript. English is the x-default hreflang and the Organization homepage URL.

The homepage is an editorial discovery surface. Full brewing instructions and timelines exist only on recipe details. The comparison page compares original facts and source links, without ranking or adapting recipes.

## Data interfaces

Every recipe carries a `method` discriminator, and the schema is a Zod discriminated union of `pour-over` and `espresso`. Pour-over records require `water`; espresso records publish `yield` as the beverage in the cup and keep `water` optional for a stated water recipe only. A yield is never rewritten into a poured water amount, and `ratio()` for espresso divides the published yield by the dose. Pour-phase, bloom-share and accounted-addition maths return `null` for espresso, and `sourceFacts()` switches to shot time, yield, basket, pressure and pre-infusion.

Espresso-specific values live under `extraction`: `pressureBar`, `preInfusion` (seconds and/or bar), `basket` (id, name, grams, style), `puckPrep` keys and `purgeSeconds`. Steps gain `pressure` plus the actions `grind`, `dose`, `tamp`, `lock`, `preinfuse`, `extract`, `stop` and `purge`. `duration` on an espresso record is the shot time, including any pre-infusion the source counts inside it.

Temperature keeps the source's own unit: `temperatureUnit` is `C` by default, `F` when the source publishes Fahrenheit, and an optional `temperatureMax` carries a stated range such as 202–204 °F without conversion. `steps` may be empty when a source publishes parameters only; the detail page then shows a localized no-steps note and JSON-LD omits `recipeInstructions`. `image` is optional and falls back to the default Open Graph photograph rather than borrowing pour-over artwork. A header control can convert every displayed temperature to °C or °F in one click; a converted reading is prefixed with `≈`, a note names the source value, the preference persists locally, and the stored record and JSON-LD keep the published unit.

Comparison is limited to one method: `parseSelection` keeps the first recipe's method and reports the rest through `mismatch`, and `toggleSelection` refuses a cross-method addition. The homepage filter exposes `method` as a shareable query key. `brewer` holds the brewing device for both methods (a dripper or a machine); only its display label changes per method.

Optional source conditions are structured as `grinder` (identity and literal setting), `paper` (identity and optional shape), and `coffee` (name, origin, variety, processing, roast). The recipe’s `source` supports these fields. AND filters use the shareable query keys `grinder`, `paper`, `process`, `roast`; missing conditions do not match. Model names and source dial notation remain unchanged across locales; no setting conversion is performed.


`duration: null` means the source does not specify total brew time and displays the localized unknown label. Steps can carry their own `temperature`. See [analytics.md](analytics.md) for the optional GoatCounter integration.

- `content/recipes.json`: version 1 canonical recipe records. Validated by Zod in `src/lib/recipes.ts`.
- `content/equipment.json`: version 1 source-backed catalogue for drippers, kettles, grinders, filter paper and espresso machines. Validated by Zod in `src/lib/equipment.ts`; explicit recipe IDs connect equipment to the current recipe catalogue. Machine records use the `boiler`, `group`, `pump`, `preInfusion` and `tank` spec keys with `kg` and `l` units, and only carry values the manufacturer page states. Unresolved model records remain visible and are labelled rather than guessed. Material values use canonical IDs and render through nine-language `equipmentMaterials` translations. Prose detail values may carry an optional `valueKey`; the raw source value stays in the record while the UI and JSON-LD resolve the localized text through `equipmentValues` in all nine locales.

- `content/editorial.json`: source-independent editorial overlay for every recipe and equipment record. It stores concise overview metadata (recipe best-for, equipment role), up to three strengths, up to three considerations, and optional official image metadata. Canonical quantities and source links remain in the recipe/equipment files; this overlay must not change them.
- `content/equipment-experience.json`: optional equipment-specific cup-profile tags and public hands-on/community sources. An item can omit this layer when there is not enough specific evidence; the UI then says so instead of repeating generic pros and cons.
- `messages/{locale}.json`: full UI and recipe text in nine locales. Message keys, parameters, required recipe content and step instruction coverage are checked before publishing.
- `messages/editorial-{locale}.json`: nine-language editorial copy and translated equipment-material/trait vocabulary. `src/i18n/request.ts` deep-merges this overlay at build time so the UI can use the same message contract as the core catalogue.
- Numeric quantities, original units, exact/ranged times, author identity and source provenance live in canonical data; copy is localized separately.
- Steps may override the recipe’s water unit, and may provide their own translated instruction. Mixed g/mL source statements remain visibly distinct. Temperature distinguishes boiling water from an unspecified temperature; daily teaching and competition recipes have separate context labels.
- Null means unspecified, not zero. Scott Rao's total water is marked as derived from source ratio. Source dates remain explicit ISO dates rather than approximate relative dates.

## State and future integrations

Search (`q`), brewer, author, style, dose and selected recipe IDs (`ids`) live in query parameters. Shared links survive refresh and language changes. Invalid recipe IDs are excluded with a visible message. IDs are deduplicated and limited to three. Equipment-page search and category state are local UI state; equipment records link directly to their related recipes.

Data access, filtering, selection and UI are separate. A future CMS or API can replace the data loader while preserving recipe IDs and component contracts. Server features require a host with server support; GitHub Pages remains a static host.

## Search and AI discovery

Every localized page emits JSON-LD in addition to canonical and hreflang metadata. The layout supplies `Organization` and `WebSite`; collection pages add `CollectionPage` and `ItemList`; recipe pages add `Recipe`, `FAQPage` and `BreadcrumbList`; equipment records are represented as `Product` items with official specs and source links. Recipe pages also show a localized answer-first summary, a visible FAQ and related recipes so the same facts are available as text, not only as markup.

`pageMetadata` supplies per-page descriptions, Open Graph locales, a 1200×630 image, article timestamps for recipes and `max-image-preview:large`. `scripts/postbuild.ts` writes a sitemap with hreflang alternates and `lastmod`, an explicit AI-crawler policy in `robots.txt`, and `llms.txt`, then parses every exported page to verify its JSON-LD and discovery files.

Fonts are requested per locale: Latin locales load only DM Sans and Libre Baskerville, while CJK locales additionally load the matching Noto sans/serif pair. The homepage preloads its responsive hero image.

## Photography

The homepage keeps its editorial hero photography, but recipe cards and comparison headers remain text/data-first. Recipe details and equipment cards may show a credited image from the record's official source page. Images are hotlinked only when the source page exposes a usable HTTPS image URL; the credit links back to that page. Recipe details keep a localized neutral fallback, while equipment cards omit the image area entirely when metadata is missing or a request fails, so the content starts immediately without an empty cover. Collection or brand imagery is labelled with its actual source and is not presented as unique product evidence. The equipment index uses a native CSS-column masonry layout that adapts its column count to available width and allows cards to keep their natural content height. Design references are kept in the local ignored `outputs/design-concepts/` directory.

Equipment experience tags are deliberately separate from manufacturer specifications. They summarize recurring observations from named hands-on reviews or public community reports (for example, clarity/body differences between ORIGAMI Air and ceramic, or ZP6 clarity versus body trade-offs). They are not ratings, universal claims or recommendations; coffee, water, paper and technique can reverse the result.

## Verification and delivery

`npm run validate`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Build verifies every exported localized page has the correct HTML language and canonical URL, valid JSON-LD, metadata, sitemap alternates, AI crawler policy and `llms.txt`. GitHub Actions repeats checks and browser journeys before publishing main through Pages.

CI pins the official Ubuntu 24.04 hosted runner and tests with its preinstalled Chrome (`PLAYWRIGHT_CHANNEL=chrome`). The same Playwright suite runs without repeatedly downloading system fonts from the slow Ubuntu mirror. The website supplies explicit CJK serif/sans web fonts; ordinary system-font fallbacks remain available.

Deployment rollback: revert the offending main commit in a PR and rerun the same verified publishing workflow. Do not rewrite repository history to roll back.

The header language control is a disclosure of ordinary language links, not an ARIA application menu. Enter/Space opens it, Tab follows links, Escape closes and returns focus; outside click and focus leaving the control also close it. Language links preserve the localized path and query state.
