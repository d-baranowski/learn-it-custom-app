import type { ComposeManager } from '../docker/compose-manager.js';
import type { HealthChecker } from '../docker/health-checker.js';
import type { TimelineRecorder } from '../timeline/timeline-recorder.js';
import { ControllerState, type PortMap, type ResetOutcome } from '../types.js';
import type { DatabaseResetter } from './database-resetter.js';

const RESTART_SERVICES = ['postgres', 'core', 'payment', 'notification', 'core-event', 'gateway', 'bootstrap-api'];

export class EnvironmentResetter {
  constructor(
    private readonly dbResetter: DatabaseResetter,
    private readonly compose: ComposeManager,
    private readonly health: HealthChecker,
    private readonly timeline: TimelineRecorder,
    private readonly ports: PortMap,
  ) {}

  private rediscoverPorts(): void {
    try {
      const discovered = this.compose.discoverPorts();
      this.ports.ui = discovered.ui;
      this.ports.bootstrapApi = discovered.bootstrapApi;
    } catch {
      // ports may not be available yet — health checker will catch it
    }
  }

  async reset(): Promise<ResetOutcome> {
    const start = Date.now();

    // Tier 1: API reset
    const tier1 = await this.tryApiReset();
    if (tier1.success) {
      return { tier: 'api', success: true, durationMs: Date.now() - start };
    }

    // Tier 2: Compose restart + API reset
    const tier2 = await this.tryComposeRestart(tier1.reason);
    if (tier2.success) {
      return { tier: 'compose-restart', success: true, durationMs: Date.now() - start, reason: tier1.reason };
    }

    // Tier 3: Full recreate
    const tier3 = await this.tryComposeRecreate(tier2.reason);
    return {
      tier: 'compose-recreate',
      success: tier3.success,
      durationMs: Date.now() - start,
      reason: tier2.reason,
    };
  }

  // Tier events use timeline.record (instant push) rather than
  // startEvent/endEvent: the state machine already holds the open
  // RESET_ENV/RECOVER_ENV event, and startEvent here would silently close
  // it — which is how escalation outcomes used to vanish from timelines.
  private async tryApiReset(): Promise<{ success: boolean; reason?: string }> {
    const result = await this.dbResetter.resetWithRetry(3);
    if (!result.success) {
      this.timeline.record(ControllerState.RESET_ENV, { tier: 'api', success: false, durationMs: result.durationMs });
      return { success: false, reason: `API reset failed after 3 attempts (${result.durationMs}ms)` };
    }

    this.compose.restart(['bootstrap-api']);

    // Poll until healthy — a single instant probe right after the restart
    // always caught bootstrap-api mid-boot and needlessly escalated every
    // tier-1 reset into a ~20s compose-restart (PR-166 build 59).
    try {
      await this.health.waitForReady();
    } catch (err) {
      this.timeline.record(ControllerState.RESET_ENV, { tier: 'api', success: false, reason: `${err}` });
      return { success: false, reason: `Health check failed after API reset: ${err}` };
    }

    this.timeline.record(ControllerState.RESET_ENV, { tier: 'api', success: true, durationMs: result.durationMs });
    return { success: true };
  }

  private async tryComposeRestart(escalationReason?: string): Promise<{ success: boolean; reason?: string }> {
    const containersBefore = this.compose.listContainers();
    this.timeline.recordContainers(ControllerState.RESET_ENV, containersBefore);

    this.compose.restart(RESTART_SERVICES);
    this.rediscoverPorts();

    try {
      await this.health.waitForReady();
    } catch {
      this.timeline.record(ControllerState.RESET_ENV, { tier: 'compose-restart', success: false, escalationReason, reason: 'not ready' });
      return { success: false, reason: 'Services did not become ready after compose restart' };
    }

    const apiResult = await this.dbResetter.resetWithRetry(3);
    if (!apiResult.success) {
      this.timeline.record(ControllerState.RESET_ENV, { tier: 'compose-restart', success: false, escalationReason, reason: 'api reset failed' });
      return { success: false, reason: 'API reset failed after compose restart' };
    }

    const snapshot = await this.health.probe();
    if (!snapshot.healthy) {
      this.timeline.record(ControllerState.RESET_ENV, {
        tier: 'compose-restart',
        success: false,
        escalationReason,
        degraded: snapshot.degraded,
      });
      return { success: false, reason: `Health degraded after restart+reset: ${snapshot.degraded.join(', ')}` };
    }

    this.timeline.record(ControllerState.RESET_ENV, {
      tier: 'compose-restart',
      success: true,
      escalationReason,
      durationMs: apiResult.durationMs,
    });
    return { success: true };
  }

  private async tryComposeRecreate(escalationReason?: string): Promise<{ success: boolean }> {
    const containersBefore = this.compose.listContainers();
    this.timeline.recordContainers(ControllerState.RESET_ENV, containersBefore);

    this.compose.recreate();
    this.rediscoverPorts();

    try {
      await this.health.waitForReady();
    } catch {
      this.timeline.record(ControllerState.RESET_ENV, { tier: 'compose-recreate', success: false, escalationReason });
      return { success: false };
    }

    const containersAfter = this.compose.listContainers();
    this.timeline.record(ControllerState.RESET_ENV, {
      tier: 'compose-recreate',
      success: true,
      escalationReason,
      containersKilled: containersBefore.map((c) => c.id),
      containersStarted: containersAfter.map((c) => c.id),
    });
    return { success: true };
  }
}
