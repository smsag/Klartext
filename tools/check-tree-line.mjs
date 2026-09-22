// The theme draws the list tree line from end to end, with one painter and
// one x.
//
// Obsidian draws an indentation guide only on an INDENTED line, so a guide
// begins at the first child and never at the parent — and it draws nothing at
// all when "Show indentation guides" is off. The theme used to add only the
// parent's missing segment and lean on Obsidian for the rest, so the line
// existed or did not according to a setting, and with the setting off the one
// segment the theme drew was a stub joined to nothing.
//
// Now the theme owns the whole line. Three things hold it together, and each
// one broke while it was being built:
//
//   * ONE X. The ancestor columns are a gradient and the parent's segment is a
//     box; while each did its own arithmetic they sat a pixel apart, because a
//     1px box with a 1px border on its end side paints one width past its own
//     inset. Both read --klartext-tree-x.
//   * BORDER-BOX. Obsidian gives a list line a padding-left equal to its whole
//     indent, with a matching negative text-indent. A gradient measured from
//     the content box starts past every column it is meant to draw — measured,
//     38px right on level 2.
//   * THE ACTIVE GUIDE SURVIVES. Obsidian's inactive guides step aside so
//     there is one painter, but the guide marking the cursor's level is left
//     alone: a uniform line cannot say which level that is.
//
// Static, so it runs without Obsidian:
//     node tools/check-tree-line.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/** The declarations of the rule a selector opens. */
function ruleBody(selector) {
  for (let at = bare.indexOf(selector); at !== -1; at = bare.indexOf(selector, at + 1)) {
    if (bare.slice(0, at).trimEnd().endsWith(",")) continue;
    const open = bare.indexOf("{", at);
    return bare.slice(open + 1, bare.indexOf("}", open));
  }
  return null;
}

const failures = [];

const LINE = ".markdown-source-view.mod-cm6.is-live-preview .cm-line[class*=\"HyperMD-list-line-\"]";
const columns = ruleBody(LINE);
if (columns === null) {
  failures.push("the ancestor-column rule is missing from the stylesheet");
} else {
  if (!/--klartext-tree-x:\s*calc\(var\(--indentation-guide-editing-indent\)\s*\+\s*var\(--indentation-guide-width\)\)/.test(columns)) {
    failures.push("--klartext-tree-x must be the guide inset plus one guide width, which is where Obsidian's own band lands");
  }
  if (!/background-origin:\s*border-box/.test(columns) || !/background-clip:\s*border-box/.test(columns)) {
    failures.push("the gradient must be measured from the border box: a list line's padding-left IS its indent, so content-box starts past every column");
  }
  if (!/repeating-linear-gradient/.test(columns)) {
    failures.push("the ancestor columns must be one repeating gradient, not a rule per level");
  }
  if (!/background-size:\s*calc\(var\(--klartext-tree-cols[^)]*\)\s*\*\s*var\(--klartext-indent-unit\)\)/.test(columns)) {
    failures.push("the gradient must be clipped to the line's own number of ancestor columns");
  }
  for (const token of ["--klartext-tree-x", "--indentation-guide-color", "--indentation-guide-width", "--klartext-indent-unit"]) {
    if (!columns.includes(token)) failures.push(`the gradient must be built from ${token}`);
  }
}

// Both painters share the x, or they drift by a pixel. The segment is a filled
// band rather than a border for exactly that reason.
const segment = bare
  .split("}")
  .find((b) => b.includes("HyperMD-list-line-5)::after") && b.includes("inset-inline-start"));
if (segment === undefined) {
  failures.push("the parent's segment rule is missing from the stylesheet");
} else {
  if (!/inset-inline-start:\s*calc\(var\(--klartext-tree-col\)\s*\*\s*var\(--klartext-indent-unit\)\s*\+\s*var\(--klartext-tree-x\)\)/.test(segment)) {
    failures.push("the parent's segment must sit at --klartext-tree-x, the same x as the gradient");
  }
  if (/border-inline-end:/.test(segment)) {
    failures.push("the segment must be a filled band, not a border: a border adds its own width on top of the inset and lands a pixel off the gradient");
  }
  if (!/background-color:\s*var\(--indentation-guide-color\)/.test(segment)) {
    failures.push("the segment must be filled with --indentation-guide-color");
  }
  if (!/top:\s*calc\(var\(--list-spacing[^)]*\)\s*\+\s*var\(--klartext-line-height\)\s*\*\s*1em\)/.test(segment)) {
    failures.push("the segment must start one line box below the parent, leaving a clear gap under the dash");
  }
}

// Obsidian's inactive guides step aside; the active one is left painting.
const stepAside = ".markdown-source-view.mod-cm6.is-live-preview .cm-indent:not(.cm-active-indent)::before";
const aside = ruleBody(stepAside);
if (aside === null || !/border-inline-end-color:\s*transparent/.test(aside)) {
  failures.push("Obsidian's own inactive guide must step aside, or the line is painted twice");
}
if (bare.includes(".cm-indent::before {") && /\.cm-indent::before\s*\{[^}]*border-inline-end-color:\s*transparent/.test(bare)) {
  failures.push("suppressing .cm-indent::before unconditionally also removes the active guide, which marks the cursor's level");
}

// Every level that sets a column count needs the matching class, and a bridge
// only ever joins the next level down.
const BRIDGE = /\.cm-line\.HyperMD-list-line-(\d+):has\(\+ \.HyperMD-list-line-(\d+)/g;
let bridges = 0;
for (const m of bare.matchAll(BRIDGE)) {
  bridges += 1;
  if (Number(m[2]) !== Number(m[1]) + 1) {
    failures.push(`level ${m[1]} bridges to level ${m[2]}: a segment only ever joins the next level down`);
  }
}
const MIN_BRIDGES = 10;
if (bridges < MIN_BRIDGES) {
  failures.push(`only ${bridges} bridge selectors found, expected at least ${MIN_BRIDGES} — the block was restructured and this guard no longer reads it`);
}

const cols = (bare.match(/--klartext-tree-cols:\s*\d+;/g) ?? []).length;
if (cols < 5) {
  failures.push(`only ${cols} levels declare an ancestor-column count, expected at least 5`);
}

if (failures.length > 0) {
  console.error(`${FILE}: the list tree line is not drawn the way it claims to be`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`list tree line: ${cols} levels of columns, ${bridges} bridge selectors, one x for both painters.`);
