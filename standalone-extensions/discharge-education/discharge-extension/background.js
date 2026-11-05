importScripts('education-core.js');
'use strict';
// A single tool window prevents concurrent captures and conflicting print baselines.
let opening=Promise.resolve();
async function openTool(search){
 const base=chrome.runtime.getURL('tool.html');
 const windows=await chrome.windows.getAll({populate:true});
 const existing=windows.find(w=>w.tabs?.some(t=>t.url?.startsWith(base)));
 if(existing){await chrome.windows.update(existing.id,{focused:true});const sourceId=Number(new URLSearchParams(search).get('tab'));if(sourceId>0)await chrome.runtime.sendMessage({kind:'portal-prefer-source',sourceId}).catch(()=>{});return;}
 await chrome.windows.create({url:base+search,type:'popup',width:1280,height:930});
}
chrome.action.onClicked.addListener(tab=>{
 if(!tab.id)return;let origin='';try{origin=new URL(tab.url).origin;}catch{}
 opening=opening.catch(()=>{}).then(()=>openTool('?tab='+tab.id+'&origin='+encodeURIComponent(origin)));
});
(async()=>{const {dischargeUpdateReopen:value}=await chrome.storage.local.get('dischargeUpdateReopen');if(!value)return;await chrome.storage.local.remove('dischargeUpdateReopen');if(Date.now()-value.at<120000&&typeof value.search==='string')await openTool(value.search);})();

if(globalThis.navigator?.locks)navigator.locks.request('discharge-education-records',async()=>{const v=await chrome.storage.local.get(EducationCore.KEY);await chrome.storage.local.set({[EducationCore.KEY]:EducationCore.prune(v[EducationCore.KEY])});}).catch(()=>{});
