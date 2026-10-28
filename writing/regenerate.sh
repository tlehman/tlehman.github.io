#!/bin/bash
# Regenerate all blog post HTML files from markdown using the template
cd "$(dirname "$0")"
for dir in */; do
    if [ -f "$dir/index.md" ]; then
        echo "Rebuilding: $dir"
        (cd "$dir" && pandoc index.md --template=../template.html -o index.html)
    fi
done
