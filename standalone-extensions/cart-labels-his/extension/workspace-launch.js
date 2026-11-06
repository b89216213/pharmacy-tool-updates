import {TEST_MODE} from './build-config.js';
import {CONFIG} from './tool-config.js';
globalThis.CART_TEST_MODE=TEST_MODE;
async function classic(src){
 await new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src=src;
  const cleanup=()=>window.removeEventListener('error',failed);
  const failed=e=>{if(e.filename?.split('?')[0]===s.src.split('?')[0]){cleanup();reject(Error('啟動失敗：'+src+' · '+e.message));}};
  window.addEventListener('error',failed);
  s.onload=()=>{cleanup();resolve();};s.onerror=()=>{cleanup();reject(Error('無法載入 '+src));};document.body.append(s);
 });
}
try{
 await classic('../workspace-core.js');
 await classic('../handover-core.js');
 await classic('../print-policy.js');
 await classic('../saved-receipt.js');
 for(const src of CONFIG.pageScripts['labels/index.html'].filter(x=>x!=='bridge.js'))await classic(src);
 await classic('workspace.js');
 await classic('ward-selection.js');
 await classic('handover.js');
 await classic('settings-v213.js');
 await classic('workspace-layout.js');
 await classic('print-footer.js');
 document.dispatchEvent(new Event('managed-app-ready'));

 const {mountServices}=await import('./workspace-services.js');
 globalThis.LabelServices=await mountServices(globalThis.LabelWorkspace);
 if(globalThis.CartMemoryReady)await globalThis.CartMemoryReady;
 await globalThis.LabelWorkspace.start(globalThis.LabelServices);
 document.body.dataset.ready='true';
}catch(e){
 const status=document.getElementById('captureStatus');status.textContent='工具啟動失敗：'+e.message;status.classList.add('error');
 console.error(e);
}

