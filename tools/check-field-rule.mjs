// A search field's boundary is a control's boundary, and WCAG 1.4.11 asks 3:1.
//
// The theme's own --border is a hairline BETWEEN SURFACES and is meant to be
// quiet — measured at 1.23 / 1.14 / 1.07 to 1 on the three light grounds and
// 1.28 / 1.17 / 1.06 on the dark ones. A field drawn with it has no edge, and
// in dark it had none in the strictest sense: Obsidian sets
// --background-modifier-form-field to #2e2e2e, which is exactly --border, so
// fill and border were the same colour at 1.00:1.
//
// So --klartext-field-rule exists, and this guard is the reason it can be
// trusted: it reads the palette out of the stylesheet and recomputes the
// contrast rather than pinning the hex someone measured once. Darken a ground,
// lighten the rule, or point the rule at --border again and this fails.
//
// Static, so it runs without Obsidian:
//     node tools/check-field-rule.mjs
// tools/guards.mjs runs it with every other guard.
import { FILE, readStylesheet, report, rules, rulesFor } from "./lib/stylesheet.mjs";

const all = rules(readStylesheet());

/** The declarations of the rules whose selector list is exactly `arms`,
 *  joined; null when there is none. Matched on the whole list, so the light
 *  palette (`body.theme-light, body.theme-dark`) is never read as the dark
 *  one (`body.theme-dark`), however either is wrapped. */
function block(...arms) {
  const found = rulesFor(all, ...arms);
  return found.length ? found.map((r) => r.body).join(";") : null;
}

/** The bodies of every rule whose selector list includes `arm`. */
const including = (arm) => all.filter((r) => r.arms.includes(arm)).map((r) => r.body).join(";");

/** A custom property's value inside a block: the last one stated wins. */
function prop(body, name) {
  const found = [...body.matchAll(new RegExp(`(^|[;\\s])${name}\\s*:\\s*([^;]+);`, "g"))];
  return found.length ? found[found.length - 1][2].trim() : null;
}

function rgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

// The light palette is declared for BOTH body classes (so a dark-mode PDF
// export falls back to it); the dark block restates its own further down.
const LIGHT = ["body.theme-light", "body.theme-dark"];
const DARK = ["body.theme-dark"];

/** Every ground a search field can sit on: a pane, a sidebar, a modal. */
const GROUNDS = ["--background-primary", "--background-secondary", "--background-secondary-alt"];

/** The bar for the boundary of a UI component (WCAG 2.2, 1.4.11). */
const MIN_CONTRAST = 3;

const failures = [];

for (const [theme, selector] of [["light", LIGHT], ["dark", DARK]]) {
  const body = block(...selector);
  if (body === null) {
    failures.push(`the ${theme} palette block is missing from ${FILE}`);
    continue;
  }
  const ruleValue = prop(body, "--klartext-field-rule");
  if (ruleValue === null) {
    failures.push(`${theme}: --klartext-field-rule is not declared`);
    continue;
  }
  const rule = rgb(ruleValue);
  if (rule === null) {
    // A var() here would make the contrast unknowable from this file alone,
    // which is exactly how the rule drifted back onto --border last time.
    failures.push(`${theme}: --klartext-field-rule must be a #rrggbb literal, not "${ruleValue}"`);
    continue;
  }
  for (const name of GROUNDS) {
    const groundValue = prop(body, name);
    const ground = groundValue && rgb(groundValue);
    if (!ground) {
      failures.push(`${theme}: ${name} is not a #rrggbb literal ("${groundValue}"), so the rule cannot be checked against it`);
      continue;
    }
    const ratio = contrast(rule, ground);
    const shown = Math.round(ratio * 100) / 100;
    if (ratio < MIN_CONTRAST) {
      failures.push(`${theme}: --klartext-field-rule ${ruleValue} is ${shown}:1 on ${name} ${groundValue} — under ${MIN_CONTRAST}:1`);
    } else {
      console.log(`  ${theme}: ${ruleValue} on ${name} ${groundValue} — ${shown}:1`);
    }
  }
}

// The field must not go back to being a box with an invisible edge — at any
// size. Obsidian already draws it box-less on a phone; only the desktop had
// the box, and a rule that exempted the phone would be re-adding one there.
const searchField = block(".search-input-container input");
if (searchField === null) {
  failures.push("the search-field rule is missing from src/theme.css");
} else {
  if (!/background-color:\s*transparent/.test(searchField)) {
    failures.push("the search field must have no fill: a pane is already a box");
  }
  if (!/border-bottom:\s*1px solid var\(--klartext-field-rule\)/.test(searchField)) {
    failures.push("the search field must draw its boundary with --klartext-field-rule");
  }
}

for (const [label, selector] of [
  ["the search field", ".search-input-container input:not(:disabled):focus"],
  ["the command palette", ".prompt-input:focus"],
]) {
  const focus = including(selector);
  if (!/border-bottom:[^;]*var\(--interactive-accent\)/.test(focus)) {
    failures.push(`${label} must say focus with the accent on its rule`);
  }
}

// Obsidian states hover and focus for this field at (0,3,1). A rule at (0,2,1)
// matches, computes, and then loses the bottom edge to `border-color` from
// `input[type='search']:not(:disabled):hover` as soon as a pointer crosses it —
// which is how the 3:1 boundary was lost the first time this shipped. The
// `:not(:disabled)` is what carries the third class-level component.
for (const state of ["hover", "focus"]) {
  if (!all.some((r) => r.arms.includes(`.search-input-container input:not(:disabled):${state}`))) {
    failures.push(`:${state} must be stated at Obsidian's own specificity (with :not(:disabled)), or it loses the boundary to app.css`);
  }
}
// A hover rule this cannot find is a failure, not a pass: grouped with another
// selector it is no longer the block this reads, and the check would be skipped.
const hover = block(".search-input-container input:not(:disabled):hover");
if (hover === null) {
  failures.push("hover must be its own rule, `.search-input-container input:not(:disabled):hover { … }`, so this can read it");
} else if (!/border-bottom-color:\s*var\(--klartext-field-rule\)/.test(hover)) {
  failures.push("hover must hold the boundary at --klartext-field-rule");
}

report("the search field's boundary is not what it claims to be", failures, "search field: every boundary clears 3:1, and focus is the accent.");
