import { writeFileSync } from 'node:fs';
import { CSS } from './styles.js';
import { VIDEO_PLAYER_JS } from './video-player.js';
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div class="section active" style="padding:24px">
  <div class="video-grid">
    <div class="video-card"><video controls preload="metadata"></video><div class="video-caption"><span class="test-id">THPY_E2E_25</span></div></div>
    <div class="video-card"><video controls preload="metadata"></video><div class="video-caption"><span class="test-id">WH_E2E_03</span></div></div>
  </div>
  <div class="video-container" style="margin-top:24px;max-width:480px"><video controls preload="metadata"></video></div>
</div><script>${VIDEO_PLAYER_JS}</script></body></html>`;
writeFileSync('/private/tmp/claude-501/-Users-danielbaranowski-Workspace-utro/0c3f4d76-ed3e-4ff1-9e93-6afbaf535427/scratchpad/report-preview.html', html);
console.log('written');
