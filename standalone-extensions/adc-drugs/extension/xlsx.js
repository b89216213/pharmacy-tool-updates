// Read-only XLSX reader. Uses Chrome's native ZIP decompression and XML parser.
const MAX = 24 * 1024 * 1024;
function xml(bytes) {
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Excel XML 格式不完整');
  return doc;
}
function all(node, tag) { return Array.from(node.getElementsByTagNameNS('*', tag)); }
function first(node, tag) { return all(node, tag)[0]; }
function texts(node) { return all(node, 't').map(n => n.textContent).join(''); }
export async function readXlsx(buffer) {
  if (buffer.byteLength > MAX) throw new Error('報表超過 24 MB，請確認檔案');
  const view = new DataView(buffer), bytes = new Uint8Array(buffer);
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) {
    if (view.getUint32(p, true) === 0x06054b50 && p + 22 + view.getUint16(p + 20, true) === bytes.length) { end = p; break; }
  }
  if (end < 0) throw new Error('不是有效的 .xlsx 檔案');
  const count = view.getUint16(end + 10, true);
  let p = view.getUint32(end + 16, true), total = 0;
  if (count > 4000 || count === 65535 || view.getUint16(end + 4, true)) throw new Error('不支援此 Excel 封裝格式');
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (p + 46 > end || view.getUint32(p, true) !== 0x02014b50) throw new Error('Excel 目錄損毀');
    const flags = view.getUint16(p + 8, true), method = view.getUint16(p + 10, true);
    const compressed = view.getUint32(p + 20, true), size = view.getUint32(p + 24, true);
    const n = view.getUint16(p + 28, true), extra = view.getUint16(p + 30, true), comment = view.getUint16(p + 32, true);
    const offset = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + n));
    total += size;
    if (size > MAX || total > MAX * 3 || flags & 1 || ![0, 8].includes(method)) throw new Error('Excel 過大、已加密或壓縮格式不支援');
    if (entries.has(name)) throw new Error('Excel 內有重複檔案');
    entries.set(name, { offset, compressed, size, method });
    p += 46 + n + extra + comment;
  }
  async function read(name, optional = false) {
    const e = entries.get(name);
    if (!e) { if (optional) return null; throw new Error('Excel 缺少 ' + name); }
    const o = e.offset;
    if (o + 30 > bytes.length || view.getUint32(o, true) !== 0x04034b50) throw new Error('Excel 資料區損毀');
    const start = o + 30 + view.getUint16(o + 26, true) + view.getUint16(o + 28, true);
    if (start + e.compressed > bytes.length) throw new Error('Excel 資料截斷');
    const compressed = bytes.slice(start, start + e.compressed);
    let result = compressed;
    if (e.method === 8) {
      const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const chunks = []; let length = 0;
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > e.size || length > MAX) { await reader.cancel(); throw new Error('Excel 解壓大小異常'); }
        chunks.push(value);
      }
      result = new Uint8Array(length); let at = 0;
      for (const c of chunks) { result.set(c, at); at += c.length; }
    }
    if (result.length !== e.size) throw new Error('Excel 資料長度不符');
    return xml(result);
  }
  const shared = await read('xl/sharedStrings.xml', true);
  const strings = shared ? all(shared, 'si').map(texts) : [];
  const workbook = await read('xl/workbook.xml');
  const rels = await read('xl/_rels/workbook.xml.rels');
  const paths = new Map(all(rels, 'Relationship').map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
  const sheets = [];
  for (const sh of all(workbook, 'sheet')) {
    const rid = sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sh.getAttribute('r:id');
    const target = paths.get(rid);
    if (!target) throw new Error('Excel 工作表連結遺失');
    const path = new URL(target, 'https://xlsx.local/xl/').pathname.slice(1);
    const doc = await read(path), rows = [];
    for (const row of all(doc, 'row')) {
      const values = [];
      for (const c of all(row, 'c')) {
        const letters = (c.getAttribute('r') || '').match(/^[A-Z]+/);
        if (!letters) throw new Error('Excel 儲存格位置無效');
        let col = 0; for (const ch of letters[0]) col = col * 26 + ch.charCodeAt(0) - 64;
        if (col > 512) throw new Error('報表欄數超過預期');
        const t = c.getAttribute('t'), raw = first(c, 'v')?.textContent ?? '';
        if (first(c, 'f')) throw new Error('補藥報表含公式，請先匯出純資料報表');
        let value = t === 'inlineStr' ? texts(c) : t === 's' ? strings[Number(raw)] : raw;
        if (t === 'e' || value === undefined) throw new Error('Excel 儲存格有錯誤值');
        values[col - 1] = String(value).trim();
      }
      if (values.some(v => v !== '')) rows.push({ number: Number(row.getAttribute('r')), values });
    }
    sheets.push({ name: sh.getAttribute('name'), rows });
  }
  return sheets;
}

