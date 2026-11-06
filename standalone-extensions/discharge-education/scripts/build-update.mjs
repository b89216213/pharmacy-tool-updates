// Run from this project. Produces source-only release files; never reads runtime storage.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ext=path.join(root,'discharge-extension');
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=["app.js", "background.js", "batch.js", "bridge.js", "daily.js", "discharge-tool.json", "education-bridge.js", "education-core.js", "education-ui.js", "education.css", "education.js", "icons/OFL.txt", "icons/blue128.png", "icons/blue16.png", "icons/blue32.png", "icons/blue48.png", "icons/icon128.png", "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/mark.svg", "incremental.js", "installation-config.js", "installation-core.js", "installation-ui.js", "management-core.js", "management.js", "manifest.json", "portal-adapter.js", "portal-connection.js", "print-layout.css", "services.css", "services.js", "tool.css", "tool.html", "update-core.js", "update-network.js", "update-store.js", "updater.js"];
const files=[];for(const p of allowed){const b=await fs.readFile(path.join(ext,p));files.push({path:p,size:b.length,sha256:hash(b),base64:b.toString('base64')});}
const notes=process.argv[2]||"修正列印預覽往下捲動時跳回第一頁；管理狀態不變時不重畫，切換條碼、分配藥師與更新名單內容時保留捲動位置。保留列印分頁、後台管理與工具內更新，無新增權限。";
const pkg={format:'discharge-education-update-v1',toolId:'ntuh-discharge-education',version:manifest.version,notes,files};
const bytes=Buffer.from(JSON.stringify(pkg)),relative=`updates/discharge-education/packages/${manifest.version}.json`;
await fs.mkdir(path.join(root,'release/updates/discharge-education/packages'),{recursive:true});
await fs.writeFile(path.join(root,'release',relative),bytes);
await fs.writeFile(path.join(root,'release/updates/discharge-education/latest.json'),JSON.stringify({format:'discharge-education-release-v1',toolId:pkg.toolId,version:pkg.version,notes,packagePath:relative,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
console.log(`Built ${pkg.version}: ${files.length} files, ${bytes.length} bytes`);

