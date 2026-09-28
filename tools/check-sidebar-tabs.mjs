// A sidebar's tab strip is on its panel's ground, and the active tab is marked.
//
// The theme paints every tab bar in `--background-secondary`. In a sidebar that
// left a grey patch in the corner of the window above a white panel — the only
// one for anyone who hides the editor's tab bar. The sidebar strip now takes
// `--background-primary`, which makes a white active tab say nothing, so the
// active tab carries an accent rule instead. The two halves only work
// together: a white strip without the rule hides which view is open, and the
// rule without `display: block` is hidden by Obsidian's own
// `.mod-right-split … .workspace-tab-header::after { display: none }`.
//
// Static, so it runs without Obsidian:
//     node tools/check-sidebar-tabs.mjs
// The pre-commit hook and the release workflow run every tools/check-*.mjs.
import { readStylesheet } from "./lib/stylesheet.mjs";

const FILE = "src/theme.css";
const css = readStylesheet();

/** Every declaration of the rules whose selector list contains `selector`. */
function declarations(selector) {
  const found = [];
  for (const block of css.split("}")) {
    const brace = block.indexOf("{");
    if (brace === -1) continue;
    const selectors = block
      .slice(0, brace)
      .split(",")
      .map((s) => s.trim().replace(/\s+/g, " "));
    if (!selectors.includes(selector)) continue;
    for (const decl of block.slice(brace + 1).split(";")) {
      const colon = decl.indexOf(":");
      if (colon === -1) continue;
      found.push([decl.slice(0, colon).trim(), decl.slice(colon + 1).trim()]);
    }
  }
  return found;
}

const value = (decls, property) => decls.filter(([p]) => p === property).map(([, v]) => v).pop();

const failures = [];

const strip = declarations(".workspace-split.mod-sidedock .workspace-tab-header-container");
if (value(strip, "background-color") !== "var(--background-primary)") {
  failures.push("the sidebar strip is not on --background-primary, the panels' ground");
}

const rule = declarations(".workspace-split.mod-sidedock .workspace-tab-header.is-active::after");
if (value(rule, "display") !== "block") {
  failures.push("the active tab's rule does not set display: block, so Obsidian hides it");
}
if (!/^var\(--(color-accent|interactive-accent)\)$/.test(value(rule, "background-color") ?? "")) {
  failures.push("the active tab's rule is not drawn in the accent");
}
if (!/^[1-9]\d*(\.\d+)?px$/.test(value(rule, "height") ?? "")) {
  failures.push("the active tab's rule has no height");
}

const icon = declarations(
  ".workspace-split.mod-sidedock .workspace-tab-header.is-active .workspace-tab-header-inner-icon",
);
if (value(icon, "color") !== "var(--text-normal)") {
  failures.push("the active tab's icon is not in the text colour");
}

if (failures.length) {
  console.error(`${FILE}: the sidebar tab strip lost its ground or its marker.`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("sidebar tabs: the strip is on the panel's ground, and the active tab carries its rule.");
