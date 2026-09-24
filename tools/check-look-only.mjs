// The theme decides how Klartext looks; which parts of Obsidian are there,
// and when, is the Klartext plugin's.
//
// Klartext 2.0.0 moved thirteen settings out of the theme: the switches that
// hid Obsidian's furniture (tab strip, status bar, vault profile, scroll bars,
// sidebar buttons, tooltips, the file explorer's buttons, Reading-view
// properties, search suggestions and counts, prompt hints), the hidden view
// header, and the macOS window-button alignment. They live in the plugin now
// (https://github.com/smsag/klartext-plugin), next to the top row on hover,
// because several of them needed code a theme cannot run — the window's drag
// handle, the window buttons, a pointer macOS hides from the page — and
// because a switch that hides furniture should survive a change of theme.
//
// One home per setting. This guard keeps the theme from growing a second one:
//
//   * no Style Settings entry and no rule keyed on a `klartext-hide-*` or
//     `klartext-align-*` class — those names are the plugin's;
//   * no window behaviour: no `-webkit-app-region`, no
//     `--traffic-lights-offset-*` — a theme that sets either is placing or
//     dragging the window, which is the plugin's job.
//
// Static, so it runs without Obsidian:
//     node tools/check-look-only.mjs
// The pre-commit hook runs it for any commit touching src/theme.css.
import { readFileSync } from "node:fs";

const FILE = "src/theme.css";
const css = readFileSync(FILE, "utf8");
const settings = /\/\* @settings([\s\S]*?)\*\//.exec(css)?.[1] ?? "";
const bare = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

const failures = [];

for (const [, id] of settings.matchAll(/- id: ([a-z0-9-]+)/g)) {
  if (/^klartext-(hide|align)-/.test(id)) {
    failures.push(`the setting ${id} hides or places Obsidian's furniture — that is the Klartext plugin's, and a setting has one home`);
  }
}
for (const [, cls] of bare.matchAll(/\.(klartext-(?:hide|align)-[a-z-]+)/g)) {
  failures.push(`a rule keys on .${cls}, a class the Klartext plugin owns`);
}
if (/-webkit-app-region\s*:/.test(bare)) {
  failures.push("the theme sets -webkit-app-region: dragging the window is the plugin's job");
}
if (/--traffic-lights-offset-[xy]\s*:/.test(bare)) {
  failures.push("the theme sets --traffic-lights-offset-*: placing the window buttons is the plugin's job");
}

if (failures.length > 0) {
  console.error(`${FILE}: the theme is doing the plugin's job`);
  for (const f of [...new Set(failures)]) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("look only: no furniture switches and no window behaviour in the theme.");
