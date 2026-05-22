# Review Loop

## Delivery First

The user should not have to open Bubio to see the finished clip.

After a generation completes:

1. download or otherwise retrieve the MP4 locally,
2. return the video directly in the thread when the client supports local media display,
3. make a frame/review sheet,
4. return the review sheet in the thread when possible,
5. then critique the result.

For Codex Desktop, use absolute-path media embeds:

```markdown
![Generated video](/absolute/path/to/output.mp4)
![Review sheet](/absolute/path/to/review-sheet.jpg)
```

If the client cannot render local media, still provide the absolute output path and critique from the retrieved file. Do not ask the user to go back to Bubio just to inspect the result.

## Review Standard

Do not judge a clip by the first second alone. Pull a frame sheet and evaluate the whole arc.

Use `zsh scripts/make_review_sheet.sh input.mp4 output.jpg [fps]`.

Recommended sampling:

- 5s clip: 6 fps
- 10s clip: 4 to 6 fps
- 15s trailer/action clip: 3 to 5 fps

## Score Rubric

Score 0 to 2 each:

1. identity or subject preservation,
2. motion clarity,
3. camera coherence,
4. physical realism,
5. prompt following,
6. audio fit,
7. hero moment or ending hold,
8. artifact rate.

Accept around 12/16 or higher unless the user wants pure experimentation.

## Diagnose The Failure Source

### UI / Retrieval Problem

Likely if:
- a visible `Render failed` card appears before the new job was submitted,
- the failed card prompt does not match the current prompt,
- the failed card has the wrong refs, aspect, or old timestamp,
- clicking the feed opened an old card behind the prompt editor.

Fix:
- close the stale card,
- return to the prompt editor,
- verify current refs, aspect, duration, and cost,
- submit only after matching the current job state,
- after generation, match result cards by prompt/timestamp/nearby metadata rather than the first visible card.

### Prompt Problem

Likely if:
- the action arc is wrong,
- the camera behavior is vague or random,
- too many unrelated events were requested.

Fix:
- simplify,
- shorten,
- restore one dominant action,
- move camera instructions earlier,
- reinforce the ending image.

### Reference Problem

Likely if:
- identity drifts repeatedly,
- composition feels wrong from the start,
- the product label mutates,
- two-subject interaction gets spatially weird.

Fix:
- regenerate the still,
- switch from portrait to 16:9,
- align backgrounds across refs,
- add a composed contact frame.

### Storyboard Problem

Likely if:
- the video shows the sheet itself,
- panel order is not respected,
- arrows/text leak into the world.

Fix:
- use the sheet as `Reference`, not `First Frame`,
- strip text/arrows for cleaner control,
- extract beat-1 into a clean first-frame still,
- split into per-shot stills when precision matters.

### Model Variance

Likely if:
- one take is excellent and another is buggy from the same setup.

Fix:
- keep the concept,
- generate more takes,
- curate rather than overreacting.

## Autonomous Loop Guidance

If generation is slow, do not waste the whole turn waiting idly if a resume/heartbeat path exists. Preferred loop:

1. prepare the job,
2. submit,
3. set a wake-up or checkpoint,
4. on return, retrieve the result,
5. critique it,
6. store the lesson,
7. decide whether one more targeted retry is worth it.

## Lesson Logging

Every finished run should produce one compact lesson:

- what strategy was used,
- what clearly worked,
- what clearly failed,
- what to keep constant next time,
- what single variable to change next.
