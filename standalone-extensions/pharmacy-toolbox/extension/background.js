import {openManager,assertManaged} from './managed-background.js';
import {PREFERENCES_KEY,preferences,setPreference,supportedUrl,allowedSender,moduleFor} from './toolbox-core.js';
const api=chrome,base=api.runtime.getURL('');
let writes=Promise.resolve(),opening=Promise.resolve();
const serialize=fn=>{const p=writes.then(fn,fn);writes=p.catch(()=>{});return p;};
const read=async()=>preferences((await api.storage.local.get(PREFERENCES_KEY))[PREFERENCES_KEY]);
// The page receives only toolbox preferences, never the stored enrollment secret.
void api.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}).catch(()=>{});
async function ensurePreferences(){return serialize(async()=>{const raw=(await api.storage.local.get(PREFERENCES_KEY))[PREFERENCES_KEY];if(!raw)await api.storage.local.set({[PREFERENCES_KEY]:preferences()});});}
async function windowForShell(){
 const existing=(await api.tabs.query({})).find(t=>t.url?.split(/[?#]/)[0]===base+'app.html');
 if(existing){await api.tabs.update(existing.id,{active:true});await api.windows.update(existing.windowId,{focused:true});return;}
 await api.windows.create({url:base+'app.html',type:'popup',width:490,height:660});
}
async function handle(message,sender){
 if(!allowedSender(sender,base,api.runtime.id))throw Error('不允許的工具來源');
 if(message.action==='preferences')return {preferences:await read(),version:api.runtime.getManifest().version,shell:true};
 if(message.action==='set-preference')return serialize(async()=>{const next=setPreference(await read(),message.name,message.value);await api.storage.local.set({[PREFERENCES_KEY]:next});return {preferences:next,effective:false};});
 if(message.action==='manager'){await openManager();return {ok:true};}
 if(message.action==='launch'){
  const tool=moduleFor(message.id);
  if(!tool.ready)return {pending:true,title:tool.title,message:tool.title+'尚未接入，目前僅提供工具箱入口。'};
  await assertManaged(sender);
  throw Error('工具入口尚未設定');
 }
 throw Error('未知的工具箱指令');
}
api.runtime.onMessage.addListener((message,sender,reply)=>{if(message?.kind!=='pharmacy-toolbox')return;handle(message,sender).then(data=>reply({ok:true,data}),error=>reply({ok:false,error:error.message}));return true;});
async function inject(tabId){await api.scripting.executeScript({target:{tabId},files:['ui.js','content.js']});}
api.action.onClicked.addListener(tab=>{
 opening=opening.catch(()=>{}).then(async()=>{
  if(Number.isInteger(tab?.id)&&supportedUrl(tab.url)){
   try{await api.tabs.sendMessage(tab.id,{kind:'pharmacy-toolbox-toggle'},{frameId:0});return;}catch{}
   try{await inject(tab.id);await api.tabs.sendMessage(tab.id,{kind:'pharmacy-toolbox-toggle'},{frameId:0});return;}catch{}
  }
  await windowForShell();
 }).catch(()=>openManager().catch(()=>{}));
});
api.runtime.onInstalled.addListener(()=>{
 void ensurePreferences();
 void (async()=>{for(const tab of await api.tabs.query({}))if(supportedUrl(tab.url))try{await inject(tab.id);}catch{}})();
});
api.runtime.onStartup.addListener(()=>void ensurePreferences());
