import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const context={module:{exports:{}}};
vm.runInNewContext(await fs.readFile(new URL('../extension/core.js',import.meta.url),'utf8'),context);
const C=context.module.exports;
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS',name);};
// Synthetic rows exercise both production parsers. No patient screenshot data is stored.
function order(serial='0001',state='完') {
 const result=C.parseOrderCells(['',serial,state,'一般','L','20260101','TEST01','Test medicine','Test product','10 mL','TID','PO','0','健','','詳'],{patientAccount:'SYNTHETIC'});
 result.detail={start:'20260101',orderId:'synthetic-'+serial};
 return result;
}
function returned({state='完成',issued=1,total=1,rest=0}={}) {
 const table={rows:[]};
 const input={id:'synthetic_txbReturnAmount',value:'',maxLength:6};
 table.rows.push({cells:[state,'L','Test medicine','Test product',String(issued),String(total),String(rest),'0','','20260101'].map(textContent=>({textContent})),closest:()=>table,querySelector:()=>input});
 return C.readReturns({getElementById:id=>id===C.IDS.returns?table:null})[0];
}
const noMatch=(orders,rows)=>assert.throws(()=>C.matchOrders(orders,rows),e=>e.code==='ORDER_MATCH_AMBIGUOUS');
test('完 and 完成 normalize identically; existing status aliases remain valid',()=>{
 for(const [a,b] of [['完','完成'],['完成','完成'],[' 完\u00a0','完成'],['停','停用'],['確','確認']])assert.equal(C.status(a),b);
 assert.equal(C.status('未確認'),'未確認');
});
test('Single completed order matches even when all issued quantity was already returned',()=>{
 const row=C.matchOrders([order()],[returned()])[0];assert.equal(row.key,order().key);assert.equal(row.state,'完成');assert.equal(row.rest,0);
 assert.equal(C.validateAmount('1',row).valid,false);assert.equal(C.validateAmount('',row).valid,true);
});
test('Completed order with remaining quantity accepts only amounts within existing limits',()=>{
 const row=C.matchOrders([order()],[returned({issued:3,total:1,rest:2})])[0];
 assert.equal(C.validateAmount('2',row).valid,true);assert.equal(C.validateAmount('3',row).valid,false);
 assert.equal(C.validateAmount('-1',row).valid,true);assert.equal(C.validateAmount('-2',row).valid,false);
});
test('Mixed completed/confirmed/stopped orders still match by identity, not row position',()=>{
 const orders=[order('0001','完'),order('0002','確'),order('0003','停')];
 const rows=C.matchOrders(orders,[returned({state:'停用'}),returned({state:'完成'}),returned({state:'確認'})]);
 assert.deepEqual(Array.from(rows,r=>r.serial),['0003','0001','0002']);
});
test('Identical completed prescriptions stay ambiguous as a batch but match when selected individually',()=>{
 const orders=[order('0001'),order('0002')];noMatch(orders,[returned(),returned()]);
 for(const o of orders)assert.equal(C.matchOrders([o],[returned()])[0].key,o.key);
});
test('Different status, medicine, category, start date or daily totals still fail matching',()=>{
 for(const change of [{state:'確認'},{generic:'Other medicine'},{brand:'Other product'},{type:'M'},{start:'20260102'}])noMatch([order()],[{...returned(),...change}]);
 const o=order();o.detail.daily={rows:[['date','',2,'',0]]};noMatch([o],[returned()]);
});
test('Missing/duplicate prescription identity and count mismatches remain blocked',()=>{
 assert.throws(()=>C.matchOrders([order(),order()],[returned(),returned()]));
 assert.throws(()=>C.matchOrders([order()],[]));
});
test('Completed-order result verification still requires actual quantity delta and stable order identity',()=>{
 const before=C.matchOrders([order()],[returned({issued:3,total:1,rest:2})]);
 const after=C.matchOrders([order()],[returned({issued:3,total:2,rest:1})]);
 const amounts=new Map([[before[0].key,1]]);
 assert(C.checkResult(before,after,amounts));assert.equal(C.checkResult(before,before,amounts),false);
 after[0].detail={...after[0].detail,orderId:'another-order'};assert.equal(C.checkResult(before,after,amounts),false);
});
console.log(count+' status matching checks passed');
