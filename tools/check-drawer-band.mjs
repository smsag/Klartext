#!/usr/bin/env node
// The band under the clock above an open phone drawer is the leaf's ground.
//
// The theme paints every leaf --background-primary; the drawer keeps
// --mobile-sidebar-background and shows only in its top padding, the safe
// area. In dark mode that was a #222222 strip over a #1a1a1a panel, measured in
// Obsidian 1.13.7's phone emulation. The rule paints exactly that padding in
// the leaf's colour: Obsidian's own padding expression, restated, so the band
// is never taller or shorter than the padding it covers.
//
//     node tools/check-drawer-band.mjs
import { readStylesheet } from "./lib/stylesheet.mjs";

const FILE = "src/theme.css";
const bare = readStylesheet();
const PADDING = "max(var(--size-4-2), var(--safe-area-inset-top))";

let rule = null;
for (const block of bare.split("}")) {
  const brace = block.indexOf("{");
  if (brace === -1) continue;
  const selector = block.slice(0, brace).replace(/\s+/g, " ").trim();
  if (selector.split(",").some((a) => a.trim() === "body.is-phone .workspace-drawer-inner")) rule = block.slice(brace + 1);
}

const failures = [];
if (rule === null) failures.push("no rule paints the drawer's top band (body.is-phone .workspace-drawer-inner)");
else {
  if (!/background-image:\s*linear-gradient\(var\(--background-primary\), var\(--background-primary\)\)/.test(rule)) {
    failures.push("the band is not painted in the leaf's colour, var(--background-primary)");
  }
  if (!rule.includes(`background-size: 100% ${PADDING}`)) failures.push(`the band is not sized to Obsidian's top padding, ${PADDING}`);
  if (!/background-repeat:\s*no-repeat/.test(rule)) failures.push("the band repeats down the drawer");
  if (/background-color/.test(rule)) failures.push("the rule repaints the whole drawer, not its top band");
}

if (failures.length) {
  console.error(`${FILE}: the band above an open phone drawer does not match its leaf.`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("drawer band: the safe area above an open drawer is the leaf's ground.");
