# Video recipe backlog

Working queue for video-sourced recipes. One row per candidate; statuses are `queued`,
`added`, `near-miss` or `rejected`. Batches land three records at a time.

Rules (see `docs/research.md` for the reasoning):

- pour-over only — hot or iced; espresso, AeroPress and immersion-only are out;
- the numbers must exist in the **author's own text layer** (video description, official
  transcription, or the creator's own page). Screen-only numbers are not publishable;
- worldwide: world champions, world finalists, national champions, globally known educators;
- unknowns stay `null`; ranges go into `doseMax` / `waterMax` / `temperatureMax`;
- the verbatim sentence lives in `source.evidence`, in its original language;
- the creator's teaching is rewritten as `teaching` bullets in nine locales, linked to steps.

## Queue

| # | Person | Credential | Video | Published | Lang | Fields in the description | Status |
|---|---|---|---|---|---|---|---|
| 1 | Patrik Rolf | WBrC 2019 runner-up, April | [Coffee with April #113](https://www.youtube.com/watch?v=otk2jFRCcmE) | 2020-04-10 | EN | 13 g / 200 g / 90 °C / 50 g ×4 / 2:30 / coarse | **added** `rolf-v60-113` |
| 2 | Patrik Rolf | as above | [#117 Origami](https://www.youtube.com/watch?v=WMPmZ9oXV6E) | 2020-05-01 | EN | 20 g / 300 g / 92 °C / 100 g + 200 g 0:45–1:20 / 2:30 | **added** `rolf-origami-117` |
| 3 | Tetsu Kasuya | WBrC champion 2016 | [最新式ドリップレシピ](https://www.youtube.com/watch?v=k0nsShguOsU) | 2026-05-29 | JA | 20 g / 300 g / 1:15 / 95–96 °C / 40–45 clicks / 30 g ×10 every 15 s / NEO | **added** `kasuya-neo` |
| 4 | Tetsu Kasuya | as above | [急冷アイス 4:6 vs ハイブリッド](https://www.youtube.com/watch?v=v0CXzmw1TXg) | 2026-08-21 | JA | 20 g / 150 g water + 80 g ice / 90–93 °C / 28 clicks / 30 g ×5 | queued (batch 2) |
| 5 | Martin Wölfl | WBrC champion 2024 | [Filterkaffee zubereiten](https://www.youtube.com/watch?v=bZ2i4ewFSLk) | 2021-01-12 | DE | 20 g / 300 ml / 93 °C / bloom vol+time / 240 ml rest / 2:30–3:00 | queued |
| 6 | Stefanos Domatiotis | WBrC champion 2014 | [Filter Coffee Chemex](https://www.youtube.com/watch?v=Zmg-WVcX84Q) | 2021-01-10 | EL | 24 g / 600 ml / 6 g per 100 ml / Chemex — no temp, grind or timeline | queued (sparse) |
| 7 | Pete Licata (guest) | WBC champion 2013 | [Mesh/Paper/Both: Hario W60 #210](https://www.youtube.com/watch?v=M23NG4kNLAU) | 2022-03-18 | EN | 12 g / 200 g / 100·50·50 g at 0:00·0:35·1:05 / 4:00 / D50 611 µm | queued |
| 8 | Lance Hedrick | leading educator | [ULTIMATE POUROVER](https://www.youtube.com/watch?v=BG5Tc8MR2_4) | 2022-11-26 | EN | ratio 1:14–1:17 / 85–100 °C / bloom 3× dose / 6–8 g/s | queued (ranges) |
| 9 | Asser Christensen | Coffee Chronicler | [Osmotic Flow V60](https://www.youtube.com/watch?v=Az01iNS1xnQ) | 2021-01-05 | EN | 1:15 / 14–20 g / 93 °C / bloom mass+time / 3–5 min | queued (ranges) |
| 10 | Tim Wendelboe | WBC 2004 | [How I Brew at Finca Tamana](https://www.youtube.com/watch?v=K54NbGql73g) | 2025-06-13 | EN | 36 g / 600 g / boiling / Cafec Abaca+ — no grind, pours or time | queued (sparse) |

## Checked and excluded

| Person | Where | Why |
|---|---|---|
| Matteo D'Ottavio | own channel, V60 films | descriptions are affiliate boilerplate — zero figures |
| Chad Wang (WBrC 2017) | own channel | no numeric recipe video; event footage belongs to a machine brand |
| Du Jianing (WBrC 2019) | Bilibili | no self-authored YouTube text layer |
| Bayu Prawiro (WBrC 2025 runner-up) | brand / recap channels | numbers only via Fugol and Chemicoffea restatements |
| Hsu Shih Yuan · Emi Fukahori · Odd-Steinar Tøllefsen · Matt Winton · James McCarthy | — | no self-authored numeric video found |
| Elysia Tan / Homeground | [Ice Ice Baby](https://www.youtube.com/watch?v=D0AP5yN18Bw) | iced pour-over, but the description is links only |
| Kasuya iced 2022 | `TfSBzFeoL4s` | chapters only; numbers on screen |
| Kyle Rowsell | [Championship V60](https://www.youtube.com/watch?v=sCR3w9ZaizQ) | re-states Chad Wang's recipe — third party |
| Hoffmann (Ultimate V60, iced ×2, Switch ×Sibaris) · Rao V60 · Licata's own W60 · Kurasu iced | — | chapter lists or links only |
| Wölfl · Fukahori · Hsu · Prawiro · Du · Winton · Camber on European Coffee Trip / Chemicoffea / Brodie Vissers / HARIO Official | — | third-party restatements; usable as cross-checks only |

Regional coverage so far: SE, AT, GR, JP publish numbers themselves. TW, CN, ID, IT, NO, CH
checked — screen-only or third-party only. The queue is wide but thin by design.
