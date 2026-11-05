import {updateStore as store} from './update-store.js';
import {verifyDirectory} from './update-core.js';
import {FOLDER_NAME, LEGACY_LAYOUTS} from './installation-config.js';

export const INSTALLATION_KEY = 'installationVerifiedV1';
export const DEFAULT_PARENT = 'D:\\工作用小工具';
export const DEFAULT_PATH = DEFAULT_PARENT + '\\' + FOLDER_NAME;
export const DEFAULT_SEARCH_PATHS = [[FOLDER_NAME], ...LEGACY_LAYOUTS].map(parts => DEFAULT_PARENT + '\\' + parts.join('\\'));
const PROOF_KEY = 'installationDirectoryV2';
const ROOT_KEY = 'installationSearchRootV1';
const current = () => chrome.runtime.getManifest();
let checking;

const readInstalled = async path => {
  const response = await fetch(chrome.runtime.getURL(path), {cache: 'no-store'});
  if (!response.ok) throw Error('無法確認目前安裝位置。');
  return new Uint8Array(await response.arrayBuffer());
};

function status(state, directory = null, reason = '') {
  return {state, ready: state === 'ready', directory, reason};
}

async function inspectDirectory(directory) {
  if (!directory) return status('missing', null, '請授權小工具安裝的資料夾，以便日後更新。');
  try {
    if (await directory.queryPermission({mode: 'readwrite'}) !== 'granted')
      return status('permission', directory, '已記住安裝資料夾，請允許恢復存取。');
    const file = await (await directory.getFileHandle('manifest.json')).getFile();
    const manifest = JSON.parse(await file.text());
    if (manifest.name !== current().name || manifest.version !== current().version)
      return status('mismatch', directory, '已記住的資料夾與目前工具版本不符，請確認更新已完成，或選擇目前使用的資料夾。');
    const proof = await store('get', PROOF_KEY);
    if (proof?.toolName === current().name && await directory.isSameEntry(proof.directory))
      return status('ready', directory);
    return status('unverified', directory, '正在確認已記住的安裝資料夾。');
  } catch (error) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      return status('permission', directory, '已記住安裝資料夾，請允許恢復存取。');
    if (error.name === 'NotFoundError')
      return status('missing', directory, '找不到已記住的安裝資料夾，請確認位置或重新選擇。');
    return status('unavailable', directory, '暫時無法確認已記住的安裝資料夾，請重試。');
  }
}

export async function installationStatus() {
  try { return await inspectDirectory(await store('get', 'directory')); }
  catch { return status('unavailable', null, '暫時無法讀取資料夾紀錄，請重試。'); }
}

async function rememberDirectory(directory) {
  await store('put', 'directory', directory);
  await store('put', PROOF_KEY, {toolName: current().name, directory});
  await chrome.storage.local.set({[INSTALLATION_KEY]: {version: current().version, directoryName: directory.name}});
  return directory;
}

async function confirmDirectory(directory) {
  await verifyDirectory(directory, current(), readInstalled);
  return rememberDirectory(directory);
}

async function restoreStoredInstallation() {
  let result = await installationStatus();
  if (result.ready || result.state === 'permission' || result.state === 'unavailable') return result;
  if (result.state === 'unverified') {
    try {
      const proof = await store('get', PROOF_KEY);
      const legacy = (await chrome.storage.local.get(INSTALLATION_KEY))[INSTALLATION_KEY];
      // The previous version saved this handle only after proving the installed location.
      // Bind that existing verification to the handle, independently of software version.
      if (!proof && legacy?.directoryName === result.directory.name)
        await rememberDirectory(result.directory);
      else await confirmDirectory(result.directory);
      return installationStatus();
    } catch {
      return status('unavailable', result.directory, '暫時無法確認已記住的安裝資料夾，請重試或選擇目前使用的資料夾。');
    }
  }
  // An absolute Windows path is not a permission grant. Search only a retained,
  // explicitly authorized parent, starting with the configured tool folder name.
  try {
    const root = await store('get', ROOT_KEY);
    if (root) {
      if (await root.queryPermission({mode: 'readwrite'}) !== 'granted')
        return {...status('permission', result.directory, '已記住工具所在的資料夾，請允許恢復存取。'), permissionDirectory: root};
      await findInstalledDirectory(root);
      result = await installationStatus();
    }
  } catch { /* Preserve remembered handles so a temporary failure remains recoverable. */ }
  return result;
}

export function verifyStoredInstallation() {
  if (!checking) {
    // UI and service worker may start together. Only one migration/proof writes at a time.
    checking = (globalThis.navigator?.locks
      ? navigator.locks.request('pharmacy-installation-verification', restoreStoredInstallation)
      : restoreStoredInstallation()).finally(() => { checking = null; });
  }
  return checking;
}

export async function findInstalledDirectory(selected) {
  const queue = [{directory: selected, depth: 0}], candidates = [];
  // Keep a directly selected installation first. Known old layouts are tried
  // before the bounded general scan, even inside a crowded tools directory.
  candidates.push(selected);
  const roots = [selected];
  if (selected.name !== '工作用小工具') {
    try { roots.push(await selected.getDirectoryHandle('工作用小工具')); } catch {}
  }
  for (const root of roots) {
    for (const layout of [[FOLDER_NAME], ...LEGACY_LAYOUTS]) {
      // Accept the drive, 工作用小工具, the old outer folder, or extension itself.
      const parts = root.name === layout[0] ? layout.slice(1) : layout;
      try {
        let directory = root;
        for (const name of parts) directory = await directory.getDirectoryHandle(name);
        candidates.push(directory);
      } catch { /* A missing layout is normal; try the next known location. */ }
    }
  }
  for (const directory of candidates) {
    try {
      await confirmDirectory(directory);
      await store('put', ROOT_KEY, selected);
      return directory;
    } catch {}
  }
  candidates.length = 0;
  let scanned = 0;
  while (queue.length && scanned < 200) {
    const {directory, depth} = queue.shift();
    scanned++;
    try {
      const file = await (await directory.getFileHandle('manifest.json')).getFile();
      const manifest = JSON.parse(await file.text());
      if (manifest.name === current().name && manifest.version === current().version) candidates.push(directory);
      continue;
    } catch (error) {
      if (error.name !== 'NotFoundError') continue;
    }
    if (depth === 4) continue;
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind === 'directory' && !name.startsWith('.') && !['node_modules','tests','qa','docs','icons'].includes(name)) {
        if (queue.length + scanned >= 200) throw Error('請縮小選擇範圍，直接選擇小工具安裝的資料夾。');
        queue.push({directory: handle, depth: depth + 1});
      }
    }
  }
  for (const directory of candidates) {
    try {
      await confirmDirectory(directory);
      await store('put', ROOT_KEY, selected);
      return directory;
    } catch { /* A same-name copy must still fail the installed-file proof. */ }
  }
  throw Error('找不到目前使用的小工具。請選擇在 Chrome 載入的安裝資料夾，或它的上一層資料夾。');
}
