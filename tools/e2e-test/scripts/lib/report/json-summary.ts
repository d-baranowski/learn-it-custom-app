import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AggregatedReport } from './aggregator.js';

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

interface SummaryJson {
  uniqueTests: number;
  passed: number;
  failed: number;
  skipped: number;
  retried: number;
  flaky: number;
  passRate: number;
  duration: string;
  durationMs: number;
  shards: number;
  failedTests: Array<{ id: string; spec: string; error: string }>;
  flakyTests: string[];
}

export function writeSummaryJson(report: AggregatedReport, outputDir: string): void {
  const { overall } = report;

  const failedTests = report.tests
    .filter((t) => t.finalStatus === 'failed')
    .map((t) => ({
      id: t.id,
      spec: t.spec,
      error: t.finalError?.split('\n')[0]?.substring(0, 200) ?? '',
    }));

  const flakyTests = report.tests
    .filter((t) => t.isFlaky)
    .map((t) => t.id);

  const summary: SummaryJson = {
    uniqueTests: overall.uniqueTests,
    passed: overall.passed,
    failed: overall.failed,
    skipped: overall.skipped,
    retried: overall.retried,
    flaky: overall.flaky,
    passRate: overall.passRate,
    duration: formatDuration(overall.wallClockMs),
    durationMs: overall.wallClockMs,
    shards: overall.shardCount,
    failedTests,
    flakyTests,
  };

  writeFileSync(resolve(outputDir, 'e2e-summary.json'), JSON.stringify(summary, null, 2) + '\n');
}

export function writeSummaryMarkdown(report: AggregatedReport, outputDir: string): void {
  const { overall } = report;
  const icon = overall.failed > 0 ? ':x:' : ':white_check_mark:';
  const status = overall.failed > 0 ? 'FAILED' : 'PASSED';

  const lines: string[] = [];
  lines.push(`## ${icon} E2E Test Results — ${status}`);
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Tests | ${overall.uniqueTests} |`);
  lines.push(`| Passed | ${overall.passed} |`);
  lines.push(`| Failed | ${overall.failed} |`);
  lines.push(`| Skipped | ${overall.skipped} |`);
  lines.push(`| Flaky | ${overall.flaky} |`);
  lines.push(`| Pass Rate | ${overall.passRate}% |`);
  lines.push(`| Duration | ${formatDuration(overall.wallClockMs)} |`);
  lines.push(`| Shards | ${overall.shardCount} |`);

  const failed = report.tests.filter((t) => t.finalStatus === 'failed');
  if (failed.length > 0) {
    lines.push('');
    lines.push('### Failed Tests');
    lines.push('');
    for (const t of failed) {
      const errSnippet = t.finalError?.split('\n')[0]?.substring(0, 120) ?? '';
      lines.push(`- **${t.id}** (${t.spec.split('/').pop()})`);
      if (errSnippet) lines.push(`  > ${errSnippet}`);
    }
    lines.push('');
    lines.push('**Repro commands:**');
    lines.push('```');
    for (const t of failed) {
      lines.push(`npx cypress run --spec "${t.spec}" --expose grep="${t.id}"`);
    }
    lines.push('```');
  }

  const flaky = report.tests.filter((t) => t.isFlaky);
  if (flaky.length > 0) {
    lines.push('');
    lines.push('### Flaky Tests');
    lines.push('');
    for (const t of flaky) {
      lines.push(`- **${t.id}** — ${t.attempts.length} attempts (${t.spec.split('/').pop()})`);
    }
  }

  writeFileSync(resolve(outputDir, 'e2e-summary.md'), lines.join('\n') + '\n');
}
