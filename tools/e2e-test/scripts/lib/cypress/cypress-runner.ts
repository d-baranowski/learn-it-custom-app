import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ControllerConfig } from '../config.js';
import type { Logger } from '../logger.js';
import type { CypressRunResult, IShell, TestEntry } from '../types.js';
import { ResultParser } from './result-parser.js';

export class CypressRunner {
  private runCounter = 0;
  private readonly runDirs: string[] = [];

  constructor(
    private readonly shell: IShell,
    private readonly config: ControllerConfig,
    private readonly parser: ResultParser,
    private readonly log: Logger,
  ) {}

  getRunDirs(): string[] {
    return this.runDirs;
  }

  runAll(specs: string[], ports: { ui: number; bootstrapApi: number }, grep?: string): CypressRunResult {
    this.log.info(`Running ${specs.length} spec(s)...`);
    const runDir = this.nextRunDir();
    const specList = specs.join(',');
    const cmd = this.buildCommand({
      specs: specList,
      grep,
      baseUrl: `http://localhost:${ports.ui}`,
      bootstrapUrl: `http://localhost:${ports.bootstrapApi}`,
      reportDir: runDir,
    });
    this.log.info(`$ ${cmd}`);
    return this.execute(cmd, runDir, specs.length);
  }

  runByIds(
    testIds: string[],
    testList: TestEntry[],
    ports: { ui: number; bootstrapApi: number },
  ): CypressRunResult {
    this.log.info(`Retrying ${testIds.length} test(s): ${testIds.join(', ')}`);
    const runDir = this.nextRunDir();

    const failedSpecs = [...new Set(
      testIds
        .map((id) => testList.find((t) => t.id === id)?.spec)
        .filter(Boolean) as string[],
    )];

    // @cypress/grep ORs title substrings on ';' — '|' would be one literal.
    const grepPattern = testIds.join(';');
    const cmd = this.buildCommand({
      specs: failedSpecs.join(','),
      grep: grepPattern,
      baseUrl: `http://localhost:${ports.ui}`,
      bootstrapUrl: `http://localhost:${ports.bootstrapApi}`,
      reportDir: runDir,
    });
    this.log.info(`$ ${cmd}`);
    return this.execute(cmd, runDir, testIds.length);
  }

  private nextRunDir(): string {
    this.runCounter++;
    const dir = resolve(this.config.reportDir, `run-${this.runCounter}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    this.runDirs.push(dir);
    return dir;
  }

  private buildCommand(opts: {
    specs?: string;
    grep?: string;
    baseUrl: string;
    bootstrapUrl: string;
    reportDir: string;
  }): string {
    // Record video only when requested. videosFolder is scoped to this run's
    // dir so a passing retry can't overwrite an earlier failing attempt's clip;
    // cypress.config.ts compresses and keeps only failing specs' videos.
    const configParts = [`baseUrl=${opts.baseUrl}`];
    const envPrefixParts = [`CYPRESS_REPORT_DIR="${opts.reportDir}"`];
    if (this.config.video) {
      envPrefixParts.push('CYPRESS_VIDEO=true');
      configParts.push('video=true', `videosFolder=${resolve(opts.reportDir, 'videos')}`);
    }

    const parts = [
      ...envPrefixParts,
      'npx cypress run',
      `--config ${configParts.join(',')}`,
    ];

    const envParts = [
      `CONTROLLER_MODE=true`,
      `BOOTSTRAP_API_URL=${opts.bootstrapUrl}`,
    ];

    if (opts.grep) {
      // @cypress/grep v6 reads Cypress's `expose` channel, not `env` —
      // grep values passed via --env are silently ignored and the whole
      // spec file runs instead of the targeted tests.
      parts.push(`--expose 'grep=${opts.grep},grepFilterSpecs=true'`);
    }

    if (opts.specs) {
      parts.push(`--spec "${opts.specs}"`);
    }

    parts.push(`--env '${envParts.join(',')}'`);

    return parts.join(' ');
  }

  private execute(cmd: string, runDir: string, testCount?: number): CypressRunResult {
    // Video recording roughly doubles run time (capture overhead plus ffmpeg
    // compression, ~2min+ per kept clip, which Cypress waits for on exit).
    // A budget tuned for non-video runs SIGTERMs Cypress mid-spec, leaving an
    // unfinalized (unplayable) recording and marking the in-flight test as
    // missing/failed. The floor matters too: small retry runs of long specs
    // were killed at the 10min floor even with a generous per-test rate.
    const perTestMs = this.config.video ? 300_000 : 120_000;
    const floorMs = this.config.video ? 1_200_000 : 600_000;
    const timeoutMs = Math.max(floorMs, (testCount ?? 10) * perTestMs);
    this.log.info(`Reports → ${runDir} (timeout: ${Math.round(timeoutMs / 60_000)}min)`);

    const start = Date.now();
    this.log.separator();
    const { exitCode } = this.shell.execStream(cmd, { timeout: timeoutMs });
    this.log.separator();
    const durationMs = Date.now() - start;
    this.log.timing('Cypress run completed', durationMs);
    this.sweepAbortedCompressions(runDir);

    const results = this.parser.parseReport(runDir);

    if (exitCode !== 0 && results.length === 0) {
      this.log.error(`Cypress exited with code ${exitCode} and produced no results — likely a config or startup error`);
      return { exitCode, results, durationMs, crashed: true };
    }

    if (exitCode !== 0 && results.filter((r) => r.status === 'failed').length === 0) {
      this.log.warn(`Cypress exited with code ${exitCode} but parser found 0 failures — report data may be incomplete`);
    }

    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    if (failed > 0) {
      this.log.error(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    } else {
      this.log.success(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    }

    return { exitCode, results, durationMs };
  }

  // Cypress compresses into `<spec>-compressed.mp4` and renames the result
  // over the original on success, so any surviving `-compressed.mp4` is the
  // output of an aborted ffmpeg run (killed process or vanished input) —
  // junk that would otherwise get archived alongside every real video.
  private sweepAbortedCompressions(runDir: string): void {
    const videosDir = resolve(runDir, 'videos');
    if (!existsSync(videosDir)) return;
    for (const entry of readdirSync(videosDir, { recursive: true }) as string[]) {
      if (entry.endsWith('-compressed.mp4')) {
        rmSync(join(videosDir, entry), { force: true });
      }
    }
  }
}
