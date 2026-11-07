const {chromium}=require('playwright'),http=require('node:http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(urlPath.startsWith('/qa-fonts/')){res.setHeader('Content-Type','font/woff2');res.end(fs.readFileSync(path.join(process.env.QA_FONT_ROOT,'files',path.basename(urlPath))));return;}const p=path.join(root,urlPath);if(!p.startsWith(root+'/')||!fs.existsSync(p)){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(p));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_PATH||chromium.executablePath(),args:['--single-process','--no-zygote','--in-process-gpu','--no-sandbox','--disable-dev-shm-usage']});const ctx=await browser.newContext({deviceScaleFactor:2,viewport:{width:1280,height:930},timezoneId:'Asia/Taipei'}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
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
   if(action==='readOrderDetail')result={origin,number:p.number,ready:true,orderDateTime:window.fixtureTime,status:'已刷出',deliveryTimes:['10:00'],printTimes:['09:50'],deliveryTimeKnown:true,printTimeKnown:true};
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
  const probe=await page.context().newPage();
  const grid='NTUHWeb1_MedProcessBox_InptOrderBox_grvInptOrder', pre=grid+'_ctl108_', other=grid+'_ctl109_';
  const order=(prefix,seq,number)=>'<tr>'+['',seq,'確','出院','A','20261102',number,'<a id="'+prefix+'btnDetail">詳</a>'].map(x=>'<td>'+x+'</td>').join('')+'</tr>';
  const field=(name,suffix,time,prefix=pre)=>'<tr><td>'+name+' <input type="text" readonly value="合成藥師"><input type="text" readonly id="'+prefix+'ctl01_'+suffix+'" value="'+time+'"><input type="text" readonly value="簡碼:00000"></td></tr>';
  await probe.setContent('<span id="NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_InPatientInfoBox_lblChartNo">900001</span><input id="NTUHWeb1_InPatientNavigatorBox_SwitchInPatientBox_btnReSelect" value="重選病人"><table id="'+grid+'">'+order(pre,'0104','W0402')+'<tr><td colspan="8"><table>'+field('覆核藥師','review','2026/11/02 18:32')+field('醫令輸入者','entryField','2026/11/02 18:16')+field('醫令確認者','txbCompleteDateTime','2026/11/02 18:23')+field('醫令確認者','txbCompleteDateTime','2026/11/02 11:01',other)+'</table></td></tr>'+order(other,'0105','W0403')+'</table>');
  await probe.addScriptTag({path:root+'/discharge-extension/bridge.js'});
  const read=()=>probe.evaluate(()=>pageBridge('readOrderDetail',{account:'26X00000001',mrn:'900001',number:'W0402',sequence:'0104',orderDate:'20261102'}));
  const first=(await read()).orderDateTime;assert.equal(first,'2026/11/02 18:23');
  await probe.locator('#'+pre+'ctl01_txbCompleteDateTime').evaluate(e=>e.value='');
  const fallback=(await read()).orderDateTime;assert.equal(fallback,'2026/11/02 18:16');
  await probe.locator('#'+pre+'ctl01_entryField').evaluate(e=>e.value='');
  assert.equal((await read()).orderDateTime,'');done('Confirmation, entry fallback, missing values, another order and pharmacist review are distinguished');
  await page.evaluate(stamp=>{window.fixtureTime=stamp;fixturePatients=[{account:'26X00000001',name:'合成甲',ward:'12PE',room:'01',mrn:'900001',pickups:[{number:'W0402',orderDate:'20261102',sequence:'0104',sequences:['0104'],hasDetail:true}]}];},first);
  await page.locator('#startBatch').click();await page.waitForFunction(()=>window.CaptureSession?.status==='complete'&&!window.CaptureRunning);
  assert.equal(await page.locator('#liveRows .pickup-order-time').innerText(),'11/02 18:23');assert.equal(await page.locator('#liveRows .patient-demographics').innerText(),'F 30y0m');done('Batch capture stores the timestamp returned by the order detail');
  await page.evaluate(({first,fallback})=>{
    document.getElementById('baseDate').value='2026-11-03';PatientDetails.clear();
    const people=[['01','示例甲','900001',[['W0402',first,'已刷出','2026/11/02 18:38','2026/11/02 18:32'],['W0415','2026/11/03 08:05','已列印','','2026/11/03 08:12']]],['02','示例乙','900002',[['W0418',fallback,'已刷出','2026/11/02 18:41','2026/11/02 18:35']]],['03','示例丙','900003',[['W0420','','已列印','','2026/11/03 09:10']]]];
    const source=[];
    for(const [room,name,mrn,rxs] of people){const account='26X000000'+room,bedNumber='12PE-'+room+'-01';source.push(account+' 測試科 12PE '+room+' 01 '+name+' '+({'01':'F 3y2m','02':'M 0y8m','03':'F 16y0m'})[room]+' 2026/01/01 住院中 2026/11/03可出院 查');PatientDetails.set(account,{mrn,sex:room==='02'?'M':'F',name,bedNumber,drugStatus:'有',pickupComplete:true,pickups:rxs.map(([number,orderDateTime,status,delivery,print])=>({number,orderDate:'20261102',orderDateTime,status,deliveryTimes:delivery?[delivery]:[],printTimes:[print],deliveryTimeKnown:true,printTimeKnown:true}))});}
    document.getElementById('source').value=source.join('\n');CaptureSession={status:'complete',wards:[{code:'12PE',status:'done'}],patients:{}};refresh();dispatchEvent(new Event('captureupdate'));DischargePresentation.switchView('output');
  },{first,fallback});
  await page.waitForFunction(()=>document.querySelectorAll('#previewArea .pickup-heading').length===4);
  await page.evaluate(async()=>{await document.fonts.ready;dispatchEvent(new Event('beforeprint'));});
  assert.deepEqual(await page.locator('#liveRows .pickup-order-time').allTextContents(),['11/02 18:23','11/03 08:05','11/02 18:16','—']);
  assert((await page.evaluate(()=>tableData()))[1][4].includes('W0402 · 2026/11/02 18:23 · 已刷出'));
  await page.emulateMedia({media:'print'});await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
  assert.deepEqual(await page.locator('#previewArea .pickup-order-time').allTextContents(),['11/02 18:23','11/03 08:05','11/02 18:16','—']);
  const names=page.locator('#previewArea .patient-demographics');
  assert.deepEqual(await names.allTextContents(),['F 3y2m','M 0y8m','F 16y0m']);
  assert(await names.evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).display==='block'&&getComputedStyle(node).fontWeight==='400'&&parseFloat(getComputedStyle(node).fontSize)<parseFloat(getComputedStyle(node.parentElement).fontSize))));
  assert.equal(await page.locator('#previewArea .delivery-time').first().innerText(),'刷出：2026/11/02 18:38');
  assert.equal(await page.locator('#previewArea .print-time').first().innerText(),'列印：2026/11/02 18:32');
  assert.deepEqual((await page.evaluate(()=>tableData()))[1].slice(4),['W0402 · 2026/11/02 18:23 · 已刷出','2026/11/02 18:38','2026/11/02 18:32']);
  done('Ward ages, month precision, smaller regular second line and full dispensing/printing dates survive output');
  const lines=await page.locator('#previewArea .pickup-heading').evaluateAll(nodes=>nodes.map(n=>{const a=[...n.children].map(c=>c.getBoundingClientRect());return a.every((r,i)=>!i||r.left>=a[i-1].right)&&Math.max(...a.map(r=>r.bottom))-Math.min(...a.map(r=>r.top))<25;}));assert(lines.every(Boolean));done('Capture, CSV and compact single-line printed timestamp match');
  const sheet=await page.locator('#previewArea .sheet').first().boundingBox(),table=await page.locator('#previewArea .sheet table').first().boundingBox();
  if(process.env.QA_PREVIEW)await page.screenshot({path:process.env.QA_PREVIEW,clip:{x:sheet.x,y:sheet.y,width:sheet.width,height:Math.ceil(table.y+table.height-sheet.y+26)}});
  if(process.env.QA_PDF)await page.pdf({path:process.env.QA_PDF,format:'A4',preferCSSPageSize:true,printBackground:true});
  await page.locator('#includeBarcode').evaluate(e=>{e.checked=true;e.dispatchEvent(new Event('change'));});await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('#previewArea .education-barcode').count(),4);assert.equal(await page.locator('#previewArea .pickup-order-time').count(),4);
  assert.deepEqual(errors,[]);done('Barcode mode retains timestamps for all four pickups');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
