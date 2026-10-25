const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8876');await page.locator('#nvWarn button').click();await page.keyboard.press('Enter');
 await page.evaluate(()=>{for(let i=1;i<=5;i++)nvFluid.cal().lv[i]=2;S.aideVu=true;startLevel(1);hideScreens();});
 await page.waitForFunction(()=>!nvFluid.CAL.on,{}, {timeout:45000});
 await page.evaluate(()=>{G.state='play';G.phase='waves';S.opts.mouse=false;S.opts.autofire=false;G.player.x=240;G.player.y=430;G.player.inv=999;G.player.bombs=3;G.player.vx=G.player.vy=0;window.testSavedUpdate=update;update=()=>{};resizeView();render(0);});
 const client=await context.newCDPSession(page);
 const touch=(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const loc=await page.evaluate(()=>({x:PF.x+PF.w*.5,y:PF.y+PF.h*.5}));
 const before=await page.evaluate(()=>({x:G.player.x,y:G.player.y,s:PF.s}));
 await touch('touchStart',[{...loc,id:1}]);await touch('touchMove',[{x:loc.x+40,y:loc.y-30,id:1}]);
 const moved=await page.evaluate(()=>{updatePlayerOne(G.player,1/60);return {x:G.player.x,y:G.player.y,pointer:{...pointer},active:NV_FX_INPUT.active(),state:G.state,alive:G.player.alive,out:G.player.out,errors:window.testErrors};});
 assert(Math.abs((moved.x-before.x)*before.s-40)<.1,'screen drag must follow finger immediately');
 assert(Math.abs((moved.y-before.y)*before.s+30)<.1);
 await touch('touchEnd',[]);
 const stopped=await page.evaluate(()=>{const x=G.player.x;updatePlayerOne(G.player,1/60);return {delta:G.player.x-x,down:pointer.down}});assert.equal(stopped.delta,0);assert(!stopped.down);
 // A button pressed/released by the second finger must preserve the pilot.
 await touch('touchStart',[{...loc,id:1}]);
 const bomb=await page.locator('#fx-bomb').boundingBox();const b={x:bomb.x+bomb.width/2,y:bomb.y+bomb.height/2,id:2};
 const bombBefore=await page.evaluate(()=>G.player.bombs);
 await touch('touchStart',[{...loc,id:1},b]);await touch('touchEnd',[b]);
 assert(await page.evaluate(()=>pointer.down&&pointer.drag),'button release cancelled pilot');
 assert.equal(await page.evaluate(()=>G.player.bombs),bombBefore-1,'bomb action must trigger once');
 await touch('touchMove',[{x:loc.x+15,y:loc.y,id:1}]);
 const continuous=await page.evaluate(()=>{const x=G.player.x;updatePlayerOne(G.player,1/60);return (G.player.x-x)*PF.s;});assert(Math.abs(continuous-15)<.1);
 await touch('touchEnd',[]);
 // Real stick, independent held fire, and release/cancel handling.
 const stick=await page.locator('#fx-stick').boundingBox(),c={x:stick.x+stick.width/2,y:stick.y+stick.height/2,id:1};
 await touch('touchStart',[c]);const right={...c,x:c.x+25};await touch('touchMove',[right]);
 const joystick=await page.evaluate(()=>{const x=G.player.x;updatePlayerOne(G.player,1/60);G.t+=1/60;render(0);return {dx:G.player.x-x,input:NV_FX_INPUT.x,fire:G.player.controlVisual.fire};});assert(joystick.dx>0&&joystick.input>0&&joystick.fire);
 const fire=await page.locator('#fx-fire').boundingBox(),f={x:fire.x+fire.width/2,y:fire.y+fire.height/2,id:2};
 await touch('touchStart',[right,f]);assert(await page.evaluate(()=>NV_FX_INPUT.fire));
 await touch('touchEnd',[f]);assert(await page.evaluate(()=>NV_FX_INPUT.stickDown&&!NV_FX_INPUT.fire));
 await touch('touchCancel',[]);assert(await page.evaluate(()=>!NV_FX_INPUT.stickDown&&NV_FX_INPUT.x===0&&!NV_FX_INPUT.fire));
 const output=process.env.OUTPUT_DIR||'outputs';fs.mkdirSync(output,{recursive:true});
 await page.evaluate(()=>{G.player.inv=0;G.t+=.1;render(0)});await page.screenshot({path:output+'/fanboy-fx-controls.png'});
 for(const id of ['fx-fire','fx-bomb','fx-weapon','fx-pause']){const box=await page.locator('#'+id).boundingBox();assert(box.width>=44&&box.height>=44);}
 await page.locator('#fx-pause').click();assert.equal(await page.evaluate(()=>G.state),'pause');
 assert.deepEqual(errors,[]);console.log('PASS: exact 1:1 screen drag, no inertia, two-finger screen+button ownership, immediate bomb, interactive joystick, held fire, release/cancel, named 44px targets and pause.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
