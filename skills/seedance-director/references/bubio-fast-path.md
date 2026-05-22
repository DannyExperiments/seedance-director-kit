# Bundled Bubio Fast Path

This skill includes a bundled Bubio runner:

- `scripts/bubio_runner.sh`
- `scripts/bubio_runner.cjs`

Use it when repeated Bubio runs would be too slow through screenshot-driven browser control.

## What it does

- capture or bootstrap a reusable Bubio auth state,
- inspect the studio UI,
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
zsh scripts/bubio_runner.sh download-latest --download-name "latest.mp4"
zsh scripts/bubio_runner.sh generate --prompt-file "/absolute/path/to/prompt.txt" --aspect 16:9 --duration 15 --sound on
```

GitHub ZIP installs may not preserve executable bits on shell scripts, so invoke the runner with `zsh` rather than relying on `./scripts/bubio_runner.sh`.

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
