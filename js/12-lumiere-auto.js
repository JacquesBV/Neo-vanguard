
/* Automatic light tuning follows the active generation; manual sliders freeze it. */
(function(){
  window.nvApplyAutoGlow = function(){
    if (!S || !S.opts || (S.opts.machineProfile || 'auto') !== 'auto' || S.opts.glowManual) return;
    const lv = Math.max(1, G && Number(G.level) || 1);
    const preset = lv <= 6 ? [35,80] : lv <= 10 ? [100,105] : lv <= 14 ? [125,120] : lv <= 18 ? [150,135] : [165,150];
    S.opts.glowIntensity = preset[0]; S.opts.glowRadius = preset[1];
  };
  const baseSetEra = setEra;
  setEra = function(){ const result = baseSetEra.apply(this, arguments); window.nvApplyAutoGlow(); return result; };
  window.nvApplyAutoGlow();
})();
