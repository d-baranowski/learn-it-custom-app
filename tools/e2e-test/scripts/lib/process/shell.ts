import { execSync, spawnSync } from 'node:child_process';
import type { IShell } from '../types.js';

export class Shell implements IShell {
  exec(cmd: string, opts?: { timeout?: number; cwd?: string }): string {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: opts?.timeout ?? 120_000,
      cwd: opts?.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  }

  execCode(cmd: string, opts?: { timeout?: number; cwd?: string }): { stdout: string; exitCode: number } {
    try {
      const stdout = this.exec(cmd, opts);
      return { stdout, exitCode: 0 };
    } catch (err: unknown) {
      const e = err as { status?: number; stdout?: string | Buffer };
      return {
        stdout: (e.stdout ?? '').toString().trim(),
        exitCode: e.status ?? 1,
      };
    }
  }

  execStream(cmd: string, opts?: { timeout?: number; cwd?: string }): { exitCode: number; signal?: string } {
    // detached: the command gets its own process group, so a timeout can
    // reap the whole tree — killing only the sh wrapper used to leave
    // cypress/electron grandchildren running as zombies.
    const result = spawnSync(cmd, {
      shell: true,
      stdio: ['inherit', 'inherit', 'inherit'],
      timeout: opts?.timeout ?? 600_000,
      cwd: opts?.cwd,
      detached: true,
    });

    if (result.signal) {
      if (result.pid) {
        try {
          process.kill(-result.pid, 'SIGKILL');
        } catch {
          // process group already gone
        }
      }
      console.error(`[shell] command killed by ${result.signal}: ${cmd.slice(0, 160)}`);
    }

    return { exitCode: result.status ?? 1, signal: result.signal ?? undefined };
  }
}
