// Run from this project. Produces source-only release files; never reads runtime storage.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'extension');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=['app.css','app.js','background.js','bridge.js','core.js','engine.js','excel.js','manifest.json','management-core.js','management.js','model.js','operation-guard.js','patch-tool.json','tool.html','update-core.js','update-network.js','update-store.js','updater.js'];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes=process.argv[2]||'登記碼改為 4 位數字，後台新增共同管理員。已登記電腦保留原憑證；v1.3.0 可在工具內更新，較舊版本需手動導入。';
const pkg={format:'patch-recovery-update-v1',toolId:'ntuh-patch-recovery',version:manifest.version,notes,files};
const bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/patch-recovery/packages/${manifest.version}.json`;
await fs.mkdir(path.join(root,'release/updates/patch-recovery/packages'),{recursive:true});
await fs.writeFile(path.join(root,'release',relative),bytes);
await fs.writeFile(path.join(root,'release/updates/patch-recovery/latest.json'),JSON.stringify({format:'patch-recovery-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
console.log(`Built ${pkg.version}: ${files.length} files, ${bytes.length} bytes`);
