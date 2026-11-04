// Load only UI preferences before mounting; medication input is never persisted.
(async () => {
  const keys = ["med-org-timeline-dayPx", "med-org-timeline-rowH", "med-org-timeline-labelEvery", "med-org-timeline-showDays", "med-org-timeline-showInst", "med-org-timeline-showToday", "med-org-page", "med-org-filterSourceOPD", "med-org-filterShortDays", "med-org-showDays-per-drug", "med-org-showRegular", "med-org-showChanged", "med-org-alignColumns-v2", "med-org-nameMode", "med-org-showFullHistory", "med-org-showDitto", "med-org-showExpiredGray", "med-org-showExpiredGrayText", "med-org-showComboWarning", "med-org-expiryGrace", "med-org-showActiveMark", "med-org-fontSize", "med-org-darkMode-reference-v2", "med-org-selfBrandMap", "med-org-selfcheck-visits", "med-org-pillShow", "med-org-pillSize", "med-org-pillPx", "med-org-dsPrintDropped"];
  let stored = {};
  try { stored = await chrome.storage.local.get(keys); } catch {}
  const settings = {};
  const migrated = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(stored,key)) { settings[key]=stored[key]; continue; }
    // Migrate readable preferences from the previous extension version.
    try {
      const old = localStorage.getItem(key);
      if (old !== null) { settings[key] = JSON.parse(old); migrated[key] = settings[key]; }
    } catch {}
  }
  if (Object.keys(migrated).length) {
    try { await chrome.storage.local.set(migrated); } catch {}
  }
  globalThis.medicationSettings = settings;
  let contextInvalidated = false;
  let notice;
  globalThis.saveMedicationSettings = async values => {
    if (contextInvalidated) return;
    try {
      await chrome.storage.local.set(values);
      if (notice) notice.remove();
      notice = null;
    } catch (error) {
      contextInvalidated = /extension context invalidated/i.test(String(error?.message || error));
      if (!notice) {
        notice = document.createElement('div');
        notice.setAttribute('role','status');
        notice.style.cssText = 'position:fixed;bottom:8px;left:8px;right:8px;z-index:2147483647;padding:10px 14px;background:#443917;color:#fff0bb;border:1px solid #a89149;font:13px/1.5 Arial,sans-serif;';
        document.body.append(notice);
      }
      notice.textContent = contextInvalidated
        ? '擴充功能已更新或停用，設定暫時無法儲存。請先複製需要的內容，再重新開啟工具。'
        : '顯示設定暫時無法儲存；本次操作仍有效。';
    }
  };
  const app = document.createElement('script');
  app.src = 'app.js';
  document.body.append(app);
})();

