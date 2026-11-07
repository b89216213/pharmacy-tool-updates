import {UPDATE_CONFIG as config} from './update-config.js';

// Preserve each tool's existing database name, version and keys for migration.
let opened;
function database() {
  if (opened) return opened;
  const pending = new Promise((resolve, reject) => {
    const request = indexedDB.open(config.database, 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore('local');
    request.onblocked = () => { blocked = true; reject(Error('更新資料庫仍由其他視窗使用，請關閉其他工具視窗後重試。')); };
    request.onerror = () => reject(request.error || Error('無法開啟更新資料庫'));
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return; }
      request.result.onversionchange = () => { request.result.close(); opened = undefined; };
      request.result.onclose = () => { opened = undefined; };
      resolve(request.result);
    };
  });
  opened = pending;
  pending.catch(() => { if (opened === pending) opened = undefined; });
  return pending;
}

export async function updateStore(action, key, value) {
  if (!['get', 'put', 'delete'].includes(action) || typeof key !== 'string' || !key) throw Error('更新資料操作無效');
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('local', action === 'get' ? 'readonly' : 'readwrite');
    const store = transaction.objectStore('local');
    const request = action === 'get' ? store.get(key) : action === 'delete' ? store.delete(key) : store.put(value, key);
    // Resolve only after the entire transaction commits, never at request success.
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error || Error('更新資料無法保存'));
    transaction.onabort = () => reject(transaction.error || Error('更新資料無法保存'));
  });
}
