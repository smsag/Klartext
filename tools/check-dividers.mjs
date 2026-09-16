// The workspace divider is drawn ONCE, on the resize handle.
//
// The theme softens it there (`--border-subtle`, the `:not(:hover)` block in
// src/theme.css). A second border on the split itself paints immediately
// alongside that one, so the seam becomes a two-pixel ramp and reads as a heavy
// rule instead of a hairline — measured in Obsidian as #f0f0ed then #e8e8e6
// against #ffffff. That regression has shipped once; this is the ratchet.
//
// Static, so it runs without Obsidian:
//     node tools/check-dividers.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");

// Strip comments so a selector quoted in prose cannot fail the check.
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

// Selectors for the sidebar/editor seam. The handle is exempt: it is the one
// element allowed to paint the line.
const SEAM = /\.workspace-split\.mod-(left|right)-split(?![\w-])/;
const HANDLE = /workspace-leaf-resize-handle/;
const BORDER = /(^|[;{\s])border(-(left|right|inline-start|inline-end))?(-(width|style|color))?\s*:/;

const failures = [];
let line = 1;
for (const block of bare.split("}")) {
  const startLine = line;
  line += (block.match(/\n/g) || []).length;
  const brace = block.indexOf("{");
  if (brace === -1) continue;
  const selector = block.slice(0, brace);
  const body = block.slice(brace + 1);
  if (!SEAM.test(selector) || HANDLE.test(selector)) continue;
  for (const decl of body.split(";")) {
    if (!BORDER.test(";" + decl)) continue;
    const value = decl.split(":").slice(1).join(":").trim();
    // A border explicitly switched off is the point of the rule, not a relapse.
    if (/^(none|0|0px|transparent)$/.test(value)) continue;
    failures.push({
      line: startLine + (block.slice(0, brace + 1 + body.indexOf(decl)).match(/\n/g) || []).length,
      selector: selector.trim().replace(/\s+/g, " "),
      decl: decl.trim(),
    });
  }
}

if (failures.length) {
  console.error(`${FILE}: the sidebar/editor divider is drawn twice.`);
  for (const f of failures) {
    console.error(`  ${FILE}:${f.line}  ${f.selector} { ${f.decl} }`);
  }
  console.error(
    "\nThe resize handle already draws this line at --border-subtle. Soften or" +
      "\nwiden it there instead of adding a second border to the split.",
  );
  process.exit(1);
}

console.log(`${FILE}: divider drawn once (resize handle only) — ok`);
