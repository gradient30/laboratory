import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountHarness,TEST_OWNER} from '../scripts/account-test-harness.mjs';
import {testing} from './core.mjs';
import curriculum from '../dist/data.json' with {type:'json'};

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

const entry=(completed=false)=>({records:{field0:'synthetic protocol observation'},step:2,viewedSteps:5,completed});
const state=()=>({startDate:'2026-11-02',day:1,age:'4-6',records:{'1:4-6':{spoken:'legacy note'}},steps:{'1:4-6':3},viewedSteps:{'1:4-6':15},completed:{'1:4-6':true},legacyRecords:{},recordSchemaVersion:3,protocolProgress:{}});
test('protocol progress unit: separate history, old-client omission and locked retention',()=>{
 const old=state();old.protocolProgress={'1:4-6:v1':entry(),'365:4-6:v1':entry()};const incoming=structuredClone(old);delete incoming.protocolProgress;
 const saved=testing.validateState(incoming,old,{unlockedThrough:1});assert.deepEqual(saved,old);
 incoming.protocolProgress={};const omitted=testing.validateState(incoming,old,{unlockedThrough:1});assert.deepEqual(omitted.protocolProgress,{'365:4-6:v1':entry()});
 for(const key of ['records','steps','viewedSteps','completed','legacyRecords'])assert.deepEqual(omitted[key],old[key]);
});
test('protocol progress unit: keys, version range, shapes, fields and size fail closed',()=>{
 const old=state();const bad=[null,[],true,1,'x',...['0:4-6:v1','01:4-6:v1','366:4-6:v1','1:5-7:v1','1:4-6:v0','1:4-6:v01','1:4-6:v1000','__proto__'].map(key=>Object.fromEntries([[key,entry()]])),...[
 {...entry(),step:4},{...entry(),step:'1'},{...entry(),viewedSteps:16},{...entry(),viewedSteps:1.5},{...entry(),completed:1},{...entry(),records:{unknown:'x'}},{...entry(),records:{spoken:'x'.repeat(4001)}},{...entry(),records:Object.fromEntries(Array.from({length:33},(_,i)=>['field'+i,'x']))},{...entry(),extra:true},null
 ].map(v=>({'1:4-6:v1':v})),Object.fromEntries(Array.from({length:1461},(_,i)=>[`1:4-6:v${i+1}`,entry()]))];
 for(const protocolProgress of bad)assert.throws(()=>testing.validateState({...old,protocolProgress},old,{unlockedThrough:365}),error=>error.status===400);
 assert.deepEqual(testing.protocolKey('365:13-16:v999'),{day:365,age:'13-16',version:999});
});
test('protocol progress unit: exact imports conflict safely and legacy completion semantics remain',()=>{
 const old=state();old.protocolProgress={'1:4-6:v1':entry()};const merged=testing.mergeImport({protocolProgress:{'1:4-6:v1':entry()}},old);assert.deepEqual(merged.protocolProgress,old.protocolProgress);
 assert.throws(()=>testing.mergeImport({protocolProgress:{'1:4-6:v1':entry(true)}},old),error=>error.status===409);
 assert.deepEqual(testing.mergeImport({records:{}},old).protocolProgress,old.protocolProgress);
 const next=structuredClone(old);next.protocolProgress['1:4-6:v1'].completed=true;assert.equal(testing.newlyCompleted(next,old,1),true);assert.equal(testing.dayCompleted(next,1),true);
 const legacy=structuredClone(old);legacy.completed['1:7-9']=true;assert.equal(testing.newlyCompleted(legacy,old,1),true);
});
test('protocol progress unit: older versions remain separate and cannot acquire new edits or unlock',()=>{
 const activity=curriculum.experiments[0],previous=activity.ageProtocols;
 try{
  activity.ageProtocols={...previous,'4-6':{version:2}};
  const old=state();old.completed={};old.protocolProgress={'1:4-6:v1':entry(true)};
  const incoming=structuredClone(old);incoming.protocolProgress['1:4-6:v2']={...entry(),records:{field0:'new version'}};
  const saved=testing.validateState(incoming,old,{unlockedThrough:1});assert.equal(saved.protocolProgress['1:4-6:v1'].records.field0,'synthetic protocol observation');assert.equal(saved.protocolProgress['1:4-6:v2'].records.field0,'new version');assert.equal(testing.dayCompleted(saved,1),false);
  incoming.protocolProgress['1:4-6:v1'].records.field0='changed historical answer';assert.throws(()=>testing.validateState(incoming,old,{unlockedThrough:1}),error=>error.status===400);
  old.completed['1:4-6']=true;assert.equal(testing.dayCompleted(old,1),true,'legacy completion still counts for access');
 }finally{if(previous===undefined)delete activity.ageProtocols;else activity.ageProtocols=previous;}
});
test('protocol progress unit: nested records remain subject to total one MiB state cap',()=>{
 const old=state(),records=Object.fromEntries(Array.from({length:32},(_,i)=>['field'+i,'x'.repeat(4000)]));
 old.protocolProgress=Object.fromEntries(Array.from({length:9},(_,i)=>[`1:4-6:v${i+1}`,{...entry(),records}]));
 assert.throws(()=>testing.validateState(old,old,{unlockedThrough:1}),error=>error.status===413);
});
test('protocol progress D1: roundtrip, legacy notes, omission, export and next-level unlock',async t=>{
 const h=await fixture(t);let s=(await h.read()).data;assert.deepEqual(s.state.protocolProgress,{});
 s.state.records={'1:4-6':{spoken:'legacy remains'}};s.state.steps={'1:4-6':3};s.state.viewedSteps={'1:4-6':15};s.state.protocolProgress={'1:4-6:v1':entry()};
 let r=await h.put(s);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.access.unlockedThrough,1);assert.deepEqual(r.data.state.completed,{});
 s=r.data;const legacy=structuredClone(s);delete legacy.state.protocolProgress;r=await h.put(legacy);assert.equal(r.status,200);assert.deepEqual(r.data.state.protocolProgress,s.state.protocolProgress);
 s=r.data;s.state.protocolProgress['1:4-6:v1'].completed=true;r=await h.put(s);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.access.unlockedThrough,2);assert.deepEqual(r.data.state.completed,{});assert.equal(r.data.state.records['1:4-6'].spoken,'legacy remains');
 const exported=(await h.call('/api/account/export',{auth:h.parent})).data;assert.deepEqual(exported.children[0].state.protocolProgress,r.data.state.protocolProgress);
 const sibling=await h.child(h.parent,'synthetic sibling');assert.deepEqual((await h.call('/api/children/'+sibling.id+'/state',{auth:h.parent})).data.state.protocolProgress,{});
});
test('protocol progress D1: locks, revisions, foreign families and imports remain isolated',async t=>{
 const h=await fixture(t);let s=(await h.read()).data;
 assert.equal((await h.put({...s,state:{...s.state,protocolProgress:{'2:4-6:v1':entry()}}})).status,403);
 assert.equal((await h.importing({...s,state:{protocolProgress:{'2:4-6:v1':entry()}}})).status,403);
 const other=await h.login('other-protocol@qa.test');assert.equal((await h.call(h.url+'/state',{method:'PUT',auth:other,body:{revision:s.revision,state:{...s.state,protocolProgress:{'1:4-6:v1':entry()}}}})).status,404);
 assert.equal((await h.call('/api/admin/users/'+h.parent.user.id+'/access',{method:'POST',auth:h.owner,body:{mode:'all'}})).status,200);
 s=(await h.read()).data;s.state.protocolProgress={'365:4-6:v1':entry()};s=(await h.put(s)).data;
 assert.equal((await h.call('/api/admin/users/'+h.parent.user.id+'/access',{method:'POST',auth:h.owner,body:{mode:'locked'}})).status,200);
 assert.equal((await h.put(s)).status,409);s=(await h.read()).data;
 assert.equal((await h.put({...s,state:{...s.state,protocolProgress:{'365:4-6:v1':entry(true)}}})).status,403);
 const kept=await h.put({...s,state:{...s.state,protocolProgress:{}}});assert.equal(kept.status,200);assert.deepEqual(kept.data.state.protocolProgress,{'365:4-6:v1':entry()});assert.equal(kept.data.access.unlockedThrough,0);
});

