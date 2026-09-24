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
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/** Every rule as [selectorArms, body]. Flat enough for this stylesheet's selection rules. */
const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [
  m[1].split(",").map((s) => s.trim()).filter(Boolean),
  m[2],
]);

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

if (problems.length > 0) {
  console.error("src/theme.css: a hidden mark reappears under selection");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check-hidden-marks: ${HIDDEN.length} hidden marks stay hidden under selection.`);
