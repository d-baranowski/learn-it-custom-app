import { request } from 'node:http';
import type { ComposeManager } from './compose-manager.js';
import { ServiceStatus, type HealthSnapshot, type PortMap } from '../types.js';

interface ServiceEndpoint {
  name: string;
  port: number;
  path: string;
}

const POLL_INTERVAL_MS = 2_000;

// Long-running backend services with no host-mapped port — unreachable over
// HTTP from the controller, so their container state is the health signal.
// Catches crash-loops that a ui+bootstrap-api-only probe misses entirely.
const CONTAINER_CHECKED_SERVICES = ['core', 'gateway', 'payment', 'notification', 'core-event'];

// Full auth round-trip against the UI BFF (UI -> gateway -> core -> seeded DB).
// A wiped-but-unseeded DB after a failed reset leaves every socket up but login
// returning 500 — the exact failure the socket/container probes cannot see.
// Credentials mirror the Cypress `login` command defaults.
const LOGIN_PATH = '/api/auth/login';
const LOGIN_ACCOUNT = 'admin';
const LOGIN_PASSWORD = 'Password1!';
const AUTH_COOKIE_NAME = 'RPG_AUTH_TOKEN';
const LOGIN_TIMEOUT_MS = 10_000;

export class HealthChecker {
  constructor(
    private readonly compose: ComposeManager,
    private readonly ports: PortMap,
    private readonly timeoutSeconds: number,
  ) {}

  private getEndpoints(): ServiceEndpoint[] {
    return [
      { name: 'ui', port: this.ports.ui, path: '/' },
      { name: 'bootstrap-api', port: this.ports.bootstrapApi, path: '/bootstrap.v1.BootstrapService/' },
    ];
  }

  async waitForReady(): Promise<HealthSnapshot> {
    const deadline = Date.now() + this.timeoutSeconds * 1_000;

    while (Date.now() < deadline) {
      const snapshot = await this.probe();
      if (snapshot.healthy) return snapshot;
      await this.sleep(POLL_INTERVAL_MS);
    }

    const finalSnapshot = await this.probe();
    if (!finalSnapshot.healthy) {
      throw new Error(
        `Health check timed out after ${this.timeoutSeconds}s. Degraded: ${finalSnapshot.degraded.join(', ')}`,
      );
    }
    return finalSnapshot;
  }

  async probe(): Promise<HealthSnapshot> {
    const services: Record<string, ServiceStatus> = {};
    const degraded: string[] = [];

    const pgStatus = await this.checkPostgres();
    services['postgres'] = pgStatus;
    if (pgStatus !== ServiceStatus.HEALTHY) degraded.push('postgres');

    const checks = this.getEndpoints().map(async (ep) => {
      const status = await this.checkHttp(ep.port, ep.path);
      services[ep.name] = status;
      if (status !== ServiceStatus.HEALTHY) degraded.push(ep.name);
    });
    await Promise.all(checks);

    const containers = this.compose.listContainers();
    for (const name of CONTAINER_CHECKED_SERVICES) {
      const container = containers.find((c) => c.name === name);
      const status =
        container === undefined
          ? ServiceStatus.UNREACHABLE
          : container.status === 'running'
            ? ServiceStatus.HEALTHY
            : ServiceStatus.UNHEALTHY;
      services[name] = status;
      if (status !== ServiceStatus.HEALTHY) degraded.push(name);
    }

    // Gate on a real login last: only meaningful once the sockets above are up,
    // and it's the check that proves the DB was actually reseeded.
    const authStatus = await this.checkLogin(this.ports.ui);
    services['auth'] = authStatus;
    if (authStatus !== ServiceStatus.HEALTHY) degraded.push('auth');

    return {
      timestamp: new Date().toISOString(),
      services,
      healthy: degraded.length === 0,
      degraded,
    };
  }

  private async checkHttp(port: number, path: string): Promise<ServiceStatus> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(ServiceStatus.UNREACHABLE), 5_000);

      const req = request(
        { hostname: 'localhost', port, path, method: 'GET', timeout: 4_000 },
        (res) => {
          clearTimeout(timeout);
          const code = res.statusCode ?? 0;
          // bootstrap-api returns 404 on root (Connect RPC) but socket is up
          resolve(code < 500 ? ServiceStatus.HEALTHY : ServiceStatus.UNHEALTHY);
          res.resume();
        },
      );

      req.on('error', () => {
        clearTimeout(timeout);
        resolve(ServiceStatus.UNREACHABLE);
      });

      req.on('timeout', () => {
        clearTimeout(timeout);
        req.destroy();
        resolve(ServiceStatus.UNREACHABLE);
      });

      req.end();
    });
  }

  private async checkLogin(port: number): Promise<ServiceStatus> {
    if (!port) return ServiceStatus.UNREACHABLE;

    const payload = JSON.stringify({
      data: { account: LOGIN_ACCOUNT, password: LOGIN_PASSWORD, usingEmail: false },
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(ServiceStatus.UNREACHABLE), LOGIN_TIMEOUT_MS + 1_000);

      const req = request(
        {
          hostname: 'localhost',
          port,
          path: LOGIN_PATH,
          method: 'POST',
          timeout: LOGIN_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          clearTimeout(timeout);
          res.resume();
          if (res.statusCode !== 200) {
            // A 500 here is the wiped-but-unseeded DB — the socket is up but
            // auth is broken, so the environment is NOT ready to serve tests.
            resolve(ServiceStatus.UNHEALTHY);
            return;
          }
          resolve(
            this.hasAuthCookie(res.headers['set-cookie'])
              ? ServiceStatus.HEALTHY
              : ServiceStatus.UNHEALTHY,
          );
        },
      );

      req.on('error', () => {
        clearTimeout(timeout);
        resolve(ServiceStatus.UNREACHABLE);
      });

      req.on('timeout', () => {
        clearTimeout(timeout);
        req.destroy();
        resolve(ServiceStatus.UNREACHABLE);
      });

      req.write(payload);
      req.end();
    });
  }

  private hasAuthCookie(setCookie: string | string[] | undefined): boolean {
    if (!setCookie) return false;
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    return cookies.some((c) => {
      const match = new RegExp(`^${AUTH_COOKIE_NAME}=([^;]*)`).exec(c);
      return match !== null && match[1].length > 0;
    });
  }

  private async checkPostgres(): Promise<ServiceStatus> {
    const { exitCode } = this.compose.execInContainer('postgres', 'pg_isready -U postgres');
    if (exitCode === 0) return ServiceStatus.HEALTHY;
    return ServiceStatus.UNHEALTHY;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
