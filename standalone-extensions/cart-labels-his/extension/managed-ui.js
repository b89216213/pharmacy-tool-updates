import {CONFIG} from './tool-config.js';
import {managedRequest} from './managed-client.js';
const workspace=document.getElementById('managed-workspace');
const bar=document.createElement('aside');bar.id='managed-bar';bar.setAttribute('aria-label','工具管理');
const info=document.createElement('span'),button=document.createElement('button'),retry=document.createElement('button');
info.setAttribute('role','status');button.textContent='電腦登記／工具更新';retry.textContent='重新驗證';
bar.append(info,button,retry);document.body.prepend(bar);
button.onclick=()=>managedRequest('open').catch(e=>info.textContent=e.message);
let readyResolve,checking=false,started=false,allowed=false,reminded=false;
export const ready=new Promise(resolve=>readyResolve=resolve);
async function refresh(force=false){
 if(checking)return;checking=true;
 try{
  const s=await managedRequest('status',{force});
  allowed=s.state==='allowed'&&!s.updating;
  // Let an already running task settle before applying a newly received policy.
  workspace.inert=!(allowed||(started&&s.busy));
  bar.classList.toggle('managed-blocked',!allowed);retry.hidden=allowed;
  info.textContent=allowed?`${CONFIG.title} · v${s.version}${s.deviceName?' · '+s.deviceName:''}`:s.reason||'更新中，請稍候';
  if(allowed&&!started){started=true;readyResolve();}
  button.textContent=s.updateAvailable?'有新版 v'+s.latestVersion+' · 工具更新':'電腦登記／工具更新';
  if(s.updateAvailable&&!s.busy&&!reminded&&!document.hidden){reminded=true;bar.classList.add('managed-update');info.textContent+=' · 發現新版，完成作業後可開啟工具更新。';}
 }catch(e){allowed=false;workspace.inert=true;bar.classList.add('managed-blocked');info.textContent=e.message;retry.hidden=false;}
 finally{checking=false;}
}
retry.onclick=()=>void refresh(true);
void refresh();setInterval(()=>void refresh(),15000);
window.addEventListener('focus',()=>void refresh());
// Also block browser print shortcuts while management does not permit use.
window.addEventListener('beforeprint',()=>document.body.classList.toggle('managed-print-blocked',!allowed));
window.addEventListener('afterprint',()=>document.body.classList.remove('managed-print-blocked'));
