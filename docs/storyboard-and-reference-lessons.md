# Storyboard And Reference Lessons

## Storyboards Are Not Magic Animatics

A multi-panel storyboard sheet does not usually force exact panel-by-panel order.

What it does well:

- teaches motion rhythm,
- teaches spatial logic,
- teaches body mechanics,
- teaches shot escalation,
- and teaches mood.

## Best Uses

### Whole sheet as Reference

Good for:

- trailer rhythm,
- camera mood,
- action grammar,
- world cohesion.

### Single beat as First Frame

Good for:

- exact opening composition,
- exact product hero frame,
- exact initial geography.

### Per-shot stills

Best for:

- precise continuity,
- readable action geography,
- multi-character combat,
- and edit-ready sequences.

If exact action order matters, prefer per-shot stills over one dense storyboard sheet. A sheet can teach grammar; a single clean still can anchor a generated shot.

## Practical Lessons

- Use 6 to 10 strong beats instead of 16 tiny pose changes for cinematic action.
- Motion sheets are better at rhythm than exact sequencing.
- For mechanical pose reference, a grayscale grid can work well because it removes background competition and focuses the model on body mechanics. For cinematic continuity, convert the key beats into clean scene stills before generation.
- If a sheet contains arrows, labels, or panel borders, use it as reference guidance rather than literal first frame unless the whole graphic look is intentional.
- If action continuity keeps failing, create a combined contact frame where both subjects already share the same world and geography.
- When two separate refs interact, keep the background, sky, lighting, and color temperature almost identical.
- Bind each uploaded image in the prompt by order. In Bubio: `@ref1 = storyboard`, `@ref2 = hero`, `@ref3 = enemy/contact/payoff`. In API routes, adapt to that provider's image-token syntax.

## Action-Specific Rule

For high-speed combat, ask Seedance for:

- controlled blur,
- 2 to 3 readable impact snapshots,
- clear cause and effect,
- and a strong final hold.

Do not try to narrate every strike.

Use the storyboard to define readable geography:

- who faces whom,
- which side each subject starts on,
- where the camera begins,
- where the camera moves,
- and what object or surface proves cause and effect.

## Action Trailer State Change

Do not mistake a high-quality reference still for a complete action plan. A strong image can make the whole video beautiful, but if the prompt mostly asks Seedance to sustain that image, the result becomes a static VFX tableau.

For action trailers, design the storyboard or reference sequence so the final state is visibly different from the opening:

- the threat moves first,
- the hero reacts with readable body mechanics,
- the environment accelerates or breaks,
- one decisive reversal/contact happens,
- and the last beat shows a changed world, saved object, fallen threat, or positional advantage.

When one 15-second shot is too much, split the intent into a close hero-strain shot plus a wide payoff shot.
