// Executes only in the existing, authenticated DrugCounting.aspx page.
// Uses the site's own controls. No credentials are copied or saved.
(() => {
  if (window.__ADC_HELPER_V1_1_5__) return;
  const modes = {
    consume: { root: '#divConsume', open: 'OpenConsume', title: '取藥', sign: 1, resultField: 'ConsumeAmount' },
    return: { root: '#divReturn', open: 'OpenReturn', title: '歸藥', sign: -1, resultField: 'ReturnAmount' }
  };
  const events = [], outcomes = new Map();
  let sequence = 0, ready = null, busy = false, sendGuard = null;
  let pendingSettle = false, lastCompletedAt = 0, lastActivityAt = 0;
  const originalOpen = XMLHttpRequest.prototype.open, originalSend = XMLHttpRequest.prototype.send;
  const requestMeta = new WeakMap();
  const fields = ['PharmacyCode', 'DrugCode', 'InputAmount', 'CountingAmount', 'AmountUnit', 'Bedidse', 'PrescriptionNumber', 'Remark', 'ConsumeAmount', 'ReturnAmount', 'Inconsistent'];
  function limited(obj) { return Object.fromEntries(fields.filter(k => obj && k in obj).map(k => [k, obj[k]])); }
  function unpack(raw) {
    let obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (obj?.jsonObject) obj = JSON.parse(obj.jsonObject);
    return obj;
  }
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    let endpoint = '';
    try {
      const u = new URL(String(url), location.href);
      if (u.origin === location.origin && /\/DrugCounting\.aspx\/(GetMySelf|PreCountOne|AddOneRecord)$/i.test(u.pathname)) endpoint = u.pathname.split('/').pop();
    } catch { /* unrelated request */ }
    requestMeta.set(this, endpoint);
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(body) {
    const endpoint = requestMeta.get(this);
    if (endpoint) {
      let request = {}; try { request = limited(unpack(body)); } catch { /* cannot confirm malformed requests */ }
      if (endpoint === 'AddOneRecord' && sendGuard) {
        const expected = sendGuard.expected;
        if (sendGuard.sent || request.PharmacyCode !== 'T02' || request.DrugCode !== expected.code ||
          Number(request.InputAmount) !== expected.quantity * modes[expected.operation].sign || request.Bedidse !== expected.bed ||
          request.PrescriptionNumber !== 'ADC' || request.Remark !== '' ||
          Number(request.CountingAmount) !== expected.stock) {
          sendGuard.refused = 'Portal 即將送出的資料與清單不符，已阻止送出';
          throw new Error(sendGuard.refused);
        }
        sendGuard.sent = true;
      }
      const ev = { seq: ++sequence, endpoint, request, finished: false, success: false, data: null, message: '' };
      lastActivityAt = Date.now();
      events.push(ev); if (events.length > 250) events.shift();
      this.addEventListener('loadend', () => {
        ev.finished = true;
        lastActivityAt = Date.now();
        try {
          const obj = (this.responseType === 'json' ? this.response : JSON.parse(this.responseText))?.d;
          ev.success = this.status >= 200 && this.status < 300 && obj?.IsSuccess === true;
          ev.message = String(obj?.Message || '').slice(0, 300);
          ev.data = limited(obj?.Data);
        } catch { ev.message = 'Portal 回傳格式無法辨識'; }
      }, { once: true });
    }
    return originalSend.call(this, body);
  };
  const $ = s => document.querySelector(s);
  const visible = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
  const delay = ms => new Promise(r => setTimeout(r, ms));
  function popupError() {
    const el = $('#divCommonUseDialog .errormessage');
    return visible(el) ? norm(el.querySelector('div')?.textContent || el.textContent).replace(/確認$/, '').trim() : '';
  }
  async function until(check, description, timeout = 15000, checkError = true) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (checkError) { const e = popupError(); if (e) throw new Error(e); }
      const result = check(); if (result) return result;
      await delay(50);
    }
    throw new Error(description + '逾時');
  }
  function pageIdle() {
    return !events.some(e => !e.finished) && !(Number(window.jQuery?.active) > 0) &&
      !visible($('#divCommonUseDialog')) && ![...document.querySelectorAll('.ui-widget-overlay')].some(visible);
  }
  async function stable(check, description, timeout = 30000, { stableMs = 50, quietMs = 0, notBefore = 0 } = {}) {
    let stableSince = null;
    return until(() => {
      const result = pageIdle() && Date.now() - lastActivityAt >= quietMs && check();
      if (!result) { stableSince = null; return null; }
      if (stableSince === null) stableSince = Date.now();
      return Date.now() - stableSince >= stableMs && Date.now() >= notBefore ? result : null;
    }, description, timeout);
  }
  async function clickReady(find, description) {
    const target = await stable(() => { const e = find(); return visible(e) && !e.disabled ? e : null; }, description);
    click(target);
  }
  async function settle() {
    if (!pendingSettle) return;
    await stable(() => {
      const take = $('#divMenu button[name="OpenConsume"]'), give = $('#divMenu button[name="OpenReturn"]');
      return visible($('#divMenu')) && visible(take) && !take.disabled &&
        visible(give) && !give.disabled && !visible($('#divConsume table.confirm')) && !visible($('#divReturn table.confirm'));
    }, '此筆已登錄成功，但 Portal 尚未恢復主選單；已停止接續作業，請重新整理 Portal 後重新連接。等待畫面恢復', 30000, { stableMs: 200, notBefore: lastCompletedAt + 200 });
    pendingSettle = false;
  }
  function input(el, value) {
    if (!el || el.disabled || !visible(el)) throw new Error('找不到可輸入欄位');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function click(el) { if (!visible(el) || el.disabled) throw new Error('找不到可操作按鈕'); el.click(); }
  function button(container, text) { return [...container.querySelectorAll('button')].find(b => visible(b) && norm(b.textContent) === text); }
  function checkPage() {
    if (!/\/PharManagement\/DrugCounting\.aspx$/i.test(location.pathname) || !$('#divConsume') || !$('#pharmacyT02')) {
      throw new Error('請在 Portal 開啟「特殊藥品管理」頁面');
    }
    if (!window.jQuery?.fn?.autocomplete) throw new Error('Portal 尚未載入完成，請稍後重新連接');
  }
  function readArrays(script) {
    // Extract JSON array arguments of the observed initializer without eval.
    const marker = 'MyDocumentInitial(';
    const pos = script.lastIndexOf(marker); if (pos < 0) return [];
    let at = pos + marker.length; const result = [];
    while (at < script.length) {
      while (/[\s,]/.test(script[at] || '')) at++;
      if (script[at] !== '[') break;
      const start = at; let depth = 0, quoted = false, escaped = false;
      for (; at < script.length; at++) {
        const c = script[at];
        if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
        else if (c === '"') quoted = true;
        else if (c === '[' || c === '{') depth++;
        else if (c === ']' || c === '}') { depth--; if (depth === 0) { at++; break; } }
      }
      try { result.push(JSON.parse(script.slice(start, at))); } catch { break; }
    }
    return result;
  }
  function catalogue() {
    const found = new Map();
    function visit(v) {
      if (Array.isArray(v)) { v.forEach(visit); return; }
      if (v?.PharmacyCode === 'T02' && v.DrugCode && v.TradeEngNameComplex) {
        const value = { code: String(v.DrugCode), label: String(v.TradeEngNameComplex), search: String(v.TradeEngName || ''), unit: String(v.AmountUnit || ''), factor: Number(v.ConvertFactor ?? 1), group: v.GroupCode || '', subItem: !!v.IsSubItem };
        const old = found.get(value.code);
        if (old && (old.label !== value.label || old.unit !== value.unit || old.factor !== value.factor)) throw new Error('Portal 同一藥碼有不一致設定：' + value.code);
        found.set(value.code, value);
      }
    }
    for (const script of document.scripts) if (!script.src) readArrays(script.textContent).forEach(visit);
    if (!found.size) throw new Error('無法讀取 Portal 藥品八碼清單，請重新進入特殊藥品管理');
    return [...found.values()];
  }
  function response(endpoint, after, code) {
    return events.find(e => e.seq > after && e.endpoint === endpoint && e.request.DrugCode === code && e.request.PharmacyCode === 'T02' && e.finished);
  }
  function assertResponse(ev, code) {
    if (!ev.success) throw new Error(ev.message || 'Portal 未接受本次操作');
    if (ev.data?.DrugCode !== code || ev.data?.PharmacyCode !== 'T02') throw new Error('Portal 回傳藥品或藥局不符');
  }
  function assertPharmacy() { if (!$('#pharmacyT02')?.checked) throw new Error('作業藥局已改變，已停止'); }
  async function selectDrug(drug, mode) {
    const search = $(mode.root + ' input[name="txbDrugSarch"]');
    const jq = window.jQuery(search), before = sequence;
    const queries = [...new Set([drug.search.replace(/^\(DC\)/, '').slice(0, 4), drug.code, drug.search].filter(Boolean))];
    let choice;
    for (const query of queries) {
      input(search, query);
      jq.autocomplete('search', query);
      try {
        choice = await stable(() => {
          const menu = jq.autocomplete('widget')?.[0];
          if (!visible(menu)) return null;
          const matches = [...menu.querySelectorAll('.ui-menu-item-wrapper')].filter(el => norm(el.textContent) === norm(drug.label));
          if (matches.length > 1) throw new Error('搜尋結果有重複藥品，無法唯一選取');
          return matches[0];
        }, '藥品搜尋', 5000);
        break;
      } catch (e) { if (!e.message.endsWith('逾時')) throw e; }
    }
    if (!choice) throw new Error('Portal 找不到指定藥品：' + drug.code);
    choice.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    click(choice);
    const ev = await until(() => response('GetMySelf', before, drug.code), '讀取目前結存');
    assertResponse(ev, drug.code);
    await stable(() => visible($(mode.root + ' table.precount .nextstep')) && norm($(mode.root + ' table.precount .drugname')?.textContent) === norm(drug.label), '顯示選取藥品');
    return ev;
  }
  function confirmFields(mode) {
    const table = $(mode.root + ' table.confirm');
    if (!visible(table)) throw new Error(mode.title + '確認畫面已離開');
    const headers = [...table.querySelectorAll('table.listtable thead th')].map(h => norm(h.textContent));
    const inputs = [...table.querySelectorAll('table.listtable tbody tr:first-child input')];
    if (headers.join('|') !== '帳號|床號|病歷號|領藥號' || inputs.length !== 4) throw new Error('Portal 病房欄位結構已改變');
    return { table, inputs, amount: table.querySelector('[name="txbAmount"]'), remark: table.querySelector('[name="txbRemark"]') };
  }
  async function prepare(job) {
    ready = null;
    checkPage();
    if (!job || !/^[A-Z0-9 ]{8}$/.test(job.code) || !/^[0-9A-Z]+(?:-\d+)?$/.test(job.bed) || !Number.isInteger(job.quantity) || job.quantity <= 0 || job.quantity > 99999) throw new Error('取藥資料格式不完整');
    const operation = job.operation ?? 'consume', mode = modes[operation];
    if (!mode) throw new Error('不支援此作業類型');
    const openSelector = '#divMenu button[name="' + mode.open + '"]';
    await settle();
    await stable(() => true, '等待 Portal 完成前一項操作');
    const existingError = popupError(); if (existingError) throw new Error('請先處理 Portal 訊息：' + existingError);
    // Never navigate away from a partially filled human transaction.
    for (const existing of document.querySelectorAll('#divConsume table.confirm, #divReturn table.confirm')) {
      if (visible(existing)) {
        const dirty = [...existing.querySelectorAll('input')].some(e => String(e.value || '').trim());
        if (dirty) throw new Error('Portal 有未完成的取藥／歸藥資料，請先回首頁再執行');
      }
    }
    if (!visible($('#divMenu'))) {
      const home = [...document.querySelectorAll('button')].find(b => visible(b) && norm(b.textContent) === '回特殊藥品管理首頁');
      // On initial entry there is no home button: the menu appears only after pharmacy selection.
      if (home) {
        await clickReady(() => home, '等待返回首頁按鈕');
        await stable(() => visible($('#divMenu')), '返回特殊藥品管理主選單');
      }
    }
    const pharmacy = $('#pharmacyT02');
    if (!pharmacy.checked || !visible($(openSelector))) await clickReady(() => pharmacy, '等待藥局選擇');
    await stable(() => {
      const open = $(openSelector);
      return pharmacy.checked && visible($('#divMenu')) && visible(open) && !open.disabled;
    }, '選擇西址住院藥局並顯示' + mode.title + '選單');
    assertPharmacy();
    const drug = catalogue().find(d => d.code === job.code);
    if (!drug) throw new Error('西址住院藥局找不到八碼：' + job.code);
    if (drug.factor !== 1 || drug.subItem || drug.group) throw new Error('此品項涉及包裝換算或群組，請回 Portal 處理：' + job.code);
    if (job.unit && drug.unit !== job.unit) throw new Error('Portal 單位與原取藥紀錄不同，已停止');
    await clickReady(() => $(openSelector), '等待' + mode.title + '按鈕');
    await stable(() => visible($(mode.root + ' table.precount input[name="txbDrugSarch"]')), '開啟' + mode.title);
    const stockResponse = await selectDrug(drug, mode);
    const countInput = $(mode.root + ' table.precount .nextstep input');
    const count = Number(countInput?.value);
    if (!countInput || countInput.value === '' || !Number.isFinite(count) || count < 0 || count !== Number(stockResponse.data.CountingAmount)) throw new Error('取藥前盤點量尚未正確載入');
    if (drug.unit !== stockResponse.data.AmountUnit) throw new Error('Portal 取藥單位不一致');
    if (operation === 'consume' && job.quantity > count) throw new Error(`Portal 結存 ${count} ${drug.unit}，不足以取出 ${job.quantity}`);
    const before = sequence;
    await clickReady(() => button($(mode.root + ' table.precount'), '下一步'), '等待下一步');
    const pre = await until(() => response('PreCountOne', before, drug.code), mode.title + '前確認');
    assertResponse(pre, drug.code);
    if (Number(pre.data.CountingAmount) !== count || pre.data.Inconsistent) throw new Error('Portal 結存異動或盤點異常，已停止');
    await stable(() => visible($(mode.root + ' table.confirm')), '開啟填寫欄位');
    const f = confirmFields(mode);
    const warning = norm(f.table.querySelector('.InconsistantWarning')?.textContent);
    if (warning) throw new Error(warning);
    input(f.inputs[0], ''); input(f.inputs[1], job.bed); input(f.inputs[2], ''); input(f.inputs[3], 'ADC');
    input(f.remark, ''); input(f.amount, job.quantity);
    await stable(() => visible(f.table), '等待欄位填寫完成');
    ready = { ...job, operation, label: drug.label, unit: drug.unit, stock: count, token: crypto.randomUUID(), sequence, createdAt: Date.now() };
    return { token: ready.token, operation, stock: count, unit: drug.unit, label: drug.label };
  }
  async function commit(token) {
    if (outcomes.has(token)) return outcomes.get(token);
    const item = ready;
    if (!item || item.token !== token || Date.now() - item.createdAt > 30000) return { state: 'failed', message: '作業準備已失效，尚未送出' };
    const mode = modes[item.operation];
    ready = null;
    let clicked = false;
    try {
      await stable(() => visible($(mode.root + ' table.confirm')), '等待送出畫面就緒');
      if (Date.now() - item.createdAt > 30000) throw new Error('作業準備已失效，尚未送出');
      assertPharmacy();
      const f = confirmFields(mode);
      if (popupError()) throw new Error(popupError());
      if (events.some(e => e.seq > item.sequence && e.endpoint === 'AddOneRecord')) throw new Error('Portal 出現其他取藥操作，已停止');
      if (norm(f.table.querySelector('.drugname')?.textContent) !== norm(item.label) ||
        f.inputs[1].value !== item.bed || f.inputs[0].value || f.inputs[2].value || f.inputs[3].value !== 'ADC' ||
        f.remark.value !== '' || Number(f.amount.value) !== item.quantity) throw new Error('送出前欄位已改變，尚未送出');
      const before = sequence;
      // Invalidate token before clicking; never retry a click after ambiguity.
      outcomes.set(token, { state: 'unknown', message: '正在等待 Portal 回覆' });
      sendGuard = { expected: item, sent: false, refused: '' };
      clicked = true; click(button(f.table, '完成'));
      const ev = await until(() => {
        if (sendGuard.refused && !sendGuard.sent) { clicked = false; throw new Error(sendGuard.refused); }
        const done = response('AddOneRecord', before, item.code);
        if (!sendGuard.sent && popupError()) { clicked = false; throw new Error(popupError()); }
        return done;
      }, mode.title + '結果確認', 25000, false);
      const sent = ev.request, data = ev.data;
      const matches = r => r && r.PharmacyCode === 'T02' && r.DrugCode === item.code &&
        Number(r.InputAmount) === item.quantity * mode.sign && r.Bedidse === item.bed && r.PrescriptionNumber === 'ADC' && r.Remark === '';
      if (!ev.success) throw new Error(ev.message || 'Portal 未回傳成功');
      if (!matches(sent) || !matches(data) || Number(data[mode.resultField]) !== item.quantity || Number(data[mode.sign === 1 ? 'ReturnAmount' : 'ConsumeAmount']) !== 0 || Number(data.CountingAmount) !== item.stock - item.quantity * mode.sign || data.AmountUnit !== item.unit || data.Inconsistent) throw new Error('回傳資料與本次' + mode.title + '不完全一致');
      const result = { state: 'done', operation: item.operation, stockBefore: item.stock, stockAfter: Number(data.CountingAmount), unit: data.AmountUnit,
        quantity: item.quantity, bed: item.bed, code: item.code, prescriptionNumber: 'ADC', remark: '', time: new Date().toISOString() };
      outcomes.set(token, result);
      pendingSettle = true; lastCompletedAt = Date.now();
      return result;
    } catch (e) {
      const result = { state: clicked ? 'unknown' : 'failed', message: e.message + (clicked ? '；請回 Portal 核對後再決定是否重試' : '') };
      outcomes.set(token, result); return result;
    } finally { sendGuard = null; }
  }
  window.__ADC_HELPER_V1_1_5__ = {
    async call(action, payload) {
      if (action === 'inspect') { try { checkPage(); return { ok: true, drugs: catalogue(), pharmacy: $('#pharmacyT02').checked ? 'T02' : '' }; } catch (e) { return { ok: false, message: e.message }; } }
      if (action === 'outcome') return outcomes.get(payload) || null;
      if (busy) return { ok: false, message: 'Portal 正在處理另一筆操作' };
      busy = true;
      try {
        if (action === 'prepare') return { ok: true, ...(await prepare(payload)) };
        if (action === 'commit') return { ok: true, ...(await commit(payload)) };
        if (action === 'settle') { await settle(); return { ok: true }; }
        if (action === 'cancel') {
          if (ready) {
            const mode = modes[ready.operation], f = confirmFields(mode);
            if (f.inputs[1].value === ready.bed && f.inputs[3].value === 'ADC' && f.remark.value === '' && Number(f.amount.value) === ready.quantity) {
              for (const el of [...f.inputs, f.amount, f.remark]) input(el, '');
              click(button($(mode.root), '回特殊藥品管理首頁'));
            }
          }
          ready = null; return { ok: true };
        }
        throw new Error('不支援此操作');
      } catch (e) { ready = null; return { ok: false, message: e.message }; }
      finally { busy = false; }
    }
  };
})();

