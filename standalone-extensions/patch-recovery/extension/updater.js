import {compareVersion,validatePackage,verifyDirectory,applyPackage,restoreFiles,sha256} from './update-core.js';
import {SOURCE,githubFile,parseIndex} from './update-network.js';
import {updateStore as store} from './update-store.js';
const $=id=>document.getElementById(id),decoder=new TextDecoder('utf-8',{fatal:true});
const readInstalled=async path=>{const r=await fetch(chrome.runtime.getURL(path),{cache:'no-store'});if(!r.ok)throw new Error('無法讀取已安裝檔案');return new Uint8Array(await r.arrayBuffer());};
export async function mountUpdater({isBusy,prepare,finish}){
  if(!globalThis.chrome?.runtime?.getManifest)return;
  const current=chrome.runtime.getManifest();$('update-version').textContent='目前 v'+current.version;
  // Discard private-source credentials and cached announcements on migration.
  // Folder authorization and interrupted-update journals remain local and intact.
  await store('delete','token');
  const sourceKey=SOURCE.repo+'@'+SOURCE.ref;
  if(await store('get','source')!==sourceKey){
    await store('delete','latest');await store('delete','lastCheck');await store('put','source',sourceKey);
  }
  let directory=await store('get','directory'),latest=null,working=false,checking=false,installing=false,journal=await store('get','journal');
  const status=(message,error=false)=>{$('update-status').textContent=message;$('update-status').classList.toggle('update-error',error);};
  const locked=value=>{working=value;for(const el of $('update-dialog').querySelectorAll('button,input'))el.disabled=value;};
  const guarded=fn=>async()=>{if(working)return;try{await fn();}catch(e){status(e.name==='AbortError'?'已取消，工具未更動。':e.message||'更新失敗，請稍後再試。',true);}finally{if(!installing){locked(false);render();}}};
  function render(){
    $('update-directory').textContent=directory?'已指定：'+directory.name:'尚未指定工具資料夾';
    $('update-apply').hidden=!latest||compareVersion(latest.version,current.version)<=0;
    $('update-apply').disabled=working||checking||!directory||!!journal;
    $('update-check').disabled=working||checking;
    $('update-recover').hidden=!journal;
    $('update-notes').textContent=latest?.notes||'';
    $('update-new-version').textContent=latest&&compareVersion(latest.version,current.version)>0?'可更新至 v'+latest.version:'';
    $('open-update').textContent=latest&&compareVersion(latest.version,current.version)>0?'更新可用':'工具更新';
  }
  async function permission(dir){
    if(await dir.queryPermission({mode:'readwrite'})==='granted')return;
    if(await dir.requestPermission({mode:'readwrite'})!=='granted')throw new Error('未取得資料夾寫入權限，未更動工具。');
  }
  async function check(manual=true){
    if(working||checking||installing)return;
    checking=true;render();
    if(manual)locked(true);
    if(manual||$('update-dialog').open)status('正在檢查新版…');
    try{latest=parseIndex(await githubFile(SOURCE.index,{max:32000}));await store('put','lastCheck',Date.now());await store('put','latest',latest);if(manual||!working)status(compareVersion(latest.version,current.version)>0?'新版已就緒。完成目前作業後，可按「更新並重新開啟」。':'目前已是最新版本。');render();}
    catch(e){if(manual||$('update-dialog').open)status(e.message,true);else status('上次檢查未成功，可按「檢查新版」重試。',true);}
    finally{checking=false;if(manual)locked(false);render();}
  }
  $('open-update').addEventListener('click',()=>{render();$('update-dialog').showModal();});
  $('update-close').addEventListener('click',()=>{if(!working)$('update-dialog').close();});
  $('update-dialog').addEventListener('cancel',event=>{if(working)event.preventDefault();});
  $('update-folder').addEventListener('click',guarded(async()=>{
    if(!window.showDirectoryPicker)throw new Error('這個 Chrome 環境不支援資料夾授權，請改用手動更新。');
    const selected=await window.showDirectoryPicker({id:'patch-recovery-folder',mode:'readwrite'});locked(true);
    await permission(selected);await verifyDirectory(selected,current,readInstalled);await store('put','directory',selected);directory=selected;render();status('已確認工具資料夾。以後更新會沿用這個位置。');
  }));
  $('update-check').addEventListener('click',guarded(()=>check()));
  async function install(recovery=false){
    if(!directory)throw new Error('請先指定目前工具的 extension 資料夾。');
    if(isBusy())throw new Error('請等目前查詢或儲存完成，並關閉其他編輯視窗後再更新。');
    // Request permissions while still inside the button's user activation.
    await permission(directory);locked(true);installing=true;
    let unlockApp;
    try{
      await navigator.locks.request('patch-recovery-update',{ifAvailable:true},async lock=>{
        if(!lock)throw new Error('另一個視窗正在更新，請稍後再試。');
        const contexts=chrome.runtime.getContexts?await chrome.runtime.getContexts({}):[];
        const viewCount=chrome.runtime.getContexts?contexts.filter(c=>c.documentUrl===chrome.runtime.getURL('tool.html')).length:(chrome.extension?.getViews?.()||[]).filter(v=>v.location.href===chrome.runtime.getURL('tool.html')).length;
        if(viewCount>1)throw new Error('請先關閉其他貼片回收視窗，再進行更新。');
        if(isBusy())throw new Error('工具仍在處理作業，請稍後再試。');
        await prepare();unlockApp=finish;
        if(recovery){await restoreFiles(directory,journal,status);await store('delete','journal');journal=null;}
        else{
          if(journal)throw new Error('上次更新尚未完成，請先還原原版。');
          if(!latest||compareVersion(latest.version,current.version)<=0)throw new Error('請先檢查新版。');
          await verifyDirectory(directory,current,readInstalled);status('正在下載並驗證新版…');
          const release=latest;
          const bytes=await githubFile(release.packagePath);
          if(bytes.length!==release.size||await sha256(bytes)!==release.sha256)throw new Error('更新包與公告不一致，未更動工具。請重新檢查新版。');
          const validated=await validatePackage(JSON.parse(decoder.decode(bytes)),current);
          if(validated.version!==release.version)throw new Error('下載的版本與公告不一致');
          journal=await applyPackage(directory,validated,{saveJournal:async value=>{await store('put','journal',value);journal=value;},clearJournal:async()=>{await store('delete','journal');journal=null;},onProgress:status});
        }
        const {patchSource}=await chrome.storage.session.get('patchSource');
        await chrome.storage.local.set({patchUpdateReopen:{at:Date.now(),patchSource:patchSource||null}});
        status(recovery?'原版已還原，正在重新開啟…':'更新完成，正在重新開啟…');
      });
      // Finish the lock callback before unloading the extension document.
      installing=false;chrome.runtime.reload();
    }catch(e){installing=false;unlockApp?.();throw e;}
  }
  $('update-apply').addEventListener('click',guarded(()=>install()));
  $('update-recover').addEventListener('click',guarded(()=>install(true)));
  window.addEventListener('beforeunload',event=>{if(installing){event.preventDefault();event.returnValue='';}});
  if(journal?.phase==='written'&&journal.version===current.version){await store('delete','journal');journal=null;status('已完成更新至 v'+current.version+'，原有回收紀錄與設定保留。');}
  else if(journal)status('偵測到上次更新未完成。請先按「還原原版檔案」。',true);
  else status('開啟工具會自動檢查新版，不需 GitHub 帳號或憑證。');
  latest=await store('get','latest')||null;
  render();
  if(!journal)void check(false);
  setInterval(()=>{if(!working&&!installing&&!journal)void check(false);},6*60*60*1000);
}
