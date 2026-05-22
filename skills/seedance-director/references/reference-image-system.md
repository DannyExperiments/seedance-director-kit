# Reference Image System

## Default Rule

For premium Seedance work, author at least one still before the video run.

## File Handling For Browser Uploads

- Built-in image generation may save under `~/.codex/generated_images`.
- Browser automation tools may only upload from workspace-approved roots.
- Before uploading a generated still to Bubio, copy the selected image into the current project or an `output/seedance-director/` folder and upload that copy.
- Leave the original generated image in place unless the user explicitly asks to delete it.

## Reference Types

### First-Frame Still

Best when:
- exact opening composition matters,
- product or hero reveal framing matters,
- one still can lock identity, world, and lighting immediately.

### Shared-World Still

Best when:
- the whole clip should inherit a premium world,
- you want more freedom in the opening shot,
- you need stronger overall cohesion than a prompt-only run can provide.

### Character or Subject Reference

Best when:
- the identity itself matters,
- multiple clips will reuse the same subject,
- the user wants a custom protagonist, monster, vehicle, or branded object.

### Storyboard Sheet

Best when:
- body mechanics or camera rhythm matters,
- the scene needs a directed progression,
- you want to teach interaction grammar more than exact identity.

### Combined Contact Frame

Best when:
- two characters must start with credible geography,
- weapon contact or near-contact matters,
- action continuity has been failing with separate refs alone.

## GPT Image Prompt Craft

### Layout First

Define the artifact type before the subject:

- `16:9 first-frame still`
- `3x2 cinematic storyboard sheet`
- `premium product key art`
- `full-body character reference sheet`
- `shared-world scene still`

Then describe subject, environment, lighting, material response, and details.

### Public Action Safety Defaults

For broad public action trailers, make the scene intense without making the still look like graphic violence:

- prefer armored attackers, drones, silhouettes, or non-human threats,
- use sparks, rain, debris, broken glass, force waves, dust, and motion as impact language,
- avoid blood, gore, visible wounds, dead bodies, torture framing, and helpless victims,
- avoid excessive gun/shell-casing emphasis unless the user explicitly asks for gun action,
- keep the hero pose controlled and cinematic, not sadistic.

This is not only moderation hygiene. Cleaner non-gory action references are usually easier for Seedance to animate coherently.

### Exact Text And Branding

When labels or logos matter:

- quote exact visible strings,
- say they must remain crisp and legible,
- keep the real product source image in the workflow whenever possible,
- use edit-style invariants such as:
  - `preserve the original composition`
  - `keep the product straight and dominant`
  - `do not redesign the package`
  - `do not change the main logo text`
  - `keep aspect ratio exactly`

### Product / Commercial Images

For premium ad stills, structure the prompt around:

- canvas/aspect,
- product placement,
- environment and set dressing,
- materials and reflections,
- fluid, particles, smoke, splash, or condensation,
- lighting plan,
- render quality target.

### Multi-Reference Discipline

- Keep backgrounds and lighting aligned when separate refs will interact.
- If the user wants two characters fighting, separate refs can work well, but they should live in the same scene conditions.
- If needed, add a third composed reference representing the later contact or payoff beat.

### Reference Token Binding

Reference order is part of the prompt. After uploading images, make the first lines of the Seedance prompt map each asset to its role.

For Bubio, use the visible thumbnail order:

```text
REF MAP:
@ref1 = [opening first-frame / hero identity / product pack / storyboard sheet]
@ref2 = [enemy / second character / environment / final payoff frame]
@ref3 = [optional shared-world contact frame or later hero moment]
```

For official/API routes, adapt to the route's own labels, commonly `@Image1`, `@Image 1`, `Image 1`, or `[Image1]`.

Rules:

- Single first-frame: start with `Use @ref1 as the exact first frame.`
- Single style/identity reference: say `Use @ref1 for [identity/style/materials], but compose the camera freely.`
- Two interacting subjects: assign `@ref1` and `@ref2` before describing the action, and keep their backgrounds/lighting compatible.
- Storyboard plus subject refs: map the storyboard separately from identity refs, for example `@ref1 = storyboard rhythm`, `@ref2 = hero identity`, `@ref3 = environment`.
- Avoid generic `the attached image` unless the route does not expose reference labels.

## Storyboard Construction Rules

- Use clear panel hierarchy and readable framing changes.
- Favor strong key poses over tiny pose increments.
- If the storyboard is for action, keep the character facing the threat in every major beat.
- If camera movement matters, put it directly into the sheet with arrows and beat labels.
- For image-to-video use, a clean 16:9 beat-1 still is often stronger than using the entire sheet as the first frame.
