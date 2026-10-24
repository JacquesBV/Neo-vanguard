
(() => {
  const btn = document.getElementById('tpause'); if (!btn) return;
  /* pause automatique quand on lève le doigt (option) */
  let fingers = 0, liftT = 0, liftPaused = false;
  const isUI = t => t && t.closest && t.closest('button, a, input, select, textarea, label, #touchui, #tpause, .screen.on');
  addEventListener('touchstart', e => {
    fingers = e.touches.length; clearTimeout(liftT);
    if (liftPaused && G.state === 'pause' && !(e.target.closest && e.target.closest('button, a, input, select, label'))) { liftPaused = false; e.preventDefault(); resumeGame(); }
  }, { passive: false, capture: true });
  const up = e => {
    fingers = e.touches.length;
    if (fingers || !(S.opts && S.opts.liftPause) || G.state !== 'play') return;
    clearTimeout(liftT);
    liftT = setTimeout(() => {
      if (!fingers && G.state === 'play' && S.opts.liftPause) { pauseGame(); liftPaused = true; }
    }, 500);
  };
  addEventListener('touchend', up, true); addEventListener('touchcancel', up, true);
  const prevResume = resumeGame;
  resumeGame = function () { liftPaused = false; return prevResume.apply(this, arguments); };
})();
