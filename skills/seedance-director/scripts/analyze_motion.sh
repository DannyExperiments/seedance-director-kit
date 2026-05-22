#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME_ROOT="${CODEX_BUNDLED_NODE_ROOT:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node}"
RUNTIME_NODE="$RUNTIME_ROOT/bin/node"

if [[ ! -x "$RUNTIME_NODE" ]]; then
  if command -v node >/dev/null 2>&1; then
    RUNTIME_NODE="$(command -v node)"
  else
    echo "Bundled Codex node runtime is missing: $RUNTIME_NODE" >&2
    echo "Set CODEX_BUNDLED_NODE_ROOT or install a compatible node runtime." >&2
    exit 1
  fi
fi

exec "$RUNTIME_NODE" "$SCRIPT_DIR/analyze_motion.cjs" "$@"
