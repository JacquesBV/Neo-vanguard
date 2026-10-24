
/* Automatic launch tier: choose a safe starting load for this device, then
   let the existing frame-time adaptation refine it during gameplay. Explicit
   graphics/resolution choices remain authoritative. */
(function nvChooseDeviceStart(){
  try {
    const opts = S && S.opts;
    if (!opts || (opts.graphics || 'auto') !== 'auto') return;
    const autoResolution = IS_TOUCH ? (opts.mobRes || 'auto') === 'auto' : (opts.resolution || 'auto') === 'auto';
    if (!autoResolution) return;
    const cores = Math.max(1, Number(navigator.hardwareConcurrency) || (IS_TOUCH ? 4 : 4));
    const memory = Math.max(1, Number(navigator.deviceMemory) || (IS_TOUCH ? 4 : 8));
    const constrained = memory <= 3 || (IS_TOUCH && (cores <= 4 || memory <= 4)) || (!IS_TOUCH && cores <= 2);
    const midrange = !constrained && (cores <= 6 || memory <= 6);
    const tier = constrained ? 2 : midrange ? 1 : 0;
    PERF.tier = tier;
    R.qual = constrained ? 0.72 : midrange ? 0.86 : 1;
    if (GPU.ready && (opts.gpu || 'auto') === 'auto') {
      GPU.q = constrained ? 0 : midrange ? 1 : 2;
      gpuTier();
    }
    window.NV_AUTO_SUPPORT = { type: IS_TOUCH ? 'mobile' : 'desktop', tier, cores, memory };
    sideRes = resizeView().sideRes;
    if (typeof syncTitleZone === 'function') syncTitleZone();
  } catch (err) { console.warn('NV auto device profile', err); }
})();
