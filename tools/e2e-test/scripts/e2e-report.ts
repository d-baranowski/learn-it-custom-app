#!/usr/bin/env tsx
import { Aggregator } from './lib/report/aggregator.js';
import { LogViewerBuilder } from './lib/report/log-viewer.js';
import { ScreenshotMatcher } from './lib/report/screenshot-matcher.js';
import { VideoMatcher } from './lib/report/video-matcher.js';
import { ReportWriter } from './lib/report/writer.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: tsx scripts/e2e-report.ts [options]

Options:
  --input-dir <path>        Base directory containing shard-* subdirectories
                            (default: cypress/reports)
  --output-dir <path>       Directory for output files
                            (default: cypress/merged)
  --screenshots-dir <path>  Directory containing failure screenshots
                            (default: cypress/screenshots)
  --title <string>          Report title
                            (default: "Utro E2E Report")
  -h, --help                Show this help`);
  process.exit(0);
}

function getFlag(name: string): string | null {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const inputDir = getFlag('input-dir') ?? 'cypress/reports';
const outputDir = getFlag('output-dir') ?? 'cypress/merged';
const screenshotsDir = getFlag('screenshots-dir') ?? 'cypress/screenshots';
const title = getFlag('title') ?? 'Utro E2E Report';

const start = Date.now();
console.error(`[e2e-report] Aggregating from ${inputDir}...`);

const aggregator = new Aggregator();
const report = aggregator.aggregate(inputDir, title);

console.error(`[e2e-report] ${report.overall.uniqueTests} unique tests across ${report.overall.shardCount} shards`);
console.error(`[e2e-report] ${report.overall.passed} passed, ${report.overall.failed} failed, ${report.overall.skipped} skipped, ${report.overall.flaky} flaky`);

if (report.overall.failed > 0) {
  const failedTests = report.tests.filter((t) => t.finalStatus === 'failed');
  const failedIds = new Set(failedTests.map((t) => t.id));

  const matcher = new ScreenshotMatcher();
  const screenshots = matcher.match(screenshotsDir, failedIds, outputDir);
  for (const [id, path] of screenshots) {
    report.screenshots.set(id, path);
  }
  console.error(`[e2e-report] Matched ${screenshots.size} screenshot(s)`);

  const videos = new VideoMatcher().match(inputDir, failedTests, outputDir);
  report.videos = videos;
  console.error(`[e2e-report] Matched ${new Set(videos.values()).size} failure video(s)`);
}

const logs = new LogViewerBuilder().build(inputDir, report, outputDir);
report.logs = logs;
const logShards = [...logs.values()];
const logLines = logShards.reduce((sum, l) => sum + l.lineCount, 0);
console.error(`[e2e-report] Backend logs: ${logLines} lines across ${logShards.length} shard(s)`);

const writer = new ReportWriter();
writer.write(report, outputDir);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.error(`[e2e-report] Report written to ${outputDir}/ (${elapsed}s)`);
console.error(`[e2e-report]   index.html, e2e-summary.json, e2e-summary.md`);
if (report.overall.failed > 0) {
  console.error(`[e2e-report]   ${report.tests.filter((t) => t.finalStatus === 'failed').length} failure page(s) in failures/`);
}
