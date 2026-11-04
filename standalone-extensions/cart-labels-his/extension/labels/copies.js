// 各病房每床張數：例如「07HSx2 12HNx3」＝07HS 每床印 2 張、12HN 每床印 3 張（病人與空床標籤都套用，連續排列）
const COPIES_KEY = 'cart-label-ward-copies-v1';
let wardCopies = new Map();
function parseWardCopies(text) {
  const map = new Map(), bad = [];
  for (const token of String(text || '').split(/[\s,，、;；]+/).filter(Boolean)) {
    const m = token.match(/^\[?([A-Za-z0-9]+)\]?\s*[xX×*＊]\s*(\d{1,2})$/);
    if (!m || +m[2] < 1 || +m[2] > 10) { bad.push(token); continue; }
    map.set(m[1].toUpperCase(), +m[2]);
  }
  return { map, bad };
}
function copiesFor(ward) { return wardCopies.get(String(ward || '').trim().toUpperCase()) || 1; }
function labelCopies(text) { return copiesFor(text.split('\n')[0].split('  ')[0]); }
document.addEventListener('managed-app-ready', () => {
  const input = document.getElementById('wardCopies'), status = document.getElementById('wardCopiesStatus');
  const hint = status.textContent;
  const apply = (save) => {
    const { map, bad } = parseWardCopies(input.value);
    wardCopies = map;
    status.textContent = bad.length ? `無法辨識：${bad.join('、')}（格式例：07HSx2，張數 1–10）` : map.size ? `已套用：${[...map].map(([w, n]) => `${w} 每床 ${n} 張`).join('、')}。` : hint;
    status.classList.toggle('error-text', bad.length > 0);
    if (save) try { localStorage.setItem(COPIES_KEY, input.value.trim()); } catch {}
    current = 0; render();
  };
  try { input.value = localStorage.getItem(COPIES_KEY) || ''; } catch {}
  input.addEventListener('input', () => apply(true));
  apply(false);
});
