// The chrome switches stay opt-in, and each one still has a rule.
//
// Eleven Style Settings toggles hide parts of Obsidian's furniture — the tab
// strip, the status bar, the vault profile, scroll bars, the sidebar buttons,
// tooltips, the file explorer's button row, properties in Reading view, the
// search options panel, the search match counts, and a prompt's keyboard
// hints. They exist so a vault that wants a quiet window does not need a
// plugin for it.
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
// Two more conditions sit on top of those, both about the window's top row on
// macOS, and both about SCOPE — each one has already been got wrong once by
// selecting too widely:
//
//   * THE INSET. Hiding the strip moves the note header into the top row, and
//     Obsidian reserves the room for the window buttons on the TAB CONTAINER,
//     so hiding the container takes the reservation with it. The header needs
//     it back — but only the ONE header the buttons actually overlap, which
//     Obsidian marks `mod-top-left-space`. Scoping by `.mod-root` instead
//     insets every pane's header, sidebar open or not.
//   * THE DROP. `klartext-align-window-buttons` lowers the top row onto the
//     buttons' axis. Only rows that ARE the top row: a stacked split's lower
//     pane has a strip too, hundreds of pixels down the window, and Obsidian
//     marks the real ones `mod-top`.
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
  [...bare.matchAll(/\.(klartext-hide-[a-z-]+)/g)].map((m) => m[1])
);

const failures = [];

// The view header's own toggle predates these and is deliberately on by
// default, so it is not one of the switches this guard governs.
const GOVERNED = declared.filter((s) => s.id !== "klartext-hide-view-header");

const EXPECTED = 11;
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

// --- the inset: only the header the window buttons overlap ---
const insetRule = bare
  .split("}")
  .find((b) => b.includes("klartext-hide-tab-bar") && b.includes("padding-left"));

if (insetRule === undefined) {
  failures.push("hiding the tab strip must also inset the note header on macOS, or its back button sits under the window buttons");
} else {
  const selector = insetRule.slice(0, insetRule.indexOf("{"));
  if (!selector.includes(".mod-macos")) {
    failures.push("the header inset must be macOS-only: no other platform puts window buttons on the left");
  }
  if (!selector.includes(".mod-top-left-space")) {
    failures.push("the inset must be scoped to .workspace-tabs.mod-top-left-space — Obsidian's own marker for the strip the window buttons overlap. Without it every pane's header is inset, sidebar open or not");
  }
  if (!/padding-left:\s*calc\(var\(--size-4-2\)\s*\+\s*var\(--frame-left-space\)\)/.test(insetRule)) {
    failures.push("the inset must reuse Obsidian's own reservation, calc(--size-4-2 + --frame-left-space), which already accounts for the ribbon");
  }
}

// --- the drop: the top row onto the window buttons' axis ---
const ALIGN = "klartext-align-window-buttons";
const alignDecl = /- id: klartext-align-window-buttons\b([\s\S]*?)(?=\n {2}- id: |$)/.exec(settings)?.[1];

if (alignDecl === undefined) {
  failures.push(`${ALIGN} must be offered in @settings — the drop is a choice, not something to impose`);
} else {
  if (!/type:\s*class-toggle/.test(alignDecl)) {
    failures.push(`${ALIGN} must be a class-toggle: the rules key on the body class it adds`);
  }
  if (!/default:\s*false/.test(alignDecl)) {
    failures.push(`${ALIGN} must default to false — it moves a row for everyone who has the theme, most of them not on macOS`);
  }
  if (!/description:/.test(alignDecl)) {
    failures.push(`${ALIGN} needs a description saying it is macOS-only`);
  }
}

const dropRule = bare
  .split("}")
  .find((b) => b.includes(ALIGN) && b.includes("padding-top"));

if (dropRule === undefined) {
  failures.push(`${ALIGN} is offered but no rule drops anything, so the switch does nothing`);
} else {
  // Every selector in the list, not the list as one string: a comma list where
  // only one arm is scoped reads as scoped, and the unscoped arm is the bug.
  const selectors = dropRule
    .slice(0, dropRule.indexOf("{"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const selector of selectors) {
    if (!selector.includes(".mod-macos")) {
      failures.push(`the drop must be macOS-only, and \`${selector}\` is not: no other platform puts window buttons on the left`);
    }
    if (!selector.includes(".workspace-tabs.mod-top")) {
      failures.push(`the drop must select through .workspace-tabs.mod-top — Obsidian's marker for a strip on the window's top row — and \`${selector}\` does not. A bare .workspace-tab-header-container also matches a stacked split's lower pane, hundreds of pixels down the window`);
    }
  }
  if (!/padding-top:\s*calc\(var\(--klartext-titlebar-drop\)\s*\*\s*2\)/.test(dropRule)) {
    failures.push("the padding must be twice --klartext-titlebar-drop: the contents are centred, so the centre moves half of what is added");
  }
  if (!/box-sizing:\s*border-box/.test(dropRule)) {
    failures.push("box-sizing must stay border-box, or the padding grows the row and pushes the note down");
  }
}

const dropDef = bare.split("}").find((b) => b.includes("--klartext-titlebar-drop:"));
if (dropDef === undefined) {
  failures.push("--klartext-titlebar-drop must be defined, not inlined at each use");
} else {
  if (!dropDef.includes("var(--header-height)")) {
    failures.push("the drop must be derived from --header-height, not typed as a pixel count: it is the distance from the row's own centre to the buttons' axis, and the row can be resized");
  }
  if (!/max\(\s*0px/.test(dropDef)) {
    failures.push("the drop must be clamped with max(0px, …), or a header taller than the axis lifts the row above the buttons instead of onto them");
  }
}

// --- two more scopes, each one a class Obsidian reuses elsewhere ---

// `.suggestion-container` is also the quick switcher's result list and the
// editor's [[link]] and tag autocomplete. Unscoped, this switch stops typing
// working rather than quietening anything.
const suggestRule = bare.split("}").find((b) => b.includes("klartext-hide-search-suggestions"));
if (suggestRule === undefined) {
  failures.push("klartext-hide-search-suggestions has no rule");
} else if (!suggestRule.includes(".mod-search-suggestion")) {
  failures.push("the search suggestions rule must name .mod-search-suggestion — a bare .suggestion-container is also the quick switcher's results and the editor's autocomplete");
}

// `.tree-item-flair` is a general badge, and the tag pane uses it for each
// tag's count. Measured: three in the tag pane against three in the results.
const countRule = bare.split("}").find((b) => b.includes("klartext-hide-search-counts"));
if (countRule === undefined) {
  failures.push("klartext-hide-search-counts has no rule");
} else if (!countRule.includes(".search-result-file-title")) {
  failures.push("the search count rule must be scoped to .search-result-file-title — .tree-item-flair is also the tag pane's per-tag count, and this switch never mentions tags");
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
console.log(`chrome switches: ${GOVERNED.length} hiding toggles plus the window-button drop, all opt-in, all acted on.`);
