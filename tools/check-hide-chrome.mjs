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
// And one check per defect a review found by running the switches, each of
// them invisible in a diff: the window-button rules must carry Obsidian's own
// frame condition; the header must take over the strip's drag region; the
// sidebar toggles must move with the row; scroll bars must be hidden through
// the standard property Chromium honours, never ::-webkit-scrollbar; tooltips
// must spare the error tooltip; the counts must name the search pane; the
// vault profile must be hidden through Obsidian's token.
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
} else {
  if (!countRule.includes(".search-result-file-title")) {
    failures.push("the search count rule must be scoped to .search-result-file-title — .tree-item-flair is also the tag pane's per-tag count, and this switch never mentions tags");
  }
  if (!countRule.includes('[data-type="search"]')) {
    failures.push("the search count rule must name the search pane, [data-type=\"search\"] — the backlinks pane draws its rows with the same .search-result-file-title markup, and its counts vanished under the unscoped rule");
  }
}

// --- what the review found: each check fails without its fix ---

/** Every rule block whose selector names `.cls`, as [selectorArms, body]. */
const keyedOn = (cls) =>
  bare
    .split("}")
    .filter((b) => b.includes("{") && b.slice(0, b.indexOf("{")).includes(`.${cls}`))
    .map((b) => [
      b.slice(0, b.indexOf("{")).split(",").map((x) => x.trim()).filter(Boolean),
      b.slice(b.indexOf("{") + 1),
    ]);

// The window-button rules apply only where Obsidian's own reservation does:
// `.is-hidden-frameless:not(.is-fullscreen)`. With a titlebar above the
// workspace, or in fullscreen, there are no buttons in the row; the inset and
// the drop applied there anyway (measured in all four frame states).
const frameRules = [
  ...keyedOn(ALIGN),
  ...keyedOn("klartext-hide-tab-bar").filter(([, body]) => /padding-left|app-region/.test(body)),
];
for (const [arms] of frameRules) {
  for (const arm of arms) {
    if (!arm.includes(".is-hidden-frameless") || !arm.includes(":not(.is-fullscreen)")) {
      failures.push(`\`${arm}\` must carry Obsidian's own condition, .is-hidden-frameless:not(.is-fullscreen): with the native or Obsidian frame, or in fullscreen, there are no window buttons in the top row`);
    }
  }
}

// The strip was the window's drag handle; hidden, 0 of 52 points along the
// top edge could move the window. The header takes the job, off while a tab
// is dragged, and its title and breadcrumb stay clickable.
const dragRule = keyedOn("klartext-hide-tab-bar").find(([, body]) => /-webkit-app-region:\s*drag/.test(body));
if (dragRule === undefined) {
  failures.push("hiding the tab strip must make the note header the window's drag region — the strip was the only one, and a hidden strip left none");
} else {
  for (const arm of dragRule[0]) {
    if (!arm.includes(".view-header")) failures.push(`the drag region must be the note header, and \`${arm}\` is not`);
    if (!arm.includes(":not(.is-grabbing)")) failures.push(`\`${arm}\` must be off while a tab is dragged (:not(.is-grabbing)), as Obsidian's own strip is, or the region swallows the drop`);
  }
}
const noDrag = keyedOn("klartext-hide-tab-bar").find(([arms, body]) =>
  /-webkit-app-region:\s*no-drag/.test(body) && arms.some((a) => a.includes(".view-header-title-container")));
if (noDrag === undefined) {
  failures.push("the header's title and breadcrumb must be -webkit-app-region: no-drag — Obsidian never exempted them, because no drag region sat under them before, and a click on either opens something");
}

// The two sidebar toggles are pinned to the window's top edge (absolute in the
// ribbon, fixed in the root strip), so no strip padding reaches them; they
// stayed at 20 while the row went to 23-24.
const toggleRule = keyedOn(ALIGN).find(([arms]) => arms.some((a) => a.includes(".sidebar-toggle-button")));
if (toggleRule === undefined || !/translate:\s*0\s+var\(--klartext-titlebar-drop\)/.test(toggleRule[1])) {
  failures.push("the sidebar toggles must move with the drop (translate: 0 var(--klartext-titlebar-drop)) — Obsidian pins them to the window's top edge, so the strips' padding leaves them 3.5px above their own row");
}

// Chromium ignores ::-webkit-scrollbar on any element with a standard
// scrollbar-width or scrollbar-color, and Obsidian sets both — on macOS, where
// it never adds `styled-scrollbars`, the pseudo-element rule computed
// `display: none` and left a 15px scroll bar on screen.
const scrollRules = keyedOn("klartext-hide-scrollbars");
if (!scrollRules.some(([, body]) => /--scrollbar-native-width:\s*none/.test(body))) {
  failures.push("hiding scroll bars must set Obsidian's --scrollbar-native-width: none; its * { scrollbar-width } rule is what Chromium honours");
}
if (scrollRules.some(([arms]) => arms.some((a) => a.includes("::-webkit-scrollbar")))) {
  failures.push("hiding scroll bars must not go through ::-webkit-scrollbar: Chromium ignores it wherever a standard scrollbar property is set, which on macOS is every element — it computes none and paints a bar");
}

// Obsidian draws its validation errors in the tooltip element too.
const tipRule = keyedOn("klartext-hide-tooltips")[0];
if (tipRule === undefined || !tipRule[0].every((a) => a.includes(":not(.mod-error)"))) {
  failures.push("hiding tooltips must spare .tooltip.mod-error — it is how Obsidian says a rename, a property or a tag was refused; hidden, the refusal is silent");
}

// The vault profile sets its display from a token at (0,4,1); a class rule loses.
if (!keyedOn("klartext-hide-vault-name").some(([, body]) => /--vault-profile-display:\s*none/.test(body))) {
  failures.push("hiding the vault name must set Obsidian's --vault-profile-display: none — its own rule sets display from it at (0,4,1), which a class rule loses to");
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
