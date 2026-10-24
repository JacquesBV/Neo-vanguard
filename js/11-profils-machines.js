
/* Machine profiles are optional overrides: auto keeps level-by-level behavior. */
(function(){
  const priorHardware = visualHardware;
  const profileHardware = { gb:'pocket', nes:'home8', snes:'snes', gba:'gba', megadrive:'megadrive', neogeo:'neogeo', arcade:'arcade' };
  visualHardware = function(){
    const key = S && S.opts && S.opts.machineProfile;
    return key && key !== 'auto' ? (HW_PROFILES[profileHardware[key]] || priorHardware()) : priorHardware();
  };
  const soundEra = { gb:0, nes:1, snes:2, gba:2, megadrive:2, neogeo:2, arcade:3 };
  window.nvApplyMachineAudio = function(){
    if (!Audio2) return;
    const key = S.opts.machineProfile || 'auto';
    Audio2.era = key !== 'auto' && soundEra[key] !== undefined ? soundEra[key] : ((ERAS[Audio2.sect] || ERAS[0]).sty | 0);
    if (Audio2.ok) { Audio2.applyEraFx(); Audio2.applyOutputMode(); }
  };
  const startMusic = Audio2.startMusic;
  Audio2.startMusic = function(){ const out = startMusic.apply(this, arguments); window.nvApplyMachineAudio(); return out; };
  const setEraAudio = Audio2.setEra;
  Audio2.setEra = function(){ const out = setEraAudio.apply(this, arguments); window.nvApplyMachineAudio(); return out; };
  window.nvApplyMachineAudio();
})();
