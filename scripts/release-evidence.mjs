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
 for(const file of ['package.json','package-lock.json','playwright.config.mjs','wrangler.jsonc','test.mjs','verify-package.mjs','source-manifest.json'])walk(file);
 return sha(JSON.stringify(paths.sort().map(file=>[file,sha(fs.readFileSync(path.join(root,file)))])));
}
export function validateReleaseEvidence(evidence,{dataSha256,sourceSha256,readReport}){
 const errors=[];if(evidence?.schemaVersion!==2)errors.push('Named five-gate evidence schemaVersion2 required');
 const reviews=Array.isArray(evidence?.reviews)?evidence.reviews:[];
 for(const gate of releaseGates){
  const entries=reviews.filter(r=>r?.gate===gate),r=entries[0];let valid=entries.length===1&&r.status==='passed'&&r.dataSha256===dataSha256&&r.sourceSha256===sourceSha256&&typeof r.reviewer==='string'&&r.reviewer.trim().length>0&&typeof r.report==='string'&&/^docs\/[a-zA-Z0-9._/-]+$/.test(r.report)&&!r.report.includes('..')&&/^[a-f0-9]{64}$/.test(r.reportSha256||'');
  if(valid)try{valid=sha(readReport(r.report))===r.reportSha256;}catch{valid=false;}
  if(!valid)errors.push(`Final ${gate} review: missing, duplicated, pending or stale source/report evidence`);
 }
 if(reviews.some(r=>!releaseGates.includes(r?.gate)))errors.push('Unknown final review gate');
 return errors;
}
