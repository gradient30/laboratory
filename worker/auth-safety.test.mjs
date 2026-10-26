import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from './core.mjs';

// Deterministic SQL interleavings and private-data sentinels use memory-only synthetic fixtures.
function harness(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../migrations/0001_accounts.sql',import.meta.url),'utf8'));
 db.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,0)').run('allowedDomains','["example.test"]');
 const hooks={afterFirst:null,beforeRun:null},outbox=[];
 const prepare=sql=>({bind(...args){return {...query(sql,args),_sql:sql,_args:args}},...query(sql,[])});
 function query(sql,args){return {
  async first(){const result=db.prepare(sql).get(...args)||null;hooks.afterFirst?.(sql,result);return result},
  async all(){return {results:db.prepare(sql).all(...args)}},
  async run(){hooks.beforeRun?.(sql);return {meta:db.prepare(sql).run(...args)}}
 }}
 const env={DB:{prepare,async batch(statements){db.exec('BEGIN');try{const results=statements.map(s=>({meta:db.prepare(s._sql).run(...s._args)}));db.exec('COMMIT');return results}catch(error){db.exec('ROLLBACK');throw error}}},APP_ORIGIN:'https://lab.test',BOOTSTRAP_ADMIN_EMAIL:'owner@example.test',REGISTRATION_ENABLED:'true',AUTH_SECRET:'synthetic-safety-test-secret-at-least-32-characters',EMAIL_PROVIDER:'cloudflare',EMAIL_FROM:'lab@example.test',EMAIL:{async send(message){outbox.push(message)}}};
 async function call(path,body,ctx){const r=await worker.fetch(new Request(env.APP_ORIGIN+path,{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.71'},body:JSON.stringify(body)}),env,ctx);return {status:r.status,data:await r.json(),headers:r.headers}}
 const request=(email='owner@example.test',ctx)=>call('/api/auth/request-code',{email,intent:'continue',adultConsent:true,privacyAccepted:true},ctx);
 const verify=c=>call('/api/auth/verify-code',{challengeId:c.id,code:c.code});
 async function challenge(email='owner@example.test'){const response=await request(email);assert.equal(response.status,200);return {id:response.data.challengeId,code:outbox.at(-1).text.match(/\d{8}/)[0]}}
 async function login(email='owner@example.test'){const response=await verify(await challenge(email));assert.equal(response.status,200,JSON.stringify(response.data));return response.data.user}
 return {db,env,hooks,outbox,call,request,verify,challenge,login};
}

const sentinel='PRIVATE_ERROR_SENTINEL:recipient@example.test:12345678:synthetic_provider_key';
for(const scenario of ['cloudflare_binding','resend_http','resend_network'])test(`mail diagnostics redact sensitive values for ${scenario}`,async t=>{
 const h=harness();t.after(()=>h.db.close());const logs=[];t.mock.method(console,'warn',line=>logs.push(JSON.parse(line)));
 let expected;
 if(scenario==='cloudflare_binding'){h.env.EMAIL.send=async()=>{throw new Error(sentinel)};expected={provider:'cloudflare',category:'binding_error',httpStatus:null}}
 else{h.env.EMAIL_PROVIDER='resend';h.env.RESEND_API_KEY='synthetic_provider_key';
  if(scenario==='resend_http'){t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({message:sentinel}),{status:403}));expected={provider:'resend',category:'http_error',httpStatus:403}}
  else{t.mock.method(globalThis,'fetch',async()=>{throw new Error(sentinel)});expected={provider:'resend',category:'network_error',httpStatus:null}}
 }
 const result=await h.request();assert.equal(result.status,200);assert.deepEqual(Object.keys(result.data).sort(),['challengeId','expiresIn','message','ok']);
 assert.deepEqual(logs,[{event:'auth_code_delivery_failed',...expected}]);assert.doesNotMatch(JSON.stringify({logs,response:result.data}),/PRIVATE_ERROR_SENTINEL|recipient@example\.test|synthetic_provider_key|12345678/);
 assert.ok(h.db.prepare('SELECT consumed_at FROM auth_challenges WHERE id=?').get(result.data.challengeId).consumed_at);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM users').get().n,0);
});

test('background delivery failure remains generic and invalidation failure logs no raw storage error',async t=>{
 const h=harness();t.after(()=>h.db.close());const logs=[],pending=[];t.mock.method(console,'warn',line=>logs.push(JSON.parse(line)));
 let rejectDelivery;h.env.EMAIL.send=()=>new Promise((_,reject)=>{rejectDelivery=reject});
 h.hooks.beforeRun=sql=>{if(sql.startsWith('UPDATE auth_challenges SET consumed_at='))throw new Error(sentinel)};
 const result=await h.request('owner@example.test',{waitUntil:promise=>pending.push(promise)});assert.equal(result.status,200);assert.equal(pending.length,1);
 assert.deepEqual(logs,[]);rejectDelivery(new Error(sentinel));await Promise.all(pending);
 assert.deepEqual(logs,[{event:'auth_code_delivery_failed',provider:'cloudflare',category:'binding_error',httpStatus:null},{event:'auth_code_invalidation_failed',category:'storage_error'}]);
 assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_ERROR_SENTINEL|recipient@example\.test|synthetic_provider_key|12345678/);
});

for(const policy of ['registrationEnabled','allowedDomains'])test(`registration SQL rechecks ${policy} after OTP consumption, not stale API settings`,async t=>{
 const h=harness();t.after(()=>h.db.close());await h.login();const challenge=await h.challenge('racing@example.test');let changed=false;
 h.hooks.afterFirst=(sql,result)=>{if(!changed&&result&&sql.startsWith('UPDATE auth_challenges SET consumed_at=')){changed=true;h.db.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,0) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(policy,policy==='allowedDomains'?'[]':'false')}};
 const denied=await h.verify(challenge);assert.equal(changed,true);assert.equal(denied.status,403);assert.equal(denied.headers.get('Set-Cookie'),null);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM users WHERE email=?').get('racing@example.test').n,0);
});

test('session insertion rejects account disabled after the verified-user SELECT',async t=>{
 const h=harness();t.after(()=>h.db.close());await h.login();const parent=await h.login('racing@example.test'),challenge=await h.challenge('racing@example.test');
 const before=h.db.prepare('SELECT COUNT(*) n FROM sessions WHERE user_id=?').get(parent.id).n;let disabled=false;
 h.hooks.afterFirst=(sql,result)=>{if(!disabled&&result&&sql.startsWith("SELECT * FROM users WHERE email=? AND status='active'")){disabled=true;h.db.prepare("UPDATE users SET status='disabled',access_version=access_version+1 WHERE id=?").run(parent.id)}};
 const denied=await h.verify(challenge);assert.equal(disabled,true);assert.equal(denied.status,403);assert.equal(denied.headers.get('Set-Cookie'),null);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM sessions WHERE user_id=?').get(parent.id).n,before);
 assert.equal(h.db.prepare('SELECT status FROM users WHERE id=?').get(parent.id).status,'disabled');
});

test('continue retains email and IP request limits even for policy-blocked emails',async t=>{
 const h=harness();t.after(()=>h.db.close());
 for(let i=0;i<5;i++)assert.equal((await h.request('blocked@example.test')).status,200);
 const emailLimited=await h.request('blocked@example.test');assert.equal(emailLimited.status,429);assert.equal(emailLimited.data.error.code,'RATE_LIMITED');
 for(let i=0;i<14;i++)assert.equal((await h.request(`blocked${i}@example.test`)).status,200);
 const ipLimited=await h.request('another@example.test');assert.equal(ipLimited.status,429);assert.equal(ipLimited.data.error.code,'RATE_LIMITED');
 assert.equal(h.outbox.length,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM users').get().n,0);
});

test('legacy explicit login keeps its no-registration-consent contract without creating unknown accounts',async t=>{
 const h=harness();t.after(()=>h.db.close());const owner=await h.login();
 const existing=await h.call('/api/auth/request-code',{email:owner.email,intent:'login'});assert.equal(existing.status,200);
 const stored=h.db.prepare('SELECT intent,consent FROM auth_challenges WHERE id=?').get(existing.data.challengeId);assert.deepEqual({...stored},{intent:'login',consent:0});
 const signedIn=await h.verify({id:existing.data.challengeId,code:h.outbox.at(-1).text.match(/\d{8}/)[0]});assert.equal(signedIn.status,200);assert.equal(signedIn.data.user.id,owner.id);
 const outbox=h.outbox.length;const unknown=await h.call('/api/auth/request-code',{email:'unknown@example.test',intent:'login'});assert.equal(unknown.status,200);
 assert.equal(h.outbox.length,outbox);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM users').get().n,1);
});
