#!/bin/bash
# Cache-bust blog-style.css by embedding its MD5 hash in the filename.
set -euo pipefail
cd "$(dirname "$0")"

# Find the current CSS file (plain or already hashed)
OLD=$(ls blog-style*.css 2>/dev/null | head -1)
if [ -z "$OLD" ]; then
  echo "No blog-style*.css found" >&2
  exit 1
fi

MD5=$(md5 -q "$OLD")
TARGET="blog-style-${MD5}.css"

# Exit early if already named correctly
if [ "$OLD" = "$TARGET" ]; then
  echo "Already up to date: $TARGET"
  exit 0
fi

mv "$OLD" "$TARGET"
echo "Renamed $OLD -> $TARGET"

# Update all references in HTML files, templates, and Makefiles
find . -type f \( -name '*.html' -o -name '*.html.tmpl' -o -name 'Makefile' \) \
  -exec sed -i.bak "s/blog-style[^\"]*\.css/${TARGET}/g" {} \;
find . -name '*.bak' -delete

echo "Updated all references to $TARGET"
