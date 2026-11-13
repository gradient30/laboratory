import assert from 'node:assert/strict';
import {readFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkAgeProtocols} from './check-age-protocols.mjs';
import {releaseGates,releaseSourceFingerprint,readReleaseEvidenceFile} from './release-evidence.mjs';

export const previewMode='personal-preview-20261109';
export function isPersonalPreview(env){
 const mode=env.RELEASE_MODE||'standard';
 assert.ok(['standard',previewMode].includes(mode),'Unknown release mode; no checks may be deferred.');
 if(mode==='standard')return false;
 assert.equal(env.GITHUB_ACTIONS,'true','Preview requires GitHub Actions.');
 assert.equal(env.GITHUB_EVENT_NAME,'workflow_dispatch','Preview requires explicit manual dispatch.');
 assert.equal(env.GITHUB_REF,'refs/heads/main','Preview is restricted to main.');
 assert.equal(env.GITHUB_REPOSITORY,'gradient30/laboratory','Preview repository differs from the declared target.');
 assert.match(env.GITHUB_SHA||'',/^[a-f0-9]{40}$/,'Preview requires the triggering commit SHA.');
 return true;
}
export function validatePersonalPreview(declaration,{sourceSha256,dataSha256,data,identities,finalEvidence}){
 assert.equal(declaration?.schemaVersion,1,'Preview declaration schema mismatch.');
 assert.equal(declaration?.id,previewMode,'Preview declaration ID mismatch.');
 assert.equal(declaration?.scope,'owner-authorized early release; access is not restricted to the owner','Preview is not private hosting.');
 assert.equal(declaration?.repository,'gradient30/laboratory','Preview declaration repository mismatch.');
 assert.equal(declaration?.ref,'refs/heads/main','Preview declaration branch mismatch.');
 for(const [key,value] of Object.entries({sourceSha256,dataSha256})){
  assert.match(value||'',/^[a-f0-9]{64}$/,'Invalid current candidate fingerprint.');
  assert.equal(declaration?.[key],value,`Preview ${key} is stale; no checks may be deferred.`);
 }
 assert.deepEqual(declaration?.deferred,{browser:'unrun-for-this-candidate',finalJointReviews:releaseGates},'Deferred checks must remain explicitly unverified.');
 assert.equal(finalEvidence?.schemaVersion,3,'Keep the original final-review schema.');
 assert.deepEqual(finalEvidence?.reviews,[],'This preview declaration requires all five final reviews to remain pending, not fabricated.');
 assert.deepEqual(finalEvidence?.requiredGates,releaseGates,'Keep all five standard final-review gates.');
 const structure=checkAgeProtocols(data,identities,{requireComplete:true});
 assert.equal(structure.passed,true,structure.errors.join('\n'));
 assert.equal(structure.explicitValidProtocols,1460,'Preview still requires all 1,460 structurally valid protocols.');
 assert.equal(structure.productionReady,false,'Structural checks must not claim production readiness.');
 return structure;
}
export function checkReleaseMode(env=process.env,root='.'){
 const personalPreview=isPersonalPreview(env);
 if(personalPreview){
  const raw=readFileSync(path.join(root,'dist/data.json'));
  const dataSha256=createHash('sha256').update(raw).digest('hex'),sourceSha256=releaseSourceFingerprint(root);
  const declaration=JSON.parse(readReleaseEvidenceFile('docs/personal-preview-20261109.json',root));
  validatePersonalPreview(declaration,{sourceSha256,dataSha256,data:JSON.parse(raw),identities:JSON.parse(readFileSync(path.join(root,'scripts/activity-identities.json'))),finalEvidence:JSON.parse(readFileSync(path.join(root,'docs/age-protocol-release.json')))});
  const summary=`## Owner-authorized early release: verification deferred\n\nThis personal-preview option does not restrict access to the owner. The existing public endpoints and registration policy are unchanged.\n\n- Browser tests: UNRUN for this exact candidate; no browser pass is claimed.\n- Final joint reviews: DEFERRED / UNVERIFIED (${releaseGates.join(', ')}).\n- All 365 activities / 1,460 protocols passed structural checks only. This is not scientific, safety, age-fit, visual, browser or user-acceptance approval.\n- Full Node/account/backend tests, package dry-run and deployment target/runtime-secret/recovery/migration guards are still required by the workflow.\n- Source SHA-256: ${sourceSha256}\n- Data SHA-256: ${dataSha256}\n- Triggering commit: ${env.GITHUB_SHA}\n\nThis declaration is candidate-specific. Any source/data change requires a new deliberate declaration; the standard release path remains strict.\n`;
  if(env.GITHUB_STEP_SUMMARY)appendFileSync(env.GITHUB_STEP_SUMMARY,summary);
  console.log(`Exact-candidate early-release exception validated. Browser and all five final reviews remain UNVERIFIED. Source: ${sourceSha256}; data: ${dataSha256}.`);
 }else console.log('Standard release selected: browser checks and all five final reviews remain mandatory.');
 // Never expose the skip decision until every preview validation above succeeds.
 if(env.GITHUB_OUTPUT)appendFileSync(env.GITHUB_OUTPUT,`personal_preview=${personalPreview}\n`);
 return {personalPreview};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{checkReleaseMode();}catch(error){console.error(`Release mode blocked: ${error.message}`);process.exitCode=1;}
}
