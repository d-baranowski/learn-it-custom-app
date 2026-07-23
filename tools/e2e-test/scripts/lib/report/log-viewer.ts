import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import type { LogInfo } from '../types.js';
import type { AggregatedReport } from './aggregator.js';

interface LogRecord {
  s: number; // service index into the services array
  l: string; // level (lowercase), '' if unknown
  t: string; // timestamp, '' if unknown
  m: string; // message / raw text
}

const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
const LEVEL_RE = /\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|DPANIC|PANIC)\b/;

function stripAnsi(s: string): string {
  return s.replace(ANSI, '');
}

// parseLine turns one raw log line into a structured record. Go services emit
// ECS JSON by default (core, payment, …); gateway/postgres emit text. Both are
// normalised so the viewer can filter by level and search uniformly.
function parseLine(raw: string): { level: string; ts: string; msg: string } {
  const clean = stripAnsi(raw);
  const trimmed = clean.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      const level = String(obj['log.level'] ?? obj.level ?? obj.severity ?? '').toLowerCase();
      const ts = String(obj['@timestamp'] ?? obj.timestamp ?? obj.ts ?? '');
      const msg = String(obj.message ?? obj.msg ?? clean);
      return { level, ts, msg };
    } catch {
      // fall through to text handling
    }
  }

  const levelMatch = clean.match(LEVEL_RE);
  const level = levelMatch ? levelMatch[1].toLowerCase().replace('warning', 'warn') : '';
  return { level, ts: '', msg: clean };
}

export class LogViewerBuilder {
  build(inputDir: string, report: AggregatedReport, outputDir: string): Map<number, LogInfo> {
    const result = new Map<number, LogInfo>();
    if (!existsSync(inputDir)) return result;

    const failedShards = new Set(
      report.tests.filter((t) => t.finalStatus === 'failed').map((t) => t.shardIndex),
    );
    const logsOutDir = resolve(outputDir, 'logs');

    const shardDirs = readdirSync(inputDir)
      .filter((d) => d.startsWith('shard-'))
      .sort((a, b) => this.shardNum(a) - this.shardNum(b));

    for (const dir of shardDirs) {
      const shardIndex = this.shardNum(dir);
      if (isNaN(shardIndex)) continue;

      const backendDir = resolve(inputDir, dir, 'backend-logs');
      if (!existsSync(backendDir)) continue;

      const files = readdirSync(backendDir)
        .filter((f) => f.endsWith('.log'))
        .sort();
      if (files.length === 0) continue;

      const services: string[] = [];
      const records: LogRecord[] = [];
      let totalBytes = 0;

      for (const file of files) {
        const service = basename(file, '.log');
        const full = resolve(backendDir, file);

        // Never let one unreadable/corrupt log file crash report generation —
        // skip it and keep going.
        let content: string;
        try {
          const bytes = statSync(full).size;
          content = readFileSync(full, 'utf8');
          totalBytes += bytes;
        } catch (err) {
          console.error(`[e2e-report] skipping unreadable log ${full}: ${err}`);
          continue;
        }

        const serviceIdx = services.length;
        services.push(service);
        for (const raw of content.split('\n')) {
          if (raw === '') continue;
          const { level, ts, msg } = parseLine(raw);
          records.push({ s: serviceIdx, l: level, t: ts, m: msg });
        }
      }

      mkdirSync(logsOutDir, { recursive: true });
      const html = renderLogViewer(shardIndex, services, records);
      writeFileSync(resolve(logsOutDir, `shard-${shardIndex}.html`), html);

      result.set(shardIndex, {
        path: `logs/shard-${shardIndex}.html`,
        sizeBytes: totalBytes,
        lineCount: records.length,
        services: [...services].sort(),
        hadFailures: failedShards.has(shardIndex),
      });
    }

    return result;
  }

  private shardNum(dir: string): number {
    return parseInt(dir.replace('shard-', ''), 10);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderLogViewer(shardIndex: number, services: string[], records: LogRecord[]): string {
  const data = JSON.stringify({ services, records });
  const title = `Shard ${shardIndex} — Backend Logs`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${VIEWER_CSS}</style>
</head>
<body>
<div class="topbar">
  <div class="title">${escapeHtml(title)} <span class="count" id="count"></span></div>
  <a class="back" href="../index.html">&larr; Back to report</a>
</div>
<div class="controls">
  <input type="search" id="search" placeholder="Search logs…" autocomplete="off">
  <div class="chips" id="svc-chips"></div>
  <div class="chips" id="lvl-chips"></div>
</div>
<div id="log" class="log"></div>
<script id="data" type="application/json">${data.replace(/</g, '\\u003c')}</script>
<script>${VIEWER_JS}</script>
</body>
</html>`;
}

const VIEWER_CSS = `
:root { color-scheme: dark; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0d1117; color: #c9d1d9; font-family: 'SF Mono','Cascadia Code',Consolas,monospace; font-size: 12px; }
.topbar { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: #161b22; border-bottom: 1px solid #30363d; }
.topbar .title { font-weight: 600; font-size: 14px; font-family: -apple-system,Segoe UI,Roboto,sans-serif; }
.topbar .count { color: #8b949e; font-weight: 400; margin-left: 6px; }
.topbar .back { margin-left: auto; color: #58a6ff; text-decoration: none; font-family: -apple-system,Segoe UI,Roboto,sans-serif; }
.controls { position: sticky; top: 45px; z-index: 2; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 16px; background: #161b22; border-bottom: 1px solid #30363d; }
#search { flex: 1 1 260px; min-width: 200px; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; color: #c9d1d9; padding: 6px 10px; font-family: inherit; font-size: 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { padding: 3px 10px; border: 1px solid #30363d; border-radius: 12px; background: #0d1117; color: #8b949e; cursor: pointer; user-select: none; font-family: -apple-system,Segoe UI,Roboto,sans-serif; font-size: 11px; }
.chip.on { background: #1f6feb; border-color: #1f6feb; color: #fff; }
.chip.lvl-error.on { background: #da3633; border-color: #da3633; }
.chip.lvl-warn.on { background: #9e6a03; border-color: #9e6a03; }
.log { padding: 8px 0 40px; }
.row { display: flex; gap: 8px; padding: 1px 16px; white-space: pre-wrap; word-break: break-word; border-left: 3px solid transparent; }
.row:hover { background: #161b22; }
.row.error { border-left-color: #da3633; }
.row.warn { border-left-color: #9e6a03; }
.row .svc { flex: 0 0 auto; color: #58a6ff; }
.row .lvl { flex: 0 0 auto; text-transform: uppercase; font-size: 10px; align-self: center; }
.row.error .lvl { color: #ff7b72; }
.row.warn .lvl { color: #d29922; }
.row.info .lvl { color: #3fb950; }
.row.debug .lvl { color: #8b949e; }
.row .ts { flex: 0 0 auto; color: #6e7681; }
.row .msg { flex: 1 1 auto; }
.empty { padding: 40px; text-align: center; color: #8b949e; }
`;

const VIEWER_JS = `
(function(){
  var payload = JSON.parse(document.getElementById('data').textContent);
  var services = payload.services, records = payload.records;
  var LEVELS = ['error','warn','info','debug'];
  var svcOn = services.map(function(){ return true; });
  var lvlOn = {}; LEVELS.forEach(function(l){ lvlOn[l] = true; }); lvlOn[''] = true;
  var query = '';

  var logEl = document.getElementById('log');
  var countEl = document.getElementById('count');

  function chip(label, on, cls, onClick){
    var el = document.createElement('span');
    el.className = 'chip ' + cls + (on ? ' on' : '');
    el.textContent = label;
    el.addEventListener('click', function(){ el.classList.toggle('on'); onClick(el.classList.contains('on')); });
    return el;
  }

  var svcChips = document.getElementById('svc-chips');
  services.forEach(function(name, i){
    svcChips.appendChild(chip(name, true, 'svc-' + i, function(on){ svcOn[i] = on; render(); }));
  });
  var lvlChips = document.getElementById('lvl-chips');
  LEVELS.forEach(function(l){
    lvlChips.appendChild(chip(l, true, 'lvl-' + l, function(on){ lvlOn[l] = on; render(); }));
  });

  document.getElementById('search').addEventListener('input', function(e){
    query = e.target.value.toLowerCase();
    render();
  });

  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function render(){
    var html = '', shown = 0;
    for (var i = 0; i < records.length; i++){
      var r = records[i];
      if (!svcOn[r.s]) continue;
      var lvl = r.l || '';
      if (!(lvlOn[lvl] !== undefined ? lvlOn[lvl] : true)) continue;
      if (query){
        var hay = (services[r.s] + ' ' + r.t + ' ' + r.m).toLowerCase();
        if (hay.indexOf(query) === -1) continue;
      }
      shown++;
      html += '<div class="row ' + esc(lvl) + '">'
        + '<span class="svc">' + esc(services[r.s]) + '</span>'
        + (lvl ? '<span class="lvl">' + esc(lvl) + '</span>' : '')
        + (r.t ? '<span class="ts">' + esc(r.t) + '</span>' : '')
        + '<span class="msg">' + esc(r.m) + '</span>'
        + '</div>';
    }
    logEl.innerHTML = shown ? html : '<div class="empty">No log lines match the current filters.</div>';
    countEl.textContent = shown + ' / ' + records.length + ' lines';
  }

  render();
})();
`;
