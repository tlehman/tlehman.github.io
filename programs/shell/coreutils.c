/*
 * coreutils.c -- a tiny busybox-style multicall binary for WASI preview1.
 *
 * Freestanding: no libc, it talks to the host through the
 * wasi_snapshot_preview1 imports declared below. argv[0] selects the
 * command. The filesystem root "/" is expected as preopened fd 3 and the
 * working directory comes from $PWD.
 *
 * Build: see Makefile (clang --target=wasm32 -nostdlib).
 */
#include <stdarg.h>
#include <stddef.h>
#include <stdint.h>

/* ---------------------------------------------------------------- WASI */

#define WASI(name) \
  __attribute__((import_module("wasi_snapshot_preview1"), import_name(#name)))

typedef uint16_t errno_t;
typedef uint64_t timestamp_t;

typedef struct { uint8_t *buf; size_t len; } iovec_t;
typedef struct { uint8_t filetype; uint16_t flags; uint64_t rights_base, rights_inh; } fdstat_t;
typedef struct {
  uint64_t dev, ino;
  uint8_t filetype;
  uint64_t nlink, size;
  timestamp_t atim, mtim, ctim;
} filestat_t;
typedef struct { uint64_t next, ino; uint32_t namlen; uint8_t type; } dirent_t;

WASI(args_sizes_get) errno_t wasi_args_sizes_get(size_t *argc, size_t *bufsz);
WASI(args_get) errno_t wasi_args_get(char **argv, char *buf);
WASI(environ_sizes_get) errno_t wasi_environ_sizes_get(size_t *n, size_t *bufsz);
WASI(environ_get) errno_t wasi_environ_get(char **env, char *buf);
WASI(clock_time_get) errno_t wasi_clock_time_get(uint32_t id, timestamp_t prec, timestamp_t *t);
WASI(fd_write) errno_t wasi_fd_write(int fd, const iovec_t *iov, size_t n, size_t *nw);
WASI(fd_read) errno_t wasi_fd_read(int fd, const iovec_t *iov, size_t n, size_t *nr);
WASI(fd_close) errno_t wasi_fd_close(int fd);
WASI(fd_fdstat_get) errno_t wasi_fd_fdstat_get(int fd, fdstat_t *st);
WASI(fd_readdir) errno_t wasi_fd_readdir(int fd, uint8_t *buf, size_t len, uint64_t cookie, size_t *used);
WASI(path_open) errno_t wasi_path_open(int dirfd, uint32_t dirflags, const char *path, size_t pathlen,
                                       uint16_t oflags, uint64_t rights, uint64_t rights_inh,
                                       uint16_t fdflags, int *fd);
WASI(path_filestat_get) errno_t wasi_path_filestat_get(int fd, uint32_t flags, const char *path,
                                                       size_t len, filestat_t *st);
WASI(path_filestat_set_times) errno_t wasi_path_filestat_set_times(int fd, uint32_t flags, const char *path,
                                                                   size_t len, timestamp_t at,
                                                                   timestamp_t mt, uint16_t fst);
WASI(path_readlink) errno_t wasi_path_readlink(int fd, const char *path, size_t len, char *buf,
                                               size_t buflen, size_t *used);
WASI(path_create_directory) errno_t wasi_path_create_directory(int fd, const char *path, size_t len);
WASI(path_remove_directory) errno_t wasi_path_remove_directory(int fd, const char *path, size_t len);
WASI(path_unlink_file) errno_t wasi_path_unlink_file(int fd, const char *path, size_t len);
WASI(path_rename) errno_t wasi_path_rename(int fd, const char *old, size_t oldlen, int newfd,
                                           const char *new, size_t newlen);
WASI(path_symlink) errno_t wasi_path_symlink(const char *old, size_t oldlen, int fd, const char *new,
                                             size_t newlen);
WASI(proc_exit) _Noreturn void wasi_proc_exit(uint32_t code);

enum {
  FT_UNKNOWN = 0, FT_CHAR = 2, FT_DIR = 3, FT_FILE = 4, FT_LINK = 7,
};
enum { O_CREAT = 1, O_DIRECTORY = 2, O_EXCL = 4, O_TRUNC = 8 };
enum { FD_APPEND = 1 };
enum { LOOKUP_FOLLOW = 1 };
enum { E_EXIST = 20, E_INVAL = 28, E_ISDIR = 31, E_NOENT = 44, E_NOSYS = 52, E_NOTDIR = 54, E_NOTEMPTY = 55, E_PERM = 63 };
/* rights: fd_read, fd_seek, fd_tell, fd_write, fd_readdir, fd_filestat_get, path_* */
#define R_READ ((1ull << 1) | (1ull << 2) | (1ull << 5) | (1ull << 21))
#define R_WRITE (R_READ | (1ull << 6))
#define R_DIR ((1ull << 13) | (1ull << 14) | (1ull << 15) | (1ull << 18) | (1ull << 21))
#define R_INHERIT ((uint64_t)0x0fffffff)
#define ROOTFD 3

static const char *strerror(errno_t e) {
  switch (e) {
  case 2: return "Permission denied";
  case 8: return "Bad file descriptor";
  case E_EXIST: return "File exists";
  case E_INVAL: return "Invalid argument";
  case E_ISDIR: return "Is a directory";
  case 32: return "Too many levels of symbolic links";
  case 37: return "File name too long";
  case 76: return "Capabilities insufficient";
  case E_NOENT: return "No such file or directory";
  case E_NOSYS: return "Function not implemented";
  case E_NOTDIR: return "Not a directory";
  case E_NOTEMPTY: return "Directory not empty";
  case E_PERM: return "Operation not permitted";
  default: return "Unknown error";
  }
}

/* -------------------------------------------------------------- libc-lite */

void *memcpy(void *d, const void *s, size_t n) {
  uint8_t *dp = d; const uint8_t *sp = s;
  while (n--) *dp++ = *sp++;
  return d;
}
void *memmove(void *d, const void *s, size_t n) {
  uint8_t *dp = d; const uint8_t *sp = s;
  if (dp < sp) while (n--) *dp++ = *sp++;
  else { dp += n; sp += n; while (n--) *--dp = *--sp; }
  return d;
}
void *memset(void *d, int c, size_t n) {
  uint8_t *dp = d;
  while (n--) *dp++ = (uint8_t)c;
  return d;
}
int memcmp(const void *a, const void *b, size_t n) {
  const uint8_t *x = a, *y = b;
  for (; n; n--, x++, y++) if (*x != *y) return *x - *y;
  return 0;
}
static size_t strlen(const char *s) { size_t n = 0; while (s[n]) n++; return n; }
static int strcmp(const char *a, const char *b) {
  while (*a && *a == *b) a++, b++;
  return (uint8_t)*a - (uint8_t)*b;
}
static int strncmp(const char *a, const char *b, size_t n) {
  for (; n; n--, a++, b++) { if (*a != *b || !*a) return (uint8_t)*a - (uint8_t)*b; }
  return 0;
}
static char *strchr(const char *s, int c) {
  for (; *s; s++) if (*s == c) return (char *)s;
  return c ? 0 : (char *)s;
}
static char *strrchr(const char *s, int c) {
  const char *r = 0;
  for (; *s; s++) if (*s == c) r = s;
  return (char *)r;
}
static int tolower(int c) { return (c >= 'A' && c <= 'Z') ? c + 32 : c; }
static int isdigit(int c) { return c >= '0' && c <= '9'; }
static int isspace(int c) { return c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\v' || c == '\f'; }

static long atol(const char *s) {
  long n = 0; int neg = 0;
  while (isspace(*s)) s++;
  if (*s == '-' || *s == '+') neg = *s++ == '-';
  while (isdigit(*s)) n = n * 10 + (*s++ - '0');
  return neg ? -n : n;
}
static int isnumber(const char *s) {
  if (*s == '-' || *s == '+') s++;
  if (!*s) return 0;
  for (; *s; s++) if (!isdigit(*s)) return 0;
  return 1;
}

/* bump allocator on top of linear memory; every command is short-lived */
extern unsigned char __heap_base;
static uintptr_t heap_top = (uintptr_t)&__heap_base;
static void *malloc(size_t n) {
  uintptr_t p = (heap_top + 7) & ~(uintptr_t)7;
  uintptr_t end = p + n;
  size_t have = __builtin_wasm_memory_size(0) * 65536;
  if (end > have) {
    size_t pages = (end - have + 65535) / 65536;
    if (__builtin_wasm_memory_grow(0, pages) == (size_t)-1) return 0;
  }
  heap_top = end;
  return (void *)p;
}
static void *realloc(void *old, size_t oldn, size_t n) {
  void *p = malloc(n);
  if (p && old) memcpy(p, old, oldn < n ? oldn : n);
  return p;
}
static char *strdup(const char *s) {
  size_t n = strlen(s) + 1;
  char *p = malloc(n);
  memcpy(p, s, n);
  return p;
}

/* ------------------------------------------------------------------ stdio */

typedef struct { int fd; size_t len; char buf[4096]; } out_t;
static out_t out1 = {1, 0, {0}}, out2 = {2, 0, {0}};
#define STDOUT (&out1)
#define STDERR (&out2)

static void flush(out_t *o) {
  size_t off = 0;
  while (off < o->len) {
    iovec_t iov = {(uint8_t *)o->buf + off, o->len - off};
    size_t nw = 0;
    if (wasi_fd_write(o->fd, &iov, 1, &nw) || !nw) break;
    off += nw;
  }
  o->len = 0;
}
static void putbytes(out_t *o, const char *s, size_t n) {
  while (n) {
    size_t room = sizeof o->buf - o->len, k = n < room ? n : room;
    memcpy(o->buf + o->len, s, k);
    o->len += k; s += k; n -= k;
    if (o->len == sizeof o->buf) flush(o);
  }
}
static void putstr(out_t *o, const char *s) { putbytes(o, s, strlen(s)); }
static void putch(out_t *o, char c) { putbytes(o, &c, 1); }

_Noreturn static void exit(int code) {
  flush(STDOUT);
  flush(STDERR);
  wasi_proc_exit(code);
}

static void fmt_uint(out_t *o, uint64_t v, int base, int width, char pad, int left) {
  char tmp[24]; int n = 0;
  do { int d = v % base; tmp[n++] = d < 10 ? '0' + d : 'a' + d - 10; v /= base; } while (v);
  if (!left) for (int i = n; i < width; i++) putch(o, pad);
  while (n) putch(o, tmp[--n]);
  (void)left;
}

static size_t utf8_width(const char *s) {
  size_t w = 0;
  for (; *s; s++) if (((uint8_t)*s & 0xC0) != 0x80) w++;
  return w;
}

/* printf subset: %[-][0][width](s|d|u|ld|lu|llu|c|x|%) */
static void vfprintf(out_t *o, const char *f, va_list ap) {
  for (; *f; f++) {
    if (*f != '%') { putch(o, *f); continue; }
    f++;
    int left = 0, width = 0, longs = 0; char pad = ' ';
    if (*f == '-') { left = 1; f++; }
    if (*f == '0') { pad = '0'; f++; }
    while (isdigit(*f)) width = width * 10 + (*f++ - '0');
    while (*f == 'l') { longs++; f++; }
    switch (*f) {
    case 's': {
      const char *s = va_arg(ap, const char *);
      if (!s) s = "(null)";
      int w = (int)utf8_width(s);
      if (!left) for (int i = w; i < width; i++) putch(o, ' ');
      putstr(o, s);
      if (left) for (int i = w; i < width; i++) putch(o, ' ');
      break;
    }
    case 'c': putch(o, (char)va_arg(ap, int)); break;
    case 'd': {
      int64_t v = longs >= 2 ? va_arg(ap, int64_t) : longs ? va_arg(ap, long) : va_arg(ap, int);
      if (v < 0) { putch(o, '-'); v = -v; if (width) width--; }
      fmt_uint(o, (uint64_t)v, 10, width, pad, 0);
      break;
    }
    case 'u': case 'x': {
      uint64_t v = longs >= 2 ? va_arg(ap, uint64_t) : longs ? va_arg(ap, unsigned long) : va_arg(ap, unsigned);
      fmt_uint(o, v, *f == 'x' ? 16 : 10, width, pad, 0);
      break;
    }
    case '%': putch(o, '%'); break;
    default: putch(o, '%'); putch(o, *f); break;
    }
  }
}
static void printf(const char *f, ...) { va_list ap; va_start(ap, f); vfprintf(STDOUT, f, ap); va_end(ap); }
static void eprintf(const char *f, ...) { va_list ap; va_start(ap, f); vfprintf(STDERR, f, ap); va_end(ap); }

/* --------------------------------------------------------------- env/args */

static const char *prog;
static char **environ;

static const char *getenv(const char *name) {
  size_t n = strlen(name);
  for (char **e = environ; e && *e; e++)
    if (!strncmp(*e, name, n) && (*e)[n] == '=') return *e + n + 1;
  return 0;
}

static int isatty(int fd) {
  fdstat_t st;
  return !wasi_fd_fdstat_get(fd, &st) && st.filetype == FT_CHAR;
}

static int columns(void) {
  const char *c = getenv("COLUMNS");
  long n = c ? atol(c) : 0;
  return n > 0 ? (int)n : 80;
}

/* ------------------------------------------------------------------ paths */

/* Make an absolute, lexically normalised path from $PWD and p. */
static char *abspath(const char *p) {
  const char *pwd = getenv("PWD");
  if (!pwd || *pwd != '/') pwd = "/";
  size_t n = strlen(pwd) + strlen(p) + 2;
  char *tmp = malloc(n), *res = malloc(n + 1);
  tmp[0] = 0;
  if (*p != '/') { memcpy(tmp, pwd, strlen(pwd) + 1); }
  size_t tl = strlen(tmp);
  tmp[tl++] = '/';
  memcpy(tmp + tl, p, strlen(p) + 1);

  size_t rl = 0;
  const char *s = tmp;
  while (*s) {
    while (*s == '/') s++;
    if (!*s) break;
    const char *e = s;
    while (*e && *e != '/') e++;
    size_t len = e - s;
    if (len == 1 && s[0] == '.') {
    } else if (len == 2 && s[0] == '.' && s[1] == '.') {
      while (rl > 0 && res[rl - 1] != '/') rl--;
      if (rl > 0) rl--;
    } else {
      res[rl++] = '/';
      memcpy(res + rl, s, len);
      rl += len;
    }
    s = e;
  }
  if (!rl) res[rl++] = '/';
  res[rl] = 0;
  return res;
}

/* Path relative to the preopened root, as WASI wants it. */
static const char *rel(const char *abs) {
  while (*abs == '/') abs++;
  return *abs ? abs : ".";
}

static errno_t do_stat(const char *path, int follow, filestat_t *st) {
  const char *r = rel(abspath(path));
  return wasi_path_filestat_get(ROOTFD, follow ? LOOKUP_FOLLOW : 0, r, strlen(r), st);
}

static errno_t do_open(const char *path, uint16_t oflags, uint16_t fdflags, int *fd) {
  const char *r = rel(abspath(path));
  uint64_t rights = (oflags & O_DIRECTORY) ? R_DIR : (oflags || fdflags) ? R_WRITE : R_READ;
  return wasi_path_open(ROOTFD, LOOKUP_FOLLOW, r, strlen(r), oflags, rights, R_INHERIT, fdflags, fd);
}

static char *do_readlink(const char *path) {
  const char *r = rel(abspath(path));
  size_t cap = 256;
  for (;;) {
    char *buf = malloc(cap + 1);
    size_t used = 0;
    if (wasi_path_readlink(ROOTFD, r, strlen(r), buf, cap, &used)) return 0;
    if (used < cap) { buf[used] = 0; return buf; }
    cap *= 2;
  }
}

static const char *basename_of(const char *p) {
  size_t n = strlen(p);
  while (n > 1 && p[n - 1] == '/') n--;
  const char *s = p + n;
  while (s > p && s[-1] != '/') s--;
  char *r = malloc(p + n - s + 1);
  memcpy(r, s, p + n - s);
  r[p + n - s] = 0;
  return *r ? r : "/";
}

static char *join(const char *a, const char *b) {
  size_t la = strlen(a), lb = strlen(b);
  char *r = malloc(la + lb + 2);
  memcpy(r, a, la);
  size_t n = la;
  if (!la || a[la - 1] != '/') r[n++] = '/';
  memcpy(r + n, b, lb + 1);
  return r;
}

static int fail(const char *what, errno_t e) {
  eprintf("%s: %s: %s\n", prog, what, strerror(e));
  return 1;
}

/* ------------------------------------------------------------ whole files */

typedef struct { char *data; size_t len; } buf_t;

static int read_fd(int fd, buf_t *b) {
  size_t cap = 4096;
  b->data = malloc(cap);
  b->len = 0;
  for (;;) {
    if (b->len == cap) { b->data = realloc(b->data, cap, cap * 2); cap *= 2; }
    iovec_t iov = {(uint8_t *)b->data + b->len, cap - b->len};
    size_t nr = 0;
    errno_t e = wasi_fd_read(fd, &iov, 1, &nr);
    if (e) return e;
    if (!nr) break;
    b->len += nr;
  }
  return 0;
}

/* Read a named file ("-" is stdin). Returns errno. */
static errno_t slurp(const char *path, buf_t *b) {
  if (!strcmp(path, "-")) return read_fd(0, b);
  int fd;
  errno_t e = do_open(path, 0, 0, &fd);
  if (e) return e;
  filestat_t st;
  const char *r = rel(abspath(path));
  if (!wasi_path_filestat_get(ROOTFD, LOOKUP_FOLLOW, r, strlen(r), &st) && st.filetype == FT_DIR) {
    wasi_fd_close(fd);
    return E_ISDIR;
  }
  e = read_fd(fd, b);
  wasi_fd_close(fd);
  return e;
}

static errno_t write_file(const char *path, const char *data, size_t len, int append) {
  int fd;
  errno_t e = do_open(path, O_CREAT | (append ? 0 : O_TRUNC), append ? FD_APPEND : 0, &fd);
  if (e) return e;
  while (len) {
    iovec_t iov = {(uint8_t *)data, len};
    size_t nw = 0;
    if ((e = wasi_fd_write(fd, &iov, 1, &nw))) break;
    data += nw; len -= nw;
  }
  wasi_fd_close(fd);
  return e;
}

/* Split a buffer into lines (without the newline). */
typedef struct { char **v; size_t n; } lines_t;
static lines_t split_lines(buf_t *b) {
  lines_t l = {0, 0};
  size_t cap = 0;
  size_t i = 0;
  while (i < b->len) {
    size_t s = i;
    while (i < b->len && b->data[i] != '\n') i++;
    if (l.n == cap) { cap = cap ? cap * 2 : 64; l.v = realloc(l.v, l.n * sizeof *l.v, cap * sizeof *l.v); }
    char *line = malloc(i - s + 1);
    memcpy(line, b->data + s, i - s);
    line[i - s] = 0;
    l.v[l.n++] = line;
    if (i < b->len) i++;
  }
  return l;
}

/* Simple getopt: flags in "abc" are boolean; returns index of first operand. */
static int opts(int argc, char **argv, const char *valid, int *flags) {
  int i = 1;
  for (; i < argc; i++) {
    char *a = argv[i];
    if (a[0] != '-' || !a[1]) break;
    if (!strcmp(a, "--")) { i++; break; }
    if (isnumber(a)) break;
    for (char *c = a + 1; *c; c++) {
      const char *p = strchr(valid, *c);
      if (!p || !*c) {
        eprintf("%s: invalid option -- '%c'\n", prog, *c);
        exit(2);
      }
      flags[p - valid] = 1;
    }
  }
  return i;
}

/* ------------------------------------------------------------------- sort */

typedef int (*cmp_fn)(const void *, const void *);
static void qsort_ptrs(void **v, size_t n, cmp_fn cmp) {
  /* insertion sort is plenty for directory listings and small inputs */
  for (size_t i = 1; i < n; i++) {
    void *x = v[i];
    size_t j = i;
    while (j > 0 && cmp(v[j - 1], x) > 0) { v[j] = v[j - 1]; j--; }
    v[j] = x;
  }
}

/* ===================================================================== ls */

typedef struct {
  char *name;    /* display name */
  char *path;    /* path to stat */
  filestat_t st;
  char *target;  /* symlink target */
} entry_t;

static int ls_all, ls_almost, ls_long, ls_one, ls_dir, ls_human, ls_recurse, ls_color;

static int name_cmp(const void *a, const void *b) {
  const char *x = ((const entry_t *)a)->name, *y = ((const entry_t *)b)->name;
  while (*x == '.') x++;
  while (*y == '.') y++;
  for (; *x && tolower(*x) == tolower(*y); x++, y++) ;
  int d = tolower((uint8_t)*x) - tolower((uint8_t)*y);
  return d ? d : strcmp(((const entry_t *)a)->name, ((const entry_t *)b)->name);
}

static int is_url(const char *s) {
  return s && (!strncmp(s, "http://", 7) || !strncmp(s, "https://", 8));
}

static int is_exec(entry_t *e) {
  return e->st.filetype == FT_FILE && !strncmp(abspath(e->path), "/bin/", 5);
}

static int indicator(entry_t *e) {
  if (e->st.filetype == FT_DIR) return '/';
  if (e->st.filetype == FT_LINK && e->target && is_url(e->target)) {
    size_t n = strlen(e->target);
    if (n && e->target[n - 1] == '/') return '/';
  }
  return 0;
}

static const char *color_of(entry_t *e) {
  if (e->st.filetype == FT_DIR) return "1;34";
  if (e->st.filetype == FT_LINK) return "1;36";
  if (is_exec(e)) return "1;32";
  return 0;
}

static void osc8(const char *uri) { printf("\033]8;;%s\033\\", uri ? uri : ""); }

static const char *link_uri(entry_t *e) {
  if (e->st.filetype == FT_LINK && is_url(e->target)) return e->target;
  return join("file://", abspath(e->path));
}

/* Print a name with colour + hyperlink; returns display width. */
static size_t print_name(entry_t *e) {
  const char *c = ls_color ? color_of(e) : 0;
  if (ls_color) osc8(link_uri(e));
  if (c) printf("\033[%sm", c);
  printf("%s", e->name);
  if (c) printf("\033[0m");
  if (ls_color) osc8(0);
  int ind = indicator(e);
  if (ind) putch(STDOUT, (char)ind);
  return utf8_width(e->name) + (ind ? 1 : 0);
}

static void fill_entry(entry_t *e) {
  wasi_path_filestat_get(ROOTFD, 0, rel(abspath(e->path)), strlen(rel(abspath(e->path))), &e->st);
  if (e->st.filetype == FT_LINK) e->target = do_readlink(e->path);
}

static const char *months[] = {"Jan", "Feb", "Mar", "Apr", "May", "Jun",
                               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
static const char *wdays[] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};

typedef struct { int year, mon, mday, hour, min, sec, wday; } tm_t;

static long tz_offset_minutes(void) {
  const char *z = getenv("TZOFFSET");
  return z ? atol(z) : 0;
}

static tm_t civil(int64_t secs) {
  tm_t t;
  int64_t days = secs / 86400, rem = secs % 86400;
  if (rem < 0) { rem += 86400; days--; }
  t.hour = (int)(rem / 3600); t.min = (int)(rem / 60 % 60); t.sec = (int)(rem % 60);
  t.wday = (int)((days + 4) % 7); if (t.wday < 0) t.wday += 7;
  /* Howard Hinnant's days_from_civil inverse */
  int64_t z = days + 719468;
  int64_t era = (z >= 0 ? z : z - 146096) / 146097;
  int64_t doe = z - era * 146097;
  int64_t yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  int64_t y = yoe + era * 400;
  int64_t doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  int64_t mp = (5 * doy + 2) / 153;
  t.mday = (int)(doy - (153 * mp + 2) / 5 + 1);
  t.mon = (int)(mp < 10 ? mp + 3 : mp - 9);
  t.year = (int)(y + (t.mon <= 2));
  return t;
}

static tm_t localtime_ns(timestamp_t ns) {
  return civil((int64_t)(ns / 1000000000ull) + tz_offset_minutes() * 60);
}

static void human(uint64_t n, char *buf) {
  const char *u = "BKMGT";
  int i = 0;
  uint64_t whole = n, frac = 0;
  while (whole >= 1024 && i < 4) { frac = whole % 1024; whole /= 1024; i++; }
  char *p = buf;
  char tmp[24]; int k = 0;
  if (i && whole < 10) {
    uint64_t tenth = (frac * 10 + 1023) / 1024;
    if (tenth == 10) { whole++; tenth = 0; }
    do tmp[k++] = '0' + whole % 10; while (whole /= 10);
    while (k) *p++ = tmp[--k];
    *p++ = '.'; *p++ = '0' + (char)tenth;
  } else {
    if (i && frac) whole++;
    do tmp[k++] = '0' + whole % 10; while (whole /= 10);
    while (k) *p++ = tmp[--k];
  }
  if (i) *p++ = u[i];
  *p = 0;
}

static void ls_long_list(entry_t *v, size_t n) {
  uint64_t width = 1;
  for (size_t i = 0; i < n; i++) {
    uint64_t sz = v[i].st.filetype == FT_LINK && v[i].target ? strlen(v[i].target) : v[i].st.size;
    v[i].st.size = sz;
    char tmp[24];
    if (ls_human) human(sz, tmp);
    size_t w = ls_human ? strlen(tmp) : 0;
    if (!ls_human) for (uint64_t x = sz; x; x /= 10) w++;
    if (w > width) width = w;
  }
  timestamp_t now = 0;
  wasi_clock_time_get(0, 1000, &now);
  for (size_t i = 0; i < n; i++) {
    entry_t *e = &v[i];
    const char *mode = e->st.filetype == FT_DIR ? "drwxr-xr-x"
                       : e->st.filetype == FT_LINK ? "lrwxrwxrwx"
                       : is_exec(e) ? "-rwxr-xr-x" : "-rw-r--r--";
    char sz[24];
    if (ls_human) human(e->st.size, sz);
    tm_t t = localtime_ns(e->st.mtim);
    printf("%s %u tobi tobi ", mode, (unsigned)(e->st.nlink ? e->st.nlink : 1));
    if (ls_human) {
      for (size_t k = strlen(sz); k < width; k++) putch(STDOUT, ' ');
      printf("%s", sz);
    } else {
      fmt_uint(STDOUT, e->st.size, 10, (int)width, ' ', 0);
    }
    int recent = now - e->st.mtim < 15552000ull * 1000000000ull;
    if (recent) printf(" %s %2d %02d:%02d ", months[t.mon - 1], t.mday, t.hour, t.min);
    else printf(" %s %2d  %d ", months[t.mon - 1], t.mday, t.year);
    print_name(e);
    if (e->st.filetype == FT_LINK && e->target) {
      printf(" -> ");
      if (ls_color && is_url(e->target)) { osc8(e->target); printf("%s", e->target); osc8(0); }
      else printf("%s", e->target);
    }
    putch(STDOUT, '\n');
  }
}

static void ls_grid(entry_t *v, size_t n) {
  if (!n) return;
  if (ls_one || !ls_color) {
    for (size_t i = 0; i < n; i++) { print_name(&v[i]); putch(STDOUT, '\n'); }
    return;
  }
  size_t *w = malloc(n * sizeof *w);
  for (size_t i = 0; i < n; i++) w[i] = utf8_width(v[i].name) + (indicator(&v[i]) ? 1 : 0);
  size_t cols = (size_t)columns();
  /* find the most columns that fit, GNU-style vertical layout */
  size_t best_rows = n, *cw = malloc(n * sizeof *cw), *best = malloc(n * sizeof *best), best_cols = 1;
  best[0] = 0;
  for (size_t i = 0; i < n; i++) if (w[i] > best[0]) best[0] = w[i];
  for (size_t nc = 2; nc <= n; nc++) {
    size_t rows = (n + nc - 1) / nc;
    size_t used_cols = (n + rows - 1) / rows;
    size_t total = 0;
    for (size_t c = 0; c < used_cols; c++) {
      cw[c] = 0;
      for (size_t r = 0; r < rows; r++) {
        size_t i = c * rows + r;
        if (i < n && w[i] > cw[c]) cw[c] = w[i];
      }
      total += cw[c] + (c + 1 < used_cols ? 2 : 0);
    }
    if (total > cols) break;
    best_rows = rows; best_cols = used_cols;
    memcpy(best, cw, used_cols * sizeof *cw);
  }
  for (size_t r = 0; r < best_rows; r++) {
    for (size_t c = 0; c < best_cols; c++) {
      size_t i = c * best_rows + r;
      if (i >= n) break;
      size_t pw = print_name(&v[i]);
      size_t next = (c + 1) * best_rows + r;
      if (c + 1 < best_cols && next < n) for (; pw < best[c] + 2; pw++) putch(STDOUT, ' ');
    }
    putch(STDOUT, '\n');
  }
}

static void ls_show(entry_t *v, size_t n) {
  void **pv = malloc(n * sizeof *pv);
  for (size_t i = 0; i < n; i++) pv[i] = &v[i];
  qsort_ptrs(pv, n, name_cmp);
  entry_t *sorted = malloc(n * sizeof *sorted);
  for (size_t i = 0; i < n; i++) sorted[i] = *(entry_t *)pv[i];
  memcpy(v, sorted, n * sizeof *v);
  if (ls_long) ls_long_list(v, n);
  else ls_grid(v, n);
}

static int read_dir(const char *path, entry_t **out, size_t *count) {
  int fd;
  errno_t e = do_open(path, O_DIRECTORY, 0, &fd);
  if (e) return e;
  size_t cap = 32, n = 0;
  entry_t *v = malloc(cap * sizeof *v);
  uint8_t buf[4096];
  uint64_t cookie = 0;
  for (;;) {
    size_t used = 0;
    if ((e = wasi_fd_readdir(fd, buf, sizeof buf, cookie, &used))) break;
    size_t off = 0;
    int progressed = 0;
    while (off + sizeof(dirent_t) <= used) {
      dirent_t d;
      memcpy(&d, buf + off, sizeof d);
      if (off + sizeof d + d.namlen > used) break;
      char *name = malloc(d.namlen + 1);
      memcpy(name, buf + off + sizeof d, d.namlen);
      name[d.namlen] = 0;
      off += sizeof d + d.namlen;
      cookie = d.next;
      progressed = 1;
      if (n == cap) { v = realloc(v, n * sizeof *v, cap * 2 * sizeof *v); cap *= 2; }
      v[n].name = name;
      v[n].path = join(path, name);
      v[n].target = 0;
      memset(&v[n].st, 0, sizeof v[n].st);
      n++;
    }
    if (used < sizeof buf || !progressed) break;
  }
  wasi_fd_close(fd);
  *out = v;
  *count = n;
  return e;
}

static int ls_directory(const char *path) {
  entry_t *all;
  size_t n;
  errno_t e = read_dir(path, &all, &n);
  if (e) {
    eprintf("ls: cannot open directory '%s': %s\n", path, strerror(e));
    return 2;
  }
  entry_t *v = malloc((n + 1) * sizeof *v);
  size_t k = 0;
  for (size_t i = 0; i < n; i++) {
    char *nm = all[i].name;
    int hidden = nm[0] == '.';
    int dots = !strcmp(nm, ".") || !strcmp(nm, "..");
    if (hidden && !ls_all && !ls_almost) continue;
    if (dots && !ls_all) continue;
    v[k] = all[i];
    fill_entry(&v[k]);
    k++;
  }
  if (ls_long) {
    uint64_t blocks = 0;
    for (size_t i = 0; i < k; i++) blocks += (v[i].st.size + 1023) / 1024 * 4 / 4;
    printf("total %lu\n", (unsigned long)blocks);
  }
  ls_show(v, k);
  if (ls_recurse) {
    for (size_t i = 0; i < k; i++) {
      if (v[i].st.filetype != FT_DIR || !strcmp(v[i].name, ".") || !strcmp(v[i].name, "..")) continue;
      printf("\n%s:\n", v[i].path);
      ls_directory(v[i].path);
    }
  }
  return 0;
}

static int cmd_ls(int argc, char **argv) {
  int f[8] = {0};
  int i = opts(argc, argv, "aAl1dhFR", f);
  ls_all = f[0]; ls_almost = f[1]; ls_long = f[2]; ls_one = f[3]; ls_dir = f[4]; ls_human = f[5];
  ls_recurse = f[7];
  ls_color = isatty(1);
  if (!getenv("NO_COLOR") && getenv("CLICOLOR_FORCE")) ls_color = 1;
  if (i == argc) {
    static char *dot[] = {"."};
    argv = dot; argc = 1; i = 0;
  }
  int rc = 0;
  size_t nargs = argc - i;
  entry_t *files = malloc(nargs * sizeof *files);
  char **dirs = malloc(nargs * sizeof *dirs);
  size_t nf = 0, nd = 0;
  for (; i < argc; i++) {
    filestat_t st;
    errno_t e = do_stat(argv[i], 1, &st);
    if (e) {
      filestat_t lst;
      if (do_stat(argv[i], 0, &lst)) {
        eprintf("ls: cannot access '%s': %s\n", argv[i], strerror(e));
        rc = 2;
        continue;
      }
      st = lst;
    }
    /* like GNU ls, -l shows a symlink argument itself unless it ends in '/' */
    filestat_t lst;
    int link_arg = ls_long && !do_stat(argv[i], 0, &lst) && lst.filetype == FT_LINK &&
                   argv[i][strlen(argv[i]) - 1] != '/';
    if (st.filetype == FT_DIR && !ls_dir && !link_arg) { dirs[nd++] = argv[i]; continue; }
    entry_t *x = &files[nf++];
    x->name = argv[i];
    x->path = argv[i];
    x->target = 0;
    fill_entry(x);
  }
  if (nf) ls_show(files, nf);
  for (size_t d = 0; d < nd; d++) {
    if (nf || nd > 1 || ls_recurse) printf("%s%s:\n", (nf || d) ? "\n" : "", dirs[d]);
    int r = ls_directory(dirs[d]);
    if (r) rc = r;
  }
  return rc;
}

/* =================================================================== tree */

static size_t tree_dirs, tree_files;

static void tree_walk(const char *path, const char *prefix) {
  entry_t *v;
  size_t n;
  if (read_dir(path, &v, &n)) return;
  void **pv = malloc(n * sizeof *pv);
  size_t k = 0;
  for (size_t i = 0; i < n; i++) {
    if (v[i].name[0] == '.') continue;
    fill_entry(&v[i]);
    pv[k++] = &v[i];
  }
  qsort_ptrs(pv, k, name_cmp);
  for (size_t i = 0; i < k; i++) {
    entry_t *e = pv[i];
    int last = i + 1 == k;
    printf("%s%s", prefix, last ? "└── " : "├── ");
    print_name(e);
    if (e->st.filetype == FT_LINK && e->target) {
      printf(" -> ");
      if (ls_color && is_url(e->target)) { osc8(e->target); printf("%s", e->target); osc8(0); }
      else printf("%s", e->target);
    }
    putch(STDOUT, '\n');
    if (e->st.filetype == FT_DIR) {
      tree_dirs++;
      size_t pl = strlen(prefix);
      char *np = malloc(pl + 8);
      memcpy(np, prefix, pl);
      const char *add = last ? "    " : "│   ";
      memcpy(np + pl, add, strlen(add) + 1);
      tree_walk(e->path, np);
    } else {
      tree_files++;
    }
  }
}

static int cmd_tree(int argc, char **argv) {
  ls_color = isatty(1);
  const char *path = argc > 1 ? argv[1] : ".";
  filestat_t st;
  errno_t e = do_stat(path, 1, &st);
  if (e) { printf("%s [error opening dir]\n", path); return 2; }
  printf("\033[1;34m%s\033[0m\n", path);
  tree_walk(path, "");
  printf("\n%u director%s, %u file%s\n", (unsigned)tree_dirs, tree_dirs == 1 ? "y" : "ies",
         (unsigned)tree_files, tree_files == 1 ? "" : "s");
  return 0;
}

/* ============================================================ small tools */

static int cmd_cat(int argc, char **argv) {
  int f[1] = {0};
  int i = opts(argc, argv, "n", f);
  static char *dash[] = {"-"};
  char **files = i < argc ? argv + i : dash;
  int nfiles = i < argc ? argc - i : 1;
  int rc = 0;
  size_t lineno = 1;
  int at_start = 1;
  for (int k = 0; k < nfiles; k++) {
    buf_t b;
    errno_t e = slurp(files[k], &b);
    if (e) { rc = fail(files[k], e); continue; }
    if (!f[0]) { putbytes(STDOUT, b.data, b.len); continue; }
    for (size_t j = 0; j < b.len; j++) {
      if (at_start) { printf("%6u\t", (unsigned)lineno++); at_start = 0; }
      putch(STDOUT, b.data[j]);
      if (b.data[j] == '\n') at_start = 1;
    }
  }
  return rc;
}

static int cmd_echo(int argc, char **argv) {
  int nl = 1, esc = 0, i = 1;
  for (; i < argc && argv[i][0] == '-' && argv[i][1]; i++) {
    const char *c = argv[i] + 1;
    int ok = 1;
    for (const char *p = c; *p; p++) if (*p != 'n' && *p != 'e' && *p != 'E') ok = 0;
    if (!ok) break;
    for (; *c; c++) { if (*c == 'n') nl = 0; if (*c == 'e') esc = 1; if (*c == 'E') esc = 0; }
  }
  for (int first = 1; i < argc; i++, first = 0) {
    if (!first) putch(STDOUT, ' ');
    for (const char *s = argv[i]; *s; s++) {
      if (esc && *s == '\\' && s[1]) {
        s++;
        switch (*s) {
        case 'n': putch(STDOUT, '\n'); break;
        case 't': putch(STDOUT, '\t'); break;
        case 'e': putch(STDOUT, '\033'); break;
        case '\\': putch(STDOUT, '\\'); break;
        case 'c': exit(0);
        default: putch(STDOUT, '\\'); putch(STDOUT, *s);
        }
      } else putch(STDOUT, *s);
    }
  }
  if (nl) putch(STDOUT, '\n');
  return 0;
}

static int cmd_pwd(int argc, char **argv) {
  (void)argc; (void)argv;
  printf("%s\n", abspath("."));
  return 0;
}

static int cmd_mkdir(int argc, char **argv) {
  int f[1] = {0};
  int i = opts(argc, argv, "p", f), rc = 0;
  if (i == argc) { eprintf("mkdir: missing operand\n"); return 1; }
  for (; i < argc; i++) {
    char *abs = abspath(argv[i]);
    if (f[0]) {
      for (char *p = abs + 1;; p++) {
        if (*p == '/' || !*p) {
          char c = *p; *p = 0;
          errno_t e = wasi_path_create_directory(ROOTFD, rel(abs), strlen(rel(abs)));
          *p = c;
          if (e && e != E_EXIST) { rc = fail(argv[i], e); break; }
          if (!c) break;
        }
      }
    } else {
      errno_t e = wasi_path_create_directory(ROOTFD, rel(abs), strlen(rel(abs)));
      if (e) { eprintf("mkdir: cannot create directory '%s': %s\n", argv[i], strerror(e)); rc = 1; }
    }
  }
  return rc;
}

static int cmd_rmdir(int argc, char **argv) {
  int rc = 0;
  if (argc < 2) { eprintf("rmdir: missing operand\n"); return 1; }
  for (int i = 1; i < argc; i++) {
    const char *r = rel(abspath(argv[i]));
    errno_t e = wasi_path_remove_directory(ROOTFD, r, strlen(r));
    if (e) { eprintf("rmdir: failed to remove '%s': %s\n", argv[i], strerror(e)); rc = 1; }
  }
  return rc;
}

static errno_t rm_path(const char *path, int recursive) {
  filestat_t st;
  errno_t e = do_stat(path, 0, &st);
  if (e) return e;
  const char *r = rel(abspath(path));
  if (st.filetype == FT_DIR) {
    if (!recursive) return E_ISDIR;
    entry_t *v; size_t n;
    if ((e = read_dir(path, &v, &n))) return e;
    for (size_t i = 0; i < n; i++) {
      if (!strcmp(v[i].name, ".") || !strcmp(v[i].name, "..")) continue;
      if ((e = rm_path(v[i].path, 1))) return e;
    }
    return wasi_path_remove_directory(ROOTFD, r, strlen(r));
  }
  return wasi_path_unlink_file(ROOTFD, r, strlen(r));
}

static int cmd_rm(int argc, char **argv) {
  int f[3] = {0};
  int i = opts(argc, argv, "rfR", f), rc = 0;
  int recursive = f[0] || f[2], force = f[1];
  if (i == argc && !force) { eprintf("rm: missing operand\n"); return 1; }
  for (; i < argc; i++) {
    char *abs = abspath(argv[i]);
    if (!strcmp(abs, "/")) { eprintf("rm: it is dangerous to operate recursively on '/'\n"); rc = 1; continue; }
    errno_t e = rm_path(argv[i], recursive);
    if (e == E_NOENT && force) continue;
    if (e) { eprintf("rm: cannot remove '%s': %s\n", argv[i], strerror(e)); rc = 1; }
  }
  return rc;
}

static int cmd_touch(int argc, char **argv) {
  int rc = 0;
  if (argc < 2) { eprintf("touch: missing file operand\n"); return 1; }
  for (int i = 1; i < argc; i++) {
    filestat_t st;
    if (!do_stat(argv[i], 1, &st)) {
      const char *r = rel(abspath(argv[i]));
      wasi_path_filestat_set_times(ROOTFD, LOOKUP_FOLLOW, r, strlen(r), 0, 0, 2 | 8);
      continue;
    }
    int fd;
    errno_t e = do_open(argv[i], O_CREAT, 0, &fd);
    if (e) { eprintf("touch: cannot touch '%s': %s\n", argv[i], strerror(e)); rc = 1; continue; }
    wasi_fd_close(fd);
  }
  return rc;
}

/* destination for mv/cp: if dst is a directory, put src inside it */
static char *dest_path(const char *src, const char *dst) {
  filestat_t st;
  if (!do_stat(dst, 1, &st) && st.filetype == FT_DIR) return join(dst, basename_of(src));
  return (char *)dst;
}

static int cmd_mv(int argc, char **argv) {
  if (argc < 3) { eprintf("mv: missing destination file operand\n"); return 1; }
  int rc = 0;
  const char *dst = argv[argc - 1];
  if (argc > 3) {
    filestat_t st;
    if (do_stat(dst, 1, &st) || st.filetype != FT_DIR) { eprintf("mv: target '%s' is not a directory\n", dst); return 1; }
  }
  for (int i = 1; i < argc - 1; i++) {
    const char *a = rel(abspath(argv[i])), *b = rel(abspath(dest_path(argv[i], dst)));
    errno_t e = wasi_path_rename(ROOTFD, a, strlen(a), ROOTFD, b, strlen(b));
    if (e) { eprintf("mv: cannot move '%s' to '%s': %s\n", argv[i], dst, strerror(e)); rc = 1; }
  }
  return rc;
}

static errno_t cp_path(const char *src, const char *dst, int recursive) {
  filestat_t st;
  errno_t e = do_stat(src, 0, &st);
  if (e) return e;
  if (st.filetype == FT_LINK) {
    char *t = do_readlink(src);
    const char *r = rel(abspath(dst));
    return wasi_path_symlink(t, strlen(t), ROOTFD, r, strlen(r));
  }
  if (st.filetype == FT_DIR) {
    if (!recursive) { eprintf("cp: -r not specified; omitting directory '%s'\n", src); return 0xffff; }
    const char *r = rel(abspath(dst));
    e = wasi_path_create_directory(ROOTFD, r, strlen(r));
    if (e && e != E_EXIST) return e;
    entry_t *v; size_t n;
    if ((e = read_dir(src, &v, &n))) return e;
    for (size_t i = 0; i < n; i++) {
      if (!strcmp(v[i].name, ".") || !strcmp(v[i].name, "..")) continue;
      if ((e = cp_path(v[i].path, join(dst, v[i].name), 1))) return e;
    }
    return 0;
  }
  buf_t b;
  if ((e = slurp(src, &b))) return e;
  return write_file(dst, b.data, b.len, 0);
}

static int cmd_cp(int argc, char **argv) {
  int f[2] = {0};
  int i = opts(argc, argv, "rR", f), rc = 0;
  if (argc - i < 2) { eprintf("cp: missing destination file operand\n"); return 1; }
  const char *dst = argv[argc - 1];
  for (; i < argc - 1; i++) {
    errno_t e = cp_path(argv[i], dest_path(argv[i], dst), f[0] || f[1]);
    if (e == 0xffff) rc = 1;
    else if (e) { eprintf("cp: cannot copy '%s': %s\n", argv[i], strerror(e)); rc = 1; }
  }
  return rc;
}

static int cmd_ln(int argc, char **argv) {
  int f[2] = {0};
  int i = opts(argc, argv, "sf", f);
  if (!f[0]) { eprintf("ln: hard links are not supported here; use ln -s\n"); return 1; }
  if (argc - i < 1) { eprintf("ln: missing file operand\n"); return 1; }
  const char *target = argv[i];
  const char *name = argc - i >= 2 ? argv[i + 1] : basename_of(target);
  name = dest_path(target, name);
  const char *r = rel(abspath(name));
  if (f[1]) wasi_path_unlink_file(ROOTFD, r, strlen(r));
  errno_t e = wasi_path_symlink(target, strlen(target), ROOTFD, r, strlen(r));
  if (e) { eprintf("ln: failed to create symbolic link '%s': %s\n", name, strerror(e)); return 1; }
  return 0;
}

static int cmd_readlink(int argc, char **argv) {
  int rc = 0;
  for (int i = 1; i < argc; i++) {
    if (argv[i][0] == '-') continue;
    char *t = do_readlink(argv[i]);
    if (t) printf("%s\n", t); else rc = 1;
  }
  return rc;
}

/* head/tail: -n N, -N */
static long count_opt(int *argc, char ***argv, long def) {
  long n = def;
  char **v = *argv;
  int i = 1;
  for (; i < *argc; i++) {
    if (!strcmp(v[i], "-n") && i + 1 < *argc) { n = atol(v[++i]); continue; }
    if (!strncmp(v[i], "-n", 2) && v[i][2]) { n = atol(v[i] + 2); continue; }
    if (v[i][0] == '-' && isdigit(v[i][1])) { n = atol(v[i] + 1); continue; }
    break;
  }
  *argv = v + i - 1;
  *argc -= i - 1;
  return n;
}

static int head_tail(int argc, char **argv, int tail) {
  long n = count_opt(&argc, &argv, 10);
  static char *dash[] = {0, "-"};
  if (argc < 2) { argv = dash; argc = 2; }
  int rc = 0;
  for (int i = 1; i < argc; i++) {
    buf_t b;
    errno_t e = slurp(argv[i], &b);
    if (e) { rc = fail(argv[i], e); continue; }
    if (argc > 2) printf("%s==> %s <==\n", i > 1 ? "\n" : "", argv[i]);
    lines_t l = split_lines(&b);
    size_t from = 0, to = l.n;
    if (tail) from = (size_t)n < l.n ? l.n - n : 0;
    else to = (size_t)n < l.n ? (size_t)n : l.n;
    for (size_t k = from; k < to; k++) printf("%s\n", l.v[k]);
  }
  return rc;
}
static int cmd_head(int argc, char **argv) { return head_tail(argc, argv, 0); }
static int cmd_tail(int argc, char **argv) { return head_tail(argc, argv, 1); }

static void wc_line(int *f, uint64_t l, uint64_t w, uint64_t c, const char *name) {
  uint64_t v[3] = {l, w, c};
  int shown = f[0] + f[1] + f[2], first = 1;
  /* a lone count from stdin is printed bare, like GNU wc */
  int width = (shown == 1 && !name) ? 0 : 7;
  for (int k = 0; k < 3; k++) {
    if (!f[k]) continue;
    if (!first) putch(STDOUT, ' ');
    fmt_uint(STDOUT, v[k], 10, width, ' ', 0);
    first = 0;
  }
  if (name) printf(" %s", name);
  putch(STDOUT, '\n');
}

static int cmd_wc(int argc, char **argv) {
  int f[3] = {0};
  int i = opts(argc, argv, "lwc", f);
  if (!f[0] && !f[1] && !f[2]) f[0] = f[1] = f[2] = 1;
  static char *dash[] = {"-"};
  char **files = i < argc ? argv + i : dash;
  int nfiles = i < argc ? argc - i : 1, rc = 0;
  uint64_t tl = 0, tw = 0, tc = 0;
  for (int k = 0; k < nfiles; k++) {
    buf_t b;
    errno_t e = slurp(files[k], &b);
    if (e) { rc = fail(files[k], e); continue; }
    uint64_t l = 0, w = 0, inword = 0;
    for (size_t j = 0; j < b.len; j++) {
      if (b.data[j] == '\n') l++;
      if (isspace(b.data[j])) inword = 0;
      else if (!inword) { inword = 1; w++; }
    }
    tl += l; tw += w; tc += b.len;
    wc_line(f, l, w, b.len, i < argc ? files[k] : 0);
  }
  if (nfiles > 1) wc_line(f, tl, tw, tc, "total");
  return rc;
}

/* Kernighan & Pike's regex matcher: c . ^ $ * */
static int icase;
static int ceq(char a, char b) { return icase ? tolower(a) == tolower(b) : a == b; }
static int match_here(const char *re, const char *s);
static int match_star(char c, const char *re, const char *s) {
  do { if (match_here(re, s)) return 1; } while (*s && (*s++ == c || c == '.' || ceq(s[-1], c)));
  return 0;
}
static int match_here(const char *re, const char *s) {
  if (!re[0]) return 1;
  if (re[0] == '\\' && re[1]) { return *s && ceq(*s, re[1]) && match_here(re + 2, s + 1); }
  if (re[1] == '*') return match_star(re[0], re + 2, s);
  if (re[0] == '$' && !re[1]) return !*s;
  if (*s && (re[0] == '.' || ceq(re[0], *s))) return match_here(re + 1, s + 1);
  return 0;
}
static int match(const char *re, const char *s) {
  if (re[0] == '^') return match_here(re + 1, s);
  do { if (match_here(re, s)) return 1; } while (*s++);
  return 0;
}

static int cmd_grep(int argc, char **argv) {
  int f[5] = {0};
  int i = opts(argc, argv, "ivncr", f);
  icase = f[0];
  if (i >= argc) { eprintf("usage: grep [-ivnc] PATTERN [FILE...]\n"); return 2; }
  const char *re = argv[i++];
  static char *dash[] = {"-"};
  char **files = i < argc ? argv + i : dash;
  int nfiles = i < argc ? argc - i : 1, found = 0, rc = 0;
  int color = isatty(1);
  for (int k = 0; k < nfiles; k++) {
    buf_t b;
    errno_t e = slurp(files[k], &b);
    if (e) { fail(files[k], e); rc = 2; continue; }
    lines_t l = split_lines(&b);
    size_t count = 0;
    for (size_t j = 0; j < l.n; j++) {
      if (match(re, l.v[j]) == f[1]) continue;
      count++; found = 1;
      if (f[3]) continue;
      if (nfiles > 1) printf(color ? "\033[35m%s\033[36m:\033[0m" : "%s:", files[k]);
      if (f[2]) printf(color ? "\033[32m%u\033[36m:\033[0m" : "%u:", (unsigned)(j + 1));
      printf("%s\n", l.v[j]);
    }
    if (f[3]) { if (nfiles > 1) printf("%s:", files[k]); printf("%u\n", (unsigned)count); }
  }
  return rc ? rc : !found;
}

static int sort_rev, sort_num;
static int line_cmp(const void *a, const void *b) {
  const char *x = a, *y = b;
  int d = sort_num ? (atol(x) > atol(y)) - (atol(x) < atol(y)) : 0;
  if (!d) d = strcmp(x, y);
  return sort_rev ? -d : d;
}

static int cmd_sort(int argc, char **argv) {
  int f[3] = {0};
  int i = opts(argc, argv, "rnu", f);
  sort_rev = f[0]; sort_num = f[1];
  static char *dash[] = {"-"};
  char **files = i < argc ? argv + i : dash;
  int nfiles = i < argc ? argc - i : 1;
  buf_t all = {malloc(1), 0};
  for (int k = 0; k < nfiles; k++) {
    buf_t b;
    errno_t e = slurp(files[k], &b);
    if (e) return fail(files[k], e);
    all.data = realloc(all.data, all.len, all.len + b.len + 1);
    memcpy(all.data + all.len, b.data, b.len);
    all.len += b.len;
    if (b.len && b.data[b.len - 1] != '\n') all.data[all.len++] = '\n';
  }
  lines_t l = split_lines(&all);
  qsort_ptrs((void **)l.v, l.n, line_cmp);
  for (size_t j = 0; j < l.n; j++) {
    if (f[2] && j && !strcmp(l.v[j], l.v[j - 1])) continue;
    printf("%s\n", l.v[j]);
  }
  return 0;
}

static int cmd_uniq(int argc, char **argv) {
  int f[1] = {0};
  int i = opts(argc, argv, "c", f);
  buf_t b;
  errno_t e = slurp(i < argc ? argv[i] : "-", &b);
  if (e) return fail(argv[i], e);
  lines_t l = split_lines(&b);
  for (size_t j = 0; j < l.n;) {
    size_t k = j;
    while (k < l.n && !strcmp(l.v[k], l.v[j])) k++;
    if (f[0]) printf("%7u ", (unsigned)(k - j));
    printf("%s\n", l.v[j]);
    j = k;
  }
  return 0;
}

static int cmd_rev(int argc, char **argv) {
  buf_t b;
  errno_t e = slurp(argc > 1 ? argv[1] : "-", &b);
  if (e) return fail(argv[1], e);
  lines_t l = split_lines(&b);
  for (size_t j = 0; j < l.n; j++) {
    char *s = l.v[j];
    size_t n = strlen(s);
    /* reverse by UTF-8 code point */
    char *o = malloc(n + 1);
    size_t w = n;
    for (size_t r = 0; r < n;) {
      size_t len = 1;
      while (r + len < n && ((uint8_t)s[r + len] & 0xC0) == 0x80) len++;
      w -= len;
      memcpy(o + w, s + r, len);
      r += len;
    }
    o[n] = 0;
    printf("%s\n", o);
  }
  return 0;
}

static int cmd_date(int argc, char **argv) {
  int utc = argc > 1 && !strcmp(argv[1], "-u");
  timestamp_t ns = 0;
  wasi_clock_time_get(0, 1000, &ns);
  tm_t t = utc ? civil((int64_t)(ns / 1000000000ull)) : localtime_ns(ns);
  const char *tz = utc ? "UTC" : getenv("TZNAME");
  printf("%s %s %2d %02d:%02d:%02d %s %d\n", wdays[t.wday], months[t.mon - 1], t.mday, t.hour, t.min,
         t.sec, tz ? tz : "UTC", t.year);
  return 0;
}

static int cmd_uname(int argc, char **argv) {
  int f[5] = {0};
  opts(argc, argv, "asnrm", f);
  const char *host = getenv("HOSTNAME");
  const char *parts[] = {"WASI", host ? host : "host", "preview1", "wasm32"};
  int show[] = {f[0] || f[1] || (!f[2] && !f[3] && !f[4]), f[0] || f[2], f[0] || f[3], f[0] || f[4]};
  int first = 1;
  for (int i = 0; i < 4; i++) {
    if (!show[i]) continue;
    printf("%s%s", first ? "" : " ", parts[i]);
    first = 0;
  }
  putch(STDOUT, '\n');
  return 0;
}

static int cmd_whoami(int argc, char **argv) {
  (void)argc; (void)argv;
  const char *u = getenv("USER");
  printf("%s\n", u ? u : "tobi");
  return 0;
}

static int cmd_hostname(int argc, char **argv) {
  (void)argc; (void)argv;
  const char *h = getenv("HOSTNAME");
  printf("%s\n", h ? h : "host");
  return 0;
}

static int cmd_env(int argc, char **argv) {
  (void)argc; (void)argv;
  for (char **e = environ; e && *e; e++) printf("%s\n", *e);
  return 0;
}

static int cmd_seq(int argc, char **argv) {
  long first = 1, step = 1, last;
  if (argc == 2) last = atol(argv[1]);
  else if (argc == 3) { first = atol(argv[1]); last = atol(argv[2]); }
  else if (argc == 4) { first = atol(argv[1]); step = atol(argv[2]); last = atol(argv[3]); }
  else { eprintf("usage: seq [FIRST [STEP]] LAST\n"); return 1; }
  if (!step) { eprintf("seq: invalid zero increment\n"); return 1; }
  if (step > 0) for (long i = first; i <= last; i += step) printf("%ld\n", i);
  else for (long i = first; i >= last; i += step) printf("%ld\n", i);
  return 0;
}

static int cmd_basename(int argc, char **argv) {
  if (argc < 2) { eprintf("basename: missing operand\n"); return 1; }
  char *b = (char *)basename_of(argv[1]);
  if (argc > 2) {
    size_t n = strlen(b), s = strlen(argv[2]);
    if (s < n && !strcmp(b + n - s, argv[2])) b[n - s] = 0;
  }
  printf("%s\n", b);
  return 0;
}

static int cmd_dirname(int argc, char **argv) {
  if (argc < 2) { eprintf("dirname: missing operand\n"); return 1; }
  char *p = strdup(argv[1]);
  size_t n = strlen(p);
  while (n > 1 && p[n - 1] == '/') p[--n] = 0;
  char *s = strrchr(p, '/');
  if (!s) printf(".\n");
  else if (s == p) printf("/\n");
  else { *s = 0; printf("%s\n", p); }
  return 0;
}

static int cmd_true(int argc, char **argv) { (void)argc; (void)argv; return 0; }
static int cmd_false(int argc, char **argv) { (void)argc; (void)argv; return 1; }

static int cmd_stat(int argc, char **argv) {
  int rc = 0;
  for (int i = 1; i < argc; i++) {
    filestat_t st;
    errno_t e = do_stat(argv[i], 0, &st);
    if (e) { eprintf("stat: cannot statx '%s': %s\n", argv[i], strerror(e)); rc = 1; continue; }
    const char *type = st.filetype == FT_DIR ? "directory" : st.filetype == FT_LINK ? "symbolic link"
                       : st.filetype == FT_CHAR ? "character special file" : "regular file";
    tm_t t = localtime_ns(st.mtim);
    printf("  File: %s", argv[i]);
    if (st.filetype == FT_LINK) { char *tg = do_readlink(argv[i]); printf(" -> %s", tg ? tg : "?"); }
    printf("\n  Size: %lu\tInode: %lu\t%s\n", (unsigned long)st.size, (unsigned long)st.ino, type);
    printf("Modify: %d-%02d-%02d %02d:%02d:%02d\n", t.year, t.mon, t.mday, t.hour, t.min, t.sec);
  }
  return rc;
}

/* ================================================================ dispatch */

typedef struct { const char *name; int (*fn)(int, char **); const char *help; } cmd_t;

static int cmd_coreutils(int argc, char **argv);

static const cmd_t cmds[] = {
  {"basename", cmd_basename, "strip directory and suffix from a path"},
  {"cat", cmd_cat, "concatenate files to stdout"},
  {"cp", cmd_cp, "copy files"},
  {"date", cmd_date, "print the date"},
  {"dirname", cmd_dirname, "strip the last component from a path"},
  {"echo", cmd_echo, "print arguments"},
  {"env", cmd_env, "print the environment"},
  {"false", cmd_false, "exit unsuccessfully"},
  {"grep", cmd_grep, "print lines matching a pattern"},
  {"head", cmd_head, "first lines of a file"},
  {"hostname", cmd_hostname, "print the host name"},
  {"ln", cmd_ln, "make symbolic links"},
  {"ls", cmd_ls, "list directory contents"},
  {"mkdir", cmd_mkdir, "make directories"},
  {"mv", cmd_mv, "move or rename files"},
  {"pwd", cmd_pwd, "print working directory"},
  {"readlink", cmd_readlink, "print symlink targets"},
  {"rev", cmd_rev, "reverse lines"},
  {"rm", cmd_rm, "remove files or directories"},
  {"rmdir", cmd_rmdir, "remove empty directories"},
  {"seq", cmd_seq, "print a sequence of numbers"},
  {"sort", cmd_sort, "sort lines"},
  {"stat", cmd_stat, "display file status"},
  {"tail", cmd_tail, "last lines of a file"},
  {"touch", cmd_touch, "create files / update timestamps"},
  {"tree", cmd_tree, "list directories as a tree"},
  {"true", cmd_true, "exit successfully"},
  {"uname", cmd_uname, "print system information"},
  {"uniq", cmd_uniq, "collapse repeated lines"},
  {"wc", cmd_wc, "count lines, words and bytes"},
  {"whoami", cmd_whoami, "print the user name"},
  {"coreutils", cmd_coreutils, "list the commands in this binary"},
};

static int cmd_coreutils(int argc, char **argv) {
  (void)argc; (void)argv;
  for (size_t i = 0; i < sizeof cmds / sizeof *cmds; i++) printf("%-10s %s\n", cmds[i].name, cmds[i].help);
  return 0;
}

void _start(void) {
  size_t argc, argsz, envc, envsz;
  wasi_args_sizes_get(&argc, &argsz);
  char **argv = malloc((argc + 1) * sizeof *argv);
  char *argbuf = malloc(argsz);
  wasi_args_get(argv, argbuf);
  argv[argc] = 0;
  wasi_environ_sizes_get(&envc, &envsz);
  environ = malloc((envc + 1) * sizeof *environ);
  char *envbuf = malloc(envsz);
  wasi_environ_get(environ, envbuf);
  environ[envc] = 0;

  prog = argc ? basename_of(argv[0]) : "coreutils";
  /* `coreutils ls -l` works as well as argv[0] = "ls" */
  if (!strcmp(prog, "coreutils") && argc > 1) { argv++; argc--; prog = argv[0]; }
  for (size_t i = 0; i < sizeof cmds / sizeof *cmds; i++)
    if (!strcmp(cmds[i].name, prog)) exit(cmds[i].fn((int)argc, argv));
  eprintf("coreutils: %s: applet not found\n", prog);
  exit(127);
}
