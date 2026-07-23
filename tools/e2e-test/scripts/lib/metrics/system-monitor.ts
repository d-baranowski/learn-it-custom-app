import { cpus, freemem, loadavg, totalmem } from 'node:os';
import type { IShell, SystemSnapshot } from '../types.js';

export type { SystemSnapshot };

const BYTES_TO_MB = 1024 * 1024;
const KB_TO_GB = 1024 * 1024;

export class SystemMonitor {
  private snapshots: SystemSnapshot[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private lastCpuTimes: { idle: number; total: number } | null = null;

  constructor(private readonly shell: IShell) {}

  start(intervalMs = 5_000): void {
    this.capture();
    this.intervalHandle = setInterval(() => this.capture(), intervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getSnapshots(): SystemSnapshot[] {
    return this.snapshots;
  }

  capture(): SystemSnapshot {
    const snapshot: SystemSnapshot = {
      timestamp: new Date().toISOString(),
      cpu: this.captureCpu(),
      memory: this.captureMemory(),
      disk: this.captureDisk(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  private captureCpu(): SystemSnapshot['cpu'] {
    const cores = cpus();
    let idle = 0;
    let total = 0;
    for (const core of cores) {
      idle += core.times.idle;
      total += core.times.user + core.times.nice + core.times.sys + core.times.irq + core.times.idle;
    }

    let usagePercent = 0;
    if (this.lastCpuTimes) {
      const idleDelta = idle - this.lastCpuTimes.idle;
      const totalDelta = total - this.lastCpuTimes.total;
      usagePercent = totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 1000) / 10 : 0;
    }
    this.lastCpuTimes = { idle, total };

    const la = loadavg() as [number, number, number];

    return { usagePercent, loadAvg: la };
  }

  private captureMemory(): SystemSnapshot['memory'] {
    const totalBytes = totalmem();
    const freeBytes = freemem();
    const usedBytes = totalBytes - freeBytes;
    return {
      totalMb: Math.round(totalBytes / BYTES_TO_MB),
      usedMb: Math.round(usedBytes / BYTES_TO_MB),
      freeMb: Math.round(freeBytes / BYTES_TO_MB),
      usagePercent: Math.round((usedBytes / totalBytes) * 1000) / 10,
    };
  }

  private captureDisk(): SystemSnapshot['disk'] {
    try {
      const output = this.shell.exec('df -k . | tail -1');
      const parts = output.split(/\s+/);
      const totalKb = parseInt(parts[1], 10);
      const usedKb = parseInt(parts[2], 10);
      const availKb = parseInt(parts[3], 10);
      return {
        totalGb: Math.round((totalKb / KB_TO_GB) * 10) / 10,
        usedGb: Math.round((usedKb / KB_TO_GB) * 10) / 10,
        availableGb: Math.round((availKb / KB_TO_GB) * 10) / 10,
        usagePercent: totalKb > 0 ? Math.round((usedKb / totalKb) * 1000) / 10 : 0,
      };
    } catch {
      return { totalGb: 0, usedGb: 0, availableGb: 0, usagePercent: 0 };
    }
  }
}
