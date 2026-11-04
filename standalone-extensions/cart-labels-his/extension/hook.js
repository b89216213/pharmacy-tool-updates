// 頁面主環境：院內列印元件（IE 專用 printDaemon）在 Chrome 無法載入。
// v2.4：不再自動載入；只在按下院內「列印病人標籤」或執行自動抓取時由 arm.js 放進頁面。
// v2.3.2：改由共用 his-print-bus.js 攔截，可與「HIS 院內列印」擴充並存。
// v1.5：接住院內「列印病人標籤」送出的資料（.NET 序列化的 A4LabelPrint），
//       解析出 病房-病室-病床、姓名、病歷號、生日，交給擴充功能轉成藥車標籤。
(() => {
  const TAG = '[藥車標籤]';
  const show = v => { try { return typeof v === 'string' ? (v.length > 200 ? v.slice(0, 200) + '…（' + v.length + ' 字）' : v) : JSON.stringify(v); } catch { return String(v); } };
  const log = (where, args) => console.log(TAG, '院內列印呼叫', where, args.map(show).join(' | '));

  // ---------- 解析 BinaryFormatter 內的 PrintText（文字 + x + y） ----------
  const allStrings = new Set(); // 最近一次解析出的所有字串（用來辨認版面名稱 A4LabelPrint）
  function readVarint(b, i) {
    let n = 0, shift = 0, c;
    do { c = b[i++]; n |= (c & 0x7f) << shift; shift += 7; } while (c & 0x80 && shift < 35);
    return [n, i];
  }
  function parseTexts(b64) {
    const bin = atob(b64.replace(/\s+/g, ''));
    const b = Uint8Array.from(bin, c => c.charCodeAt(0));
    const dv = new DataView(b.buffer);
    const dec = new TextDecoder('utf-8', { fatal: true });
    const strings = new Map(), items = [];
    allStrings.clear();
    const floatsAt = i => {
      if (i + 8 > b.length) return null;
      const x = dv.getFloat32(i, true), y = dv.getFloat32(i + 4, true);
      return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x < 5000 && y < 10000 ? [x, y] : null;
    };
    for (let i = 0; i < b.length - 6; i++) {
      if (b[i] === 0x06) { // BinaryObjectString: id(int32) + 長度前綴字串
        const id = dv.getInt32(i + 1, true);
        const [len, s] = readVarint(b, i + 5);
        if (len <= 0 || len > 400 || s + len > b.length) continue;
        let text; try { text = dec.decode(b.subarray(s, s + len)); } catch { continue; }
        strings.set(id, text);
        allStrings.add(text);
        const xy = floatsAt(s + len);
        if (xy) items.push({ text, x: xy[0], y: xy[1] });
        i = s + len - 1;
      } else if (b[i] === 0x09) { // MemberReference：重複出現的字串
        const id = dv.getInt32(i + 1, true);
        if (!strings.has(id)) continue;
        const xy = floatsAt(i + 5);
        if (xy) { items.push({ text: strings.get(id), x: xy[0], y: xy[1] }); i += 12; }
      }
    }
    return items;
  }
  // 依文字樣式組成病人：姓名+病歷號、生日、病房-病室-病床
  // 院內標籤第一行姓名欄寬有限：較長的姓名（「王OO之男」、英文姓名）多出來的字會接在第二行生日前面，
  // 例如「之男 2026/09/20」→ 接回姓名、取出生日。
  const joinName = (a, b) => /[\u3400-\u9fff]$/.test(a) || /^[\u3400-\u9fff]/.test(b) ? a + b : a + ' ' + b;
  // 診斷用遮蔽：中文→○、數字→9、英文→X（不留病人資料）
  const mask = t => String(t).replace(/[\u3400-\u9fff]/g, '○').replace(/[0-9]/g, '9').replace(/[A-Za-z]/g, 'X');
  function toPatients(items) {
    const NAME_CHART = /^(.*?)\s*([0-9]{6,8})$/, DATE = /^\d{4}\/\d{1,2}\/\d{1,2}$/, BED = /^(.+)-([A-Za-z0-9]+)-([A-Za-z0-9]+)$/;
    // 生日：2026/09/20 或 20260920，前面可能接著姓名多出的字（例如「之男 2026/09/20」）
    const DATE_TAIL = /^(.*?)\s*(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})$/, DATE8_TAIL = /^(.*?)\s*((?:19|20)\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/;
    // 依資料順序：遇到「姓名+病歷號」開新標籤，其後位置相近的生日、床號歸到這張（跨頁時 y 會重新起算，不能排序）
    const labels = [];
    let cur = null;
    for (const it of items) {
      const t = it.text.trim();
      const near = cur && Math.abs(it.x - cur.x) <= 40 && it.y > cur.y && it.y - cur.y < 80;
      if (cur && Math.abs(it.x - cur.x) <= 200 && it.y >= cur.y && it.y - cur.y < 80 && it !== cur.item) cur.around.push(`${mask(t)}@${Math.round(it.x - cur.x)},${Math.round(it.y - cur.y)}`);
      const dm = near && !cur.birthday ? t.match(DATE_TAIL) : null;
      const d8 = near && !cur.birthday && !dm ? t.match(DATE8_TAIL) : null;
      if (dm) { cur.birthday = dm[2]; if (dm[1].trim()) cur.nameRest = cur.nameRest ? joinName(cur.nameRest, dm[1].trim()) : dm[1].trim(); }
      else if (d8) { cur.birthday = `${d8[2]}/${d8[3]}/${d8[4]}`; if (d8[1].trim()) cur.nameRest = cur.nameRest ? joinName(cur.nameRest, d8[1].trim()) : d8[1].trim(); }
      else if (NAME_CHART.test(t) && !DATE.test(t)) { cur = { x: it.x, y: it.y, nameChart: t, item: it, around: [] }; labels.push(cur); }
      else if (near && BED.test(t)) cur.bed = t;
      // 姓名多出的字單獨一段（沒有和生日寫在一起）
      else if (near && !cur.birthday && !cur.bed && /^[\u3400-\u9fffA-Za-z][^0-9]{0,30}$/.test(t)) cur.nameRest = cur.nameRest ? joinName(cur.nameRest, t) : t;
    }
    const noBirthday = labels.filter(l => l.bed && !l.birthday);
    if (noBirthday.length) console.warn(TAG, `${noBirthday.length} 張標籤沒有讀到生日。版面（已遮蔽，可貼給開發者）：\n` + noBirthday.slice(0, 3).map(l => `${mask(l.nameChart)} ｜ ${l.around.join(' ｜ ')}`).join('\n'));
    const seen = new Set(), patients = [];
    for (const l of labels) {
      if (!l.bed) continue; // 病人標籤必須有床號（新生兒等可能沒有生日）
      const [, first, chart] = l.nameChart.match(NAME_CHART);
      const name = l.nameRest ? joinName(first.trim(), l.nameRest) : first;
      const bm = (l.bed || '').match(BED);
      const key = chart + '|' + (l.bed || '');
      if (seen.has(key)) continue; // 同一病人重複的格子只取一張
      seen.add(key);
      patients.push({ name: name.trim(), chart, birthday: l.birthday || '', ward: bm ? bm[1] : '', room: bm ? bm[2] : '', bed: bm ? bm[3] : '' });
    }
    return patients;
  }
  window.__cartLabelParse = b64 => toPatients(parseTexts(b64)); // 供除錯
  window.__cartLabelToPatients = toPatients; // 供測試

  // ---------- 接收院內列印資料（由共用的 his-print-bus.js 攔截） ----------
  document.addEventListener('his-print-call', e => {
    try { const c = JSON.parse(e.detail); console.log(TAG, '院內列印呼叫', `${c.obj}.${c.method}`, c.args.join(', ')); } catch {}
  });
  document.addEventListener('his-print-data', e => {
    let job; try { job = JSON.parse(e.detail); } catch { return; }
    if (job.compressed) { console.warn(TAG, '院內資料為壓縮格式，藥車標籤不處理'); return; }
    let patients = [], isLabel = false;
    try {
      const items = parseTexts(job.data);
      // 只有「列印病人標籤」的版面（A4LabelPrint）才當作病人標籤
      isLabel = allStrings.has('A4LabelPrint');
      if (isLabel) patients = toPatients(items);
    } catch (err) { console.warn(TAG, '解析院內列印資料失敗', err); }
    console.log(TAG, `院內列印資料：${patients.length ? patients.length + ' 位病人標籤' : isLabel ? '病人標籤版面，但沒有讀到病人' : '不是病人標籤，略過'}`);
    if (isLabel) document.dispatchEvent(new CustomEvent('cartlabel-capture', { detail: JSON.stringify(patients) }));
  });
  // ASP.NET AJAX：每次局部更新完成時通知擴充功能（自動抓取用來判斷查詢、列印是否完成）
  let prmHooked = false;
  function hookPrm() {
    if (prmHooked) return;
    try {
      const prm = window.Sys?.WebForms?.PageRequestManager?.getInstance?.();
      if (!prm) return;
      prm.add_endRequest((sender, args) => {
        const err = args?.get_error?.();
        document.dispatchEvent(new CustomEvent('cartlabel-endrequest', { detail: err ? String(err.message || err) : '' }));
      });
      prmHooked = true;
    } catch {}
  }
  let mo = null;
  const scan = () => { hookPrm(); if (prmHooked && mo) { mo.disconnect(); mo = null; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.addEventListener('load', scan);
  if (!prmHooked) { mo = new MutationObserver(scan); mo.observe(document.documentElement, { childList: true, subtree: true }); }
  document.documentElement.setAttribute('data-cartlabel-armed', '1');
})();
