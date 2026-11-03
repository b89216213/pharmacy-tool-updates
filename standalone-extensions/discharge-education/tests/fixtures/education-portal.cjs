// A simulated hospital form based on observed control IDs and conditional states.
// All patients, prescriptions and submission outcomes here are synthetic.
module.exports=function installFixture(schema){
 const N='NTUHWeb1_InPatInsertNavigatorBox_',O=N+'InPatOrderListBox_',D=O+'InPatOrderQueryBox_',Q=N+'InPatQueryBox_',E='NTUHWeb1_EditorBox_',C=E+'ContentBox_';
 const people=['合成甲','合成乙','合成丙','合成丁'].map((name,i)=>({account:'26X'+String(i+1).padStart(8,'0'),mrn:String(900001+i),name}));
 window.fixture={phase:'home',person:people[0],values:{},selected:[],sent:[],behavior:'success',changes:[],fields:{},baseDate:'20261103',days:'1',queryMrn:''};
 const f=window.fixture,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const orders=()=>[{sequence:'0001',status:'確認',phase:'出院',orderDate:'20261103',number:'W0021'},{sequence:'0002',status:'停用',phase:'出院',orderDate:'20261103',number:'W0021'},{sequence:'0003',status:'確認',phase:'出院',orderDate:'20261102',number:'W0022'},{sequence:'0004',status:'確認',phase:'一般',orderDate:'20261103',number:'W0021'},{sequence:'0005',status:'確認',phase:'出院',orderDate:'20261103',number:'W9999'}];
 const byId=id=>document.getElementById(id),button=(id,label)=>`<button type="button" id="${id}">${label}</button>`,later=fn=>setTimeout(()=>{fn();render();},30);
 function reset(){f.selected=[];f.values={};for(const [k,s]of Object.entries(schema)){f.values[k]=s.type==='radio'?!!s.checked:s.type==='checkbox'?false:s.tag==='select'?'':s.type==='submit'?s.labelExcerpt:'';}f.values.rdbEducationType_1=true;f.values.rdbEducationType_0=false;f.values.rdbIsComplete_0=true;f.values.rdbIsComplete_1=false;f.created='';f.portalStatus='';}
 function identity(pre){return ['lblAccountIdse','lblChartNo','lblPatientName'].map((s,i)=>`<span id="${pre+s}">${esc([f.person.account,f.person.mrn,f.person.name][i])}</span>`).join(' ');}
 function table(id,rows,selectable){return `<table id="${id}"><tr>${(selectable?['勾','','序號','狀態','階段','開方日','處方號']:['序號','狀態','階段','類','開方日','處方號']).map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map((r,i)=>`<tr>${selectable?`<td><input id="${id}_ctl${i+2}_ckbSelect" type="checkbox"></td><td><input type="button" id="${id}_ctl${i+2}_btnSelect" value="選"></td>`:''}<td>${r.sequence}</td><td>${r.status}</td><td>${r.phase}</td>${selectable?'':'<td>A</td>'}<td>${r.orderDate}</td><td>${r.number}</td></tr>`).join('')}</table>`;}
 function render(){
  let s=button('NTUHWeb1_ChooseFunctionBox_InPatEducationRecord','住院登錄');
  if(['query','patients'].includes(f.phase)){s+=`<label><input type="radio" id="${Q}rdbQueryByPatientId">病人</label><input id="${Q}txbChartNo" value="${esc(f.queryMrn)}">${button(Q+'btnQuery','查詢')}`;if(f.phase==='patients'){s+=`<table id="${N}InPatListBox_dgrPatientList"><tr><th></th><th>帳號</th><th>姓名</th></tr>${[{account:'26X99999999',name:'舊住院'},f.person].map((p,i)=>`<tr><td><input type="button" id="${N}InPatListBox_dgrPatientList_ctl${i+2}_btnSelect" value="選"></td><td>${p.account}</td><td>${p.name}</td></tr>`).join('')}</table>`;}}
  if(f.phase==='orders'){s+=identity(O+'InPatientInfoBox_')+`<input id="${D}txbBaseDate" value="${f.baseDate}"><input id="${D}txbDayRange" value="${f.days}">${button(D+'btnQueryByDate','顯示日期範圍內處方')}`+table(O+'dgrPhrOrder',orders(),true);}
  if(f.phase==='editor'){
   s+=identity(E+'PatientInfoBox_')+table(E+'InPatRxChosenBox_dgrPhrOrder',f.selected,false);const no=f.values.rdbIsComplete_1;
   for(const [k,x]of Object.entries(schema)){
    if(no&&!/^rdbEducationType_|^rdbIsComplete_|^txbNotCompleteCause$|^ddlPharmacy$/.test(k))continue;
    if(!no&&k==='txbNotCompleteCause')continue;
    if(k==='txbPatientFamilyNote'&&!f.values.chkCareGiverType_1||k==='txbOtherCareGiver'&&!f.values.chkCareGiverType_3||k==='txbOtherLanguage'&&!f.values.chkLanguageType_6||k==='txbOtherPatientSpeciality'&&!f.values.chkPatientSpeciality_5)continue;
    let disabled=!!x.disabled;if(/^chkPatientSpeciality_[0-5]$/.test(k))disabled=!f.values.rdbLearningObstacleYES;if(/^ckbLearningAffect_/.test(k))disabled=!f.values.rdbLearningAffectYES;
    const attrs=`id="${C+k}" ${disabled?'disabled':''}`;let name=k.replace(/_[0-9]+$/,'').replace(/YES$|NO$/,'');
    if(x.tag==='select')s+=`<label>${x.labelExcerpt?.slice(0,5)}<select ${attrs}>${x.options.map(o=>`<option value="${o.value}" ${f.values[k]===o.value?'selected':''}>${o.text}</option>`).join('')}</select></label>`;
    else if(x.tag==='textarea')s+=`<label>摘要<textarea ${attrs}>${esc(f.values[k])}</textarea></label>`;
    else s+=`<label><input ${attrs} name="${name}" type="${x.type==='submit'?'button':x.type||'text'}" value="${esc(x.type==='radio'?x.value:x.type==='checkbox'?'on':f.values[k])}" ${['radio','checkbox'].includes(x.type)&&f.values[k]?'checked':''}>${x.labelExcerpt||k}</label>`;
   }
   s+=`<span id="${C}lblCreateDateTime">${f.created||''}</span><span id="${C}lblSendVerifyDateTime">${f.created||''}</span><span id="${C}lblStatusName">${f.portalStatus||''}</span>${button(E+'btnTeamLeader','送組長')}`;
  }
  document.body.innerHTML=s;document.body.style.cssText='font:14px sans-serif';
  byId('NTUHWeb1_ChooseFunctionBox_InPatEducationRecord').onclick=()=>later(()=>{reset();f.phase='query';});
  if(byId(Q+'btnQuery'))byId(Q+'btnQuery').onclick=()=>later(()=>{f.queryMrn=byId(Q+'txbChartNo').value;f.person=people.find(p=>p.mrn===f.queryMrn)||people[0];f.phase='patients';});
  if(f.phase==='patients')document.querySelectorAll('input[id$="_btnSelect"]').forEach(e=>e.onclick=()=>later(()=>{f.phase='orders';}));
  if(f.phase==='orders'){
   byId(D+'btnQueryByDate').onclick=()=>later(()=>{f.baseDate=byId(D+'txbBaseDate').value;f.days=byId(D+'txbDayRange').value;});
   document.querySelectorAll('input[id$="_btnSelect"]').forEach(e=>e.onclick=()=>{const chosen=orders().filter((r,i)=>byId(O+'dgrPhrOrder_ctl'+(i+2)+'_ckbSelect').checked);later(()=>{reset();f.selected=chosen;f.phase='editor';});});
  }
  if(f.phase==='editor'){
   for(const e of document.querySelectorAll('input,select,textarea'))if(e.id.startsWith(C))e.addEventListener('change',()=>{const k=e.id.slice(C.length);if(e.type==='radio'){for(const other of document.querySelectorAll('input[type=radio]'))if(other.name===e.name)f.values[other.id.slice(C.length)]=other===e;}else f.values[k]=e.type==='checkbox'?e.checked:e.value;f.changes.push(k);if(/rdbIsComplete_|chkCareGiverType_|chkLanguageType_|LearningObstacle|chkPatientSpeciality_|LearningAffect(?:YES|NO)/.test(k))later(()=>{});});
   byId(E+'btnTeamLeader').onclick=()=>{f.sent.push({patient:{...f.person},selected:structuredClone(f.selected),values:structuredClone(f.values)});if(f.behavior==='success'&&f.person.mrn!==f.failMrn)later(()=>{f.created='2026/11/03 15:00:00';f.portalStatus='組長核定';});};
  }
 }
 window.fixtureRender=render;reset();render();
};
