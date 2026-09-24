// The chrome switches stay opt-in, and each one still has a rule.
//
// Eight Style Settings toggles hide parts of Obsidian's furniture — the tab
// strip, the status bar, the vault profile, scroll bars, the sidebar buttons,
// tooltips, the file explorer's button row, and properties in Reading view.
// They exist so a vault that wants a quiet window does not need a plugin for
// it.
//
// Two things must stay true of every one of them, and neither is visible by
// reading a diff:
//
//   * OFF BY DEFAULT. A theme update must never take somebody's furniture
//     away. A toggle that ships `default: true` does exactly that, silently,
//     to everyone who already had the theme.
//   * DECLARED AND USED. A setting with no rule is a switch that does
//     nothing; a rule with no setting is a permanent change wearing a
//     toggle's name. Both halves are checked, in both directions.
//
// The tab strip carries two extra conditions because hiding it moves the note
// header into the window's top row: on macOS that row has to clear the window
// buttons, using Obsidian's own reservation formula, and sit on their axis.
// Obsidian reserves the room on the TAB CONTAINER, so hiding the container
// takes the reservation with it — miss that and the header's back button ends
// up underneath the buttons.
//
// Static, so it runs without Obsidian:
//     node tools/check-hide-chrome.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const settings = /\/\* @settings([\s\S]*?)\*\//.exec(css)?.[1] ?? "";

/** Every hiding toggle the @settings block offers. */
const declared = [...settings.matchAll(/- id: (klartext-hide-[a-z-]+)\b([\s\S]*?)(?=\n {2}- id: |$)/g)]
  .map(([, id, body]) => ({ id, body }));

/** Every hiding toggle the stylesheet actually acts on. */
const used = new Set(
  [...bare.matchAll(/body\.(klartext-hide-[a-z-]+)/g)].map((m) => m[1])
);

const failures = [];

// The view header's own toggle predates these and is deliberately on by
// default, so it is not one of the switches this guard governs.
const GOVERNED = declared.filter((s) => s.id !== "klartext-hide-view-header");

const EXPECTED = 8;
if (GOVERNED.length < EXPECTED) {
  failures.push(`only ${GOVERNED.length} chrome toggles are declared, expected ${EXPECTED}`);
}

for (const { id, body } of GOVERNED) {
  if (!/type:\s*class-toggle/.test(body)) {
    failures.push(`${id} must be a class-toggle: the rules key on the body class it adds`);
  }
  if (!/default:\s*false/.test(body)) {
    failures.push(`${id} must default to false — a theme update must not take somebody's furniture away`);
  }
  if (!/description:/.test(body)) {
    failures.push(`${id} needs a description: several of these hide the only visible way to reach something`);
  }
  if (!used.has(id)) {
    failures.push(`${id} is offered in the settings but no rule acts on it, so the switch does nothing`);
  }
}

const declaredIds = new Set(GOVERNED.map((s) => s.id));
for (const id of used) {
  if (id === "klartext-hide-view-header") continue;
  if (!declaredIds.has(id)) {
    failures.push(`a rule keys on ${id}, which no setting offers — a permanent change wearing a toggle's name`);
  }
}

// --- the tab strip's two extra conditions ---
const tabRule = bare
  .split("}")
  .find((b) => b.includes("klartext-hide-tab-bar") && b.includes("padding-left"));

if (tabRule === undefined) {
  failures.push("hiding the tab strip must also inset the note header on macOS, or its back button sits under the window buttons");
} else {
  const selector = tabRule.slice(0, tabRule.indexOf("{"));
  if (!selector.includes(".mod-macos")) {
    failures.push("the header inset must be macOS-only: no other platform puts window buttons on the left");
  }
  if (!/padding-left:\s*calc\(var\(--size-4-2\)\s*\+\s*var\(--frame-left-space\)\)/.test(tabRule)) {
    failures.push("the inset must reuse Obsidian's own reservation, calc(--size-4-2 + --frame-left-space), which already accounts for the ribbon");
  }
  if (!/padding-top:\s*calc\(var\(--klartext-titlebar-nudge\)\s*\*\s*2\)/.test(tabRule)) {
    failures.push("the padding must be twice --klartext-titlebar-nudge: the contents are centred, so the centre moves half of what is added");
  }
  if (!/box-sizing:\s*border-box/.test(tabRule)) {
    failures.push("box-sizing must stay border-box, or the padding grows the row and pushes the note down");
  }
}

// Only the window's own strip, never a sidebar's — that is a different choice.
const hideTab = bare.split("}").find((b) => /body\.klartext-hide-tab-bar\s+\./.test(b) && b.includes("workspace-tab-header-container"));
if (hideTab === undefined || !hideTab.includes(".mod-root")) {
  failures.push("hiding the tab strip must be scoped to .mod-root: a sidebar's strip is how its panes are switched");
}

if (failures.length > 0) {
  console.error(`${FILE}: the chrome switches are not what they claim to be`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`chrome switches: ${GOVERNED.length} toggles, all opt-in, all acted on.`);
