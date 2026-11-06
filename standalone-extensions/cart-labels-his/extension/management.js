import{MANAGEMENT_KEY,managementState,enrollmentCode}from'./management-core.js';
const $=id=>document.getElementById(id);
export async function mountManagement({isBusy,saveDraft,setBlocked,setLocked,onReady,exportBackup}){
 if(!globalThis.chrome?.runtime?.getManifest){$('open-management').hidden=true;return{blocked:false};}
 const version=chrome.runtime.getManifest().version;let record=(await chrome.storage.local.get(MANAGEMENT_KEY))[MANAGEMENT_KEY]||{},networking=false,locking=false,locked=false,networkError='',appliedState='pending',recoverAuth=!!record.authInvalid;
 const controller={blocked:true};
 const status=(s,error=false)=>{$('management-status').textContent=s||'';$('management-status').classList.toggle('update-error',error);};
 async function syncRecord(){record=(await chrome.storage.local.get(MANAGEMENT_KEY))[MANAGEMENT_KEY]||{};recoverAuth=!!record.authInvalid;networkError=record.networkError||'';}
 async function managed(action,details={}){
  const result=await chrome.runtime.sendMessage({kind:'managed-tool',action,...details});
  if(!result?.ok)throw Error(result?.error||'暫時無法連線工具管理，請重新開啟後再試。');
  await syncRecord();return result.data;
 }
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
  if(!locked){locking=true;try{await saveDraft();setLocked(true);locked=true;}catch{networkError='輸入內容尚未保留成功，請先匯出備份；工具已停止新的作業。';setLocked(true);locked=true;}finally{locking=false;}}
  $('management-lock').hidden=false;$('management-pending').hidden=true;appliedState=['registration','installation'].includes(s.state)?'pending':s.state;
 }
 async function heartbeat(){
  if(networking||!record.registered)return;networking=true;
  try{await managed('status',{force:true,busy:isBusy()});}
  catch(e){networkError=e.message;}
  finally{networking=false;await apply();}
 }
 $('management-form').addEventListener('submit',async event=>{
  event.preventDefault();if(networking)return;
  if(!window.PharmacyInstallation?.ready){window.PharmacyInstallation?.open(true);return;}
  networking=true;status('正在登記電腦…');
  try{
   await managed('register',{name:$('management-name').value.trim(),code:enrollmentCode($('management-code').value)});
   $('management-code').value='';$('management-dialog').close();
  }catch(e){networkError=e.message;}
  finally{networking=false;await apply();}
 });
 $('open-management').addEventListener('click',()=>{if(!window.PharmacyInstallation?.ready){window.PharmacyInstallation?.open(true);return;}render();if(!$('management-dialog').open)$('management-dialog').showModal();});
 $('management-close').addEventListener('click',()=>{if(!networking)$('management-dialog').close();});$('management-dialog').addEventListener('cancel',e=>{if(networking)e.preventDefault();});
 $('management-retry').addEventListener('click',()=>void heartbeat());$('management-lock-retry').addEventListener('click',()=>void heartbeat());
 $('management-lock-settings').addEventListener('click',()=>{if(!window.PharmacyInstallation?.ready)window.PharmacyInstallation?.open(true);else $('open-management').click();});
 $('management-lock-update').addEventListener('click',()=>{if($('management-dialog').open)$('management-dialog').close();$('open-update').click();});
 const backup=$('management-backup');if(backup){backup.hidden=typeof exportBackup!=='function';if(!backup.hidden)backup.addEventListener('click',async()=>{try{await exportBackup();status('已匯出本機備份。');}catch(e){status(e.message,true);}});}
 document.addEventListener('installation-change',()=>void apply());
 chrome.storage.onChanged?.addListener((changes,area)=>{if(area==='local'&&changes[MANAGEMENT_KEY])void syncRecord().then(()=>apply());});
 await apply();if(record.registered)void heartbeat();setInterval(()=>void heartbeat(),60000);
 setInterval(()=>void apply(),1000);
 return controller;
}
