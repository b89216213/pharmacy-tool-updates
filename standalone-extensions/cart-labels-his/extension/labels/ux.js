// 擴充功能：簡化介面
// 1. 設定移到「⚙ 設定」視窗  2. 可讀的病人名單（可移除／復原）  3. 摘要與提醒卡
// 4. 預覽下方列印按鈕與不能列印的原因  5. 點格子選起印位置
const manualRemoved = new Set();

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.filter(c => c != null && c !== false));
  return node;
}
const patientCount = () => records.filter(t => !isVacantLabel(t)).length;
const vacantCount = () => records.filter(isVacantLabel).length;

// ---------- 1. 設定視窗 ----------
$('openSettings').onclick = () => $('settingsDialog').showModal();
$('closeSettings').onclick = () => $('settingsDialog').close();
function openSettingsAt(id) {
  $('settingsDialog').showModal();
  const target = $(id);
  if (target?.tagName === 'DETAILS') target.open = true;
  target?.scrollIntoView({ block: 'start' });
}

// ---------- 2. 病人名單 ----------
function renderPatientList() {
  const box = $('patientList');
  box.replaceChildren();
  if (!records.length && !lastExcluded.length) return;
  const groups = new Map();
  for (const text of records) {
    const { ward } = labelBed(text);
    if (!groups.has(ward)) groups.set(ward, []);
    groups.get(ward).push(text);
  }
  for (const [ward, items] of groups) {
    const n = items.filter(t => !isVacantLabel(t)).length, v = items.length - n;
    const list = el('ul', { class: 'pl-items' });
    for (const text of items) {
      const { bed, lines } = labelBed(text);
      if (isVacantLabel(text)) {
        const note = vacantCaptions.get(wardKey(ward) + '|' + bedKey(bed));
        list.append(el('li', { class: 'pl-row vacant' + (note ? ' noted' : '') }, el('span', { class: 'pl-bed' }, bed), el('span', { class: 'pl-name' }, note ? `空床（${note}）` : '空床')));
        continue;
      }
      list.append(el('li', { class: 'pl-row' },
        el('span', { class: 'pl-bed' }, bed || '—'),
        el('span', { class: 'pl-name' }, lines[1] || ''),
        el('span', { class: 'pl-id' }, lines[2] || ''),
        el('button', { class: 'pl-x', title: '這位不印', 'aria-label': `移除 ${lines[1] || ''}`, onclick: () => { manualRemoved.add(text); convert(); } }, '✕')));
    }
    box.append(el('details', { class: 'pl-ward', open: true },
      el('summary', {}, el('b', {}, ward), el('span', {}, `${n} 位${v ? '・空床 ' + v : ''}${typeof copiesFor === 'function' && copiesFor(ward) > 1 ? '・每床 ' + copiesFor(ward) + ' 張' : ''}`)), list));
  }
  if (lastExcluded.length) {
    const list = el('ul', { class: 'pl-items' });
    for (const text of lastExcluded) {
      const { ward, bed, lines } = labelBed(text);
      const why = manualRemoved.has(text) ? '手動移除' : (labelNotes.get(text) || '出院');
      list.append(el('li', { class: 'pl-row removed' },
        el('span', { class: 'pl-bed' }, `${ward} ${bed}`),
        el('span', { class: 'pl-name' }, lines[1] || ''),
        el('span', { class: 'pl-id' }, why),
        el('button', { class: 'pl-undo', onclick: () => { manualRemoved.delete(text); if (typeof dischargeDecisions !== 'undefined') dischargeDecisions.set(text, false); convert(); } }, '復原')));
    }
    box.append(el('details', { class: 'pl-ward pl-excluded' }, el('summary', {}, el('b', {}, '不印'), el('span', {}, `${lastExcluded.length} 位`)), list));
  }
}

// ---------- 3. 摘要與提醒 ----------
function renderSummary() {
  const box = $('summary');
  box.replaceChildren();
  if (!records.length && !lastExcluded.length) return;
  const stat = (n, label, cls = '') => el('div', { class: 'stat ' + cls }, el('strong', {}, String(n)), el('span', {}, label));
  box.append(stat(patientCount(), '位病人'), stat(vacantCount(), '張空床', 'muted'), stat(lastExcluded.length, '位不印', lastExcluded.length ? 'warn' : 'muted'), stat(pageCount(), '頁'));
}
function renderAlerts() {
  const box = $('alerts');
  box.replaceChildren();
  const add = (kind, text, ...buttons) => box.append(el('div', { class: 'alert ' + kind, role: kind === 'error' ? 'alert' : 'status' }, el('p', {}, text), buttons.length ? el('div', { class: 'alert-actions' }, ...buttons) : null));
  const btn = (label, onclick, primary) => el('button', { class: primary ? 'primary' : '', onclick }, label);
  if (!globalThis.LabelWorkspace && typeof autoSummary !== 'undefined' && autoSummary?.length) {
    const parts = autoSummary.map(r => r.error ? `${r.ward}：✕ ${r.error}` : `${r.ward}：${r.total ? r.count + ' 位' : '無病人'}${r.missing ? `（${r.missing} 位未擷取${r.missingBeds?.length ? '：' + r.missingBeds.join('、') + '，請手動補印' : ''}）` : ''}`);
    const bad = autoSummary.some(r => r.error || r.missing);
    add(bad ? 'warn' : 'info', '自動抓取結果　' + parts.join('、'), btn('知道了', () => { autoSummary = null; renderAlerts(); }));
  }
  if (document.body.classList.contains('dirty') && $('source').value.trim())
    add('info', '資料已變更，預覽還沒更新。', btn('更新預覽', () => convert(), true));
  const err = $('layoutError').textContent.trim();
  if (err) add('error', err, btn('開啟版面設定', () => openSettingsAt('layoutFold')));

}

// ---------- 4. 列印按鈕 ----------
function renderPrintBar() {
  const disabled = $('print').disabled;
  const pages = pageCount();
  $('printMain').disabled = disabled;
  $('printMain').textContent = pages ? `列印 ${pages} 頁` : '列印';
  let reason = '';
  if (!records.length) reason = '尚無標籤：請在 HIS 勾選病人並按「列印病人標籤」。';
  else if (document.body.classList.contains('dirty')) reason = '資料已變更，請先按「更新預覽」。';
  else if ($('layoutError').textContent.trim()) reason = '版面尺寸有問題，請看提醒。';
  else if (disabled) reason = '目前無法列印。';
  else reason = '';
  $('printReason').textContent = reason;
  $('printReason').classList.toggle('blocked', disabled);
}
$('printMain').onclick = () => $('print').click();

// ---------- 5. 起印位置：直接點預覽中的格子（目前顯示的那一頁） ----------
function setStart(r, c) {
  $('startRow').value = String(r);
  $('startCol').value = String(c);
  $('startCol').dispatchEvent(new Event('change'));
}
$('pages').addEventListener('click', e => {
  const label = e.target.closest('.label');
  const sheet = label?.parentElement;
  if (!label || !sheet?.classList.contains('active')) return;
  const cell = [...sheet.querySelectorAll(':scope > .label')].indexOf(label);
  if (cell >= 0) setStart(Math.floor(cell / 5) + 1, cell % 5 + 1);
});
function renderStartGrid() { $('startReset').hidden = startOffset() === 0; }
$('startReset').onclick = () => setStart(1, 1);
// 預覽上方的 QR Code 開關，與 ⚙ 設定裡的「加入病歷號 QR Code」同步
function syncQrBar() { $('qrEnabledBar').checked = $('qrEnabled').checked; }
$('qrEnabledBar').addEventListener('change', () => { $('qrEnabled').checked = $('qrEnabledBar').checked; $('qrEnabled').dispatchEvent(new Event('change')); });
$('qrEnabled').addEventListener('change', syncQrBar);
syncQrBar();

// ---------- 整體更新 ----------
function afterRender() {
  renderSummary();
  renderAlerts();
  renderPatientList();
  renderPrintBar();
  renderStartGrid();
  if (!$('source').value.trim()) $('rawFold').open = false;
}
// markDirty() 不經過 render，另外監看狀態變化
new MutationObserver(() => { renderPrintBar(); renderAlerts(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
new MutationObserver(() => renderPrintBar()).observe($('print'), { attributes: true, attributeFilter: ['disabled'] });
// 原「版面微調」區塊加上 id 供提醒卡跳轉
document.querySelectorAll('#settingsDialog details > summary').forEach(s => { if (s.textContent.trim() === '版面微調') s.parentElement.id = 'layoutFold'; });

afterRender();
