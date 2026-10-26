import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountHarness,TEST_OWNER} from '../scripts/account-test-harness.mjs';
import {testing} from './core.mjs';

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
 const tooLarge=await h.put({...s,state:{...s.state,records:{'1:4-6':{spoken:'x'.repeat(1048576+4096)}}}});assert.equal(tooLarge.status,413);assert.equal((await h.read()).data.revision,s.revision);
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
