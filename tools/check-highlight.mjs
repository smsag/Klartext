#!/usr/bin/env node
// The marker-pen stroke keeps its shape.
//
// The HIGHLIGHT / MARK rule is the theme's most recognisable mark, and three
// of its properties have been re-added by hand before: a border-radius (which
// makes the end read as a chip), a text-shadow halo (which inverts between
// light and dark) and a box-shadow. The numbers are the geometry itself; a
// changed one is a changed pen, so it is stated here as well as in the rule.
//
//     node tools/check-highlight.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8");

const from = css.indexOf("mark,\n.markdown-preview-view mark,\n.cm-highlight {");
if (from < 0) {
  console.error("check-highlight: the HIGHLIGHT / MARK rule is not where it was; update this guard.");
  process.exit(1);
}
const rule = css.slice(from, css.indexOf("}", from));

const GEOMETRY = [
  ["--hl-angle", "104deg"],
  ["--hl-land-0", "0.2em"],
  ["--hl-land-1", "0.7em"],
  ["--hl-lift-1", "88%"],
  ["--hl-lift-0", "calc(100% - 0.28em)"],
  ["--hl-pad-y", "0.14em"],
  ["--hl-pad-x", "0.42em"]
];
// The rule states these itself, as `none` / `0`. The guard reads the VALUE
// rather than looking for the property's absence: `\s*(?!none)` passes on
// `text-shadow: none` by backtracking to zero spaces, which is how a guard
// that looks right fails open.
const FORBIDDEN = [
  ["text-shadow", "none", "a text-shadow halo"],
  ["box-shadow", "none", "a box-shadow"],
  ["border-radius", "0", "a border-radius"]
];

const problems = [];
for (const [name, value] of GEOMETRY) {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(rule);
  if (!m) problems.push(`${name} is gone from the stroke`);
  else if (m[1].trim() !== value) problems.push(`${name} is ${m[1].trim()}, was ${value}`);
}
for (const [prop, ok, what] of FORBIDDEN) {
  const m = new RegExp(`(?:^|[;{\\s])${prop}:\\s*([^;]+);`).exec(rule);
  if (!m) problems.push(`${prop} is no longer stated; the stroke must say ${ok}`);
  else if (m[1].trim() !== ok) problems.push(`${what} is back in the stroke (${prop}: ${m[1].trim()})`);
}

if (problems.length) {
  console.error("check-highlight: the stroke changed.\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nIf the change is wanted, update this guard in the same commit and say why.");
  process.exit(1);
}
console.log("check-highlight: the stroke is intact.");
