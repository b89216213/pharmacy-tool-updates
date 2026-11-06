// Synthetic transport only. The production Connection, PortalEngine, bridge,
// repository, management controller and updater all execute unchanged.
const fs=require('node:fs'),path=require('node:path');
const {makePortal,Q,Element}=require('./dom-fixture.cjs');
async function prepareProduction(context,{configured=true}={}){
 const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json')));
 const model=await import('../extension/model.js');
 const seed=model.storageData({...model.emptyState(),prefs:{...model.emptyState().prefs,ward:'06E2',wardGroup:configured?['06E2','03E2','05W4']:[],wardGroupConfigured:configured}});
 const fixture=makePortal(path.join(root,'extension/bridge.js'));
 const codes=['06E2','03E2','05W4'];
 fixture.get(Q+'ddlListWard').children=[];
 for(const code of codes)fixture.get(Q+'ddlListWard').append(new Element('option',{value:code},code+' 測試病房'));
 fixture.get(Q+'ddlListWard').value='06E2';fixture.get(Q+'txbWardCode').value='06E2';
 fixture.data.splice(0,fixture.data.length,...codes.flatMap((ward,w)=>Array.from({length:24},(_,i)=>({account:'26T'+(90000001+w*1000000+i),ward,room:String(Math.floor(i/3)+1).padStart(2,'0'),bed:String(i%3+1),name:'測試病人'+String(i+1).padStart(2,'0'),sex:'M',age:'40歲',mrn:String(80000000+w*100+i)}))));
 fixture.clearedData.splice(0,fixture.clearedData.length,...codes.map((ward,w)=>({account:'26T'+(90000901+w*1000000),ward,room:'09',bed:'1',name:'已清床測試者',sex:'F',age:'50歲',mrn:String(81000000+w),discharge:'2026/11/01'})));
 fixture.showList(fixture.data.filter(p=>p.ward==='06E2'));
 fixture.context.location.origin='https://ihisaw.ntuh.gov.tw';
 const vertical=new Element('div',{id:'vertical'}),font=new Element('font',{},'合成藥師');vertical.append(font);
 const query=fixture.doc.querySelectorAll;
 fixture.doc.querySelectorAll=s=>s==='#leftContents #vertical'?[vertical]:query(s);
 fixture.pharmacistFont=font;fixture.commands=[];
 await context.exposeFunction('portalExecute',async payload=>{
  if(payload.files){fixture.installGuard();return [];}
  const [action,args]=payload.args;fixture.commands.push(action);
  if(action==='probe')return [{frameId:0,result:{origin:'https://ihisaw.ntuh.gov.tw',path:'/WebApplication/PharManagement/InMedicationProcess.aspx',ready:true,login:false,loading:false,blocked:false}}];
  if(action==='lease')return [{frameId:0,result:{owned:true}}];
  if(action==='release')return [{frameId:0,result:{released:true}}];
  fixture.context.Date=class extends Date{static now(){return args.deadline-100;}};
  return [{frameId:0,result:fixture.run(action,args)}];
 });
 await context.addInitScript(({manifest,seed})=>{
  if(!localStorage.getItem('patchRecoveryV1'))localStorage.setItem('patchRecoveryV1',JSON.stringify(seed));
  if(globalThis.FileSystemDirectoryHandle)FileSystemDirectoryHandle.prototype.queryPermission=async()=> 'granted';
  const now=Date.now(),deviceId='11111111-1111-4111-8111-111111111111';
  const reply={toolId:'ntuh-patch-recovery',deviceId,deviceName:'合成測試電腦',policy:{revision:'0.0',rules:[{scope:'tool:ntuh-patch-recovery',disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0},{scope:'device:'+deviceId,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0}],serverTime:now,validUntil:now+86400000}};
  window.fixtureManagement=reply;window.fixtureRequests=[];window.fixtureOffline=sessionStorage.getItem('portalOffline')==='yes';window.fixtureSourceFocus=0;
  if(!localStorage.getItem('patchManagementV1'))localStorage.setItem('patchManagementV1',JSON.stringify({...reply,registered:true,installationId:'22222222-2222-4222-8222-222222222222',secret:'a'.repeat(64),receivedAt:now,expiresAt:now+86400000}));
  const tab={id:7,url:'https://ihisaw.ntuh.gov.tw/WebApplication/PharManagement/InMedicationProcess.aspx',windowId:1,active:true};
  window.chrome={runtime:{getManifest:()=>manifest,getURL:p=>location.origin+'/'+p,getContexts:async()=>[],onMessage:{addListener(){}},reload(){}},storage:{local:{async get(k){return{[k]:JSON.parse(localStorage.getItem(k)||'null')};},async set(x){if(window.failStorage)throw Error('測試：儲存空間不足');for(const[k,v]of Object.entries(x))localStorage.setItem(k,JSON.stringify(v));}},session:{async get(){return {patchSource:{sourceId:7,origin:'https://ihisaw.ntuh.gov.tw'}};}}},tabs:{async get(){return tab;},async query(){return window.fixtureOffline?[]:[tab];},async update(){window.fixtureSourceFocus++;}},windows:{async update(){}},scripting:{executeScript:p=>window.portalExecute({args:p.args,files:p.files})}};
  const nativeFetch=window.fetch.bind(window);window.fetch=async(url,options)=>{
   if(String(url).startsWith('https://pharmacy-device-console.cx760.chatgpt.site/')){window.fixtureRequests.push({url,options});return new Response(JSON.stringify(reply),{status:200,headers:{'Content-Type':'application/json'}});}
   if(String(url).startsWith('https://raw.githubusercontent.com/')){window.fixtureRequests.push({url,options});return new Response('',{status:404});}
   return nativeFetch(url,options);
  };
 },{manifest,seed});
 return fixture;
}
async function prepareInstalled(page,baseURL){
 await page.goto(baseURL+'/manifest.json');
 await page.evaluate(async()=>{
  const {updateStore}=await import('./update-store.js'),manifest=chrome.runtime.getManifest();
  const root=await navigator.storage.getDirectory(),directory=await root.getDirectoryHandle('installed',{create:true});
  const w=await(await directory.getFileHandle('manifest.json',{create:true})).createWritable();await w.write(JSON.stringify(manifest));await w.close();
  await updateStore('put','directory',directory);
  await updateStore('put','installationDirectoryV2',{toolName:manifest.name,directory});
  await chrome.storage.local.set({installationVerifiedV1:{version:'1.5.5',directoryName:directory.name}});
 });
}
module.exports={prepareProduction,prepareInstalled};
