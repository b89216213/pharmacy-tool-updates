import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const project=fileURLToPath(new URL('../',import.meta.url)),root=path.join(project,'extension');
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const files=[];async function walk(dir,prefix=''){for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const rel=prefix+entry.name;if(entry.isDirectory())await walk(path.join(dir,entry.name),rel+'/');else{if(!/\.(js|css|html|json|png|svg|txt)$/.test(rel))throw Error('Unexpected release file: '+rel);const bytes=await fs.readFile(path.join(dir,entry.name));files.push({path:rel,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')});}}}await walk(root);
const notes='藥局工具箱空殼：四色入口、四個主選單工具、進階 ADC 入口與兩個預設 OFF 開關；接上電腦登記、政策控管與工具更新。作業工具尚未接入，沒有病人資料移轉。';
const pkg={format:'pharmacy-toolbox-update-v1',toolId:'ntuh-pharmacy-toolbox',version:manifest.version,notes,files},bytes=Buffer.from(JSON.stringify(pkg,null,2)+'\n');
const out=path.join(project,'release');await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,manifest.version+'.json'),bytes);
await fs.writeFile(path.join(out,'latest.json'),JSON.stringify({format:'pharmacy-toolbox-release-v1',toolId:pkg.toolId,version:manifest.version,notes,packagePath:'updates/pharmacy-toolbox/packages/'+manifest.version+'.json',size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},null,2)+'\n');
console.log(JSON.stringify({version:manifest.version,files:files.length,bytes:bytes.length}));
