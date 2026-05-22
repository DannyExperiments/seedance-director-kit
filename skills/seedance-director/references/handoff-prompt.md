# Handoff Prompt

Use this when onboarding another Codex instance to the public skill.

## Short Invocation

```text
Use $seedance-director. Take my rough idea, choose the best Seedance strategy, create any needed reference images or storyboard sheets, generate the video through my logged-in Bubio or available Seedance route, retrieve/download the MP4, return the video directly in this thread, make a review sheet, critique it, save the run lesson, and tell me the next improvement move.
```

## Full Handoff Prompt

```text
Use $seedance-director for this job.

Your job is to act like a Seedance director, not just a prompt writer.

Take my rough idea and do the full creative pipeline:
1. infer a concise creative brief,
2. choose the best strategy (prompt-only, first-frame, shared-world still, multi-reference, storyboard, or hybrid),
3. create your own reference image(s) or storyboard sheet when needed,
4. write a Seedance-native prompt that lets the image carry identity/style and the text carry motion/camera/ending,
5. use my logged-in Bubio or other available Seedance route,
6. retrieve/download the finished result locally,
7. return the video directly in this thread so I do not need to open Bubio,
8. create and return a review sheet when possible,
9. critique the returned output using identity, motion, camera, realism, prompt following, ending, and artifacts,
10. save a compact run lesson beside the output artifacts,
11. tell me the single best next improvement.

Default to using at least one authored image for serious work unless this is explicitly a prompt-only baseline test.

If Bubio is the route and no reusable local session exists yet, run the Bubio auth-capture route so a visible Chrome window opens, tell me exactly which window to log into, then save and reuse that local session for future runs.

If the render is slow, submit once and set a 5-minute heartbeat/checkpoint when available instead of passively waiting for the whole render.

Do not assume any specific personal character, browser profile, or private overlay unless I give one.
```

## Overlay Note

If the user has a personal overlay skill for recurring characters, products, or browser habits, invoke that alongside `seedance-director`. The core skill stays generic on purpose.
