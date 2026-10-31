# Design QA

## Visual truth and evidence

- Homepage source: `outputs/design-concepts/01-coffee-editorial.png`, 1487 × 1090 pixels. The user selected this original homepage and explicitly moved detailed brewing instructions and the timeline to the detail page.
- Detail source: `outputs/design-concepts/05-detail-editorial.png`, 1159 × 1358 pixels. Supplementary generated reference, adapted for accurate source content and responsive reading.
- Comparison source: `outputs/design-concepts/07-compare-editorial.png`, 1487 × 1058 pixels.
- Mobile source: `outputs/design-concepts/06-mobile-home.png`, 872 × 1804 pixels. A directional reference rather than a fixed CSS viewport; the implementation keeps readable controls and the complete filter set.
- Implementations: `docs/qa/home-implementation.webp`, `detail-implementation.webp`, `compare-implementation.webp`, `mobile-implementation.webp`.
- Full-view paired comparisons: `docs/qa/home-comparison.webp`, `detail-comparison.webp`, `compare-comparison.webp`. Source is on the left, implementation on the right. Each is proportionally normalized to 1000 pixels wide; no pixel-equality claim is made for the different-aspect detail reference.
- Focused hero comparison: `docs/qa/hero-focused.webp`. Source above, implementation below, both 1487 × 515 pixels.
- Browser capture viewport: 1487 × 1090 CSS pixels for homepage/detail, 1487 × 1058 for comparison, 390 × 844 for mobile. Device scale factor 1. Detail/mobile captures include the full scrollable page. Detail implementation is 1487 × 2012 pixels; mobile implementation is 390 × 2458 pixels.
- Homepage state: Traditional Chinese, one selected recipe (`ids=kasuya-46`). Comparison state: Kasuya plus Hoffmann. Detail state: Kasuya original HARIO teaching version.

## Findings and correction history

1. **P2, mobile hero text contrast.** The wide desktop photo placed leaves and equipment behind mobile supporting text. Fixed by generating a separate mobile composition with an ivory text area; post-fix evidence: `mobile-implementation.webp`. No viewport overflow was observed at 390 CSS pixels in Traditional Chinese, Japanese or German.
2. **P2, comparison tray obscuring the comparison/detail reading surface.** Fixed by limiting the floating tray to browsing surfaces. Detail and comparison now preserve their own controls without a redundant overlay. Post-fix evidence: `detail-implementation.webp` and `compare-implementation.webp`.
3. **P2, desktop discovery density.** Initial secondary cards extended their actions behind the comparison tray. Reduced the hero's excess vertical padding, made the extra filter row compact, and restored short author/title summaries without extra secondary-card parameters. Post-fix homepage capture shows all recipe actions above the tray.
4. **P2, long-language tablet navigation.** Collapsed navigation into a working menu at tablet widths. Browser checks at 768 CSS pixels passed for German, French and Brazilian Portuguese; mobile checks also cover three selected recipes.

## Required fidelity surfaces

- **Typography:** Noto Serif TC/JP/KR and Libre Baskerville provide the editorial display hierarchy, with DM Sans and explicit Noto Sans TC/JP/KR web fonts for UI. Names and titles wrap rather than being clipped. Body text remains readable on mobile; long locale labels were tested. Native-language editorial review remains separate from technical translation coverage.
- **Spacing/layout:** Original split photographic homepage, spacious title/search, featured recipe plus two smaller summaries, fine rules and compact comparison tray are retained. Full instructions/timeline are absent from the homepage and present on details only. Extra filter controls, verified-source metadata and an additional comparison ratio/version row intentionally add content beyond the mock.
- **Colors/tokens:** Warm ivory paper, dark ink, warm grey secondary text, thin sand rules and caramel action buttons. Clear focus outlines and a high-contrast language control are deliberate accessibility improvements.
- **Images/assets:** Independently generated hero, mobile hero, coffee-bloom and brewer-still photography; responsive AVIF/WebP output. Phosphor supplies interface icons. No UI screenshot is used as the app, and no product illustration is substituted with CSS drawings. Photos are editorial illustrations, identified as AI-generated on the sources page.
- **Copy/content:** All interface and recipe instructions are localized in nine languages. Original units and ranges remain intact. The published HARIO late-pour times are corrected to 2:10 and 2:40; Scott Rao's Pulsar record replaces the unsupported numeric V60 mock content. Missing source facts remain explicit.

## Functional and browser evidence

- Nine locales, 63 localized static pages, correct HTML language and canonical URLs verified during export.
- Six data/core-logic tests passed, including original units/times, derived water quantity, combined filters, invalid selection and the three-recipe limit.
- Full 14-test browser run passed before the final typography/tablet adjustment. Changed surfaces were then recaptured and targeted homepage, mobile, tablet and visual tests passed; the PR workflow runs the complete 15-test suite against the final commit.
- Tested browser flows: search, conflicting filters, no-results reset, three selections, comparison refresh/share URL, language switching that preserves IDs, invalid links, original source links in rendered pages, mobile menu and viewport containment.
- In-app browser inspected the rendered homepage; captured console warning/error log was empty. Automated locale journeys recorded no page exceptions.

## Follow-up polish and limits

- P3: The independently regenerated photography is intentionally not pixel-identical to the concept image.
- P3: Some translated titles wrap differently; language-specific editorial typography can be refined after user feedback.
- First release contains three completely checked recipes; April's unavailable legacy source pages remain in the research backlog.
- Physical-phone acceptance and native-speaker review are not claimed by browser QA.

## Implementation checklist

- [x] Preserve the selected original homepage style.
- [x] Show detailed brewing steps and timeline only on recipe detail pages.
- [x] Correct source-derived recipe facts and expose provenance.
- [x] Check desktop, mobile and long-language tablet layouts.
- [x] Capture and inspect post-fix paired and focused visual evidence.
- [x] Resolve actionable P0/P1/P2 findings before release.

final result: passed

## 2026-10-28: source expansion and language control

- Replaced the header’s white native-select box with a quiet text disclosure and a nine-language link list. Confirmed the reported 846×853 viewport and 320/390 px widths; screenshots in `docs/qa/language-{closed,open}.webp`.
- Confirmed keyboard opening, Escape focus return, outside click, and retained recipe/filter/comparison query state when switching languages.
- Expanded the library from three to eight official-source records; updated browser coverage for every new recipe in all nine locales, real fourth-recipe comparison rejection, Switch filtering, unknown temperatures and retained g/mL discrepancies.
- A stale local export initially omitted the new brewer options. Rebuilt with the data-driven option list; the focused filter/comparison and source-instruction journeys passed. The PR pipeline rebuilds and reruns the full suite.

## 2026-10-28: adaptive equipment layout

- Replaced the fixed, equal-row equipment grid with native CSS columns at a 300 px preferred card width. The layout resolves to four columns at the 1487 px desktop viewport, scales through intermediate widths, and collapses to one column on a 390 px mobile viewport.
- Equipment cards keep their natural content height and cannot split across columns. Cards without verified official artwork now omit the cover region entirely; failed external image requests use the same behavior. Recipe detail fallbacks are unchanged.
- Browser coverage now asserts the 300 px column contract, the one-column mobile result and the absence of an image element for `ek-unspecified`. Desktop and mobile full-page captures were visually inspected in `outputs/qa/equipment-{desktop,mobile}.png`.
- Local verification: typecheck, data validation, 11 unit tests and production static export passed. The full 23-test browser run had 20 passes and 2 environment-dependent skips; one pre-existing tablet navigation test hit a 30-second external-resource load timeout and passed immediately when rerun alone.

## 2026-10-28: homepage recipe index redesign

- Replaced the mixed 2fr/1fr/1fr text grid and full-width twin buttons with one full-width lead record (title, summary, 2×2 spec table, source) followed by a compact index grid. Each card now carries a single quiet detail link and a compact compare toggle.
- Card titles drop the repeated `Author · ` prefix already shown in the record meta. Spec values are an icon-labelled inline line; long localized values move as whole items to a second line instead of truncating.
- Grid breakpoints: four columns ≥1400 px, three at 1040–1399, two at 761–1039, one at ≤760. Probe of 320/390/768/900/1150/1487/1920 px in zh-Hant, en, de, fr and ja reported no page or element overflow.
- Evidence: `outputs/qa/home-recipes-desktop.png`, `outputs/qa/home-recipes-mobile.png`. The static build and 16 data tests passed; the full browser run had 20 passes and 2 environment skips, with one recipe-page external-image load timing out at 30 s and passing immediately on rerun.

## 2026-10-31: educational foundation

- Added a nine-language brewing field guide with a four-step learning loop, source/derived/editorial labels, a controlled-brew lab, taste-investigation prompts and eight curated recipes.
- Recipe details now expose a derived learning level, a four-part learning brief and a method-aware timeline. The eight curated recipes add source-step checkpoints and one editorial variable-isolation experiment; the UI states that these are practice guidance rather than author claims. Espresso ranges use start/end phases and place the final yield at the stop time instead of at `0:00`.
- Pour-over and espresso tabs now use method-specific introductory copy and brewer/machine labels. Searchable recipe text includes overview, best-for, preparation, author teaching, source-stated tasting notes and instructions.
- Missing recipe images collapse to a short source note, and equipment imagery is compressed so specifications enter the viewport sooner.
- Comparison now opens with a plain-language summary of differing, matching and compared parameters, marks changed rows, and can hide matching rows. Mobile switches from a wide table to snap-scrolling recipe cards; no row labels are clipped off-screen.
- Equipment adds source-backed decision filters for records with hands-on experience and records linked to original recipes. The controls are derived from existing evidence rather than a new popularity or quality score.
- Visual evidence: `outputs/qa/learn-desktop.png`, `outputs/qa/learn-mobile.png`, `outputs/qa/home-desktop.png`, `outputs/qa/detail-desktop.png`, `outputs/qa/detail-mobile.png`, `outputs/qa/compare-summary-desktop.png`, `outputs/qa/compare-cards-mobile.png`, `outputs/qa/equipment-decision-desktop.png`. The mobile recipe detail was checked for horizontal overflow. The production export generated 459 localized pages; data validation, TypeScript, 35 unit tests and the browser suite passed (34 passed, 2 analytics tests skipped without a tracking code).
