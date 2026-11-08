#!/usr/bin/env bash
# Start the local WYSIWYG editor for /writing/.
#
#   ./write.sh              serve on http://127.0.0.1:8000/_editor/ and open it
#   ./write.sh 8080         use another port
#   NO_OPEN=1 ./write.sh    don't open a browser
#
# Needs python3, pandoc, and node/npm (only to build the editor bundle, the
# first time and after _editor/src or package.json changes).
set -euo pipefail
cd "$(dirname "$0")"

port="${1:-8000}"
editor="_editor"

for cmd in python3 pandoc npm; do
  if ! command -v "$cmd" >/dev/null; then
    echo "write.sh: $cmd is required but not installed" >&2
    exit 1
  fi
done

# Install dependencies and rebuild the bundle when its inputs change.
if [ ! -d "$editor/node_modules" ] || [ "$editor/package-lock.json" -nt "$editor/node_modules/.package-lock.json" ]; then
  echo "Installing editor dependencies…"
  (cd "$editor" && npm ci --no-audit --no-fund --loglevel=error)
fi
bundle="$editor/dist/editor.js"
if [ ! -f "$bundle" ] || [ -n "$(find "$editor/src" "$editor/package.json" -newer "$bundle" -print -quit)" ]; then
  echo "Building editor…"
  (cd "$editor" && npm run --silent build)
fi

url="http://127.0.0.1:$port/_editor/"
if [ -z "${NO_OPEN:-}" ]; then
  opener=""
  if command -v xdg-open >/dev/null; then opener=xdg-open
  elif command -v open >/dev/null; then opener=open
  fi
  # Open once the server is answering.
  if [ -n "$opener" ]; then
    (
      for _ in $(seq 50); do
        if python3 -c "import urllib.request,sys; urllib.request.urlopen(sys.argv[1], timeout=1)" "$url" 2>/dev/null; then
          "$opener" "$url" >/dev/null 2>&1
          exit 0
        fi
        sleep 0.1
      done
    ) &
  fi
fi

exec python3 "$editor/server.py" "$port"
