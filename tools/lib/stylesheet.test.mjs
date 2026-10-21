// What the guards' shared parser must read correctly. Every guard trusts
// these answers, so a parser bug is a guard that passes without looking:
// `selector.split(",")` once cut `.x :is(button, .y):hover` into two
// fragments, neither of which check-button-hover recognised as a button.
//
//     node --test tools/lib/stylesheet.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { HELD, blank, declarations, flatten, lineAt, rules, rulesFor, splitTop } from "./stylesheet.mjs";

const parse = (css) => rules(flatten(css));

test("offsets survive: the flattened text is as long as the source, line for line", () => {
  const css = "/* a\n comment */\n@media screen {\n.a { color: red; }\n}\n";
  const bare = flatten(css);
  assert.equal(bare.length, css.length);
  assert.equal(bare.split("\n").length, css.split("\n").length);
});

test("a rule inside @media reads like any other, on its own line", () => {
  const [rule] = parse("\n@media screen {\n  .a, .b { color: red; }\n}\n");
  assert.deepEqual(rule.arms, [".a", ".b"]);
  assert.equal(rule.line, 3);
});

test("arms split at top-level commas only", () => {
  const [rule] = parse(".x :is(button, .y):hover, .z:not(.p, .q) > a { color: red; }");
  assert.deepEqual(rule.arms, [".x :is(button, .y):hover", ".z:not(.p, .q) > a"]);
  assert.deepEqual(splitTop('[alt="a,b"], c'), ['[alt="a,b"]', " c"]);
});

test("a brace, a semicolon or a comment opener inside a string is text", () => {
  const css = '.a::before { content: "{ /* ;"; }\n.b { color: red; }';
  const found = parse(css);
  assert.deepEqual(found.map((r) => r.selector), [".a::before", ".b"]);
  assert.ok(blank(css).includes(HELD));
  assert.match(found[1].body, /color: red/);
});

test("comments are blanked, so a declaration in one is not read", () => {
  const [rule] = parse(".a {\n  /* text-shadow: none; */\n  text-shadow: 0 0 2px red;\n}");
  assert.deepEqual(declarations(rule.body).map((d) => d.value), ["0 0 2px red"]);
});

test("declarations split off !important", () => {
  assert.deepEqual(declarations(" margin: 0 !important; color : red"), [
    { prop: "margin", value: "0", important: true },
    { prop: "color", value: "red", important: false },
  ]);
});

test("rulesFor matches a selector list exactly, in any order and any spacing", () => {
  const all = parse("body.theme-light,\nbody.theme-dark { --x: 1; }\nbody.theme-dark { --x: 2; }");
  assert.equal(rulesFor(all, "body.theme-dark", "body.theme-light").length, 1);
  assert.match(rulesFor(all, "body.theme-dark")[0].body, /--x: 2/);
});

test("lineAt counts from one", () => {
  assert.equal(lineAt("a\nb\nc", 0), 1);
  assert.equal(lineAt("a\nb\nc", 4), 3);
});
