#!/usr/bin/env node
//
// One-shot migration: insert `cy.markMutated();` as the first body statement
// of every `it(...)` block in every cypress spec that declares
// `{ env: { mutating: true } }` at the describe level.
//
// Idempotent: skips blocks where `cy.markMutated()` already exists in the
// first ~20 lines after the it() opener.
//
// Run from repo root:
//   node tools/postgres-seed/migrate-mark-mutated.mjs
//
// After running, audit the diff and remove the marker from any test that
// genuinely doesn't mutate state (likely rare in mutating specs).

import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPECS_ROOT = resolve(SCRIPT_DIR, '..', 'e2e-test', 'cypress', 'e2e');

const specs = globSync('**/*.cy.ts', { cwd: SPECS_ROOT });

let totalFiles = 0;
let totalInsertions = 0;
let skippedAlreadyMarked = 0;

for (const rel of specs) {
  const abs = resolve(SPECS_ROOT, rel);
  const src = readFileSync(abs, 'utf8');

  if (!/\bmutating:\s*true\b/.test(src)) continue;

  const lines = src.split('\n');
  const out = [];
  let insertions = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    out.push(line);

    const m = line.match(/^(\s*)it(?:\.only|\.skip)?\(.*\)\s*=>\s*\{\s*$/);
    if (m) {
      const baseIndent = m[1];
      const bodyIndent = baseIndent + '  ';

      let alreadyMarked = false;
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (/^\s*cy\.markMutated\(\)/.test(lines[j])) {
          alreadyMarked = true;
          break;
        }
        if (/^\s*\}\s*\)\s*;?\s*$/.test(lines[j])) break;
      }

      if (alreadyMarked) {
        skippedAlreadyMarked++;
      } else {
        out.push(`${bodyIndent}cy.markMutated();`);
        insertions++;
      }
    }

    i++;
  }

  if (insertions > 0) {
    writeFileSync(abs, out.join('\n'));
    totalFiles++;
    totalInsertions += insertions;
    console.log(`  ${rel}: +${insertions} cy.markMutated()`);
  }
}

console.log(`\n${totalFiles} files modified, ${totalInsertions} insertions.`);
if (skippedAlreadyMarked > 0) {
  console.log(`${skippedAlreadyMarked} it() blocks already had cy.markMutated() — skipped.`);
}
