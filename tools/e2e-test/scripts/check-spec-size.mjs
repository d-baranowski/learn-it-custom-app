#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import { globSync } from 'node:fs';

const MAX_TESTS_PER_SPEC = 5;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPECS_ROOT = resolve(SCRIPT_DIR, '..', 'cypress', 'e2e');

const specs = globSync('**/*.cy.ts', { cwd: SPECS_ROOT });

const offenders = [];

for (const rel of specs) {
  const abs = resolve(SPECS_ROOT, rel);
  const src = readFileSync(abs, 'utf8');

  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const noLine = noBlock.replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  const matches = noLine.match(/(?<![A-Za-z0-9_$])it(?:\.only|\.skip)?\s*\(/g) || [];
  if (matches.length > MAX_TESTS_PER_SPEC) {
    offenders.push({ rel, count: matches.length });
  }
}

if (offenders.length > 0) {
  console.error(
    `\n✖ ${offenders.length} cypress spec(s) exceed the limit of ${MAX_TESTS_PER_SPEC} it() per file:\n`
  );
  for (const { rel, count } of offenders) {
    console.error(`  ${relative(process.cwd(), resolve(SPECS_ROOT, rel))}: ${count} it()`);
  }
  console.error(
    `\nSplit large specs into smaller files. Small specs are duration-balanced across shards`
  );
  console.error(`by cypress-split — one fat spec becomes a critical-path "rock" that no amount of`);
  console.error(`shard-count bumping can parallelize away.\n`);
  process.exit(1);
}

console.log(`✓ All ${specs.length} cypress specs have ≤ ${MAX_TESTS_PER_SPEC} it() blocks.`);
