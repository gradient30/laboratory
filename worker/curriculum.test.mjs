import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from './core.mjs';
import {curriculumIndex,readCurriculumDay} from './curriculum.mjs';
const origin='https://lab.test',childId='c'.repeat(32),userId='a'.repeat(32),otherId='b'.repeat(32),raw='d'.repeat(64),otherRaw='e'.repeat(64);
function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());for(const name of ['0001_accounts.sql','0002_password_login.sql'])db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const stamp=Math.floor(Date.now()/1000);for(const [id,email,token]of [[userId,'a@qa.test',raw],[otherId,'b@qa.test',otherRaw]]){db.prepare("INSERT INTO users(id,email,role,status,unlock_all,verified_at,created_at,updated_at) VALUES(?,?,'parent','active',1,?,?,?)").run(id,email,stamp,stamp,stamp);db.prepare('INSERT INTO sessions(token_hash,user_id,csrf_token,auth_version,created_at,expires_at) VALUES(?,?,?,0,?,?)').run(createHash('sha256').update(token).digest('hex'),id,'csrf',stamp,stamp+600);}
 db.prepare('INSERT INTO children(id,user_id,nickname,age_band,guardian_consent_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(childId,userId,'Synthetic child','4-6',stamp,stamp,stamp);
 const calls=[];let hook=null;
 const env={APP_ORIGIN:origin,DB:{prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}},async all(){return {results:db.prepare(sql).all()}}}}},ASSETS:{async fetch(request){calls.push(request);if(hook)return hook(request);try{return new Response(readFileSync(new URL('../deployment-assets'+new URL(request.url).pathname,import.meta.url)));}catch{return new Response('Not found',{status:404});}}}};
 const call=(path,{method='GET',token=raw,headers={}}={})=>worker.fetch(new Request(new URL(path,origin),{method,headers:{...(token?{Cookie:'__Host-littlelab_session='+token}:{}),...headers}}),env);
 const base='/api/children/'+childId+'/curriculum';const catalog=async()=>await(await call(base)).json();const detail=(day=1,overrides={})=>base+'/'+day+'?'+new URLSearchParams({revision:curriculumIndex.revision,accessVersion:'0:0:4-6:sequential',...overrides});
 return {db,env,call,base,catalog,detail,calls,setHook:f=>hook=f};
}
test('real Worker handler + ASSETS shim: catalog is bounded; all 365 details reconstruct exact canonical content',async t=>{
 const h=fixture(t),cat=await h.catalog(),canonical=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url)));
 assert.equal(h.calls.length,0);assert.ok(Buffer.byteLength(JSON.stringify(cat))<128*1024);assert.equal(cat.experiments.length,365);assert.ok(cat.experiments.every(e=>!e.materials&&!e.steps&&!e.ageGuides&&!e.ageProtocols));
 const restored=[];for(let day=1;day<=365;day++){const r=await h.call(h.detail(day));assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');const body=await r.json();assert.equal(body.curriculumRevision,curriculumIndex.revision);assert.equal(body.childId,childId);restored.push(body.experiment);}
 assert.deepEqual({meta:cat.meta,experiments:restored},canonical);assert.equal(h.calls.length,365);
 for(const r of h.calls){assert.equal(r.method,'GET');assert.equal([...r.headers].length,0);assert.equal(new URL(r.url).search,'');}
});
test('real Worker handler: direct paths/HEAD/encoded/traversal aliases never enter ASSETS, including authenticated requests',async t=>{
 const h=fixture(t),path=curriculumIndex.days[0].path;
 for(const token of [null,raw,otherRaw])for(const method of ['GET','HEAD'])for(const p of [path,path+'/',path.replace('_protected','%5fprotected'),'/data.json','/%64ata.json','/private/../data.json','/x/..'+path,path.replace('/1.json','/%31.json'),path+'?download=1']){const r=await h.call(p,{token,method});assert.equal(r.status,404,method+' '+p);assert.equal(r.headers.get('Cache-Control'),'no-store');}
 assert.equal(h.calls.length,0);
});
test('real Worker handler: auth, owner, origin, archive, unlock and exact revisions fail before ASSETS',async t=>{
 const h=fixture(t);
 for(const [options,status]of [[{token:null},401],[{token:otherRaw},404],[{headers:{'Sec-Fetch-Site':'cross-site'}},403]])assert.equal((await h.call(h.detail(),options)).status,status);
 assert.equal((await worker.fetch(new Request('https://wrong.test'+h.detail(),{headers:{Cookie:'__Host-littlelab_session='+raw}}),h.env)).status,403);
 for(const p of [h.detail(0),h.detail(366),h.detail('01'),h.base+'/1',h.detail(1,{revision:'0'.repeat(64)}),h.detail(1,{accessVersion:'old'})])assert.ok([404,409].includes((await h.call(p)).status));
 h.db.prepare('UPDATE children SET archived_at=1 WHERE id=?').run(childId);assert.equal((await h.call(h.detail())).status,404);h.db.prepare('UPDATE children SET archived_at=NULL WHERE id=?').run(childId);
 h.db.prepare('UPDATE users SET unlock_all=0,unlock_through=0 WHERE id=?').run(userId);assert.equal((await h.call(h.detail())).status,403);assert.equal(h.calls.length,0);
});
test('real Worker handler: revocation/logout/archive while ASSETS resolves cannot return lesson content',async t=>{
 for(const mutate of [h=>h.db.prepare("UPDATE users SET status='disabled',access_version=access_version+1 WHERE id=?").run(userId),h=>h.db.exec('DELETE FROM sessions'),h=>h.db.prepare('UPDATE children SET archived_at=1 WHERE id=?').run(childId),h=>h.db.prepare('UPDATE users SET access_version=access_version+1,unlock_all=0,unlock_through=0 WHERE id=?').run(userId),h=>h.db.prepare("UPDATE children SET age_band='7-9' WHERE id=?").run(childId)]){
  const h=fixture(t);h.setHook(()=>{mutate(h);return new Response(readFileSync(new URL('../deployment-assets'+curriculumIndex.days[0].path,import.meta.url)));});const r=await h.call(h.detail());assert.ok([401,404,409].includes(r.status));assert.equal((await r.json()).experiment,undefined);
 }
});
test('ASSETS failures, stale/malformed bytes, oversized streams and soft 404s fail closed',async t=>{
 for(const response of [()=>new Response('missing',{status:404}),()=>new Response('<html>SPA fallback</html>'),()=>new Response('{}'),()=>new Response('x'.repeat(512*1024+1)),()=>new Response('x',{headers:{'Content-Length':String(512*1024+1)}})]){const h=fixture(t);h.setHook(response);const r=await h.call(h.detail());assert.equal(r.status,503);assert.equal((await r.json()).experiment,undefined);}
 const h=fixture(t);await assert.rejects(()=>readCurriculumDay(h.env,origin,0));assert.equal(h.calls.length,0);
});
