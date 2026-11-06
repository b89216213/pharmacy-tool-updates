import {withManagedOperation} from './managed-background.js';
let opening;
async function openWorkspace(source,{reload=false}={}){
 if(opening)return opening;
 opening=(async()=>{
  const url=chrome.runtime.getURL('labels/index.html');
  const existing=(await chrome.tabs.query({})).find(t=>t.url?.split(/[?#]/)[0]===url);
  if(existing){await chrome.tabs.update(existing.id,{...(reload?{url:existing.url}:{}),active:true});await chrome.windows.update(existing.windowId,{focused:true});return;}
  const valid=/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw\//.test(source?.url||'');
  await chrome.windows.create({url:url+(valid?'?source='+source.id:''),type:'popup',width:1280,height:900,focused:true});
 })().finally(()=>opening=null);
 return opening;
}
chrome.action.onClicked.addListener(tab=>void openWorkspace(tab));
chrome.runtime.onInstalled.addListener(d=>{if(d.reason==='install')void openWorkspace();});
chrome.runtime.onMessage.addListener((m,s,reply)=>{
 if(s.id!==chrome.runtime.id)return;
 const own=s.url?.startsWith(chrome.runtime.getURL(''));
 const portal=/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw\//.test(s.url||'');
 if(m?.type==='open-workspace'&&(own||portal)){
  openWorkspace(s.tab).then(()=>reply({ok:true}),e=>reply({ok:false,error:e.message}));return true;
 }
 if(m?.type==='arm-main'&&portal&&s.tab){
  withManagedOperation(s,()=>chrome.scripting.executeScript({target:{tabId:s.tab.id,frameIds:[s.frameId??0]},world:'MAIN',injectImmediately:true,files:['his-print-bus.js','hook.js']}))
   .then(()=>reply({ok:true}),e=>reply({ok:false,error:e.message}));return true;
 }
});
void (async()=>{const r=(await chrome.storage.local.get('cartUpdateReopen')).cartUpdateReopen;
 if(r&&Date.now()-r.at<300000){await chrome.storage.local.remove('cartUpdateReopen');await openWorkspace(undefined,{reload:true});}
})();
