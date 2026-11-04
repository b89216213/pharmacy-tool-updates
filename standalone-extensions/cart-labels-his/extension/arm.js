// v2.4：平常不改動 HIS 頁面（避免影響 TPR 等其他網頁）。
// 只有要按院內「列印病人標籤」或執行自動抓取時，才把攔截程式（his-print-bus.js＋hook.js）放進這一頁。
(() => {
  if (window.__cartLabelArmLoaded) return;
  window.__cartLabelArmLoaded = true;
  const KEY = 'cartlabel-armed', FLAG = 'data-cartlabel-armed';
  const isArmed = () => document.documentElement?.getAttribute(FLAG) === '1';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let arming = null;
  function arm(reason) {
    if (isArmed()) return Promise.resolve(true);
    if (arming) return arming;
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), path: location.pathname })); } catch {}
    arming = new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ type: 'arm-main' }, res => {
          void chrome.runtime.lastError;
          arming = null;
          if (isArmed()) console.log('[藥車標籤] 已啟用攔截：' + reason);
          else console.warn('[藥車標籤] 無法啟用攔截', res?.error || '');
          resolve(isArmed());
        });
      } catch { arming = null; resolve(false); }
    });
    return arming;
  }
  window.__cartLabelArm = arm;

  const PRINT = /列印病人標籤/;
  const printBtn = t => { const el = t?.closest?.('input,button,a'); return el && PRINT.test(el.value || el.textContent || '') ? el : null; };
  // 滑鼠移到按鈕上、按下或用鍵盤選到時先啟用（通常在點擊前就完成）
  for (const type of ['mouseover', 'pointerdown', 'focusin']) {
    window.addEventListener(type, e => { if (!isArmed() && printBtn(e.target)) arm('列印病人標籤'); }, true);
  }
  // 點擊時若還沒啟用完成：先攔下這次點擊，啟用後再替使用者按一次（最多等 2 秒）
  let replaying = false;
  window.addEventListener('click', e => {
    if (replaying || isArmed()) return;
    const el = printBtn(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    Promise.race([arm('按下列印病人標籤'), sleep(2000)]).then(() => {
      replaying = true;
      try { el.click(); } finally { replaying = false; }
    });
  }, true);

  // 按鈕造成整頁重新載入時：同一頁面、90 秒內繼續啟用
  try {
    const a = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (a && a.path === location.pathname && Date.now() - a.at < 90000) arm('接續剛才的列印');
  } catch {}
})();
