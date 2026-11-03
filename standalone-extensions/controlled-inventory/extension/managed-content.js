(() => {
 const REQUEST='portal-managed-request-v1',REPLY='portal-managed-reply-v1';
 document.addEventListener(REQUEST,async event=>{
  let m;try{m=JSON.parse(event.detail);}catch{return;}
  if(!m||typeof m.id!=='string'||m.id.length>80||!['acquire','release','open','status'].includes(m.action))return;
  let result;try{result=await chrome.runtime.sendMessage({kind:'managed-tool',action:m.action,...(m.action==='release'?{token:m.token}:{})});}catch{result={ok:false,error:'工具已更新或連線中斷，請重新整理 Portal 頁面。'};}
  document.dispatchEvent(new CustomEvent(REPLY,{detail:JSON.stringify({id:m.id,...result})}));
 });
 const beat=()=>chrome.runtime.sendMessage({kind:'managed-tool',action:'status'}).catch(()=>{});
 void beat();setInterval(beat,60000);
})();
