import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Aggregator } from './aggregator.js';

function writeShardTimeline(inputDir: string, events: object[]): void {
  const shardDir = join(inputDir, 'shard-1');
  mkdirSync(shardDir, { recursive: true });
  writeFileSync(
    join(shardDir, 'timeline.json'),
    JSON.stringify({
      shard: { index: 1, count: 1 },
      startedAt: '2026-07-01T00:00:00.000Z',
      finishedAt: '2026-07-01T00:10:00.000Z',
      durationMs: 600000,
      events,
    })
  );
}

function result(id: string, status: string, error?: string) {
  return { id, spec: `cypress/e2e/${id}.cy.ts`, status, durationMs: 1000, error };
}

test('retry rounds only apply results for tests actually retried', () => {
  const inputDir = mkdtempSync(join(tmpdir(), 'aggregator-test-'));
  try {
    writeShardTimeline(inputDir, [
      {
        state: 'RUN_TESTS',
        startedAt: '2026-07-01T00:00:00.000Z',
        durationMs: 60000,
        data: {
          round: 1,
          results: [result('A_E2E_01', 'passed'), result('B_E2E_01', 'failed', 'boom')],
        },
      },
      // Round 2 reruns B's spec; A is a spec-mate dragged along by a failing
      // before-hook and must NOT overwrite its round-1 pass.
      {
        state: 'RETRY_FAILED',
        startedAt: '2026-07-01T00:02:00.000Z',
        durationMs: 60000,
        data: {
          round: 2,
          results: [result('A_E2E_01', 'failed', 'before hook'), result('B_E2E_01', 'passed')],
        },
      },
      {
        state: 'RETRY_FAILED',
        startedAt: '2026-07-01T00:02:00.000Z',
        durationMs: 60000,
        data: { round: 2, retried: ['B_E2E_01'], durationMs: 60000 },
      },
    ]);

    const report = new Aggregator().aggregate(inputDir, 'test');
    const byId = new Map(report.tests.map((t) => [t.id, t]));

    const a = byId.get('A_E2E_01');
    assert.equal(a?.finalStatus, 'passed', 'A passed round 1 and was not retried');
    assert.equal(a?.attempts.length, 1, 'A has only its intentional attempt');
    assert.equal(a?.isFlaky, false);

    const b = byId.get('B_E2E_01');
    assert.equal(b?.finalStatus, 'passed');
    assert.equal(b?.isFlaky, true, 'B failed then passed on retry');

    assert.equal(report.overall.failed, 0);
    assert.equal(report.overall.passed, 2);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});

test('retry rounds without a retried list keep all results (legacy timelines)', () => {
  const inputDir = mkdtempSync(join(tmpdir(), 'aggregator-test-'));
  try {
    writeShardTimeline(inputDir, [
      {
        state: 'RUN_TESTS',
        startedAt: '2026-07-01T00:00:00.000Z',
        durationMs: 60000,
        data: { round: 1, results: [result('A_E2E_01', 'failed', 'boom')] },
      },
      {
        state: 'RETRY_FAILED',
        startedAt: '2026-07-01T00:02:00.000Z',
        durationMs: 60000,
        data: { round: 2, results: [result('A_E2E_01', 'passed')] },
      },
    ]);

    const report = new Aggregator().aggregate(inputDir, 'test');
    const a = report.tests.find((t) => t.id === 'A_E2E_01');
    assert.equal(a?.finalStatus, 'passed');
    assert.equal(a?.attempts.length, 2);
    assert.equal(a?.isFlaky, true);
  } finally {
    rmSync(inputDir, { recursive: true, force: true });
  }
});
