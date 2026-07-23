import { strict as assert } from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { LogViewerBuilder } from './log-viewer.js';
import type { AggregatedReport, EnrichedTestResult } from './aggregator.js';

function makeReport(failedShardIndex?: number): AggregatedReport {
  const tests: EnrichedTestResult[] =
    failedShardIndex === undefined
      ? []
      : [
          {
            id: 'X_E2E_01',
            spec: 'x.cy.ts',
            shardIndex: failedShardIndex,
            finalStatus: 'failed',
            finalDurationMs: 1,
            attempts: [],
            retryCount: 0,
            isFlaky: false,
          },
        ];
  return { tests } as AggregatedReport;
}

function withDirs(fn: (input: string, output: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'logview-'));
  try {
    fn(join(root, 'in'), join(root, 'out'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('builds a self-contained viewer and parses JSON + text log lines', () => {
  withDirs((input, output) => {
    const backend = join(input, 'shard-1', 'backend-logs');
    mkdirSync(backend, { recursive: true });
    writeFileSync(
      join(backend, 'core.log'),
      '{"log.level":"error","@timestamp":"2026-07-13T00:00:00Z","message":"boom happened"}\n',
    );
    writeFileSync(join(backend, 'gateway.log'), '2026-07-13 INFO serving request\n');

    const logs = new LogViewerBuilder().build(input, makeReport(1), output);

    const info = logs.get(1);
    assert.ok(info, 'shard 1 log info present');
    assert.deepEqual(info.services, ['core', 'gateway']);
    assert.equal(info.lineCount, 2);
    assert.equal(info.hadFailures, true);

    const page = join(output, 'logs', 'shard-1.html');
    assert.ok(existsSync(page), 'viewer page written');
    const html = readFileSync(page, 'utf8');
    assert.match(html, /boom happened/);
    assert.match(html, /serving request/);
    // Self-contained: no external stylesheet/script references.
    assert.doesNotMatch(html, /<link[^>]+href=|<script[^>]+src=/);
  });
});

test('ignores shard dirs without backend logs and reports no failures cleanly', () => {
  withDirs((input, output) => {
    mkdirSync(join(input, 'shard-2'), { recursive: true });
    const backend = join(input, 'shard-3', 'backend-logs');
    mkdirSync(backend, { recursive: true });
    writeFileSync(join(backend, 'core.log'), 'plain line\n');

    const logs = new LogViewerBuilder().build(input, makeReport(), output);

    assert.equal(logs.has(2), false, 'shard without logs is skipped');
    const info = logs.get(3);
    assert.ok(info);
    assert.equal(info.hadFailures, false);
    assert.equal(info.lineCount, 1);
  });
});

test('returns empty map when input dir is missing', () => {
  const logs = new LogViewerBuilder().build('/no/such/dir', makeReport(), '/tmp/unused-out');
  assert.equal(logs.size, 0);
});
