import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  ControllerState,
  LogInfo,
  ShardTimeline,
  TestResult,
  TestStatus,
} from '../types.js';
import { ResultParser } from '../cypress/result-parser.js';

export interface TestAttempt {
  round: number;
  status: TestStatus;
  durationMs: number;
  error?: string;
  shardIndex: number;
}

export interface EnrichedTestResult {
  id: string;
  spec: string;
  shardIndex: number;
  finalStatus: TestStatus;
  finalDurationMs: number;
  finalError?: string;
  attempts: TestAttempt[];
  retryCount: number;
  isFlaky: boolean;
}

export interface AggregatedReport {
  title: string;
  generatedAt: string;
  shards: ShardTimeline[];
  tests: EnrichedTestResult[];
  screenshots: Map<string, string>;
  logs: Map<number, LogInfo>;
  videos: Map<string, string>;
  overall: {
    uniqueTests: number;
    passed: number;
    failed: number;
    skipped: number;
    retried: number;
    flaky: number;
    passRate: number;
    wallClockMs: number;
    totalCypressMs: number;
    shardCount: number;
  };
}

export class Aggregator {
  private readonly parser = new ResultParser();

  aggregate(inputDir: string, title: string): AggregatedReport {
    const shardDirs = this.discoverShardDirs(inputDir);
    const shards: ShardTimeline[] = [];
    const testMap = new Map<string, { spec: string; shardIndex: number; attempts: TestAttempt[] }>();

    for (const dir of shardDirs) {
      const timeline = this.parseTimeline(dir);
      if (timeline) {
        shards.push(timeline);
        this.extractFromTimeline(timeline, testMap);
      } else {
        const shardIndex = this.extractShardIndex(dir);
        this.extractFromMochawesome(dir, shardIndex, testMap);
      }
    }

    shards.sort((a, b) => a.shard.index - b.shard.index);

    const tests = this.buildEnrichedResults(testMap);
    const overall = this.computeOverall(tests, shards);

    return {
      title,
      generatedAt: new Date().toISOString(),
      shards,
      tests,
      screenshots: new Map(),
      logs: new Map(),
      videos: new Map(),
      overall,
    };
  }

  private discoverShardDirs(inputDir: string): string[] {
    if (!existsSync(inputDir)) return [];
    return readdirSync(inputDir)
      .filter((d) => d.startsWith('shard-'))
      .sort((a, b) => {
        const ai = parseInt(a.replace('shard-', ''), 10);
        const bi = parseInt(b.replace('shard-', ''), 10);
        return ai - bi;
      })
      .map((d) => resolve(inputDir, d));
  }

  private parseTimeline(shardDir: string): ShardTimeline | null {
    const path = resolve(shardDir, 'timeline.json');
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as ShardTimeline;
    } catch {
      return null;
    }
  }

  private extractFromTimeline(
    timeline: ShardTimeline,
    testMap: Map<string, { spec: string; shardIndex: number; attempts: TestAttempt[] }>,
  ): void {
    const shardIndex = timeline.shard.index;
    const retriedByRound = this.collectRetriedIds(timeline);

    for (const event of timeline.events) {
      const state = event.state as ControllerState;
      if (state !== 'RUN_TESTS' && state !== 'RETRY_FAILED') continue;

      const data = event.data as { round?: number; results?: TestResult[] } | undefined;
      if (!data?.results) continue;

      const round = data.round ?? 1;
      // A retry round reruns whole spec files; spec-mates dragged along by
      // a failing before-hook show up in its results even though they were
      // never scheduled. Only the IDs the controller intended to retry may
      // contribute attempts — otherwise a test that passed in round 1 gets
      // demoted by an incidental rerun failure.
      const intended = state === 'RETRY_FAILED' ? retriedByRound.get(round) : undefined;

      for (const r of data.results) {
        if (!r.id) continue;
        if (intended && !intended.has(r.id)) continue;
        let entry = testMap.get(r.id);
        if (!entry) {
          entry = { spec: r.spec, shardIndex, attempts: [] };
          testMap.set(r.id, entry);
        }
        entry.attempts.push({
          round,
          status: r.status,
          durationMs: r.durationMs,
          error: r.error,
          shardIndex,
        });
      }
    }
  }

  private collectRetriedIds(timeline: ShardTimeline): Map<number, Set<string>> {
    const retriedByRound = new Map<number, Set<string>>();
    for (const event of timeline.events) {
      if ((event.state as ControllerState) !== 'RETRY_FAILED') continue;
      const data = event.data as { round?: number; retried?: string[] } | undefined;
      if (data?.retried && data.round !== undefined) {
        retriedByRound.set(data.round, new Set(data.retried));
      }
    }
    return retriedByRound;
  }

  private extractFromMochawesome(
    shardDir: string,
    shardIndex: number,
    testMap: Map<string, { spec: string; shardIndex: number; attempts: TestAttempt[] }>,
  ): void {
    const runDirs = this.discoverRunDirs(shardDir);
    const sources = runDirs.length > 0 ? runDirs : [shardDir];

    for (let round = 0; round < sources.length; round++) {
      const results = this.parser.parseReport(sources[round]);
      for (const r of results) {
        if (!r.id) continue;
        let entry = testMap.get(r.id);
        if (!entry) {
          entry = { spec: r.spec, shardIndex, attempts: [] };
          testMap.set(r.id, entry);
        }
        entry.attempts.push({
          round: round + 1,
          status: r.status,
          durationMs: r.durationMs,
          error: r.error,
          shardIndex,
        });
      }
    }
  }

  private discoverRunDirs(shardDir: string): string[] {
    if (!existsSync(shardDir)) return [];
    return readdirSync(shardDir)
      .filter((d) => d.startsWith('run-'))
      .sort((a, b) => {
        const ai = parseInt(a.replace('run-', ''), 10);
        const bi = parseInt(b.replace('run-', ''), 10);
        return ai - bi;
      })
      .map((d) => resolve(shardDir, d));
  }

  private buildEnrichedResults(
    testMap: Map<string, { spec: string; shardIndex: number; attempts: TestAttempt[] }>,
  ): EnrichedTestResult[] {
    const results: EnrichedTestResult[] = [];

    for (const [id, entry] of testMap) {
      const last = entry.attempts[entry.attempts.length - 1];
      const retryCount = entry.attempts.length - 1;
      const hadFailure = entry.attempts.some((a) => a.status === 'failed');

      results.push({
        id,
        spec: entry.spec,
        shardIndex: entry.shardIndex,
        finalStatus: last.status,
        finalDurationMs: last.durationMs,
        finalError: last.error,
        attempts: entry.attempts,
        retryCount,
        isFlaky: hadFailure && last.status === 'passed',
      });
    }

    results.sort((a, b) => {
      const order: Record<TestStatus, number> = { failed: 0, skipped: 1, passed: 2 };
      const statusDiff = order[a.finalStatus] - order[b.finalStatus];
      if (statusDiff !== 0) return statusDiff;
      if (a.isFlaky !== b.isFlaky) return a.isFlaky ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

    return results;
  }

  private computeOverall(
    tests: EnrichedTestResult[],
    shards: ShardTimeline[],
  ): AggregatedReport['overall'] {
    const passed = tests.filter((t) => t.finalStatus === 'passed').length;
    const failed = tests.filter((t) => t.finalStatus === 'failed').length;
    const skipped = tests.filter((t) => t.finalStatus === 'skipped').length;
    const retried = tests.filter((t) => t.retryCount > 0).length;
    const flaky = tests.filter((t) => t.isFlaky).length;
    const denominator = passed + failed;

    let wallClockMs = 0;
    let totalCypressMs = 0;
    if (shards.length > 0) {
      const starts = shards.map((s) => new Date(s.startedAt).getTime());
      const ends = shards.map((s) => new Date(s.finishedAt).getTime());
      wallClockMs = Math.max(...ends) - Math.min(...starts);
      totalCypressMs = shards.reduce((sum, s) => sum + s.durationMs, 0);
    }

    return {
      uniqueTests: tests.length,
      passed,
      failed,
      skipped,
      retried,
      flaky,
      passRate: denominator > 0 ? Math.round((passed / denominator) * 1000) / 10 : 100,
      wallClockMs,
      totalCypressMs,
      shardCount: shards.length,
    };
  }

  private extractShardIndex(dir: string): number {
    const m = dir.match(/shard-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
}
