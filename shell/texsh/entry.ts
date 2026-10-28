// Browser entry for the `texsh` builtin in ../shell.js.
//
// texsh (github.com/tlehman/texsh) runs on Bun with an OpenTUI interface,
// but its command language and LaTeX -> Unicode converter are plain
// TypeScript, and so is opentui-math's text layout (render.ts and the
// modules under it import nothing from OpenTUI). `make texsh.js` clones
// both repos into ./vendor and bundles just those pieces.
import { renderLatexToString } from "./vendor/opentui-math/src/render.ts"
import { EXAMPLE_LINES, HELP_LINES, parseLine } from "./vendor/texsh/src/commands.ts"
import { formatCodePoints } from "./vendor/texsh/src/format.ts"
import { latexToUnicode } from "./vendor/texsh/src/unicode/index.ts"

;(window as any).TEXSH = { renderLatexToString, parseLine, HELP_LINES, EXAMPLE_LINES, formatCodePoints, latexToUnicode }
