import type { AggregatedReport, EnrichedTestResult } from '../aggregator.js';

function specFileName(spec: string): string {
  return spec.split('/').pop() ?? spec;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function statusBadge(test: EnrichedTestResult): string {
  if (test.isFlaky) return '<span class="status flaky">FLAKY</span>';
  return `<span class="status ${test.finalStatus}">${test.finalStatus.toUpperCase()}</span>`;
}

function rowClass(test: EnrichedTestResult): string {
  if (test.finalStatus === 'failed') return 'row-failed';
  if (test.isFlaky) return 'row-flaky';
  if (test.finalStatus === 'skipped') return 'row-skipped';
  return '';
}

export function renderTestTable(report: AggregatedReport): string {
  const { tests } = report;
  const failedCount = tests.filter((t) => t.finalStatus === 'failed').length;
  const flakyCount = tests.filter((t) => t.isFlaky).length;

  let html = '<div class="filters">';
  html += '<button class="filter-btn active" data-filter="all">All (' + tests.length + ')</button>';
  html += '<button class="filter-btn" data-filter="passed">Passed (' + report.overall.passed + ')</button>';
  if (failedCount > 0) html += '<button class="filter-btn" data-filter="failed">Failed (' + failedCount + ')</button>';
  if (report.overall.skipped > 0) html += '<button class="filter-btn" data-filter="skipped">Skipped (' + report.overall.skipped + ')</button>';
  if (flakyCount > 0) html += '<button class="filter-btn" data-filter="flaky">Flaky (' + flakyCount + ')</button>';
  html += '</div>';

  html += '<table id="test-table"><thead><tr>';
  html += '<th data-sort="status">Status<span class="sort-arrow"></span></th>';
  html += '<th data-sort="id">Test ID<span class="sort-arrow"></span></th>';
  html += '<th data-sort="spec">Spec<span class="sort-arrow"></span></th>';
  html += '<th data-sort="duration">Duration<span class="sort-arrow"></span></th>';
  html += '<th data-sort="attempts">Attempts<span class="sort-arrow"></span></th>';
  html += '<th>Shard</th>';
  html += '<th>Error</th>';
  html += '</tr></thead><tbody>';

  for (const test of tests) {
    const statusOrder = test.finalStatus === 'failed' ? 0 : test.isFlaky ? 1 : test.finalStatus === 'passed' ? 2 : 3;
    const cls = rowClass(test);

    html += `<tr class="${cls}" data-status="${test.finalStatus}" data-flaky="${test.isFlaky}">`;
    html += `<td data-col="status" data-value="${statusOrder}">${statusBadge(test)}</td>`;
    html += `<td data-col="id" data-value="${escapeHtml(test.id)}"><span class="test-id">${escapeHtml(test.id)}</span></td>`;
    html += `<td data-col="spec" data-value="${escapeHtml(specFileName(test.spec))}"><span class="spec-name" title="${escapeHtml(test.spec)}">${escapeHtml(specFileName(test.spec))}</span></td>`;
    html += `<td data-col="duration" data-value="${test.finalDurationMs}"><span class="duration">${formatDuration(test.finalDurationMs)}</span></td>`;
    html += `<td data-col="attempts" data-value="${test.attempts.length}"><span class="attempts-count">${test.attempts.length}</span></td>`;
    html += `<td data-col="shard" data-value="${test.shardIndex}"><span class="duration">${test.shardIndex}</span></td>`;

    if (test.finalError) {
      const snippet = escapeHtml(test.finalError.split('\n')[0].substring(0, 120));
      if (test.finalStatus === 'failed') {
        html += `<td><a href="failures/${escapeHtml(test.id)}.html" class="error-snippet">${snippet}</a></td>`;
      } else {
        html += `<td><span class="error-snippet">${snippet}</span></td>`;
      }
    } else {
      html += '<td></td>';
    }

    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}
