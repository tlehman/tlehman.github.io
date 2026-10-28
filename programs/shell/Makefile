# Build the WASI coreutils multicall binary used by ../../programs.html.
# Needs only clang with the wasm32 backend and wasm-ld (no wasi-libc).
#
# coreutils.wasm.js embeds the binary as base64 so the page works when
# opened from file:// as well as over http(s); browsers refuse to fetch()
# local files.
CC ?= clang
CFLAGS = --target=wasm32 -nostdlib -ffreestanding -O2 -Wall -Wextra -Wno-unused-parameter
LDFLAGS = -Wl,--export=_start -Wl,--strip-all -Wl,-z,stack-size=65536

all: coreutils.wasm.js

coreutils.wasm: coreutils.c
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $<

coreutils.wasm.js: coreutils.wasm
	printf '// generated from coreutils.wasm by make; do not edit\nwindow.COREUTILS_WASM = "%s";\n' "$$(base64 -w0 $<)" > $@

clean:
	rm -f coreutils.wasm coreutils.wasm.js

.PHONY: all clean
