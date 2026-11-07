// Bundled, readable source only. No remote evaluation, shell commands or patient storage.
import {UPDATE_CONFIG as config} from './update-config.js';

export const TOOL_ID = config.toolId;
export const MAX_BYTES = 6 * 1024 * 1024;
export const MAX_FILES = 80;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal: true});
const digestPattern = /^[a-f0-9]{64}$/;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const manifestLast = (a, b) => Number(a.path === 'manifest.json') - Number(b.path === 'manifest.json');

export async function sha256(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function compareVersion(a, b) {
  function parse(value) {
    if (typeof value !== 'string' || !/^\d{1,5}(\.\d{1,5}){0,3}$/.test(value)
      || value.split('.').some(part => Number(part) > 65535)) throw Error('版本號格式不正確');
    return value.split('.').map(Number);
  }
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return Math.sign((x[i] || 0) - (y[i] || 0));
  return 0;
}

export function validPath(path) {
  if (typeof path !== 'string' || path.length > 180
    || !path.split('/').every(part => (/^[a-z0-9][a-z0-9._-]*$/i.test(part) || config.legacyPathNames?.includes(part))
      && part !== '.' && part !== '..' && !part.endsWith('.')
      && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))
    || !/\.(js|css|html|json|png|svg|jpg|woff2|txt)$/i.test(path)) throw Error('更新包含不允許的檔案路徑');
  return path;
}

function checkPaths(files) {
  const seen = new Set();
  for (const file of files) {
    if (!object(file)) throw Error('更新檔案格式錯誤');
    const key = validPath(file.path).toLowerCase();
    if (seen.has(key)) throw Error('更新包含重複路徑');
    seen.add(key);
  }
  for (const path of seen) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) if (seen.has(parts.slice(0, i).join('/'))) throw Error('檔案與資料夾路徑衝突');
  }
}

function stable(value) {
  if (Array.isArray(value)) return JSON.stringify(value.map(item => JSON.parse(stable(item))));
  if (object(value)) return JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(stable(value[key]))])));
  return JSON.stringify(value ?? null);
}

function checkAccess(next, current) {
  if (!object(next) || next.manifest_version !== 3 || next.name !== current.name) throw Error('更新檔不屬於目前工具');
  for (const key of ['permissions', 'host_permissions', 'optional_permissions', 'optional_host_permissions']) {
    if (next[key] !== undefined && !Array.isArray(next[key])) throw Error('新版權限格式無效');
    if ((next[key] || []).some(permission => typeof permission !== 'string' || !(current[key] || []).includes(permission)))
      throw Error('新版需要額外權限，請改用手動安裝。');
  }
  // Changes to these capabilities require a deliberate manual installation.
  const ordinary = new Set(['manifest_version', 'name', 'version', 'version_name', 'description', 'minimum_chrome_version',
    'permissions', 'host_permissions', 'optional_permissions', 'optional_host_permissions', 'content_scripts',
    'background', 'icons', 'action', 'options_page', 'options_ui']);
  for (const key of new Set([...Object.keys(current), ...Object.keys(next)])) {
    if (ordinary.has(key)) continue;
    if (stable(next[key]) !== stable(current[key])) throw Error('新版變更識別或安全設定，請改用手動安裝。');
  }
  if (next.content_scripts !== undefined && !Array.isArray(next.content_scripts)) throw Error('新版網頁程式設定無效');
  const scope = script => {
    if (!object(script) || !Array.isArray(script.matches) || !script.matches.length) throw Error('新版網頁存取範圍無效');
    // File names may change; frame/world/timing/match restrictions may not silently broaden.
    const {js, css, ...boundary} = script;
    return stable(boundary);
  };
  const existing = (current.content_scripts || []).map(scope);
  for (const script of next.content_scripts || []) if (!existing.includes(scope(script)))
    throw Error('新版變更網頁存取範圍或執行環境，請改用手動安裝。');
  const match = globalThis.navigator?.userAgent?.match(/(?:Chrome|Chromium)\/(\d+(?:\.\d+){0,3})/);
  if (next.minimum_chrome_version) {
    compareVersion(next.minimum_chrome_version, next.minimum_chrome_version);
    if (match && compareVersion(next.minimum_chrome_version, match[1]) > 0) throw Error('請先更新 Chrome，再更新工具。');
  }
}

export async function validatePackage(pkg, current, {allowSame = false} = {}) {
  if (!object(pkg) || pkg.format !== config.packageFormat || pkg.toolId !== TOOL_ID
    || !Array.isArray(pkg.files) || pkg.files.length < 3 || pkg.files.length > MAX_FILES) throw Error('不是有效的工具更新檔');
  const comparison = compareVersion(pkg.version, current.version);
  if (comparison < 0 || (!allowSame && comparison === 0)) throw Error('更新版本必須高於目前版本');
  checkPaths(pkg.files);
  const files = [];
  let total = 0;
  for (const file of pkg.files) {
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_BYTES
      || typeof file.sha256 !== 'string' || !digestPattern.test(file.sha256) || typeof file.base64 !== 'string'
      || file.base64.length !== Math.ceil(file.size / 3) * 4
      || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)) throw Error('更新檔案編碼或大小錯誤');
    total += file.size;
    if (total > MAX_BYTES) throw Error('更新檔案過大');
    const bytes = Uint8Array.from(atob(file.base64), character => character.charCodeAt(0));
    if (bytes.length !== file.size || await sha256(bytes) !== file.sha256) throw Error('更新檔案不完整或驗證失敗');
    files.push({path: file.path, bytes});
  }
  const get = path => files.find(file => file.path === path);
  for (const path of ['manifest.json', config.marker, config.entry]) if (!get(path)) throw Error('更新缺少必要檔案');
  const next = JSON.parse(decoder.decode(get('manifest.json').bytes));
  const marker = JSON.parse(decoder.decode(get(config.marker).bytes));
  if (!object(next) || !object(marker) || next.version !== pkg.version || marker.toolId !== TOOL_ID) throw Error('更新版本或工具識別不一致');
  checkAccess(next, current);
  const required = [next.background?.service_worker, next.options_page, next.options_ui?.page, next.action?.default_popup,
    ...(next.content_scripts || []).flatMap(script => [...(script.js || []), ...(script.css || [])])].filter(Boolean);
  for (const path of required) if (!get(validPath(path))) throw Error('更新缺少必要程式檔');
  return {version: pkg.version, notes: String(pkg.notes || '').slice(0, 4000), files};
}

async function parent(directory, path, create) {
  const parts = validPath(path).split('/');
  for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part, {create});
  return {directory, name: parts.at(-1)};
}

export async function readFile(directory, path) {
  const entry = await parent(directory, path, false);
  const file = await (await entry.directory.getFileHandle(entry.name)).getFile();
  if (file.size > MAX_BYTES) throw Error('安裝檔案過大，已停止更新');
  return new Uint8Array(await file.arrayBuffer());
}

export async function writeFile(directory, path, bytes) {
  const entry = await parent(directory, path, true);
  const handle = await entry.directory.getFileHandle(entry.name, {create: true});
  const writer = await handle.createWritable();
  try { await writer.write(bytes); await writer.close(); }
  catch (error) { try { await writer.abort(); } catch {} throw error; }
}

export async function removeFile(directory, path) {
  try { const entry = await parent(directory, path, false); await entry.directory.removeEntry(entry.name); }
  catch (error) { if (error.name !== 'NotFoundError') throw error; }
}

// A temporary random text file proves this handle is the loaded extension folder,
// including recovery when the on-disk manifest is halfway through an update.
export async function proveInstalledDirectory(directory, readInstalled) {
  const path = config.proofPrefix + crypto.randomUUID() + '.txt';
  const proof = encoder.encode(crypto.randomUUID());
  try {
    await writeFile(directory, path, proof);
    if (await sha256(await readInstalled(path)) !== await sha256(proof)) throw Error('位置不同');
  } catch {
    throw Error('無法確認這是目前載入的工具資料夾，或 Chrome 不允許寫入。請選擇原本在 Chrome 載入的小工具安裝資料夾。');
  } finally { await removeFile(directory, path); }
}

export async function verifyDirectory(directory, current, readInstalled) {
  const manifest = JSON.parse(decoder.decode(await readFile(directory, 'manifest.json')));
  if (manifest.name !== current.name || manifest.version !== current.version)
    throw Error('請選擇目前使用的小工具安裝資料夾，版本須與正在使用的工具相同。');
  await proveInstalledDirectory(directory, readInstalled);
}

async function validateOriginals(journal) {
  if (!object(journal) || !Array.isArray(journal.originals) || !journal.originals.length || journal.originals.length > MAX_FILES)
    throw Error('還原紀錄格式無效，未寫入檔案。');
  checkPaths(journal.originals);
  let size = 0;
  for (const file of journal.originals) {
    if (file.bytes === null) {
      if (journal.format && (file.size !== 0 || file.sha256 !== null)) throw Error('還原檔案格式無效');
      continue;
    }
    if (!(file.bytes instanceof Uint8Array)) throw Error('還原檔案格式無效');
    size += file.bytes.length;
    if (size > MAX_BYTES) throw Error('還原檔案過大');
    if (journal.format && (file.size !== file.bytes.length || !digestPattern.test(file.sha256)
      || await sha256(file.bytes) !== file.sha256)) throw Error('還原檔案驗證失敗，未寫入檔案。');
  }
  if (!journal.originals.some(file => file.path === 'manifest.json' && file.bytes !== null)) throw Error('還原紀錄缺少原版識別');
}

export async function validateJournal(journal, current) {
  await validateOriginals(journal);
  if (!['writing', 'written'].includes(journal.phase)) throw Error('還原紀錄狀態無效');
  compareVersion(journal.version, journal.version);
  const original = JSON.parse(decoder.decode(journal.originals.find(file => file.path === 'manifest.json').bytes));
  if (!object(original) || original.name !== current.name || original.manifest_version !== 3
    || ![original.version, journal.version].includes(current.version)) throw Error('還原紀錄與目前工具不符');
  compareVersion(original.version, original.version);
  const markerFile = journal.originals.find(file => file.path === config.marker);
  if (markerFile?.bytes && JSON.parse(decoder.decode(markerFile.bytes)).toolId !== TOOL_ID) throw Error('還原紀錄屬於其他工具');
  if (journal.format !== undefined) {
    if (journal.format !== 'pharmacy-update-journal-v2' || journal.toolId !== TOOL_ID || journal.originalVersion !== original.version
      || !Array.isArray(journal.targets) || journal.targets.length !== journal.originals.length) throw Error('還原紀錄識別無效');
    checkPaths(journal.targets);
    const paths = new Set(journal.originals.map(file => file.path));
    let size = 0;
    for (const file of journal.targets) {
      if (!paths.has(file.path) || !Number.isSafeInteger(file.size) || file.size < 0 || !digestPattern.test(file.sha256)) throw Error('更新完成紀錄無效');
      size += file.size;
    }
    if (size > MAX_BYTES) throw Error('更新完成紀錄過大');
  }
  return original;
}

export async function verifyRecoveryDirectory(directory, journal, current, readInstalled) {
  await validateJournal(journal, current);
  if (journal.format && (!journal.directory || !await directory.isSameEntry(journal.directory)))
    throw Error('還原位置與原更新資料夾不同，未寫入檔案。');
  await proveInstalledDirectory(directory, readInstalled);
}

export async function confirmInstalledJournal(journal, current, readInstalled) {
  await validateJournal(journal, current);
  if (journal.phase !== 'written' || journal.version !== current.version) return false;
  if (journal.targets) {
    for (const file of journal.targets) {
      const bytes = await readInstalled(file.path);
      if (bytes.length !== file.size || await sha256(bytes) !== file.sha256) throw Error('更新後檔案驗證未完成，請保留還原紀錄並重新安裝。');
    }
  } else {
    // Legacy journals have no target hashes. Preserve migration without claiming a
    // full new-version hash check; validate the installed identity before cleanup.
    const manifest = JSON.parse(decoder.decode(await readInstalled('manifest.json')));
    const marker = JSON.parse(decoder.decode(await readInstalled(config.marker)));
    if (manifest.name !== current.name || manifest.version !== current.version || marker.toolId !== TOOL_ID)
      throw Error('舊版更新紀錄與已安裝檔案不一致');
  }
  return true;
}

export async function restoreFiles(directory, journal, onProgress = () => {}) {
  await validateOriginals(journal);
  const failures = [];
  for (const file of [...journal.originals].sort(manifestLast)) {
    // Never mark the old version restored if any earlier file failed to restore.
    if (file.path === 'manifest.json' && failures.length) break;
    try {
      if (file.bytes === null) await removeFile(directory, file.path);
      else {
        await writeFile(directory, file.path, file.bytes);
        if (await sha256(await readFile(directory, file.path)) !== await sha256(file.bytes)) throw Error('還原驗證失敗');
      }
    } catch { failures.push(file.path); }
    onProgress('正在還原原版檔案…');
  }
  if (failures.length) throw Error('部分原版檔案無法還原，還原紀錄已保留。請用原版 ZIP 覆蓋相同資料夾後重新載入。作業資料仍留在 Chrome。');
}

export async function applyPackage(directory, validated, {saveJournal, clearJournal, onProgress = () => {}, journalDirectory}) {
  const files = [...validated.files].sort(manifestLast);
  const originals = [], targets = [];
  let total = 0;
  for (const file of files) {
    let bytes = null;
    try { bytes = await readFile(directory, file.path); }
    catch (error) { if (error.name !== 'NotFoundError') throw error; }
    total += bytes?.length || 0;
    if (total > MAX_BYTES) throw Error('原版檔案過大，未更動工具。');
    originals.push({path: file.path, bytes, size: bytes?.length ?? 0, sha256: bytes === null ? null : await sha256(bytes)});
    targets.push({path: file.path, size: file.bytes.length, sha256: await sha256(file.bytes)});
  }
  const original = JSON.parse(decoder.decode(originals.find(file => file.path === 'manifest.json')?.bytes));
  const journal = {format: 'pharmacy-update-journal-v2', toolId: TOOL_ID, originalVersion: original.version,
    version: validated.version, phase: 'writing', originals, targets, createdAt: new Date().toISOString(),
    ...(journalDirectory ? {directory: journalDirectory} : {})};
  // Wait for durable storage before the first source-file mutation.
  await saveJournal(journal);
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress(`正在核對及更新 ${i + 1}／${files.length}…`);
      // Keep a complete backup/target inventory, but replace only changed files.
      // Re-read immediately before deciding: another local process may have
      // changed a file since backup. Never trust a cached equality comparison.
      let matches = false;
      try {
        const present = await readFile(directory, file.path);
        matches = present.length === targets[i].size && await sha256(present) === targets[i].sha256;
      } catch (error) { if (error.name !== 'NotFoundError') throw error; }
      if (!matches) await writeFile(directory, file.path, file.bytes);
      if (await sha256(await readFile(directory, file.path)) !== targets[i].sha256) throw Error('寫入後檔案驗證失敗');
    }
    const written = {...journal, phase: 'written'};
    await saveJournal(written);
    return written;
  } catch (error) {
    await restoreFiles(directory, journal, onProgress);
    await clearJournal();
    throw Error('更新未完成，已還原原版檔案。' + (error.name === 'NotAllowedError' ? '請重新授權資料夾後再試。' : '請稍後再試。'));
  }
}
