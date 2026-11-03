/* Pure validation shared by the page controller and offline tests. */
((root) => {
  'use strict';
  const norm = v => String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  function grade(label) {
    const m = norm(label).match(/\(\s*管\s*([1-4])\s*\)/);
    return m ? Number(m[1]) : null;
  }
  function amount(value) {
    const s = String(value ?? '').trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(s)) throw new Error('藥帳數量不是完整的非負整數：' + s);
    const n = Number(s.replace(/,/g, ''));
    if (!Number.isSafeInteger(n) || n > 99999) throw new Error('藥帳數量超出盤點欄位範圍');
    return n;
  }
  function taipei(now = new Date()) {
    const d = new Date(now.getTime() + 8 * 3600000);
    const pad = n => String(n).padStart(2, '0');
    return { date: `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`, hour: d.getUTCHours() };
  }
  function reportChoice(date, hour, now = new Date()) {
    const t = taipei(now);
    const normalizedDate = String(date || '').replace(/-/g, '/');
    if (normalizedDate === t.date && Number.isInteger(hour) && hour > t.hour && hour < 24) return { date: t.date, hour, reuse: true };
    if (t.hour >= 23) throw new Error('今天已沒有晚於現在的整點報表（Portal 最晚為 23:00），本次不送出。');
    return { date: t.date, hour: t.hour + 1, reuse: false };
  }
  function selected(rows, maxGrade) {
    if (![2, 3].includes(maxGrade)) throw new Error('請選擇管1＋管2或管1＋管2＋管3');
    const out = [], names = new Set();
    for (const r of rows) {
      const g = grade(r.label);
      if (!g || g > maxGrade) continue;
      const name = norm(r.label);
      if (names.has(name)) throw new Error('報表藥名重複，無法唯一對應：' + name);
      names.add(name); out.push({ label: String(r.label).trim(), amount: amount(r.amount), grade: g });
    }
    if (!out.length) throw new Error('報表沒有選定分級的品項');
    return out;
  }
  function match(report, inventory, pharmacy, maxGrade) {
    const source = selected(report, maxGrade);
    const targets = inventory.filter(r => grade(r.label) && grade(r.label) <= maxGrade);
    const byLabel = new Map(), codes = new Set();
    for (const r of targets) {
      const key = norm(r.label);
      if (byLabel.has(key) || codes.has(r.code)) throw new Error('盤點頁有重複藥名或藥碼');
      if (r.pharmacy !== pharmacy || !/^[A-Z0-9 ]{8}$/.test(r.code)) throw new Error('盤點頁藥局或藥碼不符');
      if (!r.unit || r.factor !== 1 || r.group || r.subItem) throw new Error('此品項涉及單位換算或群組，請人工盤點：' + r.label);
      byLabel.set(key, r); codes.add(r.code);
    }
    const jobs = source.map(r => {
      const dest = byLabel.get(norm(r.label));
      if (!dest) throw new Error('盤點頁找不到完整對應藥名：' + r.label);
      byLabel.delete(norm(r.label));
      return { ...r, code: dest.code, pharmacy, unit: dest.unit, status: 'pending' };
    });
    if (byLabel.size) throw new Error('報表缺少盤點品項：' + [...byLabel.values()][0].label);
    return jobs;
  }
  function assertRecord(r, job) {
    if (!r || r.PharmacyCode !== job.pharmacy || r.DrugCode !== job.code ||
      r.AmountUnit !== job.unit || amount(r.CountingAmount) !== job.amount ||
      r.InputAmount === null || r.InputAmount === '' || Number(r.InputAmount) !== 0 ||
      r.Remark !== '盤點' || r.Inconsistent || r.GroupCode ||
      Number(r.ConsumeAmount || 0) !== 0 || Number(r.ReturnAmount || 0) !== 0 ||
      [r.ChartNo, r.Accountidse, r.Bedidse, r.PrescriptionNumber].some(v => v != null && v !== '')) {
      throw new Error('Portal 資料與擷取的藥帳不一致：' + job.label);
    }
  }
  const api = { norm, grade, amount, taipei, reportChoice, selected, match, assertRecord };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PortalInventoryCore = api;
})(globalThis);

