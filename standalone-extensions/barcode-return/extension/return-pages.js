export const RETURN_URL = 'https://ihisaw.ntuh.gov.tw/WebApplication/PharManagement/BarCodeDrugReturn.aspx';
export const isReturnPage = url => /^https:\/\/ihisaw\.ntuh\.gov\.tw\/WebApplication\/PharManagement\/BarCodeDrugReturn\.aspx(?:[?#]|$)/i.test(url || '');
export async function returnFrames(tabId) {
  return (await chrome.webNavigation.getAllFrames({tabId}) || []).filter(frame => isReturnPage(frame.url));
}
export async function thawPages(pages) {
  for (const page of pages || []) {
    try { await chrome.tabs.sendMessage(page.tabId, {type:'return-update-unfreeze'}, {frameId:page.frameId}); } catch {}
  }
}
export async function freezePages() {
  const frozen = [];
  try {
    for (const tab of await chrome.tabs.query({})) {
      const frames = await returnFrames(tab.id);
      for (const frame of frames) {
        const page = {tabId:tab.id, frameId:frame.frameId};
        frozen.push(page);
        let timer;
        const reply = await Promise.race([
          chrome.tabs.sendMessage(tab.id, {type:'return-update-probe'}, {frameId:frame.frameId}),
          new Promise((_, reject) => { timer = setTimeout(() => reject(Error('無法確認院內頁面狀態')), 4000); })
        ]).finally(() => clearTimeout(timer));
        if (!reply?.ready) throw Error('仍有查詢、退藥、輸入數量或未確認的結果，請完成並核對後再更新。');
      }
    }
    return frozen;
  } catch (error) {
    await thawPages(frozen);
    throw Error(error.message + ' 若有舊工具頁面，請先核對後關閉或重新整理。');
  }
}
