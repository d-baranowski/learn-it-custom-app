import type { EnrichedTestResult } from './aggregator.js';
import { CSS } from './styles.js';
import { VIDEO_PLAYER_JS } from './video-player.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function renderFailurePage(
  test: EnrichedTestResult,
  screenshotPath: string | undefined,
  logPath: string | undefined,
  videoPath: string | undefined,
): string {
  const cmd = `npx cypress run --spec "${test.spec}" --env grep="${test.id}"`;

  let body = '';

  body += '<div class="header"><h1>' + escapeHtml(test.id) + '</h1>';
  body += '<span class="meta">' + escapeHtml(test.spec) + '</span>';
  body += '<a href="../index.html" class="meta" style="margin-left:auto">&larr; Back to report</a></div>';

  body += '<div style="padding:24px">';

  // Status + attempts
  body += '<div class="cards" style="margin-bottom:24px">';
  body += '<div class="card red"><div class="label">Status</div><div class="value">FAILED</div></div>';
  body += `<div class="card"><div class="label">Attempts</div><div class="value">${test.attempts.length}</div></div>`;
  body += `<div class="card"><div class="label">Duration</div><div class="value">${formatDuration(test.finalDurationMs)}</div></div>`;
  body += `<div class="card"><div class="label">Shard</div><div class="value">${test.shardIndex}</div></div>`;
  body += '</div>';

  // Attempt timeline
  if (test.attempts.length > 1) {
    body += '<h3 style="margin-bottom:8px">Attempt History</h3>';
    body += '<table style="margin-bottom:24px"><thead><tr><th>Round</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead><tbody>';
    for (const a of test.attempts) {
      body += '<tr>';
      body += `<td>${a.round}</td>`;
      body += `<td><span class="status ${a.status}">${a.status.toUpperCase()}</span></td>`;
      body += `<td><span class="duration">${formatDuration(a.durationMs)}</span></td>`;
      body += `<td>${a.error ? '<span class="error-snippet">' + escapeHtml(a.error.split('\n')[0].substring(0, 120)) + '</span>' : ''}</td>`;
      body += '</tr>';
    }
    body += '</tbody></table>';
  }

  // Error message
  if (test.finalError) {
    body += '<h3 style="margin-bottom:8px">Error</h3>';
    body += `<div class="error-block">${escapeHtml(test.finalError)}</div>`;
  }

  // Screenshot
  if (screenshotPath) {
    body += '<h3 style="margin-bottom:8px;margin-top:16px">Screenshot</h3>';
    body += '<div class="screenshot-container">';
    body += `<img src="../${escapeHtml(screenshotPath)}" alt="Failure screenshot" loading="lazy"/>`;
    body += '</div>';
  }

  // Video
  if (videoPath) {
    body += '<h3 style="margin-bottom:8px;margin-top:16px">Video</h3>';
    body += '<div class="video-container">';
    body += `<video controls preload="metadata" src="../${escapeHtml(videoPath)}"></video>`;
    body += '</div>';
  }

  // Backend logs for this test's shard
  if (logPath) {
    body += '<h3 style="margin-bottom:8px;margin-top:16px">Backend Logs</h3>';
    body += `<a href="../${escapeHtml(logPath)}">📜 Shard ${test.shardIndex} backend logs (filter by service &amp; level)</a>`;
  }

  // Repro command
  body += '<h3 style="margin-bottom:8px;margin-top:16px">Repro Command</h3>';
  body += '<div class="repro-cmd">';
  body += `<code>${escapeHtml(cmd)}</code>`;
  body += `<button class="copy-btn" onclick="navigator.clipboard.writeText(this.dataset.copy).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)})" data-copy="${escapeHtml(cmd)}">Copy</button>`;
  body += '</div>';

  body += '</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(test.id)} — E2E Failure</title><style>${CSS}</style></head>
<body>${body}<script>${VIDEO_PLAYER_JS}</script></body>
</html>`;
}
