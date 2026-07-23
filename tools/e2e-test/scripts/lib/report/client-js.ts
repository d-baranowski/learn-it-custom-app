export const CLIENT_JS = `
(function() {
  // Tab navigation
  const tabs = document.querySelectorAll('.tab');
  const sections = document.querySelectorAll('.section');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
    });
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.filters');
      group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const table = document.getElementById('test-table');
      if (!table) return;
      table.querySelectorAll('tbody tr').forEach(row => {
        if (filter === 'all') { row.style.display = ''; return; }
        const status = row.dataset.status;
        const flaky = row.dataset.flaky === 'true';
        if (filter === 'flaky') { row.style.display = flaky ? '' : 'none'; }
        else { row.style.display = status === filter ? '' : 'none'; }
      });
    });
  });

  // Sortable columns
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const table = th.closest('table');
      const tbody = table.querySelector('tbody');
      const col = th.dataset.sort;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const dir = th.classList.contains('sort-asc') ? -1 : 1;
      table.querySelectorAll('th').forEach(h => { h.classList.remove('sort-asc','sort-desc'); h.querySelector('.sort-arrow') && (h.querySelector('.sort-arrow').textContent = ''); });
      th.classList.add(dir === 1 ? 'sort-asc' : 'sort-desc');
      const arrow = th.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = dir === 1 ? ' \\u25B2' : ' \\u25BC';
      rows.sort((a, b) => {
        let va = a.querySelector('[data-col="' + col + '"]')?.dataset.value ?? '';
        let vb = b.querySelector('[data-col="' + col + '"]')?.dataset.value ?? '';
        const na = parseFloat(va), nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
        return va.localeCompare(vb) * dir;
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });

  // Failure card toggle
  document.querySelectorAll('.failure-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.failure-card').classList.toggle('open');
    });
  });

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 1500);
      });
    });
  });

  // Load and render charts from JSON data
  async function loadCharts() {
    try {
      const resp = await fetch('data/shard-timelines.json');
      if (!resp.ok) return;
      const timelines = await resp.json();
      renderGantt(timelines);
      renderMetrics(timelines);
    } catch { /* charts are optional */ }
  }

  const STATE_COLORS = {
    INIT: '#9ca3af', DETERMINE_TESTS: '#9ca3af',
    SETUP_ENV: '#3b82f6', HEALTH_CHECK: '#06b6d4',
    RUN_TESTS: '#22c55e', EVALUATE: '#8b5cf6',
    RESET_ENV: '#f97316', RETRY_FAILED: '#f59e0b',
    RECOVER_ENV: '#ef4444', TEARDOWN: '#6b7280', DONE: '#6b7280',
  };

  function renderGantt(timelines) {
    const container = document.getElementById('gantt-chart');
    if (!container || timelines.length === 0) return;

    const allStarts = timelines.map(t => new Date(t.startedAt).getTime());
    const allEnds = timelines.map(t => new Date(t.finishedAt).getTime());
    const globalStart = Math.min(...allStarts);
    const globalEnd = Math.max(...allEnds);
    const totalMs = globalEnd - globalStart || 1;

    const W = 900, rowH = 28, pad = { top: 10, left: 80, right: 20, bottom: 30 };
    const chartW = W - pad.left - pad.right;
    const chartH = timelines.length * rowH;
    const H = chartH + pad.top + pad.bottom;

    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:' + W + 'px">';

    // Time axis
    const ticks = 6;
    for (let i = 0; i <= ticks; i++) {
      const x = pad.left + (i / ticks) * chartW;
      const ms = (i / ticks) * totalMs;
      const label = formatDuration(ms);
      svg += '<line x1="' + x + '" y1="' + pad.top + '" x2="' + x + '" y2="' + (pad.top + chartH) + '" stroke="#e5e7eb" stroke-dasharray="4"/>';
      svg += '<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#6b7280">' + label + '</text>';
    }

    // Shard rows
    timelines.forEach((tl, i) => {
      const y = pad.top + i * rowH;
      svg += '<text x="' + (pad.left - 8) + '" y="' + (y + rowH / 2 + 4) + '" text-anchor="end" font-size="11" font-family="monospace" fill="#374151">S' + tl.shard.index + '</text>';
      const shardStart = new Date(tl.startedAt).getTime();
      for (const ev of tl.events) {
        const evStart = new Date(ev.startedAt).getTime();
        const x = pad.left + ((evStart - globalStart) / totalMs) * chartW;
        const w = Math.max(1, (ev.durationMs / totalMs) * chartW);
        const color = STATE_COLORS[ev.state] || '#9ca3af';
        svg += '<rect x="' + x + '" y="' + (y + 4) + '" width="' + w + '" height="' + (rowH - 8) + '" rx="3" fill="' + color + '" opacity="0.85"><title>' + ev.state + ' (' + formatDuration(ev.durationMs) + ')</title></rect>';
      }
    });

    svg += '</svg>';
    container.innerHTML = svg;
  }

  function renderMetrics(timelines) {
    const container = document.getElementById('metrics-charts');
    if (!container) return;
    const shards = timelines.filter(t => t.systemMetrics && t.systemMetrics.length > 1);
    if (shards.length === 0) { container.innerHTML = '<div class="empty-state"><div class="icon">📊</div>No system metrics data available</div>'; return; }

    let html = '';
    for (const tl of shards) {
      const metrics = tl.systemMetrics;
      const startMs = new Date(metrics[0].timestamp).getTime();
      const points = metrics.map(m => ({ t: (new Date(m.timestamp).getTime() - startMs) / 1000, cpu: m.cpu.usagePercent, mem: m.memory.usagePercent, disk: m.disk.usagePercent }));

      html += '<div class="metric-card"><h3>Shard ' + tl.shard.index + '</h3>';
      html += renderLineChart(points, 'cpu', 'CPU %', '#3b82f6');
      html += renderLineChart(points, 'mem', 'Memory %', '#8b5cf6');
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderLineChart(points, key, label, color) {
    const W = 380, H = 100, pad = { top: 20, left: 40, right: 10, bottom: 20 };
    const cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom;
    const maxT = Math.max(...points.map(p => p.t)) || 1;
    const maxV = Math.max(100, ...points.map(p => p[key]));

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%">';
    svg += '<text x="' + pad.left + '" y="12" font-size="10" fill="#6b7280">' + label + '</text>';

    // Y axis
    for (let v = 0; v <= 100; v += 50) {
      const y = pad.top + ch - (v / maxV) * ch;
      svg += '<line x1="' + pad.left + '" y1="' + y + '" x2="' + (W - pad.right) + '" y2="' + y + '" stroke="#f3f4f6"/>';
      svg += '<text x="' + (pad.left - 4) + '" y="' + (y + 3) + '" text-anchor="end" font-size="9" fill="#9ca3af">' + v + '</text>';
    }

    // Line
    const pts = points.map(p => {
      const x = pad.left + (p.t / maxT) * cw;
      const y = pad.top + ch - (p[key] / maxV) * ch;
      return x + ',' + y;
    }).join(' ');
    svg += '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5"/>';
    svg += '</svg>';
    return svg;
  }

  function formatDuration(ms) {
    if (ms < 1000) return ms + 'ms';
    const s = Math.round(ms / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    return m + 'm ' + (s % 60) + 's';
  }

  loadCharts();
})();
`;
