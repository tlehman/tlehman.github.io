// wasi.js -- an in-memory filesystem and a WASI preview1 host for it.
//
// Just enough of wasi_snapshot_preview1 to run coreutils.wasm: argv/env,
// clocks, stdio, and path/fd operations against the tree in `FS`. The
// filesystem root "/" is preopened as fd 3. Exposed as window.WASI.

(() => {

const E = {
  SUCCESS: 0, ACCES: 2, BADF: 8, EXIST: 20, INVAL: 28, IO: 29, ISDIR: 31, LOOP: 32,
  NOENT: 44, NOSYS: 52, NOTDIR: 54, NOTEMPTY: 55, PERM: 63,
};
const FT = { UNKNOWN: 0, CHAR: 2, DIR: 3, FILE: 4, LINK: 7 };
const O = { CREAT: 1, DIRECTORY: 2, EXCL: 4, TRUNC: 8 };
const FDFLAG_APPEND = 1;
const LOOKUP_FOLLOW = 1;

const enc = new TextEncoder();
const dec = new TextDecoder();
const now = () => BigInt(Date.now()) * 1000000n;

const isURL = (s) => /^https?:\/\//.test(s);

class FsError extends Error {
  constructor(errno) { super(`errno ${errno}`); this.errno = errno; }
}

// ------------------------------------------------------------------ FS

let nextIno = 1;

class Node {
  constructor(type, props = {}) {
    this.type = type;
    this.ino = nextIno++;
    this.mtime = now();
    if (type === FT.DIR) this.children = new Map();
    if (type === FT.FILE) this.data = new Uint8Array(0);
    Object.assign(this, props);
  }
  get size() {
    if (this.type === FT.FILE) return this.data.length;
    if (this.type === FT.LINK) return enc.encode(this.target).length;
    if (this.type === FT.DIR) return this.children.size;
    return 0;
  }
}

class FS {
  constructor() {
    this.root = new Node(FT.DIR);
  }

  static split(path) {
    return path.split('/').filter((c) => c && c !== '.');
  }

  // Walk an absolute path. Returns { node, parent, name, path } where node is
  // undefined if only the last component is missing (or is a link to a URL,
  // reported as `url`). Throws FsError.
  lookup(path, { follow = true, depth = 0 } = {}) {
    if (depth > 40) throw new FsError(E.LOOP);
    const parts = FS.split(path);
    const stack = [this.root], names = [];
    const here = () => '/' + names.join('/');
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const dir = stack[stack.length - 1];
      if (name === '..') { if (stack.length > 1) { stack.pop(); names.pop(); } continue; }
      if (dir.type !== FT.DIR) throw new FsError(E.NOTDIR);
      const node = dir.children.get(name);
      const last = i === parts.length - 1;
      if (!node) {
        if (last) return { node: undefined, parent: dir, name, path: `${here()}/${name}`.replace('//', '/') };
        throw new FsError(E.NOENT);
      }
      if (node.type === FT.LINK && (!last || follow)) {
        // links to URLs point outside the filesystem, so they dangle here
        if (isURL(node.target)) {
          if (last) return { node: undefined, parent: dir, name, url: node.target };
          throw new FsError(E.NOENT);
        }
        const base = node.target.startsWith('/') ? node.target : `${here()}/${node.target}`;
        const rest = parts.slice(i + 1).join('/');
        return this.lookup(rest ? `${base}/${rest}` : base, { follow, depth: depth + 1 });
      }
      stack.push(node);
      names.push(name);
      if (last) return { node, parent: dir, name, path: here() };
    }
    const node = stack[stack.length - 1];
    return { node, parent: stack[stack.length - 2] || node, name: names[names.length - 1] || '', path: here() };
  }

  // Is `node` inside directory `dir` (or the same node)?
  contains(dir, node) {
    if (dir === node) return true;
    if (dir.type !== FT.DIR) return false;
    for (const child of dir.children.values()) if (this.contains(child, node)) return true;
    return false;
  }

  get(path, follow = true) {
    const r = this.lookup(path, { follow });
    if (!r.node) throw new FsError(E.NOENT);
    return r.node;
  }

  tryGet(path, follow = true) {
    try { return this.lookup(path, { follow }).node; } catch { return undefined; }
  }

  // Convenience used to seed the tree: mkdir -p, write files, symlink.
  mkdirp(path) {
    let dir = this.root;
    for (const name of FS.split(path)) {
      let next = dir.children.get(name);
      if (!next) { next = new Node(FT.DIR); dir.children.set(name, next); }
      dir = next;
    }
    return dir;
  }

  add(path, node) {
    const parts = FS.split(path);
    const name = parts.pop();
    this.mkdirp(parts.join('/')).children.set(name, node);
    return node;
  }

  writeFile(path, data) {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    return this.add(path, new Node(FT.FILE, { data: bytes }));
  }

  symlink(path, target) {
    return this.add(path, new Node(FT.LINK, { target }));
  }

  readText(path) {
    return dec.decode(this.get(path).data);
  }
}

// ---------------------------------------------------------------- WASI

class Exit extends Error {
  constructor(code) { super(`exit ${code}`); this.code = code; }
}

// Join a WASI path onto a directory fd's absolute path.
const joinPath = (base, rel) => (rel.startsWith('/') ? rel : `${base.replace(/\/$/, '')}/${rel}`);

class Process {
  // opts: { fs, args, env, stdin: Uint8Array, stdout(bytes), stderr(bytes), tty: {1: bool, 2: bool} }
  constructor(opts) {
    this.fs = opts.fs;
    this.args = opts.args.map((a) => enc.encode(a + '\0'));
    this.env = Object.entries(opts.env).map(([k, v]) => enc.encode(`${k}=${v}\0`));
    this.stdin = opts.stdin || new Uint8Array(0);
    this.stdinPos = 0;
    this.out = { 1: opts.stdout, 2: opts.stderr };
    this.tty = opts.tty || {};
    this.fds = new Map([[3, { node: this.fs.root, path: '/', preopen: true, pos: 0 }]]);
    this.nextFd = 4;
    this.memory = null;
  }

  run(module) {
    const instance = new WebAssembly.Instance(module, this.imports());
    this.memory = instance.exports.memory;
    try {
      instance.exports._start();
      return 0;
    } catch (e) {
      if (e instanceof Exit) return e.code;
      throw e;
    }
  }

  get view() { return new DataView(this.memory.buffer); }
  get bytes() { return new Uint8Array(this.memory.buffer); }
  str(ptr, len) { return dec.decode(this.bytes.slice(ptr, ptr + len)); }

  resolve(fd, ptr, len) {
    const dir = this.fds.get(fd);
    if (!dir || dir.node.type !== FT.DIR) throw new FsError(E.BADF);
    return joinPath(dir.path, this.str(ptr, len));
  }

  writeStat(ptr, node) {
    const v = this.view;
    v.setBigUint64(ptr, 0n, true);
    v.setBigUint64(ptr + 8, BigInt(node.ino), true);
    v.setUint8(ptr + 16, node.type);
    v.setBigUint64(ptr + 24, 1n, true);
    v.setBigUint64(ptr + 32, BigInt(node.size), true);
    v.setBigUint64(ptr + 40, node.mtime, true);
    v.setBigUint64(ptr + 48, node.mtime, true);
    v.setBigUint64(ptr + 56, node.mtime, true);
  }

  iovs(ptr, n) {
    const v = this.view, out = [];
    for (let i = 0; i < n; i++) out.push([v.getUint32(ptr + i * 8, true), v.getUint32(ptr + i * 8 + 4, true)]);
    return out;
  }

  imports() {
    // every syscall returns an errno; FsError thrown inside becomes its errno
    const wrap = (fn) => (...a) => {
      try { return fn(...a) ?? E.SUCCESS; } catch (e) {
        if (e instanceof FsError) return e.errno;
        throw e;
      }
    };
    const sys = {
      args_sizes_get: (argc, size) => {
        this.view.setUint32(argc, this.args.length, true);
        this.view.setUint32(size, this.args.reduce((n, a) => n + a.length, 0), true);
      },
      args_get: (argv, buf) => this.putList(this.args, argv, buf),
      environ_sizes_get: (n, size) => {
        this.view.setUint32(n, this.env.length, true);
        this.view.setUint32(size, this.env.reduce((s, a) => s + a.length, 0), true);
      },
      environ_get: (env, buf) => this.putList(this.env, env, buf),
      clock_time_get: (id, _prec, ptr) => { this.view.setBigUint64(ptr, now(), true); },
      clock_res_get: (id, ptr) => { this.view.setBigUint64(ptr, 1000000n, true); },
      random_get: (ptr, len) => { crypto.getRandomValues(this.bytes.subarray(ptr, ptr + len)); },
      sched_yield: () => {},
      proc_exit: (code) => { throw new Exit(code); },

      fd_write: (fd, iovs, n, nwritten) => {
        let total = 0;
        const chunks = this.iovs(iovs, n).map(([p, l]) => { total += l; return this.bytes.slice(p, p + l); });
        if (fd === 1 || fd === 2) {
          for (const c of chunks) this.out[fd](c);
        } else {
          const f = this.fds.get(fd);
          if (!f || f.node.type === FT.DIR) return E.BADF;
          for (const c of chunks) this.writeAt(f, c);
        }
        this.view.setUint32(nwritten, total, true);
      },
      fd_read: (fd, iovs, n, nread) => {
        let src, pos;
        if (fd === 0) { src = this.stdin; pos = this.stdinPos; }
        else {
          const f = this.fds.get(fd);
          if (!f) return E.BADF;
          if (f.node.type === FT.DIR) return E.ISDIR;
          src = f.node.type === FT.CHAR ? new Uint8Array(0) : f.node.data;
          pos = f.pos;
        }
        let total = 0;
        for (const [p, l] of this.iovs(iovs, n)) {
          const chunk = src.subarray(pos, pos + l);
          this.bytes.set(chunk, p);
          pos += chunk.length; total += chunk.length;
          if (chunk.length < l) break;
        }
        if (fd === 0) this.stdinPos = pos; else this.fds.get(fd).pos = pos;
        this.view.setUint32(nread, total, true);
      },
      fd_seek: (fd, offset, whence, ptr) => {
        const f = this.fds.get(fd);
        if (!f || f.node.type !== FT.FILE) return E.BADF;
        const base = [0, f.pos, f.node.data.length][whence];
        if (base === undefined) return E.INVAL;
        f.pos = Math.max(0, base + Number(offset));
        this.view.setBigUint64(ptr, BigInt(f.pos), true);
      },
      fd_tell: (fd, ptr) => {
        const f = this.fds.get(fd);
        if (!f) return E.BADF;
        this.view.setBigUint64(ptr, BigInt(f.pos), true);
      },
      fd_close: (fd) => { if (!this.fds.delete(fd)) return E.BADF; },
      fd_sync: () => {},
      fd_fdstat_get: (fd, ptr) => {
        let type;
        if (fd <= 2) type = this.tty[fd] ? FT.CHAR : FT.UNKNOWN;
        else { const f = this.fds.get(fd); if (!f) return E.BADF; type = f.node.type; }
        const v = this.view;
        v.setUint8(ptr, type);
        v.setUint16(ptr + 2, 0, true);
        v.setBigUint64(ptr + 8, 0x1fffffffn, true);
        v.setBigUint64(ptr + 16, 0x1fffffffn, true);
      },
      fd_fdstat_set_flags: () => {},
      fd_filestat_get: (fd, ptr) => {
        if (fd <= 2) { this.writeStat(ptr, new Node(FT.CHAR)); return; }
        const f = this.fds.get(fd);
        if (!f) return E.BADF;
        this.writeStat(ptr, f.node);
      },
      fd_prestat_get: (fd, ptr) => {
        const f = this.fds.get(fd);
        if (!f || !f.preopen) return E.BADF;
        this.view.setUint8(ptr, 0);
        this.view.setUint32(ptr + 4, enc.encode(f.path).length, true);
      },
      fd_prestat_dir_name: (fd, ptr, len) => {
        const f = this.fds.get(fd);
        if (!f || !f.preopen) return E.BADF;
        this.bytes.set(enc.encode(f.path).subarray(0, len), ptr);
      },
      fd_readdir: (fd, buf, len, cookie, usedPtr) => {
        const f = this.fds.get(fd);
        if (!f || f.node.type !== FT.DIR) return E.NOTDIR;
        const parent = f.path === '/' ? this.fs.root : this.fs.tryGet(`${f.path}/..`) || f.node;
        const entries = [['.', f.node], ['..', parent], ...f.node.children];
        const out = [];
        for (let i = Number(cookie); i < entries.length; i++) {
          const [name, node] = entries[i];
          const nameBytes = enc.encode(name);
          const head = new DataView(new ArrayBuffer(24));
          head.setBigUint64(0, BigInt(i + 1), true);
          head.setBigUint64(8, BigInt(node.ino), true);
          head.setUint32(16, nameBytes.length, true);
          head.setUint8(20, node.type);
          out.push(new Uint8Array(head.buffer), nameBytes);
        }
        // fill the buffer, truncating the last entry as the spec allows
        let used = 0;
        for (const chunk of out) {
          const take = Math.min(chunk.length, len - used);
          this.bytes.set(chunk.subarray(0, take), buf + used);
          used += take;
          if (used === len) break;
        }
        this.view.setUint32(usedPtr, used, true);
      },

      path_open: (dirfd, dirflags, ptr, len, oflags, _rb, _ri, fdflags, fdPtr) => {
        const path = this.resolve(dirfd, ptr, len);
        let { node, parent, name, url } = this.fs.lookup(path, { follow: !!(dirflags & LOOKUP_FOLLOW) });
        if (url) return E.NOENT;
        if (node) {
          if ((oflags & O.CREAT) && (oflags & O.EXCL)) return E.EXIST;
          if ((oflags & O.DIRECTORY) && node.type !== FT.DIR) return E.NOTDIR;
          if (node.type === FT.DIR && (oflags & (O.TRUNC | O.CREAT)) && !(oflags & O.DIRECTORY)) return E.ISDIR;
          if ((oflags & O.TRUNC) && node.type === FT.FILE) { node.data = new Uint8Array(0); node.mtime = now(); }
        } else {
          if (!(oflags & O.CREAT)) return E.NOENT;
          if (parent.type !== FT.DIR) return E.NOTDIR;
          node = new Node(FT.FILE);
          parent.children.set(name, node);
          parent.mtime = now();
        }
        const fd = this.nextFd++;
        const real = node.type === FT.DIR ? this.fs.lookup(path).path : path;
        this.fds.set(fd, { node, path: real, pos: 0, append: !!(fdflags & FDFLAG_APPEND) });
        this.view.setUint32(fdPtr, fd, true);
      },
      path_filestat_get: (fd, flags, ptr, len, buf) => {
        const path = this.resolve(fd, ptr, len);
        const { node } = this.fs.lookup(path, { follow: !!(flags & LOOKUP_FOLLOW) });
        if (!node) return E.NOENT;
        this.writeStat(buf, node);
      },
      path_filestat_set_times: (fd, flags, ptr, len) => {
        const { node } = this.fs.lookup(this.resolve(fd, ptr, len), { follow: !!(flags & LOOKUP_FOLLOW) });
        if (!node) return E.NOENT;
        node.mtime = now();
      },
      path_readlink: (fd, ptr, len, buf, buflen, usedPtr) => {
        const { node } = this.fs.lookup(this.resolve(fd, ptr, len), { follow: false });
        if (!node) return E.NOENT;
        if (node.type !== FT.LINK) return E.INVAL;
        const t = enc.encode(node.target).subarray(0, buflen);
        this.bytes.set(t, buf);
        this.view.setUint32(usedPtr, t.length, true);
      },
      path_create_directory: (fd, ptr, len) => {
        const { node, parent, name } = this.fs.lookup(this.resolve(fd, ptr, len), { follow: false });
        if (node || !name) return E.EXIST;
        parent.children.set(name, new Node(FT.DIR));
        parent.mtime = now();
      },
      path_remove_directory: (fd, ptr, len) => {
        const { node, parent, name } = this.fs.lookup(this.resolve(fd, ptr, len), { follow: false });
        if (!node) return E.NOENT;
        if (node.type !== FT.DIR) return E.NOTDIR;
        if (!name || node === this.fs.root) return E.PERM;
        if (node.children.size) return E.NOTEMPTY;
        parent.children.delete(name);
      },
      path_unlink_file: (fd, ptr, len) => {
        const { node, parent, name } = this.fs.lookup(this.resolve(fd, ptr, len), { follow: false });
        if (!node) return E.NOENT;
        if (node.type === FT.DIR) return E.ISDIR;
        parent.children.delete(name);
        parent.mtime = now();
      },
      path_rename: (fd, optr, olen, nfd, nptr, nlen) => {
        const from = this.fs.lookup(this.resolve(fd, optr, olen), { follow: false });
        const to = this.fs.lookup(this.resolve(nfd, nptr, nlen), { follow: false });
        if (!from.node || !from.name) return E.NOENT;
        if (to.node === from.node) return;
        if (to.node?.type === FT.DIR) {
          if (from.node.type !== FT.DIR) return E.ISDIR;
          if (to.node.children.size) return E.NOTEMPTY;
        } else if (to.node && from.node.type === FT.DIR) return E.NOTDIR;
        if (this.fs.contains(from.node, to.parent)) return E.INVAL; // into itself
        from.parent.children.delete(from.name);
        to.parent.children.set(to.name, from.node);
      },
      path_symlink: (optr, olen, fd, nptr, nlen) => {
        const target = this.str(optr, olen);
        const { node, parent, name } = this.fs.lookup(this.resolve(fd, nptr, nlen), { follow: false });
        if (node) return E.EXIST;
        parent.children.set(name, new Node(FT.LINK, { target }));
      },
    };
    const wrapped = {};
    for (const [k, fn] of Object.entries(sys)) wrapped[k] = wrap(fn);
    // anything else the binary imports reports ENOSYS
    const ns = new Proxy(wrapped, { get: (t, k) => t[k] ?? (() => E.NOSYS) });
    return { wasi_snapshot_preview1: ns };
  }

  putList(list, ptrs, buf) {
    for (const item of list) {
      this.view.setUint32(ptrs, buf, true);
      this.bytes.set(item, buf);
      ptrs += 4; buf += item.length;
    }
  }

  writeAt(f, chunk) {
    const node = f.node;
    if (node.type === FT.CHAR) return; // /dev/null
    if (f.append) f.pos = node.data.length;
    const end = f.pos + chunk.length;
    // always copy on first write: seeded files share one buffer (all of /bin)
    if (end > node.data.length || !f.owned) {
      const grown = new Uint8Array(Math.max(end, node.data.length));
      grown.set(node.data);
      node.data = grown;
      f.owned = true;
    }
    node.data.set(chunk, f.pos);
    f.pos = end;
    node.mtime = now();
  }
}

window.WASI = { E, FT, Node, FS, Exit, Process, isURL };
})();
