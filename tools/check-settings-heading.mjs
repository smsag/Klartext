#!/usr/bin/env node
// A settings heading starts on the cards' outer edge.
//
// Obsidian pads a heading row like a card: --size-4-4 (16px), and in a
// group's tab the rows inside the card by --setting-items-padding-x (20px).
// Every heading hung inside the cards it heads, while a plugin's navigation
// and intro lines start on the cards' edge (measured in Obsidian 1.14.4:
// headings at 48 and 52px, cards at 32px). The theme takes the heading's side
// padding away in every settings tab, so the tab has one left edge.
//
// What this keeps true, statically:
//   * the rule is there, on .vertical-tab-content's headings, and its side
//     padding is 0;
//   * no rule reaching a settings heading moves it sideways by other means:
//     a margin, an indent, a translate, a left/right offset, or a side padding
//     that is not 0. A counter-indent on every heading is the fix this guard
//     exists to refuse;
//   * no !important on it, and no plugin's own class among the settings rules:
//     the theme aligns every settings tab, not one plugin's.
//
//     node tools/check-settings-heading.mjs
// tools/guards.mjs runs it with every other guard.
import { declarations, readStylesheet, report, rules as parse } from "./lib/stylesheet.mjs";

const EDGE = /^(0|0px)$/;

// `value` keeps its !important here: a heading rule that carries one is itself a failure.
const rules = parse(readStylesheet()).map(({ arms, body }) => ({
  arms,
  decls: declarations(body).map((d) => ({ prop: d.prop, value: d.important ? `${d.value} !important` : d.value })),
}));

const failures = [];
const isHeading = (arm) => /\.setting-item-heading\b(?![\w-])(?!\s*\S)/.test(arm) || /\.setting-item-heading(\s*>\s*|\s+)\.setting-item-(info|name)\s*$/.test(arm);

const edge = rules.filter((r) => r.arms.some((a) => /\.vertical-tab-content\b/.test(a) && /\.setting-item-heading\s*$/.test(a)));
if (edge.length === 0) failures.push("no rule for a settings heading (.vertical-tab-content … .setting-item-heading)");
else if (!edge.some((r) => r.decls.some((d) => d.prop === "padding-inline" && EDGE.test(d.value)))) {
  failures.push("the settings heading's side padding is not 0");
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
    if (/^padding(-left|-right|-inline(-start|-end)?)?$/.test(prop) && prop !== "padding" && !EDGE.test(value)) {
      failures.push(`${arms[0]} { ${prop}: ${value} } pads the heading off the cards' edge`);
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

report("settings headings are not on the cards' edge", failures, "settings headings: on the cards' outer edge, in every settings tab.");
