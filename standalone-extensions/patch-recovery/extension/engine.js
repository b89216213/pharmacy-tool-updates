import {portalBridge} from './bridge.js';
import {norm} from './core.js';

export class PortalEngine {
  constructor({sourceId,origin,api=globalThis.chrome,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=()=>Date.now(),status=()=>{}}){
    Object.assign(this,{sourceId,origin,api,sleep,now,status});this.frame=null;this.frameOrigin='';this.lastRead=null;this.tail=Promise.resolve();this.wardRevision=0;this.closed=false;this.phase='idle';
  }
  enqueue(task){const p=this.tail.catch(()=>{}).then(async()=>{
    if(this.portal)return this.portal.run('query',async link=>{
      const changed=this.sourceId!==link.sourceId||this.origin!==link.origin||this.frame!==link.frameId;
      this.sourceId=link.sourceId;this.origin=link.origin;this.closed=false;this.frameOrigin=link.frameOrigin;
      if(changed){this.frame=link.frameId;this.frameOrigin=link.frameOrigin;this.lastRead=null;}
      return task();
    });
    if(this.closed)throw new Error('來源分頁已關閉。');return task();
  });this.tail=p;return p;}
  async checkSource(){
    let tab;try{tab=await this.api.tabs.get(this.sourceId);}catch{this.closed=true;throw Object.assign(new Error('原院內分頁已關閉，正在等待可用的 Portal。'),{code:'SOURCE_CLOSED'});}
    if(tab.url){let origin;try{origin=new URL(tab.url).origin;}catch{}if(origin!==this.origin)throw Object.assign(new Error('原分頁已切換網站，正在等待可用的 Portal。'),{code:'SOURCE_CHANGED'});}
    return tab;
  }
  async execute(action,payload={},frame=this.frame){
    await this.checkSource();
    if(this.portal)await this.portal.assert();
    const target={tabId:this.sourceId};if(frame===null)target.allFrames=true;else target.frameIds=[frame];
    let timer;
    try{
      return await Promise.race([
        this.api.scripting.executeScript({target,world:'MAIN',injectImmediately:true,func:portalBridge,args:[action,{...payload,deadline:Date.now()+8000}]}),
        new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('原院內頁面 8 秒內未回應，請確認頁面載入完成後重試。'),{code:'INJECTION'})),8000);})
      ]);
    }catch(e){if(e.code==='INJECTION')throw e;throw Object.assign(new Error('無法讀取原院內頁面；請確認登入狀態，回到查詢處理後重新連接。'),{code:'INJECTION'});}
    finally{clearTimeout(timer);}
  }
  async call(action,payload={}){
    const results=await this.execute(action,{...payload,origin:this.frameOrigin});
    const result=results.find(x=>x.frameId===this.frame)?.result;
    if(!result){const error=new Error('原頁面正在切換，請稍候再試。');error.code='INJECTION';throw error;}
    if(result.login)throw Object.assign(new Error('院內系統已回到登入頁，請登入後重新連接。'),{code:'LOGIN'});
    if(!result.ok)throw Object.assign(new Error(result.error||'院內操作未完成。'),{code:'BRIDGE'});
    return result;
  }
  async dispatch(action,payload){
    try{return await this.call(action,payload);}catch(e){
      // A full postback may destroy the injection context after the click.
      // Observe the expected result; never send the click a second time.
      if(e.code==='INJECTION')return {possiblyNavigated:true};throw e;
    }
  }
  async discover(){
    this.phase='locating-controls';
    // The real ward control is normally in frame 0. Avoid waiting for unrelated
    // child frames when the main page already contains the known form.
    let results=await this.execute('discover',{},0);
    if(!results.some(x=>x.result?.ok&&x.result.recognized))results=await this.execute('discover',{},null);
    const candidates=results.filter(x=>x.result?.ok&&x.result.recognized);
    if(candidates.length!==1){
      if(results.some(x=>x.result?.login))throw Object.assign(new Error('請先登入院內系統，開啟查詢處理。'),{code:'LOGIN'});
      const failure=results.find(x=>x.result?.error);if(!candidates.length&&failure)throw new Error('讀取查詢處理頁面失敗：'+failure.result.error);
      throw new Error(candidates.length?'找到多個選人頁框，請只保留一個查詢處理畫面。':'找不到病房選單或「重選病人」。請在實際查詢處理分頁重新開啟工具。');
    }
    const found=candidates[0];this.frame=found.frameId;this.frameOrigin=found.result.origin;return found.result;
  }
  async diagnostics(){
    const report={phase:this.phase,frames:[],errors:[]};
    const read=async frame=>{try{const results=await this.execute('diagnostic',{},frame);for(const r of results)if(r.result?.diagnostic&&!report.frames.some(f=>f.frameId===r.frameId))report.frames.push({frameId:r.frameId,...r.result.diagnostic});}catch(e){report.errors.push(e.code||'UNAVAILABLE');}};
    await read(0);
    if(this.frame!==null&&this.frame!==0)await read(this.frame);
    else if(this.frame===null&&!report.frames.some(f=>f.wardSelect.present||f.returnButton.present))await read(null);
    return report;
  }
  async wait(read,accept,message,timeout=30000){
    const start=this.now();let lastError;
    while(this.now()-start<timeout){
      try{const r=await read();if(r.queryError)throw new Error('原系統回報查詢錯誤，請在院內頁面確認。');if(accept(r))return r;lastError=null;}
      catch(e){lastError=e;if(e.code!=='INJECTION')throw e;}
      await this.sleep(250);
    }
    throw new Error(message+(lastError?' '+lastError.message:''));
  }
  async ensureList(){
    let d=this.frame===null?await this.discover():await this.call('discover');
    if(d.loading)d=await this.wait(()=>this.call('discover'),x=>!x.loading,'院內頁面仍未完成載入。');
    if(!d.control&&d.returnable){
      this.status('正在返回病人名單…');await this.dispatch('return',{token:crypto.randomUUID(),expectedDoc:d.marker.doc});
      d=await this.wait(()=>this.call('discover'),x=>!!x.control&&!x.loading,'無法返回病人名單，請在原系統按「重選病人」。');this.lastRead=null;
    }
    if(!d.control)throw new Error('請回到查詢處理的病房選擇畫面。');
    return d;
  }
  connect(){return this.enqueue(async()=>{await this.discover();return this.ensureList();});}
  readPharmacist(){return this.enqueue(async()=>{
    // The login sidebar may be a sibling frame of the patient query form.
    const results=await this.execute('readPharmacist',{},null);
    const reads=results.filter(x=>x.result?.ok&&!x.result.login).map(x=>x.result.pharmacist).filter(Boolean);
    const names=[...new Set(reads.map(x=>x.name).filter(Boolean))];
    if(reads.some(x=>x.status==='ambiguous')||names.length>1)return {name:'',status:'ambiguous'};
    return {name:names[0]||'',status:names.length?'found':'missing'};
  });}
  async installGuard(){await this.checkSource();await this.api.scripting.executeScript({target:{tabId:this.sourceId,frameIds:[this.frame]},world:'MAIN',injectImmediately:true,files:['operation-guard.js']});}
  async toggleSmart(d,checked){
    this.phase='switching-smart-care';this.status(checked?'正在讀取 Smart Care 勾選後的名單…':'正在切回一般病房查詢…');
    const token=crypto.randomUUID(),baseline=d.marker;
    let stable='',since=0;
    try{
      const toggled=await this.dispatch('setSmartCare',{token,checked,expectedDoc:baseline.doc});
      const r=await this.wait(()=>this.call('list',{baseline,token}),x=>{
        // A native Smart Care handler may post back, replace its grid, or filter
        // rows locally. The checkbox alone is never proof of a refreshed list.
        if(x.loading||x.control?.smartCare?.checked!==checked||((toggled.expectsPostback||toggled.possiblyNavigated)&&!x.completed)||checked&&x.completed&&!x.ready){stable='';return false;}
        const signature=JSON.stringify([x.marker,x.control,x.rows,x.ready,x.completed]);
        if(signature!==stable){stable=signature;since=this.now();return false;}
        return this.now()-since>=1000;
      },'Smart Care 已操作，但 30 秒內未能確認勾選後的名單。請查看原系統並匯出相容性資訊。');
      return {result:r,responded:!!r.completed};
    }finally{try{await this.call('clearOperation',{token});}catch{}}
  }
  async queryList(d,kind,value,source,smartCare){
    const token=crypto.randomUUID(),baseline=d.marker;
    this.phase='clicking-query';
    const wardQuery=kind==='ward'||kind==='bed',ward=kind==='bed'?value.ward:value;
    this.status(wardQuery?'正在查詢 '+ward+' 的'+(source==='cleared'?'已清床':'在床')+'病人…':'正在使用原系統跨病房查詢…');
    const action=wardQuery?'queryWard':kind==='mrn'?'queryMRN':'queryPerson';
    const args=wardQuery?{ward,source,smartCare,...(kind==='bed'?{room:value.room,bed:value.bed}:{})}:kind==='mrn'?{mrn:value}:{kind:value.kind,value:value.value};
    const result=await this.dispatch(action,{token,expectedDoc:baseline.doc,...args});
    this.phase='waiting-for-list';this.status('正在等待院內名單更新…');
    let stable='',since=0;
    let r;try{r=await this.wait(()=>this.call('list',{baseline:result.baseline||baseline,token}),x=>{
      if(x.loading||!x.completed||!x.ready){stable='';return false;}
      const signature=JSON.stringify([x.marker.doc,x.marker.ends,x.marker.signature,x.control,x.rows,x.pagination]);
      if(signature!==stable){stable=signature;since=this.now();return false;}
      return this.now()-since>=800;
    },'30 秒內未能確認原系統的名單更新。請查看原系統後重試。');}finally{try{await this.call('clearOperation',{token});}catch{}}
    return r;
  }
  async performQuery(kind,value,source='inbed',smartCare=null){
    this.phase='preparing-query';
    let d=await this.ensureList();await this.installGuard();
    const previous=this.lastRead;this.lastRead=null;
    const wanted=kind==='ward'&&(typeof smartCare==='boolean'?smartCare:!!d.control?.smartCare?.checked);
    let r;
    if(wanted){
      if(!d.control?.smartCare)throw new Error('此頁沒有可辨識的 Smart Care 選項。');
      const reuse=previous?.kind==='ward'&&!previous.smartCare&&previous.source===source&&norm(previous.value)===norm(value)&&this.now()-previous.checkedAt<15000&&!d.control.smartCare.checked&&!d.control.filtered&&norm(d.control.selectedWard)===norm(value)&&JSON.stringify(previous.marker)===JSON.stringify(d.marker);
      if(d.control.smartCare.checked)d=(await this.toggleSmart(d,false)).result;
      // Establish the requested ward/source first, then capture the checkbox's
      // own result. Do not overwrite it with another ordinary query afterwards.
      if(!reuse)d=await this.queryList(d,kind,value,source,false);
      const smart=await this.toggleSmart(d,true);
      r=smart.responded?smart.result:await this.queryList(smart.result,kind,value,source,true);
    }else{
      if(d.control?.smartCare?.checked)d=(await this.toggleSmart(d,false)).result;
      r=await this.queryList(d,kind,value,source,['ward','bed'].includes(kind)?false:null);
    }
    if(kind==='ward'&&(!r.control||norm(r.control.selectedWard)!==norm(value)||r.control.filtered||!wanted&&r.rows.some(p=>norm(p.ward)!==norm(value))))throw new Error('返回的名單與指定病房不一致，請重試。');
    if(kind==='bed'){
      const part=s=>norm(s).replace(/^0+(?=\d)/,'');
      if(!r.control||norm(r.control.selectedWard)!==norm(value.ward)||part(r.control.filters?.room)!==part(value.room)||part(r.control.filters?.bed)!==part(value.bed)||r.rows.some(p=>norm(p.ward)!==norm(value.ward)||part(p.room)!==part(value.room)||value.bed&&part(p.bed)!==part(value.bed)))throw new Error('返回的名單與指定床位不一致，請重新查詢。');
    }
    if(kind==='mrn'||kind==='person'){
      const query=kind==='mrn'?{kind:'mrn',value}:value;
      if(!r.personQuery||norm(r.personQuery[query.kind])!==norm(query.value)||Object.entries(r.personQuery).some(([key,v])=>key!==query.kind&&v))throw new Error('原系統查詢條件已變更，請重新查詢。');
      if(query.kind==='account'&&r.rows.some(p=>norm(p.account)!==norm(query.value))||query.kind==='mrn'&&r.rows.some(p=>p.mrn&&norm(p.mrn)!==norm(query.value)))throw new Error('原系統結果與查詢的病人識別資料不一致。');
    }
    if(!!r.control?.smartCare?.checked!==wanted)throw new Error('Smart Care 條件與查詢結果不一致，請重新查詢。');
    const context={source:kind==='mrn'?'mrn':kind==='person'?'person':source,smartCare:wanted,queryWard:kind==='ward'?value:kind==='bed'?value.ward:'',queryMRN:kind==='mrn'?value:'',...(kind==='person'?{queryPerson:{...value}}:{}),...(kind==='bed'?{queryBed:{...value}}:{})};
    const rows=r.rows.map(p=>({...p,...context}));
    this.lastRead={kind,value,...context,checkedAt:this.now(),rows,marker:r.marker};this.phase='list-ready';
    return {...r,...context,rows,checkedAt:this.now(),kind,value};
  }
  loadWard(ward,source='inbed',smartCare=null){const rev=++this.wardRevision;return this.enqueue(async()=>{if(rev!==this.wardRevision)return {superseded:true};const r=await this.performQuery('ward',ward,source,smartCare);return {...r,superseded:rev!==this.wardRevision};});}
  queryMRN(mrn){++this.wardRevision;return this.enqueue(()=>this.performQuery('mrn',mrn));}
  queryPerson(kind,value){++this.wardRevision;return this.enqueue(()=>this.performQuery('person',{kind,value}));}
  queryBed(criteria,source='inbed'){++this.wardRevision;return this.enqueue(()=>this.performQuery('bed',{ward:criteria.ward,room:criteria.room,bed:criteria.bed||''},source,false));}
  async focusSource(){const tab=await this.checkSource();await this.api.tabs.update(tab.id,{active:true});await this.api.windows.update(tab.windowId,{focused:true});}
}
