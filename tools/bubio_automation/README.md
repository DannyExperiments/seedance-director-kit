# Bubio Automation Runner

This is a small Playwright-based fast path for Bubio video generation. It is meant to replace most of the slow, manual clicking loop with four practical commands:

1. capture a reusable authenticated Bubio session
2. inspect the current studio UI when Bubio changes
3. submit a generation and save the finished MP4
4. pull the latest finished MP4 directly when needed

## Why this exists

Computer-use is great for discovery and one-off direction, but it is not the right long-term speed layer for:

- filling the same prompt form repeatedly
- uploading media
- polling for completion
- downloading finished videos

This runner is the first step toward the larger remote workflow:

`Remodex idea -> prompt/storyboard/image generation -> Bubio run -> critique -> optional rerun -> delivery/email`

## Security model

The runner does **not** store your Bubio password.

It stores a browser session state file here by default:

`~/.codex/bubio-automation/bubio-storage-state.json`

That file is treated like a live session token:

- auth directory is created with `700` permissions when possible
- auth file is locked to `600` when possible
- it should never be committed or shared

## Runtime

The wrapper script uses Codex's bundled Node runtime and bundled Playwright package. That means we do not need to add `npm` or a project-local Playwright install just to automate Bubio.

## Commands

### 1. Capture auth

Open a dedicated Chrome session, log into Bubio once, then save reusable auth state:

```zsh
zsh ./bubio_runner.sh capture-auth
```

After Bubio studio is ready in the opened Chrome window, come back to the terminal and press Enter.

### 1b. Bootstrap auth from your existing Chrome profile

If you are already logged into Bubio in your everyday Chrome profile, try cloning that profile into a dedicated automation profile and export auth from there:

```zsh
zsh ./bubio_runner.sh bootstrap-auth-from-profile --chrome-profile-dir "Default"
```

If your everyday Chrome login lives in another profile, replace `Default` with the correct Chrome profile directory, for example `Profile 1`.

This is the preferred shortcut because it keeps the long-term automation on its own profile while still borrowing the already-authenticated session when possible.

### 2. Inspect studio

Useful when Bubio changes its UI and we need fresh labels/screenshots:

```zsh
zsh ./bubio_runner.sh inspect-studio
```

This saves a screenshot to:

`output/seedance-bubio/automation-debug/`

### 3. Download the latest finished video

Useful when a video has already rendered in Bubio and you just want the MP4 quickly:

```zsh
zsh ./bubio_runner.sh download-latest --download-name "latest.mp4"
```

### 4. Generate and download

Text-only example:

```zsh
zsh ./bubio_runner.sh generate \
  --prompt-file "/absolute/path/to/prompt.txt" \
  --aspect 16:9 \
  --duration 15 \
  --sound on \
  --download-name "storm-bellkeeper-15s.mp4"
```

Reference-image example:

```zsh
zsh ./bubio_runner.sh generate \
  --prompt-file "/absolute/path/to/prompt.txt" \
  --ref "/absolute/path/to/frame.png" \
  --prefix-first-frame \
  --aspect 16:9 \
  --duration 15 \
  --sound on
```

## Current v1 limits

This version is intentionally narrow and honest:

- optimized first for `Create`
- supports prompt fill, duration, aspect, sound, generation, and download
- supports best-effort media attachment
- uses prompt steering for first-frame behavior via `--prefix-first-frame`
- downloads are now pulled from Bubio's signed `studio/videos/*.mp4` result URL instead of relying on the hover-only UI download button

What still needs a second pass:

- explicit Bubio UI switching between exact `reference` vs exact `first frame` attachment roles
- more robust attachment verification after upload
- queueing multiple jobs
- automatic critique/review-sheet chaining
- delivery actions like email

## Current status

Validated on this machine on 2026-04-27:

- auth bootstrapped successfully from an existing Chrome profile on the validating machine
- headless studio inspection works
- `download-latest` works
- `generate` works end to end for a real Bubio run and saves the MP4 automatically

## Recommended next moves

1. Run `capture-auth` once so we have a reusable dedicated Bubio session.
2. Or first try `bootstrap-auth-from-profile --chrome-profile-dir "Default"` to reuse the existing Chrome login, and replace `Default` if your active Chrome profile uses another directory.
3. Run `inspect-studio` and keep the debug screenshot in case Bubio moves controls.
4. Use `generate` for the next text-only or single-reference run, then tighten selectors based on real usage.
