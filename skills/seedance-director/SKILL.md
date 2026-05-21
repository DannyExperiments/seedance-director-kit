---
name: seedance-director
description: Direct end-to-end Seedance 2.0 video creation for any user. Use when the user wants Codex to take a rough video idea, choose the best Seedance strategy, author reference images or storyboard sheets, run Bubio or another Seedance route, retrieve outputs, critique results, and iterate toward more stunning videos.
---

# Seedance Director

## Overview

Use this as the public core skill for high-quality Seedance work. It is not tied to any one character, person, browser profile, or local habit. The job is not to finish the video the fastest way. The job is to direct the best possible Seedance video from the user's idea.

Default stance: for serious work, do not treat Seedance as prompt-only. Author at least one image first unless this is explicitly a text-only or baseline experiment.

## Operating Contract

1. Turn the user's idea into a concise brief: subject, world, emotional promise, style family, aspect ratio, duration, audio, and hero moment.
2. Choose the right strategy:
   - prompt-only for fast baseline tests,
   - first-frame still when opening composition matters,
   - shared-world reference still when overall world/style matters,
   - multi-reference when multiple subjects must stay coherent,
   - storyboard sheet when motion grammar or shot order needs guidance,
   - hybrid when quality is critical.
3. Author the needed stills with image generation before video submission.
4. Draft a Seedance-native prompt that lets the image carry identity while text carries motion, camera, environment reaction, and ending.
5. Run the generation through the user's available Seedance route:
   - a logged-in Bubio browser session,
   - the bundled Bubio automation runner via `zsh scripts/bubio_runner.sh` if appropriate,
   - another approved Seedance endpoint if the user uses one.
   - If Bubio is the route and no reusable session exists yet, prompt the user to log into Bubio once, then save and reuse the local session.
6. Retrieve the result, make a review sheet, and critique it.
7. Decide whether to keep, rerun, regenerate refs, split into shots, or simplify the ask.

## Guardrails

- Do not assume a specific browser profile, tab number, or character overlay unless the user or a separate overlay skill says so.
- Never ask for or store passwords. Reuse a logged-in browser session or saved local auth state.
- Do not submit credit-spending jobs unless the user has already authorized generation in that conversation or a standing approval exists.
- If Bubio authentication is missing or expired, explicitly ask the user to log into Bubio once before generation, then reuse the saved local session on future runs.
- For branded products or exact package fidelity, treat visible text/logo as an invariant and keep the original product asset involved.
- Do not assume a whole multi-panel storyboard should be used as `First Frame`; often it should be reference guidance only.

## References To Load

- Read `references/operating-system.md` at the start of a real Seedance job.
- Read `references/reference-image-system.md` when you need to author stills, storyboards, or branded/product refs.
- Read `references/prompt-architectures.md` when drafting or adapting prompts.
- Read `references/bubio-fast-path.md` when setting up or using the bundled Bubio runner.
- Read `references/review-loop.md` after generation or when planning an autonomous retry loop.
- Read `references/handoff-prompt.md` when the user wants to share this skill or quickly onboard another Codex.

## Output Shape

For a normal execution request, provide:

- the brief you inferred,
- the strategy you chose and why,
- the authored image/ref plan,
- the Seedance prompt,
- the generated output paths if media was created,
- a short critique with the next improvement move.

For a setup/share request, provide:

- the one-line invocation,
- the handoff prompt,
- any local prerequisites the other user must satisfy once, such as logging into Bubio.
