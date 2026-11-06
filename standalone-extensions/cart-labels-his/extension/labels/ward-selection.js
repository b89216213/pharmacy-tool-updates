// Each dialog edits one named group. It never changes another group's saved wards.
(() => {
  const names=['早上藥車','下午藥車'],dialog=$('wardDialog');
  let draft=null,noticeTimer;
  const blocked=()=>wsBusy()||ws.locked;
  const availableCodes=()=>new Set(ws.wards.map(w=>w.code));
  function normalizeCombos(){ws.combos=names.map((name,i)=>({name,wards:[...new Set((ws.combos?.[i]?.wards||[]).filter(w=>typeof w==='string'))]}));}
  function notify(text){clearTimeout(noticeTimer);$('comboStatus').textContent=text;$('comboStatus').hidden=!text;if(text)noticeTimer=setTimeout(()=>{$('comboStatus').hidden=true;},4500);}
  function chip(code){
    const wrap=wsNode('div','ward-chip'),label=wsNode('label','ward-choice'),check=wsNode('input');
    check.type='checkbox';check.checked=draft.selected.has(code);check.disabled=draft.saving;
    check.setAttribute('aria-label','勾選病房 '+code);check.dataset.focusKey='check-'+code;
    check.onchange=()=>{if(check.checked)draft.selected.add(code);else draft.selected.delete(code);renderDialog();};
    label.append(check,wsNode('span','',code));wrap.append(label);return wrap;
  }
  function renderDialog(){
    if(!draft)return;
    const focus=document.activeElement?.dataset?.focusKey,query=$('wardSearch').value.trim().toUpperCase(),available=availableCodes();
    $('wardDialogTitle').textContent='選擇'+names[draft.slot]+'病房';
    $('wardDialogDescription').textContent=draft.slot===ws.activeSlot?'儲存後會重新讀取這一組病房。':'只儲存'+names[draft.slot]+'設定，目前的'+names[ws.activeSlot]+'名單不變。';
    const campuses=[...new Set(ws.wards.map(w=>w.campus).filter(Boolean))];
    const ordered=['全部',...['兒醫','西址','健大','東址','其他'].filter(c=>campuses.includes(c)),...campuses.filter(c=>!['兒醫','西址','健大','東址','其他'].includes(c))];
    $('campusTabs').replaceChildren(...ordered.map(campus=>{const b=wsNode('button','',campus);b.type='button';b.disabled=draft.saving;b.dataset.focusKey='campus-'+campus;b.setAttribute('aria-pressed',String(!query&&draft.campus===campus));b.onclick=()=>{draft.campus=campus;$('wardSearch').value='';renderDialog();};return b;}));
    const shown=ws.wards.filter(w=>query?w.code.toUpperCase().includes(query):draft.campus==='全部'||w.campus===draft.campus);
    $('wardButtons').replaceChildren(...shown.map(w=>chip(w.code)));
    if(!shown.length)$('wardButtons').append(wsNode('p','ward-empty-hint',ws.wards.length?'找不到符合的病房':'尚未取得病房清單，請先重新連接院內系統。'));
    $('wardDraftCount').textContent='已勾選 '+draft.selected.size+' 個病房';
    $('wardDraftSelected').replaceChildren(...[...draft.selected].map(code=>{const b=wsNode('button','selected-ward'+(!available.has(code)?' unavailable':''),code+(!available.has(code)?'（目前不可用）':'')+' ×');b.type='button';b.disabled=draft.saving;b.setAttribute('aria-label','取消勾選 '+code);b.onclick=()=>{draft.selected.delete(code);renderDialog();};return b;}));
    if(!draft.selected.size)$('wardDraftSelected').append(wsNode('span','ward-empty-hint','尚未設定病房'));
    $('wardDialogStatus').textContent=draft.saving?'正在儲存…':query?'跨院區搜尋，共 '+shown.length+' 個符合的病房。':'';
    for(const id of ['applyWardSelection','cancelWardDialog','closeWardDialog','clearWardSelection','wardSearch'])$(id).disabled=draft.saving;
    $('applyWardSelection').textContent=draft.saving?'儲存中…':'儲存';
    if(focus)dialog.querySelector('[data-focus-key="'+CSS.escape(focus)+'"]')?.focus({preventScroll:true});
  }
  function renderMain(){
    normalizeCombos();const available=availableCodes();
    ws.combos.forEach((combo,index)=>{
      const active=ws.activeSlot===index,card=$('wardPresetCard'+(index+1)),button=$('loadCombo'+(index+1)),list=$('wardCardWards'+(index+1));
      card.classList.toggle('active',active);card.setAttribute('data-active',String(active));button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',combo.name+'，'+(combo.wards.join('、')||'尚未設定病房')+(active?'，目前選用':'，點選後自動讀取'));
      list.replaceChildren(...combo.wards.map(code=>wsNode('span','ward-card-code'+(ws.connected&&!available.has(code)?' unavailable':''),code)));
      if(!combo.wards.length)list.append(wsNode('span','ward-card-empty','尚未設定病房'));
      $('wardCardState'+(index+1)).textContent=active?(ws.busy?'讀取中':'目前選用'):'';
      $('wardCardCount'+(index+1)).hidden=true;
    });
    $('selectedWardCount').textContent='已選 '+ws.selected.size+' 個病房';$('selectedWards').textContent=[...ws.selected].join('、');
    wsControls();
  }
  function open(slot=ws.activeSlot){
    if(blocked()||![0,1].includes(slot))return;
    normalizeCombos();draft={slot,selected:new Set(ws.combos[slot].wards),campus:ws.wards.some(w=>w.campus===ws.campus)?ws.campus:'全部',saving:false};
    $('wardSearch').value='';renderDialog();dialog.showModal();$('wardSearch').focus();
  }
  async function save(){
    if(!draft||draft.saving||blocked())return;
    const editing=draft,slot=editing.slot,previous=ws.combos[slot];
    editing.saving=true;renderDialog();ws.combos[slot]={name:names[slot],wards:[...editing.selected]};
    if(!await wsSave()){ws.combos[slot]=previous;editing.saving=false;renderDialog();$('wardDialogStatus').textContent='未能儲存，請再試一次。';return;}
    ws.campus=editing.campus==='全部'?(ws.wards[0]?.campus||''):editing.campus;
    draft=null;dialog.close();renderMain();
    if(slot===ws.activeSlot){ws.selected=new Set(ws.combos[slot].wards);notify('');await wsCapture();}
    else notify('已儲存'+names[slot]+'病房；目前名單不變。');
  }
  wsWardChip=code=>draft?chip(code):wsNode('span','',code);
  wsRenderWards=()=>{renderMain();if(dialog.open)renderDialog();};
  const controls=wsControls;
  wsControls=()=>{controls();for(const id of ['loadCombo1','loadCombo2','editCombo1','editCombo2','toggleWardPanel'])$(id).disabled=blocked();};
  $('wardSearch').oninput=renderDialog;
  $('clearWardSelection').onclick=()=>{if(draft&&!draft.saving){draft.selected.clear();renderDialog();}};
  $('closeWardDialog').onclick=$('cancelWardDialog').onclick=()=>{if(draft?.saving)return;draft=null;dialog.close();};
  dialog.addEventListener('cancel',event=>{if(draft?.saving)event.preventDefault();});
  dialog.addEventListener('close',()=>{draft=null;});
  $('applyWardSelection').onclick=()=>void save();$('toggleWardPanel').onclick=()=>open();
  for(let i=0;i<2;i++){
    $('editCombo'+(i+1)).onclick=()=>open(i);
    $('saveCombo'+(i+1)).onclick=()=>void save();
    $('loadCombo'+(i+1)).onclick=()=>{if(blocked())return;notify('');void wsSwitchPreset(i);};
  }
  globalThis.WardSelection={open,refresh:renderMain};normalizeCombos();
})();
