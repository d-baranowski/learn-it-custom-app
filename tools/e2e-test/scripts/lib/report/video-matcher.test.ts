import { strict as assert } from 'node:assert';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { VideoMatcher } from './video-matcher.js';
import type { EnrichedTestResult } from './aggregator.js';

function failedTest(id: string, spec: string): EnrichedTestResult {
  return {
    id,
    spec,
    shardIndex: 1,
    finalStatus: 'failed',
    finalDurationMs: 1,
    attempts: [],
    retryCount: 0,
    isFlaky: false,
  };
}

function writeVideo(root: string, relDir: string, name: string, content: string): void {
  const dir = join(root, relDir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), content);
}

function withDirs(fn: (input: string, output: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'vidmatch-'));
  try {
    fn(join(root, 'in'), join(root, 'out'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('matches a failure video to its test by spec suffix and copies it', () => {
  withDirs((input, output) => {
    writeVideo(input, 'shard-1/run-1/videos/session-tests', 'x.cy.ts.mp4', 'clip');

    const videos = new VideoMatcher().match(
      input,
      [failedTest('SES_E2E_01', 'cypress/e2e/session-tests/x.cy.ts')],
      output,
    );

    const dest = videos.get('SES_E2E_01');
    assert.ok(dest, 'video matched');
    assert.match(dest, /^videos\//);
    assert.ok(existsSync(join(output, dest)), 'video copied into merged output');
  });
});

test('prefers the later run when a spec has a video in multiple runs', () => {
  withDirs((input, output) => {
    writeVideo(input, 'shard-1/run-1/videos', 'a.cy.ts.mp4', 'v1');
    writeVideo(input, 'shard-1/run-2/videos', 'a.cy.ts.mp4', 'v2');

    const videos = new VideoMatcher().match(input, [failedTest('A_E2E_01', 'a.cy.ts')], output);

    const dest = videos.get('A_E2E_01');
    assert.ok(dest);
    assert.equal(readFileSync(join(output, dest), 'utf8'), 'v2');
  });
});

test('returns empty when there are no failed tests or no input dir', () => {
  withDirs((input, output) => {
    writeVideo(input, 'shard-1/run-1/videos', 'a.cy.ts.mp4', 'v1');
    assert.equal(new VideoMatcher().match(input, [], output).size, 0);
  });
  assert.equal(new VideoMatcher().match('/no/such/dir', [failedTest('A', 'a.cy.ts')], '/tmp/x').size, 0);
});
