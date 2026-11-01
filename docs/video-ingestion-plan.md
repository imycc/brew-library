# Video recipe ingestion plan

Status as of 2026-11-01. This is the repository copy of the work described by the Qoder plan
`/Users/yc/.qoder-cn/plans/snowy-mesa-grouse.md`. The repository copy is canonical once merged;
the Qoder file remains the historical planning source.

## Qoder completion audit

The completed Qoder work associated with this repository is already in `origin/main` through the
merged PR series. The notable groups are:

| Qoder workstream | Repository outcome | State |
| --- | --- | --- |
| SEO/AIO foundation | PR #14 and later JSON-LD/source checks | Synced |
| Equipment catalogue and localization | PRs #8–#17, #24, #28 | Synced |
| Homepage/recipe-detail redesign | PRs #6–#7 and subsequent UX work | Synced |
| Recipe enrichment and provenance | PR #18 and follow-up fixes | Synced |
| First iced recipe and model | PRs #20–#21 | Synced |
| Rename to `brew-library` | PR #22 | Synced |
| Espresso model, equipment and first recipes | PRs #23–#26 | Synced |
| Video batch 1 | PR #29 | Synced |
| Video batch 2 | PR #30, follow-ups #31–#33 | Synced |
| Source-supported editorial corrections | PR #35 | Synced |
| Learning and decision-focused UX | PR #36 | Synced |
| Low-sensitivity UX telemetry | PR #37 | Synced |

No completed Qoder task produced an unmerged repository delta that should be copied over the
current branch. Two Qoder items remain explicitly pending and are outside this video task: a
dedicated `/espresso/` landing page and espresso cover artwork.

The missing item was not code synchronization but plan quality: the Qoder plan did not require
actual viewing of the videos. That gap is corrected here and in validation.

## Canonical rules

- Pour-over only, hot or iced. Espresso, AeroPress and immersion-only methods use a different
  ingestion path.
- **Numeric evidence:** fixed doses, water, temperature, times and ratios come from the author's
  numeric text layer. Screen-only and approximate spoken values do not enter those fields.
- **Video review:** every video-primary recipe must be watched using a timestamped caption track
  and sampled frames. The review records what the creator demonstrates and explains, tasting
  language, and conflicts with the written layer.
- If no useful speech caption exists, the review must say so and rely on explicit frame sampling;
  it may not imply full spoken coverage.
- Unknowns stay `null`. Ranges use `doseMax`, `waterMax` and `temperatureMax`. A pure upper bound
  uses `doseLimit: "upTo"`.
- Verbatim author wording for published numbers remains in `source.evidence`.
- Reader-facing teaching is our short rewrite and must resolve in all nine locales.
- Batches contain three records. A recipe is not complete until its review manifest, backlog row,
  source archive, translations and browser checks all pass.

## Required review artifacts

1. `content/video-reviews.json` — one machine-checked entry per video-primary recipe: source video
   id, review date, caption language/type, sampled timestamps, observations and conflicts.
2. `docs/video-analysis.md` — human-readable analysis of evidence boundaries, findings and
   across-video corrections.
3. `docs/video-backlog.md` — queue status and next candidates.
4. Recipe fields — only values supported by the appropriate evidence layer.

`npm run validate` fails when a video-primary recipe lacks a review entry, uses the wrong video id,
has fewer than three sampled timestamps or has no observations.

## Current completion state

### Batch 1

- Patrik Rolf, V60 #113
- Patrik Rolf, Origami with V60 paper #117
- Tetsu Kasuya, NEO multi-pour

### Batch 2

- Tetsu Kasuya, iced 4:6
- Martin Wölfl, V60
- Coffee with April / Patrik Rolf, Hario W60 test — reviewed, then retired from recipes

The W60 record was corrected after video review: it is not a Pete Licata-authored recipe, and the
filmed result was an exploratory negative result. Because the creator did not recommend the result,
the recipe was removed from the catalogue; its evidence remains on the W60 equipment record. The
previously deployed `licata-w60` URL is retained as a noindex retirement page linking to the W60
equipment record and Ngoc Hoang's accepted W60 recipe.

### Batch 3

- Lance Hedrick, adaptable all-pour-over framework
- Asser Christensen, osmotic-flow V60
- Tim Wendelboe, Finca Tamana field brew

Eight active video-primary records now have a completed review manifest; the ninth reviewed source
(the April W60 test) is intentionally retired from the recipe catalogue and preserved as equipment
evidence.

## Next queue

- Kasuya iced Switch hybrid — already watched; materially different valve method from the added
  4:6 version.
- Stefanos Domatiotis, Chemex — sparse written recipe; requires video review before ingest.
- Continue the worldwide candidate search only after resolving whether a candidate has both a
  publishable numeric text layer and a watchable method with enough explanatory value.

## Per-batch runbook

1. Re-fetch the author-written description and record the upload date.
2. Read the full relevant video segment with a timestamped caption track.
3. Sample setup, active method and result frames; record the timestamps.
4. Add the review manifest entry and note every text/video conflict.
5. Extract author teaching and tasting claims, separating observation from fixed numbers.
6. Snapshot the video page and verify the archive contains the numeric text.
7. Implement three records with nine-locale copy, editorial traits and equipment links.
8. Update the backlog and analysis document in the same change.
9. Run `npm run validate`, `npm run typecheck`, `npm test`, `npm run build` and
   `npm run test:e2e`.
10. Publish through one focused pull request and verify the deployed pages.
