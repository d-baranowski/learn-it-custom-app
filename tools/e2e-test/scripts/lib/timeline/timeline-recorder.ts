import { writeFileSync } from 'node:fs';
import type {
  ControllerState,
  ContainerInfo,
  ShardSummary,
  ShardTimeline,
  SystemSnapshot,
  TestResult,
  TimelineEvent,
} from '../types.js';

export class TimelineRecorder {
  private readonly events: TimelineEvent[] = [];
  private readonly startedAt: string;
  private currentEvent: { state: ControllerState; startedAt: string } | null = null;
  private shardIndex: number;
  private shardCount: number;

  constructor(shardIndex: number, shardCount: number) {
    this.shardIndex = shardIndex;
    this.shardCount = shardCount;
    this.startedAt = new Date().toISOString();
  }

  startEvent(state: ControllerState): void {
    if (this.currentEvent) {
      this.endEvent();
    }
    this.currentEvent = { state, startedAt: new Date().toISOString() };
  }

  endEvent(data?: Record<string, unknown>): void {
    if (!this.currentEvent) return;
    const durationMs = Date.now() - new Date(this.currentEvent.startedAt).getTime();
    this.events.push({
      state: this.currentEvent.state,
      startedAt: this.currentEvent.startedAt,
      durationMs,
      data,
    });
    this.currentEvent = null;
  }

  /**
   * Push an instant event without touching the open start/end event pair.
   * Nested phases (e.g. reset tiers inside RESET_ENV) must use this —
   * calling startEvent mid-phase silently closes the caller's open event.
   */
  record(state: ControllerState, data: Record<string, unknown>): void {
    this.events.push({
      state,
      startedAt: new Date().toISOString(),
      durationMs: 0,
      data,
    });
  }

  recordContainers(state: ControllerState, containers: ContainerInfo[]): void {
    this.events.push({
      state,
      startedAt: new Date().toISOString(),
      durationMs: 0,
      data: { containers },
    });
  }

  recordResults(round: number, results: TestResult[]): void {
    this.events.push({
      state: round === 1 ? 'RUN_TESTS' as ControllerState : 'RETRY_FAILED' as ControllerState,
      startedAt: new Date().toISOString(),
      durationMs: 0,
      data: { round, results },
    });
  }

  recordDrift(container: string, expected: string, actual: string, exitCode?: number): void {
    this.events.push({
      state: 'RECOVER_ENV' as ControllerState,
      startedAt: new Date().toISOString(),
      durationMs: 0,
      data: {
        event: 'CONTAINER_DRIFT',
        container,
        expected,
        actual,
        exitCode,
      },
    });
  }

  finalize(exitCode: number, summary: ShardSummary, systemMetrics: SystemSnapshot[] = []): ShardTimeline {
    if (this.currentEvent) {
      this.endEvent();
    }
    const finishedAt = new Date().toISOString();
    return {
      shard: { index: this.shardIndex, count: this.shardCount },
      startedAt: this.startedAt,
      finishedAt,
      durationMs: Date.now() - new Date(this.startedAt).getTime(),
      exitCode,
      events: this.events,
      summary,
      systemMetrics,
    };
  }

  writeToFile(path: string, timeline: ShardTimeline): void {
    writeFileSync(path, JSON.stringify(timeline, null, 2) + '\n');
  }
}
