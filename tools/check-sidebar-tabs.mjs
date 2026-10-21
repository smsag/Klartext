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
// tools/guards.mjs runs it with every other guard.
import { declarations as parse, readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const all = rules(readStylesheet());

/** Every declaration of the rules whose selector list contains `selector`. */
const declarations = (selector) =>
  all.filter(({ arms }) => arms.includes(selector)).flatMap(({ body }) => parse(body).map((d) => [d.prop, d.value]));

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

report("the sidebar tab strip lost its ground or its marker", failures, "sidebar tabs: the strip is on the panel's ground, and the active tab carries its rule.");
