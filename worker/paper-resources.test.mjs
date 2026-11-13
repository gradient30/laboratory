import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from './core.mjs';
import {curriculumIndex} from './curriculum.mjs';
import {paperIndex} from './paper-resources.mjs';
const origin='https://lab.test',childId='c'.repeat(32),userId='a'.repeat(32),otherId='b'.repeat(32),raw='d'.repeat(64),otherRaw='e'.repeat(64);
function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());for(const name of ['0001_accounts.sql','0002_password_login.sql'])db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const stamp=Math.floor(Date.now()/1000);for(const [id,email,token]of [[userId,'a@qa.test',raw],[otherId,'b@qa.test',otherRaw]]){db.prepare("INSERT INTO users(id,email,role,status,unlock_all,verified_at,created_at,updated_at) VALUES(?,?,'parent','active',1,?,?,?)").run(id,email,stamp,stamp,stamp);db.prepare('INSERT INTO sessions(token_hash,user_id,csrf_token,auth_version,created_at,expires_at) VALUES(?,?,?,0,?,?)').run(createHash('sha256').update(token).digest('hex'),id,'csrf',stamp,stamp+600);}
 db.prepare('INSERT INTO children(id,user_id,nickname,age_band,guardian_consent_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(childId,userId,'Synthetic child','4-6',stamp,stamp,stamp);
 const calls=[];let hook=null,sqlHook=null;
 const env={APP_ORIGIN:origin,AUTH_SECRET:'synthetic-paper-tests-only-secret-32bytes',DB:{prepare(sql){return {bind(...args){return {async first(){const result=db.prepare(sql).get(...args)||null;if(sqlHook)await sqlHook(sql,args,result);return result},async all(){const result={results:db.prepare(sql).all(...args)};if(sqlHook)await sqlHook(sql,args,result);return result},async run(){return db.prepare(sql).run(...args)}}},async all(){const result={results:db.prepare(sql).all()};if(sqlHook)await sqlHook(sql,[],result);return result}}}},ASSETS:{async fetch(request){calls.push(request);if(hook)return hook(request);try{return new Response(readFileSync(new URL('../deployment-assets'+new URL(request.url).pathname,import.meta.url)));}catch{return new Response('Not found',{status:404});}}}};
 const call=(path,{method='GET',token=raw,headers={}}={})=>worker.fetch(new Request(new URL(path,origin),{method,headers:{...(token?{Cookie:'__Host-littlelab_session='+token}:{}),...headers}}),env);
 const base='/api/children/'+childId+'/curriculum';const catalog=async()=>await(await call(base)).json();const detail=(day=1,overrides={})=>base+'/'+day+'?'+new URLSearchParams({revision:curriculumIndex.revision,accessVersion:'0:0:4-6:sequential',...overrides});
 return {db,env,call,base,catalog,detail,calls,setHook:f=>hook=f,setSQLHook:f=>sqlHook=f};
}

function paperPath(day=233,age='4-6',id='',extra={}){return '/api/children/'+childId+'/papers/'+day+'/'+age+(id?'/'+id:'')+'?'+new URLSearchParams({revision:curriculumIndex.revision,accessVersion:'0:0:4-6:sequential',...extra});}
async function manifest(h,day=233){const r=await h.call(paperPath(day));assert.equal(r.status,200);return (await r.json()).papers;}
function snapshot(h){return JSON.stringify(h.db.prepare('SELECT * FROM children').all());}
test('paper manifest + actual bytes are owner/age-bound, immutable and correct headers',async t=>{
 const h=fixture(t),before=snapshot(h),m=await manifest(h);assert.equal(m.age,'4-6');assert.equal(m.day,233);assert.ok(m.pages.length>0);
 for(const page of m.pages){for(const download of [false,true]){const r=await h.call(paperPath(233,'4-6',page.id,download?{download:'1'}:{}));assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'image/svg+xml');assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('Vary'),'Cookie');assert.ok(r.headers.get('Content-Disposition').startsWith(download?'attachment;':'inline;'));assert.ok(r.headers.get('Content-Security-Policy').includes('sandbox'));assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),page.id.slice(0,64));}}
 const r=await h.call(paperPath(233,'4-6',m.pages[0].id),{method:'HEAD'});assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,0);assert.equal(snapshot(h),before);
 for(const request of h.calls){assert.equal(request.method,'GET');assert.equal([...request.headers].length,0);assert.equal(new URL(request.url).search,'');}
});
test('paper guard denies anonymous, other family, archive, wrong origin, wrong age, lock and stale context before asset lookup',async t=>{
 const h=fixture(t);
 for(const [options,status]of [[{token:null},401],[{token:otherRaw},404],[{headers:{'Sec-Fetch-Site':'cross-site'}},403]])assert.equal((await h.call(paperPath(),options)).status,status);
 assert.equal((await worker.fetch(new Request('https://wrong.test'+paperPath(),{headers:{Cookie:'__Host-littlelab_session='+raw}}),h.env)).status,403);
 for(const p of [paperPath(233,'7-9'),paperPath(233,'4-6','',{revision:'x'}),paperPath(233,'4-6','',{accessVersion:'x'}),paperPath(233,'4-6','',{file:'../../data.json'}),paperPath()+'&revision='+curriculumIndex.revision])assert.equal((await h.call(p)).status,409);
 h.db.prepare('UPDATE children SET archived_at=1 WHERE id=?').run(childId);assert.equal((await h.call(paperPath())).status,404);h.db.prepare('UPDATE children SET archived_at=NULL WHERE id=?').run(childId);
 h.db.prepare('UPDATE users SET unlock_all=0,unlock_through=232 WHERE id=?').run(userId);assert.equal((await h.call(paperPath())).status,403);assert.equal(h.calls.length,0);
});
test('paper protected paths, traversal/encoding, unknown asset, foreign-age asset, methods fail closed',async t=>{
 const h=fixture(t),m=await manifest(h),id=m.pages[0].id;h.calls.length=0;
 for(const p of ['/_protected/papers/'+id,'/_protected/papers/manifests/'+paperIndex.bindings['233:4-6'].sha256+'.json','/paper-resources/catalog.json','/paper-resources/blobs/'+id,'/api/children/'+childId+'/papers/233/4-6/%2e%2e%2fdata.json','/api/children/'+childId+'/papers/233/4-6/%2f'+id])assert.equal((await h.call(p)).status,404);
 assert.equal(h.calls.length,0);
 assert.equal((await h.call(paperPath(233,'4-6','0'.repeat(64)+'.svg'))).status,404);
 const otherManifest=JSON.parse(readFileSync(new URL('../deployment-assets'+paperIndex.bindings['233:7-9'].path,import.meta.url)));const onlyOther=otherManifest.pages.find(p=>!m.pages.some(q=>q.id===p.id));assert.ok(onlyOther);assert.equal((await h.call(paperPath(233,'4-6',onlyOther.id))).status,404);
 assert.equal((await h.call(paperPath(),{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':'csrf'}})).status,405);
});
test('age change/revocation/logout during either manifest or asset read returns no paper bytes',async t=>{
 for(const during of [1,2])for(const mutate of [h=>h.db.exec('DELETE FROM sessions'),h=>h.db.prepare("UPDATE users SET status='disabled',access_version=access_version+1 WHERE id=?").run(userId),h=>h.db.prepare('UPDATE children SET archived_at=1 WHERE id=?').run(childId),h=>h.db.prepare("UPDATE children SET age_band='7-9' WHERE id=?").run(childId),h=>h.db.prepare('UPDATE users SET access_version=access_version+1,unlock_all=0,unlock_through=0 WHERE id=?').run(userId)]){
  const h=fixture(t),m=await manifest(h);let calls=0;h.setHook(req=>{if(++calls===during)mutate(h);return new Response(readFileSync(new URL('../deployment-assets'+new URL(req.url).pathname,import.meta.url)));});const r=await h.call(paperPath(233,'4-6',m.pages[0].id));assert.ok([401,404,409].includes(r.status));assert.equal((await r.json()).papers,undefined);
 }
});
test('no-resource, interrupted/repeated reads, unavailable/corrupt/oversized ASSETS do not mutate records',async t=>{
 const h=fixture(t),before=snapshot(h);assert.equal(await manifest(h,1),null);const m=await manifest(h);assert.deepEqual(await manifest(h),m);assert.equal(snapshot(h),before);
 for(const response of [()=>new Response('missing',{status:404}),()=>new Response('<html>SPA</html>'),()=>new Response('{}'),()=>new Response('x',{headers:{'Content-Length':String(4*1024*1024+1)}}),()=>new Response(new ReadableStream({start(c){c.error(Error('interrupted'))}}))]){h.setHook(response);const r=await h.call(paperPath());assert.equal(r.status,503);assert.equal(snapshot(h),before);}
 h.setHook(null);assert.deepEqual(await manifest(h),m);assert.equal(snapshot(h),before);
});

test('explicit staged fixture: revised194 PDF uses same real auth/allowlist route and 302 duplicated card master retains two copies',async t=>{
 // This is an isolated in-memory integration fixture, NOT a modification/integration of canonical data.
 const {paperArtifacts}=await import('../scripts/build-paper-resources.mjs');
 const data=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url)));
 const fixtureProtocols=JSON.parse(readFileSync(new URL('./fixtures/paper-staged-protocols.json',import.meta.url)));
 data.experiments[193].ageProtocols['13-16']=fixtureProtocols['194']['13-16'];
 data.experiments[301].ageProtocols=fixtureProtocols['302'];
 const a=paperArtifacts(new URL('../',import.meta.url).pathname,data),h=fixture(t);
 const key='194:13-16',previous=paperIndex.bindings[key];paperIndex.bindings[key]=a.index.bindings[key];t.after(()=>{if(previous)paperIndex.bindings[key]=previous;else delete paperIndex.bindings[key]});
 h.db.prepare("UPDATE children SET age_band='13-16' WHERE id=?").run(childId);h.setHook(req=>{const b=a.files.get(new URL(req.url).pathname.slice(1));return b?new Response(b):new Response('missing',{status:404})});
 const query={accessVersion:'0:0:13-16:sequential'},manifestResponse=await h.call(paperPath(194,'13-16','',query));assert.equal(manifestResponse.status,200);const m=(await manifestResponse.json()).papers;assert.equal(m.pages.length,2);
 for(const p of m.pages){const r=await h.call(paperPath(194,'13-16',p.id,{...query,download:'1'}));assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'application/pdf');assert.ok(r.headers.get('Content-Disposition').startsWith('attachment;'));assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),p.id.slice(0,64));}
 const m302=JSON.parse(a.files.get(a.index.bindings['302:4-6'].path.slice(1)));assert.equal(m302.pages.filter(p=>p.copies===2).length,1);assert.equal(m302.pages.reduce((n,p)=>n+p.pageCount*p.copies,0),10);
});

test('R1 exact SQL-hook reproductions: revocation between final diagnostic awaits is denied at atomic authorization point',async t=>{
 for(const method of ['GET','HEAD'])for(const mutation of ['logout-after-session','disabled-after-session','grant-after-session','archive-after-child','age-after-child','settings-after-child','expiry-after-child'])await t.test(method+' '+mutation,async t=>{
  const h=fixture(t),m=await manifest(h);let sessionReads=0,childReads=0,mutated=false,atomicReads=0;
  h.setSQLHook(sql=>{
   if(sql.includes('FROM sessions s JOIN users u'))sessionReads++;
   if(sql.startsWith('SELECT * FROM children'))childReads++;
   if(sql.startsWith('SELECT 1 AS paper_authorized'))atomicReads++;
   const point=mutation.endsWith('after-session')?sessionReads===2&&sql.startsWith('SELECT * FROM children'):childReads===2&&sql==='SELECT key,value FROM settings';
   if(!mutated&&point){mutated=true;
    if(mutation.startsWith('logout'))h.db.exec('DELETE FROM sessions');
    if(mutation.startsWith('disabled'))h.db.prepare("UPDATE users SET status='disabled',access_version=access_version+1 WHERE id=?").run(userId);
    if(mutation.startsWith('grant'))h.db.prepare('UPDATE users SET unlock_all=0,unlock_through=0,access_version=access_version+1 WHERE id=?').run(userId);
    if(mutation.startsWith('archive'))h.db.prepare('UPDATE children SET archived_at=1 WHERE id=?').run(childId);
    if(mutation.startsWith('age'))h.db.prepare("UPDATE children SET age_band='7-9' WHERE id=?").run(childId);
    if(mutation.startsWith('settings'))h.db.prepare("INSERT INTO settings(key,value,updated_at) VALUES('progressionMode','manual',0)").run();
    if(mutation.startsWith('expiry'))h.db.exec('UPDATE sessions SET expires_at=0');
   }
  });
  const r=await h.call(paperPath(233,'4-6',m.pages[0].id),{method});assert.equal(mutated,true);assert.equal(atomicReads,1);assert.equal(r.status,409);assert.equal(r.headers.get('Content-Type'),'application/json; charset=utf-8');assert.notEqual(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),m.pages[0].id.slice(0,64));
 });
});
test('R1 final authorization honors empty progression-setting env fallback and is last async DB read',async t=>{
 const h=fixture(t);h.env.PROGRESSION_MODE='manual';h.db.prepare("INSERT INTO settings(key,value,updated_at) VALUES('progressionMode','',0)").run();const queries=[];h.setSQLHook(q=>queries.push(q));
 const r=await h.call(paperPath(233,'4-6','',{accessVersion:'0:0:4-6:manual'}));assert.equal(r.status,200);assert.ok(queries.at(-1).startsWith('SELECT 1 AS paper_authorized'));
});
