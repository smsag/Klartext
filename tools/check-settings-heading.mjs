#!/usr/bin/env node
// A settings heading starts where the names of its rows start.
//
// Obsidian pads a heading with --size-4-4 (16px) and a row inside a group's
// .setting-items with --setting-items-padding-x (20px). Left alone, every
// grouped settings tab hangs its headings 4px left of the names below them
// (measured in Obsidian 1.13.7: 273px against 277px). The theme restates the
// grouped heading's side padding in the rows' own variable.
//
// What this keeps true, statically:
//   * the rule is there, and its side padding is var(--setting-items-padding-x)
//     and nothing else;
//   * no rule reaching a settings heading moves it sideways by other means:
//     a margin, an indent, a translate, a left/right offset, or a side padding
//     that is not the rows' variable. A counter-indent on every heading is the
//     fix this guard exists to refuse;
//   * no !important on it, and no plugin's own class among the settings rules:
//     the theme aligns Obsidian's settings, not one plugin's.
//
//     node tools/check-settings-heading.mjs
// tools/guards.mjs runs it with every other guard.
import { declarations, readStylesheet, report, rules as parse } from "./lib/stylesheet.mjs";

const ROW_PADDING = "var(--setting-items-padding-x)";

// `value` keeps its !important here: a heading rule that carries one is itself a failure.
const rules = parse(readStylesheet()).map(({ arms, body }) => ({
  arms,
  decls: declarations(body).map((d) => ({ prop: d.prop, value: d.important ? `${d.value} !important` : d.value })),
}));

const failures = [];
const isHeading = (arm) => /\.setting-item-heading\b(?![\w-])(?!\s*\S)/.test(arm) || /\.setting-item-heading(\s*>\s*|\s+)\.setting-item-(info|name)\s*$/.test(arm);

const grouped = rules.filter((r) => r.arms.some((a) => /\.setting-group\b/.test(a) && /\.setting-item-heading\s*$/.test(a)));
if (grouped.length === 0) failures.push("no rule for a grouped settings heading (.setting-group … .setting-item-heading)");
else if (!grouped.some((r) => r.decls.some((d) => d.prop === "padding-inline" && d.value === ROW_PADDING))) {
  failures.push(`the grouped settings heading's side padding is not ${ROW_PADDING}`);
}

const SIDEWAYS = /^(margin(-left|-right|-inline(-start|-end)?)?|text-indent|translate|left|right|inset(-inline(-start|-end)?)?)$/;
for (const r of rules) {
  const arms = r.arms.filter(isHeading);
  if (arms.length === 0) continue;
  for (const { prop, value } of r.decls) {
    if (/!important/.test(value)) failures.push(`${arms[0]} { ${prop}: ${value} } carries !important`);
    if (SIDEWAYS.test(prop)) {
      // The shorthand margin may set top and bottom only when its sides are 0.
      const sides = prop === "margin" ? value.split(/\s+/).filter((_, i, all) => (all.length === 1 ? true : i % 2 === 1)) : [value];
      if (sides.some((v) => !/^(0|0px|auto)$/.test(v))) failures.push(`${arms[0]} { ${prop}: ${value} } moves the heading sideways`);
    }
    if (prop === "transform" && /translate/.test(value)) failures.push(`${arms[0]} { ${prop}: ${value} } moves the heading sideways`);
    if (/^padding(-left|-right|-inline(-start|-end)?)?$/.test(prop) && prop !== "padding" && value !== ROW_PADDING) {
      failures.push(`${arms[0]} { ${prop}: ${value} } pads the heading by something other than the rows' variable`);
    }
  }
}

for (const r of rules) {
  if (!r.arms.some((a) => /\.setting-(item|group|items)\b|\.vertical-tab-content/.test(a))) continue;
  for (const a of r.arms) {
    const plugin = /\.((?!setting-|vertical-tab-|modal|mod-|is-|theme-|klartext-)[a-z0-9]+-[\w-]+)/.exec(a);
    if (plugin && /^(schreibstube|pythia|vizardry|dataview|templater|style-settings)\b/.test(plugin[1])) {
      failures.push(`${a} names a plugin's own class (${plugin[1]})`);
    }
  }
}

report("settings headings are not aligned with their rows", failures, "settings headings: flush with their rows' names, by the rows' own padding variable.");
