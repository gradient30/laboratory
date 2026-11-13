import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {releaseGates,gateChecks,validateReleaseEvidence,releaseSourceFingerprint,readReleaseEvidenceFile} from './release-evidence.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
// Synthetic fixtures test structure only. They are never saved as release approvals.
import {fixture} from './release-evidence-fixture.mjs';
test('whole-candidate category attestations accepted structurally, not semantically certified',()=>{const f=fixture();assert.deepEqual(validateReleaseEvidence(f.evidence,f.context),[]);});
test('missing, duplicate, pending, stale and unknown final gates fail',()=>{for(const mutate of [f=>f.evidence.reviews.pop(),f=>f.evidence.reviews.push(f.evidence.reviews[0]),f=>f.evidence.reviews[0].status='pending',f=>f.evidence.reviews[0].sourceSha256='c'.repeat(64),f=>f.evidence.reviews[0].dataSha256='c'.repeat(64),f=>f.evidence.reviews[0].reportSha256='c'.repeat(64),f=>f.evidence.reviews[0].gate='round1',f=>f.evidence.schemaVersion=2]){const f=fixture();mutate(f);assert.ok(validateReleaseEvidence(f.evidence,f.context).length);}});
test('partial scope, mismatched category, stale support and malformed inventories fail',()=>{
 for(const mutate of [a=>a.scope.activities=1,a=>a.scope.ageProtocols=4,a=>a.scope.candidate='pilot',a=>a.gate='facts',a=>a.checks.pop(),a=>a.checks[0].evidenceIds=['missing'],a=>a.evidence=[],a=>a.evidence.push(a.evidence[0]),a=>a.evidence[1].id='source',a=>a.evidence[1].path=a.evidence[0].path,a=>a.evidence.reverse(),a=>a.evidence[0].sha256='c'.repeat(64),a=>a.evidence[0].path='docs/../outside',a=>a.evidence[0].path='docs//source.txt',a=>a.evidence[0].path='docs/age-protocol-release.json',a=>a.evidence[0].path='docs/final-specification.json']){
  const f=fixture();mutate(f.reports.get('specification'));f.seal();assert.ok(validateReleaseEvidence(f.evidence,f.context).length);
 }
 const f=fixture();f.files.set('verification/result.txt','Changed after review');assert.ok(validateReleaseEvidence(f.evidence,f.context).length);
});
test('feedback requires actual source trace, quote, resolved disposition and verification',()=>{
 for(const mutate of [a=>delete a.feedback,a=>a.feedback=[],a=>delete a.feedbackMode,a=>a.feedbackMode='synthetic-acceptance',a=>a.feedbackMode='real-user-acceptance',a=>a.evidence[0].kind='test',a=>a.feedback[0].sourceReference='',a=>a.feedback[0].exactQuote='Invented absent quote',a=>a.feedback[0].disposition='pending',a=>a.feedback[0].verificationEvidenceIds=['source'],a=>a.feedback[0].verificationEvidenceIds=[],a=>a.feedback.push(a.feedback[0])]){
  const f=fixture();mutate(f.reports.get('user-feedback'));f.seal();assert.ok(validateReleaseEvidence(f.evidence,f.context).length);
 }
});
test('old scoped Markdown report cannot substitute for whole-release structured attestation',()=>{const f=fixture(),r=f.evidence.reviews[0];const bytes='Static pilot only, not full-year acceptance';f.files.set(r.report,bytes);r.reportSha256=sha(bytes);assert.ok(validateReleaseEvidence(f.evidence,f.context).length);});
test('safe reader rejects symlinks and directory evidence',async t=>{const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');const root=fs.mkdtempSync(path.join(os.tmpdir(),'gate-files-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'docs'));fs.writeFileSync(path.join(root,'docs/source.txt'),'test');fs.symlinkSync('source.txt',path.join(root,'docs/link.txt'));assert.equal(readReleaseEvidenceFile('docs/source.txt',root).toString(),'test');assert.throws(()=>readReleaseEvidenceFile('docs/link.txt',root));assert.throws(()=>readReleaseEvidenceFile('docs/',root));});
test('actual release-source fingerprint is deterministic',()=>{const first=releaseSourceFingerprint();assert.match(first,/^[a-f0-9]{64}$/);assert.equal(releaseSourceFingerprint(),first);});
test('deployment, generated assets, runtime upgrade safety and API/client tests each invalidate final reviews',async t=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');const root=fs.mkdtempSync(path.join(os.tmpdir(),'release-fingerprint-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const dir of ['dist','worker','migrations','scripts','tests','.github/workflows'])fs.mkdirSync(path.join(root,dir),{recursive:true});for(const name of ['package.json','package-lock.json','playwright.config.mjs','wrangler.jsonc','test.mjs','verify-package.mjs','source-manifest.json','deployment-manifest.json','worker/curriculum-index.json','scripts/build-curriculum.mjs','worker/curriculum.test.mjs','scripts/curriculum-loading.test.mjs','tests/curriculum-loading.spec.mjs','scripts/account-runtime-config.mjs','scripts/account-runtime-config.test.mjs','scripts/check-workflow.mjs','.github/workflows/cloudflare.yml'])fs.writeFileSync(path.join(root,name),'synthetic');
 const first=releaseSourceFingerprint(root);for(const name of ['deployment-manifest.json','worker/curriculum-index.json','scripts/build-curriculum.mjs','worker/curriculum.test.mjs','scripts/curriculum-loading.test.mjs','tests/curriculum-loading.spec.mjs','scripts/account-runtime-config.mjs','scripts/account-runtime-config.test.mjs','scripts/check-workflow.mjs','.github/workflows/cloudflare.yml']){fs.appendFileSync(path.join(root,name),'changed');assert.notEqual(releaseSourceFingerprint(root),first);fs.writeFileSync(path.join(root,name),'synthetic');}
});
