import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'extension'),repo=path.resolve(root,'../..');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'))),hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=["README.txt", "background.js", "content.js", "core.js", "icons/OFL.txt", "icons/icon128.png", "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/mark.svg", "installation-config.js", "installation-core.js", "installation-ui.js", "managed-background.js", "managed-client.js", "management-core.js", "manager.css", "manager.html", "manager.js", "manifest.json", "page-bridge.js", "portal-connection.js", "return-pages.js", "theme.css", "tool-config.js", "tool-marker.json", "update-core.js", "update-network.js", "update-store.js", "updater.js", "workflow.js"];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes=process.argv[2]||"未選退藥藥局時預設總院西址住院藥局，保留已有選擇；改善批次讀取及條碼輸入、僅在退藥頁顯示，支援刷條碼退藥\\extension 舊路徑。沿用原權限。";
const pkg={format:'barcode-return-update-v1',toolId:'ntuh-barcode-return',version:manifest.version,notes,files},bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/barcode-return/packages/${manifest.version}.json`;
await fs.mkdir(path.dirname(path.join(repo,relative)),{recursive:true});await fs.writeFile(path.join(repo,relative),bytes);
await fs.writeFile(path.join(repo,'updates/barcode-return/latest.json'),JSON.stringify({format:'barcode-return-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
const zip=path.join(repo,`downloads/barcode-return-v${manifest.version}.zip`);await fs.mkdir(path.dirname(zip),{recursive:true});
execFileSync('python3',['-c',`import sys,json,zipfile,pathlib\ne=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:\n for p in json.loads(sys.argv[3]):\n  info=zipfile.ZipInfo('barcode-return/extension/'+p,(2026,11,4,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,(e/p).read_bytes())`,ext,zip,JSON.stringify(allowed)]);
console.log(`Built ${manifest.version}: ${files.length} files; ${bytes.length} package bytes`);
