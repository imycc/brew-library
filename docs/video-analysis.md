# Video recipe viewing and analysis

This document records the watch pass for every recipe whose primary source is a YouTube video.
The machine-readable manifest is `content/video-reviews.json`; validation requires the two sets
to match exactly.

## Evidence boundaries

Two kinds of evidence are kept separate:

1. **Author-written numeric evidence** remains the authority for fixed values. It is stored in the
   video description and quoted in `source.evidence`.
2. **Video observation** covers what the creator demonstrates or explains: pour order, agitation,
   the reason for a choice, tasting language, approximate observations and conflicts with the
   description.

Automatic captions are used to locate and understand speech, not as a replacement for the
author-written numbers. Approximate or screen-only values do not move into fixed recipe fields.
Each review samples at least three video frames. Wölfl has no useful spoken caption track, so its
review explicitly relies on six frames and does not claim real-time verification.

## Result summary

| Recipe | Video evidence | Key result |
| --- | --- | --- |
| `rolf-v60-113` | English auto-caption; frames 0:18, 1:10, 2:10, 2:35 | Four equal pours, final swirl/tap, and a deliberate sub-three-minute target for clarity. One caption mis-hears 50 g as 450 g; the written description wins. |
| `rolf-origami-117` | English auto-caption; frames 0:30, 1:10, 2:10, 3:40 | 92 °C and a slow continuous second pour are explained; larger Origami brews and rested coffee are preferred. |
| `kasuya-neo` | Manual English caption; frames 12:50, 13:10, 15:46, 17:10 | Video adds an approximate 3:30 drain, V60 fallback, sweetness/body claims and the warning that 45 clicks can be thin. |
| `kasuya-iced-46` | Japanese auto-caption; frames 1:38, 3:05, 5:57, 7:01 | 4:6 and Switch hybrid are materially different; the hybrid remains a separate backlog record. |
| `woelfl-v60` | No useful speech captions; frames 0:05, 0:15, 0:25, 0:35, 0:45, 0:55 | A 67-second edited visual demonstration; it cannot verify the written 2:30–3:00 duration. |
| retired W60 test | English auto-caption; frames 0:30, 1:30, 3:35, 6:05 | April tests the W60; mesh alone is silty, mesh plus paper is cleaner but still flat/dull. Authorship was corrected, then the recipe was retired from the catalogue and retained on the W60 equipment record. |
| `hedrick-ultimate-pourover` | English auto-caption; frames 5:10, 6:36, 7:10, 9:20, 10:00 | Confirms the flexible framework, flow-based finishing actions, 20–21 % extraction and tasting claims. |
| `chronicler-osmotic-v60` | English auto-caption; frames 3:00, 3:40, 4:10, 4:54 | Confirms low-agitation centre-first pours; exposes a 40-second description versus 45-second narration conflict. |
| `wendelboe-tamana` | English auto-caption; frames 1:46, 1:52, 2:00, 4:10 | Description omits a loose method that the video demonstrates: ~100 g bloom, swirl, 30-second wait, aggressive remainder. |

## Important findings

### 1. Text-only review missed a wrong author

The W60 film is on Coffee with April's channel. Patrik Rolf identifies himself as the host,
performs the brew and gives the verdict. Pete Licata is the championship brewer for whom Hario
developed the device, not the presenter of this recipe. The video result is not positive: with
mesh alone the cup was too dirty, and with mesh plus paper it was cleaner but still flat and dull.
The failed experiment has therefore been removed from the recipe catalogue and retained on the
W60 equipment record as a source-backed use note.

### 2. Text-only review missed a demonstrated workflow

Tim Wendelboe's description lists only 36 g coffee, 600 g water and a Cafec Abaca+ filter. The
video then demonstrates roughly 100 g for the bloom, a gentle swirl, a wait of about 30 seconds,
and an aggressive pour for the remainder. The page now shows that rough sequence but keeps the
approximate bloom amount out of the fixed numeric fields. It also records that the local boiling
point at Finca Tamana is about 92–93 °C because of altitude.

### 3. Spoken and written sources disagree

Asser Christensen's description specifies a 40-second bloom, while the video narration says 45
seconds. The page keeps 40 seconds because it is the author-written numeric layer and records the
conflict in the review manifest and on the recipe page. The automatic caption for Rolf #113 once
mis-hears 50 g as 450 g; that is a caption error, not a recipe edit.

### 4. Video supplies context and tasting language

- Kasuya NEO: the written description omits total time; the video expects draining around 3:30,
  notes that 40 clicks is safer than 45, and describes sweetness, softened acidity and syrup-like
  body.
- Lance Hedrick: the video reports roughly 20–21 % extraction and describes low bitterness,
  citric acidity, sweetness and a velvety body.
- Coffee Chronicler: the video says soft water below 110 ppm and a wet-sand bed without surface
  silt are success cues.

### 5. Some methods should not be merged

Kasuya's iced film compares the 4:6 application with a Switch hybrid. The hybrid closes the valve,
pours to 150 g by 40 seconds, stays closed until 1:30, then opens, swirls and drains. It is not a
minor variant of the already-added 4:6 record and is left as a separate queued recipe.

## Review operation

For each primary video:

1. Fetch the spoken caption track and record its language and whether it is manual or automatic.
2. Read the full relevant instruction/demonstration segment with timestamps.
3. Sample at least three frames around setup, active brewing and result; Wölfl uses six because no
   useful speech track exists.
4. Compare the video with the author-written description and archive snapshot.
5. Record observations and conflicts in `content/video-reviews.json`.
6. Only promote a value into the fixed recipe model when the author-written numeric evidence is
   sufficient; otherwise use prose instructions, teaching or tasting notes and label approximation.

The stored observations are intentionally in English because they are internal evidence notes;
reader-facing equipment and retirement text is translated into all nine site locales.
