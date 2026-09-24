// A font the user picks in Obsidian wins over Klartext's, except in the body.
//
// Obsidian builds --font-interface and --font-monospace from three layers: the
// user's choice under Appearance (Interface font, Monospace font), then the
// theme's --font-*-theme, then its own default. Through 2.0 every rule here read
// the -theme layer directly, so Fira Sans and JetBrains Mono painted whatever
// the user had picked; the setting did nothing and said nothing.
//
// The body text is the one deliberate exception. Every list mark, heading
// gutter and quote bar is laid out on one character cell of the body face
// (--klartext-cell, 0.6em: JetBrains Mono's advance), so the body and the marks
// read --font-text-theme and ignore Appearance → Text font. The README says so.
//
// This guard fails if a rule reads --font-interface-theme or
// --font-monospace-theme again (defining them is fine: that is the theme's
// layer), or if the body stops reading --font-text-theme.
//
// Static, so it runs without Obsidian:
//     node tools/check-fonts.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const lineOf = (i) => bare.slice(0, i).split("\n").length;

const failures = [];

for (const m of bare.matchAll(/var\(\s*--font-(interface|monospace)-theme\s*\)/g)) {
  const combined = `--font-${m[1]}`;
  failures.push(`line ${lineOf(m.index)}: reads ${combined}-theme, which skips the user's own ${m[1]} font — read var(${combined})`);
}

// The body face: the editor and reading view both read it, the marks' stack ends in it.
const reads = (selector, value) =>
  [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(
    ([, sel, body]) => sel.split(",").some((s) => s.trim() === selector) && body.includes(value),
  );
for (const sel of [".cm-content", ".markdown-preview-view"]) {
  if (!reads(sel, "var(--font-text-theme)")) {
    failures.push(`${sel} no longer reads --font-text-theme: the marks are laid out on that face's cell`);
  }
}
if (!/--klartext-mark-font:\s*'Klartext Marks',\s*var\(--font-text-theme\)/.test(bare)) {
  failures.push("--klartext-mark-font no longer falls back to the body face: its digits must sit on the body's cell");
}

if (failures.length > 0) {
  console.error(`${FILE}: fonts`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("fonts: the interface and code fonts follow Obsidian's setting; the body keeps its face.");
