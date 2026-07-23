#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import { parseTests } from './lib/parse-tests.js';
import type { TestEntry } from './lib/types.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPECS_ROOT = resolve(SCRIPT_DIR, '..', 'cypress', 'e2e');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: tsx scripts/list-tests.ts [options]

Options:
  --format <table|json>   Output format (default: table)
  --shard <N/M>           Show only tests assigned to shard N of M (LPT algorithm)
  --tag <tag>             Filter to tests with this tag (e.g. @mutating)
  --no-tag <tag>          Exclude tests with this tag
  --grep <pattern>        Filter test titles by regex
  --spec <pattern>        Filter spec files by substring
  --mutating-only         Shorthand for --tag @mutating
  --readonly-only         Shorthand for --no-tag @mutating
  -h, --help              Show this help`);
  process.exit(0);
}

function getFlag(name: string): string | null {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const format = getFlag('format') || 'table';
const shardArg = getFlag('shard');
const tagFilter = args.includes('--mutating-only') ? '@mutating' : getFlag('tag');
const noTagFilter = args.includes('--readonly-only') ? '@mutating' : getFlag('no-tag');
const grepPattern = getFlag('grep');
const specPattern = getFlag('spec');

let shardIndex = 0;
let shardCount = 0;
if (shardArg) {
  const parts = shardArg.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.error('Error: --shard must be N/M (e.g. 3/32)');
    process.exit(1);
  }
  shardIndex = parseInt(parts[0], 10);
  shardCount = parseInt(parts[1], 10);
  if (
    isNaN(shardIndex) ||
    isNaN(shardCount) ||
    shardIndex < 1 ||
    shardIndex > shardCount ||
    shardCount < 1
  ) {
    console.error('Error: --shard N/M requires 1 <= N <= M');
    process.exit(1);
  }
}


const specs = globSync('**/*.cy.ts', { cwd: SPECS_ROOT }).sort();
const rows: TestEntry[] = [];

for (const rel of specs) {
  if (specPattern && !rel.includes(specPattern)) continue;
  const src = readFileSync(resolve(SPECS_ROOT, rel), 'utf8');
  for (const test of parseTests(src)) {
    if (grepPattern && !new RegExp(grepPattern, 'i').test(test.title)) continue;
    if (tagFilter && !test.tags.includes(tagFilter)) continue;
    if (noTagFilter && test.tags.includes(noTagFilter)) continue;
    rows.push({
      id: test.id,
      spec: `cypress/e2e/${rel}`,
      title: test.title,
      mutating: test.tags.includes('@mutating'),
      tags: test.tags,
    });
  }
}

// --- Shard filtering (alphabetical round-robin over the full spec list) ---
if (shardCount > 0) {
  const allSpecs = specs.map((rel) => `cypress/e2e/${rel}`);
  const shardSpecs = new Set(
    allSpecs.filter((_, i) => i % shardCount === shardIndex - 1),
  );
  const filtered = rows.filter((r) => shardSpecs.has(r.spec));
  rows.length = 0;
  rows.push(...filtered);
}

if (format === 'json') {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

const mutatingCount = rows.filter((r) => r.mutating).length;
const readonlyCount = rows.length - mutatingCount;
const specCount = new Set(rows.map((r) => r.spec)).size;

const shardLabel = shardCount > 0 ? ` on shard ${shardIndex}/${shardCount}` : '';
console.log(
  `${rows.length} tests across ${specCount} specs${shardLabel} (${mutatingCount} mutating, ${readonlyCount} read-only)\n`,
);

if (rows.length === 0) process.exit(0);

const specFileName = (s: string) => s.split('/').pop()!;

const maxId = Math.max(...rows.map((r) => r.id.length));
const maxFile = Math.max(...rows.map((r) => specFileName(r.spec).length));
const maxTitle = Math.min(80, Math.max(...rows.map((r) => r.title.length)));

const header = `${'ID'.padEnd(maxId)}  ${'SPEC'.padEnd(maxFile)}  ${'TITLE'.padEnd(maxTitle)}  MUT`;
console.log(header);
console.log('-'.repeat(header.length));

for (const row of rows) {
  const id = row.id.padEnd(maxId);
  const file = specFileName(row.spec).padEnd(maxFile);
  const title =
    row.title.length > maxTitle
      ? row.title.slice(0, maxTitle - 3) + '...'
      : row.title.padEnd(maxTitle);
  const mut = row.mutating ? '  *' : '   ';
  console.log(`${id}  ${file}  ${title} ${mut}`);
}
