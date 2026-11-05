import{MANAGEMENT_KEY,TOOL_ID,MANAGEMENT_URL,validateManagementReply,managementState,enrollmentCode}from'./management-core.js';
const $=id=>document.getElementById(id);
export async function mountManagement({isBusy,saveDraft,setBlocked,setLocked,onReady}){
 if(!globalThis.chrome?.runtime?.getManifest)throw Error('請從瀏覽器擴充元件開啟工具。');
 const version=chrome.runtime.getManifest().version;let record=(await chrome.storage.local.get(MANAGEMENT_KEY))[MANAGEMENT_KEY]||{},networking=false,locking=false,locked=false,networkError='',appliedState='pending',lastAck='',recoverAuth=false;
 const controller={blocked:true};
 const persist=async()=>chrome.storage.local.set({[MANAGEMENT_KEY]:record});
 const status=(s,error=false)=>{$('management-status').textContent=s;$('management-status').classList.toggle('update-error',error);};
 async function request(path,body){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);try{
  const r=await fetch(MANAGEMENT_URL+'/api/fleet/device/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(path==='heartbeat'?{Authorization:'Bearer '+record.secret}:{})},body:JSON.stringify(body),credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',signal:abort.signal});
  if(!r.headers.get('content-type')?.includes('application/json'))throw Error('管理後台未回傳可用資料，請確認網路或聯絡管理員。');
  const text=await r.text();if(text.length>32000)throw Error('管理回覆超過大小限制');const data=JSON.parse(text);if(!r.ok){const e=Error(data.error||'管理驗證失敗');e.status=r.status;throw e;}const reply=validateManagementReply(data);if(path==='heartbeat'&&reply.deviceId!==record.deviceId)throw Error('裝置識別不一致，無法套用管理回覆。');return reply;
 }catch(e){if(e.status===401)throw e;if(e.name==='AbortError')throw Error('管理後台連線逾時，請稍後重試。');if(e instanceof TypeError)throw Error('目前無法連線至管理後台，請確認網路。');throw e;}finally{clearTimeout(timer);}}
 function render(){const s=recoverAuth?{state:'offline',reason:'電腦憑證無法驗證，請取得新登記碼重新登記。'}:managementState(record,version);const installation=window.PharmacyInstallation;
  if(!installation?.ready){s.state='installation';s.reason=installation?.reason||'正在確認安裝資料夾。';}
  controller.blocked=s.state!=='allowed';
  $('management-name-display').textContent=record.deviceName||'尚未登記';$('management-id-display').textContent=record.deviceId?'裝置代碼：'+record.deviceId.slice(0,8):'';
  $('open-management').textContent=record.deviceName||'登記電腦';$('management-setup').hidden=!!record.registered&&!recoverAuth;
  $('management-submit').disabled=networking||!installation?.ready;$('management-retry').disabled=networking;$('management-lock-title').textContent=({installation:'確認安裝資料夾',registration:'先登記這台電腦',disabled:'這台電腦已暫停使用',upgrade:'請升級後繼續使用',offline:'需要連線驗證'})[s.state]||'';
  $('management-lock-settings').textContent=installation?.ready?'電腦登記':installation?.state==='permission'?'允許存取資料夾':'確認安裝資料夾';
  $('management-lock-reason').textContent=s.reason+(s.minimumVersion?' 最低版本：v'+s.minimumVersion:'');
  $('management-check-time').textContent=record.receivedAt?'最後驗證：'+new Date(record.receivedAt).toLocaleString('zh-TW')+' · 開啟時每分鐘回報':'只回報電腦名稱、工具版本與管理狀態。';
  if(!networking)status(networkError||({allowed:'已連線登記，可正常使用。',disabled:'已接收停用設定；原有資料保留。',upgrade:'已接收最低版本要求。',offline:s.reason,registration:s.reason})[s.state],!!networkError);
  return s;
 }
 async function apply(){const s=render();setBlocked(controller.blocked);if(!controller.blocked){const wasLocked=locked;locked=false;appliedState='allowed';$('management-lock').hidden=true;$('management-pending').hidden=true;setLocked(false);if(wasLocked)onReady();return;}
  if(s.state==='installation')window.PharmacyInstallation?.open();
  if(s.state==='registration'&&!$('management-dialog').open&&!document.querySelector('dialog[open]'))$('management-dialog').showModal();
  if(isBusy()||locking){appliedState='pending';$('management-pending').hidden=false;return;}
  if(!locked){locking=true;try{await saveDraft();setLocked(true);locked=true;}catch{networkError='設定尚未保存成功；工具已停止新的作業。';setLocked(true);locked=true;}finally{locking=false;}}
  $('management-lock').hidden=false;$('management-pending').hidden=true;appliedState=['registration','installation'].includes(s.state)?'pending':s.state;
 }
 function beatBody(){return{installationId:record.installationId,version,ackRevision:record.policy?.revision||null,ackState:appliedState};}
 async function heartbeat(){if(networking||!record.registered)return;networking=true;try{const reply=await request('heartbeat',beatBody());record={...record,...reply};recoverAuth=false;networkError='';await persist();await apply();const ack=record.policy.revision+':'+appliedState;if(lastAck!==ack){const renewed=await request('heartbeat',beatBody());record={...record,...renewed};await persist();lastAck=ack;}}catch(e){networkError=e.message;if(e.status===401)recoverAuth=true;}finally{networking=false;await apply();}}
 $('management-form').addEventListener('submit',async event=>{event.preventDefault();if(networking)return;if(!window.PharmacyInstallation?.ready){window.PharmacyInstallation?.open(true);return;}networking=true;status('正在登記電腦…');try{
  if(!record.installationId||recoverAuth){record={installationId:crypto.randomUUID(),secret:[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('')};recoverAuth=false;await persist();}
  const reply=await request('register',{installationId:record.installationId,secret:record.secret,name:$('management-name').value.trim(),code:enrollmentCode($('management-code').value),toolId:TOOL_ID,version});record={...record,...reply,registered:true};await persist();recoverAuth=false;networkError='';$('management-code').value='';$('management-dialog').close();await apply();
 }catch(e){networkError=e.message;}finally{networking=false;await apply();if(record.registered)void heartbeat();}});
 $('open-management').addEventListener('click',()=>{if(!window.PharmacyInstallation?.ready){window.PharmacyInstallation?.open(true);return;}render();if(!$('management-dialog').open)$('management-dialog').showModal();});
 $('management-close').addEventListener('click',()=>{if(!networking)$('management-dialog').close();});$('management-dialog').addEventListener('cancel',e=>{if(networking)e.preventDefault();});
 $('management-retry').addEventListener('click',()=>void heartbeat());$('management-lock-retry').addEventListener('click',()=>void heartbeat());
 $('management-lock-settings').addEventListener('click',()=>{if(!window.PharmacyInstallation?.ready)window.PharmacyInstallation?.open(true);else $('open-management').click();});
 $('management-lock-update').addEventListener('click',()=>{if($('management-dialog').open)$('management-dialog').close();$('open-update').click();});
 document.addEventListener('installation-change',()=>void apply());
 await apply();if(record.registered)void heartbeat();setInterval(()=>void heartbeat(),60000);
 setInterval(()=>void apply(),1000);
 return controller;
}
