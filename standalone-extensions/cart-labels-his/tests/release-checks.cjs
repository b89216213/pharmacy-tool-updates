// Run from any directory: node standalone-extensions/cart-labels-his/tests/release-checks.cjs
// Uses only Node built-ins. It never opens a browser or contacts a backend.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash, webcrypto} = require('node:crypto');
const {inflateRawSync} = require('node:zlib');
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const project = path.resolve(__dirname, '..');
const repo = path.resolve(project, '../..');
const extension = path.join(project, 'extension');
const version = '2.17.0';
const previousVersion = '2.10.0';
const toolId = 'ntuh-cart-labels-his';
const checks = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const done = name => {checks.push(name); console.log('PASS ' + name);};
const moduleFrom = source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const packagePath = `updates/cart-labels-his/packages/${version}.json`;
const packageBytes = fs.readFileSync(path.join(repo, packagePath));
const pkg = JSON.parse(packageBytes);
const oldPackage = json(path.join(repo, `updates/cart-labels-his/packages/${previousVersion}.json`));
const latest = json(path.join(repo, 'updates/cart-labels-his/latest.json'));
const manifest = json(path.join(extension, 'manifest.json'));
const payload = new Map();

function packageFile(source, name) {
  const entry = source.files.find(file => file.path === name);
  assert(entry, 'Missing package entry: ' + name);
  const bytes = Buffer.from(entry.base64, 'base64');
  assert.equal(bytes.length, entry.size, name + ' size');
  assert.equal(sha(bytes), entry.sha256, name + ' hash');
  return bytes;
}

function memoryDirectory(initial, options = {}) {
  const files = new Map(Object.entries(initial).map(([name, value]) => [name, Buffer.from(value)]));
  let writes = 0;
  const order = [];
  const missing = () => Object.assign(new Error('Synthetic missing entry'), {name:'NotFoundError'});
  const handle = prefix => ({
    kind:'directory', name:prefix || 'extension',
    async getDirectoryHandle(name, {create = false} = {}) {
      if (!create && ![...files.keys()].some(key => key.startsWith(prefix + name + '/'))) throw missing();
      return handle(prefix + name + '/');
    },
    async getFileHandle(name, {create = false} = {}) {
      const key = prefix + name;
      if (!files.has(key)) {if (!create) throw missing(); files.set(key, Buffer.alloc(0));}
      return {
        async getFile() {return new Blob([files.get(key)]);},
        async createWritable() {
          let pending;
          return {
            async write(bytes) {
              writes++;
              if (writes === options.failAt) throw Object.assign(new Error('Synthetic storage failure'), {name:'QuotaExceededError'});
              pending = Buffer.from(bytes);
            },
            async close() {files.set(key, pending); order.push(key);},
            async abort() {}
          };
        }
      };
    },
    async removeEntry(name) {if (!files.delete(prefix + name)) throw missing();}
  });
  return {dir:handle(''), files, order, get writes() {return writes;}};
}

function revisedPackage(changes) {
  const result = structuredClone(pkg);
  for (const [name, text] of Object.entries(changes)) {
    const bytes = Buffer.from(text);
    Object.assign(result.files.find(file => file.path === name), {
      size:bytes.length, sha256:sha(bytes), base64:bytes.toString('base64')
    });
  }
  return result;
}

// Read only the small ZIP format used by this release; never extract paths.
function zipEntries(bytes) {
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) {end = i; break;}
  }
  assert(end >= 0, 'ZIP end record');
  assert.equal(bytes.readUInt16LE(end + 4), 0, 'Single-disk ZIP');
  const count = bytes.readUInt16LE(end + 10);
  let at = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(at), 0x02014b50, 'ZIP central header');
    const flags = bytes.readUInt16LE(at + 8), method = bytes.readUInt16LE(at + 10);
    const compressed = bytes.readUInt32LE(at + 20), size = bytes.readUInt32LE(at + 24);
    const nameSize = bytes.readUInt16LE(at + 28), extraSize = bytes.readUInt16LE(at + 30), commentSize = bytes.readUInt16LE(at + 32);
    const local = bytes.readUInt32LE(at + 42), name = bytes.subarray(at + 46, at + 46 + nameSize).toString('utf8');
    assert.equal(flags & 1, 0, 'Unencrypted ZIP');
    assert([0, 8].includes(method), 'Supported ZIP compression');
    assert(size <= 6 * 1024 * 1024, 'ZIP entry size cap');
    assert(!entries.has(name), 'Unique ZIP entries');
    assert.equal(bytes.readUInt32LE(local), 0x04034b50, 'ZIP local header');
    const localNameSize = bytes.readUInt16LE(local + 26), localExtraSize = bytes.readUInt16LE(local + 28);
    assert.equal(bytes.subarray(local + 30, local + 30 + localNameSize).toString('utf8'), name);
    const start = local + 30 + localNameSize + localExtraSize;
    assert(start + compressed <= bytes.length, 'ZIP compressed range');
    const data = bytes.subarray(start, start + compressed);
    const output = method === 0 ? data : inflateRawSync(data, {maxOutputLength:6 * 1024 * 1024});
    assert.equal(output.length, size, name + ' ZIP size');
    entries.set(name, output);
    at += 46 + nameSize + extraSize + commentSize;
  }
  return entries;
}

(async () => {
  assert.equal(oldPackage.version, previousVersion);
  assert.equal(oldPackage.toolId, toolId);
  const oldManifest = JSON.parse(packageFile(oldPackage, 'manifest.json'));
  const oldCore = await moduleFrom(packageFile(oldPackage, 'update-core.js'));
  const core = await moduleFrom(fs.readFileSync(path.join(extension, 'update-core.js')));
  assert.equal(manifest.version, version);
  assert.equal(pkg.version, version);
  assert.equal(pkg.toolId, toolId);
  assert.equal(pkg.format, 'cart-labels-his-update-v1');
  assert.equal(latest.version, version);
  assert.equal(latest.toolId, toolId);
  assert.equal(latest.format, 'cart-labels-his-release-v1');
  assert.equal(latest.packagePath, packagePath);
  assert.equal(latest.size, packageBytes.length);
  assert.equal(latest.sha256, sha(packageBytes));
  for (const file of pkg.files) {
    assert(!payload.has(file.path), 'Unique package paths');
    const bytes = packageFile(pkg, file.path);
    assert.deepEqual(fs.readFileSync(path.join(extension, file.path)), bytes, 'Package matches extension: ' + file.path);
    payload.set(file.path, bytes);
  }
  const releaseFiles = json(path.join(project, 'release-files.json'));
  assert.deepEqual([...payload.keys()].sort(), releaseFiles.files.slice().sort());
  const accepted = await oldCore.validatePackage(pkg, oldManifest);
  await core.validatePackage(pkg, oldManifest);
  assert.equal(accepted.version, version);
  assert(pkg.files.length <= 80, 'Original updater file limit');
  assert(payload.has('manager.html'), 'Original updater entry remains available');
  for (const key of ['name','permissions','host_permissions','optional_permissions','optional_host_permissions','key','content_security_policy','externally_connectable']) {
    assert.deepEqual(manifest[key], oldManifest[key], 'Original identity/access preserved: ' + key);
  }
  assert.deepEqual(manifest.content_scripts.flatMap(s => s.matches), oldManifest.content_scripts.flatMap(s => s.matches));
  done('Actual release hashes, payload, identity and access pass the original 2.10.0 package validator');

  for (const change of [
    {permissions:[...manifest.permissions, 'debugger']},
    {content_security_policy:{extension_pages:"script-src 'self'"}},
    {content_scripts:[{matches:['https://different.test/*'], js:['arm.js']}]}
  ]) await assert.rejects(oldCore.validatePackage(revisedPackage({'manifest.json':JSON.stringify({...manifest, ...change})}), oldManifest));
  for (const name of ['manager.html', 'background.js']) await assert.rejects(oldCore.validatePackage({...pkg, files:pkg.files.filter(file => file.path !== name)}, oldManifest));
  const damaged = structuredClone(pkg); damaged.files[0].sha256 = '0'.repeat(64);
  await assert.rejects(core.validatePackage(damaged, oldManifest));
  done('Extra permissions, changed CSP/scope, required-file omissions and corrupted bytes are rejected');

  const missingReferences = [];
  function reference(from, value) {
    if (!value || /^(?:[a-z]+:|#)/i.test(value)) return;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), value.split(/[?#]/)[0]));
    if (!payload.has(target)) missingReferences.push(from + ' -> ' + value);
  }
  for (const [name, bytes] of payload) {
    const text = bytes.toString('utf8');
    if (name.endsWith('.html')) for (const match of text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) reference(name, match[1]);
    if (name.endsWith('.css')) for (const match of text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) reference(name, match[1]);
    if (name.endsWith('.js')) {
      for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)) reference(name, match[1]);
      for (const match of text.matchAll(/runtime\.getURL\('([^']+)'\)/g)) assert(payload.has(match[1]), name + ' -> ' + match[1]);
      for (const match of text.matchAll(/files:\s*\[([^\]]+)\]/g)) for (const quoted of match[1].matchAll(/'([^']+)'/g)) assert(payload.has(quoted[1]), name + ' -> ' + quoted[1]);
    }
  }
  for (const file of [manifest.background.service_worker, manifest.options_ui?.page, ...(manifest.content_scripts || []).flatMap(s => s.js || []), ...Object.values(manifest.icons || {})].filter(Boolean)) assert(payload.has(file), 'Manifest reference: ' + file);
  const {CONFIG} = await moduleFrom(payload.get('tool-config.js'));
  for (const page of ['labels/index.html', 'labels/memory.html']) for (const file of CONFIG.pageScripts[page].filter(file => page !== 'labels/index.html' || file !== 'bridge.js')) reference(page, file);
  for (const match of payload.get('workspace-launch.js').toString().matchAll(/await classic\('([^']+)'\)/g)) reference('labels/index.html', match[1]);
  assert.deepEqual(missingReferences, []);
  done('HTML, module imports, CSS assets, manifest entries, classic launch lists and injected scripts are present');

  const originals = {'manifest.json':JSON.stringify(oldManifest), 'labels/index.html':'original labels', 'local-backup.txt':'SYNTHETIC LOCAL BACKUP'};
  const success = memoryDirectory(originals); let journal;
  await core.applyPackage(success.dir, accepted, {
    saveJournal:async value => {if (!journal) assert.equal(success.writes, 0); journal = structuredClone(value);},
    clearJournal:async () => {journal = null;}
  });
  assert.equal(success.order.at(-1), 'manifest.json');
  assert.equal(journal.phase, 'written');
  assert.equal(success.files.get('local-backup.txt').toString(), originals['local-backup.txt']);
  const failure = memoryDirectory(originals, {failAt:7}); let recovery;
  await assert.rejects(core.applyPackage(failure.dir, accepted, {
    saveJournal:async value => {recovery = structuredClone(value);}, clearJournal:async () => {recovery = null;}
  }), /已還原/);
  assert.equal(recovery, null);
  assert.deepEqual(Object.fromEntries([...failure.files].map(([name, bytes]) => [name, bytes.toString()])), originals);
  const unavailable = memoryDirectory(originals);
  await assert.rejects(core.applyPackage(unavailable.dir, accepted, {
    saveJournal:async () => {throw new Error('Synthetic journal failure');}, clearJournal:async () => {}
  }), /Synthetic journal failure/);
  assert.equal(unavailable.writes, 0);
  done('Originals are journaled first, manifest commits last, failed writes restore exact bytes and unavailable journals prevent mutation');

  const zip = zipEntries(fs.readFileSync(path.join(repo, `downloads/cart-labels-his-v${version}.zip`)));
  assert.equal(zip.size, payload.size);
  for (const [name, bytes] of payload) assert.deepEqual(zip.get('extension/' + name), bytes, 'ZIP/package agreement: ' + name);
  done('Download ZIP contains exactly the verified update payload');

  const output = path.join(project, 'docs/check-results.json');
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.writeFileSync(output, JSON.stringify({version, previousVersion, passed:checks.length,
    scope:'Offline release validation with Node built-ins and synthetic filesystem failure injection; no backend, browser or hospital access.', checks}, null, 2) + '\n');
  console.log(`${checks.length} release checks passed`);
})().catch(error => {console.error(error); process.exitCode = 1;});
