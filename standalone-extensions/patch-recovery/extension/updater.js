import {UPDATE_CONFIG as config} from './update-config.js';
import {compareVersion, verifyDirectory} from './update-core.js';
import {SOURCE, githubFile, parseIndex, validateIndex} from './update-network.js';
import {updateStore as store} from './update-store.js';
import {createUpdateSession, readInstalled, requestWritePermission} from './update-session.js';

let mounted;
export function mountUpdater(options) {
  if (!globalThis.chrome?.runtime?.getManifest) return Promise.resolve();
  return mounted ??= mount(options);
}

async function mount({isBusy, prepare, finish}) {
  const $ = id => document.getElementById(id);
  const current = chrome.runtime.getManifest();
  const dialog = $('update-dialog');
  const status = (message, error = false) => {
    $('update-status').textContent = message;
    $('update-status').classList.toggle('update-error', error);
  };
  const session = createUpdateSession({current, isBusy, prepare, finish, onProgress: status});
  const installation = config.installationUI ? await (await import('./installation-ui.js')).mountInstallation() : null;
  $('update-version').textContent = '目前 v' + current.version;
  // The database remains local. Remove obsolete private-repository credentials.
  await store('delete', 'token');
  const sourceKey = SOURCE.repo + '@' + SOURCE.ref;
  if (await store('get', 'source') !== sourceKey) {
    await store('delete', 'latest');
    await store('delete', 'lastCheck');
    await store('put', 'source', sourceKey);
  }
  let directory = await store('get', 'directory');
  let journal = await store('get', 'journal');
  let latest = null, fresh = false, action = false, checking = false, disposed = false;
  let reminderPending = false, reminded = false, reminderTimer;
  const hasUpdate = () => latest && compareVersion(latest.version, current.version) > 0;
  const locked = () => action || checking || session.running || session.needsReload;
  const clearReminder = () => { reminderPending = false; clearTimeout(reminderTimer); };

  function render() {
    const busy = locked();
    for (const element of dialog.querySelectorAll('button,input')) element.disabled = busy;
    $('update-directory').textContent = directory ? (installation?.ready ? '已確認：' : '已記住：') + directory.name : '尚未授權小工具安裝的資料夾';
    $('update-folder').textContent = installation?.state === 'permission' ? '允許存取' : directory ? '變更資料夾' : '選擇安裝資料夾';
    // Recovery is bound to the original update location; do not replace its handle.
    $('update-folder').disabled = busy || !!journal;
    $('update-apply').hidden = !hasUpdate() && !session.needsReload;
    $('update-apply').disabled = session.needsReload ? false : busy || !fresh || !directory || !!journal;
    $('update-apply').textContent = session.needsReload ? '重新開啟工具' : '更新並重新開啟';
    $('update-check').disabled = busy || !!journal;
    $('update-recover').hidden = !journal || session.needsReload;
    $('update-recover').disabled = busy || !directory;
    $('update-notes').textContent = latest?.notes || '';
    $('update-new-version').textContent = hasUpdate() ? '可更新至 v' + latest.version : '';
    $('open-update').textContent = hasUpdate() ? '更新可用' : '工具更新';
    $('open-update').classList.toggle('update-available', !!hasUpdate());
  }

  function openDialog() {
    render();
    if (!dialog.open) dialog.showModal();
    if (fresh && hasUpdate()) { reminded = true; clearReminder(); }
  }

  function remindWhenReady() {
    clearTimeout(reminderTimer);
    if (disposed || !reminderPending || !fresh || !hasUpdate() || reminded || journal) { clearReminder(); return; }
    if (dialog.open) { reminded = true; clearReminder(); return; }
    if ((installation && !installation.ready) || locked() || isBusy() || document.hidden
      || document.querySelector('dialog[open]')
      || document.activeElement?.matches('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) {
      reminderTimer = setTimeout(remindWhenReady, 1000);
      return;
    }
    openDialog();
  }

  async function check(manual = true) {
    if (locked() || journal || disposed) return;
    checking = true;
    fresh = false;
    render();
    if (manual || dialog.open) status('正在檢查新版…');
    try {
      latest = parseIndex(await githubFile(SOURCE.index, {max: 32000}));
      await store('put', 'latest', latest);
      await store('put', 'lastCheck', Date.now());
      fresh = true;
      reminderPending = hasUpdate() && !reminded;
      status(hasUpdate() ? '新版已就緒。可按「更新並重新開啟」，或先關閉視窗繼續使用。' : '目前已是最新版本。');
    } catch (error) {
      clearReminder();
      status(manual || dialog.open ? error.message : '上次檢查未成功，可按「檢查新版」重試。', true);
    } finally { checking = false; render(); remindWhenReady(); }
  }

  function guarded(task) {
    return async () => {
      if (locked()) return;
      // Lock even during a folder picker/permission prompt, before the first await.
      action = true;
      render();
      try { await task(); }
      catch (error) { status(error.name === 'AbortError' ? '已取消，工具未更動。' : error.message || '更新失敗，請稍後再試。', true); }
      finally {
        try { journal = await store('get', 'journal'); }
        catch { status('無法讀取更新狀態，請重新開啟工具。', true); }
        action = false;
        render();
      }
    };
  }

  $('open-update').addEventListener('click', openDialog);
  $('update-close').addEventListener('click', () => { if (!locked()) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (locked()) event.preventDefault(); });
  $('update-check').addEventListener('click', () => { void check(); });
  $('update-folder').addEventListener('click', guarded(async () => {
    if (journal) throw Error('請先完成原安裝資料夾的更新還原。');
    if (installation) directory = await (installation.state === 'permission' ? installation.requestAccess() : installation.select());
    else {
      if (!window.showDirectoryPicker) throw Error('這個 Chrome 環境不支援資料夾授權，請改用手動更新。');
      const selected = await window.showDirectoryPicker({id: config.slug + '-folder', mode: 'readwrite'});
      await requestWritePermission(selected);
      await verifyDirectory(selected, current, readInstalled);
      await store('put', 'directory', selected);
      directory = selected;
    }
    status('已確認小工具安裝的資料夾，日後更新會沿用這個位置。');
  }));

  const apply = guarded(async () => {
    if (!fresh) throw Error('請先重新檢查新版。');
    await session.run({directory, release: latest});
  });
  $('update-apply').addEventListener('click', () => {
    if (session.needsReload) {
      try { chrome.runtime.reload(); } catch { status('請至 Chrome 擴充功能頁重新載入這個工具。', true); }
    } else void apply();
  });
  $('update-recover').addEventListener('click', guarded(() => session.run({directory, recovery: true})));
  document.addEventListener('installation-change', () => {
    if (!installation || locked() || journal) return;
    directory = installation.directory;
    render();
  });
  function openRequestedSection() {
    if (location.hash !== '#update') return;
    history.replaceState(history.state, '', location.pathname + location.search);
    openDialog();
  }
  window.addEventListener('hashchange', openRequestedSection);
  window.addEventListener('beforeunload', event => {
    if (session.running) { event.preventDefault(); event.returnValue = ''; }
  });

  try {
    if (journal && await session.reconcile()) {
      journal = null;
      status('已完成更新至 v' + current.version + '，原有作業紀錄與設定保留。');
    } else if (journal) status('偵測到上次更新未完成。請先按「還原原版檔案」。', true);
    else status('開啟工具會自動檢查新版，不需 GitHub 帳號或憑證。');
  } catch (error) { status(error.message, true); }
  // A new journal retains its original handle even if installation discovery ran
  // while the previous update was interrupted. Legacy journals use the saved handle.
  if (journal?.directory) directory = journal.directory;
  try {
    const cached = await store('get', 'latest');
    if (cached) latest = validateIndex(cached);
  } catch { await store('delete', 'latest'); }
  render();
  openRequestedSection();
  if (!journal && (!installation || installation.ready)) void check(false);
  const interval = setInterval(() => { if (!locked() && !journal) void check(false); }, 6 * 60 * 60 * 1000);
  window.addEventListener('pagehide', () => { disposed = true; clearReminder(); clearInterval(interval); }, {once: true});
}
