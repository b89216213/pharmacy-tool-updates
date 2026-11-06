/* Shared Portal connection, version 1.2.0. No credentials, patient data or URLs are stored. */
(() => {
  'use strict';
  const HOST=/^https:\/\/(portal|ihisaw)\.ntuh\.gov\.tw\//;
  const TARGETS={query:{path:'/WebApplication/PharManagement/InMedicationProcess.aspx',label:'查詢處理'},returns:{path:'/WebApplication/PharManagement/BarCodeDrugReturn.aspx',label:'刷條碼退藥'},education:{path:'/WebApplication/PharManagement/CareEducationRecord.aspx',label:'衛教紀錄'}};
  const fault=(code,message)=>Object.assign(new Error(message),{code});
  // This function is serialized by Chrome. Keep it self-contained.
  function pageBridge(command,p){
    if(!['https://portal.ntuh.gov.tw','https://ihisaw.ntuh.gov.tw'].includes(location.origin))return null;
    const KEY='pharmacyPortalLeaseV1',now=Date.now();
    const visible=e=>!!e&&!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)&&getComputedStyle(e).visibility!=='hidden';
    const label=e=>String(e?.value||e?.textContent||e?.title||'').normalize('NFKC').replace(/\s+/g,'');
    const fresh=()=>{if(!Number.isFinite(p.deadline)||Date.now()>p.deadline)throw Error('導頁要求已過期，未執行點選。');};
    let lease;try{lease=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{}
    const other=lease&&lease.until>now&&lease.owner!==p.owner;
    if(command==='release'){if(lease?.owner===p.owner)sessionStorage.removeItem(KEY);return {released:true};}
    if(command==='lease'){
      fresh();if(other)return {blocked:true,label:lease.label};
      sessionStorage.setItem(KEY,JSON.stringify({owner:p.owner,label:p.label,until:now+90000}));return {owned:true};
    }
    const loading=document.readyState==='loading'||!!window.Sys?.WebForms?.PageRequestManager?.getInstance()?.get_isInAsyncPostBack();
    // The signed-in dashboard has its own password-type field for signing.
    // Identify that field by its control metadata. Never read its contents.
    function isSignaturePin(input){
      return input.id==='InputPINPassword' ||
        [input.placeholder,input.getAttribute('aria-label')].some(s=>/簽章\s*PIN\s*碼/i.test(s||''));
    }
    const login=/\/(?:Login|SignIn)\.aspx$/i.test(location.pathname) ||
      (visible(document.getElementById('txtUserID'))&&visible(document.getElementById('imgBtnSubmitNew'))) ||
      [...document.querySelectorAll('input[type=password]')].some(input=>visible(input)&&!isSignaturePin(input));
    const dirty=!!document.querySelector('[data-pharmacy-unsaved="true"]')||!!(document.querySelector('[id$="rdbEducationType_1"]')&&visible(document.querySelector('[id$="rdbEducationType_1"]'))&&!label(document.querySelector('[id$="lblCreateDateTime"]')));
    const controls=[...document.querySelectorAll('a,button,input[type=button],input[type=submit],[role=menuitem],[role=button],[onclick]')];
    function destination(control){
      const href=control.getAttribute('href');
      if(!href||/^(?:#|javascript:)/i.test(href.trim()))return null;
      try{return new URL(href,location.href);}catch{return null;}
    }
    const exactLinks=controls.filter(control=>{
      const url=destination(control);
      return url?.origin==='https://ihisaw.ntuh.gov.tw'&&url.pathname.toLowerCase()===p.target.path.toLowerCase();
    });
    const shown=exactLinks.filter(visible);
    let link=shown.length===1?shown[0]:!shown.length&&exactLinks.length===1?exactLinks[0]:null;
    let ambiguous=(shown.length||exactLinks.length)>1;
    let homeEntry=false;
    // The Portal dashboard can show the very same inpatient entry twice:
    // a red shortcut and a copy inside 醫療系統 / 藥局作業.
    const hasLabel=name=>controls.some(control=>label(control).replace(/[▼▾▶►]/g,'')===name);
    const dashboard=!/\/WebApplication\/PharManagement\//i.test(location.pathname) && !login &&
      (hasLabel('醫療系統') && (hasLabel('藥局作業')||hasLabel('登出')) ||
       !!document.getElementById('InputPINPassword')&&hasLabel('登出'));
    if(dashboard&&(!link||p.target.label==='查詢處理')){
      const entries=controls.filter(control=>{
        if(control.disabled||label(control)!=='查詢處理(住)')return false;
        const url=destination(control);
        if(url)return url.origin==='https://ihisaw.ntuh.gov.tw' &&
          /\/InMedicationProcess\.aspx$/i.test(url.pathname) ||
          url.origin===location.origin && !/\/(?:Login|Logout|SignIn|SignOut)\.aspx$/i.test(url.pathname);
        // A Portal shortcut can delegate its SSO click to the dashboard.
        return control.matches('button,input[type=button],[role=button],[onclick]') || (control.matches('a[href]') && !/^(?:javascript:)?void\(0\);?$/i.test((control.getAttribute('href')||'').replace(/\s/g,'')));
      });
      const shortcuts=entries.filter(e=>visible(e)&&!e.closest('nav,.dropdown-menu,[role=menu]'));
      const menuEntries=entries.filter(e=>e.closest('.dropdown-menu,[role=menu]'));
      const available=entries.filter(visible);
      const preferred=shortcuts.length?shortcuts:available.length?available:menuEntries;
      if(preferred.length){
        ambiguous=preferred.length!==1;
        link=ambiguous?null:preferred[0];
        homeEntry=!!link;
      }
    }
    if (!link && !ambiguous && !dashboard && !login) {
      const named = controls.filter(control => label(control) === p.target.label && !control.disabled &&
        control.matches('a[onclick],button[onclick],input[type=button][onclick]') &&
        (!destination(control) || destination(control).origin === location.origin));
      if (named.length === 1) link = named[0];
      else if (named.length > 1) ambiguous = true;
    }
    const onTarget=location.origin==='https://ihisaw.ntuh.gov.tw'&&location.pathname.toLowerCase()===p.target.path.toLowerCase();
    const result={origin:location.origin,path:location.pathname,login,loading,dirty,ready:onTarget&&!login&&!loading,link:!!link,ambiguous,homeEntry,blocked:!!other,blockLabel:other?lease.label:''};
    if(command==='probe')return result;
    if(command!=='follow')throw Error('未知導頁要求。');
    fresh();if(other)return {blocked:true};
    if(login||loading)return {waiting:true};
    if(dirty)return {dirty:true};
    if(!link)return {missing:true,ambiguous:result.ambiguous};
    if(link.disabled)return {waiting:true};
    // A CSS-hover-only menu already contains its native anchors. Clicking
    // that specific anchor avoids synthesising hover or mutating Portal CSS.
    if(!visible(link)&&!(link.matches('a[href]')&&link.closest('.dropdown-menu,[role=menu]'))){
      if(link.closest('#DIVMenuBar')){
        const handle=document.getElementById('DIVMenuHide');
        if(visible(handle)&&label(handle)==='選單'){fresh();handle.click();return {expanded:true};}
      }
      const side=link.closest('#object1');
      if(side && parseFloat(side.style.left)<0) {
        const handle=controls.find(control=>label(control)==='MENU' && /OpMeun\(\)/.test(control.getAttribute('onclick')||''));
        if(visible(handle)){fresh();handle.click();return {expanded:true};}
      }
      const parents=[];for(let e=link.parentElement;e;e=e.parentElement)if(e.classList.contains('webfx-tree-container')&&!visible(e))parents.unshift(e);
      const container=parents.find(e=>visible(document.getElementById(e.id.replace(/-cont$/,'-plus'))));
      const toggle=container&&document.getElementById(container.id.replace(/-cont$/,'-plus'));
      if(toggle){fresh();toggle.click();return {expanded:true};}
      const detail=link.closest('details:not([open])');const summary=detail?.querySelector('summary');
      if(summary&&visible(summary)){fresh();summary.click();return {expanded:true};}
      return {hidden:true};
    }
    // Follow the original authenticated link, preserving its target and session parameters.
    fresh();
    // If this click replaces the dashboard with a different origin, the
    // extension can no longer release the old origin's sessionStorage lock.
    // Release this navigation lease as its own document actually leaves.
    if(lease?.owner===p.owner){
      const navigationId=crypto.randomUUID();
      sessionStorage.setItem(KEY,JSON.stringify({...lease,navigationId}));
      window.addEventListener('pagehide',()=>{
        const current=JSON.parse(sessionStorage.getItem(KEY)||'null');
        if(current?.owner===p.owner&&current.navigationId===navigationId)sessionStorage.removeItem(KEY);
      },{once:true});
    }
    link.click();return {clicked:true};
  }
  class Connection{
    constructor({api=globalThis.chrome,label='工具',sourceId=0,onSource=()=>{},onStatus=()=>{}}={}){
      Object.assign(this,{api,label,sourceId,onSource,onStatus});this.owner=(api?.runtime?.id||'tool')+':'+Math.random().toString(36).slice(2);this.source=null;this.depth=0;this.held=new Set();this.lost=false;this.stopped=false;this.scanPromise=null;this.clicks=new Map();
    }
    async inject(tabId,command,target,frameId){
      let timer;const deadline=Date.now()+6000;
      try{return await Promise.race([this.api.scripting.executeScript({target:frameId===undefined?{tabId,allFrames:true}:{tabId,frameIds:[frameId]},world:'MAIN',injectImmediately:true,func:pageBridge,args:[command,{target,owner:this.owner,label:this.label,deadline}]}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(fault('PORTAL_WAIT','Portal 正在載入，完成後會自動連接。')),6500);})]);}finally{clearTimeout(timer);}
    }
    async tabs(){const list=await this.api.tabs.query({});return list.filter(t=>HOST.test(t.url||'')).sort((a,b)=>(b.id===this.sourceId)-(a.id===this.sourceId)||Number(!!b.active)-Number(!!a.active)||(b.lastAccessed||0)-(a.lastAccessed||0));}
    async scan(target){
      const tabs=await this.tabs(),rows=[];
      for(const tab of tabs){try{for(const f of await this.inject(tab.id,'probe',target))if(f.result)rows.push({tab,frameId:f.frameId,...f.result});}catch{}}
      return {tabs,rows};
    }
    choose(rows){
      const eligible=rows.filter(r=>!r.login&&!r.loading),ready=eligible.filter(r=>r.ready);
      const direct=eligible.filter(r=>r.link&&!r.homeEntry);
      const menus=direct.length||ready.length?direct:eligible.filter(r=>r.link);
      // Prefer the original document and its native pop-up. Never choose by patient name.
      const local=ready.filter(r=>r.tab.id===this.sourceId||r.tab.openerTabId===this.sourceId);
      if(local.length===1)return local[0];if(local.length>1)throw fault('PORTAL_AMBIGUOUS','目前有多個可用頁面，請切到要使用的 Portal 再按「重新連接」。');
      const sourceMenu=menus.filter(r=>r.tab.id===this.sourceId);
      if(sourceMenu.length===1)return sourceMenu[0];
      if(ready.length===1)return ready[0];
      const active=ready.filter(r=>r.tab.active);if(active.length===1)return active[0];
      if(ready.length>1)throw fault('PORTAL_AMBIGUOUS','找到多個可用 Portal，請切到要使用的視窗，再按工具的「重新連接」。');
      if(menus.length===1)return menus[0];const activeMenu=menus.filter(r=>r.tab.active);if(activeMenu.length===1)return activeMenu[0];
      if(menus.length>1)throw fault('PORTAL_AMBIGUOUS','找到多個 Portal 選單，請切到要使用的視窗再連接。');return null;
    }
    async acquire(tabId,target){
      const results=await this.inject(tabId,'lease',target);this.held.add(tabId);
      if(!results.some(r=>r.result?.owned)||results.some(r=>r.result?.blocked)){await this.release();throw fault('PORTAL_BUSY','另一個工具正在操作此 Portal，完成後即可連接。');}
    }
    async release(){const ids=[...this.held];this.held.clear();await Promise.allSettled(ids.map(id=>this.inject(id,'release',TARGETS.query)));}
    async resolve(kind='query'){
      if(this.scanPromise)return this.scanPromise;
      this.scanPromise=this.locate(kind).finally(()=>{this.scanPromise=null;});return this.scanPromise;
    }
    async locate(kind){
      const target=TARGETS[kind];if(!target)throw Error('未知 Portal 功能');
      const end=Date.now()+18000;
      const related=new Set();
      while(Date.now()<end&&!this.stopped){
        const {tabs,rows}=await this.scan(target);
        if(this.stopped)throw fault('PORTAL_CANCELLED','已取消等候 Portal。');
        for(const tab of tabs)if(related.has(tab.openerTabId))related.add(tab.id);
        const candidates=related.size?rows.filter(row=>related.has(row.tab.id)):rows;
        const chosen=this.choose(candidates);
        if(!chosen){
          if(related.size){
            if(candidates.some(row=>row.ambiguous))throw fault('PORTAL_AMBIGUOUS','找到多個住院作業入口，請選擇要使用的 Portal 視窗。');
            await new Promise(r=>setTimeout(r,450));continue;
          }
          if(rows.some(row=>row.ambiguous))throw fault('PORTAL_AMBIGUOUS','找到多個無法區分的 Portal 作業入口，請選擇要使用的頁面。');
          if(!tabs.length||rows.some(r=>r.login))throw fault('PORTAL_WAIT','等待 Portal 登入；登入完成後會自動連接。');
          if(rows.some(r=>r.loading))throw fault('PORTAL_WAIT','Portal 正在載入，完成後會自動連接。');
          throw fault('PORTAL_MENU','尚未找到「'+target.label+'」選單連結。請在 Portal 顯示藥事服務選單，工具會繼續偵測。');
        }
        if(chosen.blocked)throw fault('PORTAL_BUSY',(chosen.blockLabel||'另一個工具')+'正在操作此 Portal，完成後即可連接。');
        if(chosen.ready){
          if(this.depth)await this.acquire(chosen.tab.id,target);
          const previous=this.source;this.sourceId=chosen.tab.id;
          this.source={sourceId:chosen.tab.id,origin:new URL(chosen.tab.url).origin,frameId:chosen.frameId,frameOrigin:chosen.origin};
          if(!previous||JSON.stringify(previous)!==JSON.stringify(this.source))await this.onSource(this.source);
          this.onStatus('已連接 '+target.label);return this.source;
        }
        if(chosen.dirty)throw fault('PORTAL_DIRTY','Portal 有尚未完成的輸入，請完成或取消後再切換工具。');
        const key=chosen.tab.id+':'+chosen.frameId+':'+kind+':'+chosen.path;
        if(this.clicks.has(key)&&Date.now()-this.clicks.get(key)<30000){await new Promise(r=>setTimeout(r,450));continue;}
        this.onStatus('正在透過 Portal 選單開啟'+(chosen.homeEntry?'查詢處理(住)':target.label)+'…');
        await this.acquire(chosen.tab.id,target);
        if(this.stopped)throw fault('PORTAL_CANCELLED','已取消等候 Portal。');
        this.clicks.set(key,Date.now());
        if(chosen.homeEntry)related.add(chosen.tab.id);
        try{
          const response=await this.inject(chosen.tab.id,'follow',target,chosen.frameId),r=response[0]?.result;
          if(r?.expanded)this.clicks.delete(key);
          if(r?.dirty)throw fault('PORTAL_DIRTY','Portal 有尚未完成的輸入，請先完成或取消。');
          if(r?.hidden||r?.ambiguous||r?.missing)throw fault('PORTAL_MENU','請在 Portal 展開「'+target.label+'」所屬選單，工具會自動接續。');
        }catch(e){if(e.code)throw e;/* A real link can destroy the executing frame. Observe, never replay immediately. */}
        await new Promise(r=>setTimeout(r,450));
      }
      throw fault('PORTAL_WAIT','正在等候 Portal 頁面；載入完成後會自動連接。');
    }
    async run(kind,fn){
      // A user action can arrive while the initial connection is still resolving.
      // Wait for that cycle before switching targets; never hand it a stale source.
      if(this.depth){
        if(this.scanPromise||!this.source||this.kind!==kind||this.finishing){await this.idle;return this.run(kind,fn);}
        await this.assert();return fn(this.source);
      }
      this.depth=1;this.kind=kind;this.lost=false;this.finishing=false;
      let completed;this.idle=new Promise(r=>{completed=r;});
      try{await this.resolve(kind);this.timer=setInterval(()=>{void this.assert().catch(()=>{this.lost=true;});},15000);return await fn(this.source);}
      finally{clearInterval(this.timer);this.finishing=true;try{await this.release();}finally{this.depth=0;this.finishing=false;completed();}}
    }
    async assert(){if(this.lost)throw fault('PORTAL_LOST','Portal 連接已改變，已停止後續操作。請重新連接並核對結果。');if(this.depth&&this.source)await this.acquire(this.source.sourceId,TARGETS.query);}
    async preferActive(){const tabs=await this.api.tabs.query({active:true,lastFocusedWindow:true});if(tabs[0]&&HOST.test(tabs[0].url||''))this.sourceId=tabs[0].id;this.clicks.clear();}
    watch({needed,connect,blocked=()=>false}){
      let pending=false,last=0;
      const tick=async()=>{if(this.stopped||pending||this.depth||blocked()||!needed()||Date.now()-last<2500)return;pending=true;last=Date.now();try{await connect();}catch(e){this.onStatus(e.message);}finally{pending=false;}};
      const event=()=>{void tick();};
      for(const name of ['onCreated','onUpdated','onRemoved','onActivated'])this.api.tabs[name]?.addListener(event);
      const interval=setInterval(event,4000);globalThis.addEventListener?.('focus',event);
      const dispose=()=>{this.stopped=true;clearInterval(interval);clearInterval(this.timer);for(const name of ['onCreated','onUpdated','onRemoved','onActivated'])this.api.tabs[name]?.removeListener?.(event);globalThis.removeEventListener?.('focus',event);void this.release();};
      globalThis.addEventListener?.('pagehide',dispose,{once:true});return dispose;
    }
  }
  globalThis.PharmacyPortal={Connection,pageBridge,TARGETS,isPortal:url=>HOST.test(url||'')};
})();
