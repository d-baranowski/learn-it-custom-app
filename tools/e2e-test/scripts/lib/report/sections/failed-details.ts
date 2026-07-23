import type { AggregatedReport, EnrichedTestResult } from '../aggregator.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function reproCommand(test: EnrichedTestResult): string {
  return `npx cypress run --spec "${test.spec}" --env grep="${test.id}"`;
}

export function renderFailedDetails(report: AggregatedReport): string {
  const failed = report.tests.filter((t) => t.finalStatus === 'failed');

  if (failed.length === 0) {
    return '<div class="empty-state"><div class="icon">&#x2705;</div>No failed tests</div>';
  }

  let html = '';

  for (const test of failed) {
    const screenshotPath = report.screenshots.get(test.id);
    const cmd = reproCommand(test);

    html += '<div class="failure-card open">';

    // Header
    html += '<div class="failure-header">';
    html += `<div><span class="test-id">${escapeHtml(test.id)}</span> <span class="spec-name">${escapeHtml(test.spec)}</span></div>`;
    html += '<span class="failure-chevron">&#x25B6;</span>';
    html += '</div>';

    // Body
    html += '<div class="failure-body">';

    // Attempt timeline
    if (test.attempts.length > 1) {
      html += '<div class="attempt-timeline">';
      for (const a of test.attempts) {
        html += `<span class="attempt-dot ${a.status}" title="Round ${a.round}: ${a.status}">${a.round}</span>`;
      }
      html += '</div>';
    }

    // Error message
    if (test.finalError) {
      html += `<div class="error-block">${escapeHtml(test.finalError)}</div>`;
    }

    // Screenshot
    if (screenshotPath) {
      html += '<div class="screenshot-container">';
      html += `<img src="${escapeHtml(screenshotPath)}" alt="Failure screenshot for ${escapeHtml(test.id)}" loading="lazy"/>`;
      html += '</div>';
    }

    // Video
    const videoPath = report.videos.get(test.id);
    if (videoPath) {
      html += '<div class="video-container">';
      html += `<video controls preload="metadata" src="${escapeHtml(videoPath)}"></video>`;
      html += '</div>';
    }

    // Repro command
    html += '<div class="repro-cmd">';
    html += `<code>${escapeHtml(cmd)}</code>`;
    html += `<button class="copy-btn" data-copy="${escapeHtml(cmd)}">Copy</button>`;
    html += '</div>';

    // Backend logs for this test's shard
    const log = report.logs.get(test.shardIndex);
    if (log) {
      html += `<div style="margin-top:12px"><a href="${escapeHtml(log.path)}">📜 Backend logs — shard ${test.shardIndex}</a></div>`;
    }

    html += '</div>'; // failure-body
    html += '</div>'; // failure-card
  }

  return html;
}
