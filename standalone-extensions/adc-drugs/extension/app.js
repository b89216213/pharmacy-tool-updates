import {managedOperation,managedStatus,openManagement} from './managed-client.js';
import { readXlsx } from './xlsx.js';
import { todayKey, classifyFile, parseReport, aggregate, protectedStatus } from './core.js';

const $ = id => document.getElementById(id);
const LEDGER = 'adc-ledger-v1';
let root, day = todayKey(), groups = [], rows = [], ledger = {}, connectedTab = null, drugs = new Map();
let loading = false, running = false, stopRequested = false, fileErrors = [], reconcileKey = null;
let runTotal = 0, runFinished = 0;
let runOperation = 'consume', reconcileKind = 'consume';
const returnSelection = new Set();
const states = { pending: '待取藥', skipped: '略過', done: '已完成', returned: '測試已歸藥', preparing: '選藥與填入', sending: '送出確認中', failed: '未完成', unknown: '待核對' };
const entryFields = { prescriptionNumber: 'ADC', remark: '' };
function recordedFields(entry) {
  // Keep v1.0.0 history accurate; its ADC was written in Remark.
  if (!entry) return entryFields;
  return { prescriptionNumber: entry.prescriptionNumber ?? '', remark: entry.remark ?? 'ADC' };
}
function say(message, error = false) { $('message').textContent = message; $('message').className = error ? 'error' : ''; }
function node(tag, className, text) { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; }
function status(row) { const e = ledger[row.key]; return e?.returnEntry?.status === 'done' ? 'returned' : e?.status || (row.selected ? 'pending' : 'skipped'); }
function actionable(row) { return row.selected && !protectedStatus(ledger[row.key]); }
function currentIssue(row) {
  const d = drugs.get(row.code);
  if (connectedTab && !d) return 'Portal 無此八碼';
  if (d && (d.factor !== 1 || d.subItem || d.group)) return '品項涉及換算／群組';
  const previous = ledger[row.key];
  if (previous && protectedStatus(previous) && previous.quantity !== row.quantity) return '報表數量與既有執行紀錄不同，請核對';
  return '';
}
async function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('adc-report-folder-v1', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('settings');
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });
}
async function folderStorage(value) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('settings', value ? 'readwrite' : 'readonly');
    const store = tx.objectStore('settings');
    const req = value ? store.put(value, 'root') : store.get('root');
    tx.oncomplete = () => { database.close(); resolve(req.result); };
    tx.onerror = () => { database.close(); reject(tx.error); };
  });
}
async function loadLedger() { ledger = (await chrome.storage.local.get(LEDGER))[LEDGER] || {}; }
async function saveEntry(row, entry) {
  // Persist before every write to Portal; never continue when journaling fails.
  const all = (await chrome.storage.local.get(LEDGER))[LEDGER] || {};
  all[row.key] = { day: row.day, bed: row.bed, code: row.code, quantity: row.quantity,
    name: row.name, history: all[row.key]?.history || [], ...entry, updatedAt: new Date().toISOString() };
  await chrome.storage.local.set({ [LEDGER]: all }); ledger = all;
}
function render() {
  const selected = rows.filter(actionable), done = rows.filter(r => status(r) === 'done').length;
  $('counts').textContent = rows.length ? `${new Set(rows.map(r => r.device)).size} 個裝置 · ${rows.length} 筆 · ${new Set(rows.map(r => r.code)).size} 種藥品` : '尚無資料';
  $('selectedCount').textContent = `待取藥 ${selected.length} 筆`;
  $('runHint').textContent = running ? '停止後會保留已完成紀錄' : uncertainReturn() ? '請展開下方測試工具，核對歸藥結果' : done ? `今日已完成 ${done} 筆，重新讀取也不會重送` : '取藥前盤點沿用 Portal 顯示數量';
  $('start').disabled = running || loading || !connectedTab || !selected.length || fileErrors.length > 0 || uncertainReturn() || rows.some(r => r.selected && (currentIssue(r) || status(r) === 'unknown' || status(r) === 'sending'));
  $('start').textContent = done ? '繼續未完成取藥' : '開始批次取藥';
  $('stop').hidden = !running; $('start').hidden = running;
  for (const id of ['chooseFolder', 'grant', 'reload', 'defaults', 'clearSelected', 'connect', 'portalTabs']) $(id).disabled = running || loading;
  $('exportLog').disabled = (!rows.length && !Object.keys(ledger).length) || running;
  $('progress').max = runTotal || 1; $('progress').value = runFinished;
  $('progressText').textContent = runTotal ? `${runOperation === 'return' ? '歸藥' : '取藥'} ${runFinished} / ${runTotal} 筆已確認完成` : '尚未開始';
  const search = $('search').value.trim().toLowerCase(), filter = $('viewFilter').value;
  const visibleRows = rows.filter(r => {
    if (search && !`${r.device} ${r.bed} ${r.name} ${r.code}`.toLowerCase().includes(search)) return false;
    const s = status(r);
    return filter === 'all' || (filter === 'pending' && actionable(r)) || (filter === 'skipped' && !r.selected && !ledger[r.key]) || (filter === 'done' && ['done', 'returned'].includes(s)) || (filter === 'issue' && (['unknown', 'failed'].includes(s) || currentIssue(r)));
  });
  const body = $('rows'); body.replaceChildren();
  if (!visibleRows.length) {
    const tr = node('tr'), td = node('td', 'empty', rows.length ? '沒有符合條件的資料。' : '尚無今日報表，請選擇根目錄或重新讀取。'); td.colSpan = 5; tr.append(td); body.append(tr);
  }
  for (const row of visibleRows) {
    const s = status(row), entry = ledger[row.key], issue = currentIssue(row);
    const tr = node('tr', s === 'skipped' ? 'skipped' : ''); tr.dataset.key = row.key;
    const cell = node('td'), check = node('input'); check.type = 'checkbox'; check.checked = row.selected;
    check.disabled = running || loading || protectedStatus(entry); check.setAttribute('aria-label', `取藥 ${row.bed} ${row.name}`);
    check.addEventListener('change', () => { row.selected = check.checked; render(); }); cell.append(check);
    const bed = node('td', 'bed', row.bed), drug = node('td');
    drug.append(node('div', 'drugname', row.name));
    const meta = node('div', 'drugmeta', `${row.code}${row.sources.length > 1 ? ` · ${row.sources.length} 個藥格合併` : ''}${row.defaultExcluded ? ' · 預設略過' : ''}`);
    meta.title = row.sources.map(s => `${s.fileName} 第${s.row}列 / ${s.drawer} / ${s.quantity}`).join('\n'); drug.append(meta);
    const quantity = node('td', 'quantity', String(row.quantity));
    const stateCell = node('td'); stateCell.append(node('span', `state ${s}`, states[s] || s));
    if (entry?.stockAfter !== undefined) stateCell.append(node('div', 'rowmessage', `結存 ${entry.stockBefore} → ${entry.stockAfter} ${entry.unit || ''}`));
    if (issue || entry?.message) stateCell.append(node('div', 'rowmessage', issue || entry.message));
    if (entry?.returnEntry) stateCell.append(node('div', 'rowmessage', `測試歸藥：${returnStatus(entry)}`));
    if (s === 'unknown') {
      const reconcile = node('button', 'rowaction', '核對結果'); reconcile.disabled = running;
      reconcile.addEventListener('click', () => {
        reconcileKey = row.key; reconcileKind = 'consume';
        const fields = recordedFields(entry);
        $('reconcileInfo').textContent = `${row.bed}｜${row.name}｜數量 ${entry.quantity}｜領藥號 ${fields.prescriptionNumber || '空白'}｜備註 ${fields.remark || '空白'}`;
        $('reconcile').showModal();
      }); stateCell.append(reconcile);
    }
    tr.append(cell, bed, drug, quantity, stateCell); body.append(tr);
  }
  renderReturns();
}
function returnRecords() {
  return Object.entries(ledger).filter(([, e]) => e.status === 'done').map(([key, e]) => ({ ...e, key }))
    .sort((a, b) => a.code.localeCompare(b.code) || a.bed.localeCompare(b.bed, 'en', { numeric: true }));
}
function uncertainReturn() { return Object.values(ledger).some(e => ['preparing', 'sending', 'unknown'].includes(e.returnEntry?.status)); }
function canReturn(entry) { return entry.status === 'done' && !['preparing', 'sending', 'unknown', 'done'].includes(entry.returnEntry?.status); }
function returnStatus(entry) { return entry.returnEntry?.status === 'done' ? '已歸藥' : entry.returnEntry ? states[entry.returnEntry.status] || '待核對' : '可歸藥'; }
function selectedReturns() { return returnRecords().filter(e => e.day === $('returnDate').value && returnSelection.has(e.key)); }
function renderReturns() {
  const all = returnRecords(), dates = [...new Set([todayKey(), ...all.map(e => e.day)])].sort().reverse();
  const chosenDay = $('returnDate').value || todayKey();
  $('returnDate').replaceChildren();
  for (const date of dates) { const option = node('option', '', `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6)} 取藥紀錄`); option.value = date; $('returnDate').append(option); }
  $('returnDate').value = dates.includes(chosenDay) ? chosenDay : todayKey();
  const visible = all.filter(e => e.day === $('returnDate').value), selected = selectedReturns();
  $('returnCount').textContent = `${visible.filter(canReturn).length} 筆可歸藥 · ${visible.filter(e => e.returnEntry?.status === 'done').length} 筆已歸藥`;
  $('returnHint').textContent = running && runOperation === 'return' ? '正在逐筆歸藥，請等待結果。' : uncertainReturn() ? '有歸藥結果需要核對，請先處理。' : `已勾選 ${selected.length} 筆`;
  for (const id of ['returnDate', 'returnRefresh', 'returnAll', 'returnNone']) $(id).disabled = running || loading;
  $('startReturn').disabled = running || loading || !connectedTab || uncertainReturn() || !selected.some(canReturn);
  $('enableRetest').disabled = running || loading || uncertainReturn() || !selected.length || selected.some(e => e.day !== todayKey() || e.returnEntry?.status !== 'done');
  const body = $('returnRows'); body.replaceChildren();
  if (!visible.length) { const tr = node('tr'), td = node('td', 'empty', '此日期沒有已確認成功的取藥紀錄。'); td.colSpan = 5; tr.append(td); body.append(tr); }
  for (const entry of visible) {
    const tr = node('tr'), cell = node('td'), check = node('input'); check.type = 'checkbox'; check.checked = returnSelection.has(entry.key);
    check.disabled = running || loading || ['preparing', 'sending', 'unknown'].includes(entry.returnEntry?.status);
    check.setAttribute('aria-label', `測試歸藥 ${entry.bed} ${entry.name}`);
    check.addEventListener('change', () => { if (check.checked) returnSelection.add(entry.key); else returnSelection.delete(entry.key); renderReturns(); }); cell.append(check);
    const drug = node('td'); drug.append(node('div', 'drugname', entry.name), node('div', 'drugmeta', entry.code));
    const stateCell = node('td'); stateCell.append(node('span', `state ${entry.returnEntry?.status || ''}`, returnStatus(entry)));
    if (entry.returnEntry?.stockAfter !== undefined) stateCell.append(node('div', 'rowmessage', `結存 ${entry.returnEntry.stockBefore} → ${entry.returnEntry.stockAfter} ${entry.returnEntry.unit || ''}`));
    if (entry.returnEntry?.message) stateCell.append(node('div', 'rowmessage', entry.returnEntry.message));
    if (entry.returnEntry?.status === 'unknown') {
      const reconcileButton = node('button', 'rowaction', '核對歸藥'); reconcileButton.disabled = running;
      reconcileButton.addEventListener('click', () => {
        reconcileKey = entry.key; reconcileKind = 'return';
        $('reconcileInfo').textContent = `核對歸藥：${entry.bed}｜${entry.name}｜歸回數量 ${entry.quantity}｜領藥號 ADC｜備註空白`;
        $('reconcile').showModal();
      }); stateCell.append(reconcileButton);
    }
    tr.append(cell, node('td', 'bed', entry.bed), drug, node('td', 'quantity', `${entry.quantity} ${entry.unit || ''}`), stateCell); body.append(tr);
  }
}
async function saveReturn(key, entry) {
  const old = ledger[key]; if (!old || old.status !== 'done') throw new Error('原取藥紀錄未確認完成，無法歸藥');
  await saveEntry({ ...old, key }, { ...old, withdrawalTime: old.withdrawalTime || old.time || old.updatedAt, returnEntry: { ...entryFields, operation: 'return', quantity: old.quantity, ...entry, updatedAt: new Date().toISOString() } });
}
async function startReturn() { return managedOperation(startReturnAuthorized); }
async function startReturnAuthorized() {
  if (running || loading) return;
  await navigator.locks.request('adc-batch-run', { ifAvailable: true }, async lock => {
    if (!lock) { say('另一個工具視窗正在執行作業。', true); return; }
    await loadLedger();
    if (uncertainReturn()) { say('請先核對尚未確認的歸藥結果。', true); render(); return; }
    const queue = selectedReturns().filter(canReturn); if (!queue.length || !connectedTab) { render(); return; }
    running = true; runOperation = 'return'; stopRequested = false; $('stop').disabled = false; runTotal = queue.length; runFinished = 0; render();
    $('progressCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try {
      await chrome.tabs.update(connectedTab, { active: true });
      const info = await bridge('inspect'); if (!info.ok) throw new Error(info.message);
      for (const entry of queue) {
        if (stopRequested) break;
        await saveReturn(entry.key, { status: 'preparing', tabId: connectedTab }); render();
        say(`歸還測試取藥：${entry.bed} · ${entry.name} · ${entry.quantity}`);
        let prepared;
        try {
          prepared = await bridge('prepare', { operation: 'return', key: entry.key, code: entry.code, bed: entry.bed, quantity: entry.quantity, unit: entry.unit || '' });
          if (!prepared.ok) throw new Error(prepared.message);
          if (prepared.operation !== 'return') throw new Error('Portal 未進入歸藥流程，尚未送出');
        } catch (e) {
          await saveReturn(entry.key, { status: 'failed', message: e.message, tabId: connectedTab }); throw e;
        }
        if (stopRequested) { await bridge('cancel').catch(() => {}); await saveReturn(entry.key, { status: 'failed', message: '已停止，尚未送出' }); break; }
        const base = { status: 'sending', token: prepared.token, tabId: connectedTab, stockBefore: prepared.stock, unit: prepared.unit };
        await saveReturn(entry.key, base); render();
        let result;
        try { result = await bridge('commit', prepared.token); }
        catch { result = { state: 'unknown', message: '歸藥送出後連線中斷，請核對 Portal 使用明細' }; }
        if (result.state === 'done' && result.operation === 'return') {
          await saveReturn(entry.key, { ...base, ...result, status: 'done', message: '' }); runFinished++;
          render(); say(`已完成 ${entry.bed} 歸藥，等待 Portal 回到主選單…`);
          const settled = await bridge('settle'); if (!settled.ok) throw new Error(settled.message);
        } else {
          const s = result.state === 'failed' ? 'failed' : 'unknown', message = result.message || '無法確認歸藥結果，請核對 Portal';
          await saveReturn(entry.key, { ...base, status: s, message }); throw new Error(`${entry.bed} ${entry.code}：${message}`);
        }
        render();
      }
      say(stopRequested ? `已停止。這次已確認歸藥 ${runFinished} 筆。` : `批次歸藥完成，共 ${runFinished} 筆。可在測試工具允許這些項目重新取藥。`);
    } catch (e) { say(e.message + '\n已停止後續歸藥，完成的紀錄會保留。', true); }
    finally { running = false; render(); }
  });
}
async function enableRetest() {
  if (running || loading) return;
  await navigator.locks.request('adc-batch-run', { ifAvailable: true }, async lock => {
    if (!lock) throw new Error('目前有作業執行中');
    await loadLedger();
    const selected = selectedReturns();
    if (uncertainReturn() || !selected.length || selected.some(e => e.day !== todayKey() || e.returnEntry?.status !== 'done')) throw new Error('請只勾選今日已確認歸藥的項目');
    for (const entry of selected) {
      const { history = [], key, ...previous } = entry;
      await saveEntry(entry, { ...entryFields, history: [...history, previous], status: 'pending', message: '測試歸藥完成，可重新取藥' });
      const row = rows.find(r => r.key === key); if (row) row.selected = true;
      returnSelection.delete(key);
    }
    say(`已開放 ${selected.length} 筆重新測試取藥，歷次紀錄已保留。請回上方確認清單後開始取藥。`); render();
  });
}
function renderFiles(ignored) {
  $('fileList').replaceChildren();
  for (const g of groups) {
    const row = node('div', 'fileitem'); row.append(node('strong', '', g.bed));
    if (g.files.length === 1) row.append(node('span', '', g.files[0].name));
    else {
      const select = node('select'); select.setAttribute('aria-label', `${g.bed} 報表版本`);
      const blank = node('option', '', '有多份 134 報表，請選擇一份'); blank.value = ''; select.append(blank);
      for (const f of g.files) { const option = node('option', '', f.name); option.value = f.name; select.append(option); }
      select.value = g.choice || ''; select.disabled = running || loading;
      select.addEventListener('change', async () => { g.choice = select.value; await parseChosen(); });
      row.append(select);
    }
    $('fileList').append(row);
  }
  for (const error of fileErrors) $('fileList').append(node('p', 'fileerr', error));
  $('fileSummary').textContent = `${groups.reduce((n, g) => n + g.files.length, 0)} 份符合 134 的報表${ignored !== undefined ? `，已排除 ${ignored} 個其他檔案` : ''}${fileErrors.length ? '；有資料需要處理' : ''}`;
}
async function parseChosen() {
  loading = true; rows = []; fileErrors = []; render();
  try {
    if (groups.some(g => !g.choice)) { say('同一裝置有多份 134 報表，請在檔案清單中選擇要使用的一份。', true); return; }
    const raw = [];
    for (const g of groups) {
      const picked = g.files.find(f => f.name === g.choice);
      try {
        const file = await picked.handle.getFile();
        const sheets = await readXlsx(await file.arrayBuffer());
        raw.push(...parseReport(sheets, picked.meta, picked.name));
      } catch (e) { fileErrors.push(`${picked.name}：${e.message}`); }
    }
    if (fileErrors.length) { say('有報表無法讀取，請查看檔案清單；處理後按「重新讀取」。', true); return; }
    rows = aggregate(raw);
    await loadLedger();
    const pendingRecovery = rows.some(r => ['sending', 'preparing'].includes(ledger[r.key]?.status));
    if (pendingRecovery) await recover();
    say(`已讀取 ${groups.length} 份報表、${raw.length} 列，整理為 ${rows.length} 筆取藥。${rows.filter(r => r.defaultExcluded).length} 筆 Modipanol 預設略過。`);
  } catch (e) { fileErrors.push(e.message); rows = []; say(e.message, true); }
  finally { loading = false; renderFiles(); render(); }
}
async function scan() {
  if (running || loading) return;
  loading = true; rows = []; groups = []; fileErrors = []; render();
  day = todayKey(); $('dateLabel').textContent = day;
  try {
    if (!root) throw new Error('請先選擇包含每日日期子資料夾的報表根目錄。');
    $('folderName').textContent = root.name;
    $('folderDetail').textContent = `${root.name} / ${day} / *_補藥報表_${day}-134*.xlsx`;
    if (await root.queryPermission({ mode: 'read' }) !== 'granted') {
      $('grant').hidden = false; throw new Error('請按「允許讀取」，授權存取已設定的根目錄。');
    }
    $('grant').hidden = true;
    let sub;
    try { sub = await root.getDirectoryHandle(day, { create: false }); }
    catch { throw new Error(`根目錄內找不到今日子資料夾 ${day}。請確認你選的是日期資料夾的上一層。`); }
    let ignored = 0; const map = new Map();
    for await (const [name, handle] of sub.entries()) {
      if (handle.kind !== 'file') continue;
      const meta = classifyFile(name, day);
      if (!meta.include) { ignored++; continue; }
      if (!map.has(meta.bed)) map.set(meta.bed, { bed: meta.bed, files: [], choice: '' });
      map.get(meta.bed).files.push({ name, handle, meta });
    }
    groups = [...map.values()].sort((a, b) => a.bed.localeCompare(b.bed, 'en', { numeric: true }));
    for (const g of groups) {
      g.files.sort((a, b) => b.meta.time.localeCompare(a.meta.time));
      if (g.files.length === 1) g.choice = g.files[0].name;
    }
    renderFiles(ignored);
    if (!groups.length) throw new Error(`${day} 資料夾內尚無時間碼以 134 開頭的補藥報表。`);
    if (groups.some(g => !g.choice)) $('fileDetails').open = true;
    loading = false; await parseChosen();
    renderFiles(ignored);
  } catch (e) { say(e.message, true); }
  finally { loading = false; render(); }
}
async function bridge(action, payload, tabId = connectedTab) {
  if (!tabId) throw new Error('尚未連接特殊藥品管理');
  const result = await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN',
    func: async (action, payload) => {
      if (!window.__ADC_HELPER_V1_1_5__) return { ok: false, message: '頁面已重新載入，請重新連接' };
      return await window.__ADC_HELPER_V1_1_5__.call(action, payload);
    }, args: [action, payload ?? null] });
  if (!result[0]?.result) throw new Error('Portal 無回應或已關閉');
  return result[0].result;
}
async function connect(refresh = true) {
  if (running) return;
  connectedTab = null; drugs = new Map(); $('connection').textContent = '偵測中'; $('connection').className = 'badge muted'; render();
  try {
    if (refresh) {
      const previous = Number($('portalTabs').value) || Number(new URL(location.href).searchParams.get('source'));
      const tabs = (await chrome.tabs.query({})).filter(t => /^https?:\/\/ihisaw\.ntuh\.gov\.tw\/WebApplication\/PharManagement\/DrugCounting\.aspx(?:[?#]|$)/i.test(t.url || ''));
      $('portalTabs').replaceChildren();
      if (!tabs.length) { const opt = node('option', '', '請先在 Portal 開啟特殊藥品管理'); opt.value = ''; $('portalTabs').append(opt); throw new Error('請先登入 Portal 並開啟「特殊藥品管理」，再按重新偵測。'); }
      if (tabs.length > 1) { const opt = node('option', '', '有多個特殊藥品管理頁面，請選擇'); opt.value = ''; $('portalTabs').append(opt); }
      tabs.forEach(t => { const opt = node('option', '', `${t.title || '特殊藥品管理'}（頁面 ${t.id}）`); opt.value = String(t.id); $('portalTabs').append(opt); });
      if (tabs.some(t => t.id === previous)) $('portalTabs').value = String(previous);
      else if (tabs.length === 1) $('portalTabs').value = String(tabs[0].id);
    }
    const id = Number($('portalTabs').value); if (!id) throw new Error('請選擇要使用的特殊藥品管理頁面。');
    await chrome.scripting.executeScript({ target: { tabId: id }, world: 'MAIN', files: ['bridge.js'] });
    const info = await bridge('inspect', null, id);
    if (!info.ok) throw new Error(info.message);
    connectedTab = id; drugs = new Map(info.drugs.map(d => [d.code, d]));
    $('connection').textContent = '已連接'; $('connection').className = 'badge connected';
    say('已連接特殊藥品管理。執行時固定切換至西址住院藥局。');
    await recover();
  } catch (e) { $('connection').textContent = '尚未連接'; say(e.message, true); }
  render();
}
async function recover() {
  return navigator.locks.request('adc-batch-run', { ifAvailable: true }, async lock => {
    if (lock) await recoverUnlocked();
  });
}
async function recoverUnlocked() {
  // Only revive confirmed results, never automatically repeat a interrupted send.
  await loadLedger();
  for (const [key, original] of Object.entries(ledger)) {
    const row = { ...original, key }, e = ledger[key];
    if (!['preparing', 'sending', 'unknown'].includes(e.status)) continue;
    if (e.status === 'preparing') { await saveEntry(row, { ...e, status: 'failed', message: '前次在送出前中斷；請回 Portal 首頁後再執行' }); continue; }
    let recovered = null;
    if (e.token && connectedTab === e.tabId) {
      try { recovered = await bridge('outcome', e.token); } catch { /* retain unknown */ }
    }
    if (recovered?.state === 'done') await saveEntry(row, { ...e, ...recovered, status: 'done', message: '' });
    else if (e.status === 'sending') await saveEntry(row, { ...e, status: 'unknown', message: '前次在送出確認時中斷，請核對 Portal 使用明細' });
  }
  for (const [key, entry] of Object.entries(ledger)) {
    const e = entry.returnEntry; if (!e || !['preparing', 'sending', 'unknown'].includes(e.status)) continue;
    if (e.status === 'preparing') { await saveReturn(key, { ...e, status: 'failed', message: '前次歸藥在送出前中斷，請回 Portal 首頁後再執行' }); continue; }
    let recovered = null;
    if (e.token && connectedTab === e.tabId) { try { recovered = await bridge('outcome', e.token); } catch { /* retain unknown */ } }
    if (recovered?.state === 'done' && recovered.operation === 'return') await saveReturn(key, { ...e, ...recovered, status: 'done', message: '' });
    else if (e.status === 'sending') await saveReturn(key, { ...e, status: 'unknown', message: '前次歸藥在送出確認時中斷，請核對 Portal 使用明細' });
  }
}
async function startRun() { return managedOperation(startRunAuthorized); }
async function startRunAuthorized() {
  if (running || loading) return;
  await navigator.locks.request('adc-batch-run', { ifAvailable: true }, async lock => {
    if (!lock) { say('另一個工具視窗正在執行取藥。', true); return; }
    await loadLedger();
    if (day !== todayKey()) { say('日期已變更，請重新讀取今日報表。', true); return; }
    if (uncertainReturn()) { say('請先到測試工具核對歸藥結果，再繼續取藥。', true); render(); return; }
    if (fileErrors.length || rows.some(r => r.selected && (currentIssue(r) || ['unknown', 'sending'].includes(status(r))))) { say('請先處理清單中需要核對的資料。', true); render(); return; }
    const queue = rows.filter(actionable); if (!queue.length || !connectedTab) return;
    running = true; runOperation = 'consume'; stopRequested = false; $('stop').disabled = false; runTotal = queue.length; runFinished = 0; render();
    $('progressCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try {
      await chrome.tabs.update(connectedTab, { active: true });
      const info = await bridge('inspect'); if (!info.ok) throw new Error(info.message);
      for (const row of queue) {
        if (stopRequested) break;
        if (day !== todayKey()) throw new Error('日期已變更，已停止後續取藥');
        await saveEntry(row, { ...entryFields, status: 'preparing', message: '', tabId: connectedTab }); render();
        say(`處理 ${row.bed} · ${row.name} · ${row.quantity}`);
        let prepared;
        try {
          prepared = await bridge('prepare', { key: row.key, code: row.code, bed: row.bed, quantity: row.quantity });
          if (!prepared.ok) throw new Error(prepared.message);
        } catch (e) {
          await saveEntry(row, { ...entryFields, status: 'failed', message: e.message, tabId: connectedTab });
          throw new Error(`${row.bed} ${row.code}：${e.message}`);
        }
        if (stopRequested) {
          await bridge('cancel').catch(() => {});
          await saveEntry(row, { ...entryFields, status: 'failed', message: '已停止，尚未送出' }); break;
        }
        const base = { ...entryFields, status: 'sending', token: prepared.token, tabId: connectedTab, stockBefore: prepared.stock, unit: prepared.unit };
        await saveEntry(row, base); render();
        let result;
        try { result = await bridge('commit', prepared.token); }
        catch (e) { result = { state: 'unknown', message: '送出後連線中斷，請核對 Portal 使用明細' }; }
        if (result.state === 'done') {
          await saveEntry(row, { ...base, ...result, status: 'done', message: '' }); runFinished++;
          render(); say(`已完成 ${row.bed} 取藥，等待 Portal 回到主選單…`);
          const settled = await bridge('settle'); if (!settled.ok) throw new Error(settled.message);
        } else {
          const s = result.state === 'failed' ? 'failed' : 'unknown';
          await saveEntry(row, { ...base, status: s, message: result.message || '無法確認取藥結果，請核對 Portal' });
          throw new Error(`${row.bed} ${row.code}：${ledger[row.key].message}`);
        }
        render();
      }
      say(stopRequested ? `已停止。這次已完成 ${runFinished} 筆，其餘尚未送出。` : `批次取藥完成，共 ${runFinished} 筆。`);
    } catch (e) { say(e.message + '\n已停止後續取藥，已完成的紀錄會保留。', true); }
    finally { running = false; render(); }
  });
}
async function reconcile(recorded) {
  if (!reconcileKey || running) return;
  await navigator.locks.request('adc-batch-run', { ifAvailable: true }, async lock => {
    if (!lock) throw new Error('取藥執行中，暫時不能更改核對結果');
    await loadLedger();
    const old = ledger[reconcileKey]; if (!old) return;
    if (reconcileKind === 'return') {
      if (old.returnEntry?.status !== 'unknown') throw new Error('歸藥狀態已更新，請重新讀取紀錄');
      await saveReturn(reconcileKey, { ...old.returnEntry, status: recorded ? 'done' : 'failed', manuallyChecked: true,
        message: recorded ? '已由使用者核對 Portal 歸藥完成' : '已由使用者核對未歸藥，可重試' });
    } else {
      if (old.status !== 'unknown') throw new Error('取藥狀態已更新，請重新讀取紀錄');
      await saveEntry({ ...old, key: reconcileKey }, { ...old, status: recorded ? 'done' : 'failed', manuallyChecked: true,
        message: recorded ? '已由使用者核對 Portal 登錄完成' : '已由使用者核對未登錄，可重試' });
    }
    $('reconcile').close(); render();
  });
}
function on(id, fn) { $(id).addEventListener('click', () => Promise.resolve().then(fn).catch(e => say(e.message, true))); }
on('chooseFolder', async () => {
  try { root = await window.showDirectoryPicker({ id: 'adc-report-root', mode: 'read' }); }
  catch (e) { if (e.name === 'AbortError') return; throw e; }
  await folderStorage(root); await scan();
});
on('grant', async () => { if (root && await root.requestPermission({ mode: 'read' }) === 'granted') await scan(); });
on('reload', scan); on('connect', () => connect(true));
$('portalTabs').addEventListener('change', () => connect(false).catch(e => say(e.message, true)));
on('showPortal', async () => {
  const id = connectedTab || Number($('portalTabs').value); if (!id) throw new Error('請先開啟並連接特殊藥品管理');
  const tab = await chrome.tabs.get(id); await chrome.tabs.update(id, { active: true }); await chrome.windows.update(tab.windowId, { focused: true });
});
on('defaults', () => { rows.forEach(r => { if (!protectedStatus(ledger[r.key])) r.selected = !r.defaultExcluded; }); render(); });
on('clearSelected', () => { rows.forEach(r => { if (!protectedStatus(ledger[r.key])) r.selected = false; }); render(); });
on('start', startRun);
on('startReturn', startReturn); on('enableRetest', enableRetest);
on('returnRefresh', async () => { await recover(); render(); });
on('returnAll', () => { returnSelection.clear(); returnRecords().filter(e => e.day === $('returnDate').value && canReturn(e)).forEach(e => returnSelection.add(e.key)); renderReturns(); });
on('returnNone', () => { returnSelection.clear(); renderReturns(); });
$('returnDate').addEventListener('change', () => { returnSelection.clear(); renderReturns(); });
on('stop', () => { stopRequested = true; $('stop').disabled = true; say('正在停止；若目前這筆已送出，會先確認結果，不再開始下一筆。'); });
on('reconcileClose', () => $('reconcile').close()); on('recorded', () => reconcile(true)); on('notRecorded', () => reconcile(false));
$('search').addEventListener('input', render); $('viewFilter').addEventListener('change', render);
on('exportLog', () => {
  const list = [['日期', '病房', '八碼', '藥名', '作業', '數量', '狀態', '作業前結存', '作業後結存', '領藥號', '備註', '執行時間', '訊息']];
  const add = (e, operation, parent = e) => { const fields = recordedFields(e); list.push([parent.day, parent.bed, parent.code, parent.name, operation, e.quantity, states[e.status] || e.status, e.stockBefore ?? '', e.stockAfter ?? '', fields.prescriptionNumber, fields.remark, e.withdrawalTime || e.time || e.updatedAt || '', e.message || '']); };
  for (const entry of Object.values(ledger)) for (const e of [...(entry.history || []), entry]) { add(e, '取藥'); if (e.returnEntry) add(e.returnEntry, '歸藥', e); }
  for (const r of rows.filter(r => !ledger[r.key])) add({ ...r, ...entryFields, status: status(r) }, '取藥');
  const csv = '\uFEFF' + list.map(row => row.map(v => { let s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `ADC取藥結果_${day}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
});
window.addEventListener('beforeunload', e => { if (running) { e.preventDefault(); e.returnValue = ''; } });
chrome.tabs.onRemoved.addListener(id => { if (id === connectedTab) { connectedTab = null; drugs.clear(); $('connection').textContent = '頁面已關閉'; $('connection').className = 'badge muted'; if (!running) say('Portal 頁面已關閉，請重新開啟並連接。', true); render(); } });
chrome.tabs.onUpdated.addListener((id, change) => { if (id === connectedTab && change.status === 'loading' && !running) { connectedTab = null; drugs.clear(); $('connection').textContent = '請重新連接'; $('connection').className = 'badge muted'; render(); } });
async function init() {
  $('dateLabel').textContent = day;
  await loadLedger(); root = await folderStorage(); render();
  if (root) await scan();
  await connect(true);
}
$('open-managed').addEventListener('click',openManagement);
async function refreshManaged(){try{const s=await managedStatus();$('managed-status').textContent=(s.reason||('管理驗證正常 · v'+chrome.runtime.getManifest().version))+(s.updateAvailable?' · 有新版 v'+s.latestVersion:'');}catch(e){$('managed-status').textContent=e.message;}}
void refreshManaged();setInterval(refreshManaged,60000);
init().catch(e => say('初始化失敗：' + e.message, true));

