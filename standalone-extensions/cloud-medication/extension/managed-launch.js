import {CONFIG} from './tool-config.js';
import {ready} from './managed-ui.js';
await ready;
const path=location.pathname.slice(1);
for(const src of CONFIG.pageScripts[path]||[]){
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('無法載入 '+src));document.body.append(script);});
}

document.dispatchEvent(new Event('managed-app-ready'));
