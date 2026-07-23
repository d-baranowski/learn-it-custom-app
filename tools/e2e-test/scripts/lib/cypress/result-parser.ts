import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { matchRuntimeTitleId } from '../test-id.js';
import type { TestResult, TestStatus } from '../types.js';

export class ResultParser {
  parseReport(reportDir: string): TestResult[] {
    const junitResults = this.parseJunitReports(reportDir);
    if (junitResults.length > 0) return junitResults;

    return this.parseMochawesomeReport(reportDir);
  }

  private parseJunitReports(reportDir: string): TestResult[] {
    if (!existsSync(reportDir)) return [];

    const xmlFiles = readdirSync(reportDir).filter((f) => f.startsWith('junit-') && f.endsWith('.xml'));
    if (xmlFiles.length === 0) return [];

    const results: TestResult[] = [];
    for (const file of xmlFiles) {
      const content = readFileSync(resolve(reportDir, file), 'utf8');
      this.parseJunitXml(content, results);
    }
    return results;
  }

  private parseJunitXml(xml: string, results: TestResult[]): void {
    const specMatch = xml.match(/file="([^"]+)"/);
    const specFile = specMatch ? specMatch[1] : '';

    const testcaseRegex = /<testcase\s+name="([^"]*)"[^>]*time="([^"]*)"[^>]*>([\s\S]*?)<\/testcase>/g;
    const selfClosingRegex = /<testcase\s+name="([^"]*)"[^>]*time="([^"]*)"[^>]*\/>/g;

    let m: RegExpExecArray | null;

    while ((m = testcaseRegex.exec(xml)) !== null) {
      const title = this.unescapeXml(m[1]);
      const durationMs = Math.round(parseFloat(m[2]) * 1000);
      const body = m[3];

      const failureMatch = body.match(/<failure\s+message="([^"]*)"[^>]*>/);
      // <skipped/> testcases (e.g. tests skipped by a failing before hook)
      // carry no <failure> element and must not be reported green.
      const status: TestStatus = failureMatch ? 'failed' : /<skipped\b/.test(body) ? 'skipped' : 'passed';
      const error = failureMatch ? this.unescapeXml(failureMatch[1]) : undefined;

      results.push({
        id: this.matchTestId(title),
        spec: specFile,
        status,
        durationMs,
        error,
      });
    }

    while ((m = selfClosingRegex.exec(xml)) !== null) {
      const title = this.unescapeXml(m[1]);
      const durationMs = Math.round(parseFloat(m[2]) * 1000);

      results.push({
        id: this.matchTestId(title),
        spec: specFile,
        status: 'passed',
        durationMs,
      });
    }
  }

  private parseMochawesomeReport(reportDir: string): TestResult[] {
    const mergedPath = resolve(reportDir, 'index.json');
    if (!existsSync(mergedPath)) return [];

    const content = readFileSync(mergedPath, 'utf8');
    const report = JSON.parse(content) as MochawesomeReport;
    const results: TestResult[] = [];

    for (const result of report.results ?? []) {
      const specFile = result.fullFile ?? result.file ?? '';
      for (const suite of result.suites ?? []) {
        this.extractFromSuite(suite, specFile, results);
      }
    }
    return results;
  }

  private extractFromSuite(suite: MochawesomeSuite, specFile: string, results: TestResult[]): void {
    for (const test of suite.tests ?? []) {
      results.push({
        id: this.matchTestId(test.fullTitle || test.title),
        spec: specFile,
        // `skipped` (aborted by a failing hook) is distinct from `pending`
        // (it.skip / grep-filtered) — both must not be reported as passed.
        status: test.pending || test.skipped ? 'skipped' : test.fail ? 'failed' : 'passed',
        durationMs: test.duration ?? 0,
        error: test.err?.message,
      });
    }
    for (const child of suite.suites ?? []) {
      this.extractFromSuite(child, specFile, results);
    }
  }

  private matchTestId(title: string): string {
    return matchRuntimeTitleId(title) ?? title;
  }

  private unescapeXml(s: string): string {
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"');
  }
}

interface MochawesomeSuite {
  tests: Array<{ title: string; fullTitle: string; duration: number; pass: boolean; fail: boolean; pending: boolean; skipped?: boolean; err?: { message?: string } }>;
  suites: MochawesomeSuite[];
}

interface MochawesomeReport {
  results?: Array<{ file?: string; fullFile?: string; suites: MochawesomeSuite[] }>;
}
