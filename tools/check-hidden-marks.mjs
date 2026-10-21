#!/usr/bin/env node
// A mark the theme hides by colour stays hidden when it is selected.
//
// Live Preview keeps some markdown marks in the text but draws them
// transparent at zero width, so they sit on top of the first letter unseen:
// a heading's `#`, a quote's `>`. The theme's `::selection` rule repaints
// every selected character in the text colour, with `!important`, which
// brings those marks back the moment a selection crosses them.
//
// Each hidden mark therefore needs a `::selection` rule of its own restating
// `color: transparent`, and that rule needs `!important` as well. An
// important declaration beats every normal one whatever the specificity, so
// without it the counter-rule matches, computes the text colour, and a
// selection across a heading draws `#` over the first letter. That shipped:
// the rule was there, with a comment saying it out-ranked the bare
// `::selection`, from the day it was written.
//
//     node tools/check-hidden-marks.mjs
import { readStylesheet, report, rules as parse } from "./lib/stylesheet.mjs";

/** Every rule as [selectorArms, body]. */
const rules = parse(readStylesheet()).map((r) => [r.arms, r.body]);

/** The marks the theme hides by colour, by the class each one carries. */
const HIDDEN = [".cm-formatting-header", ".cm-formatting-quote"];

const problems = [];

const selectionColourImportant = rules.some(
  ([arms, body]) => arms.includes("::selection") && /(^|[;\s])color:[^;]*!important/.test(body)
);

for (const mark of HIDDEN) {
  const counter = rules.find(
    ([arms, body]) => arms.some((a) => a.includes(`${mark}::selection`)) && /(^|[;\s])color:\s*transparent/.test(body)
  );
  if (counter === undefined) {
    problems.push(`${mark} is hidden by colour but has no ::selection rule keeping it transparent — a selection brings it back over the text`);
    continue;
  }
  if (selectionColourImportant && !/color:\s*transparent\s*!important/.test(counter[1])) {
    problems.push(`${mark}::selection must say color: transparent !important — the theme's ::selection sets its colour with !important, and an important declaration beats every normal one whatever the specificity`);
  }
}

report("a hidden mark reappears under selection", problems, `check-hidden-marks: ${HIDDEN.length} hidden marks stay hidden under selection.`);
