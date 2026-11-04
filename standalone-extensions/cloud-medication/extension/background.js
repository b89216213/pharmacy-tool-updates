import './medref-bg.js';
import {withManagedOperation,internalSender,openManager} from './managed-background.js';
const pending = new Map();
const revisions = new Map();
const WINDOW_KEY = 'medicationFallbackWindowId';
const SIZE_KEY = 'medication-fallback-window-size';
let openingFallback = null;
const currentRevision = id => revisions.get(id) || 0;
const isCurrent = (id, revision) => currentRevision(id) === revision;

async function setStatus(tabId, mode) {
  const text=mode==='window'?'窗':mode==='error'?'!':'';
  const title=mode==='window'?'已使用獨立小視窗開啟整理器':mode==='error'?'無法開啟整理器，請再點一次重試':'顯示雲端藥歷整理器';
  await Promise.all([
    chrome.action.setPopup({tabId,popup:''}),
    chrome.action.setBadgeText({tabId,text}),
    chrome.action.setTitle({tabId,title}),
    chrome.action.setBadgeBackgroundColor({tabId,color:mode==='error'?'#b3261e':'#007c9d'})
  ]);
}
async function createOrFocusFallback() {
  const stored=await chrome.storage.session.get(WINDOW_KEY);
  const id=stored[WINDOW_KEY];
  if(Number.isInteger(id)){
    try {
      const existing=await chrome.windows.get(id);
      const update={focused:true};
      if(existing.state==='minimized')update.state='normal';
      await chrome.windows.update(id,update);
      return;
    } catch { await chrome.storage.session.remove(WINDOW_KEY); }
  }
  let host, size;
  try {host=await chrome.windows.getLastFocused();}catch{}
  try {size=(await chrome.storage.local.get(SIZE_KEY))[SIZE_KEY];}catch{}
  const width=Math.min(Number.isFinite(size?.width)?Math.max(480,size.width):1040,Math.max(480,(host?.width||1080)-40));
  const height=Math.min(Number.isFinite(size?.height)?Math.max(420,size.height):760,Math.max(420,(host?.height||820)-60));
  const options={url:chrome.runtime.getURL('app.html'),type:'popup',width:Math.round(width),height:Math.round(height),focused:true};
  if(Number.isFinite(host?.left)&&Number.isFinite(host?.top)){
    options.left=Math.round(host.left+Math.max(0,(host.width-width)/2));
    options.top=Math.round(host.top+Math.max(0,(host.height-height)/2));
  }
  const created=await chrome.windows.create(options);
  if(!Number.isInteger(created?.id))throw new Error('Window was not created');
  await chrome.storage.session.set({[WINDOW_KEY]:created.id});
}
function openFallback(){
  if(openingFallback)return openingFallback;
  openingFallback=createOrFocusFallback().finally(()=>{openingFallback=null;});
  return openingFallback;
}
async function showTool(tab,revision){
  try {
    const results=await chrome.scripting.executeScript({target:{tabId:tab.id},files:['overlay.js']});
    if(!results?.some(item=>item.result?.mode==='overlay'))throw new Error('No overlay acknowledgement');
  }catch{
    if(!isCurrent(tab.id,revision))return;
    // A failed injection is a compatibility check, not a definitive IE-mode flag.
    try {
      await openFallback();
      if(isCurrent(tab.id,revision))await setStatus(tab.id,'window');
    }catch{
      if(isCurrent(tab.id,revision))await setStatus(tab.id,'error');
    }
    return;
  }
  if(isCurrent(tab.id,revision))await setStatus(tab.id,'overlay');
}
chrome.action.onClicked.addListener(tab=>{
  if(!Number.isInteger(tab?.id))return;
  if(pending.has(tab.id))return pending.get(tab.id);
  const task=withManagedOperation(internalSender(),()=>showTool(tab,currentRevision(tab.id))).catch(()=>openManager()).finally(()=>{
    if(pending.get(tab.id)===task)pending.delete(tab.id);
  });
  pending.set(tab.id,task);return task;
});
chrome.tabs.onUpdated.addListener((tabId,change)=>{
  if(change.status!=='loading')return;
  revisions.set(tabId,currentRevision(tabId)+1);pending.delete(tabId);
  setStatus(tabId,'overlay').catch(()=>{});
});
chrome.tabs.onRemoved.addListener(tabId=>{
  revisions.set(tabId,currentRevision(tabId)+1);pending.delete(tabId);
});
chrome.windows.onBoundsChanged.addListener(win=>{
  if(win.state!=='normal'||!Number.isFinite(win.width)||!Number.isFinite(win.height)||win.width<100||win.height<100)return;
  chrome.storage.session.get(WINDOW_KEY).then(stored=>{
    if(stored[WINDOW_KEY]===win.id)return chrome.storage.local.set({[SIZE_KEY]:{width:win.width,height:win.height}});
  }).catch(()=>{});
});

// 「讀取目前頁面」：只在使用者按下按鈕時讀取整理器所在分頁的文字（等同全選複製），不自動讀取。
// 權限來自點工具列圖示時的 activeTab；獨立小視窗沒有原頁面可讀。
managedHostListener('read-host-page',(msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'read-host-page') return;
  const tab = sender && sender.tab;
  // 內嵌版的整理器在原頁面的 iframe 裡（frameId > 0）；獨立小視窗本身就是分頁的主框架
  if (!tab || !Number.isInteger(tab.id) || sender.frameId === 0) {
    sendResponse({ ok: false, error: '獨立小視窗無法讀取其他頁面，請在原頁面全選複製後貼上。' });
    return;
  }
  const grab = () => {
    try { return { url: location.href, top: window === window.top, text: document.body ? document.body.innerText : '' }; }
    catch (e) { return null; }
  };
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('逾時')), ms))]);
  const usable = r => r && r.result && r.result.text && r.result.text.trim() && !/^chrome-extension:/.test(r.result.url || '');
  (async () => {
    // 1) 主框架：立即注入（不等頁面閒置），頁面上隱藏或空白的 iframe（如 src="javascript:false"）不會卡住
    const main = await within(chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, func: grab, injectImmediately: true }), 5000);
    const parts = (main || []).filter(usable).map(r => r.result);
    // 2) 其他同網域框架：盡力讀取，3 秒內沒回應就略過
    try {
      const all = await within(chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: grab, injectImmediately: true }), 3000);
      for (const r of all || []) if (usable(r) && r.frameId !== 0) parts.push(r.result);
    } catch (e) {}
    if (!parts.length) throw new Error('頁面沒有可讀取的文字');
    const text = parts.map(p => p.text).join('\n');
    sendResponse({ ok: true, text, frames: parts.length, chars: text.length });
  })().catch(e => sendResponse({ ok: false,
    error: '無法讀取此頁面（' + ((e && e.message) || e) + '）。請重新整理頁面、再點一次工具列的「雲」圖示後重試，或改用全選複製貼上。' }));
  return true;
});

// 「一鍵載入」：在 HIS 病人頁面依序按「轉床」「出院」（已顯示就不按），再按「雲端」並從跳出的視窗讀回雲端藥歷。
// 在頁面本身的環境執行（world: MAIN），才能接住頁面用 window.open 開出的雲端視窗（同網域才讀得到）。
function rxAutoLoad(opts) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => (s || '').replace(/[\s ]+/g, '');
  const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const labelOf = el => norm(el.tagName === 'INPUT' ? (el.value || el.getAttribute('alt') || el.title) : (el.getAttribute('alt') || el.getAttribute('title') || el.textContent));
  const rank = el => el.matches('input[type=button],input[type=submit],button') ? 0 : el.matches('input[type=image],img') ? 1 : el.tagName === 'A' ? 2 : 3;
  const describe = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '「' + labelOf(el) + '」';
  const log = [];
  function find(re) {
    const all = [...document.querySelectorAll('input[type=button],input[type=submit],input[type=image],button,a,img[onclick],[onclick]')]
      .filter(el => !el.disabled && visible(el) && re.test(labelOf(el)));
    if (!all.length) return { el: null, n: 0 };
    all.sort((a, b) => rank(a) - rank(b));
    const best = all.filter(el => rank(el) === rank(all[0]));
    return best.length === 1 ? { el: best[0], n: 1 } : { el: null, n: best.length, list: best.slice(0, 4).map(describe) };
  }
  const prm = () => { try { return window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager.getInstance(); } catch (e) { return null; } };
  async function idle(ms) {
    for (let t = 0; t < ms; t += 200) { const p = prm(); if (!p || !p.get_isInAsyncPostBack()) return; await sleep(200); }
  }
  const pageText = () => document.body ? document.body.innerText : '';
  async function press(name, re, doneRe) {
    if (doneRe.test(pageText())) { log.push(name + '：已顯示'); return true; }
    const f = find(re);
    if (!f.el) { log.push(name + (f.n ? '：找到 ' + f.n + ' 個可能的按鈕（' + f.list.join('、') + '），未自動按' : '：找不到按鈕')); return false; }
    await idle(8000);
    f.el.click();
    for (let t = 0; t < 12000; t += 250) { await sleep(250); if (doneRe.test(pageText())) { await idle(5000); log.push(name + '：已按'); return true; } }
    log.push(name + '：已按 ' + describe(f.el) + '，但 12 秒內沒有出現資料'); return false;
  }
  const CLOUD = /來源\s+主診斷碼|健保雲端藥歷內容/;
  async function cloud() {
    const f = find(/^(健保)?雲端(藥歷)?(查詢|資料)?$/);
    if (!f.el) { log.push('雲端' + (f.n ? '：找到 ' + f.n + ' 個可能的按鈕（' + f.list.join('、') + '），未自動按' : '：找不到按鈕')); return ''; }
    // 同名視窗會被重複使用：剛開時看到的可能還是上一位病人的雲端頁面，必須等視窗換成新的文件才讀
    let popup = null, firstDoc = null, firstUrl = '';
    const grabDoc = w => { try { firstDoc = w.document; firstUrl = w.location.href; } catch (e) { firstDoc = null; firstUrl = ''; } };
    const orig = window.open;
    window.open = function () { const w = orig.apply(this, arguments); if (w && !popup) { popup = w; grabDoc(w); } return w; };
    const t0 = Date.now(), waitMs = opts.cloudWait || 45000;
    try {
      await idle(8000);
      const a = f.el.closest('a');
      if (a && a.href && /^https?:/.test(a.href) && a.target) { popup = orig.call(window, a.href, a.target); if (popup) grabDoc(popup); }
      else f.el.click();
    } finally { setTimeout(() => { window.open = orig; }, 5000); }
    const reused = () => firstDoc && firstUrl && firstUrl !== 'about:blank';
    let lastLen = -1, stableSince = 0;
    while (Date.now() - t0 < waitMs) {
      await sleep(300);
      let txt = '';
      if (popup) {
        if (popup.closed) { log.push(Date.now() - t0 < 15000 ? '雲端：視窗彈出後馬上關閉（這位病人的雲端藥歷開不起來）' : '雲端：視窗已被關閉'); return ''; }
        let doc;
        try { doc = popup.document; txt = doc && doc.body ? doc.body.innerText : ''; }
        catch (e) { log.push('雲端：視窗在其他網域，無法自動讀取，請在雲端視窗全選複製貼上'); return ''; }
        if (reused() && doc === firstDoc) {   // 還是上一位病人的舊頁面
          if (Date.now() - t0 > 10000) { log.push('雲端：雲端視窗沒有更新（仍是上一位病人的內容），未讀取'); return ''; }
          continue;
        }
        // 視窗已載入完成卻是錯誤訊息（不是雲端藥歷表）：內容穩定 4 秒就停止等待
        if (doc && doc.readyState === 'complete' && !CLOUD.test(txt)) {
          if (txt.length !== lastLen) { lastLen = txt.length; stableSince = Date.now(); }
          else if (txt.trim() && Date.now() - stableSince > 4000 && /查無|錯誤|失敗|無法|逾時|異常|未授權|請插|讀卡|error|fail/i.test(txt)) {
            log.push('雲端：視窗顯示「' + txt.replace(/\s+/g, ' ').trim().slice(0, 40) + '」，沒有雲端藥歷');
            return '';
          }
        }
      } else if (Date.now() - t0 > 10000) {
        // 10 秒內沒有跳出視窗：可能頁面顯示了提示訊息或雲端開不起來
        let found = '';
        for (const fr of document.querySelectorAll('iframe')) {
          try { const d = fr.contentDocument; const tt = d && d.body ? d.body.innerText : ''; if (CLOUD.test(tt)) { found = tt; break; } } catch (e) {}
        }
        if (!found) { log.push('雲端：已按，但沒有跳出雲端視窗'); return ''; }
        txt = found;
      }
      if (!CLOUD.test(txt)) {
        for (const fr of document.querySelectorAll('iframe')) {
          try { const d = fr.contentDocument; const tt = d && d.body ? d.body.innerText : ''; if (CLOUD.test(tt)) { txt = tt; break; } } catch (e) {}
        }
      }
      if (CLOUD.test(txt)) {
        await sleep(600);   // 等表格長完
        try { if (popup && popup.document.body.innerText.length > txt.length) txt = popup.document.body.innerText; } catch (e) {}
        log.push('雲端：已讀取');
        if (popup && opts.closePopup !== false) { try { popup.close(); } catch (e) {} }
        return txt;
      }
    }
    log.push(popup ? '雲端：視窗已開啟，但 ' + Math.round(waitMs / 1000) + ' 秒內沒有出現雲端藥歷' : '雲端：已按，但沒有接到跳出的視窗');
    return '';
  }
  return (async () => {
    let afterTransfer = '', text = '';
    if (opts.his !== false) {
      if (opts.press !== false) {
        if (await press('轉床', /^轉床(紀錄)?(查詢)?$/, /轉床紀錄/)) afterTransfer = pageText();
        await press('出院', /^出院(日)?$|^准許出院(日)?$/, /准許出院日/);
      } else log.push('病人頁面：已讀取');
      text = pageText();
    }
    // 若按「出院」後轉床紀錄被換掉，補回剛才讀到的轉床紀錄段落
    if (!/轉床紀錄/.test(text) && afterTransfer) {
      const L = afterTransfer.split('\n'); const i = L.findIndex(l => /轉床紀錄/.test(l));
      if (i >= 0) { const seg = [L[i]]; for (let j = i + 1; j < L.length && j < i + 40; j++) { if (/准許出院日|病人自備藥查詢|類別\s+狀態|序號\s+狀/.test(L[j])) break; seg.push(L[j]); } text = seg.join('\n') + '\n' + text; }
    }
    const cloudText = opts.cloud === false ? '' : await cloud();
    return { pageText: text, cloudText, log };
  })();
}
managedHostListener('auto-load-his',(msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'auto-load-his') return;
  const tab = sender && sender.tab;
  if (!tab || !Number.isInteger(tab.id) || sender.frameId === 0) {
    sendResponse({ ok: false, error: '獨立小視窗無法操作其他頁面，請在原頁面手動按鈕後全選複製貼上。' });
    return;
  }
  const keep = setInterval(() => { try { chrome.runtime.getPlatformInfo(() => void chrome.runtime.lastError); } catch (e) {} }, 20000);
  chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, world: 'MAIN', injectImmediately: true, func: rxAutoLoad,
    args: [{ his: msg.his !== false, press: msg.press !== false, cloud: msg.cloud !== false, closePopup: msg.closePopup !== false, cloudWait: 45000 }] })
    .then(res => { const r = res && res[0] && res[0].result; if (!r) throw new Error('沒有回傳結果'); sendResponse(Object.assign({ ok: true }, r)); })
    .catch(e => sendResponse({ ok: false, error: '無法操作此頁面（' + ((e && e.message) || e) + '）。請重新整理頁面、再點一次工具列的「雲」圖示後重試。' }))
    .finally(() => clearInterval(keep));
  return true;
});

function managedHostListener(type,listener){
 chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  if(msg?.type!==type)return;
  withManagedOperation(sender,()=>new Promise(resolve=>listener(msg,sender,value=>{reply(value);resolve();}))).catch(e=>reply({ok:false,error:e.message}));return true;
 });
}
