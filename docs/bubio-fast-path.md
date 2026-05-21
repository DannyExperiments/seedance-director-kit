# Bubio Fast Path

The public execution recommendation is:

1. use a logged-in Bubio browser session for normal manual work,
2. use the bundled automation runner for repeated work.

## Why

Screenshot-driven browser control is fine for discovery and one-off direction, but too slow for repeated prompt fill, uploads, polling, and download.

## Included tool

See:

- `tools/bubio_automation/README.md`
- `tools/bubio_automation/bubio_runner.sh`
- `tools/bubio_automation/bubio_runner.cjs`

Invoke the shell wrapper with `zsh`, because GitHub ZIP installs may not preserve executable bits:

```zsh
zsh tools/bubio_automation/bubio_runner.sh doctor
```

## Security model

- do not store passwords,
- reuse a saved local session,
- do not commit session files,
- treat auth state like a live token.

## Current practical model

- one-time login capture,
- repeatable generate flow,
- pull completed signed MP4 URLs quickly,
- critique after retrieval.
