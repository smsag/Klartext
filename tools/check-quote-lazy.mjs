#!/usr/bin/env node
// A lazy quote line starts on the quote's text edge, not under its bar.
//
// Markdown counts a line without ">" straight after a quote line as part of
// the quote; Reading view joins it into the quote's paragraph. Live Preview
// marks it .HyperMD-quote-lazy, but Obsidian writes its hanging indent only
// on lines that have a "> " token to measure, so a lazy line got none. Its
// text began on the paragraph edge, and the bar, which this theme stands on
// the marker axis inside that edge, ran through its first letter. It shipped
// that way from the day the marker column was built: the check note had no
// lazy line, and a line after a lone ">" or a footnote under a quote is one.
//
// This guard fails unless each quote level the theme draws a bar for (1–3)
// has a lazy-line rule padding it by exactly that many columns.
//
//     node tools/check-quote-lazy.mjs
import { readStylesheet, report, rules as parse } from "./lib/stylesheet.mjs";

const rules = parse(readStylesheet()).map((r) => [r.arms, r.body]);

const failures = [];
for (const level of [1, 2, 3]) {
  const want = level === 1 ? "var(--klartext-col)" : `calc(${level} * var(--klartext-col))`;
  const found = rules.find(([arms]) => arms.some((a) => a.includes(`.HyperMD-quote-${level}.HyperMD-quote-lazy`) && a.includes(".is-live-preview")));
  if (!found) failures.push(`no Live Preview rule for a lazy line at quote level ${level}`);
  else if (!new RegExp(`padding-inline-start:\\s*${want.replace(/[()*]/g, "\\$&")}\\s*;`).test(found[1]))
    failures.push(`a lazy line at level ${level} is not padded by ${level} column(s) (${want})`);
}

report("lazy quote lines", failures, "quote lazy lines: each level starts on its quote's text edge.");
