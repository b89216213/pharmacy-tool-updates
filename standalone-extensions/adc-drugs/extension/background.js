import './managed-background.js';
let opening;
chrome.action.onClicked.addListener(tab => {
  if (opening) return;
  opening = (async () => {
    const url = chrome.runtime.getURL('app.html');
    const existing = (await chrome.tabs.query({})).find(t => t.url?.startsWith(url));
    if (existing) {
      await chrome.windows.update(existing.windowId, { focused: true });
      await chrome.tabs.update(existing.id, { active: true });
      return;
    }
    await chrome.windows.create({
      url: url + (tab?.id ? '?source=' + tab.id : ''),
      type: 'popup', width: 1160, height: 860, focused: true
    });
  })().finally(() => { opening = null; });
});

