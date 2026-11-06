import {PortalEngine} from './portal-engine.js';
import {normalizeWards} from './portal-core.js';
import {captureWards} from './portal-capture.js';
import {mountUpdater} from './updater.js';
import {mountManagement} from './management.js';
const $=id=>document.getElementById(id);
export async function mountServices(workspace){
 await new Promise((ok,no)=>{const s=document.createElement('script');s.src='../portal-connection.js';s.onload=ok;s.onerror=no;document.body.append(s);});
 let blocked=true,locked=false;
 const busy=()=>workspace.isBusy()||!!document.querySelector('dialog[open]:not(#update-dialog)');
 await mountUpdater({isBusy:busy,prepare:async()=>{locked=true;workspace.setLocked(true);},finish:()=>{locked=false;workspace.setLocked(blocked);}});
 const management=await mountManagement({isBusy:workspace.isBusy,saveDraft:async()=>{},exportBackup:async()=>{$('handoverLogDownload').click();},setBlocked:v=>{blocked=v;if(v)workspace.stop();workspace.setLocked(v||locked);},setLocked:v=>workspace.setLocked(v||locked),onReady:()=>void workspace.reconnect()});
 if($('management-backup'))$('management-backup').textContent='下載交車紀錄備份';
 const sourceId=Number(new URLSearchParams(location.search).get('source'))||0;
 const portal=new PharmacyPortal.Connection({sourceId,label:'藥車標籤列印',onStatus:workspace.report});
 const engine=new PortalEngine({sourceId,origin:'',status:workspace.report});engine.portal=portal;
 const allowed=()=>{if(management.blocked||locked)throw Error('請先完成電腦登記與安裝資料夾確認。');};
 const services={
  async connect(report){allowed();const d=await engine.connect();return normalizeWards(d.control?.options||[]);},
  async source(){if(portal.sourceId){const tab=await chrome.tabs.get(portal.sourceId);await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});}},
  async capture(wards,scenario,report,stopped){
   return captureWards({engine,portal,parse:CartWorkspaceCore.parse,allowed},wards,report,stopped);
  }
 };
 portal.watch({needed:()=>!workspace.connected(),blocked:()=>blocked||locked||workspace.isBusy(),connect:()=>workspace.reconnect()});
 return services;
}

