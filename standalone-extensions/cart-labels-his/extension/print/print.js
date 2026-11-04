// 院內列印元件（printDaemon）的版面在 Chrome 重畫並列印
// 座標單位依項目的 PrintUnit（實測 1 = 1/100 英吋），字型依 System.Drawing.Font（點）。
(async () => {
  const $ = id => document.getElementById(id);
  const AUTO_KEY = 'his-print-autoprint-v1';
  const warns = new Set();
  const diag = [];

  // ---------- 讀取工作 ----------
  const job = new URLSearchParams(location.search).get('job');
  const store = chrome.storage.session || chrome.storage.local;
  let data;
  if (job) { data = (await store.get(job))[job]; await store.remove(job); history.replaceState(null, '', location.pathname); }
  if (!data?.data) { $('info').textContent = '沒有列印資料（可能已讀取過）。請回 HIS 重新按列印。'; return; }

  // ---------- 解碼 ----------
  async function bytesOf(b64, compressed) {
    const raw = Uint8Array.from(atob(b64.replace(/\s+/g, '')), c => c.charCodeAt(0));
    if (!compressed) return raw;
    for (const fmt of ['gzip', 'deflate', 'deflate-raw']) {
      try { return new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream(fmt))).arrayBuffer()); } catch {}
    }
    throw new Error('無法解壓縮院內列印資料');
  }
  let root;
  try { root = parseNrbf(await bytesOf(data.data, data.compressed)).root; }
  catch (e) { $('info').textContent = '無法解讀院內列印資料：' + e.message; return; }

  // ---------- 工具 ----------
  const prop = (o, name) => {
    if (!o) return undefined;
    for (const k of [name, `_${name}`, `<${name}>k__BackingField`, `PrintPage+_${name}`, `PrintPage+<${name}>k__BackingField`]) if (k in o) return o[k];
    const hit = Object.keys(o).find(k => k.replace(/^.*\+/, '').replace(/^_|^<|>k__BackingField$/g, '').toLowerCase() === name.toLowerCase());
    return hit ? o[hit] : undefined;
  };
  const list = x => !x ? [] : Array.isArray(x) ? x.filter(v => v != null) : Array.isArray(x._items) ? x._items.slice(0, x._size ?? x._items.length).filter(v => v != null) : [];
  const enumVal = x => (x && typeof x === 'object' && 'value__' in x) ? x.value__ : (typeof x === 'number' ? x : undefined);
  const UNIT_MM = { 0: 0.254, 1: 0.254, 2: 25.4 / 96, 3: 25.4 / 72, 4: 25.4, 5: 25.4 / 300, 6: 1 };
  const PAPER = { A3: [297, 420], A4: [210, 297], A5: [148, 210], A6: [105, 148], B4: [257, 364], B5: [182, 257], LETTER: [215.9, 279.4], LEGAL: [215.9, 355.6] };
  const KNOWN = { 35: '#000', 164: '#fff', 141: '#f00', 37: '#00f', 79: '#008000', 77: '#808080', 76: '#808080' };
  function color(c) {
    if (!c || typeof c !== 'object') return '#000';
    if (c.knownColor && KNOWN[c.knownColor]) return KNOWN[c.knownColor];
    if (c.state & 2) { const v = c.value >>> 0; return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${((v >>> 24) & 255) / 255})`; }
    return '#000';
  }
  function fontCss(f) {
    if (!f || typeof f !== 'object') return { family: '"MingLiU","PMingLiU",serif', size: '9pt', style: 0 };
    const name = f.Name || 'MingLiU';
    const map = { MingLiU: '"MingLiU","細明體","PMingLiU","新細明體"', PMingLiU: '"PMingLiU","新細明體","MingLiU"', DFKai_SB: '"DFKai-SB","標楷體"', '標楷體': '"DFKai-SB","標楷體"' };
    const family = (map[name] || `"${name}"`) + ',"Noto Serif CJK TC",serif';
    const unit = enumVal(f.Unit) ?? 3;
    const size = f.Size || 9;
    const css = unit === 3 ? `${size}pt` : unit === 2 ? `${size}px` : `${size * (UNIT_MM[unit] || 0.3528)}mm`;
    return { family, size: css, style: enumVal(f.Style) || 0 };
  }

  // ---------- 組頁 ----------
  const pageObjs = [];
  if (list(prop(root, 'items')).length) pageObjs.push(root);
  for (const pg of list(prop(root, 'pages'))) pageObjs.push(pg);
  if (!pageObjs.length) pageObjs.push(root);

  const pagesEl = $('pages');
  let pageCount = 0, itemCount = 0;
  const pageSizes = [];
  for (const pg of pageObjs) {
    const paperName = String(prop(pg, 'PaperSizeName') || prop(root, 'PaperSizeName') || 'A4').toUpperCase().replace(/\s+/g, '');
    let [w, h] = PAPER[paperName] || (() => { const m = paperName.match(/(\d+(?:\.\d+)?)[X*](\d+(?:\.\d+)?)/); if (m) return [+m[1], +m[2]]; warns.add(`紙張「${paperName}」未知，先以 A4 顯示`); return PAPER.A4; })();
    const orient = enumVal(prop(pg, 'Orientation'));
    if (orient === 2) [w, h] = [h, w]; // 2 視為橫向（尚待實際資料確認）
    const copies = Math.max(1, Math.min(50, Number(prop(pg, 'copies')) || 1));
    const items = list(prop(pg, 'items'));
    const water = list(prop(pg, 'waterMarkWords'));
    if (water.length) warns.add('此頁有浮水印文字，目前未畫出：' + water.join('、'));
    diag.push(`頁：${prop(pg, 'Name') || '(無名稱)'}／${prop(pg, 'SystemName') || ''}　紙張 ${paperName}　方向值 ${orient}　份數 ${copies}　項目 ${items.length}`);

    const build = () => {
      const page = document.createElement('section');
      page.className = 'page';
      page.style.width = w + 'mm'; page.style.height = h + 'mm';
      let svg = null;
      for (const it of items) {
        const k = UNIT_MM[enumVal(it._unit)] ?? 0.254;
        const cls = (it.$class || '').replace(/^.*\./, '');
        const x = Number(prop(it, 'x')), y = Number(prop(it, 'y'));
        const text = prop(it, 'text');
        const img = Object.values(it).find(v => v && typeof v === 'object' && /Bitmap|Image/.test(v.$class || '') && Array.isArray(v.Data));
        const x1 = prop(it, 'x1'), y1 = prop(it, 'y1'), x2 = prop(it, 'x2'), y2 = prop(it, 'y2');
        if (img && Number.isFinite(x) && Number.isFinite(y)) {
          const el = document.createElement('img');
          el.src = URL.createObjectURL(new Blob([new Uint8Array(img.Data)]));
          el.style.left = x * k + 'mm'; el.style.top = y * k + 'mm';
          const iw = Number(prop(it, 'width')), ih = Number(prop(it, 'height'));
          if (iw) el.style.width = iw * k + 'mm'; if (ih) el.style.height = ih * k + 'mm';
          page.append(el); itemCount++;
        } else if (typeof text === 'string' && Number.isFinite(x) && Number.isFinite(y)) {
          const f = fontCss(prop(it, 'font'));
          const el = document.createElement('div');
          el.className = 't';
          el.textContent = text;
          el.style.left = x * k + 'mm'; el.style.top = y * k + 'mm';
          el.style.fontFamily = f.family; el.style.fontSize = f.size;
          if (f.style & 1) el.style.fontWeight = 'bold';
          if (f.style & 2) el.style.fontStyle = 'italic';
          if (f.style & 12) el.style.textDecoration = [(f.style & 4) && 'underline', (f.style & 8) && 'line-through'].filter(Boolean).join(' ');
          el.style.color = color(prop(it, 'color'));
          const o = enumVal(prop(it, 'orientation'));
          if (o) warns.add(`有文字方向值 ${o}（未旋轉）`);
          if (cls !== 'PrintText') warns.add(`項目「${cls}」以文字方式畫出，請核對`);
          page.append(el); itemCount++;
        } else if ([x1, y1, x2, y2].every(v => Number.isFinite(Number(v)))) {
          svg = svg || (() => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', w + 'mm'); s.setAttribute('height', h + 'mm'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); page.append(s); return s; })();
          const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          ln.setAttribute('x1', x1 * k); ln.setAttribute('y1', y1 * k); ln.setAttribute('x2', x2 * k); ln.setAttribute('y2', y2 * k);
          ln.setAttribute('stroke', color(prop(it, 'color'))); ln.setAttribute('stroke-width', (Number(prop(it, 'width')) || 1) * k * 0.5);
          svg.append(ln); itemCount++;
        } else {
          warns.add(`尚未支援的項目「${cls}」（欄位：${Object.keys(it).filter(k => !k.startsWith('$')).join(', ')}）`);
        }
      }
      return page;
    };
    for (let c = 0; c < copies; c++) { pagesEl.append(build()); pageCount++; }
    pageSizes.push(`${w}mm ${h}mm`);
  }

  // 所有頁面同尺寸時設定 @page；不同尺寸時以第一頁為準並提醒
  const uniq = [...new Set(pageSizes)];
  if (uniq.length > 1) warns.add('本次列印含不同紙張尺寸，Chrome 會以第一頁的尺寸列印');
  const st = document.createElement('style');
  st.textContent = `@page{size:${uniq[0] || '210mm 297mm'};margin:0}`;
  document.head.append(st);

  $('info').textContent = `${prop(pageObjs[0], 'Name') || prop(root, 'Name') || '院內列印'}｜${pageCount} 頁｜${itemCount} 個項目｜列印設定：實際大小 100%、邊界無`;
  if (warns.size) { $('warn').hidden = false; $('warn').innerHTML = '⚠ ' + [...warns].map(s => s.replace(/[<&]/g, c => ({ '<': '&lt;', '&': '&amp;' })[c])).join('<br>⚠ '); }
  $('diag').textContent = diag.join('\n');

  // ---------- 列印 ----------
  try { $('autoPrint').checked = localStorage.getItem(AUTO_KEY) !== '0'; } catch { $('autoPrint').checked = true; }
  $('autoPrint').onchange = () => { try { localStorage.setItem(AUTO_KEY, $('autoPrint').checked ? '1' : '0'); } catch {} };
  $('printBtn').onclick = () => window.print();
  if ($('autoPrint').checked && !warns.size) {
    await document.fonts.ready;
    setTimeout(() => window.print(), 300);
  }
})();
