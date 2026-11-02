/** Local reviewed-input integration only. No network, upload, git or publication actions. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {checkAgeProtocols,canonical} from './check-age-protocols.mjs';
import {protocolAges} from '../dist/diagrams.js';

export function mergeReviewedProtocols(data,identities,inputs){
 assert.ok(Array.isArray(inputs)&&inputs.length>0,'At least one reviewed standalone activity is required');
 const output=structuredClone(data),seen=new Set();
 for(const incoming of inputs){
  assert.ok(Number.isInteger(incoming?.activityId)&&!seen.has(incoming.activityId),'Duplicate or invalid incoming activity ID');seen.add(incoming.activityId);
  const old=output.experiments.find(e=>e.id===incoming.activityId);
  assert.ok(old&&old.contentKey===identities[old.id],'Activity must retain its frozen identity');
  assert.equal(incoming.activityTitle,old.title,'Theme title/identity cannot be replaced through protocol integration');
  assert.ok(incoming.ageProtocols&&typeof incoming.ageProtocols==='object'&&!Array.isArray(incoming.ageProtocols)&&Object.keys(incoming.ageProtocols).length===4&&protocolAges.every(age=>Object.hasOwn(incoming.ageProtocols,age)),'Incoming activity must contain all four explicit protocols');
  if(incoming.contentKey!==undefined)assert.equal(incoming.contentKey,old.contentKey);
  for(const age of protocolAges){const before=old.ageProtocols?.[age],after=incoming.ageProtocols?.[age];
   if(before&&JSON.stringify(before)!==JSON.stringify(after))assert.ok(Number.isInteger(after?.version)&&after.version>before.version,`Changed ${old.id}/${age} must increment protocol version; never reinterpret saved records`);
  }
  old.ageProtocols=structuredClone(incoming.ageProtocols);
 }
 const result=checkAgeProtocols(output,identities,{requireComplete:false});assert.equal(result.passed,true,result.errors.join('\n'));
 return {data:output,integratedActivityIds:[...seen],coverage:result.explicitValidProtocols};
}

export function readReviewedInputs(manifestPath){
 const review=JSON.parse(fs.readFileSync(manifestPath,'utf8')),root=path.dirname(path.resolve(manifestPath));
 assert.ok(Array.isArray(review.activities)&&review.activities.length>0,'Review manifest activities required');
 return review.activities.map(item=>{
  assert.equal(item.reviewStatus,'static-reviewed','Author self-check or pending review is not eligible for integration');
  assert.ok(typeof item.file==='string'&&typeof item.report==='string','Local input and project review report required');
  assert.ok(/^[a-f0-9]{64}$/.test(item.sha256),'Exact reviewed source SHA256 required');
  const bytes=fs.readFileSync(path.resolve(root,item.file));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,'Source changed after review');
  assert.ok(/^[a-f0-9]{64}$/.test(item.reportSha256),'Exact project review report SHA256 required');
  const report=fs.readFileSync(path.resolve(root,item.report));assert.equal(createHash('sha256').update(report).digest('hex'),item.reportSha256,'Project review report changed after manifest approval');
  const input=JSON.parse(bytes);assert.equal(input.activityId,item.activityId,'Reviewed ID must match input');
  const materials=protocolAges.map(age=>canonical(input.ageProtocols?.[age]?.materials));
  if(new Set(materials).size<4){assert.ok(typeof item.sharedMaterialsRationale==='string'&&item.sharedMaterialsRationale.trim().length>=40,'Shared materials require an independent substantive age-differentiation rationale');assert.ok(report.toString().includes(item.sharedMaterialsRationale),'Rationale must appear in the exact independent review report');}
  return input;
 });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const manifest=process.argv.slice(2).find(a=>!a.startsWith('--'));assert.ok(manifest,'Pass a local review manifest; --write is required to save changes');
 const inputPath='dist/data.json',original=fs.readFileSync(inputPath,'utf8'),result=mergeReviewedProtocols(JSON.parse(original),JSON.parse(fs.readFileSync('scripts/activity-identities.json','utf8')),readReviewedInputs(manifest));
 if(process.argv.includes('--write')){assert.equal(fs.readFileSync(inputPath,'utf8'),original,'Candidate changed during integration');fs.writeFileSync(inputPath,JSON.stringify(result.data,null,2)+'\n');}
 console.log(JSON.stringify({saved:process.argv.includes('--write'),activityIds:result.integratedActivityIds,explicitValidProtocols:result.coverage,publicationReady:false,note:'Static-reviewed content integration only. Browser/full-year/five-round release gates remain independent.'},null,2));
}
