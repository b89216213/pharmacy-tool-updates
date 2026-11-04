// 擴充功能：標籤 QR Code（病歷號；帳號版標籤則為帳號）
const QR_KEY = 'cart-label-qr-v1';
const qrCache = new Map();

// 供 app.js render() 使用；未啟用時回傳 null
function qrOptions() {
  if (!$('qrEnabled').checked || !$('qrSize').checkValidity() || !$('qrSize').value) return null;
  const pos = ['beside', 'left', 'right'].includes($('qrPos').value) ? $('qrPos').value : 'beside';
  return { size: Number($('qrSize').value), pos };
}
function qrValueOf(lines) {
  // 第三行中第一個像病歷號／帳號的字串（樣式 E 前面有「病」小標籤）
  return (lines[2] || '').trim().split(/\s+/).find(t => /^[0-9A-Z]{6,}$/i.test(t)) || '';
}
// 讓 fitLabelLines 以扣掉 QR 後的寬度計算字級
function qrFitSettings(s, opt) {
  return { ...s, width: Math.max(4, s.width - (opt.size + 1.5) + 7.2 * 25.4 / 96) };
}
function qrSvg(value) {
  let path = qrCache.get(value), n;
  if (!path) {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    path = { d, n };
    qrCache.set(value, path);
  }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'qr');
  svg.setAttribute('viewBox', `0 0 ${path.n} ${path.n}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-label', 'QR ' + value);
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', path.d);
  p.setAttribute('fill', '#000');
  svg.append(p);
  return svg;
}
function decorateQr(el, lines, opt, s) {
  const value = qrValueOf(lines);
  if (!value) return;
  const size = Math.min(opt.size, s.height - 0.5);
  el.classList.add('has-qr', 'qr-' + opt.pos);
  el.style.setProperty('--qr', size + 'mm');
  el.append(qrSvg(value));
}

// 套用 QR 並回傳各行字級；無 QR 內容時回傳 null
// beside：QR 在第 1、2 行（床號、姓名）右側，第 3 行（病歷號、生日）橫跨整張標籤寬度
function qrApply(el, content, lines, s, opt, family) {
  const value = qrValueOf(lines);
  if (!value) return null;
  if (opt.pos !== 'beside') {
    decorateQr(el, lines, opt, s);
    return fitLabelLines(lines, qrFitSettings(s, opt), family);
  }
  const pxPerMm = 96 / 25.4;
  const full = fitLabelLines(lines, s, family);
  const bottom = full.slice(2).reduce((n, l) => n + l.lineHeight * (l.rows || 1), 0);
  const size = Math.max(4, Math.min(opt.size, s.height - bottom / pxPerMm - 0.8));
  const narrow = fitLabelLines(lines, { ...s, width: Math.max(4, s.width - size - 1) }, family);
  const top = narrow.slice(0, 2);
  const avail = s.height * pxPerMm - 2 - bottom;
  const used = top.reduce((n, l) => n + l.lineHeight * (l.rows || 1), 0);
  const k = used > avail ? avail / used : 1;
  el.classList.add('has-qr', 'qr-beside');
  el.style.setProperty('--qr', size + 'mm');
  content.append(qrSvg(value));
  return [...top.map(l => ({ ...l, fontSize: l.fontSize * k, lineHeight: l.lineHeight * k })), ...full.slice(2)];
}

(function initQr() {
  try {
    const saved = JSON.parse(localStorage.getItem(QR_KEY) || 'null');
    if (saved) {
      $('qrEnabled').checked = !!saved.enabled;
      if (['beside', 'left', 'right'].includes(saved.pos)) $('qrPos').value = saved.pos;
      // v2：預設大小改為 6 mm；舊版存下的預設值 12 mm 改用新預設
      if (Number.isFinite(saved.size) && saved.size >= 5 && saved.size <= 17 && !(saved.v !== 2 && saved.size === 12)) $('qrSize').value = String(saved.size);
    }
  } catch {}
  const save = () => {
    try { localStorage.setItem(QR_KEY, JSON.stringify({ v: 2, enabled: $('qrEnabled').checked, pos: $('qrPos').value, size: Number($('qrSize').value) })); } catch {}
    render();
  };
  ['qrEnabled', 'qrPos'].forEach(id => $(id).addEventListener('change', save));
  $('qrSize').addEventListener('input', save);
  render();
})();
