// The stylesheet as the guards read it: comments blanked, and the wrappers of
// conditional group rules (@media, @supports, @container, @layer) blanked too,
// so the rules inside them read like any other.
//
// The guards split the file on `}` and take what precedes the `{` as a
// selector. Inside an @media block the first rule's "selector" then began with
// the @media prelude, and no guard ever looked at it: a hover rule appended as
// `@media screen { button:hover { … !important } }` passed the very guard
// written to stop it. Every character keeps its offset, so a position found
// here is a position in src/theme.css. tools/lib/stylesheet.test.mjs pins it.
import { readFileSync } from "node:fs";

/** The path every guard names in its messages, relative to the repository. */
export const FILE = "src/theme.css";

const WRAPPERS = /^@(media|supports|container|layer|document)\b/;

/** Stands in for a `{`, `}`, `;` or `,` inside a string, so none is read as structure. */
export const HELD = "";

/** Comments blanked, and the structural characters inside string literals
 *  held, with every offset kept. A string is skipped as a whole, so a `/*`
 *  in `content: "/*"` opens no comment and the `{` of a data URI opens no
 *  block, the way fonts/embed.py's tokenizer reads them. */
export function blank(css) {
  const out = css.split("");
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      for (let j = i; j < stop; j++) if (out[j] !== "\n") out[j] = " ";
      i = stop - 1;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      for (; j < css.length && css[j] !== c && css[j] !== "\n"; j++) {
        if (css[j] === "\\") j++;
        else if ("{};,".includes(css[j])) out[j] = HELD;
      }
      i = j;
    }
  }
  return out.join("");
}

export function flatten(css) {
  const out = blank(css).split("");
  const stack = [];
  let preludeStart = 0;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (c === "{") {
      const prelude = out.slice(preludeStart, i).join("").trim();
      const wrapper = WRAPPERS.test(prelude);
      if (wrapper) for (let j = preludeStart; j <= i; j++) if (out[j] !== "\n") out[j] = " ";
      stack.push(wrapper);
      preludeStart = i + 1;
    } else if (c === "}") {
      if (stack.pop() === true) out[i] = " ";
      preludeStart = i + 1;
    } else if (c === ";" && stack.every((w) => w)) {
      preludeStart = i + 1; // a statement at the top level, such as @import
    }
  }
  return out.join("");
}

/** src/theme.css, read from the repository whatever the working directory. */
export function readSource(file = new URL("../../src/theme.css", import.meta.url)) {
  return readFileSync(file, "utf8");
}

export function readStylesheet(file) {
  return flatten(readSource(file));
}

/** Split at the commas of the top level only: `:is(a, b) + c, d` is two arms,
 *  not three, and an argument list of :is(), :not() or :has() stays whole. */
export function splitTop(text, sep = ",") {
  const parts = [""];
  let depth = 0;
  for (const c of text) {
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    if (c === sep && depth === 0) parts.push("");
    else parts[parts.length - 1] += c;
  }
  return parts;
}

const tidy = (s) => s.trim().replace(/\s+/g, " ");

/** Every rule of a flattened stylesheet, with the line its selector starts on.
 *
 *  `line` is the selector's own line, not the line after the previous `}`:
 *  counting from there put every reported position on the blank line or the
 *  comment above the rule. `arms` is the selector list split at its top-level
 *  commas, each arm with its whitespace collapsed. */
export function rules(bare) {
  const found = [];
  let line = 1;
  for (const block of bare.split("}")) {
    const brace = block.indexOf("{");
    if (brace !== -1) {
      const selector = block.slice(0, brace);
      const lead = selector.length - selector.trimStart().length;
      found.push({
        selector: tidy(selector),
        arms: splitTop(selector).map(tidy).filter(Boolean),
        body: block.slice(brace + 1),
        line: line + lineAt(selector, lead) - 1,
      });
    }
    line += lineAt(block, block.length) - 1;
  }
  return found;
}

/** The rules whose selector list is exactly these arms, in any order. */
export function rulesFor(all, ...arms) {
  const want = arms.map(tidy).sort().join("\n");
  return all.filter((r) => [...r.arms].sort().join("\n") === want);
}

/** A rule body's declarations, in order: `{ prop, value, important }`. */
export function declarations(body) {
  const found = [];
  for (const decl of body.split(";")) {
    const colon = decl.indexOf(":");
    if (colon === -1) continue;
    const raw = decl.slice(colon + 1).trim();
    found.push({
      prop: decl.slice(0, colon).trim(),
      value: raw.replace(/\s*!important\s*$/, ""),
      important: /!important\s*$/.test(raw),
    });
  }
  return found;
}

/** The 1-based line of a character offset. */
export function lineAt(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/** Print a guard's failures and exit non-zero; the one shape every guard reports in. */
export function report(title, failures, ok) {
  if (failures.length > 0) {
    console.error(`${FILE}: ${title}`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(ok);
}
