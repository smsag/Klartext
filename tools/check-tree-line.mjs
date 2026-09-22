// The list tree line follows Obsidian's "Show indentation guides" setting.
//
// Obsidian draws indentation guides only on INDENTED lines, so a guide begins
// at the first child and never at the parent. The theme adds the missing
// segment on the parent, which is what makes the column read as one line.
//
// That segment is a bridge to Obsidian's guide, and a bridge to a guide that
// is not there is a stub joined to nothing. With the setting off, Obsidian
// emits the indent as raw tabs inside `.cm-hmd-list-indent` and NO `.cm-indent`
// span at all — so the theme has a signal, and every selector for the segment
// has to test for it. It showed up only next to a parent whose own text wraps,
// because the segment starts below the first line box and a one-line parent
// leaves it no room: one short line beside one item in a whole note.
//
// So: a selector that paints the segment must require `.cm-indent` in the
// child it bridges to. This guard fails when one of them stops asking.
//
// Static, so it runs without Obsidian:
//     node tools/check-tree-line.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/** A selector that reaches a list line's following sibling — i.e. one that
 *  draws, or positions, the parent's bridging segment. */
const BRIDGE = /\.cm-line\.HyperMD-list-line-(\d+):has\(\+ \.HyperMD-list-line-(\d+)([^)]*)\)/g;

const failures = [];
let seen = 0;

for (const m of bare.matchAll(BRIDGE)) {
  seen += 1;
  const [whole, parent, child, rest] = m;
  if (Number(child) !== Number(parent) + 1) {
    failures.push(`level ${parent} bridges to level ${child}: a segment only ever joins the next level down`);
  }
  if (!rest.includes(".cm-indent")) {
    failures.push(
      `${whole.trim()} does not require .cm-indent in the child, so it paints even when Obsidian draws no guides`
    );
  }
}

// Four levels, each with a custom property rule and a painting rule, plus the
// active-colour variants. If the count collapses, the selectors were rewritten
// into a shape this guard no longer reads, and it would pass by not looking.
const MIN_BRIDGE_SELECTORS = 12;
if (seen < MIN_BRIDGE_SELECTORS) {
  failures.push(
    `only ${seen} tree-line selectors found, expected at least ${MIN_BRIDGE_SELECTORS} — the block was restructured and this guard no longer reads it`
  );
}

// The segment must keep starting below the parent's own first line box: that
// is what leaves a gap under the dash instead of touching it.
if (!/top:\s*calc\(var\(--list-spacing[^)]*\)\s*\+\s*var\(--klartext-line-height\)\s*\*\s*1em\)/.test(bare)) {
  failures.push("the segment must start one line box below the parent, leaving a clear gap under the dash");
}

if (failures.length > 0) {
  console.error(`${FILE}: the list tree line does not follow Obsidian's indentation-guide setting`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`list tree line: ${seen} selectors, every one gated on the child's .cm-indent.`);
