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
import { declarations, readStylesheet, report, rules, rulesFor } from "./lib/stylesheet.mjs";

// Read from the flattened stylesheet, comments blanked: a commented-out
// `text-shadow: none;` above a live halo must not pass for the real thing.
// Found by its selector list, however it is wrapped.
const STROKE = ["mark", ".markdown-preview-view mark", ".cm-highlight", ".cm-highlight-color-widget"];
const found = rulesFor(rules(readStylesheet()), ...STROKE);
if (found.length !== 1) {
  report("the stroke changed", [`expected one rule for ${STROKE.join(", ")}, found ${found.length}; update this guard`], "");
}
/** The value each property ends with, as the cascade would leave it. */
const stated = new Map(declarations(found[0].body).map((d) => [d.prop, d.value]));

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
// rather than looking for the property's absence: a negative lookahead such
// as `\s*(?!none)` passes on `text-shadow: none` by backtracking to zero
// spaces, which is how a guard that looks right fails open.
const FORBIDDEN = [
  ["text-shadow", "none", "a text-shadow halo"],
  ["box-shadow", "none", "a box-shadow"],
  ["border-radius", "0", "a border-radius"]
];

const problems = [];
for (const [name, value] of GEOMETRY) {
  if (!stated.has(name)) problems.push(`${name} is gone from the stroke`);
  else if (stated.get(name) !== value) problems.push(`${name} is ${stated.get(name)}, was ${value}`);
}
for (const [prop, ok, what] of FORBIDDEN) {
  if (!stated.has(prop)) problems.push(`${prop} is no longer stated; the stroke must say ${ok}`);
  else if (stated.get(prop) !== ok) problems.push(`${what} is back in the stroke (${prop}: ${stated.get(prop)})`);
}

report(
  "the stroke changed; if the change is wanted, update this guard in the same commit and say why",
  problems,
  "highlight: the stroke is intact.",
);
