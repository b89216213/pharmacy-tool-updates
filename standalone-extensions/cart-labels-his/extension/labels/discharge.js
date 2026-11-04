// 擴充功能：轉換前詢問是否排除「MM/DD可出院」的病人
// 已回答過的病人（同一份資料）不再重問；按「清除資料」後重新詢問。
const dischargeDecisions = new Map(); // label text -> true(排除) / false(保留)
const DISCHARGE_PRESET_KEY = 'cart-label-discharge-preset-v1';

function taiwanToday() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day };
}
// 「10/06可出院」→ 與今天相差幾天（跨年自動調整）
function dischargeOffset(note) {
  const m = note.match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const t = taiwanToday();
  const today = Date.UTC(t.y, t.m - 1, t.d);
  let best = null;
  for (const y of [t.y - 1, t.y, t.y + 1]) {
    const diff = Math.round((Date.UTC(y, +m[1] - 1, +m[2]) - today) / 86400000);
    if (best === null || Math.abs(diff) < Math.abs(best)) best = diff;
  }
  return best;
}
function dischargeWhen(offset) {
  return offset === 0 ? '今天' : offset === 1 ? '明天' : offset === -1 ? '昨天' : offset > 0 ? `${offset} 天後` : `${-offset} 天前`;
}

// 只處理「今天」可出院的病人。模式（⚙ 設定）：ask 先詢問／auto 自動不印／off 照常印
const DISCHARGE_MODE_KEY = 'cart-label-discharge-mode-v1';
function dischargeMode() { const v = $('dischargeMode')?.value; return ['ask', 'auto', 'off'].includes(v) ? v : 'ask'; }
async function chooseDischarge(text) {
  labelNotes.clear();
  let labels;
  try { labels = extractLabels(text, true).labels; } catch { return new Set(); } // 資料有誤時交給原本流程顯示錯誤
  const mode = dischargeMode();
  if (mode === 'off') return new Set();
  const candidates = labels.filter(l => labelNotes.has(l) && dischargeOffset(labelNotes.get(l)) === 0);
  const pending = candidates.filter(l => !dischargeDecisions.has(l));
  if (pending.length) {
    if (mode === 'auto') pending.forEach(l => dischargeDecisions.set(l, true));
    else {
      const answer = await askDischarge(candidates);
      if (answer === null) return null;
      candidates.forEach(l => dischargeDecisions.set(l, answer.has(l)));
    }
  }
  return new Set(candidates.filter(l => dischargeDecisions.get(l)));
}
(function initDischargeMode() {
  try { const v = localStorage.getItem(DISCHARGE_MODE_KEY); if (v && $('dischargeMode')) $('dischargeMode').value = v; } catch {}
  $('dischargeMode')?.addEventListener('change', () => {
    try { localStorage.setItem(DISCHARGE_MODE_KEY, $('dischargeMode').value); } catch {}
    dischargeDecisions.clear();
    if ($('source').value.trim()) convert();
  });
})();

function askDischarge(candidates) {
  return new Promise(resolve => {
    const dialog = $('dischargeDialog');
    const list = $('dischargeList');
    list.replaceChildren();
    const rows = candidates.map(label => {
      const { ward, bed, lines } = labelBed(label);
      const note = labelNotes.get(label), offset = dischargeOffset(note);
      const row = document.createElement('label');
      row.className = 'duplicate-row';
      const check = document.createElement('input');
      check.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = `${ward}　${bed}　${lines[1] || ''}　${note}${offset === null ? '' : '（' + dischargeWhen(offset) + '）'}`;
      row.append(check, span);
      list.append(row);
      return { label, offset, check };
    });
    rows.forEach(r => { const known = dischargeDecisions.get(r.label); r.check.checked = known !== undefined ? known : true; });
    $('dischargeSummary').textContent = `有 ${candidates.length} 位病人今日可出院。勾選的病人不印標籤${$('useBedPresets').checked ? '，床位改印空床並標示「今日可出院」' : ''}。`;
    const finish = value => { dialog.oncancel = null; dialog.close(); resolve(value); };
    $('dischargeCancel').onclick = () => finish(null);
    $('dischargeKeep').onclick = () => finish(new Set());
    $('dischargeContinue').onclick = () => finish(new Set(rows.filter(r => r.check.checked).map(r => r.label)));
    dialog.oncancel = e => { e.preventDefault(); finish(null); };
    dialog.showModal();
  });
}
