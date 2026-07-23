import type { AggregatedReport } from '../aggregator.js';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function renderShardOverview(report: AggregatedReport): string {
  if (report.shards.length === 0) {
    return '<div class="empty-state"><div class="icon">📦</div>No shard data available</div>';
  }

  let html = '<div class="shard-grid">';

  for (const shard of report.shards) {
    const { summary } = shard;
    const cls = summary.failed > 0 ? 'red' : shard.exitCode !== 0 ? 'red' : 'green';

    html += `<div class="shard-tile ${cls}">`;
    html += `<div class="shard-num">${shard.shard.index}</div>`;
    html += `<div class="shard-stats">${summary.passed}/${summary.total} passed</div>`;
    if (summary.failed > 0) {
      html += `<div class="shard-stats" style="color:var(--red)">${summary.failed} failed</div>`;
    }
    if (summary.retried > 0) {
      html += `<div class="shard-stats" style="color:var(--amber)">${summary.retried} retried</div>`;
    }
    html += `<div class="shard-duration">${formatDuration(shard.durationMs)}</div>`;
    html += '</div>';
  }

  html += '</div>';
  return html;
}
