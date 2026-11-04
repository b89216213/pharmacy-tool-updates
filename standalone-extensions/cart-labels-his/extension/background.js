import {assertManaged,withManagedOperation} from './managed-background.js';
// 接收 HIS 頁面送來的資料，暫存（讀取後即刪除）。
// 已有開啟中的標籤工具分頁時，送到該分頁（可累加下一個病房）；否則開新分頁。
// 自動抓取：記住 HIS 查詢處理頁面所在分頁，標籤工具可要求它開始；抓取途中不切換分頁，最後一批才切到標籤工具。
const store = chrome.storage.session || chrome.storage.local;

async function deliverToOpenTool(job, focus) {
  const { toolTab } = await store.get('toolTab');
  if (!toolTab) return false;
  let tab;
  try { tab = await chrome.tabs.get(toolTab); } catch { return false; }
  // 標籤工具分頁剛開啟時可能還沒準備好，最多等 6 秒
  let delivered = false;
  for (let i = 0; i < 30 && !delivered; i++) {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'deliver-job', job, tabId: toolTab });
      delivered = !!res?.ok;
    } catch {}
    if (!delivered) {
      try { await chrome.tabs.get(toolTab); } catch { return false; }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  if (!delivered) return false;
  if (focus) {
    await chrome.tabs.update(toolTab, { active: true });
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch {}
  }
  return true;
}

async function startAuto(wards) {
  const { hisFrame } = await store.get('hisFrame');
  if (!hisFrame) throw new Error('找不到 HIS 查詢處理頁面，請先開啟並登入');
  try { await chrome.tabs.get(hisFrame.tabId); } catch { throw new Error('HIS 頁面已關閉，請重新開啟查詢處理頁面'); }
  const res = await chrome.tabs.sendMessage(hisFrame.tabId, { type: 'auto-run', wards }, { frameId: hisFrame.frameId });
  if (!res?.ok) throw new Error(res?.error || 'HIS 頁面沒有回應，請在 HIS 頁面按 F5 後再試');
  await chrome.tabs.update(hisFrame.tabId, { active: true });
}

function legacyMessage(msg, sender, sendResponse) {
  if (msg?.type === 'arm-main' && sender.tab) {
    chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] }, world: 'MAIN', injectImmediately: true, files: ['his-print-bus.js', 'hook.js'] })
      .then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  }
  if (msg?.type === 'register-tool' && Number.isInteger(msg.tabId)) {
    store.set({ toolTab: msg.tabId });
    return;
  }
  if (msg?.type === 'his-frame' && sender.tab) {
    store.set({ hisFrame: { tabId: sender.tab.id, frameId: sender.frameId || 0 } });
    return;
  }
  if (msg?.type === 'start-auto') {
    startAuto(msg.wards).then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg?.type !== 'open-labels' || typeof msg.text !== 'string') return;
  const job = 'job-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const batch = msg.batch || null;
  const focus = !batch || batch.last;
  (async () => {
    try {
      await store.set({ [job]: { text: msg.text, batch, at: Date.now() } });
      if (await deliverToOpenTool(job, focus)) return sendResponse({ ok: true, reused: true });
      const opts = { url: chrome.runtime.getURL('labels/index.html?job=' + job), active: focus };
      if (sender.tab) { opts.index = sender.tab.index + 1; opts.windowId = sender.tab.windowId; }
      const tab = await chrome.tabs.create(opts);
      await store.set({ toolTab: tab.id });
      sendResponse({ ok: true });
    } catch (err) {
      console.error(err);
      sendResponse({ ok: false, error: String(err?.message || err) });
    }
  })();
  return true;

}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 const guarded=['arm-main','start-auto','open-labels'];
 if(!guarded.includes(msg?.type))return legacyMessage(msg,sender,reply);
 const execute=()=>new Promise(resolve=>{legacyMessage(msg,sender,result=>{reply(result);resolve();});});
 const operation=msg.type==='start-auto'?assertManaged(sender).then(execute):withManagedOperation(sender,execute);
 operation.catch(e=>reply({ok:false,error:e.message}));return true;
});

chrome.tabs.onRemoved.addListener(async id => {
  const { toolTab, hisFrame } = await store.get(['toolTab', 'hisFrame']);
  if (toolTab === id) store.remove('toolTab');
  if (hisFrame?.tabId === id) store.remove('hisFrame');
});
