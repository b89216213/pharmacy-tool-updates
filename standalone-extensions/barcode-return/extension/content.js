(() => {
  'use strict';
  if (!/^https:\/\/ihisaw\.ntuh\.gov\.tw\/WebApplication\/PharManagement\/BarCodeDrugReturn\.aspx(?:[?#]|$)/i.test(location.href)) return;
  if (document.getElementById('ntuh-return-helper')) return;
  const C = globalThis.NTUHReturnCore, W = globalThis.NTUHReturnWorkflow, I = C.IDS;
  const COMMAND = 'ntuh-barcode-return-command-v1', SIGNAL = 'ntuh-barcode-return-signal-v1';
  const $ = id => document.getElementById(id);
  const host = document.createElement('div');
  host.id = 'ntuh-return-helper';
  host.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483000!important;pointer-events:none!important;';
  const ui = host.attachShadow({ mode: 'closed' });
  document.documentElement.append(host);
  ui.innerHTML = `<style>
:host {
  all: initial;
  font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif;
}
:host, :root {
  --bg: #fff;
  --side: #f4f7f9;
  --line: #d8e1e6;
  --ink: #243640;
  --muted: #566a76;
  --accent: #31546a;
  --fill: #31546a;
  --fill-hover: #254357;
  --on-fill: #fff;
  --soft: #e9f0f4;
  --row: #f6f9fb;
  --warn: #795015;
  --warn-bg: #fbf2df;
  --error: #983e32;
  --error-bg: #fff1ed;
  --ok: #276249;
  --ok-bg: #eaf4ee;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :host, :root {
    --bg: #1b262c;
    --side: #162128;
    --line: #384a54;
    --ink: #e4edf1;
    --muted: #b0bfc7;
    --accent: #a8cbdc;
    --fill: #a8cbdc;
    --fill-hover: #c3dfec;
    --on-fill: #142f3d;
    --soft: #2a414e;
    --row: #202f37;
    --warn: #f2cd8d;
    --warn-bg: #3c3222;
    --error: #ffb4a6;
    --error-bg: #422b29;
    --ok: #a0d8b9;
    --ok-bg: #253b32;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
button, input, select { font: inherit; }
button {
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--ink);
  cursor: pointer;
}
button:hover:not(:disabled) { background: var(--soft); border-color: var(--accent); }
button.primary, button[aria-expanded="true"], button.update-available {
  color: var(--on-fill);
  background: var(--fill);
  border-color: var(--fill);
  font-weight: 600;
}
button.primary:hover:not(:disabled), button[aria-expanded="true"]:hover:not(:disabled),
button.update-available:hover:not(:disabled) {
  color: var(--on-fill);
  background: var(--fill-hover);
  border-color: var(--fill-hover);
}
button:disabled, input:disabled, select:disabled { opacity: .55; cursor: default; }
:where(button, input, select, summary, a):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
input, select { min-width: 0; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--ink); padding: 6px 9px; }
input::placeholder { color: var(--muted); opacity: 1; }
input[type="checkbox"] { accent-color: var(--accent); width: 14px; height: 14px; margin: 0; }
.tool-header { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; min-height: 49px; padding: 10px 16px; border-bottom: 1px solid var(--line); background: var(--bg); }
.tool-header img { width: 27px; height: 27px; flex: 0 0 27px; }
.tool-header h1 { margin: 0; font-size: 17px; font-weight: 600; }
.tool-header .subtitle { font-size: 12px; color: var(--muted); }
.header-actions { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; margin-left: auto; }
.header-actions button { font-size: 12px; white-space: nowrap; }
#app { pointer-events: auto; position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--bg); color: var(--ink); color-scheme: inherit; overflow: hidden; }
.tool-header { flex: none; }
.workspace { display: grid; grid-template-columns: 268px minmax(0,1fr); flex: 1; min-height: 0; }
aside { background: var(--side); border-right: 1px solid var(--line); padding: 18px 14px; overflow: auto; }
.scan { display: grid; gap: 8px; margin: 0; }
.scan label, .patient h2 { font-size: 13px; font-weight: 500; color: var(--muted); margin: 0; }
.scan input { width: 100%; height: 50px; padding: 9px 12px; font-size: 19px; border-color: var(--muted); font-variant-numeric: tabular-nums; }
.scan input::placeholder { font-size: 14px; }
.scan #barcode-error { grid-column: 1 / -1; order: 5; }
.scan input[aria-invalid="true"] { border-color: var(--error); }
.scan button { min-height: 34px; font-size: 13px; }
.patient { border-top: 1px solid var(--line); margin-top: 18px; padding-top: 16px; }
.patient .identity { display: flex; align-items: baseline; flex-wrap: wrap; gap: 3px 8px; margin: 6px 0 8px; }
.bed { font-size: 21px; color: var(--accent); font-weight: 650; }
.patient strong { font-size: 16px; }
.patient dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 8px; margin: 0; font-size: 12px; }
.patient dt, .muted, .hint { color: var(--muted); }
.patient dd { margin: 0; overflow-wrap: anywhere; }
main { min-width: 0; padding: 14px; overflow: auto; }
.section-head, .toolbar, .toolbar label, footer, .actions { display: flex; align-items: center; flex-wrap: wrap; }
.section-head { gap: 8px; padding: 2px 0 10px; border-bottom: 1px solid var(--line); }
.section-head h2 { font-size: 16px; font-weight: 600; margin: 0; }
#count { color: var(--muted); font-size: 12px; }
.toolbar { margin-left: auto; gap: 8px 14px; font-size: 12px; }
.toolbar label { gap: 6px; }
.toolbar select { font-size: 13px; max-width: 210px; height: 32px; }
.scroll { overflow-x: auto; }
#orders > .scroll { margin-top: 10px; border: 1px solid var(--line); border-radius: 7px; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.order-table { min-width: 960px; table-layout: fixed; font-size: 13px; line-height: 1.35; }
th { background: var(--side); color: var(--muted); font-size: 12px; font-weight: 500; text-align: center; padding: 8px 5px; }
td { text-align: center; padding: 6px 6px; border-top: 1px solid var(--line); }
.order-row { background: var(--row); }
.order-row:focus-within { background: var(--soft); }
.order-row input[type=checkbox] {
  appearance: none;
  display: inline-grid;
  place-content: center;
  padding: 0;
  border-radius: 3px;
  border: 1px solid var(--fill);
  background: var(--fill);
  opacity: 1;
}
.order-row input[type=checkbox]:checked::after {
  content: "";
  width: 6px;
  height: 3px;
  border: solid var(--on-fill);
  border-width: 0 0 2px 2px;
  transform: translateY(-1px) rotate(-45deg);
}
@media (forced-colors: active) {
  .order-row input[type=checkbox] { appearance: auto; }
  .order-row input[type=checkbox]::after { display: none; }
}
.left { text-align: left; }
.med { overflow-wrap: anywhere; }
.med strong { font-size: 14px; display: block; }
.med small, .sub, .meta, .regimen span { color: var(--muted); font-size: 12px; }
.meta { display: flex; gap: 2px 10px; flex-wrap: wrap; margin-top: 3px; }
.state { font-size: 11px; padding: 1px 5px; margin-left: 2px; background: var(--soft); color: var(--ink); border-radius: 4px; }
.sub { margin-top: 2px; }
.regimen div { overflow-wrap: anywhere; }
.regimen span { margin-right: 6px; }
th.qty-col { color: var(--accent); font-weight: 650; }
.qty { width: 76px; max-width: 100%; height: 32px; text-align: center; font-size: 16px; font-weight: 600; border-color: var(--accent); }
.qty[aria-invalid=true] { border-color: var(--error); background: var(--error-bg); }
.invalid-note { color: var(--error); font-size: 12px; margin-top: 3px; }
.invalid-note:empty { display: none; }
.detail-btn { padding: 4px 8px; font-size: 13px; }
.expanded > td { padding: 0; text-align: left; }
.detail-body { padding: 12px 14px; border-left: 3px solid var(--accent); }
.record table { min-width: 500px; width: 100%; font-size: 12px; }
.record td, .record th { text-align: left; white-space: pre-line; padding: 6px 8px; }
.record caption { padding: 4px 0 6px; text-align: left; color: var(--ink); font-weight: 600; }
.record, .history-section, .secondary { margin-top: 8px; }
.detail-body > :first-child { margin-top: 0; }
.record .negative { color: var(--error); font-weight: 600; }
.secondary { padding-top: 8px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
.secondary summary { cursor: pointer; }
.secondary dl { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px 16px; }
.secondary dd { margin: 2px 0 0; color: var(--ink); white-space: pre-wrap; overflow-wrap: anywhere; }
.secondary h4 { margin: 9px 0 4px; }
footer { position: sticky; bottom: 0; gap: 8px; padding: 10px 0; border-top: 1px solid var(--line); background: var(--bg); }
footer .hint { font-size: 12px; }
.actions { margin-left: auto; gap: 7px; }
.actions button { font-size: 13px; min-height: 34px; }
#submit { min-width: 88px; }
.status { padding: 7px 10px; border-left: 3px solid var(--accent); background: var(--soft); color: var(--ink); font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; margin-bottom: 10px; }
.status:empty { display: none; }
.status.error { color: var(--error); background: var(--error-bg); border-color: var(--error); }
.status.warn, #management-notice { color: var(--warn); background: var(--warn-bg); border-color: var(--warn); }
#management-notice { margin: 0; }
.status.ok { color: var(--ok); background: var(--ok-bg); border-color: var(--ok); }
.empty { text-align: center; color: var(--muted); padding: 32px 12px; font-size: 13px; }
.empty strong { display: block; margin-bottom: 7px; font-size: 15px; font-weight: 500; color: var(--ink); }
@media (max-width: 1280px) {
  .workspace { display: flex; flex-direction: column; overflow: auto; }
  aside { padding: 12px 14px; border: 0; border-bottom: 1px solid var(--line); overflow: visible; }
  .scan { grid-template-columns: auto minmax(180px, 450px) auto auto; align-items: center; justify-content: start; }
  .patient { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px 14px; padding-top: 8px; margin-top: 10px; }
  .patient .identity { margin: 0; }
  .patient dl { display: flex; flex-wrap: wrap; align-items: baseline; }
  .patient dd { margin-right: 7px; }
  main { overflow: visible; }
}
@media (max-width: 640px) {
  .tool-header { gap: 7px; padding: 9px 12px; }
  .header-actions { gap: 4px; }
  main, aside { padding: 12px; }
  .scan { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .scan label, .scan input { grid-column: 1 / -1; }
  .toolbar { margin-left: 0; }
  .section-head { gap: 6px 8px; }
  .section-head .toolbar { width: 100%; }
  .secondary dl { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
.header-actions button { max-width: min(210px, 45vw); overflow: hidden; text-overflow: ellipsis; }
.status.warn, .status.error { position: sticky; top: 0; z-index: 1; }
.status.ready { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; padding: 0; border: 0; margin: 0; }
@media (max-width: 850px) {
  #orders > .scroll { border: 0; overflow: visible; }
  .order-table, .order-table > tbody { display: block; min-width: 0; width: 100%; }
  .order-table > colgroup { display: none; }
  .order-table > thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .order-row { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); align-items: start; gap: 7px 8px; padding: 10px; border: 1px solid var(--line); border-radius: 7px; margin-top: 8px; }
  .order-row > td { border: 0; padding: 0; }
  .order-row .order-id { grid-column: 1 / -1; grid-row: 1; padding-left: 23px; }
  .order-id .sub { display: inline-block; margin-left: 6px; }
  .order-row .selected-mark { grid-column: 1; grid-row: 1; justify-self: start; }
  .order-row .med { grid-column: 1 / -1; }
  .order-row .regimen { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 3px 10px; }
  .order-row .regimen span { margin-right: 3px; }
  .order-row td[data-label] { text-align: left; }
  .order-row td[data-label]::before { content: attr(data-label); display: block; color: var(--muted); font-size: 12px; }
  .order-row .qty-col { grid-column: 1 / 4; display: flex; align-items: center; flex-wrap: wrap; gap: 5px 9px; }
  .order-row .qty-col .invalid-note { width: 100%; }
  .order-row .detail-cell { align-self: center; justify-self: end; }
  .expanded, .expanded > td { display: block; min-width: 0; }
  .detail-body { padding: 8px; }
  .record { max-width: 100%; }
}
  </style>
  <section id="app" lang="zh-Hant" hidden aria-label="刷條碼退藥輔助">
    <header class="tool-header">
      <img src="${chrome.runtime.getURL('icons/mark.svg')}" width="27" height="27" alt="">
      <h1>刷條碼退藥</h1><span class="subtitle">v${chrome.runtime.getManifest().version}</span>
      <div class="header-actions">
        <button type="button" id="management">登記電腦</button>
        <button type="button" id="updates">工具更新</button>
        <button type="button" id="native">回原畫面</button>
      </div>
    </header>
    <div id="management-notice" class="status" role="status" hidden></div>
    <div class="workspace">
      <aside aria-label="處方查詢">
        <form id="scan-form" class="scan">
          <label for="barcode">處方條碼</label>
          <input id="barcode" type="text" lang="en" inputmode="text" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" aria-describedby="barcode-error" placeholder="掃描或輸入條碼">
          <div id="barcode-error" class="invalid-note" role="status" aria-live="polite"></div>
          <button type="submit" class="primary" id="query">查詢處方</button>
          <button type="button" id="read">讀取目前處方</button>
        </form>
        <section id="patient" class="patient" aria-label="目前病人" hidden></section>
      </aside>
      <main>
        <div id="status" class="status" role="status" aria-live="polite"></div>
        <section aria-labelledby="orders-title">
          <div class="section-head">
            <h2 id="orders-title">退藥處方</h2><span id="count"></span>
            <div class="toolbar" id="toolbar" hidden>
              <label>退藥藥局<select id="pharmacy" aria-label="退藥藥局"></select></label>
              <label><input type="checkbox" id="show-history" checked>顯示退藥明細</label>
            </div>
          </div>
          <div id="orders"></div>
          <footer id="footer" hidden>
            <span class="hint" id="summary"></span>
            <div class="actions"><button type="button" id="clear">清空數量</button><button type="button" id="submit" class="primary" disabled>確定退藥</button></div>
          </footer>
        </section>
      </main>
    </div>
  </section>`;
  const el = id => ui.getElementById(id);
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = { rows: [], patient: null, values: new Map(), expanded: new Set(), busy: false, valid: false, uncertain: false, table: null, mode:'batch', nativeRows:[], pharmacy: '', pharmacyOptions: [], shown: false, phase: 'idle' };
  let bridgeBusy = false, managementBlocked = true, updateFrozen = false;
  let setupPrompted = false;
  let managementChecking = false, previousFocus = null, previousInert = false, updateOriginalInert = false;
  async function managedRequest(action, extra = {}) {
    let reply;
    try { reply = await chrome.runtime.sendMessage({kind:'managed-tool', action, ...extra}); }
    catch { throw new Error('工具已更新或連線中斷，請先核對目前結果，再重新整理院內頁面。'); }
    if (!reply?.ok) throw new Error(reply?.error || '電腦管理驗證未完成。');
    return reply.data;
  }
  async function refreshManagement() {
    if (managementChecking || (!state.shown && !state.busy)) return;
    managementChecking = true;
    try {
      const result = await managedRequest('status');
      if(['installation','registration'].includes(result.state)&&!setupPrompted){
        setupPrompted=true;await managedRequest('open');
      }
      const wasBlocked = managementBlocked;
      managementBlocked = result.state !== 'allowed';
      el('management-notice').textContent = managementBlocked ? result.reason + ' 請按「登記電腦」查看。' : (result.updateAvailable ? '有新版 v' + result.latestVersion + '，完成目前作業後可開啟工具更新。' : '');
      el('management-notice').hidden = !managementBlocked && !result.updateAvailable;
      syncControls();
      if (wasBlocked && !managementBlocked && state.shown && !state.busy && (!ui.activeElement || ui.activeElement === el('management'))) el('barcode').focus();
      el('management').textContent = managementBlocked ? '登記電腦' : (result.deviceName || '登記電腦');
      el('management').title = result.deviceName ? '電腦登記：' + result.deviceName : '登記電腦';
      el('updates').textContent = result.updateAvailable ? '更新可用' : '工具更新';
      el('updates').classList.toggle('update-available', !!result.updateAvailable);
    } catch (error) { managementBlocked = true; el('management-notice').hidden = false; el('management-notice').textContent = error.message; }
    finally { managementChecking = false; syncControls(); }
  }
  let portalLeaseToken=null,portalLeaseTimer=null;
  function keepPortalLease(token){portalLeaseToken=token;clearInterval(portalLeaseTimer);portalLeaseTimer=setInterval(()=>{if(portalLeaseToken)void managedRequest('touch',{token:portalLeaseToken}).catch(()=>{});},20000);}
  async function releaseLease(token) {
    clearInterval(portalLeaseTimer);portalLeaseToken=null;
    if (!token) return;
    try { await managedRequest('release', {token}); }
    catch { managementBlocked = true; el('management-notice').hidden = false; el('management-notice').textContent = '管理連線已中斷。請核對退藥結果後，再重新整理頁面。'; }
  }
  const identity = patient => [patient.account, patient.chart, patient.bed].join('|');
  function message(text, kind = '') { el('status').textContent = text; el('status').className = 'status ' + (kind === 'error' && state.uncertain ? 'warn' : kind); }
  function nativeButton(primary, alternate) { return $(primary) ? primary : alternate; }
  function checkPatient(expected) {
    const actual = C.readPatient(document);
    if (!expected.account || !actual.account || identity(expected) !== identity(actual)) throw new Error('病人或住院資料已改變，請重新刷入條碼。');
  }
  function send(type, id, token) { window.dispatchEvent(new CustomEvent(COMMAND, {detail: JSON.stringify({type, id, token})})); }
  function ready() {
    return new Promise((resolve, reject) => {
      const token = crypto.randomUUID();
      const timeout = setTimeout(() => finish(new Error('無法連接原頁面，請重新整理院內頁面後再試。')), 1800);
      const listener = event => { let data; try { data = JSON.parse(event.detail); } catch { return; } if (data.token === token && data.type === 'ready') finish(data.hooked && !data.busy ? null : new Error(data.busy ? '原系統正在處理，請稍後再試。' : '原頁面的查詢元件尚未就緒，請回原畫面確認。')); };
      function finish(error) { clearTimeout(timeout); window.removeEventListener(SIGNAL, listener); error ? reject(error) : resolve(); }
      window.addEventListener(SIGNAL, listener); send('ping', '', token);
    });
  }
  // Every action requires a new native AJAX response. Never retry a write.
  async function nativeAction(type, id, inspect, description) {
    if(portalLeaseToken)await managedRequest('touch',{token:portalLeaseToken});
    const token = crypto.randomUUID();
    return W.runNativeAction({ ready, token, inspect, description,
      isBusy: () => bridgeBusy, send: () => send(type, id, token),
      subscribe: callback => {
        const listener = event => { let data; try { data = JSON.parse(event.detail); } catch { return; } callback(data); };
        window.addEventListener(SIGNAL, listener);
        return () => window.removeEventListener(SIGNAL, listener);
      }
    });
  }
  window.addEventListener(SIGNAL, event => {
    let data; try { data = JSON.parse(event.detail); } catch { return; }
    if (typeof data.busy === 'boolean') bridgeBusy = data.busy;
    if (data.type === 'begin' && !state.busy && state.valid) invalidate('原畫面已進行其他操作，請重新讀取處方。');
  });
  function invalidate(text) { state.valid = false; message(text, 'error'); syncControls(); }
  function hasAmounts() { return [...state.values.values()].some(value => C.clean(value)); }
  function hasNativeAmounts() { return C.readReturns(document).some(row => C.clean(row.amount)); }
  function setBusy(busy, phase = '') { state.busy = busy; state.phase = phase; syncControls(); }
  function syncControls() {
    document.documentElement.dataset.pharmacyUnsaved=String(state.busy||hasAmounts()||state.uncertain);
    for (const id of ['barcode','query','read','clear','pharmacy']) el(id).disabled = state.busy || updateFrozen || (managementBlocked && id !== 'clear') || (state.uncertain && id !== 'read');
    for (const input of ui.querySelectorAll('.qty')) input.disabled = state.busy || updateFrozen || managementBlocked || !state.valid;
    for (const button of ui.querySelectorAll('.detail-btn')) button.disabled = state.busy || updateFrozen || managementBlocked || !state.valid || state.uncertain;
    const checked = state.rows.map(row => C.validateAmount(state.values.get(row.key), row));
    el('summary').textContent = '已填數量 ' + [...state.values.values()].filter(value => C.clean(value)).length + ' / ' + state.rows.length + ' 筆';
    el('submit').disabled = state.busy || updateFrozen || managementBlocked || !state.valid || state.uncertain || !checked.some(v => v.valid && v.value !== null && v.value !== 0) || checked.some(v => !v.valid);
    el('submit').textContent = state.phase === 'commit' ? '處理中…' : '確定退藥';
    el('read').textContent = state.uncertain ? '確認原畫面後重新讀取' : '讀取目前處方';
  }
  function recordTable(data, label, numericColumn) {
    if (!data) return `<div class="record muted">原頁面未顯示${esc(label)}。</div>`;
    if (!data.rows.length) return `<div class="record muted">原頁面此表格沒有資料。</div>`;
    return `<div class="record scroll"><table aria-label="${esc(label)}"><caption>${esc(label)}</caption><thead><tr>${data.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row => `<tr>${row.map((text, i) => `<td${i === numericColumn && C.number(text) < 0 ? ' class="negative"' : ''}>${esc(text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function detailHtml(row) {
    const d = row.detail;
    if (!d?.daily) return '<div class="muted">開啟「詳」時讀取發退藥紀錄。</div>';
    return `${recordTable(d.daily, '發退藥紀錄', 4)}<div class="history-section"${el('show-history').checked ? '' : ' hidden'}>${recordTable(d.history, '退藥紀錄', 2)}</div>
      <details class="secondary"><summary>其他處方資訊</summary><dl>${d.fields.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${d.delivery ? '<h4>送藥紀錄</h4>' + recordTable(d.delivery,'送藥紀錄',3) : ''}${d.review ? '<details><summary>覆核紀錄</summary>' + recordTable(d.review,'覆核紀錄') + '</details>' : ''}</details>`;
  }
  function render() {
    const exists = state.rows.length > 0;
    for (const id of ['patient','toolbar','footer']) el(id).hidden = !exists;
    if (!exists) {
      el('count').textContent = '';
      el('orders').innerHTML = '<div class="empty"><strong>尚未載入處方</strong>若原畫面已有處方，可按「讀取目前處方」。</div>';
      syncControls();
      return;
    }
    const p = state.patient;
    el('patient').innerHTML = `<h2>目前病人</h2>
      <div class="identity"><span class="bed">${esc(p.bed)}</span><strong>${esc(p.name)}</strong></div>
      <dl><dt>病歷號</dt><dd>${esc(p.chart)}</dd><dt>住院號</dt><dd>${esc(p.account)}</dd></dl>
      <span class="muted">${esc([p.sex, p.age].filter(Boolean).join(' · '))}</span>`;
    el('count').textContent = '已勾選 ' + state.rows.length + ' 筆';
    el('pharmacy').innerHTML = state.pharmacyOptions.map(option => `<option value="${esc(option.value)}">${esc(option.text)}</option>`).join('');
    el('pharmacy').value = state.pharmacy;
    el('orders').innerHTML = `<div class="scroll"><table class="order-table" aria-label="處方及新退藥量"><colgroup><col style="width:42px"><col style="width:142px"><col><col style="width:128px"><col style="width:76px"><col style="width:76px"><col style="width:70px"><col style="width:75px"><col style="width:112px"><col style="width:58px"></colgroup><thead><tr><th>選</th><th class="left">處方</th><th class="left">藥品</th><th class="left">用法</th><th>總發藥量</th><th>總退藥量</th><th>餘量</th><th>批次量</th><th class="qty-col">新退藥量</th><th>詳</th></tr></thead><tbody>${state.rows.map((row, index) => {
      const expanded = state.expanded.has(row.key);
      return `<tr class="order-row"><td class="selected-mark"><input type="checkbox" checked disabled aria-label="已選取處方 ${esc(row.serial)}"></td><td class="left order-id"><strong>${esc(row.serial)}</strong> <span class="state">${esc(row.state)}</span><div class="sub">處方 ${esc(row.prescription)}</div><div class="sub">開方 ${esc(C.day(row.prescribedDate))}</div><div class="sub">開始 ${esc(C.day(row.start))}</div></td><td class="left med"><strong>${esc(row.brand)}</strong><small>${esc(row.generic)}</small><div class="meta"><span>階 ${esc(row.priority || '—')}</span><span>類 ${esc(row.type || '—')}</span><span>帳 ${esc(row.accountType || '—')}</span><span>組 ${esc(row.group || '—')}</span></div></td><td class="left regimen"><div><span>劑量</span>${esc(row.dose)}</div><div><span>頻率</span>${esc(row.frequency)}</div><div><span>途徑</span>${esc(row.route)}</div><div><span>天數</span>${esc(row.days)}</div></td><td data-label="總發藥量">${esc(row.issued ?? '—')}</td><td data-label="總退藥量">${esc(row.returned ?? '—')}</td><td data-label="餘量">${esc(row.rest ?? '—')}</td><td data-label="批次量">${esc(row.batch || '—')}</td><td class="qty-col" data-label="新退藥量"><input type="text" class="qty" aria-describedby="error-${index}" data-index="${index}" aria-label="處方 ${esc(row.serial)} 新退藥量" maxlength="${row.maxLength}" autocomplete="off" spellcheck="false" value="${esc(state.values.get(row.key) || '')}"><div class="invalid-note" id="error-${index}"></div></td><td class="detail-cell"><button type="button" class="detail-btn" data-index="${index}" aria-label="處方 ${esc(row.serial)} 詳情" aria-expanded="${expanded}" aria-controls="detail-${index}">詳</button></td></tr><tr class="expanded" id="detail-${index}"${expanded ? '' : ' hidden'}><td colspan="10"><div class="detail-body">${detailHtml(row)}</div></td></tr>`;
    }).join('')}</tbody></table></div>`;
    for (const input of ui.querySelectorAll('.qty')) {
      const check = C.validateAmount(input.value, state.rows[Number(input.dataset.index)]);
      input.setAttribute('aria-invalid', String(!check.valid));
      el('error-' + input.dataset.index).textContent = check.valid ? '' : check.message;
    }
    syncControls();
  }
  async function ensureSource(expectedPatient = null) {
    if (expectedPatient) checkPatient(expectedPatient);
    if ($(I.returns)) {
      if (hasNativeAmounts()) throw new Error('原畫面已有新退藥量，請先在原畫面完成或清空，再重新讀取。');
      const previous = $(I.returns);
      await nativeAction('click', nativeButton(I.rechoose, I.rechoose + '1'), () => !previous.isConnected && $(I.list), '重新選擇處方');
    }
    if (expectedPatient) checkPatient(expectedPatient);
  }
  async function readOrderDetail(patient, order) {
    const detail = await W.readDetailWithRetry(async () => {
      checkPatient(patient);
      const current = C.readOrders(document).find(item => item.key === order.key);
      if (!current?.detailId) throw new Error('找不到處方 ' + order.serial + ' 的「詳」按鈕。');
      const checkbox = $(I.showReturns);
      if (!checkbox) throw new Error('找不到「顯示退藥明細」選項。');
      checkbox.checked = true;
      return nativeAction('click', current.detailId, () => {
        checkPatient(patient);
        return C.readDetail(document, order);
      }, '讀取處方詳情');
    });
    const {root, ...data} = detail;
    if (order.detail?.orderId && data.orderId !== order.detail.orderId) throw new Error('處方識別資料已變更，請重新讀取。');
    return data;
  }
  async function collect(expectedPatient = null) {
    await ensureSource(expectedPatient);
    const patient = C.readPatient(document);
    if (expectedPatient) checkPatient(expectedPatient);
    if (!patient.account || !patient.chart) throw new Error('尚未取得完整病人資料，請確認條碼查詢結果。');
    const orders = C.readOrders(document);
    if (!orders.length) throw new Error('原畫面沒有可退藥的處方，請確認條碼與查詢條件。');
    const show = $(I.showReturns);
    if (!show) throw new Error('找不到「顯示退藥明細」選項，請回原畫面確認。');
    show.checked = true;
    // Load the native selection once. Full history is fetched only on demand.
    return openReturnGrid(patient, orders);
  }
  function assertSameOrders(orders, fresh) {
    if (new Set(orders.map(row => row.key)).size !== orders.length || new Set(fresh.map(row => row.key)).size !== fresh.length) throw new Error('原始處方識別資料重複，請回原畫面確認。');
    const fields = ['state','generic','brand','dose','frequency','route','days','type','priority','accountType','group'];
    if (fresh.length !== orders.length || fresh.some(o => !orders.some(before => before.key === o.key && fields.every(k => before[k] === o[k])))) throw new Error('讀取期間處方內容已變更，請重新查詢。');
  }
  function readReturnPharmacy() {
    const select = $(I.pharmacy);
    if (!select || !select.options.length) throw new Error('未取得退藥藥局，請回原畫面確認。');
    const pharmacyOptions = Array.from(select.options, option => ({value:option.value,text:option.textContent,disabled:option.disabled || option.parentElement?.disabled === true}));
    const pharmacy = C.defaultPharmacy(pharmacyOptions, select.value);
    if (select.value !== pharmacy) select.value = pharmacy;
    return {pharmacy, pharmacyOptions};
  }
  async function openReturnGrid(patient, orders, matchOptions = {}) {
    checkPatient(patient);
    const fresh = C.readOrders(document);
    assertSameOrders(orders, fresh);
    if (hasNativeAmounts()) throw new Error('原畫面已有新退藥量，請先回原畫面核對。');
    const table = $(I.list);
    for (const checkbox of table.querySelectorAll('input[id$="_ckbSelect"]')) {
      if (checkbox.disabled && checkbox.checked) throw new Error('原清單含已停用且被勾選的處方，請回原畫面核對。');
      if (!checkbox.disabled) checkbox.checked = fresh.some(order => order.checkboxId === checkbox.id);
    }
    const previous = $(I.list);
    message('正在全選處方並開啟退藥輸入…');
    await nativeAction('click', nativeButton(I.open, I.open + '2'), () => !previous.isConnected && $(I.returns), '勾選退藥');
    checkPatient(patient);
    const nativeRows = C.readReturns(document);
    if (nativeRows.some(row => C.clean(row.amount))) throw new Error('退藥欄位已有數量，已停止處理。請回原畫面核對。');
    const plan = C.planOrderMatches(orders, nativeRows, matchOptions);
    const selection = readReturnPharmacy();
    if (plan.unresolved.length) {
      const result = await readIndividually(patient, orders, plan, matchOptions);
      if (!result.pharmacyOptions.some(option => option.value === selection.pharmacy)) throw new Error('退藥藥局選項已變更，請重新讀取。');
      $(I.pharmacy).value = selection.pharmacy;
      return {...result,pharmacy:selection.pharmacy};
    }
    const rows = plan.rows;
    return { patient, rows, mode:'batch', nativeRows:C.readReturns(document), table: $(I.returns), ...selection };
  }
  // The return grid does not expose a prescription identifier. When display
  // fields collide, select one source key and require exactly one returned row.
  // Never infer a duplicate's identity from row position or an expected amount.
  async function openSingleReturn(patient, allOrders, wanted, {refreshDetail = false, useDailyTotals = true} = {}) {
    await ensureSource(patient);
    let fresh = C.readOrders(document);
    assertSameOrders(allOrders, fresh);
    let selected = fresh.find(row => row.key === wanted.key);
    if (!selected) throw new Error('找不到原始處方，請重新讀取。');
    let detail = wanted.detail || (wanted.start ? {start:wanted.start} : null);
    if (refreshDetail) detail = await readOrderDetail(patient, {...selected,detail:wanted.detail});
    fresh = C.readOrders(document);
    assertSameOrders(allOrders, fresh);
    selected = fresh.find(row => row.key === wanted.key);
    // Explicitly clear every selectable checkbox, including prior selections.
    for (const checkbox of $(I.list).querySelectorAll('input[id$="_ckbSelect"]')) {
      if (checkbox.disabled && checkbox.checked) throw new Error('原清單含已停用且被勾選的處方，請回原畫面核對。');
      if (!checkbox.disabled) checkbox.checked = checkbox.id === selected.checkboxId;
    }
    const checked = fresh.filter(row => $(row.checkboxId).checked);
    if (checked.length !== 1 || checked[0].key !== wanted.key) throw new Error('無法單獨選取指定處方，已停止處理。');
    const previous = $(I.list);
    await nativeAction('click', nativeButton(I.open, I.open + '2'), () => !previous.isConnected && $(I.returns), '選取處方 ' + wanted.serial);
    checkPatient(patient);
    const nativeRows = C.readReturns(document);
    if (nativeRows.length !== 1 || C.clean(nativeRows[0].amount)) throw new Error('單筆選取結果不符或已有數量，已停止處理。');
    const rows = C.matchOrders([{...selected,detail}], nativeRows, {useDailyTotals});
    return {patient,rows,mode:'individual',nativeRows,table:$(I.returns),...readReturnPharmacy()};
  }
  async function readIndividually(patient, orders, plan, matchOptions = {}) {
    const resolved = new Map(plan.rows.filter(Boolean).map(row => [row.key, row])); let last;
    for (let index = 0; index < plan.unresolved.length; index++) {
      message(`正在核對重複處方 ${index + 1} / ${plan.unresolved.length}…`);
      last = await openSingleReturn(patient, orders, plan.unresolved[index], matchOptions);
      resolved.set(last.rows[0].key, last.rows[0]);
    }
    return {...last,rows:orders.map(order => resolved.get(order.key)),mode:'individual'};
  }
  async function toggleDetail(index) {
    const row = state.rows[index];
    if (!row || state.busy || updateFrozen || managementBlocked || !state.valid || state.uncertain) return;
    if (state.expanded.has(row.key)) { state.expanded.delete(row.key); render(); return; }
    if (row.detail?.daily) { state.expanded.add(row.key); render(); return; }
    const before = state.rows.slice(), patient = state.patient, pharmacy = state.pharmacy;
    const wasBatch = state.mode === 'batch';
    let lease;
    setBusy(true, 'detail');
    try {
      lease = (await managedRequest('acquire')).token; keepPortalLease(lease);
      await ready(); verifyEditing();
      await ensureSource(patient);
      assertSameOrders(before, C.readOrders(document));
      message('正在讀取序號 ' + row.serial + ' 的發退藥紀錄…');
      const detail = await readOrderDetail(patient, row);
      // Rebuild current native input handles; keep drafts only after quantities
      // and identity are rechecked. Detail navigation never writes a quantity.
      let result;
      if (wasBatch) {
        const expected = before.map(item => ({...item, detail:item.key === row.key ? detail : (item.detail || {start:item.start})}));
        result = await openReturnGrid(patient, expected);
        if (!C.checkResult(before, result.rows, new Map())) throw new Error('讀取詳情期間處方數量已變更，請重新讀取。');
      } else {
        result = await openSingleReturn(patient, before, {...row, detail});
        if (!C.checkResult([row], result.rows, new Map())) throw new Error('讀取詳情期間處方數量已變更，請重新讀取。');
        result.rows = before.map(item => item.key === row.key ? result.rows[0] : item);
      }
      if (!result.pharmacyOptions.some(option => option.value === pharmacy)) throw new Error('退藥藥局已變更，請重新讀取。');
      Object.assign(state, result, {pharmacy});
      state.expanded.add(row.key); render();
      message('已讀取發退藥紀錄。', 'ready');
    } catch (error) { invalidate(error.message); }
    finally { await releaseLease(lease); setBusy(false); }
  }
  async function verifyPostedReturn(before, amounts) {
    checkPatient(state.patient);
    const fresh = C.readOrders(document);
    assertSameOrders(before, fresh);
    // Verify the freshly loaded grid without depending on the history panel.
    // Do not use the expected new quantities to assign row identities.
    const orders = fresh.map(order => {
      const original = before.find(row => row.key === order.key);
      return {...order, detail:{start:original.start}};
    });
    let result;
    try { result = await openReturnGrid(state.patient, orders, {useDailyTotals:false}); }
    catch (error) {
      if (error.code !== 'ORDER_MATCH_AMBIGUOUS') throw error;
      // Ambiguous stable fields still require the detailed source data.
      result = await collect(state.patient);
      if (!C.checkResult(before, result.rows, amounts)) throw new Error('更新後的發退藥量與本次輸入不一致。');
      return result;
    }
    if (!C.checkResult(before, result.rows, amounts, {requireOrderIds:false})) throw new Error('更新後的發退藥量與本次輸入不一致。');
    // Clear old history until it has actually been refreshed.
    result.rows = result.rows.map(row => ({...row,detail:null}));
    return result;
  }
  async function executeIndividualReturns(patient, before, amounts, rawValues, pharmacy, onProgress) {
    const items = before.filter(row => (amounts.get(row.key) || 0) !== 0);
    return W.runSequence({items,onProgress,
      prepare: async row => {
        const prepared = await openSingleReturn(patient, before, row, {refreshDetail:true});
        const current = prepared.rows[0];
        if (!C.checkResult([row], [current], new Map())) throw new Error('處方 ' + row.serial + ' 的發退藥量已變更，尚未送出此筆。');
        const quantity = C.validateAmount(rawValues.get(row.key), current);
        if (!quantity.valid) throw new Error(quantity.message);
        if (quantity.value !== amounts.get(row.key)) throw new Error('退藥數量資料不一致，尚未送出此筆。');
        if (!prepared.pharmacyOptions.some(option => option.value === pharmacy)) throw new Error('退藥藥局選項已變更，尚未送出此筆。');
        return prepared;
      },
      submit: async (row, prepared) => {
        checkPatient(patient);
        if ($(I.returns) !== prepared.table || !prepared.table.isConnected) throw new Error('原畫面已變更。');
        const current = C.readReturns(document), expected = prepared.rows[0];
        if (current.length !== 1 || C.clean(current[0].amount) || ['inputId','state','type','generic','brand','issued','returned','rest','start'].some(key => current[0][key] !== expected[key])) throw new Error('單筆退藥欄位已變更。');
        $(I.pharmacy).value = pharmacy;
        $(expected.inputId).value = C.clean(rawValues.get(row.key));
        const previous = prepared.table;
        await nativeAction('click', nativeButton(I.submit, I.submit + '1'), () => !previous.isConnected && $(I.list), '送出處方 ' + row.serial);
      },
      verify: async row => {
        const after = await openSingleReturn(patient, before, row, {useDailyTotals:false});
        if (!C.checkResult([row], after.rows, new Map([[row.key,amounts.get(row.key)]]), {requireOrderIds:false})) throw new Error('處方 ' + row.serial + ' 的數量變更尚未核對成功。');
        after.rows = after.rows.map(current => ({...current,detail:null}));
        return after;
      }
    });
  }
  function accept(data) { Object.assign(state, {mode:'batch',nativeRows:[]}, data); state.valid = true; state.uncertain = false; state.values.clear(); state.expanded.clear(); el('show-history').checked = true; render(); }
  async function prepare(barcode) {
    if (state.busy || updateFrozen || managementBlocked || (barcode && state.uncertain)) return;
    if (hasAmounts() && !state.uncertain) return message('尚有已輸入的數量，請先完成退藥或按「清空數量」。', 'error');
    state.valid = false;
    if (barcode && !state.uncertain) { state.rows = []; state.values.clear(); state.expanded.clear(); render(); }
    setBusy(true, 'read');
    let lease;
    try {
      lease = (await managedRequest('acquire')).token; keepPortalLease(lease);
      await ready();
      if (hasNativeAmounts()) throw new Error('原畫面已有新退藥量，請先在原畫面完成或清空。');
      if (barcode) {
        const input = $(I.barcode);
        if (!input || barcode.length > input.maxLength) throw new Error('條碼欄位或長度不符，請回原畫面確認。');
        const oldList = $(I.list), oldReturn = $(I.returns);
        input.value = barcode;
        message('正在查詢條碼…');
        // Setting .value does not fire change. Click Query once; do not also dispatch Enter/change.
        await nativeAction('click', 'NTUHWeb1_QueryInptOrderByReviseBox_btnQuery', () => $(I.list) && $(I.list) !== oldList && (!oldReturn || !oldReturn.isConnected), '條碼查詢');
      }
      const data = await collect();
      accept(data);
      message(data.mode === 'individual' ? `已讀取 ${data.rows.length} 筆處方。請分別輸入數量，再按一次「確定退藥」；工具會按處方序號逐筆處理。` : `已自動勾選 ${data.rows.length} 筆處方。請輸入新退藥量，再按「確定退藥」。`, data.mode === 'individual' ? '' : 'ready');
      el('barcode').value = '';
    } catch (error) { invalidate(error.message); }
    finally { await releaseLease(lease); setBusy(false); if (state.shown && state.valid) ui.querySelector('.qty')?.focus(); }
  }
  function verifyEditing() {
    checkPatient(state.patient);
    if (!state.valid || $(I.returns) !== state.table || !state.table?.isConnected) throw new Error('原畫面已更新，請重新讀取處方。');
    const now = C.readReturns(document);
    const expected = state.mode === 'individual' ? state.nativeRows : state.rows;
    if (now.length !== expected.length || now.some((row, i) => ['inputId','state','type','generic','brand','issued','returned','rest','start'].some(key => row[key] !== expected[i][key]))) throw new Error('原系統的處方或餘量已變更，請重新讀取。');
    if (!$(I.pharmacy) || !Array.from($(I.pharmacy).options).some(option => option.value === state.pharmacy)) throw new Error('退藥藥局已變更，請重新讀取。');
    if (now.some(row => C.clean(row.amount))) throw new Error('原畫面已有另外輸入的數量，請先回原畫面核對。');
  }
  async function commitIndividually() {
    const before = state.rows.slice(), patient = state.patient, pharmacy = state.pharmacy;
    const rawValues = new Map(state.values), amounts = new Map();
    let confirmed = false;
    setBusy(true, 'commit');
    let lease;
    try {
      lease = (await managedRequest('acquire')).token; keepPortalLease(lease);
      await ready(); verifyEditing();
      for (const row of before) {
        const quantity = C.validateAmount(rawValues.get(row.key), row);
        if (!quantity.valid) throw new Error('處方 ' + row.serial + '：' + quantity.message);
        amounts.set(row.key, quantity.value || 0);
      }
      if (![...amounts.values()].some(value => value !== 0)) throw new Error('請先輸入新退藥量。');
      state.valid = false;
      const result = await executeIndividualReturns(patient, before, amounts, rawValues, pharmacy,
        (row, index, count) => message(`正在處理 ${index + 1} / ${count}：序號 ${row.serial}…`));
      for (const item of result.completed) state.values.delete(item.item.key);
      const updated = before.map(row => result.completed.find(item => item.item.key === row.key)?.data.rows[0] || row);
      if (result.failed) {
        state.rows = updated; state.valid = false; state.uncertain = true;
        render();
        const done = result.completed.map(item => item.item.serial).join('、');
        const failed = result.failed;
        message((done ? `已完成 ${result.completed.length} 筆（序號 ${done}）。\n` : '') +
          (failed.attempted ? `序號 ${failed.item.serial} 的送出結果尚未確認，請勿重複送出。\n` : `序號 ${failed.item.serial} 尚未送出。\n`) +
          (result.remaining.length ? `其餘 ${result.remaining.length} 筆尚未送出。\n` : '') +
          failed.error.message + '\n請回原畫面核對，再重新讀取處方。', 'error');
        return;
      }
      confirmed = true;
      state.values.clear();
      message(`退藥已完成，已逐筆核對 ${result.completed.length} 筆數量變更，正在更新紀錄…`, 'ok');
      try {
        accept(await collect(patient));
        message(`退藥已完成，已逐筆核對 ${result.completed.length} 筆數量變更。可以刷下一張條碼。`, 'ok');
      } catch {
        const last = result.completed.at(-1).data;
        accept({...last,rows:updated.map(row => ({...row,detail:null}))});
        state.valid = false; state.table = null; syncControls();
        message('退藥已完成，已逐筆核對數量。\n紀錄暫時無法更新；可以刷下一張條碼，或按「讀取目前處方」更新紀錄。', 'ok');
      }
    } catch (error) {
      state.valid = false;
      if (confirmed) {
        state.uncertain = false; state.values.clear();
        for (const input of ui.querySelectorAll('.qty')) input.value = '';
        message('退藥已完成，已逐筆核對數量。介面暫時無法更新，請重新讀取處方。', 'ok');
      } else invalidate(error.message);
    } finally { await releaseLease(lease); setBusy(false); if (state.shown && confirmed) el('barcode').focus(); }
  }
  async function commit() {
    if (el('submit').disabled || state.busy) return;
    if (state.mode === 'individual') return commitIndividually();
    let submitted = false, confirmed = false;
    const before = state.rows.slice(), amounts = new Map();
    setBusy(true, 'commit');
    let lease;
    try {
      lease = (await managedRequest('acquire')).token; keepPortalLease(lease);
      await ready(); verifyEditing();
      for (const row of before) { const check = C.validateAmount(state.values.get(row.key), row); if (!check.valid) throw new Error('處方 ' + row.serial + '：' + check.message); amounts.set(row.key, check.value || 0); }
      if (![...amounts.values()].some(n => n !== 0)) throw new Error('請先輸入新退藥量。');
      $(I.pharmacy).value = state.pharmacy;
      for (const row of before) $(row.inputId).value = C.clean(state.values.get(row.key));
      const previous = $(I.returns);
      message('正在送出退藥，請等待原系統回覆…');
      submitted = true; state.valid = false;
      await nativeAction('click', nativeButton(I.submit, I.submit + '1'), () => !previous.isConnected && $(I.list), '送出退藥');
      message('原系統已回覆，正在核對更新後的總退藥量與餘量…');
      const result = await W.completeReturn({
        verify: () => verifyPostedReturn(before, amounts),
        onVerified: () => { confirmed = true; state.values.clear(); message('退藥已完成，正在更新紀錄…', 'ok'); },
        refresh: verified => verified
      });
      if (result.detailsError) {
        accept({...result.verified, rows:result.verified.rows.map(row => ({...row,detail:null}))});
        state.valid = false; state.table = null; syncControls();
        message('退藥已完成，已核對總退藥量與餘量。\n紀錄暫時無法更新；可以刷下一張條碼，或按「讀取目前處方」更新紀錄。', 'ok');
      } else {
        accept(result.data);
        message(`退藥已完成，已核對 ${[...amounts.values()].filter(n => n !== 0).length} 筆數量變更。可以刷下一張條碼。`, 'ok');
      }
    } catch (error) {
      if (confirmed) {
        state.valid = false; state.uncertain = false; state.values.clear();
        for (const input of ui.querySelectorAll('.qty')) input.value = '';
        message('退藥已完成，已核對總退藥量與餘量。\n介面暫時無法更新；可以刷下一張條碼，或按「讀取目前處方」重新讀取。', 'ok');
      }
      else if (submitted) { state.uncertain = true; state.valid = false; message('尚未確認本次退藥結果，請勿重複送出。\n' + error.message + '\n請按「回原畫面」核對發退藥紀錄，確認後再重新讀取。', 'error'); }
      else invalidate(error.message);
    } finally { await releaseLease(lease); setBusy(false); if (state.shown && (confirmed || (state.valid && !state.uncertain))) el('barcode').focus(); }
  }
  let dismissed = false;
  function show(visible) {
    if (visible === state.shown) return;
    state.shown = visible; el('app').hidden = !visible;
    if (visible) {
      previousFocus = document.activeElement; previousInert = updateFrozen ? updateOriginalInert : document.body.inert;
      document.body.inert = true;
      void refreshManagement();
      if (!state.busy) {
        if (state.valid) { try { verifyEditing(); } catch (error) { invalidate(error.message); } }
        if (!el('barcode').disabled) el('barcode').focus(); else el('management').focus();
      }
    } else {
      document.body.inert = updateFrozen ? true : previousInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    }
  }
  el('updates').addEventListener('click', () => {
    void managedRequest('open', {section: 'update'}).catch(error => message(error.message, 'error'));
  });
  el('native').addEventListener('click', () => { dismissed = true; show(false); });
  el('management').addEventListener('click', () => { void managedRequest('open').catch(error => message(error.message, 'error')); });
  chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (request.type === 'return-portal-lease') {
      try {
        if (typeof request.owner !== 'string' || !request.owner.startsWith(chrome.runtime.id + ':return:')) throw Error('退藥作業識別不正確');
        const key = 'pharmacyPortalLeaseV1', now = Date.now();
        let lease;
        try { lease = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch {}
        if (request.release) {
          if (lease?.owner === request.owner) sessionStorage.removeItem(key);
        } else {
          if (!Number.isFinite(request.deadline) || now > request.deadline) throw Error('退藥連接要求已過期，請重試。');
          if (lease?.until > now && lease.owner !== request.owner) throw Error((lease.label || '另一個工具') + '正在操作此 Portal，完成後即可使用。');
          sessionStorage.setItem(key, JSON.stringify({owner:request.owner,label:'刷條碼退藥',until:now+90000}));
        }
        reply({ok:true});
      } catch (error) { reply({ok:false,error:error.message}); }
      return;
    }
    if (request.type === 'return-helper-state') reply({shown:state.shown});
    if (request.type === 'show-return-helper') {
      if (!request.passive) dismissed = false;
      if (!dismissed) show(true);
      reply({shown:state.shown});
    }
    if (request.type === 'hide-return-helper') { dismissed = false; show(false); reply({shown:state.shown}); }
    if (request.type === 'toggle-return-helper') { dismissed = state.shown; show(!state.shown); reply({shown:state.shown}); }
    if (request.type === 'return-update-probe') {
      const blocked = state.busy || bridgeBusy || hasAmounts() || state.uncertain || hasNativeAmounts();
      if (!blocked) { if (!updateFrozen) updateOriginalInert = state.shown ? previousInert : document.body.inert; updateFrozen = true; document.body.inert = true; syncControls(); }
      reply({ready:!blocked});
    }
    if (request.type === 'return-update-unfreeze') { if (updateFrozen) document.body.inert = state.shown ? true : updateOriginalInert; updateFrozen = false; syncControls(); reply({ok:true}); }
  });
  setInterval(() => { void refreshManagement(); }, 60000);
  const barcodeInput = el('barcode');
  let barcodeComposing = false, barcodeCompositionEnded = -Infinity;
  function checkBarcode(showEmpty = false) {
    const result = C.validateBarcode(barcodeInput.value);
    const invalid = !result.valid && (showEmpty || barcodeInput.value.length > 0);
    barcodeInput.setAttribute('aria-invalid', String(invalid));
    el('barcode-error').textContent = invalid ? result.message : '';
    return result;
  }
  barcodeInput.addEventListener('compositionstart', () => { barcodeComposing = true; });
  barcodeInput.addEventListener('compositionend', () => { barcodeComposing = false; barcodeCompositionEnded = performance.now(); checkBarcode(); });
  barcodeInput.addEventListener('input', event => { if (!barcodeComposing && !event.isComposing) checkBarcode(); });
  barcodeInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    // Enter used to confirm an IME candidate must never submit a partial scan.
    if (barcodeComposing || event.isComposing || event.keyCode === 229 || event.repeat || performance.now() - barcodeCompositionEnded < 100) {
      event.preventDefault(); event.stopPropagation();
    }
  });
  el('scan-form').addEventListener('submit', event => {
    event.preventDefault();
    if (barcodeComposing || performance.now() - barcodeCompositionEnded < 100) return;
    const result = checkBarcode(true);
    if (result.valid) { barcodeInput.value = result.value; prepare(result.value); }
  });
  el('read').addEventListener('click', () => prepare(null));
  el('submit').addEventListener('click', commit);
  el('submit').addEventListener('keydown', event => { if (event.key === 'Enter' && event.repeat) event.preventDefault(); });
  el('clear').addEventListener('click', () => { state.values.clear(); for (const input of ui.querySelectorAll('.qty')) { input.value = ''; input.removeAttribute('aria-invalid'); el('error-' + input.dataset.index).textContent = ''; } syncControls(); ui.querySelector('.qty')?.focus(); });
  el('pharmacy').addEventListener('change', () => { state.pharmacy = el('pharmacy').value; });
  el('show-history').addEventListener('change', () => { for (const section of ui.querySelectorAll('.history-section')) section.hidden = !el('show-history').checked; });
  el('orders').addEventListener('click', event => { const button = event.target.closest('.detail-btn'); if (button) void toggleDetail(Number(button.dataset.index)); });
  el('orders').addEventListener('input', event => {
    const input = event.target; if (!input.matches('.qty')) return;
    const row = state.rows[Number(input.dataset.index)]; state.values.set(row.key, input.value);
    const check = C.validateAmount(input.value, row); input.setAttribute('aria-invalid', String(!check.valid)); el('error-' + input.dataset.index).textContent = check.valid ? '' : check.message; syncControls();
  });
  el('orders').addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !event.target.matches('.qty')) return;
    event.preventDefault(); event.stopPropagation();
    if (event.repeat || event.isComposing) return;
    const index = Number(event.target.dataset.index), check = C.validateAmount(event.target.value, state.rows[index]);
    if (!check.valid) return;
    (ui.querySelector('.qty[data-index="' + (index + 1) + '"]') || el('submit')).focus();
  });
  // Watch only the underlying page. Shadow DOM changes never trigger this observer.
  const observer = new MutationObserver(() => {
    if (state.busy || !state.valid) return;
    if ($(I.returns) !== state.table || identity(C.readPatient(document)) !== identity(state.patient)) invalidate('原頁面的病人或處方畫面已更新，請重新讀取。');
  });
  observer.observe(document.body, {subtree:true,childList:true,characterData:true});
  window.addEventListener('beforeunload', event => { if (state.busy || hasAmounts() || state.uncertain) { event.preventDefault(); event.returnValue = ''; } });
  render();
  chrome.runtime.sendMessage({type:'return-helper-ready'}).then(reply => { if (reply?.open) show(true); }).catch(() => {});
})();

