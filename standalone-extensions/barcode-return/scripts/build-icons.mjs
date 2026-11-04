import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp'):'sharp');
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../extension/icons');
for(const size of [16,32,48,128])await sharp(await fs.readFile(path.join(dir,'mark.svg'))).resize(size,size).png().toFile(path.join(dir,`icon${size}.png`));
