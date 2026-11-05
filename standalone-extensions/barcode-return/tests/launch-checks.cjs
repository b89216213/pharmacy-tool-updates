const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../extension/background.js'),'utf8').replace(/^import .*;\s*$/mg,'');
const url='https://ihisaw.ntuh.gov.tw/WebApplication/PharManagement/BarCodeDrugReturn.aspx';
const data={returnPendingNavigationV2:{sourceId:3}},events={},sent=[],badges=[],shown=new Map(),dismissed=new Set();
let frames=new Map(),active=3,setupReady=true,setupCalls=0,missingScript=false;
const event=name=>({addListener:f=>events[name]=f});
const chrome={
 runtime:{id:'test',onMessage:event('message')},
 storage:{session:{async get(k){return{[k]:data[k]}},async set(v){Object.assign(data,v)},async remove(k){delete data[k]}},onChanged:event('storage')},
 action:{onClicked:event('click'),async setBadgeText(v){badges.push(v)},async setTitle(){}},
 tabs:{onActivated:event('active'),onUpdated:event('update'),async query(filter){return filter.active?[{id:active}]:[{id:3},{id:7}]},
  async sendMessage(id,message,options){
   sent.push({id,message,options});
   if(missingScript)throw Error('No content script');
   if(message.type==='show-return-helper'&&(!message.passive||!dismissed.has(id))){shown.set(id,true);dismissed.delete(id)}
   if(message.type==='hide-return-helper'){shown.set(id,false);dismissed.delete(id)}
   return{shown:!!shown.get(id)};
  },
  update(){throw Error('Tab navigation or activation is forbidden')},create(){throw Error('New Portal tabs are forbidden')}
 },
 windows:{update(){throw Error('Window focus is forbidden')}},
 scripting:{executeScript(){throw Error('Unexpected injection')}}
};
const drain=async()=>{for(let i=0;i<50;i++)await new Promise(setImmediate)};
const load=()=>{const sandbox={chrome,prepareLaunch:async()=>{setupCalls++;return setupReady},isReturnPage:u=>u?.startsWith(url),returnFrames:async id=>frames.get(id)||[],console};vm.createContext(sandbox);vm.runInContext(source,sandbox)};
const sender=id=>({id:'test',url,tab:{id},frameId:2});
const ready=id=>events.message({type:'return-helper-ready'},sender(id),()=>{});
const checks=[];const done=name=>{checks.push(name);console.log('PASS',name)};
(async()=>{
 load();await drain();assert(!data.returnPendingNavigationV2);assert.equal(sent.length,0);done('Old navigation requests are retired without opening or switching pages');
 events.click({id:3});await drain();assert(data.returnHelperEnabledV1);assert.equal(setupCalls,0);assert.equal(sent.length,0);done('Toolbar on a normal page enters standby without navigation or setup-tab interruption');
 events.active({tabId:3});events.update(3,{status:'complete'});await drain();assert.equal(sent.length,0);done('Unrelated page events leave the current page alone');
 frames.set(7,[{frameId:2,url}]);ready(7);await drain();assert(shown.get(7));assert.equal(active,3);done('A manually opened return frame enables its own overlay without changing tab focus');
 shown.set(7,false);dismissed.add(7);active=7;events.active({tabId:7});events.storage({},'local');await drain();assert.equal(shown.get(7),false);done('Passive checks respect 回原畫面 dismissal');
 events.click({id:7});await drain();assert(shown.get(7));assert(data.returnHelperEnabledV1);done('A direct click reopens a dismissed return overlay');
 events.click({id:7});await drain();assert.equal(data.returnHelperEnabledV1,false);assert.equal(shown.get(7),false);const before=sent.length;ready(7);await drain();assert.equal(sent.length,before);done('Turning off closes overlays and later return-page events stay inactive');
 setupReady=false;events.click({id:7});await drain();assert(data.returnHelperEnabledV1);assert.equal(shown.get(7),false);assert.equal(badges.at(-1).text,'設');
 setupReady=true;events.storage({},'local');await drain();assert(shown.get(7));done('An existing return page resumes after folder and backend setup');
 events.click({id:7});events.click({id:7});events.click({id:7});await drain();assert.equal(data.returnHelperEnabledV1,false);assert.equal(shown.get(7),false);done('Queued clicks cannot leave a late overlay after disabling');
 frames.set(7,[{frameId:1,url},{frameId:2,url}]);const ambiguityStart=sent.length;events.click({id:7});await drain();assert.equal(sent.length,ambiguityStart);assert.equal(badges.at(-1).text,'!');done('Multiple return frames stop before choosing an overlay');
 frames.set(7,[{frameId:2,url}]);load();await drain();assert(shown.get(7));done('Worker restart restores passive mode for the already active return page');
 const foreignStart=sent.length;events.message({type:'return-helper-ready'},{id:'other',url,tab:{id:3}},()=>{});events.message({type:'return-helper-ready'},{id:'test',url:'https://portal.ntuh.gov.tw/',tab:{id:3}},()=>{});await drain();assert.equal(sent.length,foreignStart);done('Foreign senders and non-return documents cannot trigger the helper');
 missingScript=true;events.update(7,{status:'complete'});await drain();assert.equal(badges.at(-1).text,'!');done('Already open old pages request manual refresh without navigation or added injection permission');
 console.log(checks.length+' passive launch checks passed');
})().catch(error=>{console.error(error);process.exitCode=1});
