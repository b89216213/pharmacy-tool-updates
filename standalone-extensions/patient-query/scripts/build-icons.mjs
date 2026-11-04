// Development-only renderer. Installation and updates use the committed PNGs.
// Requires Inkscape; run npm run build:icons after changing icons/mark.svg.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const icons=fileURLToPath(new URL('../extension/icons/',import.meta.url));
for(const size of [16,20,24,32,48,128]){
  const result=spawnSync('inkscape',[icons+'mark.svg','--export-type=png',`--export-filename=${icons}icon${size}.png`,`--export-width=${size}`,`--export-height=${size}`],{encoding:'utf8'});
  if(result.error||result.status!==0)throw result.error||new Error(result.stderr||'Icon render failed');
}
console.log('Rendered 6 PNG sizes from icons/mark.svg');
