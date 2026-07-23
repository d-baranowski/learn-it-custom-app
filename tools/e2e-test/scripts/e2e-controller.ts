#!/usr/bin/env tsx
import { chmodSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ControllerConfig } from './lib/config.js';
import { Shell } from './lib/process/shell.js';
import { ComposeManager } from './lib/docker/compose-manager.js';
import { HealthChecker } from './lib/docker/health-checker.js';
import { DatabaseResetter } from './lib/db/database-resetter.js';
import { EnvironmentResetter } from './lib/db/environment-resetter.js';
import { CypressRunner } from './lib/cypress/cypress-runner.js';
import { ReportAggregator } from './lib/cypress/report-aggregator.js';
import { ResultParser } from './lib/cypress/result-parser.js';
import { TimelineRecorder } from './lib/timeline/timeline-recorder.js';
import { ShardStateMachine } from './lib/state-machine.js';
import { SystemMonitor } from './lib/metrics/system-monitor.js';
import { Logger } from './lib/logger.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPECS_ROOT = resolve(SCRIPT_DIR, '..', 'cypress', 'e2e');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: tsx scripts/e2e-controller.ts [options]

Options:
  --shard <N/M>              Shard index / total (required, e.g. 3/32)
  --compose-file <file>      Compose file (repeatable, default: docker-compose.yml)
  --project <name>           Compose project name (default: utro-e2e-shard-N)
  --max-retries <n>          Max retry rounds for failed tests (default: 2)
  --output <path>            Timeline JSON output path (default: shard-timeline.json)
  --report-dir <path>        Cypress report directory (default: cypress/reports)
  --health-timeout <seconds> Health check timeout (default: 120)
  --grep <ids>               Run only these test IDs (comma-separated, e.g. CUS_E2E_01,SES_E2E_07)
  --skip-setup               Skip docker compose up (use existing stack)
  --skip-teardown            Skip docker compose down after run
  --video                    Record Cypress video (kept only for failing specs)
  -h, --help                 Show this help`);
  process.exit(0);
}

async function main(): Promise<void> {
  const config = ControllerConfig.fromArgs(args);
  const log = new Logger();

  // Backend log persistence: services bind-mount ${E2E_LOG_DIR} to /var/log/utro
  // and write their logs there (docker-compose.yml). A host bind mount survives
  // `down -v` and recreation, so the logs are still on disk under the shard's
  // report dir after teardown, ready to fold into the report. Pre-create it
  // world-writable — containers run as non-root uids that must be able to write.
  // Wipe first: CI workspaces persist between builds and postgres appends to
  // an existing log file, keeping whatever mode it was created with — a stale
  // 0600 file from an old build stays unreadable to the CI user forever and
  // breaks archiving (log_file_mode only applies to newly created files).
  const logDir = resolve(process.cwd(), config.reportDir, 'backend-logs');
  rmSync(logDir, { recursive: true, force: true });
  mkdirSync(logDir, { recursive: true });
  chmodSync(logDir, 0o777);
  process.env.E2E_LOG_DIR = logDir;
  log.info(`Backend logs → ${logDir}`);

  const shell = new Shell();
  const compose = new ComposeManager(shell, config);

  const ports: { ui: number; bootstrapApi: number } = config.skipSetup
    ? compose.discoverPorts()
    : { ui: 0, bootstrapApi: 0 };

  const timeline = new TimelineRecorder(config.shardIndex, config.shardCount);
  const health = new HealthChecker(compose, ports, config.healthTimeout);
  const dbResetter = new DatabaseResetter(ports);
  const envResetter = new EnvironmentResetter(dbResetter, compose, health, timeline, ports);
  const parser = new ResultParser();
  const cypress = new CypressRunner(shell, config, parser, log);
  const reportAggregator = new ReportAggregator(shell, log);
  const systemMonitor = new SystemMonitor(shell);

  const machine = new ShardStateMachine(
    config,
    compose,
    health,
    envResetter,
    cypress,
    reportAggregator,
    timeline,
    systemMonitor,
    log,
    ports,
    SPECS_ROOT,
  );

  let interrupted = false;

  function onSignal(signal: string): void {
    if (interrupted) return;
    interrupted = true;
    log.warn(`Received ${signal} — will clean up after current operation`);
    machine.abort();
  }

  process.on('SIGINT', () => onSignal('SIGINT'));
  process.on('SIGTERM', () => onSignal('SIGTERM'));

  const exitCode = await machine.run();
  normalizeLogPerms(logDir, shell, log);
  process.exit(exitCode);
}

// Postgres writes postgres.log as its container uid (999) with a mode the CI
// host user may not be able to read, which breaks the Jenkins cache-mirror cp
// and archiveArtifacts. Only root can chmod a foreign-owned file, so normalise
// the whole backend-logs tree from a throwaway root container after teardown.
// Best-effort — a normalisation hiccup must never fail the shard.
function normalizeLogPerms(logDir: string, shell: Shell, log: Logger): void {
  const { exitCode } = shell.execCode(
    `docker run --rm -v "${logDir}:/logs" alpine:3.20 chmod -R a+rX /logs`,
  );
  if (exitCode !== 0) {
    log.warn(`Backend-log permission normalisation failed (exit ${exitCode}) — archiving may skip unreadable files`);
  }
}

main().catch((err) => {
  console.error('Controller fatal error:', err);
  process.exit(1);
});
