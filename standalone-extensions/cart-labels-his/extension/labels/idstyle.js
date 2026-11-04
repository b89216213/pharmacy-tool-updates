// 擴充功能：標籤第三行「病歷號＋生日」的分隔樣式（⚙ 設定 → 版面微調）
// A 空白分隔｜B 直線分隔｜C 橫線＋左右對齊（預設）｜D 上下兩行｜E 小標籤｜F 病歷號反白
// 加上 QR Code 時同樣套用（G＝QR＋B、H＝QR＋C）。只有病歷號、生日兩段都有時才套用；帳號版標籤維持原樣。
const ID_STYLE_KEY = 'cart-label-idstyle-v1';
const ID_STYLES = ['A', 'B', 'C', 'D', 'E', 'F'];

function idStyle() { const v = $('idStyle')?.value; return ID_STYLES.includes(v) ? v : 'C'; }

// 回傳用來計算字級的文字（含樣式額外佔用的寬度）與需預留的高度；不適用時回傳 null
function idStyleLines(lines) {
  const style = idStyle();
  if (style === 'A' || lines.length !== 3) return null;
  const parts = (lines[2] || '').trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const [chart, birthday] = parts;
  const base = { style, chart, birthday, extraMm: 0 };
  switch (style) {
    case 'B': return { ...base, measure: [lines[0], lines[1], `${chart}  |  ${birthday}`] };
    case 'C': return { ...base, measure: [lines[0], lines[1], `${chart}   ${birthday}`], extraMm: 0.7 };
    case 'D': return { ...base, measure: [lines[0], lines[1], chart, birthday] };
    case 'E': return { ...base, measure: [lines[0], lines[1], `病 ${chart}  生 ${birthday}`] };
    case 'F': return { ...base, measure: [lines[0], lines[1], `${chart}  ${birthday}`] };
  }
  return null;
}

// 依樣式重組第三行（第四行）的內容
function idStyleDecorate(content, v) {
  const spans = content.querySelectorAll(':scope > .label-line');
  const l3 = spans[2];
  if (!l3) return;
  const span = (cls, text) => { const s = document.createElement('span'); if (cls) s.className = cls; if (text != null) s.textContent = text; return s; };
  l3.replaceChildren();
  switch (v.style) {
    case 'B': l3.append(v.chart, span('id-bar'), v.birthday); break;
    case 'C': l3.classList.add('id-lr'); l3.append(span('', v.chart), span('', v.birthday)); break;
    case 'D': l3.textContent = v.chart; if (spans[3]) { spans[3].textContent = v.birthday; spans[3].style.fontSize = parseFloat(spans[3].style.fontSize) * 0.9 + 'px'; } break;
    case 'E': l3.append(span('id-tag', '病'), v.chart, span('id-gap'), span('id-tag', '生'), v.birthday); break;
    case 'F': l3.append(span('id-inv', v.chart), v.birthday); break;
  }
}

(function initIdStyle() {
  try { const v = localStorage.getItem(ID_STYLE_KEY); if (ID_STYLES.includes(v)) $('idStyle').value = v; } catch {}
  $('idStyle')?.addEventListener('change', () => {
    try { localStorage.setItem(ID_STYLE_KEY, $('idStyle').value); } catch {}
    render();
  });
})();
