import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {tools, fixture, bytes} from './updater-fixtures.mjs';

for (const tool of tools) describe(tool.config.slug + ' second review', () => {
  test('identical files are verified but never rewritten during a manifest-only update', async () => {
    const f = await fixture(tool);
    await f.createSession().run({directory: f.disk.dir, release: f.release});
    assert.deepEqual(f.disk.events.filter(e => e.type === 'write' && !e.path.includes('-folder-proof-')).map(e => e.path), ['manifest.json']);
    assert.equal(f.store.data.get('journal').targets.length, f.next.files.length);
    assert.equal(await f.createSession({current: {...f.current, version: f.version}}).reconcile(), true);
  });

  test('truncated, corrupted and interrupted downloads never create even a folder-proof file', async () => {
    for (const failure of ['truncated', 'corrupted', 'interrupted']) {
      const f = await fixture(tool), before = f.disk.snapshot();
      const fetcher = async (url, options) => {
        if (url.endsWith('/latest.json')) return f.fetcher(url, options);
        if (failure === 'truncated') return new Response(f.packageBytes.slice(0, -1));
        if (failure === 'corrupted') { const data = f.packageBytes.slice(); data[10] ^= 1; return new Response(data); }
        return new Response(new ReadableStream({start(controller) { controller.enqueue(f.packageBytes.slice(0, 100)); },
          pull(controller) { controller.error(Error('connection interrupted')); }}));
      };
      await assert.rejects(f.createSession({fetcher}).run({directory: f.disk.dir, release: f.release}));
      assert.equal(f.disk.writes, 0); assert.deepEqual(f.disk.snapshot(), before);
      assert.equal(f.store.data.has('journal'), false); assert.equal(f.state.reloads, 0);
    }
  });

  test('denied permission stops before downloads or file operations', async () => {
    const f = await fixture(tool); f.disk.options.permission = 'prompt'; f.disk.options.requested = 'denied';
    await assert.rejects(f.createSession().run({directory: f.disk.dir, release: f.release}), /權限/);
    assert.equal(f.disk.writes, 0); assert.equal(f.state.requests.length, 0); assert.equal(f.state.prepared, 0);
  });

  test('denied write and failure to persist written phase restore original bytes', async () => {
    for (const failure of ['permission', 'journal']) {
      const f = await fixture(tool), before = f.disk.snapshot();
      if (failure === 'permission') { f.disk.options.failAt = 1; f.disk.options.errorName = 'NotAllowedError'; }
      else f.store.fail = (action, key, value) => action === 'put' && key === 'journal' && value.phase === 'written';
      await assert.rejects(f.createSession().run({directory: f.disk.dir, release: f.release}), /已還原/);
      assert.deepEqual(f.disk.snapshot(), before); assert.equal(f.store.data.has('journal'), false);
      assert.equal(f.local.clinicalRecords, 'SYNTHETIC PATIENT DATA'); assert.equal(f.state.reloads, 0);
    }
  });

  test('an unchanged target modified after backup is repaired and verified before version commit', async () => {
    const f = await fixture(tool), victim = f.next.files.find(x => x.path.endsWith('.js'));
    const originalStore = f.store;
    const store = async (action, key, value) => {
      await originalStore(action, key, value);
      if (action === 'put' && key === 'journal' && value.phase === 'writing') f.disk.files.set(victim.path, bytes('external modification'));
    };
    await f.createSession({store}).run({directory: f.disk.dir, release: f.release});
    assert.deepEqual(Buffer.from(f.disk.files.get(victim.path)), Buffer.from(victim.base64, 'base64'));
    assert.equal(f.disk.events.filter(e => e.type === 'write').at(-1).path, 'manifest.json');
  });
});
