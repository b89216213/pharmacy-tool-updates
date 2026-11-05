import {installationStatus,verifyStoredInstallation} from './installation-core.js';
import {isReturnPage,freezePages,thawPages} from './return-pages.js';
import {updateStore} from './update-store.js';
import {githubFile,parseIndex,SOURCE} from './update-network.js';
import {compareVersion} from './update-core.js';
import {CONFIG} from './tool-config.js';
import {MANAGEMENT_KEY,MANAGEMENT_URL,TOOL_ID,validateManagementReply,managementState,enrollmentCode} from './management-core.js';
const SESSION='managedOperationsV1',version=chrome.runtime.getManifest().version;
let queue=Promise.resolve();
const serial=fn=>{const result=queue.then(fn,fn);queue=result.catch(()=>{});return result;};
const read=async()=> (await chrome.storage.local.get(MANAGEMENT_KEY))[MANAGEMENT_KEY]||{};
const save=record=>chrome.storage.local.set({[MANAGEMENT_KEY]:record});
const runtimeState=async()=> (await chrome.storage.session.get(SESSION))[SESSION]||{runs:[],update:null};
let checking=false;
async function checkUpdates(){if(checking)return;checking=true;try{const last=(await chrome.storage.local.get('managedRelease')).managedRelease;if(last?.checkedAt&&Date.now()-last.checkedAt<6*3600000)return;const next=parseIndex(await githubFile(SOURCE.index,{max:32000}));await chrome.storage.local.set({managedRelease:{version:next.version,checkedAt:Date.now()}});}catch{}finally{checking=false;}}
const saveRuntime=s=>chrome.storage.session.set({[SESSION]:s});
const own=sender=>sender.id===chrome.runtime.id&&sender.url?.startsWith(chrome.runtime.getURL(''));
const portal=sender=>sender.id===chrome.runtime.id&&isReturnPage(sender.url);
const key=sender=>sender.documentId||`${sender.tab?.id}:${sender.frameId||0}:${sender.url?.split('?')[0]}`;
const stateOf=r=>r.authInvalid?{state:'offline',reason:'電腦憑證無法驗證，請取得新登記碼重新登記。'}:managementState(r,version);
async function post(path,body,secret){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
 try{
  const res=await fetch(MANAGEMENT_URL+'/api/fleet/device/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})},body:JSON.stringify(body),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',signal:abort.signal});
  if(!res.headers.get('content-type')?.includes('application/json'))throw Error('管理後台未回傳可用資料');
  const text=await res.text();if(text.length>32000)throw Error('管理回覆超過大小限制');
  const data=JSON.parse(text);if(!res.ok)throw Object.assign(Error(data.error||'管理驗證失敗'),{status:res.status});
  return validateManagementReply(data);
 }catch(e){if(e.status)throw e;throw Error('目前無法連線管理後台，請確認網路或稍後重試。');}finally{clearTimeout(timer);}
}
function ack(r,runtime){const s=stateOf(r);return s.state!=='allowed'&&runtime.runs.length?'pending':s.state==='registration'?'pending':s.state;}
async function refresh(record,runtime,force=false){
 if(!record.registered||record.authInvalid)return record;
 if(!force&&Date.now()-(record.lastAttempt||0)<60000)return record;
 record.lastAttempt=Date.now();
 try{
  const beat=()=>({installationId:record.installationId,version,ackRevision:record.policy?.revision||null,ackState:ack(record,runtime)});
  const before=beat();const first=await post('heartbeat',before,record.secret);if(first.deviceId!==record.deviceId)throw Error('裝置識別不一致');record={...record,...first,networkError:'',authInvalid:false};
  const after=beat();if(after.ackRevision!==before.ackRevision||after.ackState!==before.ackState){const next=await post('heartbeat',after,record.secret);if(next.deviceId!==record.deviceId)throw Error('裝置識別不一致');record={...record,...next};}
 }catch(e){record.networkError=e.message;if(e.status===401)record.authInvalid=true;}
 await save(record);return record;
}
let initialInstallationCheck;
async function summary(record,runtime){
 await (initialInstallationCheck??=verifyStoredInstallation());
 const policy=stateOf(record),installation=await installationStatus();
 const s=installation.ready?policy:{state:'installation',reason:installation.reason};
 return{...s,policyState:policy.state,installationReady:installation.ready,version,deviceName:record.deviceName||'',deviceId:record.deviceId||'',registered:!!record.registered&&!record.authInvalid,receivedAt:record.receivedAt||null,networkError:record.networkError||'',busy:runtime.runs.length>0,updating:!!runtime.update};
}

async function openManager(section) {
 const base = chrome.runtime.getURL('manager.html');
 const target = section === 'update' ? base + '#update' : base;
 const existing = (await chrome.tabs.query({})).find(tab => tab.url?.split('#')[0] === base);
 if (!existing) { await chrome.tabs.create({url: target}); return; }
 const options = {active: true};
 if (section === 'update' && existing.url !== target) options.url = target;
 await chrome.tabs.update(existing.id, options);
 await chrome.windows.update(existing.windowId, {focused: true});
}
async function portalLease(sender,token,release=false){
 const owner=chrome.runtime.id+':return:'+token;
 if(!portal(sender)||!sender.tab)throw Error('請從退藥頁面操作');
 // The declared return-page content script shares this origin's sessionStorage
 // with the other Portal tools. No new scripting or Portal host permission is needed.
 const result=await chrome.tabs.sendMessage(sender.tab.id,{type:'return-portal-lease',owner,release,deadline:Date.now()+6000},{frameId:sender.frameId||0}).catch(error=>{if(!release)throw error;});
 if(!release&&!result?.ok)throw Error(result?.error||'退藥頁面連接已中斷，請重新整理後再試。');
}
async function handle(message,sender){
 if(!own(sender)&&!portal(sender))throw Error('不允許的工具來源');
 const action=message.action;let runtime=await runtimeState();
 if(action==='open'){await openManager(message.section);return{ok:true};}
 if(action==='status'){void checkUpdates();const r=await summary(await refresh(await read(),runtime,!!message.force&&own(sender)),runtime);const release=(await chrome.storage.local.get('managedRelease')).managedRelease;return{...r,updateAvailable:!!release&&compareVersion(release.version,version)>0,latestVersion:release?.version||version};}
 if(action==='register'){
  await (initialInstallationCheck??=verifyStoredInstallation());
  if(!(await installationStatus()).ready)throw Error('請先授權小工具安裝的資料夾。');
  if(!own(sender))throw Error('請從工具的電腦登記頁操作');
  if(runtime.runs.length||runtime.update)throw Error('請等目前作業完成再登記');
  const code=enrollmentCode(message.code);let r=await read();
  if(r.registered&&!r.authInvalid)throw Error('這個工具已登記；名稱可在後台修改');
  if(!r.installationId||r.authInvalid)r={installationId:crypto.randomUUID(),secret:[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('')};
  await save(r);
  const reply=await post('register',{installationId:r.installationId,secret:r.secret,name:String(message.name||'').trim(),code,toolId:TOOL_ID,version});
  r={...r,...reply,registered:true,authInvalid:false,networkError:''};await save(r);return summary(await refresh(r,runtime,true),runtime);
 }
 if(action==='acquire'){
  await (initialInstallationCheck??=verifyStoredInstallation());
  if(!(await installationStatus()).ready)throw Error('請先授權小工具安裝的資料夾。');
  if(await updateStore('get','journal'))throw Error('上次工具更新尚未完成，請開啟工具更新並完成還原或重新載入。');
  if(runtime.update)throw Error('工具正在更新，請等重新開啟後再操作');
  if(runtime.runs.length)throw Error('另一個退藥作業仍在處理；若頁面曾中斷，請先核對結果並關閉舊工具分頁。');
  const r=await refresh(await read(),runtime);const s=stateOf(r);if(s.state!=='allowed')throw Error(s.reason+' 請開啟「電腦登記／工具更新」。');
  const token=crypto.randomUUID();await portalLease(sender,token);runtime.runs.push({key:key(sender),token,tabId:sender.tab?.id,frameId:sender.frameId||0});try{await saveRuntime(runtime);}catch(e){await portalLease(sender,token,true);throw e;}return{token};
 }
 if(action==='touch'){const run=runtime.runs.find(r=>r.key===key(sender)&&r.token===message.token);if(!run)throw Error('作業連接已失效');await portalLease(sender,run.token);return{ok:true};}
 if(action==='release'){
  if(runtime.runs.some(r=>r.key===key(sender)&&r.token===message.token))await portalLease(sender,message.token,true);
  runtime.runs=runtime.runs.filter(r=>r.key!==key(sender)||r.token!==message.token);await saveRuntime(runtime);return{ok:true};
 }
 if(action==='update-lock'){
  if(!own(sender))throw Error('請從工具更新頁操作');
  if(runtime.runs.length||runtime.update)throw Error('目前有退藥或其他更新仍在執行，請完成後再更新');
  const pages=await freezePages();runtime.update={key:key(sender),tabId:sender.tab?.id,pages};try{await saveRuntime(runtime);}catch(error){await thawPages(pages);throw error;}return{ok:true};
 }
 if(action==='update-unlock'){
  if(!own(sender)||runtime.update?.key!==key(sender))throw Error('更新鎖定不屬於此視窗');
  await thawPages(runtime.update?.pages);runtime.update=null;await saveRuntime(runtime);return{ok:true};
 }
 throw Error('未知工具指令');
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message?.kind!=='managed-tool')return;
 serial(()=>handle(message,sender)).then(data=>reply({ok:true,data}),e=>reply({ok:false,error:e.message}));return true;
});
chrome.tabs.onRemoved.addListener(tabId=>void serial(async()=>{const s=await runtimeState();s.runs=s.runs.filter(r=>r.tabId!==tabId);if(s.update?.tabId===tabId){await thawPages(s.update.pages);s.update=null;}await saveRuntime(s);}));
// Reload only the settings tab; the hospital page is refreshed by its user after idle update.
void (async()=>{const r=(await chrome.storage.local.get('managedUpdateReopen')).managedUpdateReopen;if(!r)return;await chrome.storage.local.remove('managedUpdateReopen');if(Date.now()-r.at>300000)return;const url=chrome.runtime.getURL('manager.html');const tab=(await chrome.tabs.query({})).find(t=>t.url?.split('#')[0]===url);if(tab)await chrome.tabs.update(tab.id,{url,active:true});else await openManager();if(CONFIG.entry!=='manager.html'){const entry=chrome.runtime.getURL(CONFIG.entry);for(const t of await chrome.tabs.query({}))if(t.url?.split('?')[0]===entry)await chrome.tabs.update(t.id,{url:t.url});}})().catch(()=>{});

chrome.webNavigation.onCommitted.addListener(details=>void serial(async()=>{const s=await runtimeState();s.runs=s.runs.filter(r=>r.tabId!==details.tabId||(details.frameId!==0&&r.frameId!==details.frameId));if(s.update?.tabId===details.tabId&&details.frameId===0){await thawPages(s.update.pages);s.update=null;}await saveRuntime(s);}));

let setupPrompted=false;
export async function prepareLaunch() {
 const state=await serial(async()=>{const runtime=await runtimeState();return summary(await refresh(await read(),runtime),runtime);});
 if(state.state==='allowed'){setupPrompted=false;return true;}
 if(!setupPrompted){setupPrompted=true;await openManager();}
 return false;
}
