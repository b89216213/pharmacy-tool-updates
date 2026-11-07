import {UPDATE_CONFIG as config} from './update-config.js';
import {TOOL_ID, MAX_BYTES, compareVersion, sha256, validatePackage} from './update-core.js';

export const SOURCE = Object.freeze({repo: 'b89216213/pharmacy-tool-updates', ref: 'main', index: `updates/${config.slug}/latest.json`});
const decoder = new TextDecoder('utf-8', {fatal: true});

function sourcePath(path) {
  if (path === SOURCE.index) return;
  const prefix = `updates/${config.slug}/packages/`;
  if (typeof path !== 'string' || !path.startsWith(prefix) || !path.endsWith('.json')) throw Error('更新來源路徑無效');
  const version = path.slice(prefix.length, -5);
  try { compareVersion(version, version); } catch { throw Error('更新來源路徑無效'); }
}

export async function githubFile(path, {fetcher = fetch, max = MAX_BYTES * 2} = {}) {
  sourcePath(path);
  if (!Number.isSafeInteger(max) || max < 1 || max > MAX_BYTES * 2) throw Error('更新檔大小限制無效');
  const url = `https://raw.githubusercontent.com/${SOURCE.repo}/${SOURCE.ref}/${path}`;
  let response;
  try {
    response = await fetcher(url, {headers: {Accept: 'application/json'}, credentials: 'omit',
      referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000)});
  } catch { throw Error('無法連線 GitHub，請確認院內網路可存取 raw.githubusercontent.com。現有工具仍可照常使用。'); }
  if (response.status === 401) throw Error('公開更新來源無法讀取，請聯絡工具維護者確認發布設定。');
  if (response.status === 404) throw Error('尚未取得更新檔，請稍後重試或聯絡工具維護者確認新版已發布。');
  if (response.status === 403 || response.status === 429) throw Error('GitHub 暫時限制連線，請稍後再試。現有工具仍可照常使用。');
  if (!response.ok) throw Error('GitHub 讀取失敗（' + response.status + '），請稍後再試。');
  if (response.redirected || (response.url && response.url !== url)) throw Error('更新來源轉址，已停止下載');
  if (Number(response.headers.get('content-length')) > max) throw Error('更新檔過大');
  if (!response.body) throw Error('更新來源沒有回傳檔案');
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) throw Error('更新檔過大');
      chunks.push(value);
    }
  } finally {
    // Cancellation must not replace the real size/transport error.
    try { await reader.cancel(); } catch {}
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export function validateIndex(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.toolId !== TOOL_ID || value.format !== config.releaseFormat
    || typeof value.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.sha256)
    || !Number.isSafeInteger(value.size) || value.size < 1 || value.size > MAX_BYTES * 2) throw Error('更新公告格式無效');
  compareVersion(value.version, value.version);
  if (value.packagePath !== `updates/${config.slug}/packages/${value.version}.json`) throw Error('更新公告版本與檔名不一致');
  // Only known metadata may enter the updater state; never take URLs or callbacks.
  return {format: value.format, toolId: value.toolId, version: value.version, packagePath: value.packagePath,
    sha256: value.sha256, size: value.size, notes: String(value.notes || '').slice(0, 4000)};
}

export function parseIndex(bytes) { return validateIndex(JSON.parse(decoder.decode(bytes))); }

export async function downloadRelease(release, current, {fetcher = fetch} = {}) {
  const index = validateIndex(release);
  const bytes = await githubFile(index.packagePath, {fetcher, max: index.size});
  if (bytes.length !== index.size || await sha256(bytes) !== index.sha256)
    throw Error('更新包與公告不一致，未更動工具。請重新檢查新版。');
  const validated = await validatePackage(JSON.parse(decoder.decode(bytes)), current);
  if (validated.version !== index.version) throw Error('下載的版本與公告不一致');
  return validated;
}
