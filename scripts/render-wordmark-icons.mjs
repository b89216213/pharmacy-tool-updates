import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp'):'sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tools=JSON.parse(await fs.readFile(path.join(root,'branding/tools.json'),'utf8'));
for(const tool of tools){
 const dir=path.join(root,tool.extension,'icons');
 for(const size of tool.sizes)await sharp(await fs.readFile(path.join(dir,tool.svgName)),{density:384}).resize(size,size).png().toFile(path.join(dir,`${tool.iconName}${size}.png`));
}
console.log('Rendered all six tools at their declared Chrome icon sizes');
