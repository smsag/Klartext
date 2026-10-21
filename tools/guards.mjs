#!/usr/bin/env node
// Every guard in one run: the shared parser's tests, then each
// tools/check-*.mjs, every failure reported and a count at the end.
//
// CI, the release and the pre-commit hook all call this, so the three run the
// same set the same way; a new guard is picked up by its file name alone.
// Inside GitHub Actions a failure is also written as an annotation on the
// guard's file.
//
//     node tools/guards.mjs
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const annotate = process.env.GITHUB_ACTIONS === "true";

const runs = [
  ["tools/lib/stylesheet.test.mjs", ["--test", "--test-reporter=dot", `${here}lib/stylesheet.test.mjs`]],
  ...readdirSync(here)
    .filter((f) => /^check-.+\.mjs$/.test(f))
    .sort()
    .map((f) => [`tools/${f}`, [`${here}${f}`]]),
];

const failed = [];
for (const [name, args] of runs) {
  const { status, error } = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (status === 0) continue;
  failed.push(name);
  console.error(`✗ ${name}${error ? ` (${error.message})` : ""}`);
  if (annotate) console.log(`::error file=${name}::${name} failed`);
}

console.log(
  failed.length === 0
    ? `guards: all ${runs.length} pass.`
    : `guards: ${failed.length} of ${runs.length} failed: ${failed.join(", ")}`,
);
process.exitCode = failed.length === 0 ? 0 : 1;
