// Image alignment (`![Map | center | 750](map.png)`) is matched on the alt
// text, and the alt text is spelled differently in each mode: Reading view
// keeps "Map | center", Live Preview keeps the space before the width,
// "Map | center ", and a wikilink embed leaves the word alone, "center". Each
// word needs all six spellings in every rule that names it, or one mode, or one
// way of writing it, silently stops aligning.
//
// And Live Preview must never turn the embed into a block. CodeMirror puts a
// cursor buffer on each side of the widget; a block pushes both onto lines of
// their own, which made an aligned image 45px taller than the same image
// unaligned, measured in Obsidian. Widening Obsidian's inline-flex does the job.
//
// Static, so it runs without Obsidian:
//     node tools/check-image-align.mjs
import { readStylesheet } from "./lib/stylesheet.mjs";

const FILE = "src/theme.css";
const bare = readStylesheet();
const WORDS = ["left", "center", "right"];
const spellings = (w) => [
  `[alt="${w}" i]`,
  `[alt="${w} " i]`,
  `[alt$="|${w}" i]`,
  `[alt$="| ${w}" i]`,
  `[alt$="|${w} " i]`,
  `[alt$="| ${w} " i]`,
];

const failures = [];
const rules = [];
for (const block of bare.split("}")) {
  const brace = block.indexOf("{");
  if (brace === -1) continue;
  const selector = block.slice(0, brace).replace(/\s+/g, " ").trim();
  if (!/\.image-embed:is\(/.test(selector) || !/\[alt/.test(selector)) continue;
  rules.push({ selector, body: block.slice(brace + 1) });
}

if (rules.length === 0) failures.push("no image-alignment rule found");

for (const { selector, body } of rules) {
  for (const word of WORDS) {
    if (!selector.includes(`"${word}`) && !selector.includes(` ${word}"`) && !selector.includes(`|${word}"`)) continue;
    for (const s of spellings(word)) {
      if (!selector.includes(s)) failures.push(`${selector.slice(0, 60)}…  is missing ${s}`);
    }
  }
  if (/\.cm-content|mod-cm6/.test(selector) && !/markdown-rendered/.test(selector) && /(^|[;\s])display\s*:/.test(body)) {
    failures.push(`${selector.slice(0, 60)}…  sets display in Live Preview`);
  }
}

const covered = (word, prop) =>
  rules.some((r) => r.selector.includes(`[alt="${word}" i]`) && new RegExp(`justify-content\\s*:\\s*${prop}`).test(r.body));
if (!covered("center", "center")) failures.push("no rule centres [alt=\"center\"]");
if (!covered("right", "flex-end")) failures.push("no rule right-aligns [alt=\"right\"]");

if (failures.length) {
  console.error(`${FILE}: image alignment is incomplete.`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
