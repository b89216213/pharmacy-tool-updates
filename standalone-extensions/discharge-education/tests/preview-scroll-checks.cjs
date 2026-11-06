const {chromium}=require('playwright'),http=require('node:http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(urlPath.startsWith('/qa-fonts/')){res.setHeader('Content-Type','font/woff2');res.end(fs.readFileSync(path.join(process.env.QA_FONT_ROOT,'files',path.basename(urlPath))));return;}const p=path.join(root,urlPath);if(!p.startsWith(root+'/')||!fs.existsSync(p)){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH||chromium.executablePath(),args:['--single-process','--no-zygote','--in-process-gpu','--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:930},timezoneId:'Asia/Taipei'});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const manifest=JSON.parse(fs.readFileSync(root+'/discharge-extension/manifest.json'));
 await page.addInitScript(({manifest})=>{
  window.PharmacyInstallation={ready:true};const now=Date.now(),deviceId='11111111-1111-4111-8111-111111111111';window.fixtureReply={toolId:'ntuh-discharge-education',deviceId,deviceName:'測試電腦',policy:{revision:'0.0',rules:[{scope:'tool:ntuh-discharge-education',disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0},{scope:'device:'+deviceId,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0}],serverTime:now,validUntil:now+86400000}};
  window.fixtureRequests=[];window.fixtureActions=[];window.fixturePatients=[];window.fixtureWard='12PE';
  const control=()=>({signature:'ward',id:'ward',mode:'ntuh-query',selectedWard:fixtureWard,options:[{code:'12PE',value:'12PE'},{code:'13PE',value:'13PE'}]});
  window.chrome={runtime:{getManifest:()=>manifest,getURL:p=>location.origin+'/discharge-extension/'+p,getContexts:async()=>[],reload(){},onMessage:{addListener(){}}},storage:{local:{async get(k){return {[k]:JSON.parse(localStorage.getItem(k)||'null')};},async set(o){for(const [k,v]of Object.entries(o))localStorage.setItem(k,JSON.stringify(v));},async remove(k){localStorage.removeItem(k);}}},scripting:{async executeScript({args:[action,p]}){fixtureActions.push({action,p});let result;const origin='https://portal.ntuh.gov.tw';
   if(action==='probe')result={origin,ready:true,login:false,loading:false};
   if(action==='lease')result={owned:true};if(action==='release')result={released:true};
   if(action==='discover')result={origin,controls:[control()]};
   if(action==='switch'){fixtureWard=p.ward;result={ok:true,origin};}
   if(action==='snapshot'){const people=fixturePatients.filter(x=>x.ward===fixtureWard),date=document.getElementById('baseDate').value.replaceAll('-','/');result={origin,controls:[control()],wards:[fixtureWard],ready:true,loading:false,pagination:false,emptyExplicit:!people.length,rowCount:people.length,accountCount:people.length,text:people.map(x=>`${x.account} 測試科 ${x.ward} ${x.room} 01 ${x.name} F 30y0m 2026/01/01 住院中 ${date}可出院 查`).join('\n')};}
   if(action==='selectPatient'){window.fixtureAccount=p.account;result={ok:true,origin};}
   if(action==='patientDetails'){const x=fixturePatients.find(x=>x.account===p.account);result={origin,ready:true,mrn:x.mrn,sex:'F',drugStatus:x.pickups.length?'有':'無',pickupComplete:true,pickupGroups:x.pickups,diagnostics:{},confirmedCount:x.pickups.length};}
   if(action==='openOrderDetail')result={ok:true,origin};
   if(action==='readOrderDetail')result={origin,number:p.number,ready:true,status:'已刷出',deliveryTimes:['10:00'],printTimes:['09:50'],deliveryTimeKnown:true,printTimeKnown:true};
   if(action==='patientReturnState')result={origin,returnable:true};if(action==='returnPatientList')result={origin,ok:true};
   return [{frameId:0,result}];}},tabs:{async query(){return [{id:1,url:'https://portal.ntuh.gov.tw/',active:true}];}}};
  const nativeFetch=fetch;window.fetch=async(url,o)=>{if(String(url).startsWith('https://pharmacy-device-console')){fixtureRequests.push(JSON.parse(o.body));return new Response(JSON.stringify(fixtureReply),{headers:{'Content-Type':'application/json'}});}if(String(url).startsWith('https://raw.githubusercontent.com'))return new Response('',{status:404});return nativeFetch(url,o);};
  const timer=setInterval,minuteTasks=[];window.fixtureHeartbeat=async()=>{for(const fn of minuteTasks)await fn();};window.fixturePolicyChecks=0;window.setInterval=(fn,ms)=>{if(ms===60000)minuteTasks.push(fn);return timer(ms===1000?()=>{fixturePolicyChecks++;return fn();}:fn,ms);};
  window.print=()=>{window.fixturePrinted=(window.fixturePrinted||0)+1;dispatchEvent(new Event('afterprint'));};
 },{manifest});
 const done=x=>console.log('PASS',x);
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}/discharge-extension/tool.html?tab=1&origin=https%3A%2F%2Fportal.ntuh.gov.tw`);
  await page.locator('#management-name').fill('捲動測試');await page.locator('#management-code').fill('0386');await page.locator('#management-submit').click();await page.waitForFunction(()=>window.DischargeBlocked===false&&document.querySelector('#wardGrid input'));
  if(process.env.QA_FONT_ROOT){const css=[400,700].map(n=>fs.readFileSync(path.join(process.env.QA_FONT_ROOT,n+'.css'),'utf8')).join('\n').replaceAll('./files/','/qa-fonts/')+'\nbody{font-family:"Noto Sans TC",sans-serif;}';await page.addStyleTag({content:css});await page.evaluate(()=>document.fonts.ready);}
  await page.evaluate(()=>{const base=document.getElementById('baseDate').value.replaceAll('-','/'),source=[];PatientDetails.clear();for(let i=1;i<=65;i++){const account='26X'+String(i).padStart(8,'0'),room=String(i).padStart(2,'0'),name='分頁測試'+i,bedNumber='12PE-'+room+'-01';source.push(`${account} 測試科 12PE ${room} 01 ${name} F 30y0m 2026/01/01 住院中 ${base}可出院 查`);PatientDetails.set(account,{mrn:String(900000+i),sex:'F',name,bedNumber,drugStatus:'有',pickupComplete:true,pickups:[{number:'W'+String(i).padStart(4,'0'),orderDate:base,status:'已刷出',deliveryTimes:['10:00'],printTimes:['09:00'],deliveryTimeKnown:true,printTimeKnown:true}]});}document.getElementById('source').value=source.join('\n');CaptureSession={status:'complete',wards:[{code:'12PE',status:'done'}],patients:{}};refresh();dispatchEvent(new Event('captureupdate'));DischargePresentation.switchView('output');});

  await page.waitForTimeout(150);
  assert((await page.locator('#previewArea .sheet').count())>2);
  const initial=await page.evaluate(()=>{window.previewNode=document.querySelector('#previewArea .sheet');window.scheduledCount=0;const schedule=DischargePresentation.schedule;DischargePresentation.schedule=()=>{scheduledCount++;return schedule();};document.querySelector('.output-scroll').scrollTop=1900;return {top:document.querySelector('.output-scroll').scrollTop,checks:fixturePolicyChecks};});
  assert.equal(initial.top,1900);
  for(let i=0;i<6;i++){await page.waitForTimeout(400);assert.equal(await page.locator('.output-scroll').evaluate(e=>e.scrollTop),1900);}
  assert.equal(await page.evaluate(()=>previewNode===document.querySelector('#previewArea .sheet')),true);
  assert.equal(await page.evaluate(()=>scheduledCount),0);
  assert((await page.evaluate(()=>fixturePolicyChecks))>=initial.checks+2);done('Management polling continues without rebuilding preview or resetting scroll');
  await page.evaluate(()=>DischargePresentation.schedule());await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>previewNode===document.querySelector('#previewArea .sheet')),true);assert.equal(await page.locator('.output-scroll').evaluate(e=>e.scrollTop),1900);done('Repeated rendering with unchanged content preserves the existing pages');
  await page.evaluate(()=>{const box=document.getElementById('includeBarcode');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>previewNode!==document.querySelector('#previewArea .sheet'));
  assert.equal(await page.locator('#previewArea .education-barcode').count(),65);assert.equal(await page.locator('.output-scroll').evaluate(e=>e.scrollTop),1900);done('Enabling barcodes rebuilds pagination while retaining scroll');
  await page.evaluate(()=>{document.getElementById('source').value=document.getElementById('source').value.replace('分頁測試1 F','更新測試1 F');const first=PatientDetails.values().next().value;first.name='更新測試1';first.pickups[0].status='已列印';refresh();});
  await page.waitForFunction(()=>document.querySelector('#previewArea').textContent.includes('更新測試1'));
  assert((await page.locator('#previewArea .edu-table tbody tr:not(.ward-heading)').first().innerText()).includes('已列印'));assert.equal(await page.locator('#previewArea .education-barcode').count(),65);
  assert.equal(await page.locator('.output-scroll').evaluate(e=>e.scrollTop),1900);done('Patient text and dispensing status changes update the preview at the same scroll position');
  await page.evaluate(()=>DischargePresentation.restoreAssignments({count:2,wards:{'12PE':2}}));
  await page.waitForFunction(()=>document.querySelector('#previewArea .sheet').dataset.pharmacist==='2');assert.equal(await page.locator('.output-scroll').evaluate(e=>e.scrollTop),1900);done('Pharmacist assignment changes refresh the correct pages without jumping');
  await page.emulateMedia({media:'print'});await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('#previewArea .edu-table tbody tr:not(.ward-heading)').count(),65);
  assert.equal(await page.locator('#previewArea .sheet').evaluateAll(sheets=>sheets.every(s=>s.querySelector('table').getBoundingClientRect().bottom<=s.getBoundingClientRect().bottom-parseFloat(getComputedStyle(s).paddingBottom)+1)),true);
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  assert.equal(await page.locator('#previewArea .edu-table tbody tr:not(.ward-heading)').count(),65);done('Print and return-to-screen retain every patient with no page overflow');
  await page.evaluate(()=>{fixtureReply.policy.rules[1].disabled=true;fixtureReply.policy.rules[1].revision=1;fixtureReply.policy.revision='0.1';return fixtureHeartbeat();});
  await page.locator('#management-lock').waitFor();assert.equal(await page.locator('#print').isDisabled(),true);assert.equal(await page.evaluate(()=>document.getElementById('screenInput').inert),true);
  await page.evaluate(()=>{fixtureReply.policy.rules[1].disabled=false;fixtureReply.policy.rules[1].revision=2;fixtureReply.policy.revision='0.2';return fixtureHeartbeat();});await page.locator('#management-lock').waitFor({state:'hidden'});
  await page.evaluate(()=>DischargePresentation.switchView('output'));await page.waitForFunction(()=>!document.getElementById('print').disabled);done('Actual remote disable and re-enable still take effect immediately');
  assert.deepEqual(errors,[]);done('No browser runtime errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
