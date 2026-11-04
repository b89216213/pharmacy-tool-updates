// 起印箭頭：預覽一律顯示；「印出起始箭頭」預設勾選，印在起始標籤左側的間隙
(() => {
  const KEY = 'cart-label-print-start-arrow-v1', box = document.getElementById('printStartArrow');
  const apply = () => document.body.classList.toggle('print-start-arrow', box.checked);
  box.checked = true; // 預設印出
  try { if (localStorage.getItem(KEY) === '0') box.checked = false; } catch {}
  apply();
  box.addEventListener('change', () => { try { localStorage.setItem(KEY, box.checked ? '1' : '0'); } catch {} apply(); });
})();
