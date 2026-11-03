export const OMIT_DRUG = 'MOD4IA33';
export function todayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = t => parts.find(p => p.type === t).value;
  return get('year') + get('month') + get('day');
}
export function bedName(device) { return device.toUpperCase().replace(/^0+(?=\d)/, ''); }
export function classifyFile(name, day) {
  if (name.startsWith('~$')) return { include: false, reason: 'Excel 暫存檔' };
  const m = /^([0-9A-Za-z-]+)_補藥報表_(\d{8})-(\d{6})\.xlsx$/i.exec(name);
  if (!m) return { include: false, reason: '非補藥明細' };
  if (m[2] !== day) return { include: false, reason: '檔名日期非今日' };
  if (!m[3].startsWith('134')) return { include: false, reason: '時間碼非 134 開頭' };
  if (+m[3].slice(2, 4) > 59 || +m[3].slice(4) > 59) return { include: false, reason: '時間碼格式異常' };
  return { include: true, device: m[1].toUpperCase(), bed: bedName(m[1]), day, time: m[3] };
}
export function parseReport(sheets, meta, fileName) {
  const required = ['八碼', '藥名', '分揀量', '分揀區', '藥屜'];
  const candidates = [];
  for (const sh of sheets) for (let i = 0; i < Math.min(sh.rows.length, 10); i++) {
    if (required.every(h => sh.rows[i].values.includes(h))) candidates.push({ sh, i });
  }
  if (candidates.length !== 1) throw new Error('無法唯一辨識補藥報表欄位');
  const { sh, i } = candidates[0], header = sh.rows[i].values;
  const records = [];
  for (const row of sh.rows.slice(i + 1)) {
    const get = h => row.values[header.indexOf(h)] ?? '';
    const code = get('八碼').toUpperCase(), quantity = get('分揀量'), name = get('藥名');
    if (!code && !quantity && !name) continue;
    if (!/^[A-Z0-9 ]{8}$/.test(code) || !name) throw new Error(`第 ${row.number} 列藥碼／藥名不完整`);
    if (!/^\d+$/.test(quantity) || +quantity > 99999) throw new Error(`第 ${row.number} 列分揀量不是有效整數`);
    if (get('分揀區') !== '管藥台') throw new Error(`第 ${row.number} 列分揀區不是管藥台`);
    records.push({ ...meta, code, name, quantity: +quantity, fileName, sourceRow: row.number, drawer: get('藥屜') });
  }
  return records;
}
export function aggregate(records) {
  const groups = new Map(), sourceCells = new Set();
  for (const row of records) {
    // Bed aliases (03E2/3E2) must not evade duplicate protection.
    const key = `${row.day}|T02|${row.bed}|${row.code}`;
    const cellKey = `${row.day}|${row.bed}|${row.drawer}`;
    if (sourceCells.has(cellKey)) throw new Error(`${row.device} 有重複藥格，請確認報表未重複匯入`);
    sourceCells.add(cellKey);
    let g = groups.get(key);
    if (!g) {
      const excluded = ['3E2', '3W2'].includes(row.bed) && row.code === OMIT_DRUG;
      g = { key, day: row.day, device: row.device, bed: row.bed, code: row.code, name: row.name, quantity: 0,
        selected: !excluded, defaultExcluded: excluded, sources: [] };
      groups.set(key, g);
    }
    if (g.name !== row.name) throw new Error(`${row.device} 同藥碼名稱不一致`);
    g.quantity += row.quantity; g.sources.push({ fileName: row.fileName, row: row.sourceRow, quantity: row.quantity, drawer: row.drawer });
    if (g.quantity > 99999) throw new Error(`${row.device} 合併後數量超過 Portal 欄位限制`);
  }
  return [...groups.values()].filter(g => g.quantity > 0).sort((a, b) =>
    a.code.localeCompare(b.code) || a.bed.localeCompare(b.bed, 'en', { numeric: true }));
}
export function protectedStatus(entry) { return ['done', 'sending', 'unknown'].includes(entry?.status); }

