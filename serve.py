#!/usr/bin/env python3
"""Dev server with POST /api/publish endpoint for the draft editor."""

import glob
import hashlib
import http.server
import json
import os
import re
import subprocess
import sys
import threading
import time


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/articles":
            self.handle_list_articles()
        elif self.path.startswith("/api/articles/"):
            slug = self.path[len("/api/articles/"):]
            self.handle_get_article(slug)
        else:
            super().do_GET()

    def handle_list_articles(self):
        writing_dir = os.path.join(os.getcwd(), "writing")
        articles = []
        for md_path in glob.glob(os.path.join(writing_dir, "*/index.md")):
            slug = os.path.basename(os.path.dirname(md_path))
            with open(md_path, "r") as f:
                text = f.read()
            title, date = "", ""
            fm = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
            if fm:
                for line in fm.group(1).splitlines():
                    if line.startswith("title:"):
                        title = line.split(":", 1)[1].strip().strip('"')
                    elif line.startswith("date:"):
                        date = line.split(":", 1)[1].strip()
            articles.append({"slug": slug, "title": title, "date": date})
        articles.sort(key=lambda a: a["date"], reverse=True)
        self.respond_json(200, articles)

    def handle_get_article(self, slug):
        if not re.match(r'^[a-z0-9][a-z0-9-]*$', slug):
            self.respond_json(400, {"error": "Invalid slug"})
            return
        md_path = os.path.join(os.getcwd(), "writing", slug, "index.md")
        if not os.path.exists(md_path):
            self.respond_json(404, {"error": "Article not found"})
            return
        with open(md_path, "r") as f:
            text = f.read()
        title, date, content = "", "", text
        fm = re.match(r'^---\s*\n(.*?)\n---\s*\n?', text, re.DOTALL)
        if fm:
            for line in fm.group(1).splitlines():
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip().strip('"')
                elif line.startswith("date:"):
                    date = line.split(":", 1)[1].strip()
            content = text[fm.end():]
        self.respond_json(200, {"slug": slug, "title": title, "date": date, "content": content})

    def do_POST(self):
        if self.path == "/api/publish":
            self.handle_publish()
        elif self.path == "/api/citations":
            self.handle_citations()
        else:
            self.send_error(404)

    def handle_publish(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, ValueError):
            self.respond_json(400, {"error": "Invalid JSON"})
            return

        title = body.get("title", "").strip()
        slug = body.get("slug", "").strip()
        date = body.get("date", "").strip()
        content = body.get("content", "").strip()

        if not all([title, slug, date, content]):
            self.respond_json(400, {"error": "All fields (title, slug, date, content) are required"})
            return

        # Validate slug is safe for filesystem use
        if not re.match(r'^[a-z0-9][a-z0-9-]*$', slug):
            self.respond_json(400, {"error": "Slug must be lowercase alphanumeric with hyphens"})
            return

        writing_dir = os.path.join(os.getcwd(), "writing")
        slug_dir = os.path.join(writing_dir, slug)
        is_update = os.path.exists(slug_dir)

        # Create directory if new
        if not is_update:
            os.makedirs(slug_dir)
        md_path = os.path.join(slug_dir, "index.md")
        html_path = os.path.join(slug_dir, "index.html")

        with open(md_path, "w") as f:
            f.write(f"---\ntitle: \"{title}\"\ndate: {date}\n---\n\n{content}\n")

        # Run pandoc
        try:
            subprocess.run(
                ["pandoc", "index.md", "--template=../template.html", "-o", "index.html"],
                cwd=slug_dir,
                check=True,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError:
            self.respond_json(500, {"error": "pandoc not found. Run 'nix develop' first."})
            return
        except subprocess.CalledProcessError as e:
            self.respond_json(500, {"error": f"pandoc failed: {e.stderr}"})
            return

        # Update writing/index.html with new or updated entry
        index_path = os.path.join(writing_dir, "index.html")
        try:
            with open(index_path, "r") as f:
                index_html = f.read()

            new_entry = f'        <li>{date} &mdash; <a href="./{slug}/">{title}</a></li>\n'
            if is_update:
                # Replace existing entry for this slug
                index_html = re.sub(
                    r' *<li>.*?<a href="\./?' + re.escape(slug) + r'/?">[^<]*</a></li>\n',
                    new_entry,
                    index_html,
                    count=1,
                )
            else:
                # Insert after <ul>
                index_html = index_html.replace("<ul>\n", "<ul>\n" + new_entry, 1)

            with open(index_path, "w") as f:
                f.write(index_html)
        except Exception as e:
            # Non-fatal: article is published even if index update fails
            print(f"Warning: could not update writing/index.html: {e}")

        url = f"/writing/{slug}/"
        print(f"Published: {url}")
        self.respond_json(200, {"url": url})

    def handle_citations(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, ValueError):
            self.respond_json(400, {"error": "Invalid JSON"})
            return

        content = body.get("content", "").strip()
        if not content:
            self.respond_json(400, {"error": "Content is required"})
            return

        instruction = (
            "Read through all this text and then find books, articles, or papers, "
            "and then wire up the citations like wikipedia. It should stay as markdown "
            "but the links in the text should be to the citation list at the bottom. "
            "Return ONLY the updated markdown, no explanation or wrapping."
        )

        prompt = f"{instruction}\n\n{content}"

        try:
            result = subprocess.run(
                ["claude", "-p", prompt],
                capture_output=True, text=True, check=True,
            )
            self.respond_json(200, {"content": result.stdout})
        except FileNotFoundError:
            self.respond_json(500, {"error": "claude CLI not found. Install it first."})
        except subprocess.CalledProcessError as e:
            self.respond_json(500, {"error": f"claude CLI failed: {e.stderr}"})

    def respond_json(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def watch_css():
    """Poll writing/blog-style*.css and run cache-bust script when content changes."""
    while True:
        try:
            matches = glob.glob("writing/blog-style*.css")
            if matches:
                css_path = matches[0]
                content_md5 = hashlib.md5(open(css_path, "rb").read()).hexdigest()
                # Extract hash from filename if present (blog-style-<hash>.css)
                basename = os.path.basename(css_path)
                # filename_md5 is the hash embedded in the name, or empty if plain
                parts = basename.replace(".css", "").split("-", 2)
                filename_md5 = parts[2] if len(parts) == 3 else ""
                if content_md5 != filename_md5:
                    print(f"CSS changed, running cache-bust (content MD5: {content_md5})")
                    subprocess.run(["bash", "writing/cache-bust-css.sh"], check=True)
        except Exception as e:
            print(f"CSS watcher error: {e}")
        time.sleep(2)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

    watcher = threading.Thread(target=watch_css, daemon=True)
    watcher.start()

    server = http.server.HTTPServer(("", port), Handler)
    print(f"Serving on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
