/* Runs inside the signed-in Portal page. Native controls own every request. */
((root) => {
  'use strict';
  if (root.PortalInventoryFactory) return;
  root.PortalInventoryFactory = function createController(notify = () => {}) {
    const C = root.PortalInventoryCore, $ = s => document.querySelector(s), all = (s, el = document) => [...el.querySelectorAll(s)];
    const visible = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const STORE = 'portal-inventory-helper-v1-history';
    let busy = false, stopping = false, active = null, batch = null, seq = 0, fatal = '', unresolved = false;
    const preOwners = new Map();
    const events = [], requestMeta = new WeakMap();
    const fields = ['PharmacyCode', 'DrugCode', 'AmountUnit', 'CountingAmount', 'InputAmount', 'Remark', 'Inconsistent', 'GroupCode', 'ConsumeAmount', 'ReturnAmount', 'ChartNo', 'Accountidse', 'Bedidse', 'PrescriptionNumber', 'CountingTimeRangeStart', 'CountingTimeRangeEnd', 'pharmacycode'];
    const limit = o => Object.fromEntries(fields.filter(k => o && k in o).map(k => [k, o[k]]));
    const metadata = o => ({ code: o.DrugCode, label: o.TradeEngNameComplex, pharmacy: o.PharmacyCode, unit: o.AmountUnit, factor: Number(o.ConvertFactor), group: o.GroupCode, subItem: o.IsSubItem });
    function unpack(body) { let o = JSON.parse(body); return o.jsonObject ? JSON.parse(o.jsonObject) : o; }
    function history() {
      try { const h = JSON.parse(sessionStorage.getItem(STORE) || '[]'); if (!Array.isArray(h)) throw 0; return h; }
      catch { throw new Error('無法讀取本分頁的執行紀錄，請檢查瀏覽器儲存設定'); }
    }
    function save() {
      const h = history().filter(h => h.id !== active.id); h.unshift(active);
      try { sessionStorage.setItem(STORE, JSON.stringify(h.slice(0, 10))); }
      catch { throw new Error('無法保存執行紀錄，已停止接續送出'); }
    }
    function update(message) { notify({ busy, message, run: active, unresolved, canStop: busy && !batch?.clicked }); }
    function pharmacy() { return $('input[name="rx"]:checked')?.value || ''; }
    function assertPharmacy() { if (pharmacy() !== active.pharmacy) throw new Error('作業藥局已改變，已停止'); }
    function readResponse(ev) {
      if (ev.xhr.readyState !== 4) return null;
      try {
        const x = ev.xhr, d = (x.responseType === 'json' ? x.response : JSON.parse(x.responseText))?.d;
        const success = x.status >= 200 && x.status < 300 && d?.IsSuccess === true;
        let data;
        if (ev.endpoint === 'QueryRecordByHour') data = Array.isArray(d?.Data) ? d.Data.map(o => ({ ...metadata(o), amount: o.CountingAmount })) : null;
        else if (ev.endpoint === 'GetCountingItems') data = Array.isArray(d?.Data) ? d.Data.flat().map(metadata) : null;
        else data = limit(d?.Data);
        return { success, data };
      } catch { return { success: false, data: null }; }
    }
    const originalOpen = XMLHttpRequest.prototype.open, originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      let endpoint = '';
      try { const u = new URL(String(url), location.href); if (u.origin === location.origin && /\/DrugCounting\.aspx\/(QueryRecordByHour|GetCountingItems|PreCountOne|AddOneRecord)$/i.test(u.pathname)) endpoint = u.pathname.split('/').pop(); } catch {}
      requestMeta.set(this, endpoint); return originalOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const endpoint = requestMeta.get(this);
      if (!endpoint) return originalSend.call(this, body);
      let request; try { request = limit(unpack(body)); } catch { request = {}; }
      const key = request.PharmacyCode + ':' + request.DrugCode;
      const owner = preOwners.get(key);
      // Each drug has its own check/write pair; replies can arrive out of order.
      // Keep expired callbacks blocked after completion until a fresh manual check.
      if (endpoint === 'AddOneRecord' && owner?.owned && (!busy || owner.batch !== batch || batch?.closed)) {
        throw new Error('已阻止過期盤點回呼再次送出');
      }
      let item = null;
      if ((busy || unresolved) && ['PreCountOne', 'AddOneRecord'].includes(endpoint)) {
        try {
          item = batch?.items.get(request.DrugCode);
          if (unresolved || fatal || !batch?.clicked || batch.closed || !item || ['done', 'failed', 'unknown'].includes(item.job.status)) throw new Error('目前沒有可送出的盤點品項');
          assertPharmacy(); C.assertRecord(request, item.job);
          if (endpoint === 'PreCountOne') {
            if (item.pre) throw new Error('已阻止重複檢核');
            item.job.status = 'checking';
          } else {
            if (item.sent) throw new Error('已阻止重複送出');
            // jQuery may send AddOneRecord before PreCountOne fires loadend.
            const pre = item.pre && readResponse(item.pre);
            if (!pre?.success) throw new Error('盤點前檢核尚未成功');
            C.assertRecord(pre.data, item.job);
            item.job.status = 'sending'; save(); item.sent = true;
          }
        } catch (e) { fatal = e.message; throw e; }
      }
      const ev = { seq: ++seq, endpoint, request, xhr: this, finished: false, response: null };
      if (endpoint === 'PreCountOne') preOwners.set(key, { owned: busy || unresolved, batch });
      events.push(ev); if (events.length > 300) events.shift();
      if (item && endpoint === 'PreCountOne') item.pre = ev;
      if (item && endpoint === 'AddOneRecord') item.add = ev;
      this.addEventListener('loadend', () => {
        ev.finished = true; ev.response = readResponse(ev);
        if (item && batch && !batch.closed) {
          try { reconcile(item); } catch (e) { fatal = e.message; unresolved = true; }
        }
      }, { once: true });
      return originalSend.call(this, body);
    };
    function popupError() {
      const e = $('#divCommonUseDialog .errormessage');
      return visible(e) ? C.norm(e.textContent).slice(0, 200) : '';
    }
    function idle() {
      return !events.some(e => !e.finished) && !(Number(root.jQuery?.active) > 0) && !visible($('#divCommonUseDialog')) && !all('.ui-widget-overlay').some(visible);
    }
    async function until(check, description, timeout = 20000) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (fatal) throw new Error(fatal);
        const error = popupError(); if (error) throw new Error(error);
        if (active) assertPharmacy();
        const result = check(); if (result) return result;
        await pause(50);
      }
      throw new Error(description + '逾時');
    }
    async function stable(check, description, ms = 50) {
      let since = null;
      return until(() => {
        const result = idle() && check();
        if (!result) { since = null; return null; }
        if (since === null) since = Date.now();
        return Date.now() - since >= ms ? result : null;
      }, description);
    }
    function click(e) { if (!visible(e) || e.disabled) throw new Error('找不到可操作按鈕'); e.click(); }
    function input(e, value) {
      if (!visible(e) || e.disabled) throw new Error('找不到盤點／日期輸入欄位');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, String(value));
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function byText(selector, label) { return all(selector).find(e => visible(e) && C.norm(e.textContent) === label); }
    function selectedHour() {
      const cells = all('#divCountingRecord table.hour td').filter(e => e.style.backgroundColor.toLowerCase() === 'highlight');
      return cells.length === 1 && /^\d{2}$/.test(C.norm(cells[0].textContent)) ? Number(C.norm(cells[0].textContent)) : null;
    }
    function readReport() {
      const table = $('#tbCountingRecord');
      const headers = [...(table?.tHead?.rows[0]?.cells || [])].map(e => C.norm(e.textContent));
      if (!visible(table) || headers.join('|') !== '藥品|結存量') throw new Error('結存報表尚未載入或欄位已改變');
      // Do not use element.querySelectorAll('tbody tr'): an outer Portal tbody
      // can satisfy that selector even for this nested table's thead row.
      // Native table collections keep headers, outer tables and nested cells out.
      const rows = [...table.tBodies].flatMap(body => [...body.rows]).map((r, index) => {
        const c = [...r.cells];
        if (c.length !== 2) throw new Error(`結存報表第 ${index + 1} 筆資料有 ${c.length} 欄，預期為藥品及結存量兩欄`);
        return { label: C.norm(c[0].textContent), amount: C.norm(c[1].textContent) };
      });
      if (!rows.length) throw new Error('結存報表沒有資料');
      return rows;
    }
    async function home() {
      if (!visible($('#divMenu'))) click(byText('button', '回特殊藥品管理首頁'));
      await stable(() => visible($('#divMenu')), '返回特殊藥品管理首頁');
    }
    function assertClean() {
      if (all('#divCounting input[name="txbCountingAmount"]').some(e => e.value.trim())) throw new Error('盤點頁已有未送出的數量，請先處理後再執行');
      if (all('#divConsume, #divReturn').some(visible)) throw new Error('目前正在取藥／歸藥，請完成後再執行盤點');
    }
    async function capture(maxGrade) {
      const reportVisible = visible($('#divCountingRecord'));
      const target = C.reportChoice(reportVisible ? $('#divCountingRecord input[name="txbRecordQueryDate"]')?.value : '', reportVisible ? selectedHour() : null);
      if (!target.reuse) {
        update('正在查詢今天 ' + String(target.hour).padStart(2, '0') + ':00 的結存報表…');
        if (!visible($('#divQuery'))) {
          await home(); click($('#divMenu button[name="OpenQuery"]'));
          await stable(() => visible($('#divQuery')), '開啟報表');
        }
        if (!visible($('#divCountingRecord'))) {
          click(all('#divQuery a').find(a => a.getAttribute('href')?.endsWith('#divCountingRecord')));
          await stable(() => visible($('#divCountingRecord')), '開啟結存查詢');
        }
        const date = $('#divCountingRecord input[name="txbRecordQueryDate"]');
        // Use the site's datepicker when available so its internal date agrees.
        if (root.jQuery?.fn?.datepicker) root.jQuery(date).datepicker('setDate', target.date);
        input(date, target.date);
        await stable(() => true, '更新報表日期');
        const before = seq;
        click(all('#divCountingRecord table.hour td').find(e => Number(C.norm(e.textContent)) === target.hour));
        const stamp = `${target.date} ${String(target.hour).padStart(2, '0')}:00:00`;
        const ev = await until(() => events.find(e => e.seq > before && e.endpoint === 'QueryRecordByHour' && e.request.PharmacyCode === active.pharmacy && e.request.CountingTimeRangeStart === stamp && e.request.CountingTimeRangeEnd === stamp && e.finished), '查詢指定時段結存');
        if (!ev.response?.success || !ev.response.data?.length) throw new Error('Portal 未成功回傳指定時段結存');
      }
      await stable(() => visible($('#tbCountingRecord')), '等待結存報表完成');
      const date = $('#divCountingRecord input[name="txbRecordQueryDate"]')?.value;
      if (String(date).replace(/-/g, '/') !== target.date || selectedHour() !== target.hour || !C.reportChoice(date, selectedHour()).reuse) throw new Error('報表時間已不符合今天且晚於現在，請重新執行');
      const rows = C.selected(readReport(), maxGrade);
      const lastQuery = events.filter(e => e.endpoint === 'QueryRecordByHour').at(-1);
      if (lastQuery) {
        const stamp = `${target.date} ${String(target.hour).padStart(2, '0')}:00:00`;
        if (!lastQuery.response?.success || lastQuery.request.PharmacyCode !== active.pharmacy || lastQuery.request.CountingTimeRangeStart !== stamp || lastQuery.request.CountingTimeRangeEnd !== stamp) throw new Error('畫面日期／時段與最後完成的報表查詢不一致');
        const serverRows = C.selected((lastQuery.response.data || []).map(r => ({ label: r.label, amount: r.amount })), maxGrade);
        if (serverRows.length !== rows.length || serverRows.some(s => !rows.some(r => C.norm(r.label) === C.norm(s.label) && r.amount === s.amount))) throw new Error('畫面藥帳與報表回覆不一致');
      }
      active.report = { date: target.date, hour: target.hour, reused: target.reuse }; save();
      update(`已擷取 ${target.date} ${String(target.hour).padStart(2, '0')}:00 藥帳，共 ${rows.length} 項；正在開啟盤點…`);
      return rows;
    }
    function inventoryRows() {
      return all('#divCounting1 table.countingtable tbody tr').map(row => {
        const object = row.querySelector('.object'); let o;
        try { o = JSON.parse(object.textContent); } catch { throw new Error('無法辨識盤點品項資料'); }
        const label = C.norm(row.querySelector('td')?.textContent);
        if (label !== C.norm(o.TradeEngNameComplex)) throw new Error('盤點藥名與藥碼不一致');
        return { ...metadata(o), row, input: row.querySelector('input[name="txbCountingAmount"]') };
      });
    }
    async function openInventory() {
      await home(); const before = seq; click($('#divMenu button[name="OpenCounting"]'));
      const ev = await until(() => events.find(e => e.seq > before && e.endpoint === 'GetCountingItems' && e.request.pharmacycode === active.pharmacy && e.finished), '讀取盤點品項');
      if (!ev.response?.success || !ev.response.data?.length) throw new Error('Portal 未成功回傳盤點品項');
      await stable(() => visible($('#divCounting')), '開啟盤點頁');
      if (!visible($('#divCounting1'))) click(all('#divCounting a').find(a => a.getAttribute('href')?.endsWith('#divCounting1')));
      await stable(() => visible($('#divCounting1')) && inventoryRows().length, '顯示管1～管3盤點頁');
      if (all('#divCounting input[name="txbCountingAmount"]').some(e => e.value.trim())) throw new Error('盤點欄位不是空白，已停止');
      return inventoryRows();
    }
    function warnings(entry) {
      return all('.doubleCheck, .inconsistantWarning', entry.row).map(e => C.norm(e.textContent)).filter(Boolean).join(' ');
    }
    function reconcile(item) {
      const job = item.job;
      if (['done', 'failed', 'unknown'].includes(job.status)) return;
      if (item.add?.finished) {
        try {
          if (!item.add.response?.success) throw new Error('Portal 未確認本筆盤點成功');
          C.assertRecord(item.add.response.data, job);
          job.status = 'done'; job.finishedAt = new Date().toISOString();
        } catch (e) { job.status = 'unknown'; job.message = e.message + '，請回 Portal 查核'; }
        save();
      } else if (item.pre?.finished && !item.sent) {
        try {
          if (!item.pre.response?.success) throw new Error('Portal 盤點前檢核失敗');
          C.assertRecord(item.pre.response.data, job);
          if (warnings(item.entry)) throw new Error(warnings(item.entry));
        } catch (e) { job.status = 'failed'; job.message = e.message; save(); }
      }
    }
    async function submitBatch() {
      const entries = inventoryRows();
      const items = new Map();
      for (const job of active.jobs) {
        const entry = entries.find(r => r.code === job.code);
        if (!entry || entry.pharmacy !== active.pharmacy || C.norm(entry.label) !== C.norm(job.label) || entry.unit !== job.unit) throw new Error('盤點品項已改變');
        if (warnings(entry)) throw new Error('盤點頁已有數量確認提示，請先處理');
        items.set(job.code, { job, entry, pre: null, add: null, sent: false });
      }
      if (all('#divCounting input[name="txbCountingAmount"]').some(e => e.value.trim())) throw new Error('盤點欄位殘留其他數量，已停止');
      batch = { items, clicked: false, closed: false };
      update(`正在填入全部 ${items.size} 項數量…`);
      for (const item of items.values()) {
        input(item.entry.input, item.job.amount); item.job.status = 'filled';
      }
      save();
      await stable(() => {
        for (const item of items.values()) {
          if (item.entry.input.value === '' || Number(item.entry.input.value) !== item.job.amount) throw new Error('送出前數量已改變');
        }
        const selectedInputs = new Set([...items.values()].map(i => i.entry.input));
        if (all('#divCounting input[name="txbCountingAmount"]').some(e => !selectedInputs.has(e) && e.value.trim())) throw new Error('未選取品項出現數量，已停止');
        return true;
      }, '核對全部盤點欄位');
      if (stopping) throw new Error('已取消，尚未送出');
      if (!C.reportChoice(active.report.date, active.report.hour).reuse) throw new Error('已跨過報表時段，請重新擷取今日藥帳');
      // Exactly one native confirmation, after every selected field is filled.
      batch.clicked = true; active.phase = 'submitted'; save();
      update(`已填妥 ${items.size} 項，正在一次送出並核對結果…`);
      click(byText('#divCounting1 button', '確認'));
      const started = Date.now(); let lastDone = -1;
      while (Date.now() - started < 30000) {
        for (const item of items.values()) reconcile(item);
        const completed = [...items.values()].filter(i => ['done', 'failed', 'unknown'].includes(i.job.status)).length;
        const done = active.jobs.filter(j => j.status === 'done').length;
        if (done !== lastDone) { lastDone = done; update(`整批已送出，已確認成功 ${done}／${items.size} 項…`); }
        if (completed === items.size) break;
        // On a guard error, retain replies from requests already in flight.
        if (fatal && [...items.values()].every(i => (!i.pre || i.pre.finished) && (!i.add || i.add.finished))) throw new Error(fatal);
        const error = popupError(); if (error && idle()) throw new Error(error);
        await pause(50);
      }
      for (const item of items.values()) {
        reconcile(item);
        if (!['done', 'failed', 'unknown'].includes(item.job.status)) {
          item.job.status = item.sent ? 'unknown' : 'failed';
          item.job.message = item.sent ? '送出結果逾時，請回 Portal 查核' : 'Portal 未完成此品項，未確認送出';
        }
      }
      batch.closed = true;
      unresolved = active.jobs.some(j => j.status === 'unknown') || [...items.values()].some(i => (i.pre && !i.pre.finished) || (i.add && !i.add.finished));
      save();
      if (active.jobs.every(j => j.status === 'done')) {
        await stable(() => visible($('#divCounting1')) && [...items.values()].every(i => i.entry.input.value === '' && !warnings(i.entry)), '等待整批盤點畫面恢復', 200);
      }
    }
    async function run(maxGrade) {
      if (busy) return;
      if (unresolved || history().some(h => !h.acknowledged && h.jobs?.some(j => j.status === 'sending' || j.status === 'unknown'))) { update('上次有尚未確認結果的盤點，請先回 Portal 查核，再解除鎖定。'); return; }
      busy = true; stopping = false; fatal = ''; active = null; batch = null;
      try {
        if (![2, 3].includes(maxGrade)) throw new Error('盤點範圍不正確');
        if (!pharmacy()) throw new Error('請先在頁面選擇作業藥局，再按藥帳帶入盤點');
        if (!root.jQuery || !$('#divMenu')) throw new Error('Portal 尚未載入完成');
        active = { id: crypto.randomUUID(), pharmacy: pharmacy(), maxGrade, startedAt: new Date().toISOString(), status: 'running', jobs: [] };
        save(); update('正在讀取報表…');
        await stable(() => true, '等待 Portal 完成目前操作'); assertClean();
        const captured = await capture(maxGrade);
        if (stopping) throw new Error('已停止，尚未送出');
        const inventory = await openInventory();
        active.jobs = C.match(captured, inventory, active.pharmacy, maxGrade); save();
        if (stopping) throw new Error('已取消，尚未送出');
        await submitBatch();
        const done = active.jobs.filter(j => j.status === 'done').length;
        active.status = done === active.jobs.length ? 'done' : 'partial'; save();
        update(active.status === 'done' ? `盤點完成：${done} 項均已收到 Portal 成功回覆。` : `整批處理結束：成功 ${done}／${active.jobs.length} 項。請查看未完成品項；本工具不會自動重送。`);
      } catch (e) {
        if (active) {
          active.status = 'stopped'; active.message = String(e.message || '操作未完成');
          if (batch) {
            for (const item of batch.items.values()) {
              try { reconcile(item); } catch { unresolved = true; }
              if (['done', 'failed', 'unknown'].includes(item.job.status)) continue;
              const sent = item.sent || item.job.status === 'sending';
              item.job.status = sent ? 'unknown' : 'failed';
              item.job.message = sent ? '送出結果待查核' : '未送出';
            }
            batch.closed = true;
            if (active.jobs.some(j => j.status === 'unknown')) unresolved = true;
          }
          // Keep the guard closed against callbacks arriving after a timeout.
          if (events.some(ev => !ev.finished && ['PreCountOne', 'AddOneRecord'].includes(ev.endpoint))) unresolved = true;
          try { save(); } catch { unresolved = true; }
        }
        update(String(e.message || '未完成') + (unresolved ? '；請重新整理後回 Portal 查核，本工具不會自動重送。' : '；已停止接續送出。'));
      } finally {
        if (batch) {
          batch.closed = true;
          for (const item of batch.items.values()) {
            if (!item.sent && item.entry.input.value === String(item.job.amount)) item.entry.input.value = '';
          }
        }
        busy = false; batch = null;
        notify({ busy, run: active, unresolved, canStop: false });
      }
    }
    return {
      run, history, stop() {
        if (batch?.clicked) { update('整批已送出，正在等待 Portal 回覆。'); return; }
        stopping = true; update('已取消，將停止送出。');
      },
      acknowledge() {
        if (busy) return;
        if (unresolved) throw new Error('請先重新整理此頁，再查核上次送出結果');
        const h = history(); h.forEach(x => { x.acknowledged = true; }); sessionStorage.setItem(STORE, JSON.stringify(h));
      },
      get busy() { return busy; }
    };
  };
})(globalThis);

