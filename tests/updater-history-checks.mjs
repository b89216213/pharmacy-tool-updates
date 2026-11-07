// Exercise the actual historical validators, not a reconstruction of their rules.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {tools, root, directory} from './updater-fixtures.mjs';

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'updater-history-'));
const results = [];
try {
  for (const tool of tools) {
    const extension = path.join(root, tool.directory);
    const core = await import(path.join(extension, 'update-core.js'));
    const current = JSON.parse(await fs.readFile(path.join(extension, 'manifest.json')));
    const packageDir = path.join(root, 'updates', tool.config.slug, 'packages');
    const next = JSON.parse(await fs.readFile(path.join(packageDir, current.version + '.json')));
    const versions = [];
    for (const file of (await fs.readdir(packageDir)).filter(file => file.endsWith('.json'))) {
      const pkg = JSON.parse(await fs.readFile(path.join(packageDir, file)));
      if (core.compareVersion(pkg.version, current.version) >= 0) continue;
      const files = Object.fromEntries(pkg.files.map(f => [f.path, Buffer.from(f.base64, 'base64')]));
      const manifest = JSON.parse(files['manifest.json']);
      if (!files['update-core.js']) throw Error('Historical updater missing: ' + file);
      const moduleDir = path.join(temp, tool.config.slug + '-' + pkg.version);
      await fs.mkdir(moduleDir); await fs.writeFile(path.join(moduleDir, 'package.json'), '{"type":"module"}');
      for (const [name, data] of Object.entries(files).filter(([name]) => /^update(?:r|-.*)\.js$/.test(name)))
        await fs.writeFile(path.join(moduleDir, name), data);
      versions.push({pkg, files, manifest, core: await import(path.join(moduleDir, 'update-core.js'))});
    }
    for (const old of versions) {
      const row = {tool: tool.config.slug, from: old.pkg.version, to: current.version};
      let validated;
      try { validated = await old.core.validatePackage(next, old.manifest); }
      catch (error) { row.direct = false; row.reason = error.message; }
      if (validated) {
        const disk = directory({...old.files, 'personal-backup.json': 'synthetic local backup'});
        let journal;
        await old.core.applyPackage(disk.dir, validated, {saveJournal: async value => { journal = structuredClone(value); }, clearJournal: async () => { journal = null; }});
        for (const file of next.files) assert.deepEqual(Buffer.from(disk.files.get(file.path)), Buffer.from(file.base64, 'base64'));
        assert.equal(Buffer.from(disk.files.get('personal-backup.json')).toString(), 'synthetic local backup');
        assert.equal(await core.confirmInstalledJournal(journal, current, name => core.readFile(disk.dir, name)), true);
        row.direct = true; row.applied = true; row.legacyJournalReconciled = true;
      } else {
        const published = versions.find(version => version.pkg.version === tool.baselineVersion);
        try { await old.core.validatePackage(published.pkg, old.manifest); row.publishedAlsoBlocked = false; }
        catch { row.publishedAlsoBlocked = true; }
        // Discover any supported bridge without weakening an already-installed validator.
        const queue = [{old, route: [old.pkg.version]}], visited = new Set([old.pkg.version]);
        while (queue.length && !row.bridge) {
          const entry = queue.shift();
          for (const target of [...versions.map(old => ({...old})), {pkg: next}]) {
            if (visited.has(target.pkg.version) || core.compareVersion(target.pkg.version, entry.old.pkg.version) <= 0) continue;
            try { await entry.old.core.validatePackage(target.pkg, entry.old.manifest); } catch { continue; }
            const route = [...entry.route, target.pkg.version];
            if (target.pkg.version === current.version) { row.bridge = route; break; }
            visited.add(target.pkg.version); queue.push({old: target, route});
          }
        }
      }
      results.push(row);
      console.log(row.direct ? 'PASS direct' : row.bridge ? 'BRIDGE required' : 'MANUAL required', row.tool, row.from, '→', row.to, row.reason || '');
    }
  }
  for (const row of results) {
    const knownLegacyBoundary = row.tool === 'patch-recovery' && ['1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5'].includes(row.from);
    assert.equal(row.direct, !knownLegacyBoundary, 'Unexpected upgrade compatibility change: ' + JSON.stringify(row));
    if (knownLegacyBoundary) { assert.match(row.reason, /額外權限/); assert.equal(row.publishedAlsoBlocked, true); }
  }
  await fs.writeFile(path.join(root, 'docs/updater-history-results.json'), JSON.stringify({
    scope: 'Every historical package retained in this repository; in-memory filesystem and actual historical validators/apply functions. Does not identify versions installed in hospitals.',
    total: results.length, direct: results.filter(x => x.direct).length, results
  }, null, 2) + '\n');
} finally { await fs.rm(temp, {recursive: true, force: true}); }
