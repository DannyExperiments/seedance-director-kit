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
