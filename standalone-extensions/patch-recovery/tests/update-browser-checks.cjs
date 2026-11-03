// Synthetic UI regression: real Chromium + IndexedDB + OPFS, with simulated
// picker, installed-directory proof and GitHub transport. Not an OS picker test.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+'/')||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH,args:['--single-process','--no-zygote','--in-process-gpu','--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:950},locale:'zh-TW',timezoneId:'Asia/Taipei'}),page=await context.newPage(),errors=[];
 const model=await import('../extension/model.js');const seed=model.storageData({...model.emptyState(),defaults:{'2026-11':'測試藥師'},records:model.batchRecords({id:'qa-batch',date:'2026-11-03',pharmacist:'測試藥師',entries:[{id:'qa-entry',patient:{account:'26T90000001',ward:'12PE',room:'01',bed:'1',name:'測試病人',department:'測試科別'},quantities:{'25':'2'}}]})});
 const fontRoot=process.env.QA_FONT_ROOT;
 let fontCSS='';
 if(fontRoot){
 fontCSS=[400,700].map(w=>fs.readFileSync(path.join(fontRoot,w+'.css'),'utf8')).join('\n').replaceAll('./files/','/qa-fonts/')+"\n:root{font-family:'Noto Sans TC',sans-serif;}";
 await context.route('**/qa-fonts/*',route=>route.fulfill({body:fs.readFileSync(path.join(fontRoot,'files',new URL(route.request().url()).pathname.split('/').at(-1))),contentType:'font/woff2'}));
 }
 const screenshot=async name=>{if(fontCSS)await page.addStyleTag({content:fontCSS});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(root,'docs',name),fullPage:true});};
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json'),'utf8'));
 await page.addInitScript(({manifest,seed})=>{
  if(!localStorage.getItem('patchRecoveryV1'))localStorage.setItem('patchRecoveryV1',JSON.stringify(seed));
  window.fixtureManifest=manifest;
  window.fixtureReloadCount=Number(localStorage.getItem('fixtureReloadCount')||0);
  window.chrome={runtime:{getManifest:()=>({...manifest,version:localStorage.getItem('fixtureVersion')||manifest.version}),getURL:p=>location.origin+'/extension/'+p,getContexts:async()=>[{documentUrl:location.origin+'/extension/tool.html'}],onMessage:{addListener(){}},reload(){localStorage.setItem('fixtureReloadCount',String(++window.fixtureReloadCount));localStorage.setItem('fixtureVersion','1.2.3');location.reload();}},storage:{local:{async get(k){return {[k]:JSON.parse(localStorage.getItem(k)||'null')};},async set(x){for(const [k,v]of Object.entries(x))localStorage.setItem(k,JSON.stringify(v));}},session:{async get(){return {};}}},tabs:{async query(){return [];}},windows:{},scripting:{}};
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(url,opts)=>{
   if(String(url).startsWith('https://raw.githubusercontent.com/')){
    window.fixtureRequests??=[];window.fixtureRequests.push({url,options:opts});
    if(window.fixtureOffline)throw new TypeError('offline');
    if(!window.fixtureRelease)return new Response('',{status:404});
    return new Response(JSON.stringify(String(url).includes('/packages/')?window.fixturePackage:window.fixtureRelease),{status:200});
   }
   if(String(url).includes('patch-folder-proof-')){
    const file=String(url).split('/').at(-1);try{return new Response(await (await window.fixtureInstalled.getFileHandle(file)).getFile());}catch{return new Response('',{status:404});}
   }
   return nativeFetch(url,opts);
  };
  window.showDirectoryPicker=async()=>window.fixtureSelection;
 },{manifest,seed});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());

 const done=name=>{checks.push(name);console.log('PASS',name);};
 const getData=()=>page.evaluate(()=>localStorage.getItem('patchRecoveryV1'));
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/extension/patch-tool.json`);
  await page.evaluate(async()=>{const {updateStore}=await import('/extension/update-store.js');await updateStore('put','token','SYNTHETIC_LEGACY_CREDENTIAL');await updateStore('put','lastCheck',Date.now());await updateStore('put','latest',{version:'9.0.0',notes:'OLD PRIVATE SOURCE'});});
  await page.goto(`http://127.0.0.1:${server.address().port}/extension/tool.html`);
  await page.waitForFunction(()=>window.fixtureRequests?.length===1&&!document.getElementById('update-check').disabled);
  const migration=await page.evaluate(async()=>{const {updateStore}=await import('/extension/update-store.js');return {token:await updateStore('get','token'),latest:await updateStore('get','latest'),lastCheck:await updateStore('get','lastCheck'),source:await updateStore('get','source'),request:window.fixtureRequests[0]};});
  assert.equal(migration.token,undefined);assert.equal(migration.latest,undefined);assert.equal(migration.lastCheck,undefined);assert.equal(migration.source,'b89216213/pharmacy-tool-updates@main');done('Migration removes old credential and private-source cache before an immediate anonymous check');
  assert(migration.request.url.startsWith('https://raw.githubusercontent.com/b89216213/pharmacy-tool-updates/main/'));assert.equal(migration.request.options.headers.Authorization,undefined);assert.equal(migration.request.options.credentials,'omit');assert.equal(migration.request.options.referrerPolicy,'no-referrer');assert.equal(migration.request.options.body,undefined);done('Automatic first-run check needs no credential or folder and sends no patient data');
  await page.locator('#open-update').click();await page.locator('#update-dialog').waitFor();
  assert((await page.locator('#update-version').innerText()).includes('1.2.2'));assert.equal(await page.locator('#update-token').count(),0);done('Update dialog shows first-run setup and current version');
  await screenshot('qa-update-setup.png');
  await page.evaluate(async()=>{
   const root=await navigator.storage.getDirectory();window.fixtureInstalled=await root.getDirectoryHandle('installed',{create:true});window.fixtureSelection=await root.getDirectoryHandle('wrong',{create:true});
   for(const d of [window.fixtureInstalled,window.fixtureSelection]){const w=await(await d.getFileHandle('manifest.json',{create:true})).createWritable();await w.write(JSON.stringify(window.fixtureManifest));await w.close();}
  });
  await page.locator('#update-folder').click();await page.locator('#update-status').filter({hasText:'無法確認'}).waitFor();assert((await page.locator('#update-directory').innerText()).includes('尚未指定'));done('Same-version copied directory is rejected by installed-folder proof');
  await page.evaluate(()=>window.fixtureSelection=window.fixtureInstalled);await page.locator('#update-folder').click();await page.locator('#update-status').filter({hasText:'已確認'}).waitFor();done('Folder handle is saved after proof succeeds');
  await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'尚未取得更新檔'}).waitFor();done('Missing public release explains retry without requesting credentials');
  await page.evaluate(async()=>{
   const {sha256}=await import('/extension/update-core.js');const next={...window.fixtureManifest,version:'1.2.3'};
   const texts={'manifest.json':JSON.stringify(next),'patch-tool.json':'{"toolId":"ntuh-patch-recovery"}','tool.html':'<h1>new</h1>','background.js':'//new','operation-guard.js':'//guard'};
   window.fixturePackage={format:'patch-recovery-update-v1',toolId:'ntuh-patch-recovery',version:'1.2.3',notes:'測試：工具更新流程',files:await Promise.all(Object.entries(texts).map(async([path,text])=>{const b=new TextEncoder().encode(text);return {path,base64:btoa(String.fromCharCode(...b)),size:b.length,sha256:await sha256(b)};}))};
   const b=new TextEncoder().encode(JSON.stringify(window.fixturePackage));window.fixtureRelease={format:'patch-recovery-release-v1',toolId:'ntuh-patch-recovery',version:'1.2.3',notes:'改善更新流程。',packagePath:'updates/patch-recovery/packages/1.2.3.json',size:b.length,sha256:await sha256(b)};
  });
  await page.locator('#update-check').click();await page.locator('#update-new-version').filter({hasText:'1.2.3'}).waitFor();assert(await page.locator('#update-apply').isEnabled());done('New version and release notes appear with one-click update');
  await screenshot('qa-update-ready.png');
  await page.evaluate(()=>window.fixtureOffline=true);await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'無法連線'}).waitFor();await page.evaluate(()=>window.fixtureOffline=false);done('Offline check leaves tool available and displays retry message');
  await page.evaluate(()=>{window.fixtureRelease.size+=1;});await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'新版已就緒'}).waitFor();await page.locator('#update-apply').click();await page.locator('#update-status').filter({hasText:'更新包與公告不一致'}).waitFor();assert.equal(await page.evaluate(()=>document.getElementById('app-shell').inert),false);assert.equal(await page.evaluate(async()=>JSON.parse(await(await(await window.fixtureInstalled.getFileHandle('manifest.json')).getFile()).text()).version),'1.2.2');done('Corrupted download leaves source untouched and unlocks registration');
  await page.evaluate(()=>window.fixtureRelease.size-=1);await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'新版已就緒'}).waitFor();
  // Simulate an additional open tool window to exercise update exclusion.
  await page.evaluate(()=>chrome.runtime.getContexts=async()=>[{documentUrl:chrome.runtime.getURL('tool.html')},{documentUrl:chrome.runtime.getURL('tool.html')}]);await page.locator('#update-apply').click();await page.locator('#update-status').filter({hasText:'關閉其他'}).waitFor();await page.evaluate(()=>chrome.runtime.getContexts=async()=>[{documentUrl:chrome.runtime.getURL('tool.html')}]);done('Multiple tool windows block reload and file replacement');
  const before=await getData();await page.locator('#update-apply').click();await page.waitForFunction(()=>Number(localStorage.getItem('fixtureReloadCount'))===1&&document.getElementById('update-version')?.textContent.includes('1.2.3')&&document.getElementById('update-status')?.textContent.includes('已完成更新'),null,{timeout:15000});await page.locator('#open-update').click();await page.locator('#update-version').filter({hasText:'1.2.3'}).waitFor();assert.equal(await getData(),before);assert((await page.locator('#update-directory').innerText()).includes('installed'));assert.equal(await page.evaluate(async()=>{const {updateStore}=await import('/extension/update-store.js');return await updateStore('get','token');}),undefined);assert.equal(await page.locator('#update-recover').isVisible(),false);done('Successful update reloads once, retains folder authorization and preserves application data exactly');
  await page.setViewportSize({width:1050,height:820});await screenshot('qa-update-compact.png');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));done('Update UI fits compact desktop');
  assert.deepEqual(errors,[]);done('No browser runtime errors');
  fs.writeFileSync(path.join(root,'docs/update-browser-results.json'),JSON.stringify({passed:checks.length,scope:'Synthetic Chromium UI with OPFS and simulated picker/GitHub/reload. Does not verify OS directory picker or extension runtime.',checks},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
