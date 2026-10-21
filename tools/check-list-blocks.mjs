// A block inside a list item is spaced like an item, not like a paragraph.
//
// Callouts and blockquotes carry prose-flow vertical margins, chosen against
// the paragraphs they sit between. A list item collapses none of them:
// Obsidian gives every <li> 1.2px of vertical padding, and a padding edge
// stops a child's margin collapsing through it, so both ends are added in
// full inside the item. Measured in reading view without the override, a
// bodyless callout as a list item's content turned a 22px block into a 72px
// item with the marker 25px above the line it numbers.
//
// So: whenever a base rule gives .callout or blockquote a vertical margin,
// there must be a list-item rule that replaces it.
//
// Static, so it runs without Obsidian:
//     node tools/check-list-blocks.mjs
// tools/guards.mjs runs it with every other guard.
import { readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const bare = readStylesheet();

// Block types that can be a list item's whole content and carry prose margins.
const BLOCKS = [
  { name: "callout", base: /(^|[,\s])\.callout(?![\w-])/, item: /li\s*>\s*\.callout(?![\w-])/ },
  { name: "blockquote", base: /(^|[,\s])(\.[\w-]+\s+)?blockquote(?![\w-])/, item: /li\s*>\s*blockquote(?![\w-])/ },
];
const VERTICAL_MARGIN =
  /(^|[;\s])margin(-block|-block-start|-block-end|-top|-bottom)?\s*:\s*([^;]+)/;

const found = {};
for (const b of BLOCKS) found[b.name] = { prose: [], item: [] };

/** Is every vertical component of this margin zero? `margin: a b c d` reads
 *  top and bottom from the first and third value, `a b c` likewise, and
 *  `a b` / `a` from the first; a longhand is the value itself. */
const ZERO = /^(0|0px|0em|0rem)$/;
/** A value's space-separated components, keeping `calc(a + b)` whole. */
function components(value) {
  const out = [""];
  let depth = 0;
  for (const c of value.replace(/!important/, "").trim()) {
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (/\s/.test(c) && depth === 0) { if (out[out.length - 1]) out.push(""); }
    else out[out.length - 1] += c;
  }
  return out.filter(Boolean);
}
function verticalZero(prop, value) {
  const v = components(value);
  if (prop) return v.every((x) => ZERO.test(x));   // margin-block takes one or two values, both vertical
  return ZERO.test(v[0]) && ZERO.test(v.length >= 3 ? v[2] : v[0]);
}

// Arm by arm: `blockquote, li > blockquote { … }` is a prose margin AND an
// item rule, and judged as a whole list it would pass as the override alone.
for (const { arms, body, line: startLine } of rules(bare)) {
  for (const b of BLOCKS) {
    const based = arms.filter((a) => b.base.test(a));
    if (based.length === 0) continue;
    for (const decl of body.split(";")) {
      const m = VERTICAL_MARGIN.exec(";" + decl);
      if (!m) continue;
      const prop = m[2] || "";
      // `margin-inline*`/`margin-left|right` never reach this regex.
      if (verticalZero(prop, m[3])) continue;
      for (const arm of based) {
        (b.item.test(arm) ? found[b.name].item : found[b.name].prose).push({
          line: startLine,
          selector: arm.slice(0, 70),
          important: /!important/.test(decl),
        });
      }
    }
  }
}

const failures = [];
for (const b of BLOCKS) {
  const f = found[b.name];
  if (!f.prose.length) continue; // no prose margin to escape the item
  if (!f.item.length) {
    failures.push(
      `${b.name}: a vertical margin is set for prose flow (line ${f.prose[0].line}, ${f.prose[0].selector}) ` +
        `but no rule re-spaces it inside a list item, where nothing collapses it; add a \`li > ${b.name === "callout" ? ".callout" : "blockquote"}\` rule with margin-block`,
    );
    continue;
  }
  // The base blockquote rule uses !important; an override without one loses.
  const important = f.prose.find((r) => r.important);
  if (important && !f.item.some((r) => r.important)) {
    failures.push(
      `${b.name}: the prose margin at line ${important.line} is !important, so the list-item rule at line ${f.item[0].line} never wins; mark it !important too`,
    );
  }
}

report("a block inside a list item is spaced like a paragraph", failures, "list blocks: a callout or quote in a list item is spaced like an item.");
