// Real management controller with synthetic DOM, storage, network and timers.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const {mountManagement}=await import('../extension/management.js');const {TOOL_ID,MANAGEMENT_KEY}=await import('../extension/management-core.js');
 const nodes=new Map(),stored={},requests=[],timers=[],checks=[];let busy=false,blocked=true,locked=true,ready=0,offline=false,status=200;
 class Element{constructor(id){this.id=id;this.listeners={};this.value='';this.open=false;this.hidden=false;this.classList={toggle(){}};}addEventListener(k,f){this.listeners[k]=f;}showModal(){this.open=true;}close(){this.open=false;}async emit(k){await this.listeners[k]?.({preventDefault(){}});}click(){return this.emit('click');}}
 const html=fs.readFileSync(path.join(__dirname,'../extension/tool.html'),'utf8');for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Element(m[1]));const n=id=>nodes.get(id);
 global.window={PharmacyInstallation:{ready:true}};
 global.document={addEventListener(){},getElementById:n,querySelector:()=>[...nodes.values()].find(x=>x.open)};
 global.chrome={runtime:{getManifest:()=>({version:'1.6.0'})},storage:{local:{get:async k=>({[k]:stored[k]}),set:async x=>Object.assign(stored,structuredClone(x))}}};
 global.setInterval=(fn,ms)=>{timers.push({fn,ms});return timers.length;};
 const now=Date.now(),id='11111111-1111-4111-8111-111111111111';
 let reply={toolId:TOOL_ID,deviceId:id,deviceName:'合成測試電腦',policy:{revision:'0.0',rules:[{scope:'tool:'+TOOL_ID,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0},{scope:'device:'+id,disabled:false,minimumVersion:'0',effectiveAt:0,reason:'',revision:0}],serverTime:now,validUntil:now+86400000}};
 global.fetch=async(url,opts)=>{requests.push({url,opts,body:JSON.parse(opts.body)});if(offline)throw new TypeError('offline');return new Response(JSON.stringify(status===200?reply:{error:'synthetic rejected'}),{status,headers:{'content-type':'application/json'}});};
 const flush=async()=>{for(let i=0;i<30;i++)await new Promise(setImmediate);};
 const beat=async()=>{timers.find(t=>t.ms===60000).fn();await flush();};
 const tick=async()=>{timers.find(t=>t.ms===1000).fn();await flush();};
 const done=s=>{checks.push(s);console.log('PASS',s);};
 await mountManagement({isBusy:()=>busy,saveDraft:async()=>{},setBlocked:v=>blocked=v,setLocked:v=>locked=v,onReady:()=>ready++});
 assert(blocked&&locked);assert(n('management-dialog').open);assert.equal(requests.length,0);done('First opening remains locked before any network registration or Portal action');
 n('management-name').value='合成測試電腦';n('management-code').value='123';await n('management-form').emit('submit');assert.equal(requests.length,0);assert(blocked);
 n('management-code').value='0386';await n('management-form').emit('submit');await flush();assert(!blocked&&!locked);assert.equal(ready,1);assert(stored[MANAGEMENT_KEY].registered);assert.equal(n('management-code').value,'');
 const registration=requests.find(r=>r.url.endsWith('register'));assert.deepEqual(Object.keys(registration.body).sort(),['code','installationId','name','secret','toolId','version']);assert.equal(registration.body.code,'0386');assert.equal(registration.opts.credentials,'omit');assert.equal(registration.opts.referrerPolicy,'no-referrer');done('Four-digit registration preserves leading zeros and sends only the declared device metadata');
 busy=true;reply.policy.rules[1].disabled=true;reply.policy.rules[1].revision=1;reply.policy.revision='0.1';await beat();assert(blocked&&!locked);assert(!n('management-pending').hidden);assert.equal(requests.at(-1).body.ackState,'pending');
 busy=false;await tick();assert(locked);await beat();assert.equal(requests.at(-1).body.ackState,'disabled');done('A live restriction blocks new work immediately but acknowledges locking only after the active operation ends');
 await n('management-lock-update').click();assert.equal(n('update-dialog').open,false); // Delegated open-update remains reachable; app updater owns the modal.
 reply.policy.rules[1].disabled=false;reply.policy.rules[1].revision=2;reply.policy.revision='0.2';await beat();assert(!blocked&&!locked);assert.equal(ready,2);done('An allowed policy restores use without replacing preferences or registering another installation');
 reply.policy.rules[0].minimumVersion='1.6.1';reply.policy.rules[0].revision=1;reply.policy.revision='1.2';await beat();assert(blocked&&locked);assert(n('management-lock-reason').textContent.includes('1.6.1'));done('A minimum-version policy retains an accessible update path');
 const before=structuredClone(stored[MANAGEMENT_KEY]);reply={...reply,toolId:'ntuh-patch-recovery'};await beat();assert.deepEqual(stored[MANAGEMENT_KEY],before);assert(blocked);done('Cross-tool replies cannot alter a stored policy or unlock this tool');
 status=401;await beat();assert(blocked&&locked);assert(!n('management-setup').hidden);assert(n('management-lock-reason').textContent.includes('重新登記'));done('Revoked credentials require re-enrollment and do not silently allow work');
 for(const r of requests.filter(r=>r.url.endsWith('heartbeat')))assert.deepEqual(Object.keys(r.body).sort(),['ackRevision','ackState','installationId','version']);
 assert.deepEqual(Object.keys(stored),[MANAGEMENT_KEY]);done('Heartbeats and persistent management state contain no patient, ward, query or settlement payload');
 fs.writeFileSync(path.join(__dirname,'../docs/management-ui-check-results.json'),JSON.stringify({passed:checks.length,mode:'synthetic controller; no production enrollment',checks},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
