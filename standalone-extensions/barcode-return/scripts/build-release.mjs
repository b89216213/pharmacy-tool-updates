import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'extension'),repo=path.resolve(root,'../..');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'))),hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=['README.txt','background.js','content.js','core.js','workflow.js','page-bridge.js','manifest.json','return-pages.js','managed-background.js','managed-client.js','management-core.js','manager.html','manager.js','manager.css','tool-config.js','tool-marker.json','update-core.js','update-network.js','update-store.js','updater.js','icons/mark.svg',...[16,32,48,128].map(n=>`icons/icon${n}.png`)];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes='按工具列圖示於目前頁面開啟／關閉，收合保留輸入；加入電腦登記、後台停用與最低版本、工具內更新，採用條碼＋退回箭頭圖示。保留重複處方逐筆核對及成功後紀錄更新修正。v1.0.2 首次升級須覆蓋原資料夾並重新載入。';
const pkg={format:'barcode-return-update-v1',toolId:'ntuh-barcode-return',version:manifest.version,notes,files},bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/barcode-return/packages/${manifest.version}.json`;
await fs.mkdir(path.dirname(path.join(repo,relative)),{recursive:true});await fs.writeFile(path.join(repo,relative),bytes);
await fs.writeFile(path.join(repo,'updates/barcode-return/latest.json'),JSON.stringify({format:'barcode-return-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
const zip=path.join(repo,`downloads/barcode-return-v${manifest.version}.zip`);await fs.mkdir(path.dirname(zip),{recursive:true});
execFileSync('python3',['-c',`import sys,json,zipfile,pathlib\ne=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:\n for p in json.loads(sys.argv[3]):\n  info=zipfile.ZipInfo('barcode-return/extension/'+p,(2026,11,4,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,(e/p).read_bytes())`,ext,zip,JSON.stringify(allowed)]);
console.log(`Built ${manifest.version}: ${files.length} files; ${bytes.length} package bytes`);
