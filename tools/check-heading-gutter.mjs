#!/usr/bin/env node
// The heading gutter is measured in BODY units only.
//
// Live Preview reserves one column to the left of every heading and hangs the
// #ₙ badge back into it. Everything in that column has to be the same width
// whatever the heading level, or the headings stop sharing a left edge with
// the body text — which is the whole point of the column.
//
// `em` inside these rules is the HEADING's size, not the body's, so one
// unqualified `em` makes a length that looks constant come out three
// different sizes. That is how `margin-inline-end: … + 0.5em` shipped: on a
// desktop the chevron is hover-only, its margin never reaches the layout, and
// nothing showed it.
//
//     node tools/check-heading-gutter.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8");

/** The rules that build the column, by a selector fragment each one carries. */
const GUTTER = [
  'HyperMD-header-"]::before',
  'HyperMD-header-"] .cm-fold-indicator .collapse-indicator'
];

/** A length is body-relative when it is a var(), a px, or a plain multiplier. */
const BAD_UNIT = /(^|[\s(*+\-/,])(\d*\.?\d+)(em|rem|ch|ex|lh)\b/g;

const problems = [];
for (const fragment of GUTTER) {
  let found = 0;
  for (let at = css.indexOf(fragment); at !== -1; at = css.indexOf(fragment, at + 1)) {
    const open = css.indexOf("{", at);
    const close = css.indexOf("}", open);
    if (open < 0 || close < 0) continue;
    // Only the rule this selector OPENS, never a comment mentioning it.
    if (css.slice(at, open).includes("*/")) continue;
    found += 1;
    const body = css.slice(open + 1, close);
    for (const m of body.matchAll(BAD_UNIT)) {
      problems.push(`${fragment}\n      ${m[2]}${m[3]} — heading-relative; use a body unit`);
    }
  }
  if (found === 0) {
    problems.push(`${fragment}\n      no rule with this selector any more; update this guard`);
  }
}

if (problems.length) {
  console.error("check-heading-gutter: a length in the gutter is not body-relative.\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    "\nThe column must be one width at every heading level. Reach for\n" +
      "--klartext-font-size, --klartext-cell or --klartext-marker-width."
  );
  process.exit(1);
}
console.log("check-heading-gutter: every length in the gutter is body-relative.");
