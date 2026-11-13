import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Evidence consistency only. No language classifier, scientific certification,
// signature requirement, physical-trial requirement or new top-level gate.
export const safetyAges=Object.freeze(['4-6','7-9','10-12','13-16']);
export const safetyDays=Object.freeze(Array.from({length:365},(_,i)=>i+1));
export const timeWindowKeys=['observationStart','observationInterval','perStepCap','totalActivityCap','sampleRetentionCap','cleanupDeadline','adultSupervisionSchedule','abortConditions'];
export const safetyHash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const empty=a=>Array.isArray(a)&&a.length===0;
const key=r=>`${r.day}/${r.age}`;
const kinds=['prohibition','numeric_limit','adult_only','material_scope','real_world_use','privacy','cleanup','storage','other'];
const statuses=['retained_literal_reviewed','retained_semantic_reviewed','risk_removed_independently_approved','changed_boundary_independently_approved'];
const pair=r=>Number.isInteger(r?.day)&&r.day>=1&&r.day<=365&&safetyAges.includes(r.age);
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
function pointer(object,p){
 if(typeof p!=='string'||!p.startsWith('/')||p==='/'||/~(?![01])/u.test(p))return undefined;
 for(const token of p.slice(1).split('/')){const field=token.replace(/~1/g,'/').replace(/~0/g,'~');if(!object||!Object.hasOwn(object,field))return undefined;object=object[field];}
 return object;
}
function quotes(refs,object,prefix){
 return Array.isArray(refs)&&refs.length>0&&refs.every(r=>nonempty(r?.quote)&&(!prefix||r.pointer===prefix||r.pointer?.startsWith(prefix+'/'))&&typeof pointer(object,r.pointer)==='string'&&pointer(object,r.pointer).includes(r.quote));
}
// A reviewer may supply additional selected text only in these three arrays.
// Raw/legacy/other-age object trees cannot become visible evidence namespaces.
const visibleScalars=['duration','wait','guideTime','safety'];
const visibleArrays=['otherText','diagramText','supplementaryText'];
const visibleStepFields=['title','detail','action','caption','adultNote'];
const exactKeys=(object,keys)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).length===keys.length&&keys.every(k=>Object.hasOwn(object,k));
function visibleShape(v){
 return exactKeys(v,[...visibleScalars,'steps',...visibleArrays])&&visibleScalars.every(k=>typeof v[k]==='string')&&Array.isArray(v.steps)&&v.steps.every(s=>exactKeys(s,visibleStepFields)&&visibleStepFields.every(k=>typeof s[k]==='string'))&&visibleArrays.every(k=>Array.isArray(v[k])&&v[k].every(t=>typeof t==='string'));
}
const visibleLeaf=/^\/(?:duration|wait|guideTime|safety)$|^\/steps\/(?:0|[1-9][0-9]*)\/(?:title|detail|action|caption|adultNote)$|^\/(?:otherText|diagramText|supplementaryText)\/(?:0|[1-9][0-9]*)$/;
function visibleQuotes(refs,visible,prefix){
 return Array.isArray(refs)&&refs.every(r=>typeof r?.pointer==='string'&&visibleLeaf.test(r.pointer))&&quotes(refs,visible,prefix);
}
function boundary(b,kind){
 const fields=kind==='numeric_limit'?['object','value','unit','direction','scope','anchor','tolerance','unknownStopRule']:kind==='adult_only'?['preparation','operation','cleanup','supervision']:[];
 return fields.every(f=>nonempty(b?.[f]))&&(kind!=='numeric_limit'||['<=','>=','exact','range'].includes(b.direction));
}
// Read only fixed candidate inputs, never an evidence-supplied source path.
export function inheritedSafetyCandidateContext(data,resolveAgeProtocol,root='.'){
 const read=file=>{let current=root;for(const part of file.split('/')){current=path.join(current,part);if(fs.lstatSync(current).isSymbolicLink())throw Error('Candidate symlink forbidden');}return fs.readFileSync(current);};
 return {data,resolveAgeProtocol,rendererSha256:safetyHash(read('dist/diagrams.js')),appSha256:safetyHash(read('dist/app.js')),generatedAssetManifestSha256:safetyHash(read('deployment-manifest.json'))};
}
// Core fields actually used by renderExperiment/renderStep. The full selected
// text, diagrams and auxiliary surfaces still need a candidate-bound mapping
// review. This function intentionally does not call a snapshot a DOM capture.
export function selectedSafetyCore(activity,age,resolveAgeProtocol){
 const r=resolveAgeProtocol(activity,age),g=r.ageGuides[age];
 return {duration:r.duration,wait:r.wait||'',guideTime:g.time||'',safety:r.safety,steps:r.steps.map((s,i)=>({title:s.title,detail:s.detail,action:g.steps[i].action,caption:g.steps[i].caption,adultNote:g.steps[i].adultNote||''}))};
}
export function validateInheritedSafety(a,context){
 const s=a.inheritedSafety,c=context.safetyCandidate;
 if(!s||!c||typeof c.resolveAgeProtocol!=='function'||s.schemaVersion!==1||s.auditType!=='inherited-safety-and-time'||s.status!=='complete'||!nonempty(s.reviewer)||!nonempty(s.reviewedAt)||!Number.isFinite(Date.parse(s.reviewedAt)))return false;
 const bindings={dataSha256:context.dataSha256,sourceSha256:context.sourceSha256,rendererSha256:c.rendererSha256,appSha256:c.appSha256,generatedAssetManifestSha256:c.generatedAssetManifestSha256};
 if(Object.entries(bindings).some(([name,value])=>!(/^[a-f0-9]{64}$/).test(value)||s[name]!==value))return false;
 if(!same(s.expectedScope?.days,safetyDays)||!same(s.expectedScope?.ageBands,safetyAges)||s.expectedScope?.expectedPairs!==1460||!empty(s.openFindings)||!empty(s.remainingScope))return false;
 const inventory=new Map(a.evidence.map(e=>[e.id,e]));
 const refs=ids=>unique(ids)&&ids.length>0&&ids.every(id=>inventory.has(id));
 const reviewRefs=ids=>refs(ids)&&ids.every(id=>inventory.get(id).kind==='review');
 const approval=x=>x?.status==='approved'&&x.reviewMode==='independent-source-review'&&nonempty(x.reviewer)&&nonempty(x.rationale)&&x.dataSha256===context.dataSha256&&x.sourceSha256===context.sourceSha256&&reviewRefs(x.evidenceIds);
 const mapping=s.renderingReview;
 if(mapping?.fullSelectedSurfaceMappingReviewed!==true||!approval(mapping))return false;
 const snapshotEntry=inventory.get(s.visibleSnapshotEvidenceId);
 if(snapshotEntry?.kind!=='review')return false;
 const snapshot=JSON.parse(context.readReport(snapshotEntry.path).toString());
 if(snapshot?.schemaVersion!==1||snapshot.selection!=='rendered-selected-age-only'||Object.entries(bindings).some(([k,v])=>snapshot[k]!==v))return false;
 if(!Array.isArray(snapshot.coverage)||snapshot.coverage.length!==1460||!snapshot.coverage.every(pair)||new Set(snapshot.coverage.map(key)).size!==1460)return false;
 const visibleRows=new Map(snapshot.coverage.map(r=>[key(r),r.visible]));
 const activities=c.data?.experiments;
 if(!Array.isArray(activities)||activities.length!==365||new Set(activities.map(e=>e.id)).size!==365||activities.some(e=>!safetyDays.includes(e.id)))return false;
 const originals=new Map(),sourceActivities=new Map(activities.map(e=>[e.id,e]));
 for(const e of activities){const original={...e};delete original.ageProtocols;originals.set(e.id,original);}
 if(!Array.isArray(s.days)||s.days.length!==365||new Set(s.days.map(r=>r.day)).size!==365)return false;
 const dayReviews=new Map();
 for(const day of s.days){
  const original=originals.get(day.day);
  if(!original||day.originalSha256!==safetyHash(original)||day.fullOriginalRead!==true||!nonempty(day.reviewer)||day.extraction?.method!=='full-original-review'||!reviewRefs(day.extraction.evidenceIds)||!Array.isArray(day.obligations)||!Array.isArray(day.exclusions))return false;
  if(day.obligations.length===0&&!nonempty(day.noConfirmedSafetyObligationsReason))return false;
  const ids=new Set();
  for(const o of day.obligations){
   if(!nonempty(o?.id)||ids.has(o.id)||!kinds.includes(o.kind)||!unique(o.applicableAges)||o.applicableAges.length===0||o.applicableAges.some(age=>!safetyAges.includes(age))||!quotes(o.originalEvidence,original)||!nonempty(o.classificationRationale)||!boundary(o.boundary,o.kind))return false;
   ids.add(o.id);
  }
  const exclusions=new Set();
  for(const e of day.exclusions){
   if(!nonempty(e?.id)||exclusions.has(e.id)||ids.has(e.id)||!quotes(e.originalEvidence,original)||!['not-safety','duplicate'].includes(e.disposition)||!nonempty(e.rationale)||!reviewRefs(e.evidenceIds))return false;
   if(e.disposition==='duplicate'&&!ids.has(e.duplicateOf))return false;
   exclusions.add(e.id);
  }
  dayReviews.set(day.day,day);
 }
 if(!Array.isArray(s.coverage)||s.coverage.length!==1460||!s.coverage.every(pair)||new Set(s.coverage.map(key)).size!==1460)return false;
 for(const r of s.coverage){
  const day=dayReviews.get(r.day),activity=sourceActivities.get(r.day),protocol=activity.ageProtocols?.[r.age],visible=visibleRows.get(key(r));
  if(!protocol||!visible||r.status!=='reviewed'||r.reviewMode!=='full-original-and-selected-visible'||!nonempty(r.reviewer)||r.sourceSha256!==context.sourceSha256||r.originalSha256!==day.originalSha256||r.protocolSha256!==safetyHash(protocol)||r.selectedVisibleSha256!==safetyHash(visible))return false;
  if(r.fullOriginalRead!==true||r.fullSelectedVisibleTextRead!==true||r.contradictionScanComplete!==true||!empty(r.remainingScope)||!reviewRefs(r.evidenceIds))return false;
  const core=selectedSafetyCore(activity,r.age,c.resolveAgeProtocol);
  if(!visibleShape(visible)||Object.keys(core).some(k=>!same(core[k],visible[k])))return false;
  const applicable=day.obligations.filter(o=>o.applicableAges.includes(r.age));
  if(!Array.isArray(r.judgments)||r.judgments.length!==applicable.length||new Set(r.judgments.map(j=>j.obligationId)).size!==applicable.length)return false;
  for(const o of applicable){
   const j=r.judgments.find(j=>j.obligationId===o.id);
   if(!j||!statuses.includes(j.status)||!nonempty(j.rationale)||!visibleQuotes(j.selectedVisibleEvidence,visible)||!reviewRefs(j.evidenceIds))return false;
   if(j.status==='retained_literal_reviewed'&&!o.originalEvidence.every(q=>j.selectedVisibleEvidence.some(v=>v.quote.includes(q.quote))))return false;
   if(j.status.startsWith('retained_')&&['numeric_limit','adult_only'].includes(o.kind)&&!same(j.boundary,o.boundary))return false;
   if(j.status==='changed_boundary_independently_approved'&&(!approval(j.approval)||!boundary(j.boundary,o.kind)))return false;
   if(j.status==='risk_removed_independently_approved'&&(!approval(j.approval)||!nonempty(j.removedRiskObject)))return false;
  }
  const t=r.time,legacyWait=activity.wait||'';
  if(t?.durationSource!=='ageProtocol.guide.time'||t.legacyWait!==legacyWait||t.renderedWait!==core.wait||core.duration!==protocol.guide?.time||core.guideTime!==protocol.guide?.time||!empty(t.conflictingSources)||t.requiredWindowsComplete!==true||t.internalConsistencyReviewed!==true||t.supplementarySurfacesReviewed!==true||!reviewRefs(t.evidenceIds))return false;
  // The original wait remains archived; independent protocols get their time
  // exclusively from guide.time, steps and safety, never a legacy wait pill.
  if(core.wait||t.legacyWaitDisposition!==(legacyWait?'suppressed':'absent'))return false;
  for(const [name,prefix] of Object.entries({guideTime:'/guideTime',steps:'/steps',safety:'/safety',wait:'/wait'})){
   const source=t.sources?.[name];
   if(!nonempty(source?.rationale))return false;
   if(name==='wait'&&!core.wait){if(source.status!=='not-applicable'||!empty(source.selectedVisibleEvidence))return false;}
   else if(source.status!=='reviewed'||!visibleQuotes(source.selectedVisibleEvidence,visible,prefix))return false;
  }
  for(const name of timeWindowKeys){
   const w=t.windows?.[name];if(!nonempty(w?.rationale))return false;
   if(w.status==='not-applicable'){if(!empty(w.selectedVisibleEvidence))return false;}
   else if(w.status!=='reviewed'||!['object','anchor','value','scope'].every(k=>nonempty(w[k]))||!visibleQuotes(w.selectedVisibleEvidence,visible))return false;
  }
 }
 return true;
}
