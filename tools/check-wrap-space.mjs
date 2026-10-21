#!/usr/bin/env node
// A wrapped Live Preview line never starts with a space.
//
// CodeMirror wraps with `white-space: break-spaces`, and Obsidian's Chromium
// then moves a space that does not fit onto the next line. The body is
// monospace, so every word ending on the right edge pushed its space down and
// the next line began one cell in — measured in Obsidian 1.14.4 on a quote:
// "…workflow on the Mac" filled 53 of 53.6 cells, and its third line read
// " by following". The theme sets `pre-wrap` on the wrapping content, which
// hangs that space at the end of the line it follows.
//
// This guard fails unless an editor rule ending on `.cm-lineWrapping` sets
// `white-space: pre-wrap`.
//
//     node tools/check-wrap-space.mjs
// tools/guards.mjs runs it with every other guard.
import { declarations, readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const found = rules(readStylesheet()).some(
  ({ arms, body }) =>
    arms.some((a) => a.includes(".markdown-source-view") && /\.cm-lineWrapping$/.test(a)) &&
    declarations(body).some(({ prop, value }) => prop === "white-space" && value === "pre-wrap"),
);

report(
  "a wrapped line can start with a space",
  found ? [] : ["no editor rule sets `white-space: pre-wrap` on .cm-lineWrapping; CodeMirror's break-spaces moves an edge space onto the next line"],
  "wrap space: a wrapped line keeps its space at the end, never at the start of the next.",
);
