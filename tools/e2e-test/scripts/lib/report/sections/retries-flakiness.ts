import type { AggregatedReport, EnrichedTestResult } from '../aggregator.js';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function specFileName(spec: string): string {
  return spec.split('/').pop() ?? spec;
}

function attemptDots(test: EnrichedTestResult): string {
  return test.attempts
    .map((a) => `<span class="attempt-dot ${a.status}" title="Round ${a.round}: ${a.status}">${a.round}</span>`)
    .join('');
}

export function renderRetriesFlakiness(report: AggregatedReport): string {
  const retried = report.tests.filter((t) => t.retryCount > 0);

  if (retried.length === 0) {
    return '<div class="empty-state"><div class="icon">&#x2705;</div>No tests were retried</div>';
  }

  const flaky = retried.filter((t) => t.isFlaky);
  const stillFailed = retried.filter((t) => t.finalStatus === 'failed');

  let html = '<div class="flake-summary">';
  html += `<div class="value">${retried.length}</div>`;
  html += `<div>${retried.length} of ${report.overall.uniqueTests} tests (${Math.round((retried.length / report.overall.uniqueTests) * 100)}%) needed retries.</div>`;
  if (flaky.length > 0) {
    html += `<div style="margin-top:4px">${flaky.length} test(s) are <strong>flaky</strong> (failed initially, passed on retry).</div>`;
  }
  if (stillFailed.length > 0) {
    html += `<div style="margin-top:4px;color:var(--red)">${stillFailed.length} test(s) failed even after retries.</div>`;
  }
  html += '</div>';

  html += '<table><thead><tr>';
  html += '<th>Test ID</th><th>Spec</th><th>Attempts</th><th>Final Verdict</th><th>Total Attempts</th>';
  html += '</tr></thead><tbody>';

  for (const test of retried) {
    const statusClass = test.isFlaky ? 'flaky' : test.finalStatus;
    const statusLabel = test.isFlaky ? 'FLAKY' : test.finalStatus.toUpperCase();

    html += '<tr>';
    html += `<td><span class="test-id">${escapeHtml(test.id)}</span></td>`;
    html += `<td><span class="spec-name">${escapeHtml(specFileName(test.spec))}</span></td>`;
    html += `<td><div class="attempt-timeline">${attemptDots(test)}</div></td>`;
    html += `<td><span class="status ${statusClass}">${statusLabel}</span></td>`;
    html += `<td><span class="attempts-count">${test.attempts.length}</span></td>`;
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}
