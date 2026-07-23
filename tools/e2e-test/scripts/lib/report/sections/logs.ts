import type { AggregatedReport } from '../aggregator.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function renderLogs(report: AggregatedReport): string {
  if (report.logs.size === 0) {
    return '<div class="empty-state"><div class="icon">📜</div>No backend logs captured</div>';
  }

  const shards = [...report.logs.entries()].sort((a, b) => a[0] - b[0]);

  let html = '<p class="spec-name" style="margin-bottom:16px">';
  html += 'Per-shard backend service logs (core, gateway, postgres, …), persisted from the containers. ';
  html += 'Open a shard to filter by service/level and search.</p>';

  html += '<div class="shard-grid">';
  for (const [shardIndex, info] of shards) {
    const cls = info.hadFailures ? 'red' : 'green';
    html += `<a class="shard-tile ${cls}" href="${escapeHtml(info.path)}">`;
    html += `<div class="shard-num">S${shardIndex}</div>`;
    html += `<div class="shard-stats">${info.services.length} services</div>`;
    html += `<div class="shard-stats">${info.lineCount.toLocaleString()} lines</div>`;
    html += `<div class="shard-duration">${formatBytes(info.sizeBytes)}</div>`;
    html += '</a>';
  }
  html += '</div>';

  return html;
}
