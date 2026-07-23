import { request } from 'node:http';
import type { PortMap } from '../types.js';

const ADMIN_USER_ID = '2imfnAVjkbfcwEos1LLLztn1vEP';

export class DatabaseResetter {
  constructor(private readonly ports: PortMap) {}

  private get bootstrapBaseUrl(): string {
    return `http://localhost:${this.ports.bootstrapApi}`;
  }

  async reset(): Promise<{ success: boolean; durationMs: number }> {
    const start = Date.now();
    const success = await this.callResetApi();
    return { success, durationMs: Date.now() - start };
  }

  async resetWithRetry(maxAttempts: number): Promise<{ success: boolean; durationMs: number }> {
    const start = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const success = await this.callResetApi();
      if (success) {
        await this.sleep(2_000);
        return { success: true, durationMs: Date.now() - start };
      }

      if (attempt < maxAttempts) {
        await this.sleep(3_000 + attempt * 2_000);
      }
    }

    return { success: false, durationMs: Date.now() - start };
  }

  private callResetApi(): Promise<boolean> {
    const url = new URL('/bootstrap.v1.BootstrapService/ResetDatabase', this.bootstrapBaseUrl);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 60_000);

      const req = request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'X-User-Id': ADMIN_USER_ID,
            'Content-Type': 'application/json',
          },
          timeout: 55_000,
        },
        (res) => {
          clearTimeout(timeout);
          resolve(res.statusCode === 200 || res.statusCode === 201);
          res.resume();
        },
      );

      req.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      req.on('timeout', () => {
        clearTimeout(timeout);
        req.destroy();
        resolve(false);
      });

      req.write('{}');
      req.end();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
