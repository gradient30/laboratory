import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountHarness,TEST_OWNER} from '../scripts/account-test-harness.mjs';

// Real Worker + ephemeral D1; all mail is intercepted by the test-only harness.
// These tests never connect to the production Worker, database or mail provider.
async function fixture(t,options){
 const h=await createAccountHarness(options);t.after(()=>h.dispose());
 async function call(path,{method='GET',body,auth,ip='192.0.2.61'}={}){
  const headers={'CF-Connecting-IP':ip};
  if(method!=='GET'){headers.Origin=h.origin;headers['Content-Type']='application/json'}
  if(auth){headers.Cookie=auth.cookie;headers['X-CSRF-Token']=auth.csrf}
  const response=await h.fetch(path,{method,headers,...(method==='GET'?{}:{body:JSON.stringify(body??{})})});
  return {status:response.status,data:await response.json(),headers:response.headers};
 }
 async function request(email=TEST_OWNER,intent='continue',extra={}){
  return call('/api/auth/request-code',{method:'POST',body:{email,intent,adultConsent:true,privacyAccepted:true,...extra}});
 }
 async function challenge(email=TEST_OWNER,intent='continue'){
  const count=h.outbox.filter(m=>m.email===email.toLowerCase().trim()).length,result=await request(email,intent);
  assert.equal(result.status,200,JSON.stringify(result.data));
  for(let i=0;i<100&&h.outbox.filter(m=>m.email===email.toLowerCase().trim()).length<=count;i++)await new Promise(resolve=>setTimeout(resolve,10));
  const messages=h.outbox.filter(m=>m.email===email.toLowerCase().trim());
  assert.equal(messages.length,count+1,'eligible challenge must issue exactly one synthetic email');
  assert.match(messages.at(-1).code,/^\d{8}$/);
  return {id:result.data.challengeId,code:messages.at(-1).code,response:result};
 }
 async function verify(challenge){return call('/api/auth/verify-code',{method:'POST',body:{challengeId:challenge.id,code:challenge.code}})}
 async function login(email=TEST_OWNER,intent='continue'){
  const result=await verify(await challenge(email,intent));assert.equal(result.status,200,JSON.stringify(result.data));
  return {user:result.data.user,cookie:result.headers.get('Set-Cookie').split(';')[0],csrf:result.data.csrfToken};
 }
 async function setting(key,value){await h.db.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,0) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,typeof value==='string'?value:JSON.stringify(value)).run()}
 async function count(sql,...args){return (await h.db.prepare(sql).bind(...args).first()).n}
 return {...h,call,request,challenge,verify,login,setting,count};
}

function publicChallenge(result){
 assert.equal(result.status,200);assert.match(result.data.challengeId,/^[a-f0-9]{32}$/);
 const {challengeId,...publicData}=result.data;
 assert.deepEqual(Object.keys(result.data).sort(),['challengeId','expiresIn','message','ok']);
 assert.equal(result.headers.get('Set-Cookie'),null);
 return publicData;
}

test('unified Workers/D1: new eligible email gets a code, not an account, until verified',async t=>{
 const h=await fixture(t);await h.login();
 const challenge=await h.challenge(' New.Parent@QA.TEST ');
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?','new.parent@qa.test'),0);
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.email=?','new.parent@qa.test'),0);
 const stored=await h.db.prepare('SELECT intent,consent FROM auth_challenges WHERE id=?').bind(challenge.id).first();
 assert.deepEqual(stored,{intent:'register',consent:1});
 const result=await h.verify(challenge);assert.equal(result.status,200,JSON.stringify(result.data));
 assert.equal(result.data.user.email,'new.parent@qa.test');assert.equal(result.data.user.role,'parent');
 assert.equal(result.data.user.unlockThrough,1);assert.equal(result.data.user.unlockAll,false);
 assert.equal(result.data.requiresChildSetup,true);assert.deepEqual(result.data.children,[]);
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?','new.parent@qa.test'),1);
 const saved=await h.db.prepare('SELECT verified_at,consent_at,privacy_version FROM users WHERE email=?').bind('new.parent@qa.test').first();
 assert.ok(saved.verified_at);assert.ok(saved.consent_at);assert.equal(saved.privacy_version,(await h.call('/api/auth/config')).data.privacyVersion);
 assert.match(result.headers.get('Set-Cookie'),/HttpOnly/);assert.match(result.headers.get('Set-Cookie'),/Secure/);
});

test('unified Workers/D1: existing verified account logs in with registration closed and domain removed',async t=>{
 const h=await fixture(t);await h.login();const parent=await h.login('existing@qa.test');
 await h.db.prepare("UPDATE users SET unlock_all=1,unlock_through=17 WHERE id=?").bind(parent.user.id).run();
 const before=await h.db.prepare('SELECT id,role,verified_at,consent_at,privacy_version,unlock_all,unlock_through FROM users WHERE id=?').bind(parent.user.id).first();
 await h.setting('allowedDomains',[]);await h.setting('registrationEnabled','false');
 const challenge=await h.challenge('existing@qa.test'),stored=await h.db.prepare('SELECT intent FROM auth_challenges WHERE id=?').bind(challenge.id).first();
 assert.equal(stored.intent,'login');const result=await h.verify(challenge);assert.equal(result.status,200,JSON.stringify(result.data));
 assert.equal(result.data.user.id,parent.user.id);assert.equal(result.data.user.role,'parent');assert.equal(result.data.user.unlockAll,true);
 assert.deepEqual(await h.db.prepare('SELECT id,role,verified_at,consent_at,privacy_version,unlock_all,unlock_through FROM users WHERE id=?').bind(parent.user.id).first(),before);
 assert.equal(await h.count('SELECT COUNT(*) n FROM users'),2);
});

test('unified Workers/D1: blocked and eligible requests have the same non-enumerating response',async t=>{
 const h=await fixture(t);await h.login();const accepted=await h.challenge('eligible@qa.test');
 const baseline=publicChallenge(accepted.response),before=h.outbox.length;
 for(const email of ['outsider@unapproved.test','suffix@evilqa.test']){
  const denied=await h.request(email);assert.deepEqual(publicChallenge(denied),baseline);
  assert.equal(await h.count('SELECT COUNT(*) n FROM auth_challenges WHERE id=?',denied.data.challengeId),0);
  assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?',email),0);
 }
 await h.setting('allowedDomains',[]);const empty=await h.request('empty@qa.test');assert.deepEqual(publicChallenge(empty),baseline);
 assert.equal(await h.count('SELECT COUNT(*) n FROM auth_challenges WHERE id=?',empty.data.challengeId),0);
 assert.equal(h.outbox.length,before);
});

test('unified Workers/D1: empty domains retain private owner-only bootstrap, never first-caller admin',async t=>{
 const h=await fixture(t,{initialDomains:[],bindings:{ALLOWED_EMAIL_DOMAINS:'qa.test'}});
 assert.deepEqual((await h.call('/api/auth/config')).data.allowedDomains,[]);
 const stranger=await h.request('stranger@qa.test');publicChallenge(stranger);assert.equal(h.outbox.length,0);
 assert.equal(await h.count('SELECT COUNT(*) n FROM users'),0);
 const a=await h.challenge(),b=await h.challenge();assert.equal(await h.count('SELECT COUNT(*) n FROM users'),0);
 const results=await Promise.all([h.verify(a),h.verify(b)]);assert.deepEqual(results.map(r=>r.status),[200,200]);
 const owner=results[0].data.user;assert.equal(owner.role,'admin');assert.equal(results[1].data.user.id,owner.id);
 assert.equal(await h.count('SELECT COUNT(*) n FROM bootstrap_claim'),1);
 publicChallenge(await h.request('later@qa.test'));assert.equal(h.outbox.length,2);
 assert.equal((await h.login()).user.id,owner.id);
 assert.equal(await h.count("SELECT COUNT(*) n FROM users WHERE role='admin'"),1);
});

test('unified Workers/D1: explicit consent is uniformly required before continue sends any email',async t=>{
 const h=await fixture(t);await h.login();const before=h.outbox.length;let expected;
 for(const email of [TEST_OWNER,'unknown@qa.test'])for(const extra of [{adultConsent:false},{privacyAccepted:false},{adultConsent:null,privacyAccepted:null}]){
  const denied=await h.request(email,'continue',extra);assert.equal(denied.status,400);
  assert.equal(denied.data.error.code,'CONSENT_REQUIRED');expected??=denied.data;assert.deepEqual(denied.data,expected);
 }
 assert.equal(h.outbox.length,before);assert.equal(await h.count('SELECT COUNT(*) n FROM users'),1);
});

test('unified Workers/D1: invited account activates only with consent plus valid ownership code',async t=>{
 const h=await fixture(t),owner=await h.login();
 const invitation=await h.call('/api/admin/users',{method:'POST',auth:owner,body:{email:'invited@qa.test'}});assert.equal(invitation.status,201);
 const id=invitation.data.user.id,challenge=await h.challenge('invited@qa.test');
 assert.equal((await h.db.prepare('SELECT status,verified_at FROM users WHERE id=?').bind(id).first()).status,'invited');
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions WHERE user_id=?',id),0);
 const wrong=await h.verify({...challenge,code:challenge.code==='00000000'?'11111111':'00000000'});assert.equal(wrong.status,400);
 assert.equal((await h.db.prepare('SELECT verified_at FROM users WHERE id=?').bind(id).first()).verified_at,null);
 const result=await h.verify(challenge);assert.equal(result.status,200);assert.equal(result.data.user.id,id);assert.equal(result.data.user.role,'parent');
 assert.equal((await h.db.prepare('SELECT status FROM users WHERE id=?').bind(id).first()).status,'active');
});

test('unified Workers/D1: an active flag without verified ownership is not an existing login account',async t=>{
 const h=await fixture(t);await h.login();const parent=await h.login('unverified@qa.test');
 await h.db.prepare('UPDATE users SET verified_at=NULL,consent_at=NULL WHERE id=?').bind(parent.user.id).run();
 const before=h.outbox.length;publicChallenge(await h.request('unverified@qa.test'));
 assert.equal(h.outbox.length,before);
 assert.equal((await h.db.prepare('SELECT verified_at FROM users WHERE id=?').bind(parent.user.id).first()).verified_at,null);
});

test('unified Workers/D1: verification rejects a registration challenge lacking recorded consent',async t=>{
 const h=await fixture(t);await h.login();const challenge=await h.challenge('no-consent@qa.test');
 await h.db.prepare('UPDATE auth_challenges SET consent=0 WHERE id=?').bind(challenge.id).run();
 const denied=await h.verify(challenge);assert.ok([400,403].includes(denied.status));
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?','no-consent@qa.test'),0);
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.email=?','no-consent@qa.test'),0);
});

for(const status of ['disabled','archived'])test(`unified Workers/D1: ${status} accounts cannot receive new codes or revive via pending codes`,async t=>{
 const h=await fixture(t),owner=await h.login(),parent=await h.login('blocked@qa.test'),loginCode=await h.challenge('blocked@qa.test');
 const invitation=await h.call('/api/admin/users',{method:'POST',auth:owner,body:{email:'blocked-invite@qa.test'}});assert.equal(invitation.status,201);
 const registerCode=await h.challenge('blocked-invite@qa.test');
 await h.db.prepare('UPDATE users SET status=? WHERE email IN(?,?)').bind(status,'blocked@qa.test','blocked-invite@qa.test').run();
 const sessions=await h.count('SELECT COUNT(*) n FROM sessions'),outbox=h.outbox.length;
 for(const email of ['blocked@qa.test','blocked-invite@qa.test'])publicChallenge(await h.request(email));
 assert.equal(h.outbox.length,outbox);
 for(const challenge of [loginCode,registerCode])assert.equal((await h.verify(challenge)).status,403);
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions'),sessions);
 assert.equal((await h.db.prepare('SELECT status FROM users WHERE id=?').bind(parent.user.id).first()).status,status);
 assert.equal((await h.db.prepare('SELECT status,verified_at FROM users WHERE id=?').bind(invitation.data.user.id).first()).verified_at,null);
});

test('unified Workers/D1: legacy login/register remain explicit rather than silently becoming continue',async t=>{
 const h=await fixture(t);const owner=await h.login(TEST_OWNER,'register'),before=h.outbox.length;
 publicChallenge(await h.request('legacy-unknown@qa.test','login'));
 publicChallenge(await h.request(TEST_OWNER,'register'));
 assert.equal(h.outbox.length,before);assert.equal(await h.count('SELECT COUNT(*) n FROM users'),1);
 assert.equal((await h.login(TEST_OWNER,'login')).user.id,owner.user.id);
 const legacyNew=await h.login('legacy-new@qa.test','register');assert.equal(legacyNew.user.role,'parent');
});

test('unified Workers/D1: expired, exhausted and replayed codes never create extra users or sessions',async t=>{
 const h=await fixture(t);await h.login();const expired=await h.challenge('expired@qa.test');
 await h.db.prepare('UPDATE auth_challenges SET expires_at=0 WHERE id=?').bind(expired.id).run();assert.equal((await h.verify(expired)).status,400);
 const exhausted=await h.challenge('exhausted@qa.test'),wrong=exhausted.code==='00000000'?'11111111':'00000000';
 for(let i=0;i<5;i++)assert.equal((await h.verify({...exhausted,code:wrong})).status,400);
 assert.equal((await h.verify(exhausted)).status,400);
 const valid=await h.challenge('once@qa.test');assert.equal((await h.verify(valid)).status,200);
 const sessions=await h.count('SELECT COUNT(*) n FROM sessions');assert.equal((await h.verify(valid)).status,400);
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions'),sessions);
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email IN(?,?)','expired@qa.test','exhausted@qa.test'),0);
});

test('unified Workers/D1: concurrent verification consumes one challenge once and distinct codes create one account',async t=>{
 const h=await fixture(t);await h.login();const one=await h.challenge('one-code@qa.test');
 const results=await Promise.all([h.verify(one),h.verify(one),h.verify(one)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400,400]);
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.email=?','one-code@qa.test'),1);
 const a=await h.challenge('two-codes@qa.test'),b=await h.challenge('two-codes@qa.test');
 const two=await Promise.all([h.verify(a),h.verify(b)]);assert.deepEqual(two.map(r=>r.status),[200,200]);
 assert.equal(two[0].data.user.id,two[1].data.user.id);assert.equal(two[0].data.user.role,'parent');
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?','two-codes@qa.test'),1);
 assert.equal(await h.count("SELECT COUNT(*) n FROM users WHERE role='admin'"),1);
});

for(const change of ['domain','registration'])test(`unified Workers/D1: ${change} restriction changed after issuance blocks a new account`,async t=>{
 const h=await fixture(t);await h.login();const challenge=await h.challenge('rules-change@qa.test');
 if(change==='domain')await h.setting('allowedDomains',[]);else await h.setting('registrationEnabled','false');
 const result=await h.verify(challenge);assert.equal(result.status,403,JSON.stringify(result.data));
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?','rules-change@qa.test'),0);
 assert.equal(await h.count('SELECT COUNT(*) n FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.email=?','rules-change@qa.test'),0);
});

test('unified Workers/D1: an already verified concurrent registration logs in after rules close without changing grants',async t=>{
 const h=await fixture(t);await h.login();const a=await h.challenge('became-existing@qa.test'),b=await h.challenge('became-existing@qa.test');
 const first=await h.verify(a);assert.equal(first.status,200);
 await h.setting('allowedDomains',[]);await h.setting('registrationEnabled','false');
 await h.db.prepare('UPDATE users SET unlock_through=0,unlock_all=0 WHERE id=?').bind(first.data.user.id).run();
 const second=await h.verify(b);assert.equal(second.status,200,JSON.stringify(second.data));assert.equal(second.data.user.id,first.data.user.id);
 assert.equal(second.data.user.role,'parent');assert.equal(second.data.user.unlockThrough,0);assert.equal(second.data.user.unlockAll,false);
 assert.equal(await h.count('SELECT COUNT(*) n FROM users WHERE email=?','became-existing@qa.test'),1);
});
