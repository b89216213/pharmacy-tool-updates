// Real Chromium, IndexedDB transactions and OPFS handles. Chrome runtime, native
// directory picker, hospital services and GitHub transport are simulated.
const {chromium} = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'scripts/updater-tools.json')));
const checks = [], errors = [];
const fixtures = new Map();
for (const tool of registry) {
  const extension = path.join(root, tool.directory), config = tool.config;
  const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json')));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, `updates/${config.slug}/packages/${manifest.version}.json`)));
  const version = manifest.version.split('.').map((v, i, all) => i === all.length - 1 ? Number(v) + 1 : v).join('.');
  const next = structuredClone(pkg); next.version = version;
  const content = Buffer.from(JSON.stringify({...manifest, version}));
  Object.assign(next.files.find(f => f.path === 'manifest.json'), {base64: content.toString('base64'), size: content.length, sha256: crypto.createHash('sha256').update(content).digest('hex')});
  const packageBytes = Buffer.from(JSON.stringify(next));
  const release = {format: config.releaseFormat, toolId: config.toolId, version, notes: '更新流程測試',
    packagePath: `updates/${config.slug}/packages/${version}.json`, size: packageBytes.length,
    sha256: crypto.createHash('sha256').update(packageBytes).digest('hex')};
  const entry = fs.readFileSync(path.join(extension, config.entry), 'utf8');
  const dialog = entry.match(/<dialog\b[^>]*id="update-dialog"[\s\S]*?<\/dialog>/)?.[0];
  assert(dialog, config.slug + ': original update dialog missing');
  fixtures.set(config.slug, {tool, manifest, pkg, next, release, dialog});
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/setup') { res.setHeader('Content-Type', 'text/html'); res.end('<title>Updater fixture</title>'); return; }
  if (url.pathname.startsWith('/fixture/')) {
    const f = fixtures.get(url.pathname.split('/').at(-1));
    if (!f) { res.writeHead(404); res.end(); return; }
    const base = '/' + f.tool.directory;
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>更新流程測試</title>
      <style>body{font:16px/1.6 sans-serif;padding:24px;color:#243640}button,input{font:inherit;padding:8px}dialog{width:min(560px,85vw);border:1px solid #cbd8df;border-radius:12px;padding:24px}dialog::backdrop{background:#1c29384d}.update-error{color:#983e32}.update-actions{display:flex;gap:8px;margin:16px 0}[hidden]{display:none!important}.primary{background:#176853;color:white;border:1px solid #176853;border-radius:6px}</style>
      <h1>${f.tool.config.displayName}：更新流程測試</h1><button id="open-update">工具更新</button><input id="editing" aria-label="測試輸入欄位"><main id="clinical-app">合成作業資料保留測試</main>
      ${f.dialog}<dialog id="other-dialog"><button id="other-close" onclick="this.parentNode.close()">關閉其他作業</button></dialog>
      <script type="module">import {mountUpdater} from '${base}/updater.js';
      if(localStorage.getItem('fixtureEditing'))document.getElementById('editing').focus();
      try { await mountUpdater({isBusy:()=>!!window.fixtureBusy,prepare:async()=>{window.fixturePrepared=(window.fixturePrepared||0)+1;document.getElementById('clinical-app').inert=true;},finish:async()=>{window.fixtureFinished=(window.fixtureFinished||0)+1;document.getElementById('clinical-app').inert=false;}});window.fixtureMounted=true;}
      catch(error){window.fixtureMountError=error.message;throw error;}</script></html>`);
    return;
  }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.json') ? 'application/json' : 'text/plain');
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    for (const f of fixtures.values()) {
      browser = await chromium.launch({headless: true, executablePath: process.env.QA_CHROMIUM_PATH,
        args: ['--single-process', '--no-zygote', '--in-process-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
      const slug = f.tool.config.slug, context = await browser.newContext({viewport: {width: 1200, height: 850}, locale: 'zh-TW', timezoneId: 'Asia/Taipei'});
      const page = await context.newPage();
      const done = name => { checks.push(slug + ': ' + name); console.log('PASS', checks.at(-1)); };
      page.on('pageerror', error => errors.push(slug + ': ' + error.message));
      await context.addInitScript(({manifest, release, next, config}) => {
        const nativeFetch = fetch.bind(window);
        const nativeInterval = setInterval.bind(window);
        window.setInterval = (fn, delay, ...args) => { if (delay === 6 * 60 * 60 * 1000) window.fixtureCheck = () => fn(...args); return nativeInterval(fn, delay, ...args); };
        window.fixtureRelease = structuredClone(release); window.fixturePackage = next;
        window.fixtureRequests = []; window.fixturePickerCount = 0;
        window.fixtureGetDirectory = async name => (await navigator.storage.getDirectory()).getDirectoryHandle(name || 'installed', {create: true});
        window.fixtureRead = async (directory, file) => { const parts = file.split('/'); for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part); return (await directory.getFileHandle(parts.at(-1))).getFile(); };
        FileSystemDirectoryHandle.prototype.queryPermission = async () => window.fixtureDeny ? 'prompt' : 'granted';
        FileSystemDirectoryHandle.prototype.requestPermission = async () => window.fixtureDeny ? 'denied' : 'granted';
        const storage = {async get(key) { return {[key]: JSON.parse(localStorage.getItem(key) || 'null')}; }, async set(values) { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, JSON.stringify(value)); }};
        window.chrome = {runtime: {id: 'fixture', getManifest: () => ({...manifest, version: localStorage.getItem('fixtureVersion') || manifest.version}),
          getURL: file => location.origin + '/installed/' + file,
          getContexts: async () => [{documentUrl: location.origin + '/installed/' + config.entry}],
          async sendMessage() { return {ok: true}; },
          reload() { localStorage.setItem('fixtureReloads', String(Number(localStorage.getItem('fixtureReloads') || 0) + 1));
            void fixtureGetDirectory().then(dir => fixtureRead(dir, 'manifest.json')).then(file => file.text()).then(text => {
              localStorage.setItem('fixtureVersion', JSON.parse(text).version); location.reload();
            }); }
        }, storage: {local: storage, session: {async get() { return {}; }}, onChanged: {addListener() {}}}};
        window.fetch = async (url, options) => {
          if (String(url).startsWith('https://raw.githubusercontent.com/')) {
            window.fixtureRequests.push({url, options});
            if (window.fixtureOffline) throw Error('offline');
            return new Response(JSON.stringify(String(url).includes('/packages/') ? window.fixturePackage : window.fixtureRelease));
          }
          if (String(url).startsWith(location.origin + '/installed/')) {
            try { return new Response(await fixtureRead(await fixtureGetDirectory(), decodeURIComponent(String(url).split('/installed/')[1]))); }
            catch { return new Response('', {status: 404}); }
          }
          return nativeFetch(url, options);
        };
        window.showDirectoryPicker = async () => {
          window.fixturePickerCount++;
          if (window.fixtureHoldPicker) await new Promise(resolve => { window.fixtureReleasePicker = resolve; });
          return fixtureGetDirectory(window.fixtureWrongFolder ? 'copy' : 'installed');
        };
      }, {manifest: f.manifest, release: f.release, next: f.next, config: f.tool.config});
      await page.goto(origin + '/setup');
      await page.evaluate(async ({files, base, config}) => {
        const dir = await fixtureGetDirectory();
        for (const name of ['installed', 'copy']) {
          for (const file of files) {
            let directory = await fixtureGetDirectory(name); const parts = file.path.split('/');
            for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part, {create: true});
            const writer = await (await directory.getFileHandle(parts.at(-1), {create: true})).createWritable();
            await writer.write(Uint8Array.from(atob(file.base64), c => c.charCodeAt(0))); await writer.close();
          }
        }
        const {updateStore} = await import(base + '/update-store.js');
        await updateStore('put', 'directory', dir);
        await updateStore('put', 'installationDirectoryV2', {toolName: chrome.runtime.getManifest().name, directory: dir});
        await updateStore('put', 'token', 'SYNTHETIC_OBSOLETE_TOKEN');
        localStorage.setItem('clinicalData', '{"records":["SYNTHETIC LOCAL DATA"]}');
        localStorage.setItem('fixtureEditing','yes');
      }, {files: f.pkg.files, base: '/' + f.tool.directory, config: f.tool.config});
      await page.goto(origin + '/fixture/' + slug);
      await page.waitForFunction(() => window.fixtureMounted && !document.getElementById('update-check').disabled);
      assert.equal(await page.locator('#update-dialog').isVisible(), false);
      await page.evaluate(() => {document.getElementById('other-dialog').showModal();document.getElementById('editing').blur();localStorage.removeItem('fixtureEditing');});
      await page.waitForTimeout(1100);
      assert.equal(await page.locator('#update-dialog').isVisible(), false);
      await page.locator('#other-close').click();
      await page.evaluate(() => document.activeElement.blur());
      await page.locator('#update-dialog').waitFor();
      done('automatic reminder waits for field editing and other dialogs');
      assert((await page.locator('#update-version').innerText()).includes(f.manifest.version));
      assert(await page.locator('#update-apply').isEnabled());
      assert.equal(await page.evaluate(async base => (await import(base + '/update-store.js')).updateStore('get', 'token'), '/' + f.tool.directory), undefined);
      done('real dialog mounts, preserves database and removes obsolete credential');
      await page.locator('#update-close').click();
      await page.evaluate(() => window.fixtureCheck());
      await page.waitForFunction(() => !document.getElementById('update-check').disabled);
      await page.waitForTimeout(1100);
      assert.equal(await page.locator('#update-dialog').isVisible(), false);
      await page.locator('#open-update').click();
      done('closing reminder suppresses repeated prompts in same window');
      await page.evaluate(() => { window.fixtureOffline = true; });
      await page.locator('#update-check').click();
      await page.locator('#update-status').filter({hasText: '無法連線'}).waitFor();
      assert(await page.locator('#update-apply').isDisabled());
      await page.evaluate(() => { window.fixtureOffline = false; });
      await page.locator('#update-check').click(); await page.waitForFunction(() => !document.getElementById('update-apply').disabled);
      done('offline check disables cached install; fresh retry restores it');
      await page.evaluate(() => { window.fixtureWrongFolder = true; });
      await page.locator('#update-folder').click();
      await page.waitForFunction(() => !document.getElementById('update-folder').disabled && document.getElementById('update-status').classList.contains('update-error'));
      assert((await page.locator('#update-directory').innerText()).includes('installed'));
      await page.evaluate(() => { window.fixtureWrongFolder = false; window.fixtureHoldPicker = true; document.getElementById('update-folder').click(); document.getElementById('update-folder').click(); });
      await page.waitForFunction(() => !!window.fixtureReleasePicker);
      assert.equal(await page.evaluate(() => window.fixturePickerCount), 2);
      await page.evaluate(() => window.fixtureReleasePicker());
      await page.locator('#update-status').filter({hasText: '已確認小工具'}).waitFor();
      done('copied directory rejected; double-click opens one pending picker');
      await page.evaluate(() => { window.fixtureDeny = true; });
      await page.locator('#update-apply').click();
      await page.locator('#update-status').filter({hasText: '未取得資料夾'}).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem('fixtureReloads')), null);
      await page.evaluate(() => { window.fixtureDeny = false; });
      done('denied write permission leaves installation intact');
      const before = await page.evaluate(() => localStorage.getItem('clinicalData'));
      // Simulate an interrupted, completely written update without browser reload.
      await page.evaluate(async base => {
        const core = await import(base + '/update-core.js'), {updateStore} = await import(base + '/update-store.js');
        const directory = await fixtureGetDirectory();
        const validated = await core.validatePackage(window.fixturePackage, chrome.runtime.getManifest());
        await core.applyPackage(directory, validated, {journalDirectory: directory, saveJournal: value => updateStore('put', 'journal', value), clearJournal: () => updateStore('delete', 'journal')});
      }, '/' + f.tool.directory);
      await page.reload();
      await page.waitForFunction(() => window.fixtureMounted);
      await page.locator('#open-update').click();
      assert(await page.locator('#update-folder').isDisabled());
      assert(await page.locator('#update-recover').isVisible());
      await page.locator('#update-recover').click();
      await page.waitForFunction(version => window.fixtureMounted && document.getElementById('update-version').textContent.includes(version) && Number(localStorage.getItem('fixtureReloads')) === 1, f.manifest.version);
      await page.waitForFunction(() => !document.getElementById('update-check').disabled);
      assert.equal(await page.evaluate(() => localStorage.getItem('clinicalData')), before);
      done('persisted OPFS handle and IndexedDB journal restore interrupted update and reload original');
      if (!await page.locator('#update-dialog').isVisible()) await page.locator('#open-update').click();
      if (slug === 'patch-recovery') await page.screenshot({path: path.join(root, 'docs/updater-dialog-check.png')});
      await page.evaluate(() => { document.getElementById('update-apply').click(); document.getElementById('update-apply').click(); });
      await page.waitForFunction(version => window.fixtureMounted && document.getElementById('update-version').textContent.includes(version) && Number(localStorage.getItem('fixtureReloads')) === 2, f.release.version);
      await page.waitForFunction(() => !document.getElementById('update-check').disabled);
      assert.equal(await page.evaluate(async base => (await import(base + '/update-store.js')).updateStore('get', 'journal'), '/' + f.tool.directory), undefined);
      assert.equal(await page.evaluate(() => localStorage.getItem('clinicalData')), before);
      done('one update per double-click; reopened source hashes verified; records unchanged');
      await browser.close(); browser = null;
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(root, 'docs/updater-browser-results.json'), JSON.stringify({passed: checks.length, checks,
      scope: 'Real Chromium/IndexedDB/OPFS; simulated Chrome runtime, OS picker, GitHub and hospital services.',
      windowsDefenderScanned: false, browserErrors: errors}, null, 2) + '\n');
    console.log(checks.length + ' browser checks passed');
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
