#!/usr/bin/env node
// Every theme task marker is drawn whole: reset, boxed and given its glyph.
//
// The Minimal markers (`[>]`, `[?]`, `[!]`, …) are spelled out in several
// lists: the item rule that resets the done tokens, the box and its ::after
// in each mode, and one token rule per marker that sets its glyph and colour.
// A selector cannot name "every marker that has a glyph", so the lists have
// to be kept in step by hand, and a marker missing from one of them is drawn
// half: struck through as done, or a bare box with no glyph, in one mode only.
//
// This guard fails unless every `[data-task]` list under
// body.klartext-task-markers names exactly the markers that have a token rule.
//
//     node tools/check-task-markers.mjs
// tools/guards.mjs runs it with every other guard.
import { readStylesheet, report, rules } from "./lib/stylesheet.mjs";

const SCOPE = "body.klartext-task-markers";
const scoped = rules(readStylesheet()).filter((r) => r.arms.length && r.arms.every((a) => a.startsWith(SCOPE)));

const markers = (text) => [...text.matchAll(/\[data-task="((?:\\.|[^"\\])+)"\]/g)].map((m) => m[1]);
const named = (set) => [...set].map((c) => `[${c}]`).join(" ");

// One token rule per marker: a single [data-task="x"] and the glyph token.
const glyphs = new Set();
for (const { arms, body } of scoped) {
  if (!/--klartext-task-glyph\s*:/.test(body)) continue;
  for (const a of arms) for (const c of markers(a)) glyphs.add(c);
}

const failures = [];
if (glyphs.size === 0) failures.push(`no rule under ${SCOPE} sets --klartext-task-glyph; update this guard`);

let lists = 0;
for (const { arms, body, line } of scoped) {
  if (/--klartext-task-glyph\s*:/.test(body)) continue;
  for (const a of arms) {
    for (const m of a.matchAll(/:is\((\[data-task=[^)]*)\)/g)) {
      lists++;
      const listed = new Set(markers(m[1]));
      const missing = new Set([...glyphs].filter((c) => !listed.has(c)));
      const extra = new Set([...listed].filter((c) => !glyphs.has(c)));
      if (missing.size) failures.push(`line ${line}: the list lacks ${named(missing)}, which has a glyph`);
      if (extra.size) failures.push(`line ${line}: the list names ${named(extra)}, which has no glyph rule`);
    }
  }
}
if (lists === 0) failures.push(`no [data-task] list under ${SCOPE}; update this guard`);

report(
  "a theme task marker is drawn only in part",
  failures,
  `task markers: ${glyphs.size} markers, each in all ${lists} lists and with its own glyph.`,
);
