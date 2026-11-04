import {managedRequest} from './managed-client.js';
import {mountUpdater} from './updater.js';
const $=id=>document.getElementById(id);let busy=true,updating=false,networking=false;
async function refresh(force=false){if(networking)return;networking=true;try{
 const s=await managedRequest('status',{force});busy=s.busy;updating=s.updating;
 $('device-name').textContent=s.deviceName?`${s.deviceName} · ${s.deviceId.slice(0,8)} · v${s.version}`:'尚未登記 · v'+s.version;
 $('managed-status').textContent=(s.state==='allowed'?'管理驗證正常，可開始作業。':s.reason)+(s.networkError?' '+s.networkError:'');
 $('operation-state').textContent=busy?'目前有作業執行中，完成後才能套用更新。':updating?'更新檔案處理中，請保持此視窗開啟。':'目前沒有工具作業執行中。';
 $('enroll-form').hidden=s.registered;
 }catch(e){busy=true;$('manager-error').textContent=e.message;}finally{networking=false;}}
 $('enroll-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;try{await managedRequest('register',{name:$('device-label').value,code:$('device-code').value});$('device-code').value='';$('manager-error').textContent='';await refresh();}catch(e){$('manager-error').textContent=e.message;}finally{button.disabled=false;}});
 $('refresh-management').addEventListener('click',()=>void refresh(true));
 await refresh();
 await mountUpdater({isBusy:()=>busy||updating,prepare:async()=>{await managedRequest('update-lock');updating=true;},finish:async()=>{try{await managedRequest('update-unlock');}finally{updating=false;}}}).catch(e=>{$('manager-error').textContent=e.message;});
 setInterval(()=>void refresh(),5000);

