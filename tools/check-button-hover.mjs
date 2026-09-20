// The theme provides a hover for buttons that do not bring their own.
// It does not take one from a button that does.
//
// This theme flattens the resting fill to white, so Obsidian's own hover is a
// five-in-255 step and effectively invisible; the BUTTONS rule replaces it with
// --surface-muted. That rule must reach a plugin's <button> — plugins use them
// for icon-shaped controls with no hover of their own — but it must never
// out-rank a plugin that has styled its own.
//
// Specificity already does the first job: the selector is (0,2,1) against
// Obsidian's (0,1,1). `!important` did the second by accident, and that is the
// bug: measured in Obsidian, one plugin's accent-filled primary button painted
// #f2f2ee under a white label — 1.12:1, an empty grey box.
//
// So: no `!important` on a rule that reaches a bare `button`. `.mod-cta` is
// exempt — that is Obsidian's own dialog chrome, which plugins opt into
// deliberately and which no plugin restyles.
//
// Static, so it runs without Obsidian:
//     node tools/check-button-hover.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

const fail = (...msg) => {
  console.error(`${FILE}: ${msg.join("\n  ")}`);
  process.exit(1);
};

/** The element a selector actually styles: its last compound. */
function subject(selector) {
  // Strip functional pseudo-class arguments — `:has(> button)` names a
  // condition, not the styled element, and the rule lands on the flair label.
  let flat = selector;
  for (let prev = ""; prev !== flat; ) {
    prev = flat;
    flat = flat.replace(/:(?:has|not|is|where|matches)\([^()]*\)/g, "\u0000");
  }
  const parts = flat.split(/[>+~\s]+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

/** Does this compound REQUIRE .mod-cta? `button:not(.mod-cta)` does not. */
function requiresCta(selector) {
  const last = selector.split(/[>+~\s]+/).filter(Boolean).pop() || "";
  return /\.mod-cta(?![\w-])/.test(last.replace(/:not\([^)]*\)/g, ""));
}

const offenders = [];
let line = 1;
for (const block of bare.split("}")) {
  const startLine = line;
  line += (block.match(/\n/g) || []).length;
  const brace = block.indexOf("{");
  if (brace === -1) continue;
  const selectorList = block.slice(0, brace);
  const body = block.slice(brace + 1);
  if (!/!important/.test(body)) continue;

  for (const selector of selectorList.split(",")) {
    // The styled element is a bare `button`. `.mod-cta` is Obsidian's own
    // dialog chrome, which plugins opt into deliberately — exempt.
    if (!/^button(?![\w-])/.test(subject(selector))) continue;
    if (requiresCta(selector)) continue;
    for (const decl of body.split(";")) {
      if (!/!important/.test(decl)) continue;
      offenders.push({
        line: startLine,
        selector: selector.trim().replace(/\s+/g, " ").slice(0, 64),
        prop: decl.split(":")[0].trim(),
      });
    }
    break;   // one report per rule is enough
  }
}

if (offenders.length) {
  fail(
    "an !important rule reaches a plugin's <button>:",
    ...offenders.map((o) => `  ${FILE}:${o.line}  ${o.selector} { ${o.prop}: … !important }`),
    "",
    "A plugin cannot out-rank !important at any specificity, so this overrides",
    "a button it has deliberately styled. Drop the !important: the selector's",
    "own specificity already beats Obsidian's, which is all the theme needs.",
  );
}

console.log(`${FILE}: no !important reaches a plugin's button — ok`);
