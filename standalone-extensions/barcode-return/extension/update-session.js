import {UPDATE_CONFIG as config} from './update-config.js';
import {applyPackage, confirmInstalledJournal, restoreFiles, verifyDirectory, verifyRecoveryDirectory} from './update-core.js';
import {SOURCE, parseIndex, githubFile, downloadRelease, validateIndex} from './update-network.js';
import {updateStore} from './update-store.js';

export async function readInstalled(path) {
  const response = await fetch(chrome.runtime.getURL(path), {cache: 'no-store'});
  if (!response.ok) throw Error('無法讀取已安裝檔案');
  return new Uint8Array(await response.arrayBuffer());
}

export async function requestWritePermission(directory) {
  if (await directory.queryPermission({mode: 'readwrite'}) === 'granted') return;
  if (await directory.requestPermission({mode: 'readwrite'}) !== 'granted') throw Error('未取得資料夾寫入權限，未更動工具。');
}

export async function saveReopenState(browser = chrome, pageLocation = location) {
  const state = {at: Date.now()};
  const params = new URLSearchParams(pageLocation.search);
  if (config.reopen === 'patch') {
    const {patchSource} = await browser.storage.session.get('patchSource');
    state.patchSource = patchSource || null;
  } else if (config.reopen === 'discharge') state.search = pageLocation.search;
  else if (config.reopen === 'patient') {
    state.sourceId = Number(params.get('source'));
    state.origin = params.get('origin') || '';
  } else if (config.reopen === 'cart') {
    const {cartSource} = await browser.storage.session.get('cartSource');
    state.sourceId = cartSource?.sourceId ?? Number(params.get('source'));
    state.origin = cartSource?.origin || params.get('origin') || '';
  }
  await browser.storage.local.set({[config.reopenKey]: state});
}

// The session owns ordering, exclusion and recovery. UI and release notes cannot
// select arbitrary URLs, paths, scripts, permissions or executable commands.
export function createUpdateSession({current, isBusy, prepare, finish, onProgress = () => {},
  store = updateStore, installed = readInstalled, browser = chrome, locks = navigator.locks,
  fetcher = fetch, pageLocation = location}) {
  let running = false, needsReload = false;
  const progress = message => onProgress(message);
  const lockName = config.slug + '-update';

  async function exclusive(task) {
    if (!locks?.request) throw Error('這個瀏覽器不支援安全更新鎖定，請改用手動更新。');
    return locks.request(lockName, {ifAvailable: true}, async lock => {
      if (!lock) throw Error('另一個視窗正在更新，請稍後再試。');
      return task();
    });
  }

  async function checkViews() {
    const urls = browser.runtime.getContexts
      ? (await browser.runtime.getContexts({})).map(context => context.documentUrl)
      : (browser.extension?.getViews?.() || []).map(view => view.location.href);
    const entry = browser.runtime.getURL(config.entry);
    if (urls.filter(url => typeof url === 'string' && url.split(/[?#]/)[0] === entry).length > 1)
      throw Error('請先關閉其他' + config.displayName + '視窗，再進行更新。');
  }

  async function managedLock(action) {
    const result = await browser.runtime.sendMessage({kind: 'managed-tool', action, workspace: true});
    if (!result?.ok) throw Error(result?.error || '無法取得工具更新鎖定，請稍後再試。');
  }

  async function reconcile() {
    return exclusive(async () => {
      const journal = await store('get', 'journal');
      if (!journal) return false;
      if (!await confirmInstalledJournal(journal, current, installed)) return false;
      await store('delete', 'journal');
      return true;
    });
  }

  async function run({directory, release, recovery = false}) {
    if (running || needsReload) throw Error('工具正在更新或等待重新開啟，請稍候。');
    if (!directory) throw Error('請先授權小工具安裝的資料夾。');
    if (isBusy()) throw Error(config.busyMessage);
    // Set synchronously, before permission prompts or any asynchronous work.
    running = true;
    let finishNeeded = false, workspaceLocked = false, reopenSaved = false;
    try {
      await requestWritePermission(directory);
      await exclusive(async () => {
        await checkViews();
        if (isBusy()) throw Error('工具仍在處理作業，請稍後再試。');
        // Never use the potentially stale journal snapshot held by a UI window.
        const journal = await store('get', 'journal');
        if (recovery && !journal) throw Error('目前沒有需要還原的更新紀錄，請重新開啟工具。');
        if (!recovery && journal) throw Error('上次更新尚未完成，請先還原原版或重新開啟工具。');
        if (config.workspaceLock) { await managedLock('update-lock'); workspaceLocked = true; }
        finishNeeded = true;
        await prepare();
        if (recovery) {
          await verifyRecoveryDirectory(directory, journal, current, installed);
          await saveReopenState(browser, pageLocation); reopenSaved = true;
          await restoreFiles(directory, journal, progress);
          await store('delete', 'journal');
        } else {
          const selected = validateIndex(release);
          // A cached or withdrawn announcement must not authorize installation.
          const fresh = parseIndex(await githubFile(SOURCE.index, {fetcher, max: 32000}));
          if (['version', 'packagePath', 'sha256', 'size'].some(key => selected[key] !== fresh[key]))
            throw Error('更新公告已變更，請重新檢查新版後再更新。');
          progress('正在下載並驗證新版…');
          const validated = await downloadRelease(fresh, current, {fetcher});
          // A rejected download must not cause even the temporary folder-proof
          // write. Prove the live installation only after all package checks.
          await verifyDirectory(directory, current, installed);
          // Persist reopening metadata before source replacement so a storage
          // failure cannot strand an otherwise successful update.
          await saveReopenState(browser, pageLocation); reopenSaved = true;
          await applyPackage(directory, validated, {
            journalDirectory: directory,
            saveJournal: value => store('put', 'journal', value),
            clearJournal: () => store('delete', 'journal'), onProgress: progress
          });
        }
        needsReload = true;
        progress(recovery ? '原版已還原，正在重新開啟…' : '更新完成，正在重新開啟…');
      });
      // Release the Web Lock before Chrome unloads this document. The persisted
      // journal and application lock continue to prevent conflicting operations.
      browser.runtime.reload();
    } catch (error) {
      if (needsReload) throw Error('檔案已完成處理，但未能重新開啟。請按「重新開啟工具」；若仍失敗，請至擴充功能頁重新載入。');
      if (reopenSaved) try { await browser.storage.local.set({[config.reopenKey]: null}); } catch {}
      let unlockError;
      if (workspaceLocked) try { await managedLock('update-unlock'); } catch (failure) { unlockError = failure; }
      if (finishNeeded) try { await finish(); } catch (failure) { unlockError = failure; }
      if (unlockError) throw Error(error.message + ' 作業鎖定未能解除，請重新開啟工具。');
      throw error;
    } finally { running = false; }
  }

  return {run, reconcile, get running() { return running; }, get needsReload() { return needsReload; }};
}
