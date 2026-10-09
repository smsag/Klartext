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
// what the stylesheet "used to" do, or if it names a note that does not exist.
//
// Static, so it runs without Obsidian:
//     node tools/check-comments.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { existsSync, readFileSync } from "node:fs";

const FILE = "src/theme.css";
const MAX_LINES = 6;
const root = new URL("../", import.meta.url);
const css = readFileSync(new URL(FILE, root), "utf8");

// A banner's ruled line: "/* -----", "----- */" or a bare run of = or -.
const RULED = /^\s*(\/\*)?\s*([-=])\2{9,}\s*(\*\/)?\s*$/;

const failures = [];
for (const m of css.matchAll(/\/\*[\s\S]*?\*\//g)) {
  const text = m[0];
  if (text.startsWith("/* @settings")) continue;
  const line = css.slice(0, m.index).split("\n").length;
  const lines = text.split("\n").filter((l) => !RULED.test(l)).length;
  if (lines > MAX_LINES)
    failures.push(`line ${line}: comment runs to ${lines} lines (at most ${MAX_LINES}); move the detail to docs/notes/`);
  if (/\bused to\b/i.test(text))
    failures.push(`line ${line}: comment tells what the stylesheet used to do; that belongs in the commit message`);
  for (const [, note] of text.matchAll(/(docs\/notes\/[\w-]+\.md)/g))
    if (!existsSync(new URL(note, root))) failures.push(`line ${line}: names ${note}, which does not exist`);
}

if (failures.length > 0) {
  console.error(`${FILE}: comments\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`${FILE}: every comment is within ${MAX_LINES} lines and names only notes that exist.`);
