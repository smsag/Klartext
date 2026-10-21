#!/usr/bin/env node
// A callout's first line of content sits right under its title.
//
// While its source shows, a callout's content is the line after "> [!type]".
// Rendered, Obsidian's `.markdown-rendered p { margin: var(--p-spacing) 0 }`
// gave the first paragraph a 1.2em top margin, so the content fell from the
// second line to the third: measured in Obsidian 1.14.4, a one-line callout
// grew from 38.4px to 52.9px in Live Preview and Reading view alike.
//
// This guard fails unless a rule ending on `.callout-content > :first-child`
// sets `margin-top: 0 !important`.
//
//     node tools/check-callout-first.mjs
// tools/guards.mjs runs it with every other guard.
import { declarations, readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const found = rules(readStylesheet()).some(
  ({ arms, body }) =>
    arms.some((a) => /\.callout-content\s*>\s*:first-child$/.test(a)) &&
    declarations(body).some(({ prop, value, important }) => prop === "margin-top" && /^0(px)?$/.test(value) && important),
);

report(
  "a callout's content can drop below its title",
  found ? [] : ["no rule sets `margin-top: 0 !important` on .callout-content > :first-child; Obsidian's paragraph margin puts a blank line under the title"],
  "callout first line: the content starts right under the title.",
);
