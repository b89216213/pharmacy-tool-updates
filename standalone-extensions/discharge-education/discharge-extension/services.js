import {mountUpdater} from './updater.js';
import {mountManagement} from './management.js';
window.DischargeBlocked=true;window.DischargeUpdating=false;
let connected=false;
const $=id=>document.getElementById(id);
function inert(value){for(const screen of document.querySelectorAll('.screen,.stepnav'))screen.inert=value;document.getElementById('manualDialog').inert=value;for(const d of document.querySelectorAll('.education-dialog'))d.inert=value;document.getElementById('open-education').disabled=value;}
async function ready(){if(connected)return;connected=true;await window.DischargeCapture.init();await window.DischargeDaily.init();await window.DischargeEducation.init();}
inert(true);
try{
 await mountUpdater({isBusy:()=>!!window.CaptureRunning||!!window.EducationRunning||!!window.DischargeDaily.busy||!!document.querySelector('dialog[open]:not(#update-dialog)'),prepare:async()=>{window.DischargeUpdating=true;inert(true);},finish:()=>{window.DischargeUpdating=false;inert(window.DischargeBlocked);}});
 const management=await mountManagement({isBusy:()=>!!window.CaptureRunning||!!window.EducationRunning||!!window.DischargeDaily.busy||window.DischargeUpdating,saveDraft:async()=>{},setBlocked:value=>{if(window.DischargeBlocked===value)return;window.DischargeBlocked=value;window.DischargeDaily.render();window.DischargePresentation.schedule();},setLocked:value=>{inert(value||window.DischargeUpdating);if(value&&$('manualDialog').open)$('manualDialog').close();},onReady:()=>void ready(),exportBackup:async()=>{if(!visibleRows.length)throw Error('目前沒有可匯出的名單。');downloadCSV();}});
 if(!management.blocked)await ready();
}catch(e){notice('初始化失敗：'+e.message+'。請重新開啟工具。',true);}
