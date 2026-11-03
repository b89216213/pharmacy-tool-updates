'use strict';
let launches=Promise.resolve();
async function focusPicker(source){
  const state=await chrome.storage.session.get('pickerWindows'),map=state.pickerWindows||{};
  let origin='';try{origin=new URL(source.url).origin;}catch{}
  const url=chrome.runtime.getURL('tool.html')+'?source='+source.id+'&origin='+encodeURIComponent(origin);
  const existing=map[source.id];
  if(existing){try{
    const tab=await chrome.tabs.get(existing.tabId);
    await chrome.tabs.update(tab.id,existing.origin===origin?{active:true}:{active:true,url});
    await chrome.windows.update(tab.windowId,{focused:true});
    if(existing.origin!==origin){map[source.id]={...existing,origin};await chrome.storage.session.set({pickerWindows:map});}
    return;
  }catch{delete map[source.id];}}
  const win=await chrome.windows.create({url,type:'popup',width:1280,height:900,focused:true});
  const tab=win.tabs?.[0]||(await chrome.tabs.query({windowId:win.id}))[0];
  if(!tab?.id)throw new Error('無法取得選人視窗。');
  map[source.id]={tabId:tab.id,windowId:win.id,origin};await chrome.storage.session.set({pickerWindows:map});
}
function launch(tab){launches=launches.catch(()=>{}).then(()=>focusPicker(tab));return launches;}
chrome.action.onClicked.addListener(tab=>{
  if(!tab.id)return;
  if(tab.url?.startsWith(chrome.runtime.getURL(''))){chrome.windows.update(tab.windowId,{focused:true}).catch(()=>{});return;}
  launch(tab).catch(()=>{});
});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(message?.kind!=='patient-picker-focus'||sender.id!==chrome.runtime.id||!sender.tab?.id)return;
  launch(sender.tab).then(()=>reply({ok:true}),()=>reply({ok:false}));return true;
});
chrome.tabs.onRemoved.addListener(async id=>{
  const state=await chrome.storage.session.get('pickerWindows'),map=state.pickerWindows||{};
  for(const [source,record]of Object.entries(map))if(+source===id||record.tabId===id)delete map[source];
  await chrome.storage.session.set({pickerWindows:map});
});

// Reload only this tool after an in-place update; never resume settlement.
launches=launches.catch(()=>{}).then(async()=>{
  const {pickerUpdateReopen:r}=await chrome.storage.local.get('pickerUpdateReopen');
  if(!r)return;
  await chrome.storage.local.remove('pickerUpdateReopen');
  if(!Number.isFinite(r.at)||Date.now()-r.at>300000||Date.now()<r.at||!Number.isInteger(r.sourceId)||!/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw$/.test(r.origin||''))return;
  let source;try{source=await chrome.tabs.get(r.sourceId);}catch{return;}
  if(new URL(source.url).origin!==r.origin)return;
  const base=chrome.runtime.getURL('tool.html'),url=base+'?source='+r.sourceId+'&origin='+encodeURIComponent(r.origin);
  const tabs=await chrome.tabs.query({}),existing=tabs.find(t=>t.url?.split(/[?#]/)[0]===base&&new URL(t.url).searchParams.get('source')===String(r.sourceId));
  if(existing){
    await chrome.tabs.update(existing.id,{url,active:true});await chrome.windows.update(existing.windowId,{focused:true});
    const {pickerWindows={}}=await chrome.storage.session.get('pickerWindows');pickerWindows[r.sourceId]={tabId:existing.id,windowId:existing.windowId,origin:r.origin};await chrome.storage.session.set({pickerWindows});
  }else await focusPicker(source);
}).catch(()=>{});
