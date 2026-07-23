#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import { globSync } from 'node:fs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPECS_ROOT = resolve(SCRIPT_DIR, '..', 'cypress', 'e2e');

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function extractId(title) {
  const m = title.match(/^([A-Z][A-Z0-9_]+_\d+[a-zA-Z]?)(?:_\$\{[^}]+\})?:\s/);
  return m ? m[1] : '';
}

function parseTestTitles(src) {
  const clean = stripComments(src);
  const titles = [];
  const re =
    /(?<![A-Za-z0-9_$])it(?:\.only|\.skip)?\s*\(\s*(?:(['"`])((?:\\.|(?!\1).)*)\1|(`)((?:\\.|(?!\3).)*)\3)\s*(?:,\s*(\{[^}]*\}))?\s*,/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    titles.push(m[2] ?? m[4] ?? '');
  }
  return titles;
}

const specs = globSync('**/*.cy.ts', { cwd: SPECS_ROOT });
const errors = [];
const warnings = [];
const seen = new Map();

for (const rel of specs) {
  const src = readFileSync(resolve(SPECS_ROOT, rel), 'utf8');
  const titles = parseTestTitles(src);

  for (const title of titles) {
    const id = extractId(title);
    if (!id) {
      errors.push({ rel, title, reason: 'missing or malformed ID' });
      continue;
    }
    if (seen.has(id) && seen.get(id).spec !== rel) {
      warnings.push({ rel, title, reason: `duplicate ID "${id}" (also in ${seen.get(id).spec})` });
    } else if (!seen.has(id)) {
      seen.set(id, { spec: rel });
    }
  }
}

const allIssues = [...errors, ...warnings];

if (allIssues.length > 0) {
  console.error(`\n✖ ${allIssues.length} test(s) with naming issues:\n`);
  for (const { rel, title, reason } of allIssues) {
    console.error(`  ${rel}`);
    console.error(`    it('${title.substring(0, 80)}${title.length > 80 ? '...' : ''}')`);
    console.error(`    → ${reason}\n`);
  }
  console.error(`Expected format: ID: description`);
  console.error(`  ID pattern: UPPERCASE_PREFIX_NN (e.g. CUS_E2E_01, WH_E2E_01b, SES_PAY_E2E_03)`);
  console.error(`  IDs must be unique across all spec files.\n`);
  process.exit(1);
}

console.log(`✓ All ${seen.size} test(s) across ${specs.length} specs have valid, unique IDs.`);
