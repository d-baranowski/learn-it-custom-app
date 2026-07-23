export class ControllerConfig {
  readonly shardIndex: number;
  readonly shardCount: number;
  readonly composeFiles: string[];
  readonly project: string;
  readonly maxRetries: number;
  readonly outputPath: string;
  readonly reportDir: string;
  readonly healthTimeout: number;
  readonly skipSetup: boolean;
  readonly skipTeardown: boolean;
  readonly grep: string | null;
  readonly video: boolean;

  private constructor(opts: {
    shardIndex: number;
    shardCount: number;
    composeFiles: string[];
    project: string;
    maxRetries: number;
    outputPath: string;
    reportDir: string;
    healthTimeout: number;
    skipSetup: boolean;
    skipTeardown: boolean;
    grep: string | null;
    video: boolean;
  }) {
    this.shardIndex = opts.shardIndex;
    this.shardCount = opts.shardCount;
    this.composeFiles = opts.composeFiles;
    this.project = opts.project;
    this.maxRetries = opts.maxRetries;
    this.outputPath = opts.outputPath;
    this.reportDir = opts.reportDir;
    this.healthTimeout = opts.healthTimeout;
    this.skipSetup = opts.skipSetup;
    this.skipTeardown = opts.skipTeardown;
    this.grep = opts.grep;
    this.video = opts.video;
  }

  static fromArgs(argv: string[]): ControllerConfig {
    function getFlag(name: string): string | null {
      const idx = argv.indexOf(`--${name}`);
      if (idx === -1) return null;
      return argv[idx + 1] ?? null;
    }

    function getAllFlags(name: string): string[] {
      const values: string[] = [];
      for (let i = 0; i < argv.length; i++) {
        if (argv[i] === `--${name}` && argv[i + 1]) {
          values.push(argv[i + 1]);
        }
      }
      return values;
    }

    const shardArg = getFlag('shard');
    if (!shardArg || !shardArg.includes('/')) {
      throw new Error('--shard N/M is required (e.g. --shard 3/32)');
    }

    const [nStr, mStr] = shardArg.split('/');
    const shardIndex = parseInt(nStr, 10);
    const shardCount = parseInt(mStr, 10);

    if (isNaN(shardIndex) || isNaN(shardCount) || shardIndex < 1 || shardIndex > shardCount) {
      throw new Error(`--shard N/M requires 1 <= N <= M, got ${shardArg}`);
    }

    const composeFiles = getAllFlags('compose-file');
    if (composeFiles.length === 0) {
      composeFiles.push('docker-compose.yml');
    }

    return new ControllerConfig({
      shardIndex,
      shardCount,
      composeFiles,
      project: getFlag('project') ?? `utro-e2e-shard-${shardIndex}`,
      maxRetries: parseInt(getFlag('max-retries') ?? '2', 10),
      outputPath: getFlag('output') ?? 'shard-timeline.json',
      reportDir: getFlag('report-dir') ?? 'cypress/reports',
      healthTimeout: parseInt(getFlag('health-timeout') ?? '120', 10),
      skipSetup: argv.includes('--skip-setup'),
      skipTeardown: argv.includes('--skip-teardown'),
      grep: getFlag('grep') ?? null,
      video: argv.includes('--video'),
    });
  }

  composeFileArgs(): string {
    return this.composeFiles.map((f) => `-f ${f}`).join(' ');
  }
}
