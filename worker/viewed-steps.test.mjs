import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {createAccountHarness,TEST_OWNER} from '../scripts/account-test-harness.mjs';
import worker,{testing} from './core.mjs';

// Every account, child, code and mail message below is synthetic and local to Miniflare.
async function fixture(t){
 const h=await createAccountHarness();t.after(()=>h.dispose());
 async function call(path,{method='GET',body,auth}={}){
  const headers={'CF-Connecting-IP':'192.0.2.44'};
  if(method!=='GET'){headers.Origin=h.origin;headers['Content-Type']='application/json'}
  if(auth){headers.Cookie=auth.cookie;headers['X-CSRF-Token']=auth.csrf}
  const r=await h.fetch(path,{method,headers,body:method==='GET'?undefined:JSON.stringify(body??{})});
  return {status:r.status,data:await r.json(),headers:r.headers};
 }
 async function login(email=TEST_OWNER){
  const count=h.outbox.filter(m=>m.email===email).length;
  const request=await call('/api/auth/request-code',{method:'POST',body:{email,intent:'register',adultConsent:true,privacyAccepted:true}});
  assert.equal(request.status,200);
  for(let i=0;i<100&&h.outbox.filter(m=>m.email===email).length<=count;i++)await new Promise(r=>setTimeout(r,10));
  const code=h.outbox.filter(m=>m.email===email).at(-1)?.code;
  const verified=await call('/api/auth/verify-code',{method:'POST',body:{challengeId:request.data.challengeId,code}});
  assert.equal(verified.status,200,JSON.stringify(verified.data));
  return {cookie:verified.headers.get('Set-Cookie').split(';')[0],csrf:verified.data.csrfToken,user:verified.data.user};
 }
 async function child(auth,nickname='合成阅读记录'){
  const r=await call('/api/children',{method:'POST',auth,body:{nickname,ageBand:'4-6',guardianConsent:true}});
  assert.equal(r.status,201);return r.data.child;
 }
 const owner=await login(),parent=await login('reader@qa.test'),c=await child(parent),url='/api/children/'+c.id;
 const read=()=>call(url+'/state',{auth:parent});
 const put=(snapshot)=>call(url+'/state',{method:'PUT',auth:parent,body:{revision:snapshot.revision,state:snapshot.state}});
 const importing=(snapshot)=>call(url+'/import',{method:'POST',auth:parent,body:{revision:snapshot.revision,state:snapshot.state,confirmed:true}});
 return {...h,call,login,child,owner,parent,c,url,read,put,importing};
}

test('viewed steps D1: fresh and legacy reads default empty without inferring history or rewriting old state',async t=>{
 const h=await fixture(t),fresh=(await h.read()).data;
 assert.deepEqual(fresh.state.viewedSteps,{});assert.equal(fresh.revision,0);
 const legacy={...fresh.state,steps:{'1:4-6':3},completed:{'1:7-9':true},records:{'1:4-6':{spoken:'合成旧记录'}}};delete legacy.viewedSteps;
 await h.db.prepare('UPDATE children SET state_json=? WHERE id=?').bind(JSON.stringify(legacy),h.c.id).run();
 const loaded=(await h.read()).data;
 assert.deepEqual(loaded.state.viewedSteps,{});assert.deepEqual(loaded.state.steps,legacy.steps);assert.deepEqual(loaded.state.completed,legacy.completed);assert.deepEqual(loaded.state.records,legacy.records);assert.equal(loaded.revision,0);
 assert.equal((await h.db.prepare('SELECT state_json FROM children WHERE id=?').bind(h.c.id).first()).state_json,JSON.stringify(legacy));
 const exported=(await h.call('/api/account/export',{auth:h.parent})).data;
 assert.deepEqual(exported.children[0].state.viewedSteps,{});assert.deepEqual(exported.children[0].state.records,legacy.records);
});

test('viewed steps D1: each four-bit mask round-trips without completing an activity or unlocking a lesson',async t=>{
 const h=await fixture(t);let snapshot=(await h.read()).data;
 for(let mask=0;mask<=15;mask++){
  snapshot.state.viewedSteps={'1:4-6':mask};snapshot.state.steps={'1:4-6':3};
  const saved=await h.put(snapshot);assert.equal(saved.status,200,JSON.stringify(saved.data));snapshot=saved.data;
  assert.equal(snapshot.state.viewedSteps['1:4-6'],mask);assert.equal(snapshot.state.steps['1:4-6'],3);
  assert.deepEqual(snapshot.state.completed,{});assert.deepEqual(snapshot.state.records,{});assert.equal(snapshot.access.unlockedThrough,1);
 }
 const loaded=(await h.read()).data;assert.equal(loaded.state.viewedSteps['1:4-6'],15);
 const cat=await h.call(h.url+'/curriculum',{auth:h.parent});assert.equal(cat.data.experiments[1].locked,true);assert.equal(cat.data.experiments[1].steps,undefined);
 const exported=(await h.call('/api/account/export',{auth:h.parent})).data;assert.deepEqual(exported.children[0].state.viewedSteps,{'1:4-6':15});
});

test('viewed steps D1: old-client writes omit the field safely and retain notes, selected step and completed semantics',async t=>{
 const h=await fixture(t);let s=(await h.read()).data;
 s.state.viewedSteps={'1:4-6':5,'1:7-9':8};s.state.records={'1:4-6':{spoken:'保留观察'}};
 s=(await h.put(s)).data;const legacy=structuredClone(s);delete legacy.state.viewedSteps;legacy.state.steps={'1:4-6':2};
 const saved=await h.put(legacy);assert.equal(saved.status,200);assert.deepEqual(saved.data.state.viewedSteps,s.state.viewedSteps);assert.equal(saved.data.state.steps['1:4-6'],2);assert.equal(saved.data.state.records['1:4-6'].spoken,'保留观察');assert.deepEqual(saved.data.state.completed,{});assert.equal(saved.data.access.unlockedThrough,1);
});

test('viewed steps D1: invalid map shape, unknown activity-age keys and out-of-range masks are rejected atomically',async t=>{
 const h=await fixture(t),s=(await h.read()).data;
 const invalid=[null,[],1,'1',true,...[-1,16,1.5,'1',null,true,{},[]].map(v=>({'1:4-6':v})),...['0:4-6','01:4-6','366:4-6','1:5-7','1:4-6:0','1','__proto__','constructor'].map(k=>Object.fromEntries([[k,1]])),Object.fromEntries(Array.from({length:1461},(_,i)=>[String(i)+':4-6',1]))];
 for(const viewedSteps of invalid){const rejected=await h.put({...s,state:{...s.state,viewedSteps}});assert.equal(rejected.status,400,JSON.stringify(viewedSteps));assert.equal(rejected.data.error.code,'INVALID_STATE')}
 const unchanged=(await h.read()).data;assert.equal(unchanged.revision,s.revision);assert.deepEqual(unchanged.state.viewedSteps,{});
});

// Test the declared-length and streamed-byte paths separately. A known oversized
// upload may be closed before Undici finishes writing and hide the real HTTP 413.
const REQUEST_LIMIT=1048576+4096;
const writeHeaders=h=>({Origin:h.origin,'Content-Type':'application/json',Cookie:h.parent.cookie,'X-CSRF-Token':h.parent.csrf,'CF-Connecting-IP':'192.0.2.44'});
const childRow=h=>h.db.prepare('SELECT state_json,revision,unlocked_through,progress_storage_version,updated_at FROM children WHERE id=?').bind(h.c.id).first();
function completeByteStream(bytes){return new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=65536)controller.enqueue(bytes.subarray(i,i+65536));controller.close();}});}
function paddedStateBody(snapshot,length,{multibyte=false}={}){
 const text=JSON.stringify({revision:snapshot.revision,state:snapshot.state,...(multibyte?{padding:'汉'.repeat(Math.floor(length/4))}:{})});
 const bytes=Buffer.from(text);assert.ok(bytes.length<=length);
 return Buffer.concat([bytes,Buffer.alloc(length-bytes.length,0x20)]);
}
async function declaredLengthResponse(h,length){
 // Real local HTTP/Workerd request. Do not send an upload already rejected by its
 // declared length; require the complete JSON response, never accept EPIPE as 413.
 const local=await h.mf.ready;
 return new Promise((resolve,reject)=>{
  const req=httpRequest(new URL(h.url+'/state',local),{method:'PUT',headers:{...writeHeaders(h),Host:new URL(h.origin).host,'Content-Length':String(length)}});
  const timer=setTimeout(()=>req.destroy(new Error('Declared-length response timed out')),30000);
  const fail=error=>{clearTimeout(timer);req.destroy();reject(error);};
  req.on('error',fail);
  req.on('response',res=>{
   const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('error',fail);res.on('aborted',()=>fail(new Error('Incomplete declared-length response')));
   res.on('end',()=>{clearTimeout(timer);req.destroy();if(!res.complete)return reject(new Error('Incomplete declared-length response'));try{resolve({status:res.statusCode,headers:res.headers,data:JSON.parse(Buffer.concat(chunks).toString())});}catch(error){reject(error);}});
  });
  req.flushHeaders();
 });
}
test('viewed steps D1: declared oversized request returns complete 413 before upload without changing the child',async t=>{
 const h=await fixture(t),before=await childRow(h);
 const rejected=await declaredLengthResponse(h,REQUEST_LIMIT+1);
 assert.equal(rejected.status,413);assert.equal(rejected.data.error.code,'TOO_LARGE');assert.equal(rejected.headers['set-cookie'],undefined);
 assert.deepEqual(await childRow(h),before);
});
test('viewed steps D1: streamed exact byte limit succeeds; one extra ASCII or UTF-8 byte is rejected atomically',async t=>{
 const h=await fixture(t),snapshot=(await h.read()).data;
 async function send(bytes){
  const init={method:'PUT',headers:writeHeaders(h),body:completeByteStream(bytes),duplex:'half'};
  assert.equal(new Request(new URL(h.url+'/state',h.origin),init).headers.has('Content-Length'),false);
  const response=await h.fetch(h.url+'/state',init);return {status:response.status,data:await response.json()};
 }
 const accepted=await send(paddedStateBody(snapshot,REQUEST_LIMIT));assert.equal(accepted.status,200);assert.equal(accepted.data.revision,snapshot.revision+1);
 const before=await childRow(h);
 for(const multibyte of [false,true]){
  const bytes=paddedStateBody(accepted.data,REQUEST_LIMIT+1,{multibyte});assert.equal(bytes.length,REQUEST_LIMIT+1);
  if(multibyte)assert.ok(bytes.toString().length<REQUEST_LIMIT,'Must distinguish UTF-8 byte length from character count');
  const rejected=await send(bytes);assert.equal(rejected.status,413);assert.equal(rejected.data.error.code,'TOO_LARGE');assert.deepEqual(await childRow(h),before);
 }
});
test('core handler with real D1: oversized length reads nothing; streamed overflow cancels before an unbounded tail',async t=>{
 const h=await fixture(t),env=await h.mf.getBindings(),before=await childRow(h);let pulls=0;
 const declared=new Request(new URL(h.url+'/state',h.origin),{method:'PUT',headers:{...writeHeaders(h),'Content-Length':String(REQUEST_LIMIT+1)},duplex:'half',body:new ReadableStream({pull(){pulls++;throw Error('Declared oversized body must not be read');}},{highWaterMark:0})});
 const early=await worker.fetch(declared,env);assert.equal(early.status,413);assert.equal((await early.json()).error.code,'TOO_LARGE');assert.equal(pulls,0);assert.deepEqual(await childRow(h),before);
 for(const lengthHeader of [undefined,'1']){
  let delivered=0,cancelled=0,tailRead=false;
  const stream=new ReadableStream({pull(controller){
   if(delivered>REQUEST_LIMIT){tailRead=true;throw Error('Unbounded tail must not be consumed');}
   const size=delivered===REQUEST_LIMIT?1:Math.min(65536,REQUEST_LIMIT-delivered);delivered+=size;controller.enqueue(new Uint8Array(size));
  },cancel(){cancelled++;}},{highWaterMark:0});
  const req=new Request(new URL(h.url+'/state',h.origin),{method:'PUT',headers:{...writeHeaders(h),...(lengthHeader===undefined?{}:{'Content-Length':lengthHeader})},body:stream,duplex:'half'});
  const rejected=await worker.fetch(req,env);assert.equal(rejected.status,413);assert.equal((await rejected.json()).error.code,'TOO_LARGE');
  assert.equal(delivered,REQUEST_LIMIT+1);assert.equal(cancelled,1);assert.equal(tailRead,false);assert.deepEqual(await childRow(h),before);
 }
});

test('viewed steps D1: imports union only valid read masks, preserve old imports and do not unlock',async t=>{
 const h=await fixture(t);let s=(await h.read()).data;s.state.viewedSteps={'1:4-6':1};s=(await h.put(s)).data;
 const imported=await h.importing({revision:s.revision,state:{viewedSteps:{'1:4-6':4,'1:7-9':8},steps:{'1:4-6':3}}});
 assert.equal(imported.status,200);assert.deepEqual(imported.data.state.viewedSteps,{'1:4-6':5,'1:7-9':8});assert.equal(imported.data.state.steps['1:4-6'],3);assert.deepEqual(imported.data.state.completed,{});assert.equal(imported.data.access.unlockedThrough,1);
 assert.equal((await h.importing({revision:s.revision,state:{viewedSteps:{'1:4-6':2}}})).status,409);
 s=imported.data;const oldImport=await h.importing({revision:s.revision,state:{records:{'1:4-6':{spoken:'旧导入观察'}}}});assert.equal(oldImport.status,200);assert.deepEqual(oldImport.data.state.viewedSteps,s.state.viewedSteps);
 s=oldImport.data;
 for(const viewedSteps of [null,[],{'1:4-6':16},{'1:4-6':'2'},Object.fromEntries([['__proto__',1]]),{'01:4-6':1}])assert.equal((await h.importing({revision:s.revision,state:{viewedSteps}})).status,400);
 assert.equal((await h.call(h.url+'/import',{method:'POST',auth:h.parent,body:{revision:s.revision,state:{viewedSteps:{'1:4-6':2}}}})).status,400);
 assert.equal((await h.read()).data.revision,s.revision);
});

test('viewed steps D1: locked writes and imports cannot add history; relock retains prior history and rejects stale revisions',async t=>{
 const h=await fixture(t);let s=(await h.read()).data;
 assert.equal((await h.put({...s,state:{...s.state,viewedSteps:{'2:4-6':1}}})).status,403);
 assert.equal((await h.importing({revision:s.revision,state:{viewedSteps:{'2:4-6':1}}})).status,403);
 assert.equal((await h.call('/api/admin/users/'+h.parent.user.id+'/access',{method:'POST',auth:h.owner,body:{mode:'all'}})).status,200);
 s=(await h.read()).data;s.state.viewedSteps={'365:4-6':9};s=(await h.put(s)).data;
 assert.equal((await h.call('/api/admin/users/'+h.parent.user.id+'/access',{method:'POST',auth:h.owner,body:{mode:'locked'}})).status,200);
 assert.equal((await h.put(s)).status,409);s=(await h.read()).data;assert.equal(s.access.unlockedThrough,0);assert.equal(s.state.viewedSteps['365:4-6'],9);
 assert.equal((await h.put({...s,state:{...s.state,viewedSteps:{'365:4-6':11}}})).status,403);
 assert.equal((await h.importing({revision:s.revision,state:{viewedSteps:{'365:4-6':2}}})).status,403);
 const retained=await h.put({...s,state:{...s.state,viewedSteps:{}}});assert.equal(retained.status,200);assert.deepEqual(retained.data.state.viewedSteps,{'365:4-6':9});
 assert.ok((await h.call(h.url+'/curriculum',{auth:h.parent})).data.experiments.every(e=>e.locked));
});

test('viewed steps D1: child/family isolation and revision CAS prevent cross-context history overwrite',async t=>{
 const h=await fixture(t),sibling=await h.child(h.parent,'合成同家庭第二位'),outsider=await h.login('outsider@qa.test');let s=(await h.read()).data;
 const results=await Promise.all([1,4].map(mask=>h.put({...s,state:{...s.state,viewedSteps:{'1:4-6':mask}}})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const winner=results.find(r=>r.status===200);assert.deepEqual((await h.read()).data.state.viewedSteps,winner.data.state.viewedSteps);
 assert.deepEqual((await h.call('/api/children/'+sibling.id+'/state',{auth:h.parent})).data.state.viewedSteps,{});
 for(const [suffix,method,body] of [['state','GET'],['state','PUT',{revision:winner.data.revision,state:winner.data.state}],['import','POST',{revision:winner.data.revision,state:{viewedSteps:{'1:4-6':15}},confirmed:true}]])assert.equal((await h.call(h.url+'/'+suffix,{method,body,auth:outsider})).status,404);
 assert.equal((await h.call(h.url+'/state',{method:'PUT',body:{revision:winner.data.revision,state:winner.data.state}})).status,401);
});

test('viewed steps validator: maximum 1460 activity-age masks fit, cumulative JSON remains bounded, unknown note keys remain invalid',()=>{
 const old={startDate:'2026-10-26',day:1,age:'4-6',records:{},steps:{},completed:{},legacyRecords:{},recordSchemaVersion:3},access={unlockedThrough:365};
 const viewedSteps=Object.fromEntries(Array.from({length:365},(_,i)=>['4-6','7-9','10-12','13-16'].map(age=>[`${i+1}:${age}`,15])).flat());
 assert.equal(Object.keys(testing.validateState({...old,viewedSteps},old,access).viewedSteps).length,1460);
 const records=Object.fromEntries(Array.from({length:300},(_,i)=>[`${i+1}:4-6`,{spoken:'x'.repeat(4000)}]));
 assert.throws(()=>testing.validateState({...old,viewedSteps,records},old,access),e=>e.status===413&&e.code==='TOO_LARGE');
 assert.throws(()=>testing.validateState({...old,records:{'1:4-6':{viewedSteps:'15'}}},old,access),e=>e.status===400&&e.code==='INVALID_RECORD');
});
