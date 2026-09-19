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
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

const fail = (...msg) => {
  console.error(`${FILE}: ${msg.join("\n  ")}`);
  process.exit(1);
};

// Block types that can be a list item's whole content and carry prose margins.
const BLOCKS = [
  { name: "callout", base: /(^|[,\s])\.callout(?![\w-])/, item: /li\s*>\s*\.callout(?![\w-])/ },
  { name: "blockquote", base: /(^|[,\s])(\.[\w-]+\s+)?blockquote(?![\w-])/, item: /li\s*>\s*blockquote(?![\w-])/ },
];
const VERTICAL_MARGIN =
  /(^|[;\s])margin(-block|-block-start|-block-end|-top|-bottom)?\s*:\s*([^;]+)/;

const found = {};
for (const b of BLOCKS) found[b.name] = { prose: [], item: [] };

let line = 1;
for (const block of bare.split("}")) {
  const startLine = line;
  line += (block.match(/\n/g) || []).length;
  const brace = block.indexOf("{");
  if (brace === -1) continue;
  const selector = block.slice(0, brace);
  const body = block.slice(brace + 1);

  for (const b of BLOCKS) {
    if (!b.base.test(selector)) continue;
    const inItem = b.item.test(selector);
    for (const decl of body.split(";")) {
      const m = VERTICAL_MARGIN.exec(";" + decl);
      if (!m) continue;
      const prop = m[2] || "";
      const value = m[3].trim();
      // `margin: a b c d` and `margin: a b` both carry a vertical component;
      // `margin-inline*`/`margin-left|right` never reach this regex.
      const zero = /^(0|0px|0em)(\s+(0|0px|0em|auto|[\w.%-]+))*$/.test(value) &&
        /^(0|0px|0em)/.test(value);
      if (zero && !prop) continue;
      (inItem ? found[b.name].item : found[b.name].prose).push({
        line: startLine,
        selector: selector.trim().replace(/\s+/g, " ").slice(0, 70),
        important: /!important/.test(decl),
      });
    }
  }
}

for (const b of BLOCKS) {
  const f = found[b.name];
  if (!f.prose.length) continue; // no prose margin to escape the item
  if (!f.item.length) {
    fail(
      `${b.name}: a vertical margin is set for prose flow (${FILE}:${f.prose[0].line})`,
      "but no rule re-spaces it inside a list item, where nothing collapses it.",
      `Add a \`li > ${b.name === "callout" ? ".callout" : "blockquote"}\` rule with margin-block.`,
    );
  }
  // The base blockquote rule uses !important; an override without one loses.
  const baseImportant = f.prose.some((r) => r.important);
  if (baseImportant && !f.item.some((r) => r.important)) {
    fail(
      `${b.name}: the prose margin at ${FILE}:${f.prose.find((r) => r.important).line} is !important,`,
      `so the list-item rule at ${FILE}:${f.item[0].line} never wins. Mark it !important too.`,
    );
  }
}

console.log(
  `${FILE}: a callout or quote in a list item is spaced like an item — ok`,
);
