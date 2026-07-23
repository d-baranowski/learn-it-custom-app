import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { matchBareId } from '../test-id.js';

export class ScreenshotMatcher {
  match(
    screenshotsDir: string,
    failedIds: Set<string>,
    outputDir: string,
  ): Map<string, string> {
    const result = new Map<string, string>();
    if (!existsSync(screenshotsDir)) return result;

    const outScreensDir = resolve(outputDir, 'screenshots');
    mkdirSync(outScreensDir, { recursive: true });

    const files = this.walkPngs(screenshotsDir).sort();

    // Keep the highest-numbered attempt per test — cypress names retries
    // "… (failed) (attempt N).png", and the final attempt is the one whose
    // failure the report describes. Filesystem order used to win, which
    // could attach an earlier retry's screenshot.
    const best = new Map<string, { path: string; attempt: number }>();
    for (const filePath of files) {
      const name = basename(filePath, extname(filePath));
      const testId = matchBareId(name);
      if (!testId || !failedIds.has(testId)) continue;

      const attemptMatch = name.match(/\(attempt (\d+)\)/);
      const attempt = attemptMatch ? parseInt(attemptMatch[1], 10) : 1;
      const current = best.get(testId);
      if (!current || attempt >= current.attempt) {
        best.set(testId, { path: filePath, attempt });
      }
    }

    for (const [testId, { path }] of best) {
      const destName = `${testId}.png`;
      copyFileSync(path, resolve(outScreensDir, destName));
      result.set(testId, `screenshots/${destName}`);
    }

    return result;
  }

  private walkPngs(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        files.push(...this.walkPngs(full));
      } else if (entry.endsWith('.png')) {
        files.push(full);
      }
    }
    return files;
  }
}
