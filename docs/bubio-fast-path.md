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
- sanitized API discovery without submitting paid jobs,
- repeatable generate flow,
- pull completed signed MP4 URLs quickly,
- critique after retrieval.

## API discovery

Use the discovery command before trying to build direct Bubio API subcommands:

```zsh
zsh tools/bubio_automation/bubio_runner.sh discover-api --headless --observe-ms 15000
```

This records a redacted endpoint summary under `output/seedance-bubio/api-discovery/`. It does not submit a generation. The summary keeps route/method/status/body-shape information and strips query strings, cookies, auth headers, raw body values, signed URLs, and full response bodies.

For deeper discovery, add `--exercise-form` plus prompt/settings/refs. That fills Bubio controls and can reveal upload/form-state calls, but still does not click `Generate`:

```zsh
zsh tools/bubio_automation/bubio_runner.sh discover-api \
  --headless \
  --exercise-form \
  --prompt-file "/absolute/path/to/prompt.txt" \
  --ref "/absolute/path/to/ref.png" \
  --aspect 16:9 \
  --duration 15 \
  --observe-ms 15000
```

Use `--exercise-form` carefully with private reference images because uploads may still send files to Bubio storage even though no video generation is submitted.
