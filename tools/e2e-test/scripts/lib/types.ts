export enum ControllerState {
  INIT = 'INIT',
  DETERMINE_TESTS = 'DETERMINE_TESTS',
  SETUP_ENV = 'SETUP_ENV',
  HEALTH_CHECK = 'HEALTH_CHECK',
  RUN_TESTS = 'RUN_TESTS',
  EVALUATE = 'EVALUATE',
  RESET_ENV = 'RESET_ENV',
  RETRY_FAILED = 'RETRY_FAILED',
  RECOVER_ENV = 'RECOVER_ENV',
  TEARDOWN = 'TEARDOWN',
  DONE = 'DONE',
}

export enum ServiceStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  UNREACHABLE = 'unreachable',
}

export type TestStatus = 'passed' | 'failed' | 'skipped';

export type ResetTier = 'api' | 'compose-restart' | 'compose-recreate';

export interface TestEntry {
  id: string;
  spec: string;
  title: string;
  mutating: boolean;
  tags: string[];
}

export interface TestResult {
  id: string;
  spec: string;
  status: TestStatus;
  durationMs: number;
  error?: string;
}

export interface ContainerInfo {
  name: string;
  id: string;
  status: string;
  health?: string;
}

export interface PortMap {
  ui: number;
  bootstrapApi: number;
}

export interface HealthSnapshot {
  timestamp: string;
  services: Record<string, ServiceStatus>;
  healthy: boolean;
  degraded: string[];
}

export interface ResetOutcome {
  tier: ResetTier;
  success: boolean;
  durationMs: number;
  reason?: string;
}

export interface TimelineEvent {
  state: ControllerState;
  startedAt: string;
  durationMs: number;
  data?: Record<string, unknown>;
}

export interface ShardSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  retried: number;
  specs: number;
  mutatingRun: boolean;
  runReportDirs: string[];
}

export interface SystemSnapshot {
  timestamp: string;
  cpu: { usagePercent: number; loadAvg: [number, number, number] };
  memory: { totalMb: number; usedMb: number; freeMb: number; usagePercent: number };
  disk: { totalGb: number; usedGb: number; availableGb: number; usagePercent: number };
}

export interface ShardTimeline {
  shard: { index: number; count: number };
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number;
  events: TimelineEvent[];
  summary: ShardSummary;
  systemMetrics: SystemSnapshot[];
}

export interface LogInfo {
  // Path to the generated viewer page, relative to the merged report root.
  path: string;
  sizeBytes: number;
  lineCount: number;
  services: string[];
  hadFailures: boolean;
}

export interface CypressRunResult {
  exitCode: number;
  results: TestResult[];
  durationMs: number;
  crashed?: boolean;
}

export interface IShell {
  exec(cmd: string, opts?: { timeout?: number; cwd?: string }): string;
  execCode(cmd: string, opts?: { timeout?: number; cwd?: string }): { stdout: string; exitCode: number };
  execStream(cmd: string, opts?: { timeout?: number; cwd?: string }): { exitCode: number; signal?: string };
}
