import assert from 'node:assert/strict';
import {test, describe} from 'node:test';
import {tools, fixture, directory, bytes, webLocks} from './updater-fixtures.mjs';

for (const tool of tools) describe(tool.config.slug, () => {
  test('published package remains readable; valid upgrade preserves manifest capability boundary', async () => {
    const f = await fixture(tool);
    const publishedManifest = JSON.parse(Buffer.from(f.old.files.find(file => file.path === 'manifest.json').base64, 'base64').toString('utf8'));
    assert.equal((await f.core.validatePackage(f.old, publishedManifest, {allowSame: true})).files.length, f.old.files.length);
    assert.equal((await f.core.validatePackage(f.next, f.current)).version, f.version);
    await assert.rejects(f.core.validatePackage(f.next, {...f.current, version: f.version}));
  });

  test('malformed metadata, traversal, Windows aliases, duplicates, limits and hashes fail before writes', async () => {
    const f = await fixture(tool);
    const invalid = [pkg => pkg.toolId = 'other', pkg => pkg.files = null, pkg => pkg.files[0] = null,
      pkg => pkg.files[0].path = '../outside.js', pkg => pkg.files[0].path = 'C:/outside.js',
      pkg => pkg.files[0].path = 'a\\b.js', pkg => pkg.files[0].path = 'a/CON.js',
      pkg => pkg.files[0].path = 'a/aux.txt', pkg => pkg.files[0].path = 'a/b./c.js',
      pkg => pkg.files[0].path = 'a.js:stream', pkg => pkg.files.push({...pkg.files[0], path: pkg.files[0].path.toUpperCase()}),
      pkg => pkg.files[0].sha256 = '0'.repeat(64), pkg => pkg.files[0].size = -1,
      pkg => pkg.files[0].size = f.core.MAX_BYTES + 1, pkg => pkg.files[0].base64 = '===' ];
    for (const mutate of invalid) { const pkg = structuredClone(f.next); mutate(pkg); await assert.rejects(f.core.validatePackage(pkg, f.current)); }
    assert.equal(f.disk.writes, 0);
  });

  test('host, permission, identity, externally exposed resources and new manifest capabilities cannot expand silently', async () => {
    const f = await fixture(tool);
    for (const change of [{permissions: [...(f.current.permissions || []), 'debugger']}, {host_permissions: ['<all_urls>']},
      {key: 'other'}, {content_security_policy: {extension_pages: "script-src 'self'"}},
      {web_accessible_resources: [{resources: ['*'], matches: ['<all_urls>']}]},
      {externally_connectable: {matches: ['https://other.example/*']}}, {unknown_future_capability: true}]) {
      const pkg = structuredClone(f.next);
      await f.replace(pkg, 'manifest.json', {...f.current, version: f.version, ...change});
      await assert.rejects(f.core.validatePackage(pkg, f.current));
    }
    if (f.current.content_scripts?.length) {
      for (const property of ['all_frames', 'match_about_blank', 'match_origin_as_fallback', 'world', 'run_at', 'exclude_matches']) {
        const manifest = structuredClone({...f.current, version: f.version});
        manifest.content_scripts[0][property] = property === 'world' ? 'UNRECOGNIZED_WORLD'
          : property === 'run_at' ? 'UNRECOGNIZED_TIME' : property === 'exclude_matches' ? ['https://example.test/*'] : !manifest.content_scripts[0][property];
        const pkg = structuredClone(f.next); await f.replace(pkg, 'manifest.json', manifest);
        await assert.rejects(f.core.validatePackage(pkg, f.current));
      }
    }
  });

  test('network permits only own index/version package, with no credentials, referrer, body or redirects', async () => {
    const f = await fixture(tool); let request;
    await f.network.githubFile(f.network.SOURCE.index, {fetcher: async (url, options) => { request = {url, options}; return new Response('{}'); }});
    assert.equal(request.options.credentials, 'omit'); assert.equal(request.options.referrerPolicy, 'no-referrer');
    assert.equal(request.options.body, undefined); assert.equal(request.options.headers.Authorization, undefined);
    assert.equal(request.options.redirect, 'error');
    for (const path of ['https://other.example/payload.json', `updates/${tool.config.slug}/other.json`,
      `updates/${tool.config.slug}/packages/../latest.json`, `updates/${tool.config.slug}/packages/1.0.json?x=1`, 'updates/other/latest.json'])
      await assert.rejects(f.network.githubFile(path));
    for (const status of [401, 403, 404, 429, 500]) await assert.rejects(f.network.githubFile(f.network.SOURCE.index, {fetcher: async () => new Response('', {status})}));
    await assert.rejects(f.network.githubFile(f.network.SOURCE.index, {max: 2, fetcher: async () => new Response('large')}), /過大/);
    await assert.rejects(f.network.githubFile(f.network.SOURCE.index, {fetcher: async () => new Response(null)}), /沒有回傳/);
    await assert.rejects(f.network.githubFile(f.network.SOURCE.index, {fetcher: async () => ({ok: true, redirected: true})}), /轉址/);
    for (const value of [null, [], {}, {...f.release, version: 'invalid'}, {...f.release, packagePath: 'https://other.test/'}, {...f.release, size: Infinity}])
      assert.throws(() => f.network.validateIndex(value));
  });

  test('copy of same-version directory fails proof, with temporary proof removed', async () => {
    const f = await fixture(tool), copy = directory(Object.fromEntries(f.disk.files));
    const before = copy.snapshot();
    await assert.rejects(f.core.verifyDirectory(copy.dir, f.current, f.installedRead));
    assert.deepEqual(copy.snapshot(), before);
  });

  test('success journals before writing, commits manifest last, binds recovery and preserves local data', async () => {
    const f = await fixture(tool), engine = f.createSession();
    await engine.run({directory: f.disk.dir, release: f.release});
    const journal = f.store.data.get('journal');
    assert.equal(journal.phase, 'written'); assert.equal(journal.toolId, tool.config.toolId);
    assert(await journal.directory.isSameEntry(f.disk.dir));
    assert.equal(f.disk.events.filter(event => event.type === 'write').at(-1).path, 'manifest.json');
    assert.equal(f.state.reloads, 1); assert.equal(f.state.finished, 0); assert.equal(engine.needsReload, true);
    assert.equal(f.local.clinicalRecords, 'SYNTHETIC PATIENT DATA');
    assert.equal(new TextDecoder().decode(f.disk.files.get('personal-backup.json')), 'SYNTHETIC LOCAL BACKUP');
    assert(f.local[tool.config.reopenKey]);
    if (tool.config.reopen === 'patch') assert.deepEqual(f.local.patchUpdateReopen.patchSource, {id: 17});
    if (tool.config.reopen === 'patient') assert.equal(f.local.pickerUpdateReopen.sourceId, 7);
    if (tool.config.reopen === 'cart') assert.equal(f.local.cartUpdateReopen.sourceId, 19);
    if (tool.config.reopen === 'discharge') assert(f.local.dischargeUpdateReopen.search.includes('source=7'));
    await assert.rejects(engine.run({directory: f.disk.dir, release: f.release}));
    const reloaded = f.createSession({current: {...f.current, version: f.version}});
    assert.equal(await reloaded.reconcile(), true); assert.equal(f.store.data.has('journal'), false);
  });

  test('post-reload content mismatch retains journal rather than trusting only manifest version', async () => {
    const f = await fixture(tool);
    await f.createSession().run({directory: f.disk.dir, release: f.release});
    const victim = f.next.files.find(file => file.path.endsWith('.js')).path;
    f.disk.files.set(victim, bytes('unexpected content'));
    await assert.rejects(f.createSession({current: {...f.current, version: f.version}}).reconcile(), /驗證/);
    assert(f.store.data.has('journal'));
  });

  test('backup storage failure or reopening metadata failure prevents source replacement', async () => {
    for (const stage of ['journal', 'reopen']) {
      const f = await fixture(tool), before = f.disk.snapshot();
      if (stage === 'journal') f.store.fail = (action, key) => action === 'put' && key === 'journal';
      else f.state.localFailure = true;
      await assert.rejects(f.createSession().run({directory: f.disk.dir, release: f.release}));
      assert.equal(f.disk.sourceWrites, 0); assert.deepEqual(f.disk.snapshot(), before);
      assert.equal(f.state.finished, 1); assert.equal(f.state.reloads, 0);
    }
  });

  test('first/middle/manifest write failures restore exact source and retain patient storage', async () => {
    for (const position of ['first', 'middle', 'manifest']) {
      const f = await fixture(tool);
      // Dirty three installed source files so the differential writer exercises
      // first/middle/final writes rather than counting unchanged package files.
      for (const file of f.next.files.filter(file => file.path.endsWith('.js')).slice(0, 3))
        f.disk.files.set(file.path, bytes('synthetic older source'));
      const original = f.disk.snapshot();
      f.disk.options.failAt = position === 'first' ? 1 : position === 'middle' ? 2 : 4;
      await assert.rejects(f.createSession().run({directory: f.disk.dir, release: f.release}), /已還原/);
      assert.deepEqual(f.disk.snapshot(), original); assert.equal(f.store.data.has('journal'), false);
      assert.equal(f.local.clinicalRecords, 'SYNTHETIC PATIENT DATA'); assert.equal(f.state.finished, 1);
    }
  });

  test('failed rollback retains backup and never rewrites manifest as if restoration succeeded', async () => {
    const f = await fixture(tool), file = f.next.files.find(file => file.path.endsWith('.js')).path;
    f.disk.files.set(file, bytes('synthetic older source'));
    f.disk.options.failPaths = new Set([file]);
    await assert.rejects(f.createSession().run({directory: f.disk.dir, release: f.release}), /還原紀錄已保留/);
    assert(f.store.data.has('journal'));
    assert(!f.disk.events.some(event => event.type === 'write' && event.path === 'manifest.json'));
    f.disk.options.failPaths.clear();
    await f.createSession().run({directory: f.disk.dir, recovery: true});
    assert.equal(f.store.data.has('journal'), false); assert.equal(f.state.reloads, 1);
  });

  test('recovery rejects changed folder and invalid journal before source mutation', async () => {
    const f = await fixture(tool);
    await f.createSession().run({directory: f.disk.dir, release: f.release});
    const copy = directory(Object.fromEntries(f.disk.files));
    await assert.rejects(f.createSession().run({directory: copy.dir, recovery: true}), /位置/);
    assert.equal(copy.writes, 0);
    const originalJournal = f.store.data.get('journal');
    for (const mutate of [journal => journal.toolId = 'other', journal => journal.originals[0].path = '../outside.js',
      journal => journal.originals[0].bytes = bytes('changed'), journal => journal.targets[0].size = -1]) {
      const {directory: bound, ...rest} = originalJournal;
      const broken = {...structuredClone(rest), directory: bound}; mutate(broken);
      f.store.data.set('journal', broken);
      const before = f.disk.writes;
      await assert.rejects(f.createSession().run({directory: f.disk.dir, recovery: true}));
      assert.equal(f.disk.writes, before);
    }
  });

  test('legacy interrupted journals recover only after live installed-folder proof', async () => {
    const f = await fixture(tool);
    await f.createSession().run({directory: f.disk.dir, release: f.release});
    const journal = f.store.data.get('journal');
    const legacy = {phase: 'writing', version: journal.version, originals: journal.originals.map(({path, bytes}) => ({path, bytes}))};
    f.store.data.set('journal', legacy);
    const copy = directory(Object.fromEntries(f.disk.files));
    await assert.rejects(f.createSession().run({directory: copy.dir, recovery: true}), /無法確認/);
    await f.createSession().run({directory: f.disk.dir, recovery: true});
    assert.equal(JSON.parse(new TextDecoder().decode(f.disk.files.get('manifest.json'))).version, f.current.version);
  });

  test('repeated click and competing window cannot enter the same update transaction', async () => {
    const f = await fixture(tool);
    let releasePermission;
    f.disk.dir.queryPermission = () => new Promise(resolve => { releasePermission = () => resolve('granted'); });
    const engine = f.createSession();
    const first = engine.run({directory: f.disk.dir, release: f.release});
    await assert.rejects(engine.run({directory: f.disk.dir, release: f.release}), /正在更新/);
    releasePermission(); await first; assert.equal(f.state.reloads, 1);
    const g = await fixture(tool), locks = webLocks();
    await locks.request(tool.config.slug + '-update', {}, async () => {
      await assert.rejects(g.createSession({locks}).run({directory: g.disk.dir, release: g.release}), /另一個視窗/);
    });
    assert.equal(g.disk.writes, 0);
  });

  test('stale UI state, busy work, duplicate page queries/hashes and withdrawn release are blocked', async () => {
    for (const condition of ['journal', 'busy', 'views', 'release']) {
      const f = await fixture(tool);
      if (condition === 'journal') f.store.data.set('journal', {phase: 'writing'});
      if (condition === 'busy') f.state.busy = true;
      if (condition === 'views') f.state.contexts = ['?source=1', '#update'].map(suffix => ({documentUrl: f.browser.runtime.getURL(tool.config.entry) + suffix}));
      if (condition === 'release') f.state.release = {...f.release, sha256: '0'.repeat(64)};
      await assert.rejects(f.createSession().run({directory: f.disk.dir, release: f.release}));
      assert.equal(f.disk.writes, 0);
    }
  });

  test('prepare failure awaits asynchronous cleanup; reload failure preserves completed state for retry', async () => {
    const f = await fixture(tool); f.state.prepareFailure = true;
    let releaseFinish;
    f.state.finishGate = new Promise(resolve => { releaseFinish = resolve; });
    const engine = f.createSession();
    const running = engine.run({directory: f.disk.dir, release: f.release});
    while (!f.state.finished) await new Promise(resolve => setImmediate(resolve));
    assert.equal(engine.running, true); releaseFinish(); await assert.rejects(running, /prepare failure/);
    assert.equal(engine.running, false); assert.equal(f.disk.writes, 0);
    const g = await fixture(tool); g.state.reloadFailure = true;
    const other = g.createSession();
    await assert.rejects(other.run({directory: g.disk.dir, release: g.release}), /檔案已完成/);
    assert.equal(other.needsReload, true); assert.equal(g.state.finished, 0); assert.equal(g.store.data.get('journal').phase, 'written');
  });
});
