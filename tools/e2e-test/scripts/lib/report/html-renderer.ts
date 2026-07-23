import type { AggregatedReport } from './aggregator.js';
import { CSS } from './styles.js';
import { CLIENT_JS } from './client-js.js';
import { VIDEO_PLAYER_JS } from './video-player.js';
import { renderDashboard } from './sections/dashboard.js';
import { renderTestTable } from './sections/test-table.js';
import { renderShardOverview } from './sections/shard-overview.js';
import { renderFailedDetails } from './sections/failed-details.js';
import { renderRetriesFlakiness } from './sections/retries-flakiness.js';
import { renderLogs } from './sections/logs.js';
import { renderVideos } from './sections/videos.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Tab {
  id: string;
  label: string;
  badge?: { count: number; color: 'red' | 'amber' };
}

export function renderIndexHtml(report: AggregatedReport): string {
  const failedCount = report.overall.failed;
  const flakyCount = report.overall.flaky;

  const tabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tests', label: 'Tests' },
    { id: 'failures', label: 'Failures', badge: failedCount > 0 ? { count: failedCount, color: 'red' } : undefined },
    { id: 'shards', label: 'Shards' },
    { id: 'logs', label: 'Logs' },
    { id: 'videos', label: 'Videos' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'retries', label: 'Retries', badge: flakyCount > 0 ? { count: flakyCount, color: 'amber' } : undefined },
  ];

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(report.title)}</title>
<style>${CSS}</style>
</head>
<body>`;

  // Header
  html += '<div class="header">';
  html += `<h1>${escapeHtml(report.title)}</h1>`;
  html += `<span class="meta">${report.generatedAt} &middot; ${report.overall.shardCount} shards &middot; ${report.overall.uniqueTests} tests</span>`;
  html += '</div>';

  // Tab nav
  html += '<div class="tabs">';
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const active = i === 0 ? ' active' : '';
    let badge = '';
    if (tab.badge) {
      badge = ` <span class="badge ${tab.badge.color}">${tab.badge.count}</span>`;
    }
    html += `<div class="tab${active}" data-target="${tab.id}">${tab.label}${badge}</div>`;
  }
  html += '</div>';

  // Sections
  html += `<div id="dashboard" class="section active">${renderDashboard(report)}</div>`;
  html += `<div id="tests" class="section">${renderTestTable(report)}</div>`;
  html += `<div id="failures" class="section">${renderFailedDetails(report)}</div>`;
  html += `<div id="shards" class="section">${renderShardOverview(report)}</div>`;
  html += `<div id="logs" class="section">${renderLogs(report)}</div>`;
  html += `<div id="videos" class="section">${renderVideos(report)}</div>`;
  html += '<div id="timeline" class="section">';
  html += '<div class="gantt-legend">';
  const legendItems = [
    ['SETUP_ENV', '#3b82f6'], ['HEALTH_CHECK', '#06b6d4'], ['RUN_TESTS', '#22c55e'],
    ['EVALUATE', '#8b5cf6'], ['RESET_ENV', '#f97316'], ['RETRY_FAILED', '#f59e0b'],
    ['RECOVER_ENV', '#ef4444'], ['TEARDOWN', '#6b7280'],
  ];
  for (const [label, color] of legendItems) {
    html += `<div class="gantt-legend-item"><div class="gantt-legend-swatch" style="background:${color}"></div>${label}</div>`;
  }
  html += '</div>';
  html += '<div class="gantt-container" id="gantt-chart"><div class="empty-state">Loading timeline...</div></div>';
  html += '</div>';
  html += '<div id="metrics" class="section"><div id="metrics-charts"><div class="empty-state">Loading metrics...</div></div></div>';
  html += `<div id="retries" class="section">${renderRetriesFlakiness(report)}</div>`;

  html += `<script>${CLIENT_JS}</script>`;
  html += `<script>${VIDEO_PLAYER_JS}</script>`;
  html += '</body></html>';

  return html;
}
