#!/bin/bash
# Regenerate all blog post HTML files from markdown using the template
cd "$(dirname "$0")"
for dir in */; do
    if [ -f "$dir/index.md" ]; then
        echo "Rebuilding: $dir"
        (cd "$dir" && pandoc index.md --template=../template.html --lua-filter=../social-card.lua --math-method=katex:https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/ -o index.html)
    fi
done
