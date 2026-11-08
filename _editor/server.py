#!/usr/bin/env python3
"""Local server for the /writing/ editor. Started by ./write.sh.

Serves the repo as static files and adds a small JSON API that reads and
writes posts as pandoc markdown:

    writing/_drafts/<slug>/index.md   drafts (Jekyll skips _ dirs, so unpublished)
    writing/<slug>/index.md           published posts, rendered to index.html

The editor sends HTML; pandoc converts it to markdown on save and back to
HTML on load, so index.md stays the source of truth.
"""

import datetime
import glob
import hashlib
import html
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITING = os.path.join(ROOT, "writing")
DRAFTS = os.path.join(WRITING, "_drafts")
TEMPLATE = os.path.join(WRITING, "template.html")
INDEX = os.path.join(WRITING, "index.html")
KATEX_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/"

ID_RE = re.compile(r"^(?:_drafts/)?[a-z0-9]+(?:-[a-z0-9]+)*$")
MAX_UPLOAD = 25 * 1024 * 1024
IMAGE_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/svg+xml": "svg",
}
# Markdown flavour written on save: plain pandoc markdown, no raw HTML or
# attribute syntax leaking in from the editor's DOM.
MD_FORMAT = (
    "markdown-raw_html-native_divs-native_spans-bracketed_spans-fenced_divs"
    "-link_attributes-header_attributes-inline_code_attributes-raw_attribute"
)

# Old post id -> new id, so images already in the editor keep loading after
# a draft is renamed mid-session.
renamed = {}


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


# ---------------------------------------------------------------- helpers


def slugify(title):
    s = re.sub(r"['\u2019]", "", title)  # "Knuth's" -> "knuths"
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:80].strip("-") or "untitled"


def today():
    return datetime.date.today().isoformat()


def post_dir(post_id):
    if not isinstance(post_id, str) or not ID_RE.match(post_id):
        raise ApiError(400, f"bad post id: {post_id!r}")
    path = os.path.join(WRITING, post_id)
    if not os.path.isfile(os.path.join(path, "index.md")):
        raise ApiError(404, f"no such post: {post_id}")
    return path


def is_draft(post_id):
    return post_id.startswith("_drafts/")


def unique_slug(base, own_draft=None):
    """First of base, base-2, … not used by a published post or another draft."""

    def taken(slug):
        return os.path.exists(os.path.join(WRITING, slug)) or (
            slug != own_draft and os.path.exists(os.path.join(DRAFTS, slug))
        )

    slug, n = base, 2
    while taken(slug):
        slug, n = f"{base}-{n}", n + 1
    return slug


def read_post(path):
    """Return (meta, body) from an index.md with YAML front matter."""
    with open(os.path.join(path, "index.md"), encoding="utf-8") as f:
        text = f.read()
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            key, sep, value = line.partition(":")
            if not sep:
                continue
            value = value.strip()
            if value.startswith('"'):
                try:
                    value = json.loads(value)
                except ValueError:
                    value = value.strip('"')
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1].replace("''", "'")
            meta[key.strip()] = value
        text = text[m.end():]
    return meta, text.lstrip("\n")


def write_post(path, title, date, draft, body):
    front = ["---", "title: " + json.dumps(title, ensure_ascii=False), f"date: {date}"]
    if draft:
        front.append("draft: true")
    front.append("---")
    content = "\n".join(front) + "\n\n" + body.strip() + "\n"
    tmp = os.path.join(path, ".index.md.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp, os.path.join(path, "index.md"))


def pandoc(args, text, cwd=None):
    try:
        result = subprocess.run(
            ["pandoc", *args],
            input=text,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=60,
        )
    except FileNotFoundError:
        raise ApiError(500, "pandoc is not installed")
    if result.returncode != 0:
        raise ApiError(500, "pandoc failed: " + result.stderr.strip())
    return result.stdout


def render_published(path):
    """Render writing/<slug>/index.md to index.html with the site template."""
    pandoc(
        [
            "index.md",
            "--template=../template.html",
            "--lua-filter=../social-card.lua",
            f"--math-method=katex:{KATEX_URL}",
            "-o",
            "index.html",
        ],
        "",
        cwd=path,
    )


def update_index(slug, title, date):
    """Insert or update this post's line in writing/index.html (newest first)."""
    with open(INDEX, encoding="utf-8") as f:
        lines = f.read().split("\n")
    entry = (
        f'        <li>{date} &mdash; <a href="./{slug}/">{html.escape(title, quote=False)}</a></li>'
    )
    href = f'href="./{slug}/"'
    for i, line in enumerate(lines):
        if href in line:
            lines[i] = entry
            break
    else:
        dated = [
            (i, m.group(1))
            for i, line in enumerate(lines)
            if (m := re.search(r"<li>(\d{4}-\d{2}-\d{2}) &mdash;", line))
        ]
        older = [i for i, d in dated if d <= date]
        if older:
            pos = older[0]
        elif dated:
            pos = dated[-1][0] + 1
        else:
            pos = next(i for i, line in enumerate(lines) if "<ul>" in line) + 1
        lines.insert(pos, entry)
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def post_summary(post_id, path):
    meta, _ = read_post(path)
    return {
        "id": post_id,
        "title": meta.get("title", post_id),
        "date": meta.get("date", ""),
        "draft": is_draft(post_id),
    }


# ---------------------------------------------------------------- API


def api_list(_query, _body):
    drafts, published = [], []
    for md in glob.glob(os.path.join(DRAFTS, "*", "index.md")):
        d = os.path.dirname(md)
        drafts.append(post_summary("_drafts/" + os.path.basename(d), d))
    for md in glob.glob(os.path.join(WRITING, "*", "index.md")):
        d = os.path.dirname(md)
        if ID_RE.match(os.path.basename(d)):
            published.append(post_summary(os.path.basename(d), d))
    key = lambda p: (p["date"], p["title"])
    return {
        "drafts": sorted(drafts, key=key, reverse=True),
        "published": sorted(published, key=key, reverse=True),
    }


def api_get(query, _body):
    post_id = query.get("id", [""])[0]
    path = post_dir(post_id)
    meta, body = read_post(path)
    rendered = pandoc(
        ["-f", "markdown", "-t", "html", "--math-method=katex", "--syntax-highlighting=none"],
        body,
    )
    return {
        **post_summary(post_id, path),
        "html": rendered,
        "base": f"/writing/{post_id}/",
    }


def api_new(_query, _body):
    slug = unique_slug("untitled")
    path = os.path.join(DRAFTS, slug)
    os.makedirs(path)
    write_post(path, "Untitled", today(), True, "")
    return post_summary("_drafts/" + slug, path)


def api_save(_query, body):
    post_id = body.get("id")
    path = post_dir(post_id)
    title = (body.get("title") or "").strip() or "Untitled"
    markdown = pandoc(["-f", "html", "-t", MD_FORMAT, "--wrap=none"], body.get("html", ""))
    meta, _ = read_post(path)
    date = meta.get("date") or today()
    draft = is_draft(post_id)

    if draft:
        # Drafts follow their title: retitling renames the folder (and URL).
        slug = unique_slug(slugify(title), own_draft=post_id.split("/", 1)[1])
        new_id = "_drafts/" + slug
        if new_id != post_id:
            new_path = os.path.join(DRAFTS, slug)
            os.rename(path, new_path)
            renamed[post_id] = new_id
            for old, cur in list(renamed.items()):
                if cur == post_id:
                    renamed[old] = new_id
            post_id, path = new_id, new_path
    write_post(path, title, date, draft, markdown)

    if not draft:
        # Published URLs are permanent; re-render the page and its index line.
        render_published(path)
        update_index(post_id, title, date)
    return post_summary(post_id, path)


def api_publish(_query, body):
    post_id = body.get("id")
    path = post_dir(post_id)
    if not is_draft(post_id):
        raise ApiError(400, "already published")
    meta, md = read_post(path)
    title = meta.get("title") or "Untitled"
    slug = unique_slug(slugify(title), own_draft=post_id.split("/", 1)[1])
    new_path = os.path.join(WRITING, slug)
    os.rename(path, new_path)
    renamed[post_id] = slug
    date = today()
    write_post(new_path, title, date, False, md)
    render_published(new_path)
    update_index(slug, title, date)
    return {**post_summary(slug, new_path), "url": f"/writing/{slug}/"}


def api_delete(query, _body):
    post_id = query.get("id", [""])[0]
    path = post_dir(post_id)
    if not is_draft(post_id):
        raise ApiError(400, "only drafts can be deleted here")
    shutil.rmtree(path)
    return {"ok": True}


def api_upload(query, body_bytes, content_type):
    post_id = query.get("id", [""])[0]
    path = post_dir(post_id)
    ext = IMAGE_TYPES.get(content_type.split(";")[0].strip().lower())
    if not ext:
        raise ApiError(415, f"unsupported image type: {content_type}")
    name = hashlib.sha1(body_bytes).hexdigest()[:12] + "." + ext
    with open(os.path.join(path, name), "wb") as f:
        f.write(body_bytes)
    return {"src": f"/writing/{post_id}/{name}", "name": name}


ROUTES = {
    ("GET", "/api/posts"): api_list,
    ("GET", "/api/post"): api_get,
    ("POST", "/api/new"): api_new,
    ("POST", "/api/post"): api_save,
    ("POST", "/api/publish"): api_publish,
    ("DELETE", "/api/post"): api_delete,
}


# ---------------------------------------------------------------- server


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if self.path.startswith("/api/") or (args and str(args[1])[0] in "45"):
            super().log_message(fmt, *args)

    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        if url.path.startswith("/api/"):
            return self.dispatch("GET", url)
        if url.path in ("/_editor", "/_editor/", "/_editor/index.html"):
            return self.serve_editor()
        # Images in an open editor still point at a draft's old folder after
        # a rename; send them to where the folder went.
        m = re.match(r"^/writing/((?:_drafts/)?[a-z0-9-]+)/(.*)$", url.path)
        if m and m.group(1) in renamed and not os.path.exists(
            os.path.join(WRITING, m.group(1))
        ):
            self.send_response(302)
            self.send_header("Location", f"/writing/{renamed[m.group(1)]}/{m.group(2)}")
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        self.dispatch("POST", urllib.parse.urlsplit(self.path))

    def do_DELETE(self):
        self.dispatch("DELETE", urllib.parse.urlsplit(self.path))

    def serve_editor(self):
        with open(os.path.join(ROOT, "_editor", "index.html"), encoding="utf-8") as f:
            page = f.read()
        css = sorted(glob.glob(os.path.join(WRITING, "blog-style*.css")))
        css_href = "/writing/" + os.path.basename(css[0]) if css else ""
        data = page.replace("{{BLOG_CSS}}", css_href).encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def allowed(self):
        # The API writes files, so only accept it from the editor itself:
        # a local Host (no DNS rebinding) and a custom header (no cross-site
        # form posts, since browsers preflight it and we never answer).
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0]
        return host in ("127.0.0.1", "localhost") and self.headers.get(
            "X-Write-Editor"
        ) == "1"

    def dispatch(self, method, url):
        try:
            if not self.allowed():
                raise ApiError(403, "forbidden")
            query = urllib.parse.parse_qs(url.query)
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_UPLOAD:
                raise ApiError(413, "too large")
            raw = self.rfile.read(length) if length else b""
            if method == "POST" and url.path == "/api/upload":
                result = api_upload(query, raw, self.headers.get("Content-Type", ""))
            else:
                handler = ROUTES.get((method, url.path))
                if not handler:
                    raise ApiError(404, "no such endpoint")
                body = json.loads(raw) if raw else {}
                result = handler(query, body)
            self.respond(200, result)
        except ApiError as e:
            self.respond(e.status, {"error": str(e)})
        except (ValueError, OSError) as e:
            self.respond(500, {"error": str(e)})

    def respond(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    os.makedirs(DRAFTS, exist_ok=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Editor: http://127.0.0.1:{port}/_editor/  (Ctrl-C to stop)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
