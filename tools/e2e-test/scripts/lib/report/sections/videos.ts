import type { AggregatedReport } from '../aggregator.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderVideos(report: AggregatedReport): string {
  if (report.videos.size === 0) {
    return (
      '<div class="empty-state"><div class="icon">🎬</div>' +
      'No failure videos. Re-run the E2E job with <strong>RECORD_VIDEO</strong> enabled to capture them.' +
      '</div>'
    );
  }

  // Multiple failing tests can share one spec video — group test IDs by video.
  const byVideo = new Map<string, string[]>();
  for (const test of report.tests) {
    const video = report.videos.get(test.id);
    if (!video) continue;
    const ids = byVideo.get(video) ?? [];
    ids.push(test.id);
    byVideo.set(video, ids);
  }

  let html = '<div class="video-grid">';
  for (const [video, ids] of byVideo) {
    html += '<div class="video-card">';
    html += `<video controls preload="metadata" src="${escapeHtml(video)}"></video>`;
    html += `<div class="video-caption">${ids.map((id) => `<span class="test-id">${escapeHtml(id)}</span>`).join(' ')}</div>`;
    html += '</div>';
  }
  html += '</div>';

  return html;
}
