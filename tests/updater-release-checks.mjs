import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {tools, root} from './updater-fixtures.mjs';

const results = [], temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'updater-compat-'));
try {
  for (const tool of tools) {
    const config = tool.config, extension = path.join(root, tool.directory);
    const core = await import(path.join(extension, 'update-core.js'));
    const network = await import(path.join(extension, 'update-network.js'));
    const current = JSON.parse(await fs.readFile(path.join(extension, 'manifest.json')));
    const baseline = JSON.parse(await fs.readFile(path.join(root, `updates/${config.slug}/packages/${tool.baselineVersion}.json`)));
    const oldManifest = JSON.parse(Buffer.from(baseline.files.find(file => file.path === 'manifest.json').base64, 'base64'));
    const oldSource = Buffer.from(baseline.files.find(file => file.path === 'update-core.js').base64, 'base64');
    const oldPath = path.join(temporary, config.slug + '.mjs');
    await fs.writeFile(oldPath, oldSource);
    const oldCore = await import(oldPath);
    const index = network.parseIndex(await fs.readFile(path.join(root, `updates/${config.slug}/latest.json`)));
    const bytes = await fs.readFile(path.join(root, index.packagePath));
    assert.equal(bytes.length, index.size); assert.equal(await core.sha256(bytes), index.sha256);
    const pkg = JSON.parse(bytes);
    await oldCore.validatePackage(pkg, oldManifest);
    await core.validatePackage(pkg, current, {allowSame: true});
    const oldBoundary = {...oldManifest}, newBoundary = {...current};
    delete oldBoundary.version; delete newBoundary.version;
    delete oldBoundary.version_name; delete newBoundary.version_name;
    assert.deepEqual(newBoundary, oldBoundary, 'Manifest identity, permissions and other configuration must be unchanged');
    const updaterFiles = new Set(['updater.js', 'update-core.js', 'update-network.js', 'update-store.js', 'update-session.js', 'update-config.js']);
    for (const file of baseline.files) {
      if (updaterFiles.has(file.path) || file.path === 'manifest.json') continue;
      assert.deepEqual(await fs.readFile(path.join(extension, file.path)), Buffer.from(file.base64, 'base64'), 'Clinical/management source changed: ' + file.path);
    }
    for (const file of pkg.files) assert.deepEqual(await fs.readFile(path.join(extension, file.path)), Buffer.from(file.base64, 'base64'));
    for (const file of updaterFiles) {
      assert(pkg.files.some(entry => entry.path === file), 'Missing local updater dependency: ' + file);
      execFileSync(process.execPath, ['--check', path.join(extension, file)], {stdio: 'pipe'});
    }
    const zip = path.join(root, `downloads/${config.slug}-v${current.version}.zip`);
    execFileSync('python3', ['-c', `import json,sys,zipfile,hashlib
package=json.load(open(sys.argv[1]))
with zipfile.ZipFile(sys.argv[2]) as archive:
 assert len(archive.namelist())==len(package['files'])
 for file in package['files']:
  data=archive.read(sys.argv[3]+'/'+file['path'])
  assert len(data)==file['size'] and hashlib.sha256(data).hexdigest()==file['sha256']
`, path.join(root, index.packagePath), zip, config.slug + '/' + path.basename(extension)], {stdio: 'pipe'});
    results.push({tool: config.slug, from: tool.baselineVersion, to: current.version, files: pkg.files.length,
      oldUpdaterAcceptsNewPackage: true, sourceZipPackageMatch: true, originalNonUpdaterFilesUnchanged: true,
      manifestCapabilitiesUnchanged: true, packageSHA256: index.sha256});
    console.log('PASS', config.slug, tool.baselineVersion, '→', current.version, 'old updater / new validator / ZIP / clinical source / permissions');
  }
  execFileSync(process.execPath, ['scripts/sync-updaters.mjs', '--check'], {cwd: root, stdio: 'inherit'});
  await fs.writeFile(path.join(root, 'docs/updater-release-results.json'), JSON.stringify({tools: results,
    windowsDefenderScanned: false, hospitalPortalTested: false}, null, 2) + '\n');
} finally { await fs.rm(temporary, {recursive: true, force: true}); }
