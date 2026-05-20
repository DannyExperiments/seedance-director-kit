#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME_ROOT="${CODEX_BUNDLED_NODE_ROOT:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node}"
RUNTIME_NODE="$RUNTIME_ROOT/bin/node"
RUNTIME_NODE_MODULES="$RUNTIME_ROOT/node_modules"

if [[ ! -x "$RUNTIME_NODE" ]]; then
  if command -v node >/dev/null 2>&1; then
    RUNTIME_NODE="$(command -v node)"
    RUNTIME_NODE_MODULES=""
  else
    echo "Bundled Codex node runtime is missing: $RUNTIME_NODE" >&2
    echo "Set CODEX_BUNDLED_NODE_ROOT or install a compatible node runtime." >&2
    exit 1
  fi
fi

if [[ -n "$RUNTIME_NODE_MODULES" && -d "$RUNTIME_NODE_MODULES" ]]; then
  export NODE_PATH="$RUNTIME_NODE_MODULES${NODE_PATH:+:$NODE_PATH}"
fi
exec "$RUNTIME_NODE" "$SCRIPT_DIR/bubio_runner.cjs" "$@"
