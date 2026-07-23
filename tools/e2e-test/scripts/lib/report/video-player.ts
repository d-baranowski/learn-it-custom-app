// Video fullscreen enhancement, shared by the main report and the standalone
// failure pages. The report is published through Jenkins' HTML-publisher
// iframe, which does not delegate the `fullscreen` Permissions-Policy, so the
// browser's native <video> fullscreen button is inert there. We hide it and add
// our own control that tries the real Fullscreen API first (works when the
// report is opened directly as a file) and falls back to a CSS overlay that
// fills the viewport when the API is blocked inside the iframe.
export const VIDEO_PLAYER_JS = `
(function() {
  function enterCinema(wrap, btn) {
    wrap.classList.add('cinema');
    document.body.classList.add('cinema-open');
    btn.textContent = '\\u26F6 Exit';
  }
  function exitCinema(wrap, btn) {
    wrap.classList.remove('cinema');
    document.body.classList.remove('cinema-open');
    if (btn) btn.textContent = '\\u26F6 Fullscreen';
  }
  function toggle(wrap, video, btn) {
    if (wrap.classList.contains('cinema')) { exitCinema(wrap, btn); return; }
    try {
      var p = video.requestFullscreen();
      if (p && typeof p.then === 'function') {
        p.catch(function() { enterCinema(wrap, btn); });
      }
    } catch (_) {
      enterCinema(wrap, btn);
    }
  }
  function enhance(video) {
    if (video.dataset.fsReady) return;
    video.dataset.fsReady = '1';
    // Drop the native fullscreen button — it is dead inside the Jenkins iframe.
    var cl = (video.getAttribute('controlsList') || '').split(/\\s+/).filter(Boolean);
    if (cl.indexOf('nofullscreen') === -1) cl.push('nofullscreen');
    video.setAttribute('controlsList', cl.join(' '));

    var wrap = document.createElement('div');
    wrap.className = 'video-wrap';
    video.parentNode.insertBefore(wrap, video);
    wrap.appendChild(video);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-fs-btn';
    btn.textContent = '\\u26F6 Fullscreen';
    btn.addEventListener('click', function() { toggle(wrap, video, btn); });
    wrap.appendChild(btn);
  }
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.video-wrap.cinema').forEach(function(w) {
      exitCinema(w, w.querySelector('.video-fs-btn'));
    });
  });
  document.querySelectorAll('video').forEach(enhance);
})();
`;
