import type { AggregatedReport } from '../aggregator.js';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function renderDashboard(report: AggregatedReport): string {
  const { overall } = report;

  const rateClass = overall.passRate >= 95 ? 'green' : overall.passRate >= 80 ? 'amber' : 'red';
  const failedClass = overall.failed > 0 ? 'red' : 'green';
  const flakyClass = overall.flaky > 0 ? 'amber' : 'green';

  let html = '<div class="cards">';

  html += `<div class="card">
    <div class="label">Tests</div>
    <div class="value">${overall.uniqueTests}</div>
    <div class="sub">${overall.shardCount} shards</div>
  </div>`;

  html += `<div class="card ${rateClass}">
    <div class="label">Pass Rate</div>
    <div class="value">${overall.passRate}%</div>
    <div class="sub">${overall.passed} passed of ${overall.passed + overall.failed}</div>
  </div>`;

  html += `<div class="card ${failedClass}">
    <div class="label">Failed</div>
    <div class="value">${overall.failed}</div>
    <div class="sub">${overall.skipped} skipped</div>
  </div>`;

  html += `<div class="card ${flakyClass}">
    <div class="label">Flaky</div>
    <div class="value">${overall.flaky}</div>
    <div class="sub">${overall.retried} retried</div>
  </div>`;

  html += `<div class="card">
    <div class="label">Wall Clock</div>
    <div class="value">${formatDuration(overall.wallClockMs)}</div>
    <div class="sub">${formatDuration(overall.totalCypressMs)} total cypress time</div>
  </div>`;

  html += '</div>';

  // Shard status strip
  if (report.shards.length > 0) {
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">';
    for (const shard of report.shards) {
      const color = shard.summary.failed > 0 ? 'var(--red)' : 'var(--green)';
      html += `<div title="Shard ${shard.shard.index}: ${shard.summary.passed}/${shard.summary.total} passed" style="width:18px;height:18px;border-radius:3px;background:${color};font-size:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700">${shard.shard.index}</div>`;
    }
    html += '</div>';
  }

  return html;
}
