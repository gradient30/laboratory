import {validateInheritedSafety} from './inherited-safety-evidence.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const releaseGates=['specification','facts','quality','regression','user-feedback'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Excludes evidence itself to avoid a self-referential hash; includes deployable code,
// validators, test configuration and CI. A later source change invalidates all gates.
export function releaseSourceFingerprint(root='.'){
 const paths=[];
 const walk=relative=>{const full=path.join(root,relative),stat=fs.lstatSync(full);if(stat.isSymbolicLink())throw Error('Release input cannot be symlink: '+relative);if(stat.isDirectory())for(const name of fs.readdirSync(full).sort())walk(path.posix.join(relative,name));else paths.push(relative);};
 for(const directory of ['dist','worker','migrations','scripts','tests','.github'])walk(directory);
 for(const file of ['package.json','package-lock.json','playwright.config.mjs','wrangler.jsonc','test.mjs','verify-package.mjs','source-manifest.json','deployment-manifest.json'])walk(file);
 return sha(JSON.stringify(paths.sort().map(file=>[file,sha(fs.readFileSync(path.join(root,file)))])));
}
export const gateChecks={
 specification:['365-topics-four-independent-ages','original-records-preserved','authentication-child-isolation'],
 facts:['scientific-claims-sources','safety-and-age-fit'],
 quality:['materials-actions-diagrams-consistent','desktop-mobile-usability'],
 regression:['candidate-tests','record-and-account-regressions'],
 'user-feedback':['user-requirements-traced','feedback-dispositions-verified']
};
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const safePath=p=>typeof p==='string'&&/^(docs|verification|reviewed-protocols)\/[a-zA-Z0-9_-][a-zA-Z0-9._/-]*$/.test(p)&&p.split('/').every(part=>part&&part!=='.'&&part!=='..')&&p!=='docs/age-protocol-release.json';
// Only explicit local files are read. Never follow report references recursively.
export function readReleaseEvidenceFile(file,root='.'){
 if(!safePath(file))throw Error('Unsafe release evidence path');
 let current=root;
 for(const part of file.split('/')){current=path.join(current,part);if(fs.lstatSync(current).isSymbolicLink())throw Error('Evidence symlink forbidden');}
 if(!fs.statSync(current).isFile())throw Error('Evidence must be a regular file');
 return fs.readFileSync(current);
}
function validateAttestation(a,r,context){
 const {dataSha256,sourceSha256,readReport}=context;
 if(a?.schemaVersion!==1||a.gate!==r.gate||a.status!=='passed'||a.dataSha256!==dataSha256||a.sourceSha256!==sourceSha256||a.reviewer!==r.reviewer)return false;
 if(a.scope?.candidate!=='whole-release'||a.scope.activities!==365||a.scope.ageProtocols!==1460)return false;
 const inventory=a.evidence;
 if(!Array.isArray(inventory)||!inventory.length)return false;
 const ids=new Set(),paths=new Set(),verifiedReports=new Map();let previous='';
 const kinds=['review','test','visual','user-requirement','user-feedback','user-acceptance'];
 for(const e of inventory){
  if(!nonempty(e?.id)||ids.has(e.id)||!safePath(e.path)||e.path===r.report||paths.has(e.path)||e.path<=previous||!digest(e.sha256)||!kinds.includes(e.kind))return false;
  ids.add(e.id);paths.add(e.path);previous=e.path;
  const bytes=Buffer.from(readReport(e.path));
  if(sha(bytes)!==e.sha256)return false;
  verifiedReports.set(e.path,bytes);
 }
 const refs=v=>Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(id=>ids.has(id));
 const required=gateChecks[r.gate];
 if(!Array.isArray(a.checks)||a.checks.length!==required.length)return false;
 for(const id of required){const items=a.checks.filter(c=>c?.id===id);if(items.length!==1||items[0].status!=='passed'||!nonempty(items[0].finding)||!refs(items[0].evidenceIds))return false;}
 // Consume exactly the immutable byte copies whose hashes were checked above.
 const readVerified=p=>{if(!verifiedReports.has(p))throw Error('Unlisted supporting report');return verifiedReports.get(p);};
 if(r.gate==='facts'&&!validateInheritedSafety(a,{...context,readReport:readVerified}))return false;
 if(r.gate==='user-feedback'){
  if(!['requirements-and-feedback-review','real-user-acceptance'].includes(a.feedbackMode)||!Array.isArray(a.feedback)||!a.feedback.length)return false;
  const keys=new Set();
  for(const f of a.feedback){
   const source=inventory.find(e=>e.id===f?.sourceEvidenceId);
   if(!nonempty(f?.id)||keys.has(f.id)||!source||!['user-requirement','user-feedback','user-acceptance'].includes(source.kind)||!nonempty(f.sourceReference)||!nonempty(f.exactQuote)||!['addressed','not-applicable'].includes(f.disposition)||!nonempty(f.rationale)||!refs(f.verificationEvidenceIds))return false;
   if(!readVerified(source.path).toString().includes(f.exactQuote))return false;
   if(f.verificationEvidenceIds.some(id=>!['review','test','visual'].includes(inventory.find(e=>e.id===id).kind)))return false;
   keys.add(f.id);
  }
  if(a.feedbackMode==='real-user-acceptance'&&!a.feedback.some(f=>inventory.find(e=>e.id===f.sourceEvidenceId).kind==='user-acceptance'))return false;
 }
 return true;
}
export function validateReleaseEvidence(evidence,context){
 const {dataSha256,sourceSha256,readReport}=context;
 const errors=[];if(evidence?.schemaVersion!==3)errors.push('Named five-gate evidence schemaVersion3 required');
 const reviews=Array.isArray(evidence?.reviews)?evidence.reviews:[];
 for(const gate of releaseGates){
  const entries=reviews.filter(r=>r?.gate===gate),r=entries[0];let valid=entries.length===1&&r.status==='passed'&&r.dataSha256===dataSha256&&r.sourceSha256===sourceSha256&&nonempty(r.reviewer)&&safePath(r.report)&&digest(r.reportSha256);
  if(valid)try{const bytes=readReport(r.report);valid=sha(bytes)===r.reportSha256&&validateAttestation(JSON.parse(bytes.toString()),r,context);}catch{valid=false;}
  if(!valid)errors.push(`Final ${gate} review: missing, duplicated, pending, partial or stale source/report/supporting evidence`);
 }
 if(reviews.some(r=>!releaseGates.includes(r?.gate)))errors.push('Unknown final review gate');
 return errors;
}

// A clean empty manifest describes planned work, not a passed review. A malformed
// manifest, any evidence offered for review, or a strict release request is evaluated
// fail-closed. Eligibility here only permits the remaining standard release checks.
export function classifyStandardReleaseEvidence(evidence,context,{allowUnreviewed=false}={}){
 const fields=['schemaVersion','scope','reviews','note','requiredGates'];
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence)||Object.keys(evidence).some(key=>!fields.includes(key))||
    evidence.schemaVersion!==3||!Array.isArray(evidence.reviews)||
    !Array.isArray(evidence.requiredGates)||evidence.requiredGates.length!==releaseGates.length||
    !releaseGates.every((gate,i)=>evidence.requiredGates[i]===gate)||
    ['scope','note'].some(key=>Object.hasOwn(evidence,key)&&!nonempty(evidence[key]))){
  return {disposition:'invalid',errors:['Invalid final-review manifest: expected schemaVersion 3, the exact five required gates and a reviews array']};
 }
 if(allowUnreviewed&&evidence.reviews.length===0)return {disposition:'unreviewed',errors:[]};
 const errors=validateReleaseEvidence(evidence,context);
 return {disposition:errors.length?'invalid':'eligible',errors};
}
