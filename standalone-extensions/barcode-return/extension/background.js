import './managed-background.js';
import {RETURN_URL, isReturnPage, returnFrames} from './return-pages.js';
const PENDING = 'returnLaunchV1', queues = new Map();
const serial = (id, fn) => {
  const task = (queues.get(id) || Promise.resolve()).then(fn, fn);
  queues.set(id, task);
  void task.finally(() => { if (queues.get(id) === task) queues.delete(id); }).catch(() => {});
  return task;
};
const pending = async id => (await chrome.storage.session.get(PENDING + id))[PENDING + id];
chrome.action.onClicked.addListener(tab => { void serial(tab.id, async () => {
  const launch = await pending(tab.id);
  if (launch && Date.now() - launch.at < 60000) {
    await chrome.storage.session.set({[PENDING + tab.id]:{...launch, open:!launch.open}});
    return;
  }
  const frames = await returnFrames(tab.id);
  if (frames.length > 1) throw Error('目前有多個退藥頁面，請先保留一個再開啟工具。');
  if (frames.length) {
    const reply = await chrome.tabs.sendMessage(tab.id, {type:'toggle-return-helper'}, {frameId:frames[0].frameId});
    if (!reply || typeof reply.shown !== 'boolean') throw Error('請重新整理院內頁面以載入新版工具。');
    await chrome.action.setBadgeText({tabId:tab.id, text:reply.shown?'ON':''});
  } else {
    await chrome.storage.session.set({[PENDING + tab.id]:{at:Date.now(), open:true}});
    try { await chrome.tabs.update(tab.id, {url:RETURN_URL}); }
    catch (error) { await chrome.storage.session.remove(PENDING + tab.id); throw error; }
  }
  await chrome.action.setTitle({tabId:tab.id,title:'刷條碼退藥：開啟／關閉'});
}).catch(async error => {
  await chrome.action.setBadgeText({tabId:tab.id,text:'!'});
  await chrome.action.setTitle({tabId:tab.id,title:error.message || '請重新整理院內頁面後再按一次。'});
}); });
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.type !== 'return-helper-ready' || sender.id !== chrome.runtime.id || !isReturnPage(sender.url) || !sender.tab) return;
  serial(sender.tab.id, async () => {
    const launch = await pending(sender.tab.id);
    await chrome.storage.session.remove(PENDING + sender.tab.id);
    const open = !!launch?.open && Date.now() - launch.at < 60000;
    await chrome.action.setBadgeText({tabId:sender.tab.id,text:open?'ON':''});
    reply({open});
  }).catch(() => reply({open:false}));
  return true;
});
chrome.tabs.onRemoved.addListener(id => { void chrome.storage.session.remove(PENDING + id); });
