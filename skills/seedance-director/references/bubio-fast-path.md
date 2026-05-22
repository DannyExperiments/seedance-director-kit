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
zsh scripts/bubio_runner.sh download-latest --download-name "latest.mp4"
zsh scripts/bubio_runner.sh generate --prompt-file "/absolute/path/to/prompt.txt" --aspect 16:9 --duration 15 --sound on
```

GitHub ZIP installs may not preserve executable bits on shell scripts, so invoke the runner with `zsh` rather than relying on `./scripts/bubio_runner.sh`.

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

1. Open Bubio Studio and verify the user is logged in. If not, ask the user to log in once.
2. Close onboarding overlays or prompt tips that intercept clicks.
3. Select `Video` and `Seedance 2`.
4. Copy generated image assets from `~/.codex/generated_images` into a workspace/output folder before file upload.
5. Upload the intended refs and verify the ref count. Remove accidental old refs.
6. Set aspect ratio and duration explicitly. Bubio may default to `1:1` and `5s`.
7. Paste the final prompt.
8. Read the visible `Generate` cost. If generation is not already authorized, ask before spending.
9. Submit once.
10. Match the result by current prompt/timestamp/refs. Do not mistake an old visible `Render failed` card for the new job.
