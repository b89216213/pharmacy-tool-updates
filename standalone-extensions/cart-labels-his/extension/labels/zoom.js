// 預覽縮放（預設 100%）：－／＋（或 Ctrl＋滾輪）放大縮小，「符合」回到自動符合視窗；只影響預覽，不影響列印
const ZOOM_KEY = 'cart-label-preview-zoom-v1';
const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
let previewZoom = 'fit', lastFit = 1;
try { const raw = localStorage.getItem(ZOOM_KEY), v = Number(raw); if (raw === 'fit') previewZoom = 'fit'; else if (raw && v >= 0.25 && v <= 3) previewZoom = v; } catch {}
function previewZoomScale(fit) {
  lastFit = fit;
  const scale = previewZoom === 'fit' ? fit : previewZoom;
  const btn = document.getElementById('zoomFit');
  if (btn) { btn.textContent = previewZoom === 'fit' ? `符合 ${Math.round(fit * 100)}%` : `${Math.round(scale * 100)}%`; btn.classList.toggle('active', previewZoom === 'fit'); btn.title = previewZoom === 'fit' ? '目前自動符合視窗' : '按一下回到符合視窗'; }
  return scale;
}
function setZoom(z) {
  previewZoom = z === 'fit' ? 'fit' : Math.max(0.25, Math.min(3, z));
  try { localStorage.setItem(ZOOM_KEY, String(previewZoom)); } catch {}
  fitPreview();
}
function stepZoom(dir) {
  const now = previewZoom === 'fit' ? lastFit : previewZoom;
  const next = dir > 0 ? ZOOM_STEPS.find(s => s > now + 0.001) : [...ZOOM_STEPS].reverse().find(s => s < now - 0.001);
  setZoom(next ?? now);
}
document.getElementById('zoomIn').onclick = () => stepZoom(1);
document.getElementById('zoomOut').onclick = () => stepZoom(-1);
document.getElementById('zoomFit').onclick = () => setZoom('fit');
document.getElementById('previewViewport').addEventListener('wheel', e => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  stepZoom(e.deltaY < 0 ? 1 : -1);
}, { passive: false });
fitPreview();
