(() => {
 'use strict';
 if(window.top!==window||globalThis.__pharmacyToolboxMounted)return;
 globalThis.__pharmacyToolboxMounted=true;
 const id='ntuh-pharmacy-toolbox',old=document.getElementById(id);if(old)old.remove();
 const host=document.createElement('div');host.id=id;host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483646;';
 document.documentElement.append(host);
 const request=async(action,extra={})=>{try{const r=await chrome.runtime.sendMessage({kind:'pharmacy-toolbox',action,...extra});if(!r?.ok)throw Error(r?.error||'工具箱沒有回應');return r.data;}catch(e){if(!chrome.runtime?.id)dispose();throw e;}};
 const managed=async(action)=>{const r=await chrome.runtime.sendMessage({kind:'managed-tool',action});if(!r?.ok)throw Error(r?.error||'管理連線尚未完成');return r.data;};
 const ui=globalThis.PharmacyToolboxUI.create(host,{request,managed});
 let frame=0,peer=null;
 const resize=new ResizeObserver(()=>schedule());
 function position(){
  frame=0;const next=document.getElementById('ntuh-patient-picker-return');
  if(peer!==next){if(peer)resize.unobserve(peer);peer=next;if(peer)resize.observe(peer);}
  let right=18,bottom=18;const r=peer?.getBoundingClientRect(),width=host.getBoundingClientRect().width||140;
  if(r&&r.width>0&&r.height>0&&r.bottom>0){
   bottom=Math.max(18,window.innerHeight-r.bottom);
   if(r.left-width-10>=12)right=Math.max(18,window.innerWidth-r.left+10);
   else bottom=Math.max(18,window.innerHeight-r.top+10);
  }
  host.style.right=right+'px';host.style.bottom=bottom+'px';ui.anchor(bottom+(host.getBoundingClientRect().height||58)+12);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(position);}
 const mutations=new MutationObserver(()=>{if(!host.isConnected)document.documentElement.append(host);schedule();});
 mutations.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
 const listener=(message,sender,reply)=>{if(sender.id===chrome.runtime.id&&message?.kind==='pharmacy-toolbox-toggle'){ui.toggle();reply({ok:true});}};
 chrome.runtime.onMessage.addListener(listener);
 const health=setInterval(()=>{if(!chrome.runtime?.id)dispose();},3000);
 function dispose(){clearInterval(health);mutations.disconnect();resize.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);try{chrome.runtime.onMessage.removeListener(listener);}catch{}ui.dispose();globalThis.__pharmacyToolboxMounted=false;}
 schedule();
})();
