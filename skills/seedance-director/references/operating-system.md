# Seedance Director Operating System

## Core Doctrine

- The goal is not speed alone. The goal is a stunning result.
- Image quality strongly correlates with final video quality.
- Default to authoring at least one image first: first-frame still, shared-world still, character ref, enemy ref, product key art, or storyboard sheet.
- Prompt-only is a baseline, not the premium path.

## What Seedance Is Good At

- Complex motion and interaction.
- Physical plausibility and temporal coherence.
- Cinematic camera planning.
- Multi-beat 10s to 15s progression.
- Reference-guided style and identity transfer.
- Action, sports, VFX spectacle, product polish, and subtle emotional realism.

## What Seedance Still Struggles With

- Multi-subject consistency over long or chaotic clips.
- Readable text in-scene.
- Complex editing and non-target-preserving edits.
- Extension/continuation quality.
- Overwritten identity when I2V prompts over-describe the attached subject.

## Strategy Decision Tree

### Use Prompt-Only

Use when:
- the user wants a fast baseline,
- the scene is simple and identity does not matter,
- the run is exploratory.

### Use First Frame

Use when:
- opening composition matters,
- product framing must be exact,
- a single hero still already captures the world and geography,
- one subject must inherit a specific pose/look/lighting setup.

### Use Shared-World Reference

Use when:
- the clip needs a premium visual ceiling,
- the world/look/material palette matters more than the exact first shot,
- you want Seedance to compose the opening more freely while inheriting taste.

### Use Multi-Reference

Use when:
- multiple characters or subjects must remain stable,
- a product plus environment both matter,
- a later contact/composition beat needs a dedicated extra reference.

Keep backgrounds and lighting nearly identical across refs when the characters will interact. Small mismatches in sky, color temperature, or location rendering can poison the cohesion.

### Use Storyboard

Use when:
- motion grammar matters,
- camera choreography matters,
- a fight or chase has distinct readable beats,
- the user wants a trailer-like progression.

Do not assume a full storyboard sheet should be uploaded as `First Frame`. A whole sheet often works better as `Reference`, while a clean beat-1 still works better as `First Frame`.

## Storyboard Rules

- Use 6 to 10 strong beats, not 16 micro-variations, for most cinematic work.
- Storyboards teach motion grammar and spatial logic better than they teach exact identity.
- For exact continuity, split storyboard beats into separate shot stills and generate per shot.
- For action sheets, compress the middle into readable action abstraction rather than trying to enumerate every hit.
- Translate arrows and icons into camera verbs in the prompt. Do not ask Seedance to literally read the diagram.

## Style Families

Public prompt patterns cluster into a few strong families:

1. premium cinematic realism,
2. stylized or anime action,
3. faux-UGC realism plus one surreal break,
4. ad or product polish,
5. VFX spectacle,
6. restrained emotional realism.

Choose the architecture first, then the scene details.

## Bubio / Execution Notes

- Prefer a logged-in user session or saved local auth state.
- If a local Bubio runner exists, it can be faster than screenshot-driven clicking.
- If using browser automation, match the completed result by prompt/timestamp or nearby card metadata, not by the first visible video node.
- Save finished MP4s immediately if the route exposes signed temporary URLs.

## Bubio First-Run Browser Pitfalls

- If Bubio is logged out, pause and ask the user to log in once. Never ask for or store the password.
- First-run onboarding overlays can intercept clicks. Close any tutorial/coachmark overlay before changing modes or settings.
- Bubio can leave old result cards under the floating prompt editor. A visible `Render failed` card is not evidence that the current job failed unless it matches the current prompt, refs, and timestamp.
- After uploading media, verify the attached ref count and remove accidental stale refs before generation.
- Bubio may default to `1:1` and `5s`. Explicitly set the requested aspect and duration, then verify the visible `Generate` cost before submitting.
- If the UI cannot reach the requested duration, choose the closest available duration and say so before submitting.
