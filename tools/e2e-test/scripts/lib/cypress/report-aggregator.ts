import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import type { Logger } from '../logger.js';
import type { IShell } from '../types.js';

export class ReportAggregator {
  constructor(
    private readonly shell: IShell,
    private readonly log: Logger,
  ) {}

  aggregate(runDirs: string[], outputDir: string): void {
    if (runDirs.length === 0) return;

    mkdirSync(outputDir, { recursive: true });

    this.aggregateJunitXml(runDirs, outputDir);
    this.aggregateMochawesome(runDirs, outputDir);
  }

  private aggregateJunitXml(runDirs: string[], outputDir: string): void {
    let copied = 0;

    for (let i = 0; i < runDirs.length; i++) {
      const runDir = runDirs[i];
      const runNum = i + 1;
      if (!existsSync(runDir)) continue;

      const xmlFiles = readdirSync(runDir).filter(
        (f) => f.startsWith('junit-') && f.endsWith('.xml'),
      );

      for (const file of xmlFiles) {
        const src = resolve(runDir, file);
        const name = basename(file, '.xml');
        const dest = resolve(outputDir, `${name}-run-${runNum}.xml`);
        copyFileSync(src, dest);
        copied++;
      }
    }

    this.log.info(`Aggregated ${copied} JUnit XML file(s)`);
  }

  private aggregateMochawesome(runDirs: string[], outputDir: string): void {
    const jsonFiles: string[] = [];

    for (const runDir of runDirs) {
      const before = jsonFiles.length;
      const jsonsDir = resolve(runDir, '.jsons');
      if (existsSync(jsonsDir)) {
        for (const f of readdirSync(jsonsDir).filter((f) => f.endsWith('.json'))) {
          jsonFiles.push(resolve(jsonsDir, f));
        }
      }
      // Fall back to index.json only when THIS run contributed no .jsons —
      // a global emptiness check would drop a later run's results whenever
      // any earlier run had a .jsons dir.
      const indexJson = resolve(runDir, 'index.json');
      if (existsSync(indexJson) && jsonFiles.length === before) {
        jsonFiles.push(indexJson);
      }
    }

    if (jsonFiles.length === 0) {
      this.log.warn('No mochawesome JSON files found to merge');
      return;
    }

    try {
      const fileArgs = jsonFiles.map((f) => `"${f}"`).join(' ');
      this.shell.exec(
        `npx mochawesome-merge ${fileArgs} -o "${resolve(outputDir, 'index.json')}"`,
        { timeout: 30_000 },
      );

      this.shell.exec(
        `npx marge "${resolve(outputDir, 'index.json')}" ` +
        `--reportDir "${outputDir}" --inline --charts`,
        { timeout: 30_000 },
      );

      this.log.info(`Aggregated mochawesome report → ${outputDir}/index.html`);
    } catch (err) {
      this.log.warn(`Mochawesome merge failed (non-fatal): ${err}`);
    }
  }
}
