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
const portal=sender=>sender.id===chrome.runtime.id&&/^https?:\/\/ihisaw\.ntuh\.gov\.tw\/WebApplication\/PharManagement\/DrugCounting\.aspx(?:[?#]|$)/i.test(sender.url||'');
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
  const before=beat();record={...record,...await post('heartbeat',before,record.secret),networkError:'',authInvalid:false};
  const after=beat();if(after.ackRevision!==before.ackRevision||after.ackState!==before.ackState)record={...record,...await post('heartbeat',after,record.secret)};
 }catch(e){record.networkError=e.message;if(e.status===401)record.authInvalid=true;}
 await save(record);return record;
}
function summary(record,runtime){const s=stateOf(record);return{...s,version,deviceName:record.deviceName||'',deviceId:record.deviceId||'',registered:!!record.registered&&!record.authInvalid,receivedAt:record.receivedAt||null,networkError:record.networkError||'',busy:runtime.runs.length>0,updating:!!runtime.update};}
async function openManager(){
 const url=chrome.runtime.getURL('manager.html');const existing=(await chrome.tabs.query({})).find(t=>t.url===url);
 if(existing){await chrome.tabs.update(existing.id,{active:true});await chrome.windows.update(existing.windowId,{focused:true});}
 else await chrome.tabs.create({url});
}
async function handle(message,sender){
 if(!own(sender)&&!portal(sender))throw Error('不允許的工具來源');
 const action=message.action;let runtime=await runtimeState();
 if(action==='open'){await openManager();return{ok:true};}
 if(action==='status'){void checkUpdates();const r=summary(await refresh(await read(),runtime,!!message.force&&own(sender)),runtime);const release=(await chrome.storage.local.get('managedRelease')).managedRelease;return{...r,updateAvailable:!!release&&compareVersion(release.version,version)>0,latestVersion:release?.version||version};}
 if(action==='register'){
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
  if(await updateStore('get','journal'))throw Error('上次工具更新尚未完成，請開啟工具更新並完成還原或重新載入。');
  if(runtime.update)throw Error('工具正在更新，請等重新開啟後再操作');
  if(runtime.runs.length)throw Error('另一個取歸藥或盤點作業仍在處理；若頁面曾中斷，請先核對結果並關閉舊工具分頁。');
  const r=await refresh(await read(),runtime);const s=stateOf(r);if(s.state!=='allowed')throw Error(s.reason+' 請開啟「電腦登記／工具更新」。');
  const token=crypto.randomUUID();runtime.runs.push({key:key(sender),token,tabId:sender.tab?.id});await saveRuntime(runtime);return{token};
 }
 if(action==='release'){
  runtime.runs=runtime.runs.filter(r=>r.key!==key(sender)||r.token!==message.token);await saveRuntime(runtime);return{ok:true};
 }
 if(action==='update-lock'){
  if(!own(sender))throw Error('請從工具更新頁操作');
  if(runtime.runs.length||runtime.update)throw Error('目前有取歸藥、盤點或其他更新仍在執行，請完成後再更新');
  runtime.update={key:key(sender),tabId:sender.tab?.id};await saveRuntime(runtime);return{ok:true};
 }
 if(action==='update-unlock'){
  if(!own(sender)||runtime.update?.key!==key(sender))throw Error('更新鎖定不屬於此視窗');
  runtime.update=null;await saveRuntime(runtime);return{ok:true};
 }
 throw Error('未知工具指令');
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message?.kind!=='managed-tool')return;
 serial(()=>handle(message,sender)).then(data=>reply({ok:true,data}),e=>reply({ok:false,error:e.message}));return true;
});
chrome.tabs.onRemoved.addListener(tabId=>void serial(async()=>{const s=await runtimeState();s.runs=s.runs.filter(r=>r.tabId!==tabId);if(s.update?.tabId===tabId)s.update=null;await saveRuntime(s);}));
// Reload only the settings tab; the hospital page is refreshed by its user after idle update.
void (async()=>{const r=(await chrome.storage.local.get('managedUpdateReopen')).managedUpdateReopen;if(!r)return;await chrome.storage.local.remove('managedUpdateReopen');if(Date.now()-r.at>300000)return;const url=chrome.runtime.getURL('manager.html');const tab=(await chrome.tabs.query({})).find(t=>t.url===url);if(tab)await chrome.tabs.update(tab.id,{url,active:true});else await openManager();if(CONFIG.entry!=='manager.html'){const entry=chrome.runtime.getURL(CONFIG.entry);for(const t of await chrome.tabs.query({}))if(t.url?.split('?')[0]===entry)await chrome.tabs.update(t.id,{url:t.url});}})().catch(()=>{});
