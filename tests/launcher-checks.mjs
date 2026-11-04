import vm from 'node:vm';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
for(const slug of ['cart-labels-his','cloud-medication']){
 const dir=new URL('../standalone-extensions/'+slug+'/extension/',import.meta.url);
 const {CONFIG}=await import(new URL('tool-config.js',dir));
 let source=await fs.readFile(new URL('managed-launch.js',dir),'utf8');source=source.replace(/^import .*;\n/gm,'');
 for(const [page,scripts] of Object.entries(CONFIG.pageScripts)){
  let unlock;const appended=[],events=[],ready=new Promise(r=>unlock=r);
  const document={createElement:()=>({}),body:{append(s){appended.push(s.src);queueMicrotask(()=>s.onload());}},dispatchEvent(e){events.push({type:e.type,loaded:[...appended]});}};
  const context=vm.createContext({CONFIG,ready,document,location:{pathname:'/'+page},Event,Promise});
  const run=vm.runInContext('(async()=>{'+source+'})()',context);await Promise.resolve();assert.equal(appended.length,0);unlock();await run;
  assert.deepEqual(appended,scripts);assert.equal(events.length,1);assert.equal(events[0].type,'managed-app-ready');assert.deepEqual(events[0].loaded,scripts);
  console.log('PASS',slug,page,'waits for policy, preserves script order, emits ready after final script');
 }
}
