(() => {
  'use strict';
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
    :host{all:initial;font:14px/1.5 "Microsoft JhengHei",system-ui,sans-serif;color:#1d3247;color-scheme:light}
    *{box-sizing:border-box}[hidden]{display:none!important}button,input,select{font:inherit}button{cursor:pointer}button:disabled,input:disabled,select:disabled{opacity:.5;cursor:default}
    button{min-height:38px;padding:8px 14px;border:1px solid #cfdae4;border-radius:6px;color:#243c50;background:white;white-space:nowrap}
    button.primary{background:#145e78;color:white;border-color:#145e78}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #6ab6d2;outline-offset:2px}
    #launcher{pointer-events:auto;position:absolute;right:18px;bottom:18px;background:#145e78;color:white;box-shadow:0 3px 12px #0003}
    #app{pointer-events:auto;position:absolute;inset:0;background:#f4f7fa;display:flex;flex-direction:column;overflow:hidden}
    header{display:flex;align-items:center;gap:14px;padding:12px 22px;background:white;border-bottom:1px solid #dce5ee;flex-shrink:0}header strong{font-size:18px}header span{font-size:12px;color:#607286}#management{margin-left:auto}.tool-icon{flex-shrink:0}#management-notice{margin:0 0 12px}
    main{padding:18px 22px;overflow:auto;flex:1}input[type=text],select{height:40px;border:1px solid #cbd8e2;border-radius:6px;padding:8px 10px;background:white;color:#1d3247}input[type=checkbox]{width:17px;height:17px;accent-color:#145e78}
    .scan{display:flex;align-items:end;gap:10px;flex-wrap:wrap;background:white;border:1px solid #dce5ee;border-radius:9px;padding:15px;margin-bottom:12px}.scan label{display:flex;flex-direction:column;gap:5px;flex:1;min-width:220px;font-weight:600}.scan input{font-family:Consolas,monospace;font-size:17px}
    .flow{color:#607286;font-size:12px;margin:8px 0 12px;display:flex;gap:18px;flex-wrap:wrap}.box{background:white;border:1px solid #dce5ee;border-radius:9px;overflow:hidden}.patient{padding:10px 16px;border-bottom:1px solid #dce5ee;display:flex;gap:10px 22px;flex-wrap:wrap}.patient strong{font-size:16px}.muted{color:#607286;font-size:12px}
    .toolbar{display:flex;align-items:center;gap:16px;padding:12px 16px;flex-wrap:wrap}.toolbar strong{margin-right:auto}.toolbar label{display:flex;align-items:center;gap:7px;font-size:13px}.toolbar select{height:34px;max-width:220px}
    .scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;table-layout:fixed;min-width:1000px;font-size:13px}th{background:#edf2f7;font-weight:500;color:#52677b;text-align:center;padding:9px 7px}td{padding:12px 7px;text-align:center;border-bottom:1px solid #dce5ee;vertical-align:middle;font-variant-numeric:tabular-nums}.left{text-align:left}.med strong{font-size:14px;display:block}.med small{display:block;margin-top:3px;color:#607286;overflow-wrap:anywhere}.meta{font-size:12px;color:#607286;display:flex;gap:3px 12px;flex-wrap:wrap;margin-top:6px}.meta span{white-space:nowrap}.state{background:#edf2f7;padding:3px 7px;border-radius:4px;font-size:12px}.sub{font-size:12px;margin-top:4px;color:#607286}.regimen div{white-space:nowrap}.regimen span{color:#607286;margin-right:7px;font-size:12px}
    .qty-col{background:#eaf4f7;color:#145e78}.qty{width:85px;text-align:center!important;font-size:19px!important;border-color:#145e78!important}.qty[aria-invalid=true]{border-color:#b63d34!important;background:#fff2ef}.detail-btn{min-width:35px;min-height:32px;padding:4px 7px;color:#145e78;border-color:#145e78}.detail-btn[aria-expanded=true]{background:#145e78;color:white}
    .expanded>td{padding:0;background:#f4f7fa;text-align:left}.detail-body{padding:12px 14px;border-left:3px solid #145e78}.record+ .record{margin-top:14px}.record table{min-width:660px;table-layout:auto;background:white;font-size:14px}.record td,.record th{text-align:left;padding:9px 10px;white-space:pre-line;vertical-align:top}.record th{font-size:13px;color:#1d3247}.record .negative{color:#ac382f;font-weight:600}.secondary{border-top:1px solid #dce5ee;margin-top:12px;padding-top:8px;color:#607286;font-size:12px}.secondary summary{cursor:pointer}.secondary dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px 18px}.secondary dt{font-size:11px}.secondary dd{margin:2px 0 0;color:#243c50;white-space:pre-wrap;overflow-wrap:anywhere}.secondary table{font-size:12px}.secondary h4{font-size:12px;font-weight:500;margin:12px 0 6px}
    footer{padding:13px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}footer .actions{display:flex;gap:9px;margin-left:auto}#submit{min-width:130px}.status{border-radius:7px;background:#eaf4f7;color:#145e78;padding:12px 15px;margin-top:12px;white-space:pre-wrap;overflow-wrap:anywhere}.status.error{background:#fff0ec;color:#a73c2e}.status.ok{background:#e8f4ed;color:#24663b}.empty{padding:48px 20px;text-align:center;color:#607286}.empty strong{display:block;font-size:17px;color:#243c50;margin-bottom:7px}.hint{font-size:12px;color:#607286}.invalid-note{color:#ac382f;font-size:12px;margin-top:4px}
    @media(max-width:750px){main{padding:12px}header{padding:10px 12px}header span{display:none}.secondary dl{grid-template-columns:repeat(2,minmax(0,1fr))}.scan{padding:12px}.toolbar{gap:8px}.flow{gap:8px}footer .actions{width:100%;justify-content:flex-end}}
  </style>
  
  <section id="app" hidden aria-label="刷條碼退藥輔助">
    <header><img class="tool-icon" src="${chrome.runtime.getURL('icons/icon48.png')}" width="32" height="32" alt=""><strong>刷條碼退藥</strong><span>v1.1.1</span><button type="button" id="management">電腦登記／工具更新</button><button type="button" id="native">回原畫面</button></header>
    <main>
      <div id="management-notice" class="status" role="status">開啟後驗證電腦登記。</div>
      <form id="scan-form" class="scan"><label for="barcode">處方條碼<input id="barcode" type="text" maxlength="18" autocomplete="off" spellcheck="false" placeholder="刷入條碼後按 Enter"></label><button type="submit" class="primary" id="query">查詢並開始退藥</button><button type="button" id="read">讀取目前處方</button></form>
      <div class="flow"><span>① 刷碼查詢</span><span>② 自動全選、讀取紀錄</span><span>③ 輸入新退藥量</span><span>④ 確定退藥</span></div>
      <section class="box"><div id="patient" class="patient" hidden></div>
        <div class="toolbar" id="toolbar" hidden><strong id="count"></strong><label>退藥藥局<select id="pharmacy" aria-label="退藥藥局"></select></label><label><input type="checkbox" id="show-history" checked>顯示退藥明細</label></div>
        <div id="orders"><div class="empty"><strong>請刷入處方條碼</strong>讀取處方與完整紀錄後，即可輸入退藥量。</div></div>
        <footer id="footer" hidden><span class="hint" id="summary">Enter 跳下一筆；最後一筆移至確定退藥。</span><div class="actions"><button type="button" id="clear">清空數量</button><button type="button" id="submit" class="primary" disabled>確定退藥</button></div></footer>
      </section><div id="status" class="status" role="status" aria-live="polite">等待刷入條碼。</div>
    </main>
  </section>`;
  const el = id => ui.getElementById(id);
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = { rows: [], patient: null, values: new Map(), expanded: new Set(), busy: false, valid: false, uncertain: false, table: null, mode:'batch', nativeRows:[], pharmacy: '', pharmacyOptions: [], shown: false, phase: 'idle' };
  let bridgeBusy = false, managementBlocked = true, updateFrozen = false;
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
      const wasBlocked = managementBlocked;
      managementBlocked = result.state !== 'allowed';
      el('management-notice').textContent = managementBlocked ? result.reason + ' 請按「電腦登記／工具更新」。' : (result.updateAvailable ? '有新版 v' + result.latestVersion + '，完成目前作業後可開啟工具更新。' : '');
      el('management-notice').hidden = !managementBlocked && !result.updateAvailable;
      syncControls();
      if (wasBlocked && !managementBlocked && state.shown && !state.busy && (!ui.activeElement || ui.activeElement === el('management'))) el('barcode').focus();
      el('management').textContent = result.updateAvailable ? '有新版 · 工具更新' : (result.deviceName || '電腦登記') + '／工具更新';
    } catch (error) { managementBlocked = true; el('management-notice').hidden = false; el('management-notice').textContent = error.message; }
    finally { managementChecking = false; syncControls(); }
  }
  async function releaseLease(token) {
    if (!token) return;
    try { await managedRequest('release', {token}); }
    catch { managementBlocked = true; el('management-notice').hidden = false; el('management-notice').textContent = '管理連線已中斷。請核對退藥結果後，再重新整理頁面。'; }
  }
  const identity = patient => [patient.account, patient.chart, patient.bed].join('|');
  function message(text, kind = '') { el('status').textContent = text; el('status').className = 'status ' + kind; }
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
    for (const id of ['barcode','query','read','clear','pharmacy']) el(id).disabled = state.busy || updateFrozen || (managementBlocked && id !== 'clear') || (state.uncertain && id !== 'read');
    for (const input of ui.querySelectorAll('.qty')) input.disabled = state.busy || updateFrozen || managementBlocked || !state.valid;
    const checked = state.rows.map(row => C.validateAmount(state.values.get(row.key), row));
    el('submit').disabled = state.busy || updateFrozen || managementBlocked || !state.valid || state.uncertain || !checked.some(v => v.valid && v.value !== null && v.value !== 0) || checked.some(v => !v.valid);
    el('submit').textContent = state.phase === 'commit' ? '處理中…' : '確定退藥';
    el('read').textContent = state.uncertain ? '確認原畫面後重新讀取' : '讀取目前處方';
  }
  function recordTable(data, label, numericColumn) {
    if (!data) return `<div class="record muted">原頁面未顯示${esc(label)}。</div>`;
    if (!data.rows.length) return `<div class="record muted">原頁面此表格沒有資料。</div>`;
    return `<div class="record scroll"><table aria-label="${esc(label)}"><thead><tr>${data.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row => `<tr>${row.map((text, i) => `<td${i === numericColumn && C.number(text) < 0 ? ' class="negative"' : ''}>${esc(text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function detailHtml(row) {
    const d = row.detail;
    if (!d) return '<div class="muted">紀錄尚未更新，請按「讀取目前處方」重新讀取。</div>';
    return `${recordTable(d.daily, '發退藥紀錄', 4)}<div class="history-section"${el('show-history').checked ? '' : ' hidden'}>${recordTable(d.history, '退藥紀錄', 2)}</div>
      <details class="secondary"><summary>其他處方資訊</summary><dl>${d.fields.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${d.delivery ? '<h4>送藥紀錄</h4>' + recordTable(d.delivery,'送藥紀錄',3) : ''}${d.review ? '<details><summary>覆核紀錄</summary>' + recordTable(d.review,'覆核紀錄') + '</details>' : ''}</details>`;
  }
  function render() {
    const exists = state.rows.length > 0;
    for (const id of ['patient','toolbar','footer']) el(id).hidden = !exists;
    if (!exists) { el('orders').innerHTML = '<div class="empty"><strong>請刷入處方條碼</strong>讀取處方與完整紀錄後，即可輸入退藥量。</div>'; syncControls(); return; }
    const p = state.patient;
    el('patient').innerHTML = `<strong>${esc(p.name)}</strong><span>病歷號 ${esc(p.chart)}</span><span>床號 ${esc(p.bed)}</span><span>${esc([p.sex,p.age].filter(Boolean).join(' · '))}</span><span class="muted">住院號 ${esc(p.account)}</span>`;
    el('count').textContent = '全部處方 ' + state.rows.length + ' 筆';
    el('pharmacy').innerHTML = state.pharmacyOptions.map(option => `<option value="${esc(option.value)}">${esc(option.text)}</option>`).join('');
    el('pharmacy').value = state.pharmacy;
    el('orders').innerHTML = `<div class="scroll"><table aria-label="處方及新退藥量"><colgroup><col style="width:42px"><col style="width:142px"><col><col style="width:128px"><col style="width:76px"><col style="width:76px"><col style="width:70px"><col style="width:75px"><col style="width:112px"><col style="width:58px"></colgroup><thead><tr><th>選</th><th class="left">處方</th><th class="left">藥品</th><th class="left">用法</th><th>總發藥量</th><th>總退藥量</th><th>餘量</th><th>批次量</th><th class="qty-col">新退藥量</th><th>詳</th></tr></thead><tbody>${state.rows.map((row, index) => {
      const expanded = state.expanded.has(row.key);
      return `<tr><td><input type="checkbox" checked disabled aria-label="已選取處方 ${esc(row.serial)}"></td><td class="left"><strong>${esc(row.serial)}</strong> <span class="state">${esc(row.state)}</span><div class="sub">處方 ${esc(row.prescription)}</div><div class="sub">開方 ${esc(C.day(row.prescribedDate))}</div><div class="sub">開始 ${esc(C.day(row.start))}</div></td><td class="left med"><strong>${esc(row.brand)}</strong><small>${esc(row.generic)}</small><div class="meta"><span>階 ${esc(row.priority || '—')}</span><span>類 ${esc(row.type || '—')}</span><span>帳 ${esc(row.accountType || '—')}</span><span>組 ${esc(row.group || '—')}</span></div></td><td class="left regimen"><div><span>劑量</span>${esc(row.dose)}</div><div><span>頻率</span>${esc(row.frequency)}</div><div><span>途徑</span>${esc(row.route)}</div><div><span>天數</span>${esc(row.days)}</div></td><td>${esc(row.issued ?? '—')}</td><td>${esc(row.returned ?? '—')}</td><td>${esc(row.rest ?? '—')}</td><td>${esc(row.batch || '—')}</td><td class="qty-col"><input type="text" class="qty" data-index="${index}" aria-label="處方 ${esc(row.serial)} 新退藥量" maxlength="${row.maxLength}" autocomplete="off" spellcheck="false" value="${esc(state.values.get(row.key) || '')}"><div class="invalid-note" id="error-${index}"></div></td><td><button type="button" class="detail-btn" data-index="${index}" aria-expanded="${expanded}" aria-controls="detail-${index}">詳</button></td></tr><tr class="expanded" id="detail-${index}"${expanded ? '' : ' hidden'}><td colspan="10"><div class="detail-body">${detailHtml(row)}</div></td></tr>`;
    }).join('')}</tbody></table></div>`;
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
    for (let index = 0; index < orders.length; index++) {
      checkPatient(patient);
      message(`正在讀取處方 ${index + 1} / ${orders.length} 的完整紀錄…`);
      const order = orders[index];
      order.detail = await readOrderDetail(patient, order);
    }
    return openReturnGrid(patient, orders);
  }
  function assertSameOrders(orders, fresh) {
    if (new Set(orders.map(row => row.key)).size !== orders.length || new Set(fresh.map(row => row.key)).size !== fresh.length) throw new Error('原始處方識別資料重複，請回原畫面確認。');
    const fields = ['state','generic','brand','dose','frequency','route','days','type','priority','accountType','group'];
    if (fresh.length !== orders.length || fresh.some(o => !orders.some(before => before.key === o.key && fields.every(k => before[k] === o[k])))) throw new Error('讀取期間處方內容已變更，請重新查詢。');
  }
  async function openReturnGrid(patient, orders, matchOptions = {}) {
    checkPatient(patient);
    const fresh = C.readOrders(document);
    assertSameOrders(orders, fresh);
    for (const order of fresh) $(order.checkboxId).checked = true;
    const previous = $(I.list);
    message('已讀取全部紀錄，正在開啟退藥輸入…');
    await nativeAction('click', nativeButton(I.open, I.open + '2'), () => !previous.isConnected && $(I.returns), '勾選退藥');
    checkPatient(patient);
    let rows;
    try { rows = C.matchOrders(orders, C.readReturns(document), matchOptions); }
    catch (error) {
      if (error.code !== 'ORDER_MATCH_AMBIGUOUS') throw error;
      return readIndividually(patient, orders, matchOptions);
    }
    const pharmacy = $(I.pharmacy);
    if (!pharmacy || !pharmacy.options.length) throw new Error('未取得退藥藥局，請回原畫面確認。');
    return { patient, rows, mode:'batch', nativeRows:C.readReturns(document), table: $(I.returns), pharmacy: pharmacy.value, pharmacyOptions: Array.from(pharmacy.options, option => ({value:option.value,text:option.textContent})) };
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
    let detail = wanted.detail;
    if (refreshDetail) detail = await readOrderDetail(patient, {...selected,detail:wanted.detail});
    fresh = C.readOrders(document);
    assertSameOrders(allOrders, fresh);
    selected = fresh.find(row => row.key === wanted.key);
    // Explicitly clear every selectable checkbox, including prior selections.
    for (const row of fresh) $(row.checkboxId).checked = row.key === wanted.key;
    const checked = fresh.filter(row => $(row.checkboxId).checked);
    if (checked.length !== 1 || checked[0].key !== wanted.key) throw new Error('無法單獨選取指定處方，已停止處理。');
    const previous = $(I.list);
    await nativeAction('click', nativeButton(I.open, I.open + '2'), () => !previous.isConnected && $(I.returns), '選取處方 ' + wanted.serial);
    checkPatient(patient);
    const nativeRows = C.readReturns(document);
    if (nativeRows.length !== 1 || C.clean(nativeRows[0].amount)) throw new Error('單筆選取結果不符或已有數量，已停止處理。');
    const rows = C.matchOrders([{...selected,detail}], nativeRows, {useDailyTotals});
    const pharmacy = $(I.pharmacy);
    if (!pharmacy || !pharmacy.options.length) throw new Error('未取得退藥藥局，請回原畫面確認。');
    return {patient,rows,mode:'individual',nativeRows,table:$(I.returns),pharmacy:pharmacy.value,pharmacyOptions:Array.from(pharmacy.options, option => ({value:option.value,text:option.textContent}))};
  }
  async function readIndividually(patient, orders, matchOptions = {}) {
    const rows = []; let last;
    for (let index = 0; index < orders.length; index++) {
      message(`正在按處方序號核對 ${index + 1} / ${orders.length}…`);
      last = await openSingleReturn(patient, orders, orders[index], matchOptions);
      rows.push(last.rows[0]);
    }
    return {...last,rows,mode:'individual'};
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
      lease = (await managedRequest('acquire')).token;
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
      message(data.mode === 'individual' ? `已讀取 ${data.rows.length} 筆處方。請分別輸入數量，再按一次「確定退藥」；工具會按處方序號逐筆處理。` : `已自動勾選 ${data.rows.length} 筆處方。請輸入新退藥量，再按「確定退藥」。`);
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
      lease = (await managedRequest('acquire')).token;
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
      lease = (await managedRequest('acquire')).token;
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
        refresh: verified => verified.rows.every(row => row.detail?.daily) ? verified : collect(state.patient)
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
  el('native').addEventListener('click', () => show(false));
  el('management').addEventListener('click', () => { void managedRequest('open').catch(error => message(error.message, 'error')); });
  chrome.runtime.onMessage.addListener((request, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (request.type === 'toggle-return-helper') { show(!state.shown); reply({shown:state.shown}); }
    if (request.type === 'return-update-probe') {
      const blocked = state.busy || bridgeBusy || hasAmounts() || state.uncertain || hasNativeAmounts();
      if (!blocked) { if (!updateFrozen) updateOriginalInert = state.shown ? previousInert : document.body.inert; updateFrozen = true; document.body.inert = true; syncControls(); }
      reply({ready:!blocked});
    }
    if (request.type === 'return-update-unfreeze') { if (updateFrozen) document.body.inert = state.shown ? true : updateOriginalInert; updateFrozen = false; syncControls(); reply({ok:true}); }
  });
  setInterval(() => { void refreshManagement(); }, 60000);
  el('scan-form').addEventListener('submit', event => { event.preventDefault(); const barcode = C.clean(el('barcode').value); if (barcode) prepare(barcode); else message('請先刷入處方條碼。', 'error'); });
  el('read').addEventListener('click', () => prepare(null));
  el('submit').addEventListener('click', commit);
  el('submit').addEventListener('keydown', event => { if (event.key === 'Enter' && event.repeat) event.preventDefault(); });
  el('clear').addEventListener('click', () => { state.values.clear(); for (const input of ui.querySelectorAll('.qty')) { input.value = ''; input.removeAttribute('aria-invalid'); el('error-' + input.dataset.index).textContent = ''; } syncControls(); ui.querySelector('.qty')?.focus(); });
  el('pharmacy').addEventListener('change', () => { state.pharmacy = el('pharmacy').value; });
  el('show-history').addEventListener('change', () => { for (const section of ui.querySelectorAll('.history-section')) section.hidden = !el('show-history').checked; });
  el('orders').addEventListener('click', event => { const button = event.target.closest('.detail-btn'); if (!button) return; const i = Number(button.dataset.index), key = state.rows[i].key, open = !state.expanded.has(key); open ? state.expanded.add(key) : state.expanded.delete(key); button.setAttribute('aria-expanded', String(open)); el('detail-' + i).hidden = !open; });
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
  syncControls();
  chrome.runtime.sendMessage({type:'return-helper-ready'}).then(reply => { if (reply?.open) show(true); }).catch(() => {});
})();

