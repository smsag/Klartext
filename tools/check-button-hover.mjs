// The theme provides a hover for buttons that do not bring their own.
// It does not take one from a button that does.
//
// This theme flattens the resting fill to white, so Obsidian's own hover is a
// five-in-255 step and effectively invisible; the BUTTONS rule replaces it with
// --surface-muted. That rule must reach a plugin's <button> — plugins use them
// for icon-shaped controls with no hover of their own — but it must never
// out-rank a plugin that has styled its own.
//
// Specificity already does the first job: the selector is (0,2,1) against
// Obsidian's (0,1,1). `!important` did the second by accident, and that is the
// bug: measured in Obsidian, one plugin's accent-filled primary button painted
// #f2f2ee under a white label — 1.12:1, an empty grey box.
//
// So: no `!important` on a rule that reaches a bare `button`. `.mod-cta` is
// exempt — that is Obsidian's own dialog chrome, which plugins opt into
// deliberately and which no plugin restyles.
//
// Static, so it runs without Obsidian:
//     node tools/check-button-hover.mjs
// tools/guards.mjs runs it with every other guard.
import { readStylesheet, report, rules, splitTop } from "./lib/stylesheet.mjs";

const bare = readStylesheet();

/** The last compound of a selector: the element it styles. */
function lastCompound(selector) {
  let depth = 0;
  for (let i = selector.length - 1; i >= 0; i--) {
    const c = selector[i];
    if (c === ")" || c === "]") depth++;
    else if (c === "(" || c === "[") depth--;
    else if (depth === 0 && /[\s>+~]/.test(c)) return selector.slice(i + 1);
  }
  return selector;
}

/** Does this selector style a bare `button`? `:has(> button)` and
 *  `:not(button)` are conditions, not the styled element, so they are dropped;
 *  `:is(button, .x)` offers `button` as the element itself, so each of its
 *  alternatives is asked in turn. */
function stylesButton(selector) {
  let flat = selector;
  for (let prev = ""; prev !== flat; ) {
    prev = flat;
    flat = flat.replace(/:(?:has|not)\([^()]*\)/g, "");
  }
  const last = lastCompound(flat.trim());
  if (/^button(?![\w-])/.test(last)) return true;
  return [...last.matchAll(/:(?:is|where|matches)\(/g)].some((m) => {
    let depth = 1, end = m.index + m[0].length;
    for (; end < last.length && depth > 0; end++) depth += last[end] === "(" ? 1 : last[end] === ")" ? -1 : 0;
    return splitTop(last.slice(m.index + m[0].length, end - 1)).some((alt) => stylesButton(alt.trim()));
  });
}

/** Does this compound REQUIRE .mod-cta? `button:not(.mod-cta)` does not. */
function requiresCta(selector) {
  return /\.mod-cta(?![\w-])/.test(lastCompound(selector).replace(/:not\([^)]*\)/g, ""));
}

const failures = [];
for (const { arms, body, line: startLine } of rules(bare)) {
  if (!/!important/.test(body)) continue;

  for (const selector of arms) {
    // The styled element is a bare `button`. `.mod-cta` is Obsidian's own
    // dialog chrome, which plugins opt into deliberately — exempt.
    if (!stylesButton(selector)) continue;
    if (requiresCta(selector)) continue;
    for (const decl of body.split(";")) {
      if (!/!important/.test(decl)) continue;
      const prop = decl.split(":")[0].trim();
      failures.push(`line ${startLine}: ${selector.slice(0, 64)} { ${prop}: … !important } — a plugin cannot out-rank !important at any specificity, so this overrides a button it has styled; the selector's own specificity already beats Obsidian's`);
    }
    break;   // one report per rule is enough
  }
}

report("an !important rule reaches a plugin's <button>", failures, "button hover: no !important reaches a plugin's button.");
