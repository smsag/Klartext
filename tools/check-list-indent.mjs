// One nesting level must render as one indent unit, tab or spaces alike.
//
// Obsidian emits one .cm-indent per list level and floors each at
// --list-indent (app.css: `min-width: var(--list-indent)`). A tab is exactly
// that wide because `tab-size` is set to the same length; a run of spaces is
// only correct while its natural width stays UNDER the floor. This theme's
// unit is --klartext-col = cell x marker-column, and a level written with
// spaces is cell x tab-size, so the floor holds only while
//
//     --klartext-marker-column  >=  --klartext-tab-size
//
// It does not (2 vs 4): four spaces measure two units, and a space-indented
// item paints one level deeper than the tabbed sibling it belongs with. The
// theme neutralises the space advance instead, so any run falls back under
// the floor. This checks that the neutraliser is still there whenever the
// token arithmetic still needs it.
//
// Static, so it runs without Obsidian:
//     node tools/check-list-indent.mjs
// tools/guards.mjs runs it with every other guard.
import { FILE, readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const bare = readStylesheet();
const all = rules(bare);
const failures = [];

const decl = (name) => {
  const m = bare.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};
const num = (name) => {
  const v = decl(name);
  return v !== null && /^\d+(\.\d+)?$/.test(v) ? Number(v) : null;
};

// The derivation this check reasons about. If it changes shape, the check
// cannot claim anything and says so rather than passing quietly.
if (decl("list-indent") !== "var(--klartext-col)") {
  failures.push("--list-indent is no longer var(--klartext-col); re-derive the tab/space floor in this script before changing it");
}
for (const [token, factor] of [["klartext-col", "0.6"], ["klartext-cell", "0.6"]]) {
  if (!(decl(token) || "").includes(`* ${factor}`)) {
    failures.push(`--${token} no longer measures in ${factor}em character cells; re-derive the tab/space floor in this script before changing it`);
  }
}

const markerColumn = num("klartext-marker-column");
const tabSize = num("klartext-tab-size");
if (markerColumn === null || tabSize === null) {
  report("one list level is not one indent unit", [...failures, "--klartext-marker-column and --klartext-tab-size must be plain numbers"], "");
}

// The box for ONE COMPLETE level: the element Obsidian floors, and the one
// whose width a whole level of spaces inflates past that floor. The remainder
// of a partial indent lives in .cm-indent-spacing, which has no floor, so it
// is deliberately not part of this.
const SPAN = /\.cm-hmd-list-indent\s*>\s*\.cm-indent(?![\w-])/;
let neutralised = false;
for (const { arms, body, line } of all) {
  if (!arms.some((a) => SPAN.test(a))) continue;
  // font-size shrinks the box as well as the advance, and the indentation
  // guide is this element's ::before — its height is the box's.
  if (/(^|[;\s])font-size\s*:/.test(body)) {
    failures.push(`line ${line}: font-size on the indent box collapses the indentation guide, which is .cm-indent's own ::before and takes the box's height (measured: 25.6px -> 6.4px); neutralise the advance instead`);
  }
  if (/(^|[;\s])word-spacing\s*:\s*calc\(\s*var\(--klartext-cell\)\s*\*\s*-1\s*\)/.test(body)) {
    neutralised = true;
  }
}

// Without indentation guides Obsidian emits no .cm-indent at all: the indent
// is bare text in .cm-hmd-list-indent, with no floor, and only the space's own
// width can be corrected. Measured: four spaces painted two levels deep.
const sized = all.some(
  ({ arms, body }) =>
    arms.some((a) => /\.cm-hmd-list-indent$/.test(a)) &&
    /word-spacing\s*:\s*calc\(\s*var\(--list-indent\)\s*\/\s*var\(--klartext-tab-size\)\s*-\s*var\(--klartext-cell\)\s*\)/.test(body),
);
if (tabSize > markerColumn && !sized) {
  failures.push(
    "with indentation guides off there is no .cm-indent floor, so a space in a list indent must be sized to one " +
      "--klartext-tab-size-th of a level on .cm-hmd-list-indent: `word-spacing: calc(var(--list-indent) / var(--klartext-tab-size) - var(--klartext-cell))`",
  );
}

if (tabSize > markerColumn && !neutralised) {
  failures.push(
    `a space-indented level is ${tabSize} cells wide against a ${markerColumn}-cell unit, so Obsidian's min-width floor never applies ` +
      `and it paints ${(tabSize / markerColumn).toFixed(2)}x too deep; restore \`word-spacing: calc(var(--klartext-cell) * -1)\` on ` +
      ".cm-hmd-list-indent > .cm-indent, or widen --klartext-marker-column to --klartext-tab-size",
  );
}

report(
  "one list level is not one indent unit",
  failures,
  `${FILE}: one level = one indent unit for tabs and spaces ` +
    `(${tabSize} cells vs ${markerColumn}-cell unit, ` +
    `${neutralised ? "advance neutralised" : "floor sufficient"}, ${sized ? "spaces sized without guides" : "no guide-less sizing needed"}).`,
);
