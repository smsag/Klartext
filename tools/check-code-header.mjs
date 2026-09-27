#!/usr/bin/env node
// A code block's header is drawn in a note, and only there.
//
// The header (the mark `</>`, the language, the copy control) is generated
// content on the block's <pre>. It used to hang off `.markdown-rendered pre`,
// which is every piece of rendered markdown, including a plugin's own view.
// Pythia draws a header of its own for each code block in an answer, and the
// theme's label landed inside it, in the flow of the code: "py" glued to the
// first line, which read "pydef". A note is `.markdown-preview-view`; a
// plugin's view is not.
//
// And the language is read from the block, not from a list. The badge used to
// be one rule per language, and a language not on the list had no label.
//
// This guard fails if generated content on a <pre> is scoped to anything but
// `.markdown-preview-view`, if a per-language content rule comes back, or if
// the label stops reading the class in the code face with the nine-character
// indent that hides "language-".
//
//     node tools/check-code-header.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/theme.css", import.meta.url), "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  arms: m[1].split(",").map((s) => s.trim()).filter(Boolean),
  body: m[2],
}));

const failures = [];

const onPre = rules.filter((r) => r.arms.some((a) => /\bpre\b[^\s>+~]*::(before|after)/.test(a)));
for (const r of onPre) {
  for (const a of r.arms) {
    if (!a.startsWith(".markdown-preview-view ")) failures.push(`"${a}" draws on a <pre> outside a note`);
  }
}
if (rules.some((r) => r.arms.some((a) => /pre\.language-[\w-]+::(before|after)/.test(a))))
  failures.push("a per-language label rule is back; the label reads the class instead");

const label = rules.find((r) => /content:\s*attr\(class\)/.test(r.body));
if (!label) failures.push("no label reads the language from the block's class");
else {
  const all = rules.filter((r) => r.arms.some((a) => label.arms.includes(a))).map((r) => r.body).join(";");
  if (!/text-indent:\s*-9ch/.test(all)) failures.push('the label does not indent "language-" (nine characters) out of view');
  if (!/overflow:\s*hidden/.test(all)) failures.push("the label does not clip what it indents");
  if (!/font-family:\s*var\(--font-monospace\)/.test(all)) failures.push("the label is not in the code face, where 9ch is exactly nine characters");
  if (!label.arms.every((a) => a.includes(':not([class*=" "])')))
    failures.push("the label is drawn on a <pre> with more than one class, whose class string is not a language");
}

if (failures.length > 0) {
  console.error("src/theme.css: code block header");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("code block header: drawn in notes only, the language read from the block.");
