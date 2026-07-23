import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AggregatedReport } from './aggregator.js';
import { renderIndexHtml } from './html-renderer.js';
import { renderFailurePage } from './failure-page.js';
import { writeSummaryJson, writeSummaryMarkdown } from './json-summary.js';

export class ReportWriter {
  write(report: AggregatedReport, outputDir: string): void {
    mkdirSync(outputDir, { recursive: true });
    mkdirSync(resolve(outputDir, 'data'), { recursive: true });

    this.writeIndex(report, outputDir);
    this.writeDataFiles(report, outputDir);
    this.writeFailurePages(report, outputDir);
    writeSummaryJson(report, outputDir);
    writeSummaryMarkdown(report, outputDir);
  }

  private writeIndex(report: AggregatedReport, outputDir: string): void {
    const html = renderIndexHtml(report);
    writeFileSync(resolve(outputDir, 'index.html'), html);
  }

  private writeDataFiles(report: AggregatedReport, outputDir: string): void {
    const reportData = {
      title: report.title,
      generatedAt: report.generatedAt,
      overall: report.overall,
      tests: report.tests,
      shardSummaries: report.shards.map((s) => ({
        index: s.shard.index,
        count: s.shard.count,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        durationMs: s.durationMs,
        exitCode: s.exitCode,
        summary: s.summary,
      })),
    };
    writeFileSync(
      resolve(outputDir, 'data', 'report-data.json'),
      JSON.stringify(reportData, null, 2) + '\n',
    );

    const timelines = report.shards.map((s) => ({
      shard: s.shard,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      durationMs: s.durationMs,
      events: s.events,
      systemMetrics: s.systemMetrics,
    }));
    writeFileSync(
      resolve(outputDir, 'data', 'shard-timelines.json'),
      JSON.stringify(timelines, null, 2) + '\n',
    );
  }

  private writeFailurePages(report: AggregatedReport, outputDir: string): void {
    const failed = report.tests.filter((t) => t.finalStatus === 'failed');
    if (failed.length === 0) return;

    const failuresDir = resolve(outputDir, 'failures');
    mkdirSync(failuresDir, { recursive: true });

    for (const test of failed) {
      const screenshotPath = report.screenshots.get(test.id);
      const logPath = report.logs.get(test.shardIndex)?.path;
      const videoPath = report.videos.get(test.id);
      const html = renderFailurePage(test, screenshotPath, logPath, videoPath);
      writeFileSync(resolve(failuresDir, `${test.id}.html`), html);
    }
  }
}
