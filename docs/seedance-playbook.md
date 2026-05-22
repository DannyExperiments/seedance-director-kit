# Seedance Playbook

## Core Principle

Do not treat Seedance as a prompt-only tool for serious work.

For premium results, author at least one image first:

- first-frame still,
- shared-world still,
- character or product reference,
- storyboard sheet,
- or a hybrid set.

The still often sets the ceiling for the whole video.

## Strengths To Lean On

Seedance is especially strong at:

- cinematic motion and camera planning,
- physical plausibility,
- multi-beat 10s to 15s arcs,
- action and spectacle,
- stylized reference transfer,
- premium product/commercial polish,
- restrained emotional realism,
- and audio-visual scene texture.

## Known Weak Points

Be careful with:

- too many subjects at once,
- readable text inside the scene,
- overlong I2V prompts that overwrite the image,
- extension/continuation quality,
- complex edit instructions,
- and chaotic geography.

## Default Directing Loop

1. infer the brief,
2. choose the right reference strategy,
3. author the stills,
4. write the Seedance prompt,
5. submit,
6. set a heartbeat/checkpoint instead of passively waiting when the render is slow,
7. retrieve and return the MP4 in-thread,
8. critique,
9. save a run lesson,
10. change one variable at a time.

## Strategy Choices

### Prompt-only

Use for fast baselines and cheap exploration.

### First frame

Use when exact opening composition matters or when a single hero still captures the whole world correctly.

### Shared-world still

Use when the clip should inherit a premium world and visual taste even if the first shot may differ.

### Multi-reference

Use when multiple subjects, a product and environment, or a later payoff beat all need visual anchors.

After uploading multiple refs, put a ref map at the top of the prompt. For Bubio, use the visible order as `@ref1`, `@ref2`, etc. For API/official-style routes, use the provider's image labels such as `@Image1`, `@Image 1`, or `Image 1`.

### Storyboard

Use when motion logic, camera choreography, or interaction grammar matters.

### Hybrid

Use when quality matters enough that one image is not enough.

## Best Public Style Buckets

Strong Seedance work tends to cluster into:

1. premium cinematic realism,
2. stylized or anime action,
3. faux-UGC realism plus one uncanny hook,
4. ad/product visual polish,
5. VFX spectacle,
6. restrained drama and emotional realism.

Prompt architecture should match the bucket.

## Action Trailer Lesson

For action trailers, visual quality is not enough. A polished 15s clip can still fail if nothing changes. Avoid prompts where the subject simply holds a force field, levitates an object, stares down a threat, or sustains a pose for the whole runtime.

Require:

- immediate threat motion,
- hero physical reaction,
- environment displacement,
- escalation,
- decisive reversal/contact,
- final changed state.

If the concept is a superpower rescue or disaster stop, use a closer hero strain shot plus a wide payoff, or split into two clips. One wide first-frame tableau often creates a beautiful but static video.

## Motion Quality Gate

After rendering an action/trailer/fight/chase/disaster/superpower clip, run the local analyzer before final critique:

```zsh
zsh skills/seedance-director/scripts/analyze_motion.sh output.mp4 output-motion.json
```

This measures frame-to-frame displacement from a downsampled version of the MP4. It cannot tell whether the story is good, but it catches the common failure where the clip is visually expensive and nearly motionless.

Use the verdict this way:

- `static` or `weak`: do not call an action clip successful unless the user asked for a held beauty shot.
- `moderate`: review manually; slow-motion action may live here.
- `strong`: motion exists, but still judge identity, geography, physics, and hero moment.

The fix for a low-motion action clip is not "add more adjectives." The fix is a stronger action design: visible displacement every 2 to 3 seconds, environment reaction, one decisive contact/reversal, and a final frame that is materially different from the first.

## Pipeline Notes From API/I2V Work

- I2V works best when the prompt starts with `@Image1 as the first frame` or the current route's equivalent, such as `@ref1 as the exact first frame`.
- For I2V, keep prompts short. The image carries identity and composition; text carries action, camera, environment reaction, sound, and ending.
- Do not re-describe the referenced character's face/body unless the job is a transformation. Re-description can make the model reconstruct identity from text instead of trusting the image.
- For dialogue, isolate one speaker per shot and prefer medium framing. Multi-person lip sync is unreliable.
- For longer pieces, generate small shotlets from strong still frames and stitch. A multi-shot pipeline often beats one overloaded 15s prompt.
- With multiple references, put the most important anchor first and include a ref map in the prompt.
