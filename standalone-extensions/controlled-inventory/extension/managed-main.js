(() => {
 if(globalThis.ManagedInventory)return;
 let pending=false,sequence=0;
 function request(action,token){return new Promise((resolve,reject)=>{
  const id=Date.now()+'-'+(++sequence),name='portal-managed-reply-v1';
  const cleanup=()=>{clearTimeout(timer);document.removeEventListener(name,receive);};
  const receive=e=>{let r;try{r=JSON.parse(e.detail);}catch{return;}if(r.id!==id)return;cleanup();r.ok?resolve(r.data):reject(Error(r.error||'管理驗證失敗'));};
  const timer=setTimeout(()=>{cleanup();reject(Error('工具連線未完成，請重新整理 Portal 後再試。'));},30000);
  document.addEventListener(name,receive);document.dispatchEvent(new CustomEvent('portal-managed-request-v1',{detail:JSON.stringify({id,action,token})}));
 });}
 globalThis.ManagedInventory={status:()=>request('status'),open:()=>request('open'),async run(operation){
  if(pending)throw Error('目前作業仍在處理');pending=true;let token;
  try{token=(await request('acquire')).token;return await operation();}
  finally{try{if(token)await request('release',token);}finally{pending=false;}}
 }};
})();
