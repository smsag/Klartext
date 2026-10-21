// The workspace divider is drawn ONCE, on the resize handle.
//
// The theme softens it there (`--border-subtle`, the `:not(:hover)` block in
// src/theme.css). A second border on the split itself paints immediately
// alongside that one, so the seam becomes a two-pixel ramp and reads as a heavy
// rule instead of a hairline — measured in Obsidian as #f0f0ed then #e8e8e6
// against #ffffff. That regression has shipped once; this is the ratchet.
//
// Static, so it runs without Obsidian:
//     node tools/check-dividers.mjs
// tools/guards.mjs runs it with every other guard.
import { declarations, readStylesheet, report, rules } from "./lib/stylesheet.mjs";

// Selectors for the sidebar/editor seam. The handle is exempt: it is the one
// element allowed to paint the line. Both are judged arm by arm, so a handle
// grouped into the same list exempts only itself.
const SEAM = /\.workspace-split\.mod-(left|right)-split(?![\w-])/;
const HANDLE = /workspace-leaf-resize-handle/;
// `border-inline` is the logical shorthand for both side borders at once.
const BORDER = /^border(-(left|right|inline|inline-start|inline-end))?(-(width|style|color))?$/;

const failures = [];
for (const { arms, body, line } of rules(readStylesheet())) {
  const seams = arms.filter((a) => SEAM.test(a) && !HANDLE.test(a));
  if (seams.length === 0) continue;
  for (const { prop, value } of declarations(body)) {
    if (!BORDER.test(prop)) continue;
    // A border explicitly switched off is the point of the rule, not a relapse.
    if (/^(none|0|0px|transparent)$/.test(value)) continue;
    failures.push(`line ${line}: ${seams[0]} { ${prop}: ${value} } — the resize handle already draws this line at --border-subtle; soften or widen it there instead`);
  }
}

report("the sidebar/editor divider is drawn twice", failures, "dividers: drawn once, on the resize handle.");
