# Bundled Bubio Fast Path

This skill includes a bundled Bubio runner:

- `scripts/bubio_runner.sh`
- `scripts/bubio_runner.cjs`

Use it when repeated Bubio runs would be too slow through screenshot-driven browser control.

## What it does

- capture or bootstrap a reusable Bubio auth state,
- inspect the studio UI,
- discover sanitized Bubio network/API endpoints without submitting a generation,
- submit a generation,
- and download the finished MP4 quickly.

The runner is not complete until the MP4 is back in the user's thread. Use Bubio as the render backend, not as the user's required viewing surface.

## Why it matters

The user may want one installable skill that already includes the practical fast path. Bundling the runner inside the skill means a GitHub `skill-installer` install can bring both the public directing knowledge and the automation path at once.

## Security

- never store passwords,
- treat the saved auth state like a live token,
- do not commit auth/session files,
- reuse local session state instead of asking for credentials.

## Typical commands

```zsh
zsh scripts/bubio_runner.sh capture-auth
zsh scripts/bubio_runner.sh inspect-studio
zsh scripts/bubio_runner.sh discover-api --headless --observe-ms 15000
zsh scripts/bubio_runner.sh discover-api --headless --exercise-form --prompt-file "/absolute/path/to/prompt.txt" --ref "/absolute/path/to/ref.png" --aspect 16:9 --duration 15 --observe-ms 15000
zsh scripts/bubio_runner.sh download-latest --prompt-file "/absolute/path/to/prompt.txt" --download-name "latest.mp4"
zsh scripts/bubio_runner.sh generate --prompt-file "/absolute/path/to/prompt.txt" --aspect 16:9 --duration 15 --sound on
zsh scripts/bubio_runner.sh generate --prompt-file "/absolute/path/to/prompt.txt" --ref "/absolute/path/to/ref.png" --prefix-first-frame --aspect 16:9 --duration 15 --sound on --submit-only
```

GitHub ZIP installs may not preserve executable bits on shell scripts, so invoke the runner with `zsh` rather than relying on `./scripts/bubio_runner.sh`.

## Thread Return Pattern

After `generate` or `download-latest` prints `Saved video to ...` or `Saved latest video to ...`:

1. copy the absolute MP4 path,
2. build a review sheet with `zsh scripts/make_review_sheet.sh`,
3. return both media files in the thread,
4. critique only after inspecting the returned MP4/review sheet.

Codex Desktop example:

```markdown
![Generated video](/absolute/path/to/result.mp4)
![Review sheet](/absolute/path/to/result-review.jpg)
```

## Login Flow

If Bubio auth is missing or expired, do not just tell the user to log in. Run:

```zsh
zsh scripts/bubio_runner.sh capture-auth
```

That command opens a visible Chrome window. Tell the user: "Log into Bubio Studio in the Chrome window I opened, then return here and press Enter/reply done." Never ask for a password.

## Submit / Heartbeat Flow

For normal quick tests, `generate` can wait for the MP4. For 15s renders or any slow queue, use `--submit-only` after the form is verified. The runner submits once, saves submit evidence, prints the `download-latest` command, and exits.

Then set a 5-minute heartbeat/checkpoint if the client supports it. On return, run the printed `download-latest --prompt-file ...` command, verify the result belongs to the current job, return the MP4 in-thread, create the review sheet, then critique.

## Retrieval Rules

- Prefer fresh signed `/studio/videos/*.mp4` result URLs.
- A newly signed URL is not proof that the card belongs to the current job. Old cards can mint fresh signed URLs.
- When a prompt is supplied, require a positive prompt/card-text match before saving the MP4.
- Do not trust the first visible `<video>` node; it may be a background loop or stale virtualized feed card.
- Do not scroll deep into old result history while looking for a fresh render unless the current card is not visible.
- Match by current prompt, timestamp, top/current result card, and nearby card metadata.
- If no prompt-matched result appears, fail and inspect the saved candidate-debug JSON instead of returning a wrong MP4.
- Use `--allow-unmatched` only as a manual recovery/debug escape hatch after inspecting the candidate-debug file.
- The runner saves pre-submit screenshots and JSON so refs/aspect/duration/sound can be audited after a bad run.

## API Discovery Mode

Use `discover-api` when you want to move beyond browser clicking toward a real Bubio CLI/API client.

It opens Bubio Studio with saved auth, watches network traffic, and saves a sanitized summary under:

`output/seedance-bubio/api-discovery/`

It does **not** click `Generate` or submit a credit-spending job. The summary strips query strings, cookies, auth headers, raw request values, signed URLs, and full response bodies. It keeps endpoint paths, methods, statuses, content types, request body field/key shapes, and response JSON key shapes.

Add `--exercise-form` when you want the recorder to fill prompt/settings/uploads without submitting. This can reveal upload and form-state routes. Use it carefully with private reference images because uploads may still send those files to Bubio storage even though no video generation is submitted.

The output is meant to answer:

- which backend hosts Bubio uses,
- which requests look like upload/create/poll/download routes,
- whether direct CLI subcommands are realistic,
- and which UI fallback pieces still need browser automation.

## Limits

- exact UI role assignment between `reference` and `first frame` may still need adjustment against Bubio UI changes,
- repeated runner maintenance may be needed if Bubio changes selectors,
- browser-route fallback should remain available.

## Browser Fallback Checklist

Use this checklist when the runner is unavailable, stale, or cannot finish the route:

1. Open Bubio Studio and verify the user is logged in. If not, run `capture-auth` so a visible Chrome window opens, then ask the user to log into that opened window once.
2. Close onboarding overlays or prompt tips that intercept clicks.
3. Select `Video` and `Seedance 2`.
4. Copy generated image assets from `~/.codex/generated_images` into a workspace/output folder before file upload.
5. Upload the intended refs and verify the ref count. Remove accidental old refs.
6. Set aspect ratio and duration explicitly. Bubio may default to `1:1` and `5s`.
7. Paste the final prompt.
8. Read the visible `Generate` cost. If generation is not already authorized, ask before spending.
9. Submit once.
10. Match the result by current prompt/timestamp/refs. Do not mistake an old visible `Render failed` card for the new job.
