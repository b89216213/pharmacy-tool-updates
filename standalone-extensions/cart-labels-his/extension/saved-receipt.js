// A saved census receipt is distinct from the physical label state in beds.
// Hashes detect changed content; they are not signatures against malicious edits.
(function(root){
 'use strict';
 const HC=root.CartHandoverCore||(typeof require==='function'?require('./handover-core.js'):null);
 const PP=root.CartPrintPolicy||(typeof require==='function'?require('./print-policy.js'):null);
 if(!HC||!PP)throw Error('Handover and print policy must load before saved receipts.');
 const K=new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
 ]);
 const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
 function sha256(value){
  const input=new TextEncoder().encode(String(value)),size=Math.ceil((input.length+9)/64)*64,buffer=new Uint8Array(size);
  buffer.set(input);buffer[input.length]=0x80;
  const view=new DataView(buffer.buffer),bits=input.length*8;
  view.setUint32(size-8,Math.floor(bits/0x100000000));view.setUint32(size-4,bits>>>0);
  const hash=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64);
  for(let offset=0;offset<size;offset+=64){
   for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
   for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=w[i-16]+(rotate(x,7)^rotate(x,18)^(x>>>3))+w[i-7]+(rotate(y,17)^rotate(y,19)^(y>>>10));}
   let [a,b,c,d,e,f,g,h]=hash;
   for(let i=0;i<64;i++){
    const t1=(h+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+K[i]+w[i])>>>0;
    const t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;
    h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
   }
   [a,b,c,d,e,f,g,h].forEach((value,i)=>{hash[i]+=value;});
  }
  return [...hash].map(value=>value.toString(16).padStart(8,'0')).join('');
 }
 const byBed=(a,b)=>a.bed<b.bed?-1:a.bed>b.bed?1:0;
 function censusKey(beds,{day,ward,captureComplete,count}){
  if(captureComplete!==true||!HC.validDay(day)||!Array.isArray(beds)||!Number.isInteger(count)||count!==beds.length)throw Error('A complete census and exact count are required.');
  const validWard=!!HC.norm(ward)&&!/[\s\x00-\x1f]/.test(HC.norm(ward));
  const inspected=beds.length?HC.inspectBeds(beds,ward):{valid:validWard,rows:[]};
  if(!inspected.valid||inspected.rows.some(row=>row.vacant))throw Error('The census must contain valid, unique occupied beds only.');
  const rows=inspected.rows.map((row,index)=>{
   const note=beds[index].note??'';if(typeof note!=='string')throw Error('Invalid census note.');
   return {bed:row.key,chart:row.chart,text:row.text,note:HC.normalizeText(note)};
  }).sort(byBed);
  return JSON.stringify({day,ward:HC.norm(ward),rows});
 }
 function snapshotKey(snapshot,{day,ward}){
  if(snapshot?.version!==4||!PP.referenceUsable(snapshot,{day,ward}))throw Error('A valid current saved snapshot is required.');
  const beds=snapshot.beds.map(row=>({bed:HC.bedKey(row.bed),chart:HC.norm(row.chart),text:HC.normalizeText(row.text),vacant:row.vacant,known:row.known,identityOnly:row.identityOnly===true})).sort(byBed);
  return JSON.stringify({version:snapshot.version,day:snapshot.day,ward:HC.norm(snapshot.ward),status:snapshot.status,
   captureComplete:snapshot.captureComplete,bedSource:snapshot.bedSource,capturedAt:snapshot.capturedAt,savedAt:snapshot.savedAt,beds});
 }
 function create(snapshot,beds,options={}){
  return {version:1,count:options.count,censusHash:sha256(censusKey(beds,options)),snapshotHash:sha256(snapshotKey(snapshot,options))};
 }
 function matches(snapshot,beds,options={}){
  try{
   const proof=snapshot?.censusProof;
   if(proof?.version!==1||proof.count!==options.count||!Number.isInteger(proof.count)||! /^[a-f0-9]{64}$/.test(proof.censusHash)||! /^[a-f0-9]{64}$/.test(proof.snapshotHash))return false;
   const expected=create(snapshot,beds,options);
   return proof.censusHash===expected.censusHash&&proof.snapshotHash===expected.snapshotHash;
  }catch{return false;}
 }
 const api=Object.freeze({create,matches,sha256});root.CartSavedReceipt=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
