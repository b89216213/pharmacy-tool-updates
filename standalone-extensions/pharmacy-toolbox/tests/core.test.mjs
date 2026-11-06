import test from 'node:test';
import assert from 'node:assert/strict';
import {preferences,setPreference,allowedSender,moduleFor,TOOLS} from '../extension/toolbox-core.js';
import {validateManagementReply,managementState} from '../extension/management-core.js';
test('new installations start OFF; updates preserve both explicit choices',()=>{
 assert.deepEqual(preferences(),{schema:1,barcodeReturn:false,controlledInventory:false});
 assert.deepEqual(preferences({barcodeReturn:'true',controlledInventory:1}),preferences());
 const first=setPreference(undefined,'barcodeReturn',true),next=setPreference(first,'controlledInventory',true);
 assert.deepEqual(preferences(next),{schema:1,barcodeReturn:true,controlledInventory:true});
 assert.throws(()=>setPreference(next,'unknown',true));assert.throws(()=>setPreference(next,'barcodeReturn','ON'));
});
test('only own extension and top-level exact Portal hosts may request shell actions',()=>{
 const base='chrome-extension://test-id/',id='test-id';
 assert(allowedSender({id,url:base+'app.html'},base,id));
 assert(allowedSender({id,url:'https://portal.ntuh.gov.tw/General/Login.aspx',frameId:0,tab:{id:3}},base,id));
 for(const url of ['https://portal.ntuh.gov.tw.evil.test/','https://other.ntuh.gov.tw/','javascript:alert(1)'])assert(!allowedSender({id,url,frameId:0,tab:{id:3}},base,id));
 assert(!allowedSender({id,url:'https://ihisaw.ntuh.gov.tw/',frameId:1,tab:{id:3}},base,id));
 assert(!allowedSender({id:'other',url:base+'app.html'},base,id));
});
test('four main tools and one advanced launcher are placeholders, without executable routes',()=>{
 assert.deepEqual(TOOLS.filter(t=>t.section==='main').map(t=>t.id),['patient-query','cart-labels-his','patch-recovery','discharge-education']);
 assert.equal(TOOLS.filter(t=>t.section==='advanced').length,1);
 for(const t of TOOLS){assert.equal(moduleFor(t.id).ready,false);assert.equal(t.url,undefined);}
 assert.throws(()=>moduleFor('https://outside.test'));assert.throws(()=>moduleFor('barcode-return'));
});
test('backend full scopes, disabled, minimum version and lease expiration are enforced',()=>{
 const now=1800000000000,id='11111111-1111-4111-8111-111111111111';
 const input={toolId:'ntuh-pharmacy-toolbox',deviceId:id,deviceName:'Synthetic device',policy:{revision:'0.0',serverTime:now,validUntil:now+86400000,rules:['tool:ntuh-pharmacy-toolbox','device:'+id+':ntuh-pharmacy-toolbox'].map(scope=>({scope,disabled:false,minimumVersion:'0',effectiveAt:0,revision:0,reason:''}))}};
 let record={...validateManagementReply(input,now),registered:true};assert.equal(managementState(record,'0.1.0',now).state,'allowed');
 assert.equal(managementState(record,'0.1.0',now+86400000).state,'offline');
 record.policy.rules[1].minimumVersion='0.1.1';assert.equal(managementState(record,'0.1.0',now).state,'upgrade');
 record.policy.rules[1].disabled=true;assert.equal(managementState(record,'0.1.0',now).state,'disabled');
 const wrong=structuredClone(input);wrong.policy.rules[1].scope='device:'+id;assert.throws(()=>validateManagementReply(wrong,now));
});
