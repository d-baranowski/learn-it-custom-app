export const CSS = `
:root {
  --green: #22c55e; --green-bg: #f0fdf4; --green-border: #bbf7d0;
  --red: #ef4444; --red-bg: #fef2f2; --red-border: #fecaca;
  --amber: #f59e0b; --amber-bg: #fffbeb; --amber-border: #fde68a;
  --gray: #6b7280; --gray-bg: #f9fafb; --gray-border: #e5e7eb;
  --blue: #3b82f6;
  --bg: #ffffff; --text: #111827; --text-secondary: #6b7280;
  --border: #e5e7eb; --card-shadow: 0 1px 3px rgba(0,0,0,0.1);
  --mono: 'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--sans); color: var(--text); background: var(--bg); font-size: 14px; line-height: 1.5; }
a { color: var(--blue); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Layout */
.header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: baseline; gap: 16px; }
.header h1 { font-size: 20px; font-weight: 600; }
.header .meta { color: var(--text-secondary); font-size: 13px; }
.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); padding: 0 24px; background: var(--gray-bg); }
.tab { padding: 10px 20px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--blue); border-bottom-color: var(--blue); }
.tab .badge { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.tab .badge.red { background: var(--red-bg); color: var(--red); }
.tab .badge.amber { background: var(--amber-bg); color: var(--amber); }
.section { display: none; padding: 24px; }
.section.active { display: block; }

/* Cards */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.card { padding: 20px; border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--card-shadow); }
.card .label { font-size: 12px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.card .value { font-size: 32px; font-weight: 700; margin-top: 4px; font-family: var(--mono); }
.card .sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.card.green .value { color: var(--green); }
.card.red .value { color: var(--red); }
.card.amber .value { color: var(--amber); }

/* Filters */
.filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-btn { padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s; }
.filter-btn:hover { border-color: var(--blue); }
.filter-btn.active { background: var(--blue); color: white; border-color: var(--blue); }

/* Tables */
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 10px 12px; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; user-select: none; white-space: nowrap; }
th:hover { color: var(--text); }
th .sort-arrow { margin-left: 4px; font-size: 10px; }
td { padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
tr:hover { background: var(--gray-bg); }
tr.row-failed { background: var(--red-bg); }
tr.row-failed:hover { background: #fde8e8; }
tr.row-flaky { background: var(--amber-bg); }
tr.row-flaky:hover { background: #fef3c7; }
tr.row-skipped { color: var(--gray); }

/* Status badges */
.status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: var(--mono); }
.status.passed { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
.status.failed { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
.status.skipped { background: var(--gray-bg); color: var(--gray); border: 1px solid var(--gray-border); }
.status.flaky { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }

/* Test ID */
.test-id { font-family: var(--mono); font-weight: 600; font-size: 12px; }
.spec-name { font-size: 12px; color: var(--text-secondary); }
.error-snippet { font-family: var(--mono); font-size: 11px; color: var(--red); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.duration { font-family: var(--mono); font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
.attempts-count { font-family: var(--mono); font-size: 12px; }

/* Shard grid */
.shard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.shard-tile { padding: 12px; border-radius: 8px; border: 1px solid var(--border); text-align: center; }
.shard-tile.green { background: var(--green-bg); border-color: var(--green-border); }
.shard-tile.red { background: var(--red-bg); border-color: var(--red-border); }
.shard-tile.gray { background: var(--gray-bg); border-color: var(--gray-border); }
.shard-tile .shard-num { font-weight: 700; font-size: 16px; font-family: var(--mono); }
.shard-tile .shard-stats { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
.shard-tile .shard-duration { font-size: 11px; font-family: var(--mono); color: var(--text-secondary); margin-top: 2px; }
a.shard-tile { display: block; color: inherit; text-decoration: none; transition: border-color 0.15s; }
a.shard-tile:hover { border-color: var(--blue); text-decoration: none; }

/* Failure details */
.failure-card { border: 1px solid var(--red-border); border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
.failure-header { padding: 12px 16px; background: var(--red-bg); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.failure-header .test-id { font-size: 14px; }
.failure-body { padding: 16px; display: none; }
.failure-card.open .failure-body { display: block; }
.failure-card.open .failure-chevron { transform: rotate(90deg); }
.failure-chevron { transition: transform 0.15s; font-size: 12px; }
.attempt-timeline { display: flex; gap: 4px; margin-bottom: 12px; }
.attempt-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
.attempt-dot.passed { background: var(--green); }
.attempt-dot.failed { background: var(--red); }
.error-block { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; font-family: var(--mono); font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin-bottom: 12px; max-height: 300px; overflow-y: auto; }
.screenshot-container { margin-top: 12px; }
.screenshot-container img { max-width: 100%; border: 1px solid var(--border); border-radius: 6px; }
.video-container { margin-top: 12px; }
.video-container video, .video-card video { max-width: 100%; border: 1px solid var(--border); border-radius: 6px; background: #000; }
.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.video-card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
.video-card video { width: 100%; }
.video-caption { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.video-wrap { position: relative; }
.video-wrap video { display: block; }
.video-fs-btn { position: absolute; top: 8px; right: 8px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; font-size: 12px; opacity: 0; transition: opacity 0.15s; }
.video-wrap:hover .video-fs-btn, .video-wrap:focus-within .video-fs-btn { opacity: 1; }
.video-wrap.cinema { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; padding: 24px; }
.video-wrap.cinema video { width: 100%; height: 100%; max-width: 100%; object-fit: contain; border: none; border-radius: 0; }
.video-wrap.cinema .video-fs-btn { opacity: 1; top: 16px; right: 16px; z-index: 10000; }
body.cinema-open { overflow: hidden; }
.repro-cmd { display: flex; align-items: center; gap: 8px; background: var(--gray-bg); padding: 8px 12px; border-radius: 6px; margin-top: 12px; }
.repro-cmd code { font-family: var(--mono); font-size: 12px; flex: 1; }
.copy-btn { padding: 4px 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); cursor: pointer; font-size: 12px; }
.copy-btn:hover { background: var(--gray-bg); }

/* Gantt chart */
.gantt-container { overflow-x: auto; }
.gantt-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; font-size: 12px; }
.gantt-legend-item { display: flex; align-items: center; gap: 4px; }
.gantt-legend-swatch { width: 14px; height: 14px; border-radius: 3px; }

/* Metrics charts */
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 16px; }
.metric-card { border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
.metric-card h3 { font-size: 14px; margin-bottom: 8px; }
.metric-card svg { width: 100%; }

/* Retries table */
.flake-summary { padding: 16px; background: var(--amber-bg); border: 1px solid var(--amber-border); border-radius: 8px; margin-bottom: 16px; }
.flake-summary .value { font-size: 24px; font-weight: 700; font-family: var(--mono); color: var(--amber); }

/* Empty state */
.empty-state { text-align: center; padding: 48px; color: var(--text-secondary); }
.empty-state .icon { font-size: 48px; margin-bottom: 8px; }
`;
