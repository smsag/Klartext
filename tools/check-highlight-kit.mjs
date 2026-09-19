// The theme and the kit draw the same stroke.
//
// `kit/highlight.css` is what the plugins copy; the HIGHLIGHT / MARK rule in
// `src/theme.css` is what this theme paints. Klartext is the baseline, so the
// two must carry the same geometry — if the theme's pen is tuned and the kit
// is not, the family quietly stops matching and nobody finds out until the
// next screenshot.
//
// Only the SHAPE is compared. The theme's opaque inks, its mix-blend-mode and
// its Live-Preview sibling rules are its own and deliberately absent from the
// kit (see the note at the top of that file).
//
// Static, so it runs without Obsidian:
//     node tools/check-highlight-kit.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const THEME = "src/theme.css";
const KIT = "kit/highlight.css";

const fail = (...msg) => {
  console.error(`${THEME}: ${msg.join("\n  ")}`);
  process.exit(1);
};

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, " ");

/** The declarations of the first rule whose selector matches `want`. */
function ruleOf(file, want) {
  const css = strip(readFileSync(file, "utf8"));
  for (const block of css.split("}")) {
    const brace = block.indexOf("{");
    if (brace === -1) continue;
    const selector = block.slice(0, brace);
    if (!want.test(selector)) continue;
    const decls = new Map();
    for (const decl of block.slice(brace + 1).split(";")) {
      const at = decl.indexOf(":");
      if (at === -1) continue;
      decls.set(
        decl.slice(0, at).trim(),
        decl.slice(at + 1).replace(/!important/, "").replace(/\s+/g, " ").trim(),
      );
    }
    return decls;
  }
  return null;
}

// The theme's base rule, not the sibling rules that override single stops.
const theme = ruleOf(THEME, /(^|,)\s*mark\s*(,|$)/);
const kit = ruleOf(KIT, /\.%%P%%-hl(?![\w-])/);

if (!theme) fail("the HIGHLIGHT / MARK rule is gone, or no longer starts at `mark,`.");
if (!kit) fail(`${KIT} has no .%%P%%-hl rule — the plugins have nothing to copy.`);

// The pen: every number a plugin needs to draw the same stroke.
const SHAPE = [
  "--hl-angle",
  "--hl-land-0",
  "--hl-land-1",
  "--hl-lift-1",
  "--hl-lift-0",
  "--hl-pad-y",
  "--hl-pad-x",
  "padding",
  "margin",
  "border-radius",
  "box-shadow",
  "text-shadow",
  "box-decoration-break",
  "-webkit-box-decoration-break",
];

const drift = [];
for (const prop of SHAPE) {
  const a = theme.get(prop);
  const b = kit.get(prop);
  if (a === undefined && b === undefined) {
    drift.push(`${prop} is set in neither file`);
  } else if (a !== b) {
    drift.push(`${prop}: theme has ${a ?? "(unset)"}, kit has ${b ?? "(unset)"}`);
  }
}
if (drift.length) {
  fail(
    `the theme's stroke and ${KIT} have drifted apart:`,
    ...drift,
    "Klartext is the baseline: change both, or change the kit and re-copy it.",
  );
}

// Things the family decided a highlight never has. Cheap to re-add by accident.
for (const [prop, forbidden, why] of [
  ["border-radius", /^0$|^0px$/, "a marker pen has no corners; a rounded end reads as a chip"],
  ["text-shadow", /^none$/, "a halo competes with the stroke and inverts between themes"],
  ["box-shadow", /^none$/, "a highlight is ink on the page, not an object above it"],
]) {
  for (const [file, decls] of [[THEME, theme], [KIT, kit]]) {
    const v = decls.get(prop);
    if (v !== undefined && !forbidden.test(v)) {
      fail(`${file} sets ${prop}: ${v} on the highlight — ${why}.`);
    }
  }
}

console.log(`${THEME}: the theme's stroke and ${KIT} are the same pen — ok`);
