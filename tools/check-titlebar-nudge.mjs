// Aligning the note header with the macOS window buttons stays OPT-IN.
//
// macOS places the red/amber/green buttons and no stylesheet can move them,
// so the only lever is Obsidian's own row. But that row only sits beside them
// when something has hidden the tab bar above it — the Hider plugin, a
// snippet. With the tab bar visible, which is Obsidian's default, the header
// is a SECOND row with no buttons next to it, and the same nudge would drop it
// four pixels for nothing.
//
// CSS cannot ask whether another element is being hidden, so the person says,
// through Style Settings, and the answer defaults to no. Three things keep
// that true and each is checked here: the setting exists and defaults to
// false, the rule names both that class and mod-macos, and the padding stays
// twice the nudge — the row's contents are centred in a fixed-height box, so
// half of what is added above is what the centre moves.
//
// Static, so it runs without Obsidian:
//     node tools/check-titlebar-nudge.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");

const TOGGLE = "klartext-titlebar-nudge";
const failures = [];

// --- the Style Settings entry, read out of the @settings comment block ---
const settings = /\/\* @settings([\s\S]*?)\*\//.exec(css)?.[1] ?? "";
const entry = new RegExp(`- id: ${TOGGLE}\\b([\\s\\S]*?)(?=\\n  - id: |$)`).exec(settings)?.[1];
if (entry === undefined) {
  failures.push(`${TOGGLE} is not offered in the @settings block, so nobody can turn it on`);
} else {
  if (!/type:\s*class-toggle/.test(entry)) {
    failures.push(`${TOGGLE} must be a class-toggle: the rule keys on the body class it adds`);
  }
  if (!/default:\s*false/.test(entry)) {
    failures.push(`${TOGGLE} must default to false — with a visible tab bar the nudge is wrong, and that is Obsidian's default`);
  }
}

// --- the rule itself, comments stripped so prose cannot satisfy a check ---
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const block = bare
  .split("}")
  .find((b) => b.includes(TOGGLE) && b.includes("padding-top"));

if (block === undefined) {
  failures.push("the nudge rule is missing from the stylesheet");
} else {
  const selector = block.slice(0, block.indexOf("{"));
  if (!selector.includes(`body.${TOGGLE}`)) {
    failures.push("the rule must name the toggle's own body class, or it applies to everyone");
  }
  if (!selector.includes(".mod-macos")) {
    failures.push("the rule must name .mod-macos: no other platform has these buttons");
  }
  if (!/padding-top:\s*calc\(var\(--klartext-titlebar-nudge\)\s*\*\s*2\)/.test(block)) {
    failures.push("the padding must be twice --klartext-titlebar-nudge: the contents are centred, so the centre moves half of what is added");
  }
  if (!/box-sizing:\s*border-box/.test(block)) {
    failures.push("box-sizing must stay border-box, or the padding grows the row and pushes the note down");
  }
  const amount = /--klartext-titlebar-nudge:\s*(\d+(?:\.\d+)?)px/.exec(block);
  if (amount === null) {
    failures.push("--klartext-titlebar-nudge must be a px literal, so the measured value is visible in the rule");
  } else if (Number(amount[1]) <= 0 || Number(amount[1]) > 12) {
    failures.push(`--klartext-titlebar-nudge is ${amount[1]}px, which is not a plausible offset for a title bar row`);
  }
}

if (failures.length > 0) {
  console.error(`${FILE}: the macOS title-bar nudge is not the opt-in it claims to be`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("title-bar nudge: opt-in, macOS only, padding twice the nudge.");
