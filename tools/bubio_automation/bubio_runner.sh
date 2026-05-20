#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME_NODE="/Users/danielcabezas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
RUNTIME_NODE_MODULES="/Users/danielcabezas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"

if [[ ! -x "$RUNTIME_NODE" ]]; then
  echo "Bundled Codex node runtime is missing: $RUNTIME_NODE" >&2
  exit 1
fi

export NODE_PATH="$RUNTIME_NODE_MODULES${NODE_PATH:+:$NODE_PATH}"
exec "$RUNTIME_NODE" "$SCRIPT_DIR/bubio_runner.cjs" "$@"
