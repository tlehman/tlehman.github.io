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


def render_markdown(text):
    """Render markdown to HTML with paragraph handling.

    Each newline-separated group of lines becomes a <p>.
    Multiple consecutive newlines collapse to a single paragraph break.
    Markdown block elements (headings, lists, blockquotes, code blocks,
    horizontal rules) are rendered outside of <p> tags.
    Inline markdown (bold, italic, links, images, code) is rendered within paragraphs.
    """
    lines = text.split("\n")

    # Group lines into blocks separated by blank lines
    blocks = []
    current = []
    for line in lines:
        if line.strip() == "":
            if current:
                blocks.append(current)
                current = []
        else:
            current.append(line)
    if current:
        blocks.append(current)

    result = []
    for block in blocks:
        first = block[0].strip()

        # Heading
        if re.match(r'^#{1,6}\s', first):
            for line in block:
                m = re.match(r'^(#{1,6})\s+(.*)', line)
                if m:
                    level = len(m.group(1))
                    result.append(f"<h{level}>{_inline(m.group(2))}</h{level}>")
                else:
                    result.append(f"<p>{_inline(line)}</p>")

        # Fenced code block
        elif first.startswith("```"):
            lang = first[3:].strip()
            code_lines = []
            # Collect until closing ```
            i = 1
            while i < len(block):
                if block[i].strip() == "```":
                    break
                code_lines.append(block[i])
                i += 1
            code = _escape_html("\n".join(code_lines))
            if lang:
                result.append(f'<pre><code class="language-{_escape_html(lang)}">{code}</code></pre>')
            else:
                result.append(f"<pre><code>{code}</code></pre>")

        # Blockquote
        elif first.startswith(">"):
            quote_lines = []
            for line in block:
                quote_lines.append(re.sub(r"^>\s?", "", line))
            result.append(f"<blockquote><p>{_inline(' '.join(quote_lines))}</p></blockquote>")

        # Unordered list
        elif re.match(r'^[-*+]\s', first):
            result.append("<ul>")
            for line in block:
                item = re.sub(r'^[-*+]\s+', '', line)
                result.append(f"<li>{_inline(item)}</li>")
            result.append("</ul>")

        # Ordered list
        elif re.match(r'^\d+\.\s', first):
            result.append("<ol>")
            for line in block:
                item = re.sub(r'^\d+\.\s+', '', line)
                result.append(f"<li>{_inline(item)}</li>")
            result.append("</ol>")

        # Horizontal rule
        elif re.match(r'^[-*_]{3,}\s*$', first) and len(block) == 1:
            result.append("<hr>")

        # Regular paragraph
        else:
            # Each line in the block is part of the same paragraph
            result.append(f"<p>{_inline(' '.join(line.strip() for line in block))}</p>")

    return "\n".join(result)


def _escape_html(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _inline(text):
    """Render inline markdown: bold, italic, code, links, images."""
    # Inline code (before other processing to avoid conflicts)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Images (before links, since ![alt](url) contains [])
    text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1">', text)
    # Links
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    # Bold (**text** or __text__)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__(.+?)__', r'<strong>\1</strong>', text)
    # Italic (*text* or _text_)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'(?<!\w)_(.+?)_(?!\w)', r'<em>\1</em>', text)
    return text


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
        elif self.path == "/api/reddit-comments":
            self.handle_reddit_comments()
        elif self.path == "/api/annotate":
            self.handle_annotate()
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

        # Render markdown to HTML
        body_html = render_markdown(content)

        # Apply template
        template_path = os.path.join(writing_dir, "template.html")
        with open(template_path, "r") as f:
            template = f.read()
        page_html = template.replace("$title$", title).replace("$date$", date).replace("$body$", body_html)

        with open(html_path, "w") as f:
            f.write(page_html)

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

    def handle_reddit_comments(self):
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

        prompt = f"Generate the top 3 critical reddit comments of this article:\n\n{content}"

        try:
            result = subprocess.run(
                ["claude", "-p", prompt],
                capture_output=True, text=True, check=True,
            )
            self.respond_json(200, {"comments": result.stdout})
        except FileNotFoundError:
            self.respond_json(500, {"error": "claude CLI not found. Install it first."})
        except subprocess.CalledProcessError as e:
            self.respond_json(500, {"error": f"claude CLI failed: {e.stderr}"})

    def handle_annotate(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, ValueError):
            self.respond_json(400, {"error": "Invalid JSON"})
            return

        content = body.get("content", "").strip()
        ann_type = body.get("type", "").strip()

        if not content:
            self.respond_json(400, {"error": "Content is required"})
            return

        valid_types = {"fact-check", "style", "coherence", "consistency"}
        if ann_type not in valid_types:
            self.respond_json(400, {"error": f"Invalid type. Must be one of: {', '.join(sorted(valid_types))}"})
            return

        prompts = {
            "fact-check": (
                "Analyze this article for factual accuracy. For each claim that may be "
                "inaccurate, misleading, or unverifiable, return it as an annotation. "
                "Focus on specific sentences or phrases."
            ),
            "style": (
                "Analyze this article for writing style issues: awkward phrasing, passive "
                "voice overuse, wordiness, unclear sentences, or cliches. Focus on specific "
                "sentences or phrases that could be improved."
            ),
            "coherence": (
                "Analyze this article for logical coherence. Identify sentences or paragraphs "
                "where the argument is unclear, where transitions are weak, or where the "
                "reasoning does not follow. Focus on specific text."
            ),
            "consistency": (
                "Analyze this article for internal consistency. Look for contradictions, "
                "inconsistent terminology, tone shifts, or claims that conflict with each "
                "other. Focus on specific sentences or phrases."
            ),
        }

        system_prompt = (
            "You are a writing analysis tool. "
            + prompts[ann_type]
            + '\n\nReturn ONLY valid JSON in this exact format, with no other text:\n'
            '{"annotations": [{"text": "exact quote from article", '
            '"feedback": "explanation of the issue", '
            '"severity": "high" or "medium" or "low"}]}\n\n'
            'Important: the "text" field must contain an EXACT substring from the article. '
            'If there are no issues, return {"annotations": []}.'
        )

        full_prompt = system_prompt + "\n\nArticle:\n\n" + content

        try:
            result = subprocess.run(
                ["claude", "-p", full_prompt],
                capture_output=True, text=True, check=True,
                timeout=120,
            )
            output = result.stdout.strip()
            # Strip markdown code fences if present
            if output.startswith("```"):
                output = output.split("\n", 1)[1]
                if output.endswith("```"):
                    output = output[:-3].strip()

            data = json.loads(output)
            if "annotations" not in data:
                data = {"annotations": []}

            self.respond_json(200, data)
        except json.JSONDecodeError:
            self.respond_json(500, {"error": "Claude returned invalid JSON. Try again."})
        except FileNotFoundError:
            self.respond_json(500, {"error": "claude CLI not found."})
        except subprocess.CalledProcessError as e:
            self.respond_json(500, {"error": f"claude CLI failed: {e.stderr}"})
        except subprocess.TimeoutExpired:
            self.respond_json(500, {"error": "Analysis timed out."})

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
