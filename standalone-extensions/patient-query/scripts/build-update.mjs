// Run from this project. Produces source-only release files; never reads runtime storage.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'extension');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=["app.css", "app.js", "background.js", "bridge.js", "core.js", "engine.js", "icons/OFL.txt", "icons/icon128.png", "icons/icon16.png", "icons/icon20.png", "icons/icon24.png", "icons/icon32.png", "icons/icon48.png", "icons/mark.svg", "installation-config.js", "installation-core.js", "installation-ui.js", "management-core.js", "management.js", "manifest.json", "operation-guard.js", "patient-tool.json", "portal-connection.js", "tool.html", "update-core.js", "update-network.js", "update-store.js", "updater.js"];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes=process.argv[2]||"沿用舊版設定與安裝位置；更新後台連線、跨頁連接與更新機制，支援查詢處理_病人快速選擇\\extension 舊路徑。";
const pkg={format:'patient-query-update-v1',toolId:'ntuh-patient-picker',version:manifest.version,notes,files};
const bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/patient-query/packages/${manifest.version}.json`;
await fs.mkdir(path.join(root,'release/updates/patient-query/packages'),{recursive:true});
await fs.writeFile(path.join(root,'release',relative),bytes);
await fs.writeFile(path.join(root,'release/updates/patient-query/latest.json'),JSON.stringify({format:'patient-query-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
console.log(`Built ${pkg.version}: ${files.length} files, ${bytes.length} bytes`);
