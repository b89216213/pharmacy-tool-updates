// Refuse to publish dashboard links until the immutable commit has exact assets.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commit = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('Provide the full immutable asset commit SHA.');
const registry = JSON.parse(await fs.readFile(path.join(root, 'scripts/updater-tools.json')));
const catalog = JSON.parse(await fs.readFile(path.join(root, 'updates/catalog.json')));
const before = JSON.stringify(catalog);
for (const tool of registry) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, tool.directory, 'manifest.json')));
  const slug = tool.config.slug, downloadPath = `downloads/${slug}-v${manifest.version}.zip`;
  for (const file of [downloadPath, `updates/${slug}/packages/${manifest.version}.json`, `updates/${slug}/latest.json`]) {
    const committed = execFileSync('git', ['show', `${commit}:${file}`], {cwd: root, maxBuffer: 16 * 1024 * 1024});
    if (!committed.equals(await fs.readFile(path.join(root, file)))) throw Error('Asset commit differs from reviewed files: ' + file);
  }
  const entry = catalog.tools.find(item => item.id === tool.config.toolId);
  if (!entry) throw Error('Tool missing from catalog: ' + slug);
  entry.version = manifest.version; entry.downloadPath = downloadPath;
}
catalog.sourceCommit = commit;
if (process.argv.includes('--check')) {
  if (JSON.stringify(catalog) !== before) throw Error('Catalog does not match the supplied asset commit.');
  console.log('Checked 9 catalog downloads against immutable assets: ' + commit);
} else {
  await fs.writeFile(path.join(root, 'updates/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log('Pinned 9 tool downloads to verified immutable assets: ' + commit);
}
