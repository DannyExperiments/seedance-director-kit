#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 input.mp4 output.jpg [fps]" >&2
  exit 2
fi

INPUT="$1"
OUTPUT="$2"
FPS="${3:-6}"

if command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG="ffmpeg"
elif [ -x /opt/homebrew/bin/ffmpeg ]; then
  FFMPEG="/opt/homebrew/bin/ffmpeg"
else
  echo "ffmpeg not found" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"
"$FFMPEG" -y -i "$INPUT" -vf "fps=${FPS},scale=240:-1,tile=6x5" -frames:v 1 -update 1 "$OUTPUT"
