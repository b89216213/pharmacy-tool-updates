// 擴充功能橋接：讀取 HIS 頁面帶入的資料，填入並自動轉換。讀完即刪除暫存。
// 一般：勾選「加在後方」則累加（下一個病房），否則取代。
// 自動抓取（batch）：第一批先清空，各病房資料先累積，最後一批才轉換一次（避免中途跳出詢問視窗）。
let autoSummary = null; // 最近一次自動抓取結果，供 ux.js 顯示
// 自動抓取後轉換時，預設床位中「沒有病人資料」的病房：
// - 本次有查詢、確認沒有病人 → 直接產生空床標籤
// - 不在本次組合內 → 略過，不詢問
// - 查詢失敗 → 照原本方式詢問
async function chooseMissingWards(wards) {
  if (!autoSummary?.length) return chooseEmptyWards(wards);
  const byWard = new Map(autoSummary.map(r => [wardKey(r.ward), r]));
  const skip = new Set(), ask = [];
  for (const w of wards) {
    const r = byWard.get(wardKey(w.ward));
    if (!r) skip.add(wardKey(w.ward));
    else if (r.error) ask.push(w);
  }
  if (!ask.length) return skip;
  const answer = await chooseEmptyWards(ask);
  if (answer === null) return null;
  answer.forEach(k => skip.add(k));
  return skip;
}
(async () => {
  if (!globalThis.chrome?.storage) return;
  const store = chrome.storage.session || chrome.storage.local;
  const APPEND_KEY = 'cart-label-append-his-v1';
  try { const v = localStorage.getItem(APPEND_KEY); if (v !== null) $('appendHis').checked = v === '1'; } catch {}
  $('appendHis').addEventListener('change', () => { try { localStorage.setItem(APPEND_KEY, $('appendHis').checked ? '1' : '0'); } catch {} });

  let received = 0;
  async function applyJob(job, { forceReplace = false } = {}) {
    const data = (await store.get(job))[job];
    await store.remove(job);
    if (!data) { $('status').textContent = '帶入資料已失效，請回 HIS 頁面重新操作。'; return; }
    const batch = data.batch;
    if (batch) {
      if (batch.reset) { received = 0; autoSummary = null; $('clear').onclick(); }
      if (data.text) { $('source').value = appendSourceText($('source').value, data.text); received++; }
      if (!batch.last) {
        $('status').textContent = `自動抓取中…已接收 ${received} 個病房的資料。`;
        if (typeof afterRender === 'function') afterRender();
        return;
      }
      autoSummary = batch.summary || [];
      if ($('source').value.trim()) await convert(); else render();
      const n = autoSummary.reduce((s, r) => s + (r.count || 0), 0);
      $('status').textContent = `自動抓取完成：共 ${n} 位。` + $('status').textContent;
      if (typeof afterRender === 'function') afterRender();
      return;
    }
    if (!data.text) return;
    const existing = $('source').value;
    const append = !forceReplace && $('appendHis').checked && existing.trim();
    $('source').value = append ? appendSourceText(existing, data.text) : data.text;
    const before = append ? records.filter(t => !isVacantLabel(t)).length : 0;
    if (await convert()) {
      const now = records.filter(t => !isVacantLabel(t)).length;
      $('status').textContent = (append ? `已加入下一批 ${now - before} 位（共 ${now} 位）。` : '已從 HIS 帶入。') + $('status').textContent;
    }
  }

  // 依序處理：網址帶入的第一批 → 之後送來的各批
  let chain = Promise.resolve();
  const enqueue = (job, opt) => { chain = chain.then(() => applyJob(job, opt)).catch(e => { $('status').textContent = '無法讀取 HIS 帶入的資料：' + e.message; }); };
  const urlJob = new URLSearchParams(location.search).get('job');
  if (urlJob) { history.replaceState(null, '', location.pathname); enqueue(urlJob, { forceReplace: true }); }

  const me = await chrome.tabs.getCurrent();
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type !== 'deliver-job' || !me || msg.tabId !== me.id) return;
    enqueue(msg.job);
    sendResponse({ ok: true });
  });
  const announce = () => { if (me) chrome.runtime.sendMessage({ type: 'register-tool', tabId: me.id }).catch(() => {}); };
  announce();
  window.addEventListener('focus', announce);
})();
