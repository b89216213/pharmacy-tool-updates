// Run from this project. Produces source-only release files; never reads runtime storage.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'discharge-extension');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=['icons/OFL.txt','icons/mark.svg','icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png','education-core.js','education-bridge.js','education.js','education-ui.js','education.css','app.js', 'background.js', 'batch.js', 'bridge.js', 'daily.js', 'discharge-tool.json', 'incremental.js', 'management-core.js', 'management.js', 'manifest.json', 'services.css', 'services.js', 'tool.css', 'tool.html', 'update-core.js', 'update-network.js', 'update-store.js', 'updater.js'];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes=process.argv[2]||'選擇衛教未完成時，原因空白會預帶 Portal 原有罐頭；可自行修改，切換完成狀態與重新開啟保留已填內容。';
const pkg={format:'discharge-education-update-v1',toolId:'ntuh-discharge-education',version:manifest.version,notes,files};
const bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/discharge-education/packages/${manifest.version}.json`;
await fs.mkdir(path.join(root,'release/updates/discharge-education/packages'),{recursive:true});
await fs.writeFile(path.join(root,'release',relative),bytes);
await fs.writeFile(path.join(root,'release/updates/discharge-education/latest.json'),JSON.stringify({format:'discharge-education-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
console.log(`Built ${pkg.version}: ${files.length} files, ${bytes.length} bytes`);
