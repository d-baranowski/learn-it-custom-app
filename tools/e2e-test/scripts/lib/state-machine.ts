import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { globSync } from 'node:fs';
import type { ControllerConfig } from './config.js';
import type { ComposeManager } from './docker/compose-manager.js';
import type { HealthChecker } from './docker/health-checker.js';
import type { EnvironmentResetter } from './db/environment-resetter.js';
import type { CypressRunner } from './cypress/cypress-runner.js';
import type { ReportAggregator } from './cypress/report-aggregator.js';
import type { TimelineRecorder } from './timeline/timeline-recorder.js';
import type { SystemMonitor } from './metrics/system-monitor.js';
import type { Logger } from './logger.js';
import { ControllerState, type ContainerInfo, type PortMap, type TestEntry, type TestResult } from './types.js';
import { buildTestEntries } from './parse-tests.js';

const VALID_TRANSITIONS: Record<ControllerState, ControllerState[]> = {
  [ControllerState.INIT]: [ControllerState.DETERMINE_TESTS],
  [ControllerState.DETERMINE_TESTS]: [ControllerState.SETUP_ENV, ControllerState.TEARDOWN],
  [ControllerState.SETUP_ENV]: [ControllerState.HEALTH_CHECK, ControllerState.TEARDOWN],
  [ControllerState.HEALTH_CHECK]: [ControllerState.RUN_TESTS, ControllerState.RECOVER_ENV, ControllerState.TEARDOWN],
  [ControllerState.RUN_TESTS]: [ControllerState.EVALUATE, ControllerState.RECOVER_ENV, ControllerState.TEARDOWN],
  [ControllerState.EVALUATE]: [ControllerState.RESET_ENV, ControllerState.RETRY_FAILED, ControllerState.TEARDOWN],
  [ControllerState.RESET_ENV]: [ControllerState.RETRY_FAILED, ControllerState.RECOVER_ENV, ControllerState.TEARDOWN],
  [ControllerState.RETRY_FAILED]: [ControllerState.EVALUATE, ControllerState.RECOVER_ENV, ControllerState.TEARDOWN],
  [ControllerState.RECOVER_ENV]: [ControllerState.RUN_TESTS, ControllerState.RETRY_FAILED, ControllerState.TEARDOWN],
  [ControllerState.TEARDOWN]: [ControllerState.DONE],
  [ControllerState.DONE]: [],
};

export class ShardStateMachine {
  private state = ControllerState.INIT;
  private testList: TestEntry[] = [];
  private allResults: Map<string, TestResult> = new Map();
  private retryCountPerTest: Map<string, number> = new Map();
  private totalResetDurationMs = 0;
  private failedIds: string[] = [];
  private mutated = false;
  private round = 0;
  private recoveryAttemptThisRound = false;
  private expectedContainers: ContainerInfo[] = [];
  private fatalError: string | null = null;

  private aborted = false;

  abort(): void {
    this.aborted = true;
    this.fatalError = 'Aborted by signal';
  }

  private assertState(condition: boolean, message: string): void {
    if (!condition) {
      const detail = `[${this.state}] ASSERTION FAILED: ${message}`;
      this.log.error(detail);
      this.fatalError = detail;
      throw new Error(detail);
    }
  }

  constructor(
    private readonly config: ControllerConfig,
    private readonly compose: ComposeManager,
    private readonly health: HealthChecker,
    private readonly envResetter: EnvironmentResetter,
    private readonly cypress: CypressRunner,
    private readonly reportAggregator: ReportAggregator,
    private readonly timeline: TimelineRecorder,
    private readonly systemMonitor: SystemMonitor,
    private readonly log: Logger,
    private readonly ports: PortMap,
    private readonly specsRoot: string,
  ) {}

  async run(): Promise<number> {
    while (this.state !== ControllerState.DONE) {
      if (this.aborted && this.state !== ControllerState.TEARDOWN) {
        this.log.warn('Abort requested — skipping to teardown');
        this.transition(ControllerState.TEARDOWN);
        continue;
      }
      try {
        const next = await this.step();
        this.transition(next);
      } catch (err) {
        this.log.error(`State ${this.state} threw: ${err}`);
        if (this.state !== ControllerState.TEARDOWN) {
          this.fatalError = this.fatalError ?? `${err}`;
          this.state = ControllerState.TEARDOWN;
        } else {
          this.state = ControllerState.DONE;
        }
      }
    }

    const passed = [...this.allResults.values()].filter((r) => r.status === 'passed').length;
    const failed = [...this.allResults.values()].filter((r) => r.status === 'failed').length;
    const skipped = [...this.allResults.values()].filter((r) => r.status === 'skipped').length;
    const exitCode = failed > 0 || this.fatalError ? 1 : 0;

    this.systemMonitor.stop();

    const summary = {
      total: this.allResults.size,
      passed,
      failed,
      skipped,
      // Count tests that were actually retried — failedIds only holds the
      // FINAL unresolved failures, so rescued-flaky tests would report 0.
      retried: [...this.retryCountPerTest.values()].filter((n) => n > 0).length,
      specs: new Set([...this.allResults.values()].map((r) => r.spec)).size,
      mutatingRun: this.mutated,
      runReportDirs: this.cypress.getRunDirs(),
    };

    const timeline = this.timeline.finalize(exitCode, summary, this.systemMonitor.getSnapshots());
    this.timeline.writeToFile(this.config.outputPath, timeline);

    this.log.separator();
    this.log.info(`Shard ${this.config.shardIndex}/${this.config.shardCount} — ${summary.total} tests, ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped`);

    this.printTestTable();

    if (this.totalResetDurationMs > 0) {
      this.log.timing('Total time in DB resets', this.totalResetDurationMs);
    }
    if (summary.retried > 0) this.log.info(`${summary.retried} test(s) retried across ${this.round} rounds`);
    this.log.timing('Total wall time', timeline.durationMs);
    this.log.info(`Timeline written to ${this.config.outputPath}`);

    this.writeSummaryMarkdown(summary, timeline.durationMs, exitCode);

    if (exitCode === 0) {
      this.log.success('Shard passed');
    } else {
      this.log.error('Shard failed');
    }

    return exitCode;
  }

  private async step(): Promise<ControllerState> {
    switch (this.state) {
      case ControllerState.INIT:
        return this.init();
      case ControllerState.DETERMINE_TESTS:
        return this.determineTests();
      case ControllerState.SETUP_ENV:
        return this.setupEnv();
      case ControllerState.HEALTH_CHECK:
        return this.healthCheck();
      case ControllerState.RUN_TESTS:
        return await this.runTests();
      case ControllerState.EVALUATE:
        return this.evaluate();
      case ControllerState.RESET_ENV:
        return await this.resetEnv();
      case ControllerState.RETRY_FAILED:
        return await this.retryFailed();
      case ControllerState.RECOVER_ENV:
        return this.recoverEnv();
      case ControllerState.TEARDOWN:
        return this.teardown();
      default:
        return ControllerState.DONE;
    }
  }

  private init(): ControllerState {
    this.timeline.startEvent(ControllerState.INIT);
    this.systemMonitor.start(5_000);
    this.log.info(`E2E Controller — shard ${this.config.shardIndex}/${this.config.shardCount}, max retries: ${this.config.maxRetries}`);
    this.timeline.endEvent({ shardIndex: this.config.shardIndex, shardCount: this.config.shardCount });
    return ControllerState.DETERMINE_TESTS;
  }

  private determineTests(): ControllerState {
    this.timeline.startEvent(ControllerState.DETERMINE_TESTS);
    this.assertState(this.config.shardIndex >= 1, `shardIndex must be >= 1, got ${this.config.shardIndex}`);
    this.assertState(this.config.shardIndex <= this.config.shardCount, `shardIndex ${this.config.shardIndex} > shardCount ${this.config.shardCount}`);
    this.assertState(this.testList.length === 0, 'testList should be empty before DETERMINE_TESTS');

    const specs = globSync('**/*.cy.ts', { cwd: this.specsRoot }).sort();
    const shardSpecs = specs.filter((_, i) => i % this.config.shardCount === this.config.shardIndex - 1);

    for (const rel of shardSpecs) {
      const src = readFileSync(resolve(this.specsRoot, rel), 'utf8');
      this.testList.push(...buildTestEntries(rel, src));
    }

    if (this.config.grep) {
      const grepIds = this.config.grep.split(',').map((s) => s.trim()).filter(Boolean);
      const grepSet = new Set(grepIds);
      const before = this.testList.length;
      this.testList = this.testList.filter((t) => grepSet.has(t.id));
      this.log.info(`--grep filtered ${before} → ${this.testList.length} tests (matched: ${grepIds.join(', ')})`);
    }

    const mutCount = this.testList.filter((t) => t.mutating).length;
    this.log.info(`Resolved ${this.testList.length} tests across ${new Set(this.testList.map((t) => t.spec)).size} specs (${mutCount} mutating)`);
    this.timeline.endEvent({ testCount: this.testList.length, specCount: shardSpecs.length });

    if (this.testList.length === 0) {
      // A shard with no assigned tests (more shards than specs, or a grep
      // that matches nothing on this shard) is a clean no-op, not a failure.
      this.log.warn('No tests found for this shard — exiting clean');
      return ControllerState.TEARDOWN;
    }

    return ControllerState.SETUP_ENV;
  }

  private setupEnv(): ControllerState {
    this.timeline.startEvent(ControllerState.SETUP_ENV);
    this.assertState(this.testList.length > 0, 'testList must not be empty before SETUP_ENV');

    if (this.config.skipSetup) {
      this.log.info('Skipping docker compose up (--skip-setup)');
      try {
        const discovered = this.compose.discoverPorts();
    this.ports.ui = discovered.ui;
    this.ports.bootstrapApi = discovered.bootstrapApi;
        this.expectedContainers = this.compose.listContainers();
        this.log.info(`Discovered ports — UI: ${this.ports.ui}, Bootstrap API: ${this.ports.bootstrapApi}`);
        this.timeline.endEvent({ skipped: true, ports: this.ports });
        return ControllerState.HEALTH_CHECK;
      } catch (err) {
        this.fatalError = `Failed to discover ports on existing stack: ${err}`;
        this.log.error(this.fatalError);
        this.timeline.endEvent({ error: this.fatalError });
        return ControllerState.TEARDOWN;
      }
    }

    try {
      this.log.info('Starting docker compose stack...');
      const upStart = Date.now();
      this.compose.up();
      this.log.timing('Stack started', Date.now() - upStart);
      const discovered = this.compose.discoverPorts();
    this.ports.ui = discovered.ui;
    this.ports.bootstrapApi = discovered.bootstrapApi;
      this.log.info(`Discovered ports — UI: ${this.ports.ui}, Bootstrap API: ${this.ports.bootstrapApi}`);
      this.expectedContainers = this.compose.listContainers();
      this.log.info(`${this.expectedContainers.length} containers running`);
      this.timeline.recordContainers(ControllerState.SETUP_ENV, this.expectedContainers);
      this.timeline.endEvent({ ports: this.ports });
      return ControllerState.HEALTH_CHECK;
    } catch (err) {
      this.fatalError = `Failed to start stack: ${err}`;
      this.log.error(this.fatalError);
      this.timeline.endEvent({ error: this.fatalError });
      return ControllerState.TEARDOWN;
    }
  }

  private async healthCheck(): Promise<ControllerState> {
    this.timeline.startEvent(ControllerState.HEALTH_CHECK);
    this.assertState(this.ports.ui > 0, `UI port must be > 0 before HEALTH_CHECK, got ${this.ports.ui}`);
    this.assertState(this.ports.bootstrapApi > 0, `Bootstrap API port must be > 0 before HEALTH_CHECK, got ${this.ports.bootstrapApi}`);
    this.log.info(`Waiting for services to become ready (timeout: ${this.config.healthTimeout}s)...`);

    if (!this.compose.isRunning()) {
      this.fatalError = 'Stack is not running before health check';
      this.log.error(this.fatalError);
      this.timeline.endEvent({ error: this.fatalError });
      return ControllerState.TEARDOWN;
    }

    try {
      const hcStart = Date.now();
      const snapshot = await this.health.waitForReady();
      this.log.timing('All services healthy', Date.now() - hcStart);
      this.timeline.endEvent({ snapshot });
      return ControllerState.RUN_TESTS;
    } catch (err) {
      this.log.error(`Health check failed: ${err}`);
      this.timeline.endEvent({ error: `${err}` });
      return this.recoveryAttemptThisRound ? ControllerState.TEARDOWN : ControllerState.RECOVER_ENV;
    }
  }

  private async runTests(): Promise<ControllerState> {
    this.timeline.startEvent(ControllerState.RUN_TESTS);
    this.assertState(this.testList.length > 0, 'testList must not be empty before RUN_TESTS');
    this.assertState(this.ports.ui > 0, `UI port must be > 0 before RUN_TESTS, got ${this.ports.ui}`);
    this.assertState(this.ports.bootstrapApi > 0, `Bootstrap API port must be > 0, got ${this.ports.bootstrapApi}`);
    this.assertState(this.round < 100, `round counter is ${this.round} — runaway loop detected`);

    // Probe BEFORE bumping the round: recoverEnv routes on `round === 0` to
    // decide RUN_TESTS vs RETRY_FAILED, so incrementing first would send a
    // pre-first-run health blip into RETRY_FAILED with empty failedIds.
    const preCheck = await this.health.probe();
    if (!preCheck.healthy) {
      this.timeline.endEvent({ healthFailed: true, degraded: preCheck.degraded });
      return ControllerState.RECOVER_ENV;
    }
    this.round++;
    this.recoveryAttemptThisRound = false;

    const specs = [...new Set(this.testList.map((t) => t.spec))];
    // @cypress/grep ORs title substrings on ';'
    const grepPattern = this.config.grep
      ? this.testList.map((t) => t.id).join(';')
      : undefined;
    const result = this.cypress.runAll(specs, this.ports, grepPattern);

    if (result.crashed) {
      this.fatalError = `Cypress crashed (exit code ${result.exitCode}) — check config and logs above`;
      this.timeline.endEvent({ crashed: true, exitCode: result.exitCode, durationMs: result.durationMs });
      return ControllerState.TEARDOWN;
    }

    for (const r of result.results) {
      this.allResults.set(r.id, r);
    }

    const reconciled = this.reconcileMissingResults(result.exitCode);

    const hasMutating = this.testList.some((t) => t.mutating);
    if (hasMutating) this.mutated = true;

    // Record the reconciled failures too — they drive the shard's exit code,
    // and the merged report reads only the timeline. Omitting them lets a red
    // shard aggregate into a green 100% pass.
    this.timeline.recordResults(this.round, [...result.results, ...reconciled]);
    this.timeline.endEvent({ round: this.round, exitCode: result.exitCode, durationMs: result.durationMs });

    this.detectContainerDrift();

    return ControllerState.EVALUATE;
  }

  private evaluate(): ControllerState {
    this.timeline.startEvent(ControllerState.EVALUATE);
    this.assertState(this.round > 0, `round must be > 0 in EVALUATE, got ${this.round}`);
    this.assertState(this.allResults.size > 0, 'allResults must not be empty in EVALUATE');

    const knownTestIds = new Set(this.testList.map((t) => t.id));
    this.failedIds = [...this.allResults.entries()]
      .filter(([id, r]) => r.status === 'failed' && knownTestIds.has(id))
      .map(([id]) => id);

    // A failed result whose title didn't yield a known test ID (e.g.
    // cypress's "uncaught error outside of a test") can never be retried,
    // but it still counts into the shard's exit code — without this check
    // evaluate would report all_passed while the shard exits 1.
    const unmatchedFailures = [...this.allResults.entries()]
      .filter(([id, r]) => r.status === 'failed' && !knownTestIds.has(id))
      .map(([id]) => id);
    if (unmatchedFailures.length > 0) {
      this.fatalError =
        `${unmatchedFailures.length} failed result(s) without a matching test ID (not retryable): ` +
        unmatchedFailures.join(' | ').slice(0, 400);
      this.log.error(this.fatalError);
      this.timeline.endEvent({ round: this.round, decision: 'unmatched_failures', unmatchedFailures });
      return ControllerState.TEARDOWN;
    }

    const data = { failed: this.failedIds.length, round: this.round, retriesRemaining: this.config.maxRetries - this.round + 1 };

    if (this.failedIds.length === 0) {
      this.timeline.endEvent({ ...data, decision: 'all_passed' });
      return ControllerState.TEARDOWN;
    }

    this.logFailedTests();

    if (this.round > this.config.maxRetries) {
      this.logReproCommands();
      this.timeline.endEvent({ ...data, decision: 'retries_exhausted' });
      return ControllerState.TEARDOWN;
    }

    if (this.mutated) {
      this.timeline.endEvent({ ...data, decision: 'reset_then_retry' });
      return ControllerState.RESET_ENV;
    }

    this.timeline.endEvent({ ...data, decision: 'retry_without_reset' });
    return ControllerState.RETRY_FAILED;
  }

  private async resetEnv(): Promise<ControllerState> {
    this.timeline.startEvent(ControllerState.RESET_ENV);
    this.assertState(this.failedIds.length > 0, 'failedIds must not be empty before RESET_ENV');
    this.assertState(this.mutated, 'mutated must be true to enter RESET_ENV');
    this.log.info('Resetting environment before retry...');

    const outcome = await this.envResetter.reset();
    this.totalResetDurationMs += outcome.durationMs;

    if (outcome.success) {
      this.log.timing(`Environment reset (tier: ${outcome.tier})`, outcome.durationMs);
    } else {
      this.fatalError = `Environment reset failed at tier ${outcome.tier}: ${outcome.reason}`;
      this.log.error(this.fatalError);
      this.timeline.endEvent({ outcome });
      return ControllerState.TEARDOWN;
    }

    this.timeline.endEvent({ outcome });
    this.mutated = false;

    this.log.info('Post-reset health check...');
    const postResetHealth = await this.health.probe();
    if (!postResetHealth.healthy) {
      this.log.warn(`Post-reset health degraded: ${postResetHealth.degraded.join(', ')} — attempting recovery`);
      return ControllerState.RECOVER_ENV;
    }
    this.log.info('Post-reset health OK');

    return ControllerState.RETRY_FAILED;
  }

  private async retryFailed(): Promise<ControllerState> {
    this.timeline.startEvent(ControllerState.RETRY_FAILED);
    this.assertState(this.failedIds.length > 0, 'failedIds must not be empty before RETRY_FAILED');
    this.assertState(this.round <= this.config.maxRetries, `round ${this.round} exceeds maxRetries ${this.config.maxRetries}`);
    this.assertState(this.ports.ui > 0, `UI port must be > 0 before RETRY_FAILED, got ${this.ports.ui}`);
    this.assertState(this.ports.bootstrapApi > 0, `Bootstrap API port must be > 0, got ${this.ports.bootstrapApi}`);

    this.log.info('Pre-retry health check...');
    const snapshot = await this.health.probe();
    if (!snapshot.healthy) {
      this.log.warn(`Pre-retry health failed: ${snapshot.degraded.join(', ')}`);
      this.timeline.endEvent({ healthFailed: true, degraded: snapshot.degraded });
      return ControllerState.RECOVER_ENV;
    }
    this.log.info('Pre-retry health OK');
    // Bump the round only once the probe passes — a RECOVER_ENV round-trip
    // re-enters this state and would otherwise double-count the round,
    // burning a retry per recovery.
    this.round++;
    this.recoveryAttemptThisRound = false;

    const result = this.cypress.runByIds(this.failedIds, this.testList, this.ports);

    if (result.crashed) {
      this.fatalError = `Cypress crashed during retry (exit code ${result.exitCode})`;
      this.timeline.endEvent({ crashed: true, exitCode: result.exitCode, durationMs: result.durationMs });
      return ControllerState.TEARDOWN;
    }

    // The rerun greps by ID but still executes whole spec files — a failing
    // before-hook marks grepped-out spec-mates as failed in the results.
    // Only the tests we intended to retry may update state; otherwise a
    // test that already passed gets demoted and re-queued forever.
    const intendedIds = new Set(this.failedIds);
    const intendedResults = result.results.filter((r) => intendedIds.has(r.id));

    for (const r of intendedResults) {
      this.allResults.set(r.id, r);
    }

    for (const id of this.failedIds) {
      this.retryCountPerTest.set(id, (this.retryCountPerTest.get(id) ?? 0) + 1);
    }

    if (intendedResults.some((r) => this.testList.find((t) => t.id === r.id)?.mutating)) {
      this.mutated = true;
    }

    this.timeline.recordResults(this.round, intendedResults);
    this.timeline.endEvent({ round: this.round, retried: this.failedIds, durationMs: result.durationMs });

    this.detectContainerDrift();

    return ControllerState.EVALUATE;
  }

  private async recoverEnv(): Promise<ControllerState> {
    this.timeline.startEvent(ControllerState.RECOVER_ENV);
    this.assertState(!this.recoveryAttemptThisRound, 'already attempted recovery this round — preventing infinite loop');
    this.recoveryAttemptThisRound = true;
    this.log.warn('Environment unhealthy — attempting recovery...');

    const outcome = await this.envResetter.reset();
    this.totalResetDurationMs += outcome.durationMs;

    this.timeline.endEvent({ outcome });

    if (!outcome.success) {
      this.fatalError = `Recovery failed at tier ${outcome.tier}`;
      this.log.error(this.fatalError);
      return ControllerState.TEARDOWN;
    }

    this.log.timing(`Environment recovered (tier: ${outcome.tier})`, outcome.durationMs);
    const discovered = this.compose.discoverPorts();
    this.ports.ui = discovered.ui;
    this.ports.bootstrapApi = discovered.bootstrapApi;
    this.assertState(this.ports.ui > 0, `UI port must be > 0 after recovery, got ${this.ports.ui}`);
    this.assertState(this.ports.bootstrapApi > 0, `Bootstrap API port must be > 0 after recovery, got ${this.ports.bootstrapApi}`);

    this.log.info('Post-recovery health check...');
    const postRecoveryHealth = await this.health.probe();
    this.assertState(postRecoveryHealth.healthy, `Environment not healthy after recovery: ${postRecoveryHealth.degraded.join(', ')}`);
    this.log.info('Post-recovery health OK');

    this.expectedContainers = this.compose.listContainers();
    this.mutated = false;

    if (this.round === 0) {
      return ControllerState.RUN_TESTS;
    }
    return ControllerState.RETRY_FAILED;
  }

  private teardown(): ControllerState {
    this.timeline.startEvent(ControllerState.TEARDOWN);

    const runDirs = this.cypress.getRunDirs();
    if (runDirs.length > 0) {
      this.log.info(`Aggregating reports from ${runDirs.length} run(s)...`);
      this.reportAggregator.aggregate(runDirs, this.config.reportDir);
    }

    if (this.config.skipTeardown) {
      this.log.info('Skipping teardown (--skip-teardown)');
    } else {
      this.log.info('Tearing down docker compose stack...');
      try {
        const tdStart = Date.now();
        this.compose.down();
        this.log.timing('Teardown complete', Date.now() - tdStart);
      } catch {
        this.log.warn('Teardown failed (best-effort, continuing)');
      }
    }

    if (this.fatalError) {
      this.log.error(`Fatal: ${this.fatalError}`);
    }

    this.timeline.endEvent({
      skippedTeardown: this.config.skipTeardown,
      fatalError: this.fatalError,
    });
    return ControllerState.DONE;
  }

  private transition(next: ControllerState): void {
    if (this.aborted && next === ControllerState.TEARDOWN) {
      this.log.state(this.state, next);
      this.state = next;
      return;
    }
    const allowed = VALID_TRANSITIONS[this.state];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid state transition: ${this.state} → ${next}`);
    }
    this.log.state(this.state, next);
    this.state = next;
  }

  private logFailedTests(): void {
    const failed = [...this.allResults.entries()]
      .filter(([, r]) => r.status === 'failed')
      .map(([id, r]) => ({ id, error: r.error }));

    console.error(`\n[controller] ${failed.length} failed test(s) after round ${this.round}:`);
    for (const { id, error } of failed) {
      console.error(`  ✗ ${id}${error ? ` — ${error}` : ''}`);
    }
  }

  private logReproCommands(): void {
    const failedEntries = [...this.allResults.entries()]
      .filter(([, r]) => r.status === 'failed');

    const failedIds = failedEntries.map(([id]) => id);
    const failedSpecs = [...new Set(
      failedIds
        .map((id) => this.testList.find((t) => t.id === id)?.spec)
        .filter(Boolean) as string[],
    )];

    console.error('\n' + '='.repeat(80));
    console.error('[controller] REPRO COMMANDS — run these locally to reproduce failures:');
    console.error('='.repeat(80));

    // One command per failed test
    for (const id of failedIds) {
      const entry = this.testList.find((t) => t.id === id);
      const spec = entry ? ` --spec "${entry.spec}"` : '';
      console.error(`\n  # ${id}`);
      console.error(`  npx cypress run${spec} --expose grep="${id}"`);
    }

    // Combined command to run all failed tests at once
    if (failedIds.length > 1) {
      const grepPattern = failedIds.join(';');
      const specArg = failedSpecs.length > 0 ? ` --spec "${failedSpecs.join(',')}"` : '';
      console.error('\n  # All failed tests in one run');
      console.error(`  npx cypress run${specArg} --expose grep="${grepPattern}",grepFilterSpecs=true`);
    }

    // Interactive mode command
    if (failedIds.length === 1) {
      const entry = this.testList.find((t) => t.id === failedIds[0]);
      const spec = entry ? ` --spec "${entry.spec}"` : '';
      console.error('\n  # Open in interactive mode');
      console.error(`  npx cypress open${spec} --expose grep="${failedIds[0]}"`);
    }

    console.error('\n' + '='.repeat(80) + '\n');
  }

  private printTestTable(): void {
    if (this.allResults.size === 0) return;

    const maxId = Math.max(...[...this.allResults.keys()].map((id) => id.length));

    console.error('');
    const header = `  ${'TEST'.padEnd(maxId)}  ${'STATUS'.padEnd(7)}  ${'TIME'.padStart(7)}  RETRIES`;
    console.error(header);
    console.error(`  ${'-'.repeat(header.length - 2)}`);

    for (const [id, result] of this.allResults) {
      const retries = this.retryCountPerTest.get(id) ?? 0;
      const sec = (result.durationMs / 1000).toFixed(1).padStart(6) + 's';
      const statusIcon = result.status === 'passed' ? '\x1b[32m  pass\x1b[0m ' : result.status === 'failed' ? '\x1b[31m  FAIL\x1b[0m ' : '\x1b[90m  skip\x1b[0m ';
      const retriesStr = retries > 0 ? `  ${retries}` : '  -';
      console.error(`  ${id.padEnd(maxId)} ${statusIcon} ${sec} ${retriesStr}`);
    }
    console.error('');
  }

  private writeSummaryMarkdown(
    summary: { total: number; passed: number; failed: number; skipped: number; retried: number },
    durationMs: number,
    exitCode: number,
  ): void {
    const icon = exitCode === 0 ? ':white_check_mark:' : ':x:';
    const status = exitCode === 0 ? 'PASSED' : 'FAILED';
    const sec = (durationMs / 1000).toFixed(1);
    const lines: string[] = [];

    lines.push(`${icon} **Shard ${this.config.shardIndex}/${this.config.shardCount} — ${status}** (${sec}s)`);
    lines.push('');
    lines.push(`${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped out of ${summary.total} tests`);
    if (summary.retried > 0) lines.push(`${summary.retried} test(s) retried across ${this.round} rounds`);
    if (this.totalResetDurationMs > 0) lines.push(`DB reset time: ${(this.totalResetDurationMs / 1000).toFixed(1)}s`);
    lines.push('');

    lines.push('| Test | Status | Time | Retries |');
    lines.push('|------|--------|------|---------|');
    for (const [id, result] of this.allResults) {
      const retries = this.retryCountPerTest.get(id) ?? 0;
      const time = `${(result.durationMs / 1000).toFixed(1)}s`;
      const statusStr = result.status === 'passed' ? ':white_check_mark:' : result.status === 'failed' ? ':x:' : ':fast_forward:';
      lines.push(`| ${id} | ${statusStr} | ${time} | ${retries > 0 ? retries : '-'} |`);
    }

    if (this.failedIds.length > 0) {
      lines.push('');
      lines.push('**Repro commands:**');
      lines.push('```');
      for (const id of this.failedIds) {
        const entry = this.testList.find((t) => t.id === id);
        const spec = entry ? ` --spec "${entry.spec}"` : '';
        lines.push(`npx cypress run${spec} --env grep="${id}"`);
      }
      lines.push('```');
    }

    const md = lines.join('\n') + '\n';
    const summaryPath = resolve(dirname(this.config.outputPath), 'shard-summary.md');
    writeFileSync(summaryPath, md);
    this.log.info(`Summary written to ${summaryPath}`);
  }

  private reconcileMissingResults(cypressExitCode: number): TestResult[] {
    if (cypressExitCode === 0) return [];

    const parsedIds = new Set(this.allResults.keys());
    const missing = this.testList.filter((t) => !parsedIds.has(t.id));
    if (missing.length === 0) return [];

    this.log.warn(`${missing.length} test(s) missing from report — marking as failed`);
    const reconciled: TestResult[] = [];
    for (const t of missing) {
      this.log.warn(`  missing: ${t.id} (${t.spec})`);
      const result: TestResult = {
        id: t.id,
        spec: t.spec,
        status: 'failed',
        durationMs: 0,
        error:
          'no result recorded — spec likely aborted before this test ran ' +
          '(failed before/beforeEach hook skips the rest of the suite) or the reporter lost it',
      };
      this.allResults.set(t.id, result);
      reconciled.push(result);
    }
    return reconciled;
  }

  private detectContainerDrift(): void {
    const current = this.compose.listContainers();
    for (const expected of this.expectedContainers) {
      const match = current.find((c) => c.name === expected.name);
      if (!match) {
        this.timeline.recordDrift(expected.name, 'running', 'missing');
      } else if (match.id !== expected.id) {
        this.timeline.recordDrift(expected.name, `id:${expected.id}`, `id:${match.id}`);
      } else if (match.status !== expected.status && !match.status.includes('running')) {
        this.timeline.recordDrift(expected.name, expected.status, match.status);
      }
    }
    this.expectedContainers = current;
  }
}
