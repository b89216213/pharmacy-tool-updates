import {verifyStoredInstallation, findInstalledDirectory, INSTALLATION_KEY} from './installation-core.js';

export async function mountInstallation() {
  if (window.PharmacyInstallation) return window.PharmacyInstallation;
  const dialog = document.createElement('dialog');
  dialog.id = 'installation-dialog';
  dialog.setAttribute('aria-labelledby', 'installation-title');
  dialog.innerHTML = `<style>
#installation-dialog{width:min(520px,calc(100vw - 28px));max-height:88vh;overflow:auto;box-sizing:border-box;padding:20px;border:1px solid #d8e1e6;border-radius:10px;background:#fff;color:#243640;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft JhengHei",sans-serif}
#installation-dialog::backdrop{background:#15253066}
#installation-dialog h2{font-size:18px;margin:0 0 12px}
#installation-dialog p{margin:10px 0}
#installation-dialog button{font:inherit;cursor:pointer;border:1px solid #cbd8df;border-radius:6px;background:#fff;color:#243640;padding:7px 11px}
#installation-dialog button:hover:not(:disabled){background:#edf3f6}
#installation-dialog button.primary{background:#31546a;border-color:#31546a;color:white}
#installation-dialog button.primary:hover:not(:disabled){background:#254357;color:white}
#installation-dialog button:disabled{opacity:.55;cursor:default}
#installation-dialog button:focus-visible{outline:2px solid #31546a;outline-offset:2px}
#installation-dialog .installation-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
#installation-dialog #installation-status{font-size:13px;white-space:pre-wrap}
#installation-dialog .installation-error{color:#983e32}
</style>
<h2 id="installation-title">授權小工具安裝的資料夾</h2>
<p id="installation-description"></p>
<div class="installation-actions"><button type="button" class="primary" id="installation-pick">選擇並授權資料夾</button><button type="button" id="installation-change-folder" hidden>選擇其他資料夾</button><button type="button" id="installation-later">稍後處理</button></div>
<p id="installation-status" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);
  const el = id => dialog.querySelector('#' + id);
  let selecting = false, prompted = false, revision = 0;
  const controller = {ready: false, state: 'checking', directory: null, permissionDirectory: null, open, refresh, requestAccess, select: () => perform(pickDirectory)};
  window.PharmacyInstallation = controller;

  function render() {
    const permission = controller.state === 'permission';
    const retry = ['unavailable', 'mismatch', 'unverified'].includes(controller.state);
    el('installation-title').textContent = permission ? '允許存取已記住的資料夾' : retry ? '確認安裝資料夾' : '授權小工具安裝的資料夾';
    el('installation-description').textContent = permission
      ? '已記住這個小工具的安裝位置。請允許 Chrome 恢復存取，以便日後更新。'
      : retry ? controller.reason : '請選擇這個小工具目前安裝的資料夾，並允許存取與修改，以便日後更新。';
    el('installation-pick').textContent = permission ? '允許存取' : retry ? '重新確認' : '選擇並授權資料夾';
    el('installation-change-folder').hidden = !permission && !retry;
  }
  function open(force = false) {
    if (controller.ready || controller.state === 'checking' || (!force && prompted) || dialog.open || document.querySelector('dialog[open]')) return;
    prompted = true;
    render();
    dialog.showModal();
  }
  async function refresh() {
    const request = ++revision;
    const state = await verifyStoredInstallation();
    if (request !== revision) return state;
    Object.assign(controller, {directory: null, permissionDirectory: null}, state);
    render();
    if (state.ready && dialog.open) dialog.close();
    document.dispatchEvent(new Event('installation-change'));
    return state;
  }
  async function pickDirectory() {
    if (!window.showDirectoryPicker) throw Error('這個 Chrome 無法選擇資料夾，請使用支援資料夾授權的桌面 Chrome。');
    const options = {id: 'pharmacy-installation', mode: 'readwrite'};
    // A missing/moved handle cannot be used as the picker's starting directory.
    if (controller.directory && controller.state !== 'missing') options.startIn = controller.directory;
    const directory = await window.showDirectoryPicker(options);
    el('installation-status').textContent = '正在確認小工具安裝的位置…';
    if (await directory.queryPermission({mode: 'readwrite'}) !== 'granted')
      throw Error('尚未取得修改資料夾的授權，請允許後再繼續。');
    await findInstalledDirectory(directory);
    await refresh();
    return controller.directory;
  }
  async function activate() {
    if (controller.state === 'permission') {
      const directory = controller.permissionDirectory || controller.directory;
      // Called directly from the button gesture, before storage/network awaits.
      const permission = await directory.requestPermission({mode: 'readwrite'});
      if (permission !== 'granted') throw Error('尚未允許存取，已記住的安裝位置會保留。');
      const result = await refresh();
      if (!result.ready) el('installation-status').textContent = result.reason;
      return;
    }
    if (['unavailable', 'mismatch', 'unverified'].includes(controller.state)) {
      const result = await refresh();
      el('installation-status').textContent = result.reason;
      return;
    }
    return pickDirectory();
  }
  async function requestAccess() {
    await perform(activate);
    if (!controller.ready) throw Error(controller.reason);
    return controller.directory;
  }
  async function perform(action) {
    if (selecting) throw Error('正在處理資料夾授權，請稍候。');
    selecting = true;
    revision++;
    el('installation-pick').disabled = true;
    el('installation-change-folder').disabled = true;
    el('installation-status').classList.remove('installation-error');
    try { return await action(); }
    finally {
      selecting = false;
      el('installation-pick').disabled = false;
      el('installation-change-folder').disabled = false;
    }
  }
  function run(action) {
    void perform(action).catch(error => {
      el('installation-status').textContent = error.name === 'AbortError' ? '已取消。完成資料夾授權後即可繼續。' : error.message;
      el('installation-status').classList.add('installation-error');
    });
  }
  el('installation-pick').addEventListener('click', () => run(activate));
  el('installation-change-folder').addEventListener('click', () => run(pickDirectory));
  el('installation-later').addEventListener('click', () => {if (!selecting) dialog.close();});
  dialog.addEventListener('cancel', event => {if (selecting) event.preventDefault();});
  chrome.storage.onChanged?.addListener((changes, area) => {
    if (area === 'local' && changes[INSTALLATION_KEY] && !selecting) void refresh();
  });
  await refresh();
  window.addEventListener('focus', () => {if (!selecting) void refresh();});
  return controller;
}
