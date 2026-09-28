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

export function readStylesheet(file = new URL("../../src/theme.css", import.meta.url)) {
  return flatten(readFileSync(file, "utf8"));
}
