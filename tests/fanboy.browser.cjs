const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
 const report=[]; fs.mkdirSync('outputs',{recursive:true});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8765',{waitUntil:'load'});
  await page.locator('#nvWarn button').click();await page.waitForTimeout(800);
  await page.keyboard.press('Enter');await page.waitForTimeout(800);
  await page.evaluate(()=>{for(let i=1;i<=5;i++)nvFluid.cal().lv[i]=2;S.aideVu=true;S.opts.gbBezel=1;});
  for(let level=1;level<=4;level++){
   await page.evaluate(l=>{startLevel(l);hideScreens();},level);
   await page.waitForFunction(()=>!nvFluid.CAL.on,{}, {timeout:45000});
   const geometry=await page.evaluate(()=>{G.state='play';G.player.inv=999;sideRes=resizeView().sideRes;return {ratio:PF.w/PF.h,left:PF.x-60*(PF.w/480),right:PF.x+540*(PF.w/480),top:PF.y-90*(PF.w/480),bottom:PF.y+750*(PF.w/480),w:view.w,h:view.h};});
   assert(Math.abs(geometry.ratio-4/3)<.001);assert(geometry.left>=0&&geometry.right<=geometry.w+.01);assert(geometry.top>=0&&geometry.bottom<=geometry.h+.01);
   const stable=await page.evaluate(()=>{const before=JSON.stringify(PF);for(let i=0;i<5;i++)resizeView();return before===JSON.stringify(PF)});assert(stable);
   if(level===1){
    await page.evaluate(()=>{S.opts.autofire=false;S.opts.mouse=false;pointer.active=false;});
    await page.keyboard.down('ArrowRight');await page.keyboard.down('Space');
    const input=await page.evaluate(()=>{updatePlayerOne(G.player,1/60);return {...G.player.controlVisual}});assert(input.x>0&&input.fire);
    await page.screenshot({path:`outputs/fanboy-${mobile?'mobile':'pc'}-pressed.png`});
    await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');
    const released=await page.evaluate(()=>{updatePlayerOne(G.player,1/60);return {...G.player.controlVisual}});assert.equal(released.x,0);assert.equal(released.fire,false);
    const bomb=await page.evaluate(()=>{useBomb();const down=G.player.nvBombVisual>0;updatePlayerOne(G.player,.2);return {down,up:G.player.nvBombVisual===0}});assert(bomb.down&&bomb.up);
    const pad=await page.evaluate(()=>{const orig=navigator.getGamepads.bind(navigator);navigator.getGamepads=()=>[{connected:true,axes:[-1,.8],buttons:Array.from({length:16},(_,i)=>({pressed:i===0,value:i===0?1:0}))}];updatePlayerOne(G.player,1/60);const v={...G.player.controlVisual};navigator.getGamepads=orig;return v;});assert(pad.x<0&&pad.y>0&&pad.fire);
    if(mobile){
     const client=await context.newCDPSession(page);
     const loc=await page.evaluate(()=>({x:PF.x+PF.w/2,y:PF.y+PF.h*.7}));
     await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[loc]});
     await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:loc.x+35,y:loc.y-20}]});
     const drag=await page.evaluate(()=>{updatePlayerOne(G.player,1/60);return {down:pointer.down,drag:pointer.drag,input:{...G.player.controlVisual}}});assert(drag.down&&drag.drag&&drag.input.x>0&&drag.input.y<0);
     await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
   }
   for(const [name,progress] of [['green',0],['orange',.55],['red',.96]]){
    await page.evaluate(v=>{G.state='pause';G.phase='waves';G.waveT=(G.plan.at(-1).t+3)*v;render(0);},progress);
    if(level===1)await page.screenshot({path:`outputs/fanboy-${mobile?'mobile':'pc'}-${name}.png`});
   }
   const sync=await page.evaluate(()=>{
    const original=nvAlertSignal;const samples=[];window.nvAlertSignal=(t,total)=>{const s=original(t,total);samples.push({t,total,...s});return s;};
    G.phase='bossWarn';G.bossWarnTotal=3.6;
    for(const t of [.4,.5,1,2.2,3.4]){G.bossWarnT=t;drawMachineFrame();drawBossWarning();}
    window.nvAlertSignal=original;return samples;
   });assert.equal(sync.length,10);for(let i=0;i<10;i+=2)assert.deepEqual(sync[i],sync[i+1]);
   if(level===1){await page.evaluate(()=>{G.bossWarnT=1;render(0)});await page.screenshot({path:`outputs/fanboy-${mobile?'mobile':'pc'}-warning.png`});}
   report.push({mobile,level,geometry,synchronizationSamples:sync.length});
  }
  // Leave FanBoy: the next generation keeps its portrait game aperture.
  await page.evaluate(()=>startLevel(5));await page.waitForFunction(()=>!nvFluid.CAL.on,{}, {timeout:45000});
  assert.equal(await page.evaluate(()=>L_H),860);
  if(mobile){await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{startLevel(1);});await page.waitForFunction(()=>!nvFluid.CAL.on,{}, {timeout:45000});await page.screenshot({path:'outputs/fanboy-mobile-landscape.png'});}
  assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync('outputs/fanboy-validation.json',JSON.stringify(report,null,2));
 console.log('PASS: four sectors × PC/mobile; keyboard, gamepad, touch; layout; release; warning synchronization; next-generation isolation.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
