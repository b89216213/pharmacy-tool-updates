// Reproducible source-only packaging for all registered independently installed tools.
// This build never reads browser profiles, patient exports or deployment secrets.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await fs.readFile(path.join(root, 'scripts/updater-tools.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const defaultNotes = '重整共用更新模組：補強原安裝位置還原驗證、重複操作防護、更新公告核對、檔案完整性與失敗復原。保留原有功能、資料及權限；尚未完成 Windows Defender 實機驗證。';
const sharedFiles = ['updater.js', 'update-core.js', 'update-network.js', 'update-store.js', 'update-session.js'];

export async function buildRelease(slug, {out = root, notes = defaultNotes, zip = true, layout = 'repository'} = {}) {
  const tool = registry.find(tool => tool.config.slug === slug);
  if (!tool) throw Error('Unknown tool');
  const extension = path.join(root, tool.directory);
  for (const file of sharedFiles) {
    if (!Buffer.from(await fs.readFile(path.join(extension, file))).equals(await fs.readFile(path.join(root, 'shared/updater', file))))
      throw Error('Run scripts/sync-updaters.mjs before packaging: ' + slug + '/' + file);
  }
  const config = (await import(path.join(extension, 'update-config.js'))).UPDATE_CONFIG;
  if (JSON.stringify(config) !== JSON.stringify(tool.config)) throw Error('Updater config is out of sync: ' + slug);
  const manifest = JSON.parse(await fs.readFile(path.join(extension, 'manifest.json'), 'utf8'));
  const files = [];
  for (const file of tool.files) {
    const bytes = await fs.readFile(path.join(extension, file));
    files.push({path: file, size: bytes.length, sha256: hash(bytes), base64: bytes.toString('base64')});
  }
  const pkg = {format: config.packageFormat, toolId: config.toolId, version: manifest.version, notes, files};
  const {validatePackage} = await import(path.join(extension, 'update-core.js'));
  await validatePackage(pkg, manifest, {allowSame: true});
  const bytes = Buffer.from(JSON.stringify(pkg));
  const packagePath = `updates/${slug}/packages/${manifest.version}.json`;
  const index = {format: config.releaseFormat, toolId: config.toolId, version: manifest.version, notes,
    packagePath, size: bytes.length, sha256: hash(bytes)};
  if (!['repository', 'flat'].includes(layout)) throw Error('Unknown output layout');
  const packageOutput = path.join(out, layout === 'flat' ? manifest.version + '.json' : packagePath);
  const indexOutput = path.join(out, layout === 'flat' ? 'latest.json' : `updates/${slug}/latest.json`);
  await fs.mkdir(path.dirname(packageOutput), {recursive: true});
  await fs.writeFile(packageOutput, bytes);
  await fs.writeFile(indexOutput, JSON.stringify(index, null, 2) + '\n');
  if (zip) {
    await fs.mkdir(path.join(out, 'downloads'), {recursive: true});
    const archive = path.join(out, `downloads/${slug}-v${manifest.version}.zip`);
    execFileSync('python3', ['-c', `import sys,json,zipfile,pathlib
extension=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as archive:
 for file in json.loads(sys.argv[3]):
  info=zipfile.ZipInfo(sys.argv[4]+'/'+file,(2026,11,7,0,0,0))
  info.compress_type=zipfile.ZIP_DEFLATED
  info.external_attr=0o644<<16
  archive.writestr(info,(extension/file).read_bytes())`, extension, archive, JSON.stringify(tool.files), slug + '/' + path.basename(extension)]);
  }
  console.log(`Built ${slug} ${manifest.version}: ${files.length} files, ${bytes.length} package bytes`);
  return index;
}

async function main() {
  const argument = process.argv[2];
  if (argument !== '--all') { await buildRelease(argument, {notes: process.argv[3] || defaultNotes}); return; }
  for (const tool of registry) {
    await buildRelease(tool.config.slug);
  }
  // HEAD cannot contain files just generated in the working tree. Pin the
  // dashboard only after committing those assets, using pin-updater-catalog.mjs.
  console.log('Commit the built assets, then run node scripts/pin-updater-catalog.mjs <asset-commit>.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
