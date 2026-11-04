const BED_PRESET_KEY='cart-label-bed-presets-v1';
const BED_PRESET_EXAMPLE='# 床號可用逗號、頓號、空格或換行分隔；依輸入順序列印\n[12HN] 01-01、01-02、01-03、02-01\n[13HN] 01-01、01-02\n';
let bedPresets=[],presetSelection=new Set();
function wardKey(value){return value.trim().toUpperCase();}
function bedKey(value){return value.trim().toUpperCase().split('-').map(p=>p.replace(/^0+(?=\d)/,'')).join('-');}
function labelBed(text){const lines=text.split('\n'),parts=lines[0].split('  ');return {ward:parts.shift().trim(),bed:parts.join('  ').trim(),lines};}
function isVacantLabel(text){const {bed,lines}=labelBed(text);return Boolean(bed)&&!(lines[1]||'').trim()&&!(lines[2]||'').trim();}
function parseBedPresets(text){
 if(text.length>200000)throw Error('床位設定檔過大，請限制在 200 KB 以內。');
 const wards=[],seenWards=new Set();let current=null,seenBeds=new Set(),total=0;
 for(const [i,raw] of text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n').entries()){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  for(const token of (line.match(/\[[^\[\]]*\]|[^\s,，、;；]+/g)||[])){
  const heading=token.match(/^\[([^\[\]]+)\]$/);
  if(heading){
   if(current&&!current.beds.length)throw Error(`病房 ${current.ward} 尚未設定床位。`);
   const ward=heading[1].trim(),key=wardKey(ward);
   if(!ward||ward.length>40||/[\s\x00-\x1f]/.test(ward))throw Error(`第 ${i+1} 行：病房名稱不可包含空白。`);
   if(seenWards.has(key))throw Error(`第 ${i+1} 行：病房 ${ward} 重複。`);
   seenWards.add(key);current={ward,beds:[]};wards.push(current);seenBeds=new Set();continue;
  }
  if(!current)throw Error(`第 ${i+1} 行：請先輸入 [病房]，再輸入床號。`);
  if(!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(token)||token.length>32)throw Error(`第 ${i+1} 行：床號格式無效，請使用例如 01-01，並以逗號、頓號、空格或換行分隔。`);
  const key=bedKey(token);if(seenBeds.has(key))throw Error(`第 ${i+1} 行：${current.ward} 的床號 ${token} 重複。`);
  seenBeds.add(key);current.beds.push(token);if(++total>2000)throw Error('最多可設定 2,000 個床位。');
  }
 }
 if(current&&!current.beds.length)throw Error(`病房 ${current.ward} 尚未設定床位。`);
 if(!wards.length)throw Error('請至少設定一個病房與床位。');return wards;
}
function serializeBedPresets(wards){return '# 病房預設床位；可用逗號、頓號、空格或換行分隔，依輸入順序列印\r\n'+wards.map(w=>'['+w.ward+'] '+w.beds.join('、')).join('\r\n\r\n')+'\r\n';}
function mergeBedPresets(labels,wards,selected){
 const active=wards.filter(w=>selected.has(wardKey(w.ward))),byWard=new Map(),seen=new Set();
 for(const text of labels){
  const {ward,bed}=labelBed(text),key=wardKey(ward),identity=JSON.stringify([key,bedKey(bed)]);
  seen.add(identity);if(!byWard.has(key))byWard.set(key,[]);byWard.get(key).push(text); // 同一床多位病人（例如母嬰同床）全部保留
 }
 const result=[];let vacancies=0,extra=0;
 for(const preset of active){
  const key=wardKey(preset.ward),patients=byWard.get(key)||[],byBed=new Map();
  for(const text of patients){const k=bedKey(labelBed(text).bed);if(!byBed.has(k))byBed.set(k,[]);byBed.get(k).push(text);}
  for(const bed of preset.beds){
   const matches=byBed.get(bedKey(bed));
   if(matches){for(const match of matches){const {lines}=labelBed(match);result.push(preset.ward+'  '+bed+'\n'+lines.slice(1).join('\n'));}byBed.delete(bedKey(bed));}
   else{result.push(preset.ward+'  '+bed+'\n\n');vacancies++;}
  }
  const rest=[...byBed.values()].flat();result.push(...rest);extra+=rest.length;byWard.delete(key);
 }
 for(const text of labels)if(byWard.has(wardKey(labelBed(text).ward)))result.push(text);
 return {labels:result,vacancies,extra};
}
function prepareLabelRecords(text,exclude){
 const enabled=$('useBedPresets').checked&&bedPresets.some(w=>presetSelection.has(wardKey(w.ward)));
 const raw=enabled&&!text.trim()?{labels:[],mode:'未輸入病人資料。'}:extractLabels(text,enabled);
 // 排除的出院病人：啟用預設床位時該床位變成空床標籤
 const result=exclude?.size?{...raw,labels:raw.labels.filter(t=>!exclude.has(t)),excluded:raw.labels.filter(t=>exclude.has(t)).length}:raw;
 if(!enabled)return {...result,vacancies:0,extra:0,usedPresets:false};
 const present=new Set(raw.labels.filter(text=>!isVacantLabel(text)).map(text=>wardKey(labelBed(text).ward)));
 const missingWards=bedPresets.filter(w=>presetSelection.has(wardKey(w.ward))&&!present.has(wardKey(w.ward)));
 return {...result,...mergeBedPresets(result.labels,bedPresets,presetSelection),usedPresets:true,missingWards};
}
function chooseEmptyWards(wards){
 return new Promise(resolve=>{
  const dialog=$('emptyWardsDialog');$('emptyWardsList').replaceChildren();
  const choices=wards.map(ward=>{
   const row=document.createElement('label');row.className='duplicate-row';
   const check=document.createElement('input');check.type='checkbox';check.checked=true;
   const text=document.createElement('span');text.textContent=`${ward.ward}：${ward.beds.length} 張空床標籤`;
   row.append(check,text);$('emptyWardsList').append(row);return {key:wardKey(ward.ward),check};
  });
  const finish=value=>{dialog.oncancel=null;dialog.close();resolve(value);};
  $('emptyWardsCancel').onclick=()=>finish(null);
  $('emptyWardsSkip').onclick=()=>finish(new Set(choices.map(c=>c.key)));
  $('emptyWardsContinue').onclick=()=>finish(new Set(choices.filter(c=>!c.check.checked).map(c=>c.key)));
  dialog.oncancel=e=>{e.preventDefault();finish(null);};dialog.showModal();
 });
}
function saveBedPresets(){
 try{localStorage.setItem(BED_PRESET_KEY,JSON.stringify({text:serializeBedPresets(bedPresets),selected:[...presetSelection],enabled:$('useBedPresets').checked,outside:$('vacantBedOutside').checked}));return true;}
 catch{$('presetStatus').textContent='本次已套用，但此瀏覽器無法記住床位；請匯出 TXT 保存。';return false;}
}
function showPresetWards(){
 $('presetWards').replaceChildren();
 for(const preset of bedPresets){
  const row=document.createElement('label');row.className='check-option';const check=document.createElement('input');check.type='checkbox';check.checked=presetSelection.has(wardKey(preset.ward));
  const name=document.createElement('span');name.textContent=`${preset.ward}（${preset.beds.length} 床）`;row.append(check,name);$('presetWards').append(row);
  check.onchange=()=>{const key=wardKey(preset.ward);check.checked?presetSelection.add(key):presetSelection.delete(key);saveBedPresets();markDirty();};
 }
 $('exportPresets').disabled=!bedPresets.length;
}
function downloadPresetText(text,name){const url=URL.createObjectURL(new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function initializeBedPresets(){
 try{const saved=JSON.parse(localStorage.getItem(BED_PRESET_KEY)||'null');if(saved){bedPresets=parseBedPresets(saved.text);presetSelection=new Set((Array.isArray(saved.selected)?saved.selected:[]).filter(k=>bedPresets.some(w=>wardKey(w.ward)===k)));$('useBedPresets').checked=Boolean(saved.enabled);$('vacantBedOutside').checked=Boolean(saved.outside);$('presetStatus').textContent=`已載入 ${bedPresets.length} 個病房的床位設定。`;}}catch{$('presetStatus').textContent='尚未載入床位設定，可匯入 TXT 或手動設定。';}
 showPresetWards();
 $('useBedPresets').onchange=()=>{saveBedPresets();markDirty();};
 $('vacantBedOutside').onchange=()=>{saveBedPresets();render();};
 $('editPresets').onclick=()=>{$('presetText').value=bedPresets.length?serializeBedPresets(bedPresets):'';$('presetError').textContent='';$('presetDialog').showModal();};
 $('presetCancel').onclick=()=>$('presetDialog').close();
 $('presetSave').onclick=()=>{
  try{const parsed=parseBedPresets($('presetText').value),old=new Set(bedPresets.map(w=>wardKey(w.ward)));
   presetSelection=new Set(parsed.filter(w=>!old.has(wardKey(w.ward))||presetSelection.has(wardKey(w.ward))).map(w=>wardKey(w.ward)));bedPresets=parsed;$('useBedPresets').checked=true;showPresetWards();
   if(saveBedPresets())$('presetStatus').textContent=`已記住 ${parsed.length} 個病房、${parsed.reduce((n,w)=>n+w.beds.length,0)} 個床位。`;
   $('presetDialog').close();markDirty();
  }catch(error){$('presetError').textContent=error.message;}
 };
 $('importPresets').onclick=()=>$('presetFile').click();
 $('presetFile').onchange=async()=>{
  const file=$('presetFile').files[0];if(!file)return;
  try{
   if(file.size>400000)throw Error('床位設定檔過大，請使用小於 400 KB 的 TXT。');
   const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer);let text;
   if(bytes[0]===255&&bytes[1]===254)text=new TextDecoder('utf-16le',{fatal:true}).decode(bytes);
   else if(bytes[0]===254&&bytes[1]===255)text=new TextDecoder('utf-16be',{fatal:true}).decode(bytes);
   else text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   parseBedPresets(text);$('presetText').value=text;$('presetError').textContent='請確認床位清單，按「儲存並啟用」後取代目前設定。';$('presetDialog').showModal();
  }catch(error){$('presetStatus').textContent='匯入失敗：'+error.message+' 請以記事本 UTF-8 格式儲存。';}
  finally{$('presetFile').value='';}
 };
 $('exportPresets').onclick=()=>downloadPresetText(serializeBedPresets(bedPresets),'病房預設床位.txt');
 $('presetExample').onclick=()=>downloadPresetText(BED_PRESET_EXAMPLE,'病房預設床位_範例.txt');
}

// ---------- 用記錄過的床位更新預設床位 ----------
const PRESET_DECLINED_KEY='cart-label-preset-declined-v1';
function bedCompare(a,b){const pa=bedKey(a).split('-'),pb=bedKey(b).split('-');for(let i=0;i<Math.max(pa.length,pb.length);i++){const x=pa[i]||'',y=pb[i]||'';const nx=/^\d+$/.test(x),ny=/^\d+$/.test(y);const c=nx&&ny?Number(x)-Number(y):x.localeCompare(y,'en');if(c)return c;}return 0;}
function normBed(bed){return bed.split('-').map(p=>/^\d$/.test(p)?'0'+p:p).join('-');}
// 依床號順序插入（保留原本的排列，只把新床位放到第一個比它大的床位前面）
function insertBeds(wards,additions){
 const out=wards.map(w=>({ward:w.ward,beds:[...w.beds]}));let added=0,newWards=0;
 for(const [ward,beds] of additions){
  let w=out.find(x=>wardKey(x.ward)===wardKey(ward));
  if(!w){w={ward,beds:[]};out.push(w);newWards++;}
  const have=new Set(w.beds.map(bedKey));
  for(const bed of [...beds].sort(bedCompare)){
   if(have.has(bedKey(bed)))continue;
   const at=w.beds.findIndex(b=>bedCompare(b,bed)>0);
   if(at<0)w.beds.push(normBed(bed));else w.beds.splice(at,0,normBed(bed));
   have.add(bedKey(bed));added++;
  }
 }
 return {wards:out,added,newWards};
}
function declinedBeds(){try{return new Set(JSON.parse(localStorage.getItem(PRESET_DECLINED_KEY)||'[]'));}catch{return new Set();}}
function saveDeclined(set){try{localStorage.setItem(PRESET_DECLINED_KEY,JSON.stringify([...set].slice(-2000)));}catch{}}
// 轉換時：病人所在床位不在（已勾選病房的）預設床位中 → 詢問是否加入；回傳 true＝有更新、false＝沒更新、null＝取消
async function offerNewBeds(labels){
 const active=bedPresets.filter(w=>presetSelection.has(wardKey(w.ward)));
 if(!active.length)return false;
 const declined=declinedBeds(),found=new Map();
 for(const text of labels){
  if(isVacantLabel(text))continue;
  const {ward,bed,lines}=labelBed(text);if(!bed)continue;
  const preset=active.find(w=>wardKey(w.ward)===wardKey(ward));if(!preset)continue;
  const key=wardKey(ward)+'|'+bedKey(bed);
  if(preset.beds.some(b=>bedKey(b)===bedKey(bed))||declined.has(key)||found.has(key))continue;
  found.set(key,{ward:preset.ward,bed,name:(lines[1]||'').trim(),key});
 }
 if(!found.size)return false;
 const list=[...found.values()].sort((a,b)=>a.ward.localeCompare(b.ward)||bedCompare(a.bed,b.bed));
 const chosen=await new Promise(resolve=>{
  const dialog=$('newBedsDialog');$('newBedsList').replaceChildren();
  $('newBedsSummary').textContent=`有 ${list.length} 個床位不在預設床位中。`;
  const rows=list.map(d=>{const row=document.createElement('label');row.className='duplicate-row';const check=document.createElement('input');check.type='checkbox';check.checked=true;const t=document.createElement('span');t.textContent=`${d.ward}　${d.bed}　${d.name}`;row.append(check,t);$('newBedsList').append(row);return {d,check};});
  const finish=v=>{dialog.oncancel=null;dialog.close();resolve(v);};
  $('newBedsCancel').onclick=()=>finish(null);
  $('newBedsSkip').onclick=()=>finish({add:[],decline:list});
  $('newBedsContinue').onclick=()=>finish({add:rows.filter(r=>r.check.checked).map(r=>r.d),decline:rows.filter(r=>!r.check.checked).map(r=>r.d)});
  dialog.oncancel=e=>{e.preventDefault();finish(null);};dialog.showModal();
 });
 if(chosen===null)return null;
 if(chosen.decline.length){chosen.decline.forEach(d=>declined.add(d.key));saveDeclined(declined);}
 if(!chosen.add.length)return false;
 const additions=new Map();for(const d of chosen.add){if(!additions.has(d.ward))additions.set(d.ward,[]);additions.get(d.ward).push(d.bed);}
 const res=insertBeds(bedPresets,additions);bedPresets=res.wards;saveBedPresets();showPresetWards();
 $('presetStatus').textContent=`已加入 ${res.added} 個新床位到預設床位。`;
 return true;
}
// 「從列印紀錄帶入」：列印記憶（近 14 天，含空床）與目前資料中的床位，合併進預設床位後開啟編輯視窗確認
document.addEventListener('managed-app-ready',()=>{document.getElementById('presetsResetDeclined').onclick=()=>{try{localStorage.removeItem(PRESET_DECLINED_KEY);}catch{}$('presetStatus').textContent='已清除「不加入」的床位紀錄，下次讀到會再詢問。';};document.getElementById('presetsFromHistory').onclick=()=>{
 const additions=new Map(),add=(ward,bed)=>{if(!ward||!bed||!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(bed))return;const k=[...additions.keys()].find(w=>wardKey(w)===wardKey(ward))||ward;if(!additions.has(k))additions.set(k,[]);additions.get(k).push(bed);};
 let rows=[];try{rows=typeof readHistory==='function'?readHistory():[];}catch{}
 rows.forEach(r=>add(r.ward,r.bed));
 (typeof records!=='undefined'?records:[]).forEach(t=>{const {ward,bed}=labelBed(t);add(ward,bed);});
 if(!additions.size){$('presetStatus').textContent='列印紀錄與目前資料中沒有床位可帶入。';return;}
 const res=insertBeds(bedPresets,additions);
 $('presetText').value=serializeBedPresets(res.wards);
 $('presetError').textContent=res.added?`已從列印紀錄帶入 ${res.added} 個床位${res.newWards?`（含 ${res.newWards} 個新病房）`:''}，請確認後按「儲存並啟用」。`:'列印紀錄中的床位都已在預設床位中。';
 $('presetDialog').showModal();
};});
