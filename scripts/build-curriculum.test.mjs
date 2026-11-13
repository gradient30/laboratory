import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';
import {budgets,curriculumArtifacts,buildCurriculum} from './build-curriculum.mjs';
const data=JSON.parse(fs.readFileSync('dist/data.json'));
test('deterministic 365 protected shards reconstruct canonical authoring data exactly',()=>{
 const a=curriculumArtifacts(),b=curriculumArtifacts();assert.deepEqual(a.manifest,b.manifest);assert.deepEqual(a.index,b.index);assert.equal(a.manifest.curriculumAssetCount,370);assert.equal(a.files.size,370+a.manifest.paperAssetCount);assert.ok(a.manifest.paperAssetCount>0);
 assert.deepEqual({meta:a.index.meta,experiments:a.index.days.map(d=>JSON.parse(a.files.get(d.path.slice(1))))},data);
 for(const d of a.index.days){assert.deepEqual(d.versions,Object.fromEntries(Object.entries(data.experiments[d.summary.id-1].ageProtocols||{}).map(([age,p])=>[age,p.version])));assert.ok(d.bytes<=budgets.day);}
 assert.ok(a.manifest.catalogBytes<=budgets.catalog);assert.ok([...a.files.values()].every(b=>b.length<=budgets.asset));assert.ok(!a.files.has('data.json'));
 const committed=JSON.parse(fs.readFileSync('deployment-manifest.json'));assert.deepEqual(committed,a.manifest);
});
test('deployment build rejects stale generated input and removes stale/unlisted files',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'curriculum-build-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.cpSync('dist',path.join(root,'dist'),{recursive:true});fs.mkdirSync(path.join(root,'paper-resources'));fs.writeFileSync(path.join(root,'paper-resources/catalog.json'),JSON.stringify({schemaVersion:1,bindings:[]}));fs.mkdirSync(path.join(root,'worker'));buildCurriculum(root);
 fs.writeFileSync(path.join(root,'deployment-assets','data.json'),'must never deploy');buildCurriculum(root,{check:true});assert.ok(!fs.existsSync(path.join(root,'deployment-assets','data.json')));
 fs.appendFileSync(path.join(root,'dist/app.js'),'\n// changed');assert.throws(()=>buildCurriculum(root,{check:true}),/Stale generated release input/);
});
test('oversized day and catalog fail before deployment',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'curriculum-limits-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.cpSync('dist',path.join(root,'dist'),{recursive:true});fs.mkdirSync(path.join(root,'paper-resources'));fs.writeFileSync(path.join(root,'paper-resources/catalog.json'),JSON.stringify({schemaVersion:1,bindings:[]}));
 let source=structuredClone(data);source.experiments[0].safety='x'.repeat(budgets.day);fs.writeFileSync(path.join(root,'dist/data.json'),JSON.stringify(source));assert.throws(()=>curriculumArtifacts(root),/Day 1 exceeds/);
 source=structuredClone(data);source.meta.description='x'.repeat(budgets.catalog);fs.writeFileSync(path.join(root,'dist/data.json'),JSON.stringify(source));assert.throws(()=>curriculumArtifacts(root),/Catalog exceeds/);
});
test('Worker bundle excludes every full-day asset and stays under official and application budgets',async()=>{
 const r=await build({entryPoints:['worker/index.mjs'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',external:['cloudflare:*','node:*'],metafile:true,logLevel:'silent'});
 assert.ok(!Object.keys(r.metafile.inputs).some(p=>p.endsWith('dist/data.json')||p.includes('deployment-assets/')));
 const bytes=r.outputFiles.reduce((n,f)=>n+f.contents.length,0);assert.ok(bytes<budgets.worker);assert.ok(bytes<1024*1024,'Application Worker bundle budget is 1 MiB');
 console.log(JSON.stringify({workerUncompressedBytes:bytes,officialUncompressedLimit:budgets.worker,scope:'Build size only; not production CPU, memory or startup verification'}));
});
test('synthetic complete 365-by-four scale stays bounded without treating fixtures as authored content',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'curriculum-full-grid-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.cpSync('dist',path.join(root,'dist'),{recursive:true});fs.mkdirSync(path.join(root,'paper-resources'));fs.writeFileSync(path.join(root,'paper-resources/catalog.json'),JSON.stringify({schemaVersion:1,bindings:[]}));const source=structuredClone(data);
 for(const e of source.experiments)e.ageProtocols??=structuredClone(source.experiments[0].ageProtocols);
 fs.writeFileSync(path.join(root,'dist/data.json'),JSON.stringify(source));const a=curriculumArtifacts(root);assert.equal(a.index.days.reduce((n,d)=>n+Object.keys(d.versions).length,0),1460);assert.ok(a.manifest.catalogBytes<budgets.catalog);assert.ok(a.manifest.maxDayBytes<budgets.day);assert.equal(a.manifest.assetCount,370);
});
