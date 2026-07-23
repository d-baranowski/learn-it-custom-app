import type { ControllerConfig } from '../config.js';
import type { ContainerInfo, IShell, PortMap } from '../types.js';

export class ComposeManager {
  constructor(
    private readonly shell: IShell,
    private readonly config: ControllerConfig,
  ) {}

  up(): void {
    this.composeStream('up -d --force-recreate --wait');
  }

  down(): void {
    this.composeStream('down -v --remove-orphans');
  }

  restart(services?: string[]): void {
    const svcArgs = services ? services.join(' ') : '';
    this.composeStream(`restart ${svcArgs}`);
  }

  recreate(): void {
    this.down();
    this.up();
  }

  discoverPorts(): PortMap {
    const uiLine = this.compose('port ui 3000');
    const bsLine = this.compose('port bootstrap-api 8080');
    return {
      ui: this.extractPort(uiLine),
      bootstrapApi: this.extractPort(bsLine),
    };
  }

  listContainers(): ContainerInfo[] {
    const { stdout, exitCode } = this.shell.execCode(this.baseCmd('ps --format json'));
    if (exitCode !== 0 || !stdout.trim()) return [];

    // `ps --format json` emits NDJSON on current compose v2, but a single
    // JSON array on older releases — accept both, skip unparseable lines.
    const trimmed = stdout.trim();
    let raws: Record<string, string>[];
    if (trimmed.startsWith('[')) {
      try {
        raws = JSON.parse(trimmed) as Record<string, string>[];
      } catch {
        raws = [];
      }
    } else {
      raws = trimmed
        .split('\n')
        .filter(Boolean)
        .flatMap((line) => {
          try {
            return [JSON.parse(line) as Record<string, string>];
          } catch {
            return [];
          }
        });
    }

    return raws.map((raw) => ({
      name: raw.Service ?? raw.Name ?? '',
      id: raw.ID ?? '',
      status: raw.State ?? '',
      health: raw.Health || undefined,
    }));
  }

  isRunning(): boolean {
    const containers = this.listContainers();
    const required = ['ui', 'core', 'gateway', 'bootstrap-api'];
    return required.every((svc) =>
      containers.some((c) => c.name === svc && c.status === 'running'),
    );
  }

  execInContainer(service: string, cmd: string): { stdout: string; exitCode: number } {
    return this.shell.execCode(this.baseCmd(`exec -T ${service} ${cmd}`));
  }

  private composeStream(subcommand: string): void {
    const { exitCode } = this.shell.execStream(this.baseCmd(subcommand), { timeout: 120_000 });
    if (exitCode !== 0) {
      throw new Error(`docker compose ${subcommand.split(' ')[0]} failed with exit code ${exitCode}`);
    }
  }

  private compose(subcommand: string, opts?: { timeout?: number }): string {
    return this.shell.exec(this.baseCmd(subcommand), { timeout: opts?.timeout ?? 120_000 });
  }

  private baseCmd(subcommand: string): string {
    return `docker compose -p ${this.config.project} ${this.config.composeFileArgs()} ${subcommand}`;
  }

  private extractPort(line: string): number {
    const port = parseInt(line.split(':').pop()?.trim() ?? '', 10);
    if (isNaN(port)) {
      throw new Error(`Failed to parse port from: ${line}`);
    }
    return port;
  }
}
