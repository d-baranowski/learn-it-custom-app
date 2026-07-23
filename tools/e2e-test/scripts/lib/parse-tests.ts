import { extractDeclaredId } from './test-id.js';
import type { TestEntry } from './types.js';

export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

export function parseTags(configStr: string): string[] {
  const tags: string[] = [];
  const m = configStr.match(/tags:\s*(?:'([^']*)'|"([^"]*)"|(\[[^\]]*\]))/);
  if (!m) return tags;
  const raw = m[1] ?? m[2] ?? m[3]!;
  if (raw.startsWith('[')) {
    for (const t of raw.slice(1, -1).match(/'[^']*'|"[^"]*"/g) || []) {
      tags.push(t.slice(1, -1));
    }
  } else {
    tags.push(raw);
  }
  return tags;
}

export function extractId(title: string): string {
  return extractDeclaredId(title);
}

export function parseTests(src: string): { id: string; title: string; tags: string[] }[] {
  const clean = stripComments(src);
  const tests: { id: string; title: string; tags: string[] }[] = [];
  const re =
    /(?<![A-Za-z0-9_$])it(?:\.only|\.skip)?\s*\(\s*(?:(['"`])((?:\\.|(?!\1).)*)\1|(`)((?:\\.|(?!\3).)*)\3)\s*(?:,\s*(\{[^}]*\}))?\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const title = m[2] ?? m[4] ?? '';
    const configStr = m[5] || '';
    tests.push({ id: extractId(title), title, tags: parseTags(configStr) });
  }
  return tests;
}

export function buildTestEntries(
  specRelPath: string,
  src: string,
): TestEntry[] {
  return parseTests(src).map((t) => ({
    id: t.id,
    spec: `cypress/e2e/${specRelPath}`,
    title: t.title,
    mutating: t.tags.includes('@mutating'),
    tags: t.tags,
  }));
}
