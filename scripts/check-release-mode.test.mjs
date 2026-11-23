import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {previewMode,isPersonalPreview,validatePersonalPreview,checkReleaseMode} from './check-release-mode.mjs';
import {releaseGates,releaseSourceFingerprint} from './release-evidence.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'dist/data.json'))),identities=JSON.parse(fs.readFileSync(path.join(root,'scripts/activity-identities.json')));
const env=()=>({RELEASE_MODE:previewMode,GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_REPOSITORY:'gradient30/laboratory',GITHUB_SHA:'a'.repeat(40)});
function fixture(){return {declaration:{schemaVersion:1,id:previewMode,scope:'owner-authorized early release; access is not restricted to the owner',repository:'gradient30/laboratory',ref:'refs/heads/main',sourceSha256:'b'.repeat(64),dataSha256:'c'.repeat(64),deferred:{browser:'unrun-for-this-candidate',finalJointReviews:[...releaseGates]}},context:{sourceSha256:'b'.repeat(64),dataSha256:'c'.repeat(64),data,identities,finalEvidence:{schemaVersion:3,reviews:[],requiredGates:[...releaseGates]}}};}
function temp(t){const p=fs.mkdtempSync(path.join(os.tmpdir(),'personal-preview-test-'));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p;}
function syntheticCandidate(t){
 const p=temp(t);
 for(const d of ['dist','worker','migrations','scripts','tests','.github','docs'])fs.mkdirSync(path.join(p,d));
 for(const f of ['package.json','package-lock.json','playwright.config.mjs','wrangler.jsonc','test.mjs','verify-package.mjs','source-manifest.json','deployment-manifest.json'])fs.writeFileSync(path.join(p,f),'synthetic fingerprint input');
 for(const file of ['data.json','diagrams.js','app.js'])fs.copyFileSync(path.join(root,'dist',file),path.join(p,'dist',file));
 fs.copyFileSync(path.join(root,'scripts/activity-identities.json'),path.join(p,'scripts/activity-identities.json'));
 const f=fixture();fs.writeFileSync(path.join(p,'docs/age-protocol-release.json'),JSON.stringify(f.context.finalEvidence));
 f.declaration.sourceSha256=releaseSourceFingerprint(p);
 f.declaration.dataSha256=createHash('sha256').update(fs.readFileSync(path.join(p,'dist/data.json'))).digest('hex');
 fs.writeFileSync(path.join(p,'docs/personal-preview-20261109.json'),JSON.stringify(f.declaration));
 return p;
}

test('only explicit manual main preview may defer verification',()=>{assert.equal(isPersonalPreview(env()),true);for(const mode of [undefined,'','standard'])for(const event of ['push','pull_request','workflow_dispatch'])assert.equal(isPersonalPreview({...env(),RELEASE_MODE:mode,GITHUB_EVENT_NAME:event}),false);});
test('unknown modes and unauthorized preview contexts fail closed',()=>{for(const change of [{RELEASE_MODE:'preview'},{RELEASE_MODE:'true'},{GITHUB_ACTIONS:'false'},{GITHUB_EVENT_NAME:'push'},{GITHUB_EVENT_NAME:'pull_request'},{GITHUB_EVENT_NAME:'workflow_run'},{GITHUB_REF:'refs/heads/other'},{GITHUB_REF:'refs/pull/11/merge'},{GITHUB_REPOSITORY:'someone/laboratory'},{GITHUB_SHA:''},{GITHUB_SHA:'x'.repeat(40)}])assert.throws(()=>isPersonalPreview({...env(),...change}));});
test('valid declaration permits a complete structural candidate without claiming reviews',()=>{const f=fixture(),r=validatePersonalPreview(f.declaration,f.context);assert.equal(r.explicitValidProtocols,1460);assert.equal(r.productionReady,false);assert.deepEqual(f.context.finalEvidence.reviews,[]);});
test('missing, invalid or stale declaration and invented passes are rejected',()=>{for(const change of [d=>d.schemaVersion=2,d=>d.id='future-preview',d=>d.scope='private hosting',d=>d.repository='other/repo',d=>d.ref='refs/heads/other',d=>delete d.sourceSha256,d=>d.sourceSha256='d'.repeat(64),d=>d.dataSha256='d'.repeat(64),d=>d.deferred.browser='passed',d=>d.deferred.finalJointReviews.pop()]){const f=fixture();change(f.declaration);assert.throws(()=>validatePersonalPreview(f.declaration,f.context));}assert.throws(()=>validatePersonalPreview(undefined,fixture().context));});
test('the final-review schema and empty truthful evidence remain intact',()=>{for(const change of [e=>e.schemaVersion=2,e=>e.reviews.push({gate:'facts',status:'passed'}),e=>e.requiredGates.pop()]){const f=fixture();change(f.context.finalEvidence);assert.throws(()=>validatePersonalPreview(f.declaration,f.context));}});
test('preview rejects missing protocols, invalid age keys, changed identities and duplicated actions',()=>{for(const change of [e=>delete e.ageProtocols,e=>delete e.ageProtocols['4-6'],e=>e.contentKey='changed',e=>e.ageProtocols['7-9']=structuredClone(e.ageProtocols['4-6'])]){const f=fixture();f.context.data={...data,experiments:[structuredClone(data.experiments[0]),...data.experiments.slice(1)]};change(f.context.data.experiments[0]);assert.throws(()=>validatePersonalPreview(f.declaration,f.context));}});
test('standard mode does not read or require a preview declaration',t=>{const p=temp(t),output=path.join(p,'output');assert.deepEqual(checkReleaseMode({RELEASE_MODE:'standard',GITHUB_OUTPUT:output},path.join(p,'nonexistent')),{personalPreview:false});assert.equal(fs.readFileSync(output,'utf8'),'personal_preview=false\n');});
test('failed preview emits no skip output or success summary',t=>{const p=temp(t),output=path.join(p,'output'),summary=path.join(p,'summary');for(const candidate of [{...env(),GITHUB_EVENT_NAME:'push'},env()]){assert.throws(()=>checkReleaseMode({...candidate,GITHUB_OUTPUT:output,GITHUB_STEP_SUMMARY:summary},p));assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(summary),false);}});
test('synthetic exact-candidate CLI succeeds with explicit unverified summary',t=>{const p=syntheticCandidate(t),output=path.join(p,'output'),summary=path.join(p,'summary');const r=spawnSync(process.execPath,[path.join(root,'scripts/check-release-mode.mjs')],{cwd:p,encoding:'utf8',env:{...process.env,...env(),GITHUB_OUTPUT:output,GITHUB_STEP_SUMMARY:summary}});assert.equal(r.status,0,r.stderr);assert.equal(fs.readFileSync(output,'utf8'),'personal_preview=true\n');const s=fs.readFileSync(summary,'utf8');assert.match(s,/Browser tests: UNRUN/);assert.match(s,/Final joint reviews: DEFERRED \/ UNVERIFIED/);assert.match(s,/does not restrict access to the owner/);});
test('standard complete gate still fails for synthetic missing final reviews',t=>{const p=syntheticCandidate(t);const r=spawnSync(process.execPath,[path.join(root,'scripts/check-age-protocols.mjs')],{cwd:p,encoding:'utf8',env:process.env});assert.equal(r.status,1,r.stderr);assert.ok(r.stdout,r.stderr);const result=JSON.parse(r.stdout);assert.equal(result.explicitValidProtocols,1460);assert.equal(result.passed,false);assert.equal(result.productionReady,false);assert.equal(result.errors.length,5);for(const gate of releaseGates)assert.ok(result.errors.some(e=>e.startsWith(`Final ${gate} review:`)));});
test('source, workflow, scripts, dependencies and data changes invalidate preview binding',t=>{const p=temp(t);for(const d of ['dist','worker','migrations','scripts','tests','.github/workflows','docs'])fs.mkdirSync(path.join(p,d),{recursive:true});const files=['package.json','package-lock.json','playwright.config.mjs','wrangler.jsonc','test.mjs','verify-package.mjs','source-manifest.json','deployment-manifest.json','worker/index.mjs','dist/data.json','scripts/check-release-mode.mjs','.github/workflows/cloudflare.yml'];for(const f of files)fs.writeFileSync(path.join(p,f),'synthetic');const original=releaseSourceFingerprint(p);for(const f of files){fs.writeFileSync(path.join(p,f),'changed');assert.notEqual(releaseSourceFingerprint(p),original);fs.writeFileSync(path.join(p,f),'synthetic');}fs.writeFileSync(path.join(p,'docs/personal-preview-20261109.json'),'declaration is outside the hash to avoid self-reference');assert.equal(releaseSourceFingerprint(p),original);});

test('routine unreviewed CI runs never provide positive deployment eligibility',t=>{
 const p=syntheticCandidate(t);
 for(const event of ['push','pull_request']){
  const output=path.join(p,event+'-output'),summary=path.join(p,event+'-summary');
  const r=spawnSync(process.execPath,[path.join(root,'scripts/check-age-protocols.mjs'),'--allow-unreviewed'],{cwd:p,encoding:'utf8',env:{...process.env,GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:event,GITHUB_OUTPUT:output,GITHUB_STEP_SUMMARY:summary}});
  assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(r.stdout);assert.equal(result.explicitValidProtocols,1460);
  assert.equal(result.standardRelease,'unreviewed');assert.equal(result.productionReady,false);
  assert.equal(fs.readFileSync(output,'utf8'),'standard_review_eligible=false\n');
  assert.match(fs.readFileSync(summary,'utf8'),/Standard release not attempted.*cannot deploy/);
 }
});
test('the CI-only flag rejects an explicit dispatch; malformed or partial evidence emits no eligibility',t=>{
 const p=syntheticCandidate(t),output=path.join(p,'output');
 const run=event=>spawnSync(process.execPath,[path.join(root,'scripts/check-age-protocols.mjs'),'--allow-unreviewed'],{cwd:p,encoding:'utf8',env:{...process.env,GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:event,GITHUB_OUTPUT:output}});
 const dispatch=run('workflow_dispatch');
 assert.equal(dispatch.status,1);assert.match(dispatch.stderr,/restricted to ordinary GitHub Actions/);assert.equal(fs.existsSync(output),false);
 const manifest=path.join(p,'docs/age-protocol-release.json'),empty=JSON.parse(fs.readFileSync(manifest,'utf8'));
 for(const contents of ['{',JSON.stringify({...empty,reviews:[{gate:'facts',status:'pending'}]})]){
  fs.writeFileSync(manifest,contents);
  const r=run('push');assert.equal(r.status,1,r.stderr);
  assert.equal(JSON.parse(r.stdout).standardRelease,'invalid');assert.equal(fs.existsSync(output),false);
 }
 // Even an empty valid review manifest cannot neutralize a real structural failure.
 fs.writeFileSync(manifest,JSON.stringify(empty));
 const source=path.join(p,'dist/data.json'),bad=JSON.parse(fs.readFileSync(source,'utf8'));
 bad.experiments[0].contentKey='changed';
 fs.writeFileSync(source,JSON.stringify(bad));
 const r=run('push');assert.equal(r.status,1,r.stderr);
 const verdict=JSON.parse(r.stdout);assert.equal(verdict.standardRelease,'invalid');
 assert.ok(verdict.errors.some(e=>e.startsWith('Frozen identity changed:')));
 assert.equal(fs.existsSync(output),false);
});
