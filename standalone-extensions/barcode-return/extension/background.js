import {prepareLaunch} from './managed-background.js';
import {isReturnPage,returnFrames} from './return-pages.js';

const KEY='returnHelperEnabledV1';
const enabled=async()=>!!(await chrome.storage.session.get(KEY))[KEY];
let queue=Promise.resolve();
const serial=action=>{const result=queue.then(action,action);queue=result.catch(()=>{});return result;};
async function badge(text,title,tabId){
  const target=Number.isInteger(tabId)?{tabId}:{};
  await chrome.action.setBadgeText({...target,text});
  await chrome.action.setTitle({...target,title});
}
async function send(tabId,frameId,message){
  try{return await chrome.tabs.sendMessage(tabId,message,{frameId});}
  catch{
    throw Error('工具已更新；請先核對目前作業，再重新整理退藥頁面。');
  }
}
async function checkTab(tabId,passive=true){
  if(!Number.isInteger(tabId)||!await enabled())return;
  const frames=await returnFrames(tabId).catch(()=>[]);
  if(!frames.length){
    await badge('待','刷條碼退藥已開啟，進入退藥頁時自動顯示；再按圖示關閉。',tabId);
    return;
  }
  if(frames.length>1)throw Error('此分頁有多個退藥頁面，請先選定要使用的頁面。');
  if(!await prepareLaunch()){
    await badge('設','請先完成資料夾授權與電腦登記。',tabId);
    return;
  }
  const reply=await send(tabId,frames[0].frameId,{type:'show-return-helper',passive});
  await badge(reply?.shown?'ON':'待',reply?.shown?'刷條碼退藥已顯示；按圖示關閉。':'刷條碼退藥已收合；按圖示再次顯示。',tabId);
}
async function disable(){
  await chrome.storage.session.set({[KEY]:false});
  await badge('','刷條碼退藥：開啟');
  for(const tab of await chrome.tabs.query({})){
    const frames=await returnFrames(tab.id).catch(()=>[]);
    for(const frame of frames){
      await chrome.tabs.sendMessage(tab.id,{type:'hide-return-helper'},{frameId:frame.frameId}).catch(()=>{});
    }
    await badge('','刷條碼退藥：開啟',tab.id).catch(()=>{});
  }
}
async function toggle(tabId){
  if(await enabled()){
    const frames=await returnFrames(tabId).catch(()=>[]);
    if(frames.length===1){
      const state=await chrome.tabs.sendMessage(tabId,{type:'return-helper-state'},{frameId:frames[0].frameId}).catch(()=>null);
      // "回原畫面" dismisses this document. A direct click can reopen it.
      if(state?.shown===false){await checkTab(tabId,false);return;}
    }
    await disable();
    return;
  }
  await chrome.storage.session.set({[KEY]:true});
  await badge('待','刷條碼退藥已開啟，進入退藥頁時自動顯示；再按圖示關閉。');
  await checkTab(tabId,false);
}
const report=(task,tabId)=>void serial(task).catch(error=>badge('!',error.message,tabId).catch(()=>{}));
chrome.action.onClicked.addListener(tab=>report(()=>toggle(tab.id),tab.id));
chrome.tabs.onActivated.addListener(info=>report(()=>checkTab(info.tabId),info.tabId));
chrome.tabs.onUpdated.addListener((tabId,change)=>{
  if(change.status==='complete')report(()=>checkTab(tabId),tabId);
});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(sender.id!==chrome.runtime.id||!isReturnPage(sender.url)||!sender.tab)return;
  if(message?.type==='return-helper-ready'){
    reply({open:false});
    report(()=>checkTab(sender.tab.id),sender.tab.id);
  }
});
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local')return;
  report(async()=>{
    if(!await enabled())return;
    for(const tab of await chrome.tabs.query({active:true,lastFocusedWindow:true}))await checkTab(tab.id);
  });
});
// Retire old navigation requests on upgrade. Worker restarts only restore passive
// detection. This module never changes a tab's URL or window focus.
report(async()=>{
  await chrome.storage.session.remove('returnPendingNavigationV2');
  if(!await enabled()){await badge('','刷條碼退藥：開啟');return;}
  for(const tab of await chrome.tabs.query({active:true,lastFocusedWindow:true}))await checkTab(tab.id);
});
