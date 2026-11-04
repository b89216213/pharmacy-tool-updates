// Explicit source allowlists only: never inspect browser storage or user folders.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug=process.argv[2];
if(!['cart-labels-his','cloud-medication'].includes(slug))throw Error('Unknown managed tool');
const project=path.join(root,'standalone-extensions',slug),ext=path.join(project,'extension');
const config=JSON.parse(await fs.readFile(path.join(project,'release-files.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(ext,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=[];
for(const file of config.files){const bytes=await fs.readFile(path.join(ext,file));files.push({path:file,size:bytes.length,sha256:hash(bytes),base64:bytes.toString('base64')});}
const notes=process.argv[3]||'採用統一單字圖示，原有流程及設定保持相容。';
const pkg={format:config.packageFormat,toolId:config.toolId,version:manifest.version,notes,files};
const bytes=Buffer.from(JSON.stringify(pkg)),packagePath=`updates/${slug}/packages/${manifest.version}.json`;
await fs.mkdir(path.dirname(path.join(root,packagePath)),{recursive:true});
await fs.writeFile(path.join(root,packagePath),bytes);
await fs.writeFile(path.join(root,`updates/${slug}/latest.json`),JSON.stringify({format:config.releaseFormat,toolId:config.toolId,version:manifest.version,notes,packagePath,size:bytes.length,sha256:hash(bytes)},null,2)+'\n');
console.log(`Built ${slug} ${manifest.version}: ${files.length} files`);
