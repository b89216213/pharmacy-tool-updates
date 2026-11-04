const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 for(const slug of ['cart-labels-his','cloud-medication']){
  const extension=path.resolve(__dirname,'../standalone-extensions',slug,'extension');
  const config=JSON.parse(fs.readFileSync(path.join(extension,'tool-config.js'),'utf8').match(/Object.freeze\((.*)\)/)[1]);
  const profile=fs.mkdtempSync('/tmp/pharmacy-managed-');
  const context=await chromium.launchPersistentContext(profile,{...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],viewport:{width:1280,height:900}});
  try{
   const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
   const id=new URL(worker.url()).host,base=`chrome-extension://${id}/`;
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+config.entry);await page.waitForSelector('#managed-bar');
   await page.waitForFunction(()=>document.querySelector('#managed-bar').textContent.includes('登記'));
   assert(await page.locator('#managed-workspace').evaluate(e=>e.inert));
   await worker.evaluate(async cfg=>{const now=Date.now(),deviceId=crypto.randomUUID();await chrome.storage.local.set({[cfg.managementKey]:{registered:true,deviceId,deviceName:'合成測試電腦',installationId:crypto.randomUUID(),secret:'a'.repeat(64),receivedAt:now,expiresAt:now+86400000,lastAttempt:now+300000,policy:{revision:'0.0',serverTime:now,validUntil:now+86400000,rules:[{scope:'tool:'+cfg.toolId,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0},{scope:'device:'+deviceId+':'+cfg.toolId,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0}]}}});},config);
   await page.reload();await page.waitForFunction(()=>!document.querySelector('#managed-workspace').inert);
   if(slug==='cart-labels-his'){
    await page.waitForFunction(()=>typeof window.convert==='function');
    await page.locator('#demo').evaluate(e=>e.click());await page.waitForFunction(()=>document.querySelectorAll('.sheet').length>0);
    assert((await page.locator('#pages').textContent()).includes('測試姓名'));
    const box=await page.locator('#previewViewport').boundingBox();assert(box&&box.height>200);
   }else{await page.waitForSelector('#root textarea');assert((await page.locator('#root').textContent()).includes('藥'));}
   const manager=await context.newPage();await manager.goto(base+'manager.html');await manager.waitForSelector('#device-name');
   const lock=await manager.evaluate(()=>chrome.runtime.sendMessage({kind:'managed-tool',action:'update-lock'}));assert.equal(lock.ok,false);assert(lock.error.includes('關閉'));
   await page.screenshot({path:path.resolve(__dirname,`../../${slug}-qa.png`),fullPage:true});
   await worker.evaluate(async cfg=>{const x=(await chrome.storage.local.get(cfg.managementKey))[cfg.managementKey];x.policy.rules[0].disabled=true;x.policy.rules[0].reason='測試停用';await chrome.storage.local.set({[cfg.managementKey]:x});},config);
   await page.reload();await page.waitForFunction(()=>document.querySelector('#managed-bar').textContent.includes('測試停用'));assert(await page.locator('#managed-workspace').evaluate(e=>e.inert));
   assert.deepEqual(errors,[]);
   await page.close();const released=await manager.evaluate(()=>chrome.runtime.sendMessage({kind:'managed-tool',action:'update-lock'}));assert.equal(released.ok,true);await manager.evaluate(()=>chrome.runtime.sendMessage({kind:'managed-tool',action:'update-unlock'}));
   console.log('PASS',slug,'actual Chromium extension loads, registration gate, original UI, updater guard and disable gate');
  }finally{await context.close();fs.rmSync(profile,{recursive:true,force:true});}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
