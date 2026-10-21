#!/usr/bin/env node
// A comment says why the rule below it is what it is, in a few lines.
//
// The convention is in the README: six lines at most, present tense. A
// derivation, a measurement or an Obsidian internal goes in docs/notes/, which
// the comment names; the history of a fix goes in the commit message and
// CHANGELOG.md. Without a check the comments grow back into investigation logs.
//
// This guard fails if a comment runs past six lines (a section banner's ruled
// lines do not count, and the @settings schema is exempt), if a comment tells
// what the stylesheet "used to" do, if it names a note that does not exist, or
// if it points to a section ("see LISTS", "(READING VIEW)") that no banner or
// capitalised heading in the stylesheet carries — a renamed section otherwise
// leaves every pointer to it aimed at nothing.
//
// Static, so it runs without Obsidian:
//     node tools/check-comments.mjs
// tools/guards.mjs runs it with every other guard.
import { existsSync } from "node:fs";
import { lineAt, readSource, report } from "./lib/stylesheet.mjs";

const MAX_LINES = 6;
const root = new URL("../", import.meta.url);
const css = readSource();

// A banner's ruled line: "/* -----", "----- */" or a bare run of = or -.
const RULED = /^\s*(\/\*)?\s*([-=])\2{9,}\s*(\*\/)?\s*$/;

const comments = [...css.matchAll(/\/\*[\s\S]*?\*\//g)].filter((m) => !m[0].startsWith("/* @settings"));

// The names a comment may point to: each banner's title line, each comment
// that opens with a capitalised heading ("LIVE PREVIEW MARKERS — …"), and the
// EMBEDDED FONTS section fonts/embed.py appends to the built theme.css.
const sections = ["EMBEDDED FONTS"];
for (const { 0: text } of comments) {
  const lines = text.split("\n");
  if (RULED.test(lines[0])) {
    const title = lines.slice(1).find((l) => !RULED.test(l));
    if (title) sections.push(title.trim());
  }
  const heading = /^\/\*\s*(?:\d+[a-z]?\)\s*)?([A-Z][A-Z0-9 &/,()<>—-]*[A-Z])\b/.exec(text);
  if (heading) sections.push(heading[1]);
}
const REFERENCE = /\bsee ([A-Z][A-Z&/ ]*[A-Z](?:, [A-Z][A-Z&/ ]*[A-Z])*)\b|\(([A-Z]{4,}(?: [A-Z]+)*)\)/g;

const failures = [];
for (const { 0: text, index } of comments) {
  const line = lineAt(css, index);
  const lines = text.split("\n").filter((l) => !RULED.test(l)).length;
  if (lines > MAX_LINES)
    failures.push(`line ${line}: comment runs to ${lines} lines (at most ${MAX_LINES}); move the detail to docs/notes/`);
  if (/\bused to\b/i.test(text))
    failures.push(`line ${line}: comment tells what the stylesheet used to do; that belongs in the commit message`);
  for (const [, note] of text.matchAll(/(docs\/notes\/[\w-]+\.md)/g))
    if (!existsSync(new URL(note, root))) failures.push(`line ${line}: names ${note}, which does not exist`);
  for (const m of text.matchAll(REFERENCE))
    for (const name of (m[1] ?? m[2]).split(", "))
      if (!sections.some((s) => s.includes(name)))
        failures.push(`line ${line}: points to the section ${name}, which no banner or heading carries`);
}

report(
  "comments",
  failures,
  `comments: within ${MAX_LINES} lines, and every note and section they name exists.`,
);
