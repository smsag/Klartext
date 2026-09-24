#!/usr/bin/env node
// The release notes for one version: its section of CHANGELOG.md, verbatim.
//
// The release workflow publishes whatever this prints, and fails when it
// fails, so a version can only be released once the CHANGELOG has a
// `## [x.y.z]` section for it with something in it. That is the step that
// turns "Unreleased" into a version, and it stays a deliberate edit.
//
//     node tools/release-notes.mjs 2.1.0            print the notes
//     node tools/release-notes.mjs 2.1.0 notes.md   write them to a file
import { readFileSync, writeFileSync } from "node:fs";

const [version, out] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  console.error(`usage: node tools/release-notes.mjs <x.y.z> [file] — got "${version ?? ""}"`);
  process.exit(1);
}

const lines = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8").split("\n");
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (start === -1) {
  console.error(`CHANGELOG.md has no "## [${version}]" section. Rename "## [Unreleased]" to it first.`);
  process.exit(1);
}
const rest = lines.slice(start + 1);
const end = rest.findIndex((l) => l.startsWith("## ["));
const notes = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
if (notes === "") {
  console.error(`The "## [${version}]" section of CHANGELOG.md is empty.`);
  process.exit(1);
}

if (out) writeFileSync(out, `${notes}\n`);
else console.log(notes);
