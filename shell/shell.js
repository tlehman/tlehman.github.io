// shell.js -- a small shell and terminal for /shell/.
//
// External commands are WebAssembly: every file in /bin holds the bytes of
// coreutils.wasm and runs through the WASI host in wasi.js against an
// in-memory filesystem. The shell itself (parsing, pipes, redirects, cd,
// completion, history) lives here, as do the builtins that need the page.

(() => {
const { E, FS, FT, Node, Process, isURL } = window.WASI;

const USER = 'web';
const HOST = 'tobi';
const HOME = `/home/${USER}`;
const HISTORY_KEY = 'programs-shell-history';

const enc = new TextEncoder();

const ERRORS = {
  [E.ACCES]: 'Permission denied', [E.EXIST]: 'File exists', [E.INVAL]: 'Invalid argument',
  [E.ISDIR]: 'Is a directory', [E.LOOP]: 'Too many levels of symbolic links',
  [E.NOENT]: 'No such file or directory', [E.NOTDIR]: 'Not a directory',
  [E.NOTEMPTY]: 'Directory not empty', [E.PERM]: 'Operation not permitted',
};
const strerror = (e) => ERRORS[e?.errno] || e?.message || String(e);

const concat = (chunks) => {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
};

const quote = (s) => (/^[\w@%+=:,./~♪-]+$/u.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

// =============================================================== Terminal

const SGR_FG = { 30: 0, 31: 1, 32: 2, 33: 3, 34: 4, 35: 5, 36: 6, 37: 7 };

class Terminal {
  constructor(root) {
    this.root = root;
    this.out = root.querySelector('.out');
    this.line = root.querySelector('.line');
    this.ps1 = this.line.querySelector('.ps1');
    this.before = this.line.querySelector('.before');
    this.cursor = this.line.querySelector('.cursor');
    this.after = this.line.querySelector('.after');
    this.input = root.querySelector('textarea');
    this.decoder = new TextDecoder();
    this.pending = '';
    this.style = { fg: null, bold: false, underline: false };
    this.link = null;
    this.sink = this.out;
    this.colsCache = 0;
    window.addEventListener('resize', () => { this.colsCache = 0; });
  }

  // Width of the terminal in character cells, for `ls` and friends.
  get cols() {
    if (this.colsCache) return this.colsCache;
    const probe = document.createElement('span');
    probe.textContent = 'x'.repeat(100);
    probe.style.visibility = 'hidden';
    this.out.append(probe);
    const ch = probe.getBoundingClientRect().width / 100;
    probe.remove();
    return (this.colsCache = Math.max(20, Math.floor(this.out.clientWidth / ch) || 80));
  }

  writeBytes(bytes) { this.write(this.decoder.decode(bytes, { stream: true })); }

  write(s) {
    s = this.pending + s;
    this.pending = '';
    let text = '';
    const flush = () => { if (text) { this.emit(text); text = ''; } };
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (c === '\x1b') {
        const rest = s.slice(i);
        if (rest.length < 2) { this.pending = rest; break; }
        if (rest[1] === '[') {
          const m = /^\x1b\[([0-9;?]*)([@-~])/.exec(rest);
          if (!m) {
            if (/^\x1b\[[0-9;?]*$/.test(rest)) { this.pending = rest; break; }
            i += 2; continue;
          }
          flush(); this.csi(m[1], m[2]); i += m[0].length; continue;
        }
        if (rest[1] === ']') {
          const m = /^\x1b\](.*?)(\x07|\x1b\\)/s.exec(rest);
          if (!m) { this.pending = rest; break; }
          flush(); this.osc(m[1]); i += m[0].length; continue;
        }
        i += 2; continue;
      }
      if (c !== '\r' && c !== '\x07' && c !== '\b') text += c;
      i++;
    }
    flush();
  }

  csi(params, final) {
    if (final === 'J' && params === '2') { this.clear(); return; }
    if (final !== 'm') return;
    const ps = params === '' ? [0] : params.split(';').map(Number);
    for (let k = 0; k < ps.length; k++) {
      const p = ps[k];
      if (p === 0) this.style = { fg: null, bold: false, underline: false };
      else if (p === 1) this.style.bold = true;
      else if (p === 22) this.style.bold = false;
      else if (p === 4) this.style.underline = true;
      else if (p === 24) this.style.underline = false;
      else if (p === 39) this.style.fg = null;
      else if (p in SGR_FG) this.style.fg = SGR_FG[p];
      else if (p >= 90 && p <= 97) this.style.fg = p - 82;
      else if (p === 38 && ps[k + 1] === 5) { this.style.fg = ps[k + 2] < 16 ? ps[k + 2] : null; k += 2; }
    }
  }

  osc(body) {
    // OSC 8 ; params ; uri  -- hyperlinks
    const m = /^8;[^;]*;(.*)$/s.exec(body);
    if (m) this.link = m[1] || null;
    // OSC 777 ; nowrap|wrap  -- a block that scrolls sideways instead of
    // wrapping, so laid-out math keeps its shape on narrow screens
    if (body === '777;nowrap') {
      const block = document.createElement('span');
      block.className = 'nowrap';
      this.out.append(block);
      this.sink = block;
    } else if (body === '777;wrap') this.sink = this.out;
  }

  styled(tag) {
    const el = document.createElement(tag);
    const cls = [];
    if (this.style.fg !== null) cls.push(`c${this.style.fg}`);
    if (this.style.bold) cls.push('b');
    if (this.style.underline) cls.push('u');
    if (cls.length) el.className = cls.join(' ');
    return el;
  }

  anchor(uri, text) {
    const a = this.styled('a');
    a.textContent = text;
    if (uri.startsWith('file://')) {
      a.href = '#';
      a.dataset.path = decodeURI(uri.replace(/^file:\/\/[^/]*/, ''));
    } else {
      a.href = uri;
    }
    return a;
  }

  emit(text) {
    if (this.link) { this.sink.append(this.anchor(this.link, text)); return; }
    // linkify bare URLs in plain output
    const parts = text.split(/(https?:\/\/[^\s'"<>]+)/);
    parts.forEach((part, k) => {
      if (!part) return;
      if (k % 2) { this.sink.append(this.anchor(part, part)); return; }
      if (this.style.fg === null && !this.style.bold && !this.style.underline) {
        this.sink.append(document.createTextNode(part));
      } else {
        const span = this.styled('span');
        span.textContent = part;
        this.sink.append(span);
      }
    });
  }

  clear() { this.out.textContent = ''; this.sink = this.out; }

  setPrompt(ps1) { this.ps1.textContent = ps1; }

  // Copy the current prompt + typed text into the scrollback.
  echoLine(suffix = '') {
    this.write(this.ps1.textContent + this.input.value + suffix + '\n');
  }

  render() {
    const v = this.input.value;
    const p = Math.min(this.input.selectionStart ?? v.length, v.length);
    const ch = p < v.length ? String.fromCodePoint(v.codePointAt(p)) : ' ';
    this.before.textContent = v.slice(0, p);
    this.cursor.textContent = ch;
    this.after.textContent = v.slice(p + (p < v.length ? ch.length : 0));
  }

  scrollToBottom() {
    window.scrollTo(0, document.documentElement.scrollHeight);
  }
}

// ================================================================== Shell

class Shell {
  constructor(term, fs) {
    this.term = term;
    this.fs = fs;
    this.status = 0;
    this.modules = new WeakMap();
    this.env = {
      HOME, USER, LOGNAME: USER, HOSTNAME: HOST, SHELL: '/bin/sh', PATH: '/bin',
      TERM: 'xterm-256color', LANG: 'en_US.UTF-8', PWD: HOME, OLDPWD: HOME,
    };
    this.history = [];
    try { this.history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch {}
    this.histPos = this.history.length;
  }

  get cwd() { return this.env.PWD; }

  tilde(path) {
    return path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;
  }

  prompt() { return this.texsh ? 'texsh> ' : `${USER}@${HOST}:${this.tilde(this.cwd)}$ `; }

  // Lexically resolve a path against $PWD (like `cd -L`).
  abs(path) {
    const parts = [];
    const full = path.startsWith('/') ? path : `${this.cwd}/${path}`;
    for (const c of full.split('/')) {
      if (!c || c === '.') continue;
      if (c === '..') parts.pop(); else parts.push(c);
    }
    return '/' + parts.join('/');
  }

  // ------------------------------------------------------------- parsing

  tokenize(src) {
    const toks = [];
    let word = null;
    const push = (s, q, v) => { (word ||= { segs: [] }).segs.push({ s, q, v }); };
    const end = () => { if (word) toks.push(word); word = null; };
    // returns [variable name or null, characters consumed]
    const variable = (j) => {
      const rest = src.slice(j + 1);
      if (rest[0] === '?' || rest[0] === '$') return [rest[0], 2];
      const m = /^\{([A-Za-z_]\w*)\}/.exec(rest) || /^([A-Za-z_]\w*)/.exec(rest);
      return m ? [m[1], m[0].length + 1] : [null, 1];
    };
    const pushVar = (name) => { if (name) push('', 2, name); else push('$', 1); };
    for (let i = 0; i < src.length;) {
      const c = src[i];
      if (/\s/.test(c)) { end(); i++; continue; }
      if (c === '#' && !word) break;
      if (c === '\\') { if (i + 1 < src.length) push(src[i + 1], 1); i += 2; continue; }
      if (c === "'") {
        const j = src.indexOf("'", i + 1);
        if (j < 0) throw new SyntaxError('unexpected EOF while looking for matching `\'\'');
        push(src.slice(i + 1, j), 1); i = j + 1; continue;
      }
      if (c === '"') {
        let j = i + 1, buf = '';
        while (j < src.length && src[j] !== '"') {
          if (src[j] === '\\' && '"\\$`'.includes(src[j + 1])) { buf += src[j + 1]; j += 2; continue; }
          if (src[j] === '$') {
            const [v, n] = variable(j);
            if (v) { push(buf, 2); pushVar(v); buf = ''; } else buf += '$';
            j += n; continue;
          }
          buf += src[j++];
        }
        if (j >= src.length) throw new SyntaxError('unexpected EOF while looking for matching `"\'');
        push(buf, 2); i = j + 1; continue;
      }
      if (c === '$') { const [v, n] = variable(i); pushVar(v); i += n; continue; }
      if (c === '~' && !word && (i + 1 === src.length || /[\s/]/.test(src[i + 1]))) { push(HOME, 1); i++; continue; }
      const op = !word || /[|&;<>]/.test(c)
        ? ['2>&1', '&&', '||', '>>', '2>', '|', ';', '>', '<', '&'].find((o) => src.startsWith(o, i)
          && (o[0] !== '2' || !word))
        : null;
      if (op) { end(); toks.push({ op }); i += op.length; continue; }
      push(c, 0); i++;
    }
    end();
    return toks;
  }

  // [{ op: ';' | '&&' | '||', pipeline: [{ words, redirs }] }]
  parse(toks) {
    const list = [];
    let pipeline = [], cmd = { words: [], redirs: [] }, joiner = ';';
    const endCmd = (op) => {
      if (!cmd.words.length && !cmd.redirs.length) throw new SyntaxError(`syntax error near unexpected token \`${op}'`);
      pipeline.push(cmd);
      cmd = { words: [], redirs: [] };
    };
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!t.op) { cmd.words.push(t); continue; }
      if (t.op === '|') { endCmd('|'); continue; }
      if (['>', '>>', '<', '2>'].includes(t.op)) {
        const target = toks[++i];
        if (!target || target.op) throw new SyntaxError('syntax error near unexpected token `newline\'');
        cmd.redirs.push({ op: t.op, target });
        continue;
      }
      if (t.op === '2>&1') { cmd.redirs.push({ op: t.op }); continue; }
      // ; && || &
      endCmd(t.op);
      list.push({ op: joiner, pipeline });
      pipeline = [];
      joiner = t.op === '&' ? ';' : t.op;
    }
    if (cmd.words.length || cmd.redirs.length) pipeline.push(cmd);
    else if (pipeline.length || joiner === '&&' || joiner === '||') throw new SyntaxError('syntax error: unexpected end of file');
    if (pipeline.length) list.push({ op: joiner, pipeline });
    return list;
  }

  getVar(name) {
    if (name === '?') return String(this.status);
    if (name === '$') return '4242';
    return this.env[name] ?? '';
  }

  expand(word) {
    const segs = word.segs.map((s) => (s.v ? { ...s, s: this.getVar(s.v) } : s));
    const text = segs.map((s) => s.s).join('');
    if (!segs.some((s) => s.q === 0 && /[*?[]/.test(s.s))) return [text];
    const pattern = segs.map((s) => (s.q ? s.s.replace(/[*?[\]\\]/g, '\\$&') : s.s)).join('');
    const matches = this.glob(pattern);
    return matches.length ? matches : [text];
  }

  glob(pattern) {
    const toRegex = (comp) => {
      let re = '';
      for (let i = 0; i < comp.length; i++) {
        const c = comp[i];
        if (c === '\\') re += comp[++i]?.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') ?? '';
        else if (c === '*') re += '[^/]*';
        else if (c === '?') re += '[^/]';
        else if (c === '[') {
          const j = comp.indexOf(']', i + 2);
          if (j < 0) re += '\\[';
          else { re += '[' + comp.slice(i + 1, j).replace(/^!/, '^').replace(/\\/g, '\\\\') + ']'; i = j; }
        } else re += c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
      }
      return new RegExp(`^${re}$`, 'u');
    };
    const unescape = (s) => s.replace(/\\(.)/g, '$1');
    let bases = [pattern.startsWith('/') ? '/' : ''];
    for (const comp of pattern.split('/').filter(Boolean)) {
      const next = [];
      for (const base of bases) {
        if (!/(^|[^\\])[*?[]/.test(comp)) { next.push(base + unescape(comp)); continue; }
        const dir = this.fs.tryGet(this.abs(base || '.'));
        if (dir?.type !== FT.DIR) continue;
        const re = toRegex(comp);
        for (const name of dir.children.keys()) {
          if (name.startsWith('.') && !comp.startsWith('.')) continue;
          if (re.test(name)) next.push(base + name);
        }
      }
      bases = next.map((b) => b + '/');
    }
    return bases
      .map((b) => b.replace(/\/$/, '') || '/')
      .filter((p) => this.fs.tryGet(this.abs(p), false))
      .sort();
  }

  // ----------------------------------------------------------- execution

  run(line) {
    if (this.texsh) {
      this.texsh.history.push(line);
      const say = (s) => this.term.write(s);
      const err = (s) => this.term.write(`\x1b[31m${s}\x1b[0m`);
      this.status = texshLine(this, line, say, err, true);
      return;
    }
    let list;
    try { list = this.parse(this.tokenize(line)); } catch (e) {
      this.term.write(`sh: ${e.message}\n`);
      this.status = 2;
      return;
    }
    for (const { op, pipeline } of list) {
      if (op === '&&' && this.status !== 0) continue;
      if (op === '||' && this.status === 0) continue;
      this.status = this.runPipeline(pipeline);
    }
  }

  runPipeline(cmds) {
    let input = new Uint8Array(0), status = 0;
    const toTerm = (b) => this.term.writeBytes(b);
    for (let k = 0; k < cmds.length; k++) {
      const cmd = cmds[k];
      const last = k === cmds.length - 1;
      const argv = cmd.words.flatMap((w) => this.expand(w));
      const out = [], err = [];
      let stdin = input, outFile = null, errFile = null, errToOut = false;
      try {
        for (const r of cmd.redirs) {
          if (r.op === '2>&1') { errToOut = true; continue; }
          const target = this.expand(r.target)[0];
          if (r.op === '<') stdin = this.readFile(target);
          else if (r.op === '2>') errFile = { path: target, append: false };
          else outFile = { path: target, append: r.op === '>>' };
        }
      } catch (e) {
        this.term.write(`sh: ${e.path}: ${strerror(e)}\n`);
        status = 1; input = new Uint8Array(0);
        continue;
      }
      const tty = last && !outFile;
      const stdout = tty ? toTerm : (b) => out.push(b);
      const stderr = errToOut ? stdout : errFile ? (b) => err.push(b) : toTerm;
      status = this.execute(argv, { stdin, stdout, stderr, tty: { 1: tty, 2: !errFile && (!errToOut || tty) } });
      try {
        if (outFile) this.writeFile(outFile.path, concat(out), outFile.append);
        if (errFile) this.writeFile(errFile.path, concat(err), false);
      } catch (e) {
        this.term.write(`sh: ${e.path}: ${strerror(e)}\n`);
        status = 1;
      }
      input = outFile ? new Uint8Array(0) : concat(out);
    }
    return status;
  }

  readFile(path) {
    try {
      const node = this.fs.get(this.abs(path));
      if (node.type === FT.DIR) throw Object.assign(new Error(), { errno: E.ISDIR });
      return node.type === FT.FILE ? node.data : new Uint8Array(0);
    } catch (e) { throw Object.assign(e, { path }); }
  }

  writeFile(path, bytes, append) {
    try {
      const { node, parent, name, url } = this.fs.lookup(this.abs(path));
      if (url) throw Object.assign(new Error(), { errno: E.NOENT });
      if (node?.type === FT.DIR) throw Object.assign(new Error(), { errno: E.ISDIR });
      if (node?.type === FT.CHAR) return;
      const file = node || new Node(FT.FILE);
      if (!node) parent.children.set(name, file);
      file.data = append ? concat([file.data, bytes]) : bytes.slice();
      file.mtime = BigInt(Date.now()) * 1000000n;
    } catch (e) { throw Object.assign(e, { path }); }
  }

  which(name) {
    if (name.includes('/')) return this.abs(name);
    for (const dir of (this.env.PATH || '').split(':')) {
      const p = this.abs(`${dir}/${name}`);
      if (this.fs.tryGet(p)?.type === FT.FILE) return p;
    }
    return null;
  }

  execute(argv, io) {
    if (!argv.length) return 0;
    const [name] = argv;
    const say = (s) => io.stdout(enc.encode(s));
    const err = (s) => io.stderr(enc.encode(s));
    const builtin = BUILTINS[name];
    if (builtin) return builtin.call(this, argv, say, err, io) ?? 0;

    const path = this.which(name);
    if (!path) { err(`sh: ${name}: command not found\n`); return 127; }
    let found;
    try { found = this.fs.lookup(path); } catch (e) { err(`sh: ${name}: ${strerror(e)}\n`); return 127; }
    if (found.url) return this.open(found.url, say);
    if (!found.node) { err(`sh: ${name}: No such file or directory\n`); return 127; }
    if (found.node.type === FT.DIR) { err(`sh: ${name}: Is a directory\n`); return 126; }

    let module = this.modules.get(found.node.data);
    if (!module) {
      try { module = new WebAssembly.Module(found.node.data); } catch {
        err(`sh: ${name}: cannot execute binary file: Exec format error\n`);
        return 126;
      }
      this.modules.set(found.node.data, module);
    }
    const env = { ...this.env, COLUMNS: String(this.term.cols), ...tzEnv() };
    const proc = new Process({ fs: this.fs, args: argv, env, stdin: io.stdin, stdout: io.stdout, stderr: io.stderr, tty: io.tty });
    try {
      return proc.run(module);
    } catch (e) {
      err(`${name}: ${e.message}\n`);
      return 134;
    }
  }

  open(url, say) {
    say(`Opening ${url}\n`);
    setTimeout(() => { window.location.href = url; }, 200);
    return 0;
  }

  // ---------------------------------------------------------- completion

  complete(value, pos) {
    if (this.texsh) return null;
    const head = value.slice(0, pos);
    const m = /(?:^|[\s|;&<>])((?:\\.|[^\s|;&<>])*)$/.exec(head);
    const word = m[1];
    const start = pos - word.length;
    const first = !/\S/.test(head.slice(0, start).replace(/.*(\|\||&&|[|;&])/, ''));
    const raw = word.replace(/\\(.)/g, '$1');
    let candidates = [];

    if (first && !raw.includes('/')) {
      const names = new Set(Object.keys(BUILTINS));
      for (const dir of this.env.PATH.split(':')) {
        const d = this.fs.tryGet(this.abs(dir));
        if (d?.type === FT.DIR) for (const n of d.children.keys()) names.add(n);
      }
      candidates = [...names].filter((n) => n.startsWith(raw)).sort().map((n) => ({ text: n, suffix: ' ' }));
    } else {
      const slash = raw.lastIndexOf('/');
      const dirPart = raw.slice(0, slash + 1);
      const prefix = raw.slice(slash + 1);
      const dirPath = dirPart.startsWith('~') ? HOME + dirPart.slice(1) : dirPart || '.';
      const dir = this.fs.tryGet(this.abs(dirPath));
      if (dir?.type === FT.DIR) {
        for (const [n, node] of dir.children) {
          if (!n.startsWith(prefix) || (n.startsWith('.') && !prefix.startsWith('.'))) continue;
          let target = node;
          if (node.type === FT.LINK && !isURL(node.target)) target = this.fs.tryGet(this.abs(dirPath + '/' + n));
          const isDir = target?.type === FT.DIR;
          candidates.push({ text: dirPart + n, suffix: isDir ? '/' : ' ', display: n + (isDir ? '/' : '') });
        }
        candidates.sort((a, b) => a.text.localeCompare(b.text));
      }
    }
    if (!candidates.length) return null;
    const esc = (s) => s.replace(/([\s'"\\|;&<>()$`*?[\]#!])/g, '\\$1');
    if (candidates.length === 1) {
      const c = candidates[0];
      return { value: value.slice(0, start) + esc(c.text) + c.suffix + value.slice(pos), pos: start + esc(c.text).length + 1 };
    }
    let common = candidates[0].text;
    for (const c of candidates) while (!c.text.startsWith(common)) common = common.slice(0, -1);
    if (common.length > raw.length) {
      return { value: value.slice(0, start) + esc(common) + value.slice(pos), pos: start + esc(common).length };
    }
    return { list: candidates.map((c) => c.display || c.text) };
  }

  remember(line) {
    if (line.trim() && this.history[this.history.length - 1] !== line) this.history.push(line);
    if (this.history.length > 500) this.history.splice(0, this.history.length - 500);
    this.histPos = this.history.length;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history)); } catch {}
  }
}

function tzEnv() {
  const d = new Date();
  const name = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || 'UTC';
  return { TZOFFSET: String(-d.getTimezoneOffset()), TZNAME: name };
}

// ================================================================= texsh

// One line of texsh's command language (see texsh's src/once.ts and
// src/shell.ts), rendered with Unicode cells since a page can't draw Kitty
// graphics. `interactive` is the REPL started by a bare `texsh`.
function texshLine(shell, line, say, err, interactive, tty = true) {
  const T = window.TEXSH;
  const cmd = T.parseLine(line);
  if (!cmd) return 0;
  const gray = (s) => (tty ? `\x1b[90m${s}\x1b[0m` : s);
  const copy = (text) => {
    shell.texsh && (shell.texsh.last = text);
    navigator.clipboard?.writeText(text).catch(() => {});
  };
  const unicode = (latex) => {
    const r = T.latexToUnicode(latex);
    for (const w of r.warnings) err(`⚠ ${w}\n`);
    return r.text;
  };
  switch (cmd.kind) {
    case 'render':
      for (const latex of cmd.exprs) {
        let out;
        try { out = T.renderLatexToString(latex); } catch (e) { err(`error: ${e.message}\n`); return 1; }
        say(tty ? `\x1b]777;nowrap\x07${out}\x1b]777;wrap\x07\n` : `${out}\n`);
      }
      return 0;
    case 'unicode': {
      let rc = 0;
      for (const latex of cmd.exprs) {
        try {
          const text = unicode(latex);
          say(`${text}\n`);
          const points = T.formatCodePoints(text);
          if (points) say(gray(`${points}\n`));
          if (interactive) copy(text);
        } catch (e) { err(`syntax error: ${e.message}\n`); rc = 1; }
      }
      return rc;
    }
    case 'copy': {
      let text;
      if (cmd.exprs.length) {
        try { text = cmd.exprs.map(unicode).join('\n'); } catch (e) { err(`syntax error: ${e.message}\n`); return 1; }
      } else if (interactive && shell.texsh.last) text = shell.texsh.last;
      else { err('usage: copy $…$ (nothing to copy yet)\n'); return 1; }
      copy(text);
      say(`${text}\n`);
      say(gray(navigator.clipboard ? 'copied to the clipboard\n' : 'no clipboard access here\n'));
      return 0;
    }
    case 'help':
      say(T.HELP_LINES.filter((l) => !/^\s+(mode <m>|mouse drag)/.test(l)).join('\n') + '\n');
      return 0;
    case 'examples':
      say(T.EXAMPLE_LINES.join('\n') + '\n');
      return 0;
    case 'message':
      if (cmd.color === 'error') { err(`${cmd.text}\n`); return 1; }
      say(gray(`${cmd.text}\n`));
      return 0;
    case 'mode':
      if (cmd.mode === 'kitty') { err('kitty graphics need a real terminal; the browser renders Unicode cells\n'); return 1; }
      return 0;
    case 'history':
    case 'clear':
    case 'exit':
      if (!interactive) { err(`'${cmd.kind}' only makes sense in the interactive shell\n`); return 1; }
      if (cmd.kind === 'history') shell.texsh.history.slice(0, -1).forEach((h, i) => say(`${String(i + 1).padStart(4)}  ${h}\n`));
      if (cmd.kind === 'clear') shell.term.clear();
      if (cmd.kind === 'exit') shell.texsh = null;
      return 0;
  }
  return 0;
}

// =============================================================== builtins

const HELP = `\x1b[1mweb@tobi\x1b[0m: a shell in your browser.

The commands in /bin are one C program compiled to WebAssembly (WASI),
running against an in-memory filesystem. Changes vanish on reload.

  \x1b[1;32mls\x1b[0m cat tree grep head tail wc sort uniq rev echo seq date uname
  mkdir rmdir touch rm cp mv ln readlink stat basename dirname env
  \x1b[1mbuiltins:\x1b[0m cd pwd open export unset history clear help which exit texsh

  \x1b[1mtexsh\x1b[0m              LaTeX math shell (github.com/tlehman/texsh): type
                     $\\frac{1}{2}$ to render it, \`help\` inside for more
  \x1b[1mtexsh -c\x1b[0m '$x^2$'   render one line and return

Pipes (|), redirects (> >> < 2>), && || ; quoting, $VARS and globs work.
Links are clickable; \`open NAME\` or \`cd\` into one follows it.
Tab completes, ↑/↓ walk history, Ctrl-C cancels, Ctrl-L clears.
`;

const BUILTINS = {
  cd(argv, say, err) {
    let target = argv[1] ?? HOME;
    if (target === '-') { target = this.env.OLDPWD; say(target + '\n'); }
    const path = this.abs(target);
    let found;
    try { found = this.fs.lookup(path); } catch (e) { err(`sh: cd: ${target}: ${strerror(e)}\n`); return 1; }
    if (found.url) return this.open(found.url, say);
    if (!found.node) { err(`sh: cd: ${target}: No such file or directory\n`); return 1; }
    if (found.node.type !== FT.DIR) { err(`sh: cd: ${target}: Not a directory\n`); return 1; }
    this.env.OLDPWD = this.env.PWD;
    this.env.PWD = path;
    return 0;
  },
  pwd(argv, say) { say(this.cwd + '\n'); },
  open(argv, say, err) {
    if (argv.length < 2) { err('usage: open FILE|URL\n'); return 1; }
    const target = argv[1];
    if (isURL(target)) return this.open(target, say);
    let found;
    try { found = this.fs.lookup(this.abs(target)); } catch (e) { err(`open: ${target}: ${strerror(e)}\n`); return 1; }
    if (found.url) return this.open(found.url, say);
    if (!found.node) { err(`open: ${target}: No such file or directory\n`); return 1; }
    if (found.node.type === FT.DIR) return BUILTINS.cd.call(this, ['cd', target], say, err);
    err(`open: ${target}: not a link (try cat)\n`);
    return 1;
  },
  export(argv, say) {
    if (argv.length === 1) {
      for (const [k, v] of Object.entries(this.env)) say(`export ${k}=${quote(v)}\n`);
      return;
    }
    for (const a of argv.slice(1)) {
      const eq = a.indexOf('=');
      if (eq > 0) this.env[a.slice(0, eq)] = a.slice(eq + 1);
    }
  },
  unset(argv) { for (const a of argv.slice(1)) delete this.env[a]; },
  history(argv, say) {
    if (argv[1] === '-c') { this.history = []; this.remember(''); return; }
    this.history.forEach((h, i) => say(`${String(i + 1).padStart(5)}  ${h}\n`));
  },
  clear() { this.term.clear(); },
  help(argv, say) { say(HELP); },
  which(argv, say) {
    let rc = 0;
    for (const n of argv.slice(1)) {
      if (BUILTINS[n]) say(`${n}: shell built-in command\n`);
      else { const p = this.which(n); if (p) say(p + '\n'); else rc = 1; }
    }
    return rc;
  },
  type(argv, say, err) {
    let rc = 0;
    for (const n of argv.slice(1)) {
      if (BUILTINS[n]) say(`${n} is a shell builtin\n`);
      else { const p = this.which(n); if (p) say(`${n} is ${p}\n`); else { err(`sh: type: ${n}: not found\n`); rc = 1; } }
    }
    return rc;
  },
  exit(argv, say) {
    say('logout\n');
    setTimeout(() => { window.location.href = '../index.html'; }, 300);
  },
};
BUILTINS.texsh = function texsh(argv, say, err, io) {
  if (!window.TEXSH) { err('texsh: not available (texsh.js failed to load)\n'); return 1; }
  const usage = `usage: texsh                 interactive LaTeX math shell
       texsh -c '<line>'     evaluate one line and print the result
       texsh -c 'unicode $\\mathbb{R}$'
       texsh -c '$x^2 + y^2 = z^2$'
`;
  if (argv[1] === '-h' || argv[1] === '--help') { say(usage); return 0; }
  if (argv[1] === '-c' || argv[1] === '--command') return texshLine(this, argv.slice(2).join(' '), say, err, false, io.tty[1]);
  if (argv.length > 1) { err(usage); return 2; }
  // piped input: evaluate each line, like `texsh -c`
  if (io.stdin.length || !io.tty[1]) {
    let rc = 0;
    for (const line of new TextDecoder().decode(io.stdin).split('\n')) {
      rc = texshLine(this, line, say, err, false, io.tty[1]) || rc;
    }
    return rc;
  }
  this.texsh = { history: [], last: '' };
  say("texsh: LaTeX math shell. Wrap LaTeX in $…$; try 'examples', 'help', or 'exit'.\n");
  return 0;
};
BUILTINS['xdg-open'] = BUILTINS.open;
BUILTINS.logout = BUILTINS.exit;

// ============================================================ filesystem

function seed(fs, wasm, applets, programs) {
  for (const name of applets) fs.writeFile(`/bin/${name}`, wasm);
  fs.mkdirp('/tmp');
  fs.add('/dev/null', new Node(FT.CHAR));
  fs.writeFile('/etc/hostname', `${HOST}\n`);
  fs.writeFile(`${HOME}/README`, `Hi, I'm Tobi. This is a shell running in your browser.

  ls ~/programs      things I've made that aren't on GitHub
  ls ~/github        everything that is
  help               what this shell can do

The tools in /bin are a tiny coreutils written in C and compiled to
WebAssembly; the source is in /shell/ of
https://github.com/tlehman/tlehman.github.io
`);
  fs.symlink(`${HOME}/github/tlehman`, 'https://github.com/tlehman/');

  const readme = ['~/programs', '', 'Things I have built that are not on GitHub (for those, see ~/github).',
    'Links are symlinks: click one, `open NAME`, or `ls -l` to see where it points.', ''];
  for (const p of programs) {
    const path = `${HOME}/programs/${p.name}`;
    if (p.href) fs.symlink(path, p.href);
    else fs.writeFile(path, `${p.desc || p.name}\n(source not published)\n`);
    readme.push([p.icon, p.name].filter(Boolean).join(' ') + (p.desc ? ` -- ${p.desc}` : ''));
  }
  fs.writeFile(`${HOME}/programs/README.md`, readme.join('\n') + '\n');
}

function readPrograms(list) {
  return [...list.querySelectorAll('li')].map((li) => {
    const a = li.querySelector('a');
    return {
      name: (a || li.querySelector('.name')).textContent.trim(),
      href: a?.href,
      icon: li.dataset.icon,
      desc: li.querySelector('.desc')?.textContent.trim(),
    };
  });
}

// ================================================================ wiring

function attachInput(term, shell) {
  const input = term.input;
  let lastTabAt = 0;

  const prompt = () => {
    term.setPrompt(shell.prompt());
    document.title = `${USER}@${HOST}:${shell.tilde(shell.cwd)}`;
    input.value = '';
    term.render();
    term.scrollToBottom();
  };

  const submit = (line, { remember = true } = {}) => {
    input.value = line;
    term.echoLine();
    if (remember) shell.remember(line);
    shell.run(line);
    prompt();
  };

  const setValue = (value, pos = value.length) => {
    input.value = value;
    input.setSelectionRange(pos, pos);
    term.render();
  };

  const tab = () => {
    const r = shell.complete(input.value, input.selectionStart);
    if (!r) return;
    if (r.list) {
      // second Tab in a row lists the candidates, like bash
      if (Date.now() - lastTabAt < 1500 || matchMedia('(pointer: coarse)').matches) {
        term.echoLine();
        const width = Math.max(...r.list.map((s) => [...s].length)) + 2;
        const perRow = Math.max(1, Math.floor(term.cols / width));
        const rows = [];
        for (let i = 0; i < r.list.length; i += perRow) {
          rows.push(r.list.slice(i, i + perRow).map((s) => s.padEnd(width)).join('').trimEnd());
        }
        term.write(rows.join('\n') + '\n');
        term.scrollToBottom();
      }
      lastTabAt = Date.now();
      return;
    }
    setValue(r.value, r.pos);
  };

  const history = (dir) => {
    const h = shell.history;
    if (shell.histPos === h.length) shell.draft = input.value;
    shell.histPos = Math.max(0, Math.min(h.length, shell.histPos + dir));
    setValue(shell.histPos === h.length ? shell.draft ?? '' : h[shell.histPos]);
  };

  const interrupt = () => {
    term.echoLine('^C');
    shell.texsh = null;
    shell.status = 130;
    shell.histPos = shell.history.length;
    prompt();
  };

  const keys = {
    Enter: () => submit(input.value),
    Tab: tab,
    ArrowUp: () => history(-1),
    ArrowDown: () => history(1),
    'C-c': interrupt,
    'C-l': () => { term.clear(); term.scrollToBottom(); },
    'C-a': () => setValue(input.value, 0),
    'C-e': () => setValue(input.value),
    'C-u': () => { const p = input.selectionStart; setValue(input.value.slice(p), 0); },
    'C-k': () => { const p = input.selectionStart; setValue(input.value.slice(0, p), p); },
    'C-w': () => {
      const p = input.selectionStart;
      const head = input.value.slice(0, p).replace(/\S+\s*$/, '');
      setValue(head + input.value.slice(p), head.length);
    },
    'C-p': () => history(-1),
    'C-n': () => history(1),
    // readline word motion; a word is a run of letters and digits
    'M-b': () => {
      const head = input.value.slice(0, input.selectionStart);
      setValue(input.value, head.replace(/[\p{L}\p{N}]*[^\p{L}\p{N}]*$/u, '').length);
    },
    'M-f': () => {
      const p = input.selectionStart;
      const skip = /^[^\p{L}\p{N}]*[\p{L}\p{N}]*/u.exec(input.value.slice(p))[0].length;
      setValue(input.value, p + skip);
    },
  };

  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    let key = e.key;
    if (e.ctrlKey && !e.altKey && !e.metaKey && key.length === 1) key = `C-${key.toLowerCase()}`;
    // Alt/Option: use the physical key, since on a Mac Option-B types ∫
    else if (e.altKey && !e.ctrlKey && !e.metaKey && /^Key[A-Z]$/.test(e.code)) key = `M-${e.code.slice(3).toLowerCase()}`;
    else if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (key === 'Enter' && e.shiftKey) return;
    // Ctrl-C copies when something is selected
    if (key === 'C-c' && (input.selectionStart !== input.selectionEnd || String(getSelection()))) return;
    const fn = keys[key];
    if (!fn) { requestAnimationFrame(() => term.render()); return; }
    e.preventDefault();
    fn();
  });

  input.addEventListener('input', () => {
    // mobile keyboards and multi-line pastes arrive as newlines
    if (input.value.includes('\n')) {
      const lines = input.value.split(/\r?\n/);
      const rest = lines.pop();
      for (const line of lines) submit(line);
      setValue(rest);
      return;
    }
    term.render();
  });
  document.addEventListener('selectionchange', () => { if (document.activeElement === input) term.render(); });
  input.addEventListener('focus', () => term.root.classList.add('focused'));
  input.addEventListener('blur', () => term.root.classList.remove('focused'));

  // pressing on the prompt line always focuses it (and never selects words
  // there, which a quick second tap on a phone would otherwise do)
  term.line.addEventListener('mousedown', (e) => {
    e.preventDefault();
    input.focus({ preventScroll: true });
  });

  // clicking anywhere in the terminal focuses the prompt, unless selecting text
  term.root.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    if (String(getSelection())) return;
    input.focus({ preventScroll: true });
  });

  // links that ls printed for local files and directories
  term.out.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-path]');
    if (!a) return;
    e.preventDefault();
    const path = a.dataset.path;
    const node = shell.fs.tryGet(path);
    const rel = path.startsWith(shell.cwd + '/') ? path.slice(shell.cwd.length + 1) : shell.tilde(path);
    let cmd;
    if (node?.type === FT.DIR) cmd = `cd ${quote(rel)} && ls`;
    else if (path.startsWith('/bin/')) cmd = `type ${quote(path.slice(5))}`;
    else cmd = `cat ${quote(rel)}`;
    submit(cmd);
    if (!matchMedia('(pointer: coarse)').matches) input.focus({ preventScroll: true });
  });

  // on-screen keys for phones: they lack Tab, arrows and Ctrl
  const bar = term.root.querySelector('.keys');
  bar?.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    e.preventDefault(); // keep focus (and the keyboard) on the textarea
    input.focus({ preventScroll: true });
    const k = b.dataset.key;
    if (keys[k]) keys[k]();
    else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      const p = Math.max(0, Math.min(input.value.length, input.selectionStart + (k === 'ArrowLeft' ? -1 : 1)));
      setValue(input.value, p);
    } else {
      input.setRangeText(k, input.selectionStart, input.selectionEnd, 'end');
      term.render();
    }
  });

  return { prompt, submit };
}

async function boot() {
  const root = document.getElementById('term');
  const term = new Terminal(root);
  // embedded by coreutils.wasm.js so the page also works from file://
  const wasm = Uint8Array.from(atob(window.COREUTILS_WASM), (c) => c.charCodeAt(0));

  // ask the binary which applets it has
  const module = await WebAssembly.compile(wasm);
  let listing = '';
  new Process({
    fs: new FS(), args: ['coreutils'], env: {},
    stdout: (b) => { listing += new TextDecoder().decode(b); }, stderr: () => {},
  }).run(module);
  const applets = listing.split('\n').map((l) => l.split(/\s+/)[0]).filter(Boolean);

  const list = document.getElementById('programs');
  const fs = new FS();
  seed(fs, wasm, applets, readPrograms(list));
  const shell = new Shell(term, fs);
  shell.modules.set(wasm, module);

  const { prompt, submit } = attachInput(term, shell);
  prompt();
  if (!matchMedia('(pointer: coarse)').matches) term.input.focus({ preventScroll: true });

  // type `ls` for the visitor
  const first = 'ls';
  for (let i = 1; i <= first.length; i++) {
    await new Promise((r) => setTimeout(r, 90));
    term.input.value = first.slice(0, i);
    term.render();
  }
  await new Promise((r) => setTimeout(r, 120));
  submit(first, { remember: false });
}

boot().catch((e) => {
  console.error(e);
  document.documentElement.classList.remove('js');
});
})();
