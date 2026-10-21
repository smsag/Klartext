// The stylesheet as the guards read it: comments blanked, and the wrappers of
// conditional group rules (@media, @supports, @container, @layer) blanked too,
// so the rules inside them read like any other.
//
// The guards split the file on `}` and take what precedes the `{` as a
// selector. Inside an @media block the first rule's "selector" then began with
// the @media prelude, and no guard ever looked at it: a hover rule appended as
// `@media screen { button:hover { … !important } }` passed the very guard
// written to stop it. Every character keeps its offset, so a position found
// here is a position in src/theme.css.
import { readFileSync } from "node:fs";

/** The path every guard names in its messages, relative to the repository. */
export const FILE = "src/theme.css";

const WRAPPERS = /^@(media|supports|container|layer|document)\b/;

export function flatten(css) {
  const out = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).split("");
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

/** Every rule of a flattened stylesheet, with the line its selector starts on.
 *
 *  `line` is the selector's own line, not the line after the previous `}`:
 *  counting from there put every reported position on the blank line or the
 *  comment above the rule. */
export function rules(bare) {
  const found = [];
  let line = 1;
  for (const block of bare.split("}")) {
    const brace = block.indexOf("{");
    if (brace !== -1) {
      const selector = block.slice(0, brace);
      const lead = selector.length - selector.trimStart().length;
      found.push({
        selector: selector.trim().replace(/\s+/g, " "),
        arms: selector.split(",").map((a) => a.trim().replace(/\s+/g, " ")).filter(Boolean),
        body: block.slice(brace + 1),
        line: line + lineAt(selector, lead) - 1,
      });
    }
    line += lineAt(block, block.length) - 1;
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
