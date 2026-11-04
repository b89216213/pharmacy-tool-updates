// 「預覽略過已印」開關：記住選擇；切換或列印記憶變動時更新預覽
(() => {
  const KEY = 'cart-label-preview-filtered-v1', box = document.getElementById('previewFiltered');
  try { box.checked = localStorage.getItem(KEY) === '1'; } catch {}
  box.addEventListener('change', () => { try { localStorage.setItem(KEY, box.checked ? '1' : '0'); } catch {} current = 0; render(); });
  window.addEventListener('storage', e => { if (box.checked && (e.key === HISTORY_KEY || e.key === null)) render(); });
  render();
})();
// 「略過已印的病人：標示床號與姓名」：預設開啟，記住選擇
(() => {
  const KEY = 'cart-label-omit-marks-v1', box = document.getElementById('omitMarks');
  try { if (localStorage.getItem(KEY) === '0') box.checked = false; } catch {}
  box.addEventListener('change', () => { try { localStorage.setItem(KEY, box.checked ? '1' : '0'); } catch {} render(); });
  render();
})();
