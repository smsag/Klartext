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
import { readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const all = rules(readStylesheet());

/** The rules that build the column, by a selector fragment each one carries. */
const GUTTER = [
  ".cm-line.HyperMD-header::before",
  ".cm-line.HyperMD-header .cm-fold-indicator .collapse-indicator",
];

/** A length is body-relative when it is a var(), a px, or a plain multiplier.
 *  A unit straight after the colon counts too: `margin:0.5em` is as wrong as
 *  `margin: 0.5em`. */
const BAD_UNIT = /(^|[\s(*+\-/,:])(\d*\.?\d+)(em|rem|ch|ex|lh)\b/g;

const problems = [];
for (const fragment of GUTTER) {
  const found = all.filter((r) => r.arms.some((a) => a.includes(fragment)));
  if (found.length === 0) problems.push(`no rule carries ${fragment} any more; update this guard`);
  for (const { body, line } of found) {
    for (const m of body.matchAll(BAD_UNIT)) {
      problems.push(`line ${line}: ${m[2]}${m[3]} in ${fragment} is heading-relative; use --klartext-font-size, --klartext-cell or --klartext-marker-width`);
    }
  }
}

// Hide Heading Level Marks takes the badge and the chevron's shift away and
// nothing else: the column stays, or every block edge moves with the switch.
const HIDE = "body.klartext-no-heading-marks";
const hideRules = all.filter((r) => r.selector.includes(HIDE));
if (!hideRules.some((r) => r.selector.includes("HyperMD-header::before") && /content:\s*none/.test(r.body))) {
  problems.push(`${HIDE}: no rule removes the badge`);
}
if (!hideRules.some((r) => r.selector.includes(".collapse-indicator") && /margin-inline-end:\s*0/.test(r.body))) {
  problems.push(`${HIDE}: no rule returns the fold chevron to Obsidian's place`);
}
for (const { body, line } of hideRules) {
  if (/padding|--klartext-heading-prefix/.test(body)) {
    problems.push(`line ${line}: ${HIDE} touches the prefix column; the column must stay so no block edge moves`);
  }
}

report(
  "the heading gutter is not one width at every level",
  problems,
  "heading gutter: every length is body-relative, and hiding the marks keeps the column.",
);
