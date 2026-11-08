// WYSIWYG editor for /writing/. Bundled to dist/editor.js by `npm run build`
// (./write.sh does this). Talks to the JSON API in ../server.py.

import { Editor, InputRule } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import { Placeholder } from "@tiptap/extensions";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./editor.css";

const $ = (sel) => document.querySelector(sel);
const els = {
  main: $("#main"),
  empty: $("#empty"),
  date: $("#date"),
  title: $("#title"),
  meta: $("#meta"),
  status: $("#status"),
  publish: $("#publish"),
  view: $("#view"),
  remove: $("#delete"),
  drawer: $("#drawer"),
  drafts: $("#drafts"),
  published: $("#published"),
  file: $("#file"),
};

// ------------------------------------------------------------------ API

async function api(method, path, body, headers = {}) {
  const opts = { method, headers: { "X-Write-Editor": "1", ...headers } };
  if (body instanceof Blob) {
    opts.body = body;
  } else if (body !== undefined) {
    opts.body = JSON.stringify(body);
    opts.headers["Content-Type"] = "application/json";
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Mirrors slugify() in server.py, for the live URL preview while typing.
function slugify(title) {
  const s = title
    .replace(/['\u2019]/g, "") // "Knuth's" -> "knuths"
    .normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 80).replace(/-+$/, "") || "untitled";
}

// ------------------------------------------------------------------ math

// Type $x^2$ for inline math (pandoc's rule: no space just inside the
// dollars, so "$5 and $10" stays text). Type $$…$$ alone on a line for a
// display equation.
const INLINE_MATH = /(?<![\\$\w])\$([^\s$](?:[^$\n]*?[^\s$\\])?)\$$/;
const BLOCK_MATH = /^\$\$([^$]+)\$\$$/;

const onMathClick = (node, pos) => editMath({ node, pos });

const MathInline = InlineMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: INLINE_MATH,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex: match[1] }));
        },
      }),
    ];
  },
}).configure({ onClick: onMathClick, katexOptions: { throwOnError: false } });

const MathBlock = BlockMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: BLOCK_MATH,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const $from = state.doc.resolve(range.from);
          const node = this.type.create({ latex: match[1].trim() });
          const wholeBlock =
            $from.parent.isTextblock && range.from === $from.start() && range.to === $from.end();
          if (wholeBlock) tr.replaceWith($from.before(), $from.after(), node);
          else tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },
}).configure({
  onClick: onMathClick,
  katexOptions: { throwOnError: false, displayMode: true },
});

// ------------------------------------------------------------------ popovers

let openPopover = null;

function closePopover() {
  if (!openPopover) return;
  openPopover.remove();
  openPopover = null;
}

// A small floating panel under `rect` (a DOMRect in viewport coordinates).
function popover(rect, build) {
  closePopover();
  const el = document.createElement("div");
  el.className = "popover";
  document.body.append(el);
  build(el);
  const width = el.offsetWidth;
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
  el.style.left = `${left + window.scrollX}px`;
  el.style.top = `${rect.bottom + window.scrollY + 8}px`;
  openPopover = el;
  return el;
}

document.addEventListener("mousedown", (e) => {
  if (openPopover && !openPopover.contains(e.target)) closePopover();
});

function selectionRect() {
  const { from, to } = editor.state.selection;
  const a = editor.view.coordsAtPos(from);
  const b = editor.view.coordsAtPos(to);
  return { left: a.left, bottom: Math.max(a.bottom, b.bottom) };
}

function row(...children) {
  const div = document.createElement("div");
  div.className = "row";
  div.append(...children);
  return div;
}

function button(label, onClick, cls = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  if (cls) b.className = cls;
  b.addEventListener("click", onClick);
  return b;
}

function hint(text) {
  const span = document.createElement("span");
  span.className = "hint";
  span.textContent = text;
  return span;
}

// Edit an existing math node ({node, pos}) or insert a new one ({display}).
function editMath({ node, pos, display }) {
  const isBlock = node ? node.type.name === "blockMath" : display;
  // Copy the positions explicitly: from/to are getters on the Selection, so
  // spreading it ({...selection}) would lose them.
  const range = node ? null : { from: editor.state.selection.from, to: editor.state.selection.to };
  const initial = node
    ? node.attrs.latex
    : editor.state.doc.textBetween(range.from, range.to, " ");
  const anchor = node ? editor.view.nodeDOM(pos).getBoundingClientRect() : selectionRect();

  popover(anchor, (el) => {
    el.classList.toggle("wide", isBlock);
    const input = document.createElement("textarea");
    input.rows = isBlock ? Math.min(12, Math.max(4, initial.split("\n").length + 1)) : 1;
    input.value = initial;
    input.spellcheck = false;
    input.placeholder = isBlock ? "\\int_0^1 f(x)\\,dx" : "e^{i\\pi} + 1 = 0";
    const preview = document.createElement("div");
    preview.className = "preview";
    const render = () =>
      katex.render(input.value || "\\text{…}", preview, {
        throwOnError: false,
        displayMode: isBlock,
      });

    const apply = () => {
      const latex = input.value.trim();
      const chain = editor.chain().focus();
      if (node) {
        chain.command(({ tr }) => {
          if (latex) tr.setNodeMarkup(pos, undefined, { ...node.attrs, latex });
          else tr.delete(pos, pos + node.nodeSize);
          return true;
        });
      } else if (latex) {
        chain.insertContentAt(
          { from: range.from, to: range.to },
          { type: isBlock ? "blockMath" : "inlineMath", attrs: { latex } },
        );
      }
      chain.run();
      closePopover();
    };

    input.addEventListener("input", render);
    // Display math is often multi-line (aligned, cases…), so there Enter is a
    // newline and Ctrl+Enter applies. Inline math applies on Enter.
    input.addEventListener("keydown", (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Enter" && (mod || (!isBlock && !e.shiftKey))) {
        e.preventDefault();
        apply();
      } else if (e.key === "Escape") {
        closePopover();
        editor.commands.focus();
      }
    });
    el.append(
      input,
      preview,
      row(
        hint(isBlock ? "Ctrl+Enter to apply · Esc" : "Enter to apply · Esc"),
        ...(node ? [button("Remove", () => ((input.value = ""), apply()))] : []),
        button("Apply", apply, "primary"),
      ),
    );
    render();
    setTimeout(() => input.focus(), 0);
  });
}

function editLink() {
  const current = editor.getAttributes("link").href || "";
  popover(selectionRect(), (el) => {
    const input = document.createElement("input");
    input.type = "url";
    input.value = current;
    input.placeholder = "https://…";
    const apply = () => {
      const href = input.value.trim();
      const chain = editor.chain().focus().extendMarkRange("link");
      if (!href) chain.unsetLink();
      else if (editor.state.selection.empty && !current)
        chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] });
      else chain.setLink({ href });
      chain.run();
      closePopover();
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        apply();
      } else if (e.key === "Escape") {
        closePopover();
        editor.commands.focus();
      }
    });
    el.append(
      input,
      row(
        hint("Enter to apply · empty removes"),
        ...(current ? [button("Remove", () => ((input.value = ""), apply()))] : []),
        button("Apply", apply, "primary"),
      ),
    );
    setTimeout(() => input.select(), 0);
  });
}

// Alt text doubles as the figure caption when pandoc renders the post.
function editImageAlt(pos) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "image") return;
  popover(editor.view.nodeDOM(pos).getBoundingClientRect(), (el) => {
    const input = document.createElement("input");
    input.value = node.attrs.alt || "";
    input.placeholder = "Caption / alt text";
    const apply = () => {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, alt: input.value.trim() });
          return true;
        })
        .run();
      closePopover();
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        apply();
      } else if (e.key === "Escape") closePopover();
    });
    el.append(input, row(hint("Shown as the caption"), button("Apply", apply, "primary")));
    setTimeout(() => input.select(), 0);
  });
}

// ------------------------------------------------------------------ images

async function uploadImages(files, pos) {
  const images = [...files].filter((f) => f.type.startsWith("image/"));
  if (!images.length || !current) return false;
  setStatus("Uploading image…");
  await save(); // make sure the folder name is settled before writing into it
  for (const file of images) {
    try {
      const { src } = await api(
        "POST",
        `/api/upload?id=${encodeURIComponent(current.id)}`,
        file,
        { "Content-Type": file.type },
      );
      const at = pos ?? editor.state.selection.from;
      editor.chain().focus().insertContentAt(at, { type: "image", attrs: { src, alt: "" } }).run();
      pos = undefined;
    } catch (e) {
      setStatus(`Image upload failed: ${e.message}`, true);
      return true;
    }
  }
  return true;
}

// ------------------------------------------------------------------ editor

const editor = new Editor({
  element: $("#content"),
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      underline: false, // pandoc markdown has no underline
      link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
    }),
    Image,
    MathInline,
    MathBlock,
    Placeholder.configure({ placeholder: "Start writing…" }),
  ],
  editorProps: {
    handlePaste(_view, event) {
      const files = event.clipboardData?.files;
      if (!files?.length || ![...files].some((f) => f.type.startsWith("image/"))) return false;
      event.preventDefault();
      uploadImages(files);
      return true;
    },
    handleDrop(view, event, _slice, moved) {
      const files = event.dataTransfer?.files;
      if (moved || !files?.length) return false;
      if (![...files].some((f) => f.type.startsWith("image/"))) return false;
      event.preventDefault();
      const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
      uploadImages(files, at?.pos);
      return true;
    },
    handleDoubleClickOn(_view, pos, node) {
      if (node.type.name !== "image") return false;
      editImageAlt(pos);
      return true;
    },
    handleKeyDown(_view, event) {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === "k") {
        event.preventDefault();
        editLink();
        return true;
      }
      if (mod && event.key === "m") {
        event.preventDefault();
        editMath({ display: event.shiftKey });
        return true;
      }
      return false;
    },
  },
  onUpdate: () => changed(),
  onTransaction: () => {
    updateToolbar();
    requestAnimationFrame(fitWideMath);
  },
});

// Same rule as the published template: an inline formula wider than its
// paragraph becomes a sideways-scrolling block (.math-wide, blog-style.css).
function fitWideMath() {
  for (const el of editor.view.dom.querySelectorAll('[data-type="inline-math"]')) {
    el.classList.remove("math-wide");
    const box = el.parentElement.getBoundingClientRect();
    if (el.getBoundingClientRect().right > box.right + 1) el.classList.add("math-wide");
  }
}
window.addEventListener("resize", fitWideMath);
document.fonts?.ready.then(fitWideMath);

// ------------------------------------------------------------------ toolbar

const COMMANDS = {
  bold: { run: (c) => c.toggleBold(), active: ["bold"] },
  italic: { run: (c) => c.toggleItalic(), active: ["italic"] },
  strike: { run: (c) => c.toggleStrike(), active: ["strike"] },
  code: { run: (c) => c.toggleCode(), active: ["code"] },
  paragraph: { run: (c) => c.setParagraph(), active: ["paragraph"] },
  h2: { run: (c) => c.toggleHeading({ level: 2 }), active: ["heading", { level: 2 }] },
  h3: { run: (c) => c.toggleHeading({ level: 3 }), active: ["heading", { level: 3 }] },
  bullets: { run: (c) => c.toggleBulletList(), active: ["bulletList"] },
  numbers: { run: (c) => c.toggleOrderedList(), active: ["orderedList"] },
  quote: { run: (c) => c.toggleBlockquote(), active: ["blockquote"] },
  codeblock: { run: (c) => c.toggleCodeBlock(), active: ["codeBlock"] },
  rule: { run: (c) => c.setHorizontalRule() },
  undo: { run: (c) => c.undo() },
  redo: { run: (c) => c.redo() },
  link: { action: editLink, active: ["link"] },
  image: { action: () => els.file.click() },
  math: { action: () => editMath({ display: false }) },
  displaymath: { action: () => editMath({ display: true }) },
};

document.querySelectorAll("[data-cmd]").forEach((btn) => {
  const cmd = COMMANDS[btn.dataset.cmd];
  btn.addEventListener("mousedown", (e) => e.preventDefault()); // keep selection
  btn.addEventListener("click", () => {
    if (cmd.action) cmd.action();
    else cmd.run(editor.chain().focus()).run();
  });
});

function updateToolbar() {
  document.querySelectorAll("[data-cmd]").forEach((btn) => {
    const { active } = COMMANDS[btn.dataset.cmd];
    btn.classList.toggle("is-active", !!active && editor.isActive(...active));
  });
}

els.file.addEventListener("change", () => {
  uploadImages(els.file.files);
  els.file.value = "";
});

// ------------------------------------------------------------------ pandoc <-> editor HTML

// Every folder this post has lived in this session, so image URLs pointing
// at an old draft folder are still recognised as the post's own files.
let bases = new Set();

// pandoc's HTML (from index.md) -> the HTML Tiptap's schema understands.
function fromPandoc(html, base) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  for (const span of doc.querySelectorAll("span.math")) {
    const latex = span.textContent;
    const p = span.parentElement;
    const alone = p?.tagName === "P" && p.childNodes.length === 1;
    if (span.classList.contains("display") && alone) {
      const div = doc.createElement("div");
      div.dataset.type = "block-math";
      div.dataset.latex = latex;
      p.replaceWith(div);
    } else {
      const s = doc.createElement("span");
      s.dataset.type = "inline-math";
      s.dataset.latex = latex;
      span.replaceWith(s);
    }
  }
  for (const fig of doc.querySelectorAll("figure")) {
    const img = fig.querySelector("img");
    if (img) fig.replaceWith(img);
  }
  for (const pre of doc.querySelectorAll("pre[class]")) {
    const code = pre.querySelector("code");
    if (code && !code.className) code.className = `language-${pre.className.split(" ")[0]}`;
  }
  for (const img of doc.querySelectorAll("img")) {
    const src = img.getAttribute("src") || "";
    if (!/^([a-z]+:|\/|#)/i.test(src)) img.setAttribute("src", base + src);
  }
  return doc.body.innerHTML;
}

// Tiptap's HTML -> HTML that pandoc reads back as markdown with $math$.
function toPandoc(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const mathScript = (latex, display) => {
    const s = doc.createElement("script");
    s.type = display ? "math/tex; mode=display" : "math/tex";
    s.textContent = latex;
    return s;
  };
  for (const el of doc.querySelectorAll('[data-type="inline-math"]')) {
    el.replaceWith(mathScript(el.dataset.latex, false));
  }
  for (const el of doc.querySelectorAll('[data-type="block-math"]')) {
    const p = doc.createElement("p");
    p.append(mathScript(el.dataset.latex, true));
    el.replaceWith(p);
  }
  for (const img of doc.querySelectorAll("img")) {
    const src = img.getAttribute("src") || "";
    for (const base of bases) {
      const rest = src.startsWith(base) ? src.slice(base.length) : null;
      if (rest && !rest.includes("/")) img.setAttribute("src", rest);
    }
  }
  return doc.body.innerHTML;
}

// ------------------------------------------------------------------ posts

let current = null; // {id, title, date, draft}
let dirty = false;
let saving = null;
let timer = null;

function setStatus(text, error = false) {
  els.status.textContent = text;
  els.status.classList.toggle("error", error);
}

function titleText() {
  return els.title.textContent.replace(/\s+/g, " ").trim();
}

function renderMeta() {
  if (!current) return;
  const slug = current.draft ? slugify(titleText() || "Untitled") : current.id;
  els.date.textContent = current.date;
  els.meta.textContent = current.draft
    ? `Draft · publishes to /writing/${slug}/`
    : `Published · /writing/${slug}/ (URL is fixed once published)`;
  els.publish.hidden = !current.draft;
  els.remove.hidden = !current.draft;
  els.view.hidden = current.draft;
  els.view.href = `/writing/${current.id}/`;
  document.title = `${titleText() || "Untitled"} · Write`;
}

function changed() {
  if (!current) return;
  dirty = true;
  setStatus("Unsaved");
  clearTimeout(timer);
  timer = setTimeout(save, 800);
}

async function save() {
  clearTimeout(timer);
  while (saving) await saving;
  if (!dirty || !current) return;
  dirty = false;
  setStatus("Saving…");
  const post = current;
  saving = api("POST", "/api/post", {
    id: post.id,
    title: titleText(),
    html: toPandoc(editor.getHTML()),
  })
    .then((saved) => {
      if (saved.id !== post.id) {
        bases.add(`/writing/${saved.id}/`);
        history.replaceState(null, "", `#${saved.id}`);
      }
      Object.assign(post, saved);
      if (post === current) {
        renderMeta();
        if (!dirty) setStatus("Saved");
      }
      refreshList();
    })
    .catch((e) => {
      dirty = true;
      setStatus(`Save failed: ${e.message}`, true);
    })
    .finally(() => {
      saving = null;
    });
  await saving;
}

async function openPost(id) {
  await save();
  closePopover();
  try {
    const post = await api("GET", `/api/post?id=${encodeURIComponent(id)}`);
    current = { id: post.id, title: post.title, date: post.date, draft: post.draft };
    bases = new Set([post.base]);
    els.title.textContent = post.title;
    editor.commands.setContent(fromPandoc(post.html, post.base), { emitUpdate: false });
    // Fresh state so undo can't step back into the previous post.
    editor.view.updateState(
      EditorState.create({ doc: editor.state.doc, plugins: editor.state.plugins }),
    );
    dirty = false;
    els.main.hidden = false;
    els.empty.hidden = true;
    history.replaceState(null, "", `#${post.id}`);
    renderMeta();
    setStatus("Saved");
    highlightCurrent();
    return post;
  } catch (e) {
    setStatus(`Could not open ${id}: ${e.message}`, true);
    showEmpty();
  }
}

function showEmpty() {
  current = null;
  els.main.hidden = true;
  els.empty.hidden = false;
  history.replaceState(null, "", location.pathname);
  document.title = "Write";
  openDrawer();
}

async function newDraft() {
  await save();
  const post = await api("POST", "/api/new");
  await refreshList();
  await openPost(post.id);
  closeDrawer();
  els.title.focus();
  document.getSelection().selectAllChildren(els.title);
}

async function publish() {
  await save();
  const slug = slugify(titleText() || "Untitled");
  if (!confirm(`Publish to /writing/${slug}/ and add it to writing/index.html?`)) return;
  try {
    const post = await api("POST", "/api/publish", { id: current.id });
    await openPost(post.id);
    await refreshList();
    setStatus("Published");
  } catch (e) {
    setStatus(`Publish failed: ${e.message}`, true);
  }
}

async function deleteDraft() {
  if (!confirm(`Delete the draft "${titleText()}" and its images?`)) return;
  clearTimeout(timer);
  dirty = false;
  await api("DELETE", `/api/post?id=${encodeURIComponent(current.id)}`);
  await refreshList();
  showEmpty();
}

els.title.addEventListener("input", () => {
  renderMeta();
  changed();
});
// The title is one line: Enter (or a pasted newline) jumps into the body.
els.title.addEventListener("beforeinput", (e) => {
  if (e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") {
    e.preventDefault();
    editor.view.dom.focus(); // synchronously, so the next keystroke lands in the body
    editor.commands.focus("start");
  } else if (e.data?.includes("\n")) {
    e.preventDefault();
    document.execCommand("insertText", false, e.data.replace(/\s+/g, " "));
  }
});
els.publish.addEventListener("click", publish);
els.remove.addEventListener("click", deleteDraft);
document.querySelectorAll("[data-new]").forEach((b) => b.addEventListener("click", newDraft));

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    save();
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty || saving) {
    save();
    e.preventDefault();
  }
});

// ------------------------------------------------------------------ drawer

function openDrawer() {
  els.drawer.classList.add("open");
}
function closeDrawer() {
  if (current) els.drawer.classList.remove("open");
}
$("#posts").addEventListener("click", () => els.drawer.classList.toggle("open"));
document.addEventListener("mousedown", (e) => {
  if (!els.drawer.contains(e.target) && !$("#posts").contains(e.target)) closeDrawer();
});

function listItem(post) {
  const a = document.createElement("a");
  a.href = `#${post.id}`;
  a.dataset.id = post.id;
  const title = document.createElement("span");
  title.textContent = post.title;
  const date = document.createElement("small");
  date.textContent = post.date;
  a.append(title, date);
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    await openPost(post.id);
    closeDrawer();
  });
  return a;
}

async function refreshList() {
  const { drafts, published } = await api("GET", "/api/posts");
  els.drafts.replaceChildren(...drafts.map(listItem));
  if (!drafts.length) els.drafts.textContent = "No drafts.";
  els.published.replaceChildren(...published.map(listItem));
  highlightCurrent();
}

function highlightCurrent() {
  els.drawer.querySelectorAll("a[data-id]").forEach((a) => {
    a.classList.toggle("current", a.dataset.id === current?.id);
  });
}

// ------------------------------------------------------------------ start

await refreshList();
const start = decodeURIComponent(location.hash.slice(1));
if (start) await openPost(start);
else showEmpty();
updateToolbar();
