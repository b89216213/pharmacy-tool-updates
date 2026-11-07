import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const tools = JSON.parse(await readFile(path.join(root, 'scripts/updater-tools.json'), 'utf8'));
export const missing = () => Object.assign(Error('missing'), {name: 'NotFoundError'});
export const bytes = value => typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);

export function directory(initial = {}, options = {}) {
  const files = new Map(Object.entries(initial).map(([key, value]) => [key, bytes(value)]));
  const token = {}, events = [];
  let writes = 0, sourceWrites = 0;
  function handle(prefix) {
    return {kind: 'directory', name: options.name || 'extension', token,
      async isSameEntry(other) { return token === other.token; },
      async queryPermission() { return options.permission || 'granted'; },
      async requestPermission() { return options.requested || options.permission || 'granted'; },
      async getDirectoryHandle(name, {create = false} = {}) {
        if (!create && ![...files.keys()].some(key => key.startsWith(prefix + name + '/'))) throw missing();
        return handle(prefix + name + '/');
      },
      async getFileHandle(name, {create = false} = {}) {
        const key = prefix + name;
        if (!files.has(key)) { if (!create) throw missing(); files.set(key, new Uint8Array()); }
        return {async getFile() { return new Blob([files.get(key)]); }, async createWritable() {
          let buffer;
          return {async write(value) {
            writes++;
            const proof = key.includes('-folder-proof-');
            if (!proof) sourceWrites++;
            events.push({type: 'write', path: key});
            if (options.failAt === sourceWrites && !proof || options.failPaths?.has(key))
              throw Object.assign(Error('disk failure'), {name: options.errorName || 'Error'});
            buffer = bytes(value);
          }, async close() { files.set(key, buffer); }, async abort() {}};
        }};
      },
      async removeEntry(name) {
        const key = prefix + name;
        events.push({type: 'remove', path: key});
        if (options.failPaths?.has(key)) throw Error('delete failure');
        if (!files.delete(key)) throw missing();
      }
    };
  }
  return {dir: handle(''), files, options, events, get writes() { return writes; }, get sourceWrites() { return sourceWrites; },
    snapshot() { return Object.fromEntries([...files].map(([key, value]) => [key, Buffer.from(value).toString('base64')])); }};
}

// Simulate IndexedDB cloning of a directory handle without cloning its methods.
function copy(value) {
  if (value?.directory) {
    const {directory, ...rest} = value;
    return {...structuredClone(rest), directory};
  }
  return structuredClone(value);
}
export function memoryStore(initial = {}) {
  const data = new Map(Object.entries(initial)), calls = [];
  const store = async (action, key, value) => {
    calls.push({action, key});
    if (store.fail?.(action, key, value)) throw Error('storage failure');
    if (action === 'get') return copy(data.get(key));
    if (action === 'put') data.set(key, copy(value));
    else if (action === 'delete') data.delete(key);
  };
  return Object.assign(store, {data, calls});
}
export function webLocks() {
  const active = new Set();
  return {active, async request(key, options, callback) {
    if (active.has(key)) return callback(null);
    active.add(key);
    try { return await callback({name: key}); } finally { active.delete(key); }
  }};
}

export async function fixture(tool) {
  const extension = path.join(root, tool.directory);
  const core = await import(path.join(extension, 'update-core.js'));
  const network = await import(path.join(extension, 'update-network.js'));
  const sessionModule = await import(path.join(extension, 'update-session.js'));
  const current = JSON.parse(await readFile(path.join(extension, 'manifest.json')));
  const old = JSON.parse(await readFile(path.join(root, 'updates', tool.config.slug, 'packages', tool.baselineVersion + '.json')));
  const version = current.version.split('.').map((value, index, values) => index === values.length - 1 ? Number(value) + 1 : value).join('.');
  const next = structuredClone(old);
  next.version = version;
  async function replace(pkg, filePath, value) {
    const data = bytes(typeof value === 'object' && !(value instanceof Uint8Array) ? JSON.stringify(value) : value);
    const record = {path: filePath, size: data.length, sha256: await core.sha256(data), base64: Buffer.from(data).toString('base64')};
    const index = pkg.files.findIndex(file => file.path === filePath);
    if (index === -1) pkg.files.push(record); else pkg.files[index] = record;
    return pkg;
  }
  await replace(next, 'manifest.json', {...current, version});
  const packageBytes = bytes(JSON.stringify(next));
  const release = {format: tool.config.releaseFormat, toolId: tool.config.toolId, version,
    notes: 'Synthetic update', packagePath: `updates/${tool.config.slug}/packages/${version}.json`,
    size: packageBytes.length, sha256: await core.sha256(packageBytes)};
  const installed = Object.fromEntries(old.files.map(file => [file.path, Buffer.from(file.base64, 'base64')]));
  installed['manifest.json'] = JSON.stringify(current);
  const disk = directory({...installed, 'personal-backup.json': 'SYNTHETIC LOCAL BACKUP'});
  const store = memoryStore(), locks = webLocks();
  const local = {clinicalRecords: 'SYNTHETIC PATIENT DATA'}, session = {patchSource: {id: 17}, cartSource: {sourceId: 19, origin: 'https://portal.ntuh.gov.tw'}};
  const state = {busy: false, prepared: 0, finished: 0, reloads: 0, requests: [], messages: [], stages: []};
  const browser = {runtime: {
    id: 'fixture', getURL: file => 'chrome-extension://fixture/' + file,
    getContexts: async () => state.contexts || [{documentUrl: 'chrome-extension://fixture/' + tool.config.entry + '?source=7#update'}],
    reload() { state.reloads++; if (state.reloadFailure) throw Error('reload failure'); },
    async sendMessage(message) { state.messages.push(message); return {ok: true}; }
  }, storage: {local: {async set(value) { if (state.localFailure) throw Error('local full'); Object.assign(local, value); }},
    session: {async get(key) { return {[key]: session[key]}; }}}};
  async function fetcher(url, options) {
    state.requests.push({url, options});
    if (state.offline) throw Error('offline');
    if (url.endsWith('/latest.json')) return new Response(JSON.stringify(state.release || release));
    return new Response(packageBytes);
  }
  const installedRead = path => core.readFile(disk.dir, path);
  function createSession(overrides = {}) {
    return sessionModule.createUpdateSession({current, isBusy: () => state.busy,
      prepare: async () => { state.prepared++; if (state.prepareFailure) throw Error('prepare failure'); },
      finish: async () => { state.finished++; if (state.finishGate) await state.finishGate; },
      onProgress: message => state.stages.push(message), store, installed: installedRead,
      browser, locks, fetcher, pageLocation: {search: '?source=7&origin=https%3A%2F%2Fportal.ntuh.gov.tw'}, ...overrides});
  }
  return {tool, core, network, sessionModule, current, version, next, release, packageBytes,
    old, replace, disk, store, locks, local, state, browser, fetcher, installedRead, createSession};
}
