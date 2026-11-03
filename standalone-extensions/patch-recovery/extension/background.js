'use strict';
let launches=Promise.resolve();
async function openTool(source){
  const own=chrome.runtime.getURL('');
  if(source?.url?.startsWith(own)){await chrome.windows.update(source.windowId,{focused:true});return;}
  const target=own+'tool.html';
  const prior=(await chrome.storage.session.get('patchWindow')).patchWindow;
  let found=null;
  if(prior?.tabId)try{found=await chrome.tabs.get(prior.tabId);}catch{}
  const valid=/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw\//.test(source?.url||'');
  const link=valid?{sourceId:source.id,origin:new URL(source.url).origin}:null;
  if(link)await chrome.storage.session.set({patchSource:link});
  if(found){
    await chrome.tabs.update(found.id,{active:true});await chrome.windows.update(found.windowId,{focused:true});
    if(link)chrome.runtime.sendMessage({kind:'patch-source',...link}).catch(()=>{});
    return;
  }
  const win=await chrome.windows.create({url:target,type:'popup',width:1440,height:940,focused:true});
  const tab=win.tabs?.[0]||(await chrome.tabs.query({windowId:win.id}))[0];
  if(tab?.id)await chrome.storage.session.set({patchWindow:{tabId:tab.id,windowId:win.id}});
}
chrome.action.onClicked.addListener(tab=>{launches=launches.catch(()=>{}).then(()=>openTool(tab));});

// A completed in-place update reopens the same tool tab after runtime.reload().
(async()=>{
  const {patchUpdateReopen}=await chrome.storage.local.get('patchUpdateReopen');
  if(!patchUpdateReopen)return;
  await chrome.storage.local.remove('patchUpdateReopen');
  if(Date.now()-patchUpdateReopen.at>5*60*1000)return;
  const link=patchUpdateReopen.patchSource;
  if(Number.isInteger(link?.sourceId)&&/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw$/.test(link.origin||''))await chrome.storage.session.set({patchSource:{sourceId:link.sourceId,origin:link.origin}});
  const target=chrome.runtime.getURL('tool.html');
  const existing=(await chrome.tabs.query({})).find(t=>t.url===target);
  if(existing){await chrome.tabs.update(existing.id,{url:target,active:true});await chrome.windows.update(existing.windowId,{focused:true});await chrome.storage.session.set({patchWindow:{tabId:existing.id,windowId:existing.windowId}});}
  else await openTool(null);
})().catch(()=>{});
