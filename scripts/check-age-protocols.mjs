import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {releaseSourceFingerprint,validateReleaseEvidence} from './release-evidence.mjs';
import {protocolAges,validateAgeProtocol} from '../dist/diagrams.js';
export const canonical=value=>JSON.stringify(value,function(_key,v){return v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):typeof v==='string'?v.trim().replace(/\s+/g,' '):v;});
export function checkAgeProtocols(data,identities,{requireComplete=true}={}){
 const errors=[],sharedMaterialActivityIds=[],missing=[],seen=new Set();let protocols=0;
 const rows=Array.isArray(data?.experiments)?data.experiments:[];
 if(rows.length!==365)errors.push('Exactly 365 frozen activities required');
 if(!identities||Object.keys(identities).length!==365||Array.from({length:365},(_,i)=>i+1).some(id=>typeof identities[id]!=='string')||new Set(Object.values(identities)).size!==365)errors.push('Independent frozen identity registry is incomplete');
 for(const e of rows){
  if(!Number.isInteger(e?.id)||e.id<1||e.id>365||seen.has(e.id))errors.push('Invalid/duplicate ID '+e?.id);seen.add(e?.id);
  if(!e?.contentKey||identities?.[e.id]!==e.contentKey)errors.push('Frozen identity changed: '+e?.id);
  if(!e?.ageProtocols){missing.push(e?.id);continue;}
  if(Object.keys(e.ageProtocols).length!==4||protocolAges.some(age=>!Object.hasOwn(e.ageProtocols,age)))errors.push('Four age keys required: '+e.id);
  const values={materials:[],actions:[],knowledge:[],artwork:[]};
  for(const age of protocolAges){const p=e.ageProtocols[age],problems=validateAgeProtocol(p);for(const problem of problems)errors.push(`${e.id}/${age}: ${problem}`);if(problems.length)continue;protocols++;
   values.materials.push(canonical(p.materials));values.actions.push(canonical(p.steps.map(s=>s.action)));values.knowledge.push(canonical(p.knowledge));values.artwork.push(canonical(p.diagrams.map(s=>s.elements)));
  }
  for(const [field,items] of Object.entries(values))if(items.length===4&&new Set(items).size!==4){if(field==='materials')sharedMaterialActivityIds.push(e.id);else errors.push(`${e.id}: exact duplicate ${field} across ages`);}
 }
 if(requireComplete&&(missing.length||protocols!==1460))errors.push(`Incomplete independent protocols: ${protocols}/1460; legacy activities: ${missing.length}`);
 return {passed:errors.length===0,requireComplete,activities:rows.length,explicitValidProtocols:protocols,sharedMaterialActivityIds,missingActivityIds:missing,errors,scope:'Structural/identity/exact-duplicate checks only; not scientific, safety, age-fit, visual or browser review.',productionReady:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const raw=fs.readFileSync('dist/data.json','utf8'),requireComplete=!process.argv.includes('--allow-incomplete');
 const result=checkAgeProtocols(JSON.parse(raw),JSON.parse(fs.readFileSync('scripts/activity-identities.json','utf8')),{requireComplete});
 if(requireComplete){
  const hash=createHash('sha256').update(raw).digest('hex');let evidence;try{evidence=JSON.parse(fs.readFileSync('docs/age-protocol-release.json','utf8'))}catch{evidence={};}
  const sourceSha256=releaseSourceFingerprint();
  result.errors.push(...validateReleaseEvidence(evidence,{dataSha256:hash,sourceSha256,readReport:file=>fs.readFileSync(file)}));
  result.sourceSha256=sourceSha256;
  result.passed=result.errors.length===0;result.dataSha256=hash;
 }
 console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
}
