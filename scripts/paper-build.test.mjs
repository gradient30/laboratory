import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {paperArtifacts,stable,digest} from './build-paper-resources.mjs';
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'paper-build-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'paper-resources/blobs'),{recursive:true});
 const protocol={version:1,materials:['synthetic test']},data={experiments:[{ageProtocols:{'4-6':protocol}}]},bytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm"><text x="10" y="10">Synthetic test only</text></svg>'),id=digest(bytes)+'.svg';
 const catalog={schemaVersion:1,bindings:[{day:1,age:'4-6',version:1,protocolSha256:digest(stable(protocol)),coverage:'complete',printInstruction:'100%',preparation:'Synthetic',pages:[{id,bytes:bytes.length,title:'Synthetic only',pageCount:1,copies:1,shared:false}]}]};
 const write=()=>fs.writeFileSync(path.join(root,'paper-resources/catalog.json'),JSON.stringify(catalog));fs.writeFileSync(path.join(root,'paper-resources/blobs',id),bytes);write();return {root,data,catalog,id,bytes,write};
}
test('paper build deterministic, content-addressed, staged mismatch excluded rather than rebound',t=>{
 const f=fixture(t),a=paperArtifacts(f.root,f.data),b=paperArtifacts(f.root,f.data);assert.deepEqual(a,b);assert.equal(a.files.size,2);assert.ok([...a.files.keys()].every(p=>p.startsWith('_protected/papers/')));
 f.data.experiments[0].ageProtocols['4-6'].materials=['changed'];const c=paperArtifacts(f.root,f.data);assert.equal(c.files.size,0);assert.equal(c.excluded[0].reason,'exact-protocol-mismatch');
});
test('paper build rejects blob corruption, symlinks, invalid id, duplicate age, duplicate page and active SVG',t=>{
 for(const alter of [f=>fs.writeFileSync(path.join(f.root,'paper-resources/blobs',f.id),'changed'),f=>{const p=path.join(f.root,'paper-resources/blobs',f.id);fs.unlinkSync(p);fs.symlinkSync('/etc/hosts',p)},f=>f.catalog.bindings[0].pages[0].id='../outside.svg',f=>f.catalog.bindings.push(structuredClone(f.catalog.bindings[0])),f=>f.catalog.bindings[0].pages.push(structuredClone(f.catalog.bindings[0].pages[0])),f=>{const b=Buffer.from('<svg><script>alert(1)</script></svg>'),id=digest(b)+'.svg';fs.writeFileSync(path.join(f.root,'paper-resources/blobs',id),b);Object.assign(f.catalog.bindings[0].pages[0],{id,bytes:b.length});}]){
  const f=fixture(t);alter(f);f.write();assert.throws(()=>paperArtifacts(f.root,f.data));
 }
});
test('all production entries have original byte-pinned blobs and exact binding; missing catalog fails closed',t=>{
 const bytes=fs.readFileSync('dist/data.json'),data=JSON.parse(bytes),a=paperArtifacts('.',data),sourceSha=digest(bytes);
 const profiles={
  'e17afb26990b383c30ab549ef076058f9d6b31ff55a7b03c99be4224aab35710':{active:289,files:2998,excluded:8,staged:true},
  '7f39438a7ad283375a53702c72c9e3c12d3301726522a1955a62a895ecb47073':{active:289,files:2998,excluded:8,staged:true},
  '8b3e1e712ebdd0ce8b704617cae8a5a34e94e9c12c6763c5662d7676a6b3bd24':{active:289,files:2998,excluded:8,staged:true},
  '595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040':{active:272,files:2845,excluded:25,staged:false},
  '0a07a57c148077a36052270e9428e800a2c866d00cdcaa06dd7b36d194ad9557':{active:289,files:2998,excluded:8,staged:true}
 },expected=profiles[sourceSha];assert.ok(expected,'This regression must use an exact pinned data profile');
 const ages=['4-6','7-9','10-12','13-16'],baseKeys=Array.from({length:68},(_,i)=>i+233).flatMap(day=>ages.map(age=>day+':'+age)),newKeys=['194:13-16',...[301,302,303,304].flatMap(day=>ages.map(age=>day+':'+age))],alternateKeys=[254,268].flatMap(day=>ages.map(age=>day+':'+age));
 assert.equal(Object.keys(a.index.bindings).length,expected.active);assert.equal(a.files.size,expected.files);assert.equal(a.excluded.length,expected.excluded);
 assert.deepEqual(Object.keys(a.index.bindings).sort(),[...baseKeys,...(expected.staged?newKeys:[])].sort());assert.deepEqual(a.excluded.map(b=>b.key).sort(),[...alternateKeys,...(expected.staged?[]:newKeys)].sort());assert.ok(a.excluded.every(b=>b.reason==='exact-protocol-mismatch'));
 const docs=Object.values(a.index.bindings).map(e=>JSON.parse(a.files.get(e.path.slice(1))));assert.equal(docs.filter(m=>m.coverage==='partial').length,6);assert.equal(docs.flatMap(m=>m.pages).filter(p=>p.optional).length,86);
 const emptyRoot=fs.mkdtempSync(path.join(os.tmpdir(),'no-paper-'));t.after(()=>fs.rmSync(emptyRoot,{recursive:true,force:true}));assert.throws(()=>paperArtifacts(emptyRoot,data),/Missing required paper catalog/);
});
test('R2 exact staged protocols, including day304 numeric coordinates, bind all 289 ages without Python/JS serialization drift',()=>{
 const data=JSON.parse(fs.readFileSync('dist/data.json')),staged=JSON.parse(fs.readFileSync('worker/fixtures/paper-staged-protocols.json'));
 for(const [day,ages]of Object.entries(staged))data.experiments[Number(day)-1].ageProtocols={...data.experiments[Number(day)-1].ageProtocols,...ages};
 const a=paperArtifacts('.',data);assert.equal(Object.keys(a.index.bindings).length,289);assert.equal(a.excluded.length,8);assert.ok(a.excluded.every(b=>b.key.startsWith('254:')||b.key.startsWith('268:')));
 for(const day of [301,302,303,304])for(const age of ['4-6','7-9','10-12','13-16'])assert.ok(a.index.bindings[day+':'+age]);
 const docs=Object.values(a.index.bindings).map(e=>JSON.parse(a.files.get(e.path.slice(1))));assert.equal(docs.filter(m=>m.coverage==='partial').length,6);assert.equal(docs.filter(m=>m.unprovided.length).length,6);assert.ok(docs.flatMap(m=>m.pages).some(p=>p.optional));
});
