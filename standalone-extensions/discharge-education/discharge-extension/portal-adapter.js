(() => {
 if(!globalThis.PharmacyPortal||!globalThis.chrome?.scripting)return;
 const params=new URLSearchParams(location.search);
 window.DischargePortal=new PharmacyPortal.Connection({label:'出院藥衛教名單',sourceId:Number(params.get('tab')),
  onStatus:text=>{const e=document.getElementById('browserStatus');if(e){e.textContent=text;e.classList.remove('error');}}
 });
 chrome.runtime.onMessage.addListener(m=>{if(m?.kind==='portal-prefer-source'&&!window.CaptureRunning&&!window.EducationRunning){DischargePortal.sourceId=m.sourceId;DischargePortal.clicks.clear();void DischargeCapture.init();}});
 window.addEventListener('DOMContentLoaded',()=>{
  DischargePortal.watch({needed:()=>!!window.DischargeCapture&&!DischargeCapture.connected,blocked:()=>!!document.querySelector('.education-dialog[open]')||window.DischargeBlocked||window.DischargeUpdating||window.CaptureRunning||window.EducationRunning,connect:()=>DischargeCapture.init()});
 });
})();
