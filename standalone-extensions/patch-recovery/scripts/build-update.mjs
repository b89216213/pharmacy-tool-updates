// Run from this project. Produces source-only release files; never reads runtime storage.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'extension');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=["app.css", "registration.css", "app.js", "background.js", "bridge.js", "core.js", "engine.js", "excel.js", "icons/OFL.txt", "icons/icon-128.png", "icons/icon-16.png", "icons/icon-32.png", "icons/icon-48.png", "icons/mark.svg", "installation-config.js", "installation-core.js", "installation-ui.js", "management-core.js", "management.js", "manifest.json", "model.js", "operation-guard.js", "patch-tool.json", "portal-connection.js", "theme.css", "tool.html", "update-core.js", "update-network.js", "update-store.js", "updater.js"];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes=process.argv[2]||"病人卡片直接填片數、再次點選收合，整頁捲動；非當日儲存確認，支援補登；資料備份移至右上方。保留 Portal、藥師讀取、後台管理、工具更新、既有資料及各病房直式列印。";
const pkg={format:'patch-recovery-update-v1',toolId:'ntuh-patch-recovery',version:manifest.version,notes,files};
const bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/patch-recovery/packages/${manifest.version}.json`;
await fs.mkdir(path.join(root,'release/updates/patch-recovery/packages'),{recursive:true});
await fs.writeFile(path.join(root,'release',relative),bytes);
await fs.writeFile(path.join(root,'release/updates/patch-recovery/latest.json'),JSON.stringify({format:'patch-recovery-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
console.log(`Built ${pkg.version}: ${files.length} files, ${bytes.length} bytes`);
