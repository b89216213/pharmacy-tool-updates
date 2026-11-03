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
  const now=Date.now(),deviceId='11111111-1111-4111-8111-111111111111';
  window.fixtureManagement={toolId:'ntuh-patch-recovery',deviceId,deviceName:'更新介面測試電腦',policy:{revision:'0.0',rules:[{scope:'tool:ntuh-patch-recovery',disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0},{scope:'device:'+deviceId,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0}],serverTime:now,validUntil:now+86400000}};
  if(!localStorage.getItem('patchManagementV1'))localStorage.setItem('patchManagementV1',JSON.stringify({...window.fixtureManagement,registered:true,installationId:'22222222-2222-4222-8222-222222222222',secret:'a'.repeat(64),receivedAt:now,expiresAt:now+86400000}));
  window.fixtureManifest=manifest;
  window.fixtureReloadCount=Number(localStorage.getItem('fixtureReloadCount')||0);
  window.fixtureRelease=JSON.parse(sessionStorage.getItem('fixtureRelease')||'null');
  window.fixtureOffline=sessionStorage.getItem('fixtureOffline')==='true';
  const nativeInterval=window.setInterval.bind(window);
  window.setInterval=(fn,delay,...args)=>{if(delay===6*60*60*1000)window.fixtureAutoCheck=()=>fn(...args);return nativeInterval(fn,delay,...args);};
  window.chrome={runtime:{getManifest:()=>({...manifest,version:localStorage.getItem('fixtureVersion')||manifest.version}),getURL:p=>location.origin+'/extension/'+p,getContexts:async()=>[{documentUrl:location.origin+'/extension/tool.html'}],onMessage:{addListener(){}},reload(){localStorage.setItem('fixtureReloadCount',String(++window.fixtureReloadCount));localStorage.setItem('fixtureVersion','1.3.2');location.reload();}},storage:{local:{async get(k){return {[k]:JSON.parse(localStorage.getItem(k)||'null')};},async set(x){for(const [k,v]of Object.entries(x))localStorage.setItem(k,JSON.stringify(v));}},session:{async get(){return {};}}},tabs:{async query(){return [];}},windows:{},scripting:{}};
  if(sessionStorage.getItem('fixtureHoldConnection')==='true')chrome.tabs.query=()=>new Promise(resolve=>{window.fixtureResolveConnection=()=>resolve([]);});
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(url,opts)=>{
   if(String(url).startsWith('https://pharmacy-device-console.cx760.chatgpt.site/'))return new Response(JSON.stringify(window.fixtureManagement),{status:200,headers:{'Content-Type':'application/json'}});
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
 const checkFinished=()=>page.waitForFunction(()=>window.fixtureRequests?.length>0&&!document.getElementById('update-check').disabled);
 const automaticCheck=async()=>{
  const count=await page.evaluate(()=>window.fixtureRequests.length);
  await page.evaluate(()=>window.fixtureAutoCheck());
  await page.waitForFunction(count=>window.fixtureRequests.length>count&&!document.getElementById('update-check').disabled,count);
 };
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/extension/patch-tool.json`);
  await page.evaluate(async()=>{const {updateStore}=await import('/extension/update-store.js');await updateStore('put','token','SYNTHETIC_LEGACY_CREDENTIAL');await updateStore('put','lastCheck',Date.now());await updateStore('put','latest',{version:'9.0.0',notes:'OLD PRIVATE SOURCE'});});
  await page.goto(`http://127.0.0.1:${server.address().port}/extension/tool.html`);
  await page.waitForFunction(()=>window.fixtureRequests?.length===1&&!document.getElementById('update-check').disabled);
  const migration=await page.evaluate(async()=>{const {updateStore}=await import('/extension/update-store.js');return {token:await updateStore('get','token'),latest:await updateStore('get','latest'),lastCheck:await updateStore('get','lastCheck'),source:await updateStore('get','source'),request:window.fixtureRequests[0]};});
  assert.equal(migration.token,undefined);assert.equal(migration.latest,undefined);assert.equal(migration.lastCheck,undefined);assert.equal(migration.source,'b89216213/pharmacy-tool-updates@main');done('Migration removes old credential and private-source cache before an immediate anonymous check');
  assert(migration.request.url.startsWith('https://raw.githubusercontent.com/b89216213/pharmacy-tool-updates/main/'));assert.equal(migration.request.options.headers.Authorization,undefined);assert.equal(migration.request.options.credentials,'omit');assert.equal(migration.request.options.referrerPolicy,'no-referrer');assert.equal(migration.request.options.body,undefined);done('Automatic first-run check needs no credential or folder and sends no patient data');
  assert.equal(await page.locator('#update-dialog').isVisible(),false);assert.equal(await page.evaluate(()=>document.getElementById('app-shell').inert),false);done('Failed automatic check does not open a dialog or block registration');
  await page.locator('#open-update').click();await page.locator('#update-dialog').waitFor();
  assert((await page.locator('#update-version').innerText()).includes('1.3.1'));assert.equal(await page.locator('#update-token').count(),0);done('Update dialog shows first-run setup and current version');
  await screenshot('qa-update-setup.png');
  await page.evaluate(async()=>{
   const root=await navigator.storage.getDirectory();window.fixtureInstalled=await root.getDirectoryHandle('installed',{create:true});window.fixtureSelection=await root.getDirectoryHandle('wrong',{create:true});
   for(const d of [window.fixtureInstalled,window.fixtureSelection]){const w=await(await d.getFileHandle('manifest.json',{create:true})).createWritable();await w.write(JSON.stringify(window.fixtureManifest));await w.close();}
  });
  await page.locator('#update-folder').click();await page.locator('#update-status').filter({hasText:'無法確認'}).waitFor();assert((await page.locator('#update-directory').innerText()).includes('尚未指定'));done('Same-version copied directory is rejected by installed-folder proof');
  await page.evaluate(()=>window.fixtureSelection=window.fixtureInstalled);await page.locator('#update-folder').click();await page.locator('#update-status').filter({hasText:'已確認'}).waitFor();done('Folder handle is saved after proof succeeds');
  await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'尚未取得更新檔'}).waitFor();done('Missing public release explains retry without requesting credentials');
  await page.evaluate(async()=>{
   const {sha256}=await import('/extension/update-core.js');const next={...window.fixtureManifest,version:'1.3.2'};
   const texts={'manifest.json':JSON.stringify(next),'patch-tool.json':'{"toolId":"ntuh-patch-recovery"}','tool.html':'<h1>new</h1>','background.js':'//new','operation-guard.js':'//guard'};
   window.fixturePackage={format:'patch-recovery-update-v1',toolId:'ntuh-patch-recovery',version:'1.3.2',notes:'測試：工具更新流程',files:await Promise.all(Object.entries(texts).map(async([path,text])=>{const b=new TextEncoder().encode(text);return {path,base64:btoa(String.fromCharCode(...b)),size:b.length,sha256:await sha256(b)};}))};
   const b=new TextEncoder().encode(JSON.stringify(window.fixturePackage));window.fixtureRelease={format:'patch-recovery-release-v1',toolId:'ntuh-patch-recovery',version:'1.3.2',notes:'改善更新流程。',packagePath:'updates/patch-recovery/packages/1.3.2.json',size:b.length,sha256:await sha256(b)};
  });
  await page.locator('#update-check').click();await page.locator('#update-new-version').filter({hasText:'1.3.2'}).waitFor();assert(await page.locator('#update-apply').isEnabled());done('New version and release notes appear with one-click update');
  await screenshot('qa-update-ready.png');
  await page.locator('#update-close').click();await automaticCheck();await page.waitForTimeout(1200);assert.equal(await page.locator('#update-dialog').isVisible(),false);done('Seeing a new version manually suppresses repeated automatic prompts during the same opening');
  await page.locator('#patient-search').focus();await screenshot('qa-update-highlight.png');await page.locator('#open-update').click();
  await page.evaluate(()=>window.fixtureOffline=true);await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'無法連線'}).waitFor();await page.evaluate(()=>window.fixtureOffline=false);done('Offline check leaves tool available and displays retry message');
  await page.evaluate(()=>{window.fixtureRelease.size+=1;});await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'新版已就緒'}).waitFor();await page.locator('#update-apply').click();await page.locator('#update-status').filter({hasText:'更新包與公告不一致'}).waitFor();assert.equal(await page.evaluate(()=>document.getElementById('app-shell').inert),false);assert.equal(await page.evaluate(async()=>JSON.parse(await(await(await window.fixtureInstalled.getFileHandle('manifest.json')).getFile()).text()).version),'1.3.1');done('Corrupted download leaves source untouched and unlocks registration');
  await page.evaluate(()=>window.fixtureRelease.size-=1);await page.locator('#update-check').click();await page.locator('#update-status').filter({hasText:'新版已就緒'}).waitFor();
  const popupRelease={...await page.evaluate(()=>window.fixtureRelease),version:'1.3.3',packagePath:'updates/patch-recovery/packages/1.3.3.json'};
  // Simulate an additional open tool window to exercise update exclusion.
  await page.evaluate(()=>chrome.runtime.getContexts=async()=>[{documentUrl:chrome.runtime.getURL('tool.html')},{documentUrl:chrome.runtime.getURL('tool.html')}]);await page.locator('#update-apply').click();await page.locator('#update-status').filter({hasText:'關閉其他'}).waitFor();await page.evaluate(()=>chrome.runtime.getContexts=async()=>[{documentUrl:chrome.runtime.getURL('tool.html')}]);done('Multiple tool windows block reload and file replacement');
  const before=await getData();await page.locator('#update-apply').click();await page.waitForFunction(()=>Number(localStorage.getItem('fixtureReloadCount'))===1&&document.getElementById('update-version')?.textContent.includes('1.3.2')&&!document.getElementById('update-check')?.disabled,null,{timeout:15000});await page.locator('#open-update').click();await page.locator('#update-version').filter({hasText:'1.3.2'}).waitFor();assert.equal(await getData(),before);assert((await page.locator('#update-directory').innerText()).includes('installed'));assert.equal(await page.evaluate(async()=>{const {updateStore}=await import('/extension/update-store.js');return await updateStore('get','token');}),undefined);assert.equal(await page.locator('#update-recover').isVisible(),false);done('Successful update reloads once, retains folder authorization and preserves application data exactly');
  assert.equal(await page.evaluate(()=>window.fixtureRequests?.length),1);done('Reopening checks again even with a successful check saved moments earlier');
  await page.setViewportSize({width:1050,height:820});await screenshot('qa-update-compact.png');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));done('Update UI fits compact desktop');
  await page.locator('#update-close').click();
  await page.evaluate(release=>window.fixtureRelease={...release,version:'1.3.2',packagePath:'updates/patch-recovery/packages/1.3.2.json'},popupRelease);
  await automaticCheck();assert.equal(await page.locator('#update-dialog').isVisible(),false);assert.equal(await page.locator('#open-update').innerText(),'工具更新');done('A successful up-to-date check leaves the dialog closed');
  await page.evaluate(release=>sessionStorage.setItem('fixtureRelease',JSON.stringify(release)),popupRelease);
  await page.reload();await checkFinished();await page.locator('#update-dialog').waitFor();assert((await page.locator('#update-new-version').innerText()).includes('1.3.3'));assert(await page.locator('#update-apply').isEnabled());assert.equal(await getData(),before);await screenshot('qa-update-auto-prompt.png');done('Opening the tool automatically presents a freshly detected update without modifying records or installing');
  await page.locator('#update-close').click();await automaticCheck();await page.waitForTimeout(1200);assert.equal(await page.locator('#update-dialog').isVisible(),false);assert.equal(await page.locator('#open-update').innerText(),'更新可用');assert.equal(await page.evaluate(()=>document.getElementById('app-shell').inert),false);done('Closing the reminder keeps registration available and suppresses repeated periodic prompts');
  await page.evaluate(()=>sessionStorage.setItem('fixtureOffline','true'));await page.reload();await checkFinished();await page.waitForTimeout(1200);assert.equal(await page.locator('#update-dialog').isVisible(),false);done('Cached update information does not trigger a popup when the fresh check fails');
  await page.evaluate(()=>{sessionStorage.removeItem('fixtureOffline');sessionStorage.setItem('fixtureHoldConnection','true');});await page.reload();await checkFinished();await page.waitForFunction(()=>!!window.fixtureResolveConnection);await page.waitForTimeout(1200);assert.equal(await page.locator('#update-dialog').isVisible(),false);await page.evaluate(()=>window.fixtureResolveConnection());await page.locator('#update-dialog').waitFor();done('An update found during a query waits until the query finishes');
  await page.evaluate(()=>{sessionStorage.removeItem('fixtureHoldConnection');sessionStorage.removeItem('fixtureRelease');});await page.reload();await checkFinished();await page.locator('#manual').click();await page.locator('#entry-dialog').waitFor();await page.evaluate(release=>window.fixtureRelease=release,popupRelease);await automaticCheck();await page.waitForTimeout(1200);assert.equal(await page.locator('#update-dialog').isVisible(),false);assert.equal(await page.locator('#entry-dialog').isVisible(),true);done('An update found during record editing does not cover the existing dialog');
  await page.locator('#entry-close').click();await page.locator('#patient-search').focus();await page.waitForTimeout(1200);assert.equal(await page.locator('#update-dialog').isVisible(),false);await page.locator('#patient-search').evaluate(el=>el.blur());await page.locator('#update-dialog').waitFor();assert((await page.locator('#update-new-version').innerText()).includes('1.3.3'));assert.equal(await getData(),before);done('The pending reminder also waits for field editing and opens after focus leaves the field');
  assert.deepEqual(errors,[]);done('No browser runtime errors');
  fs.writeFileSync(path.join(root,'docs/update-browser-results.json'),JSON.stringify({passed:checks.length,scope:'Synthetic Chromium UI with OPFS and simulated picker/GitHub/reload. Does not verify OS directory picker or extension runtime.',checks},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
