// Synthetic structure fixtures only. Never emit these as approval reports.
import {releaseGates,gateChecks} from './release-evidence.mjs';
import {safetyHash as sha,safetyAges,safetyDays,timeWindowKeys,selectedSafetyCore} from './inherited-safety-evidence.mjs';
export function fixture(){
 const files=new Map([['docs/source.txt','User requires preservation of original records.'],['verification/result.txt','Fixture verification result']]);
 const context={dataSha256:'a'.repeat(64),sourceSha256:'b'.repeat(64),readReport:p=>{if(!files.has(p))throw Error('Missing');return files.get(p);}};
 const evidence={schemaVersion:3,reviews:[]};const reports=new Map();
 for(const gate of releaseGates){
  const report=`docs/final-${gate}.json`,reviewer='Fixture reviewer';
  const a={schemaVersion:1,gate,status:'passed',dataSha256:context.dataSha256,sourceSha256:context.sourceSha256,reviewer,scope:{candidate:'whole-release',activities:365,ageProtocols:1460},evidence:[{id:'source',path:'docs/source.txt',sha256:sha(files.get('docs/source.txt')),kind:'user-requirement'},{id:'test',path:'verification/result.txt',sha256:sha(files.get('verification/result.txt')),kind:'test'}],checks:gateChecks[gate].map(id=>({id,status:'passed',finding:'Fixture finding',evidenceIds:['test']}))};
  if(gate==='user-feedback')Object.assign(a,{feedbackMode:'requirements-and-feedback-review',feedback:[{id:'records',sourceEvidenceId:'source',sourceReference:'conversation fixture message 1',exactQuote:files.get('docs/source.txt'),disposition:'addressed',rationale:'Record regression checked',verificationEvidenceIds:['test']}]});
  reports.set(gate,a);evidence.reviews.push({gate,status:'passed',dataSha256:context.dataSha256,sourceSha256:context.sourceSha256,reviewer,report});
 }
 addSafetyFixture(reports.get('facts'),context,files);
 const seal=()=>{for(const r of evidence.reviews){const bytes=JSON.stringify(reports.get(r.gate));files.set(r.report,bytes);r.reportSha256=sha(bytes);}};seal();
 return {files,context,evidence,reports,seal};
}
function addSafetyFixture(a,context,files){
 const protocol={guide:{time:'10 minutes including cleanup'},safety:'Do not taste. Adult disposes of samples within 10 minutes.',steps:[{title:'Observe',detail:'Observe for 5 minutes.',action:'Observe for 5 minutes.',caption:'Look only.',adultNote:'Adult remains present.'}]};
 const data={experiments:safetyDays.map(day=>({id:day,wait:'3 days',safety:'Do not taste.',inquiry:{limits:'This comparison is not a universal claim.'},ageProtocols:Object.fromEntries(safetyAges.map(age=>[age,structuredClone(protocol)]))}))};
 context.safetyCandidate={data,rendererSha256:'c'.repeat(64),appSha256:'d'.repeat(64),generatedAssetManifestSha256:'e'.repeat(64),resolveAgeProtocol:(e,age)=>({...e,...e.ageProtocols[age],duration:e.ageProtocols[age].guide.time,wait:null,ageGuides:{[age]:{...e.ageProtocols[age].guide,steps:e.ageProtocols[age].steps}},steps:e.ageProtocols[age].steps.map(s=>({...s}))})};
 const bindings={dataSha256:context.dataSha256,sourceSha256:context.sourceSha256,...Object.fromEntries(['rendererSha256','appSha256','generatedAssetManifestSha256'].map(k=>[k,context.safetyCandidate[k]]))};
 const evidenceIds=['safety-review'];
 const approval={status:'approved',reviewMode:'independent-source-review',reviewer:'Synthetic independent reviewer',rationale:'Synthetic review evidence, not an actual approval.',dataSha256:context.dataSha256,sourceSha256:context.sourceSha256,evidenceIds};
 const quote=(pointer,quote)=>({pointer,quote});
 const source=(pointer,text)=>({status:'reviewed',rationale:'Synthetic exact rendered source.',selectedVisibleEvidence:[quote(pointer,text)]});
 const s={schemaVersion:1,auditType:'inherited-safety-and-time',status:'complete',reviewer:'Synthetic reviewer',reviewedAt:'2026-11-06T00:00:00Z',...bindings,expectedScope:{days:[...safetyDays],ageBands:[...safetyAges],expectedPairs:1460},openFindings:[],remainingScope:[],visibleSnapshotEvidenceId:'selected-visible',renderingReview:{...approval,fullSelectedSurfaceMappingReviewed:true},days:[],coverage:[]};
 const snapshot={schemaVersion:1,selection:'rendered-selected-age-only',...bindings,coverage:[]};
 for(const e of data.experiments){
  const original={...e};delete original.ageProtocols;const originalSha256=sha(original);
  s.days.push({day:e.id,originalSha256,fullOriginalRead:true,reviewer:'Synthetic reviewer',extraction:{method:'full-original-review',evidenceIds},obligations:[{id:'no-tasting',kind:'prohibition',applicableAges:[...safetyAges],originalEvidence:[quote('/safety','Do not taste.')],classificationRationale:'Synthetic explicit prohibition.'}],exclusions:[{id:'claim-limit',originalEvidence:[quote('/inquiry/limits','This comparison is not a universal claim.')],disposition:'not-safety',rationale:'Synthetic epistemic limit, not a safety obligation.',evidenceIds}]});
  for(const age of safetyAges){
   const visible={...selectedSafetyCore(e,age,context.safetyCandidate.resolveAgeProtocol),otherText:['Synthetic selected-age knowledge text.'],diagramText:['Look only.'],supplementaryText:[]};
   snapshot.coverage.push({day:e.id,age,visible});
   s.coverage.push({day:e.id,age,status:'reviewed',reviewMode:'full-original-and-selected-visible',reviewer:'Synthetic reviewer',sourceSha256:context.sourceSha256,originalSha256,protocolSha256:sha(e.ageProtocols[age]),selectedVisibleSha256:sha(visible),fullOriginalRead:true,fullSelectedVisibleTextRead:true,contradictionScanComplete:true,remainingScope:[],evidenceIds,judgments:[{obligationId:'no-tasting',status:'retained_literal_reviewed',rationale:'Synthetic exact visible quote.',selectedVisibleEvidence:[quote('/safety','Do not taste.')],evidenceIds}],time:{durationSource:'ageProtocol.guide.time',legacyWait:'3 days',renderedWait:'',legacyWaitDisposition:'suppressed',conflictingSources:[],requiredWindowsComplete:true,internalConsistencyReviewed:true,supplementarySurfacesReviewed:true,evidenceIds,sources:{guideTime:source('/guideTime',visible.guideTime),steps:source('/steps/0/action','Observe for 5 minutes.'),safety:source('/safety',visible.safety),wait:{status:'not-applicable',rationale:'Legacy wait is suppressed; required observation and cleanup remain in current text.',selectedVisibleEvidence:[]}},windows:Object.fromEntries(timeWindowKeys.map(name=>[name,name==='cleanupDeadline'?{...source('/safety','Adult disposes of samples within 10 minutes.'),object:'sample',anchor:'activity start',value:'10 minutes maximum',scope:'whole activity including cleanup'}:{status:'not-applicable',rationale:'Synthetic window not applicable; never a real finding.',selectedVisibleEvidence:[]}]))}});
  }
 }
 files.set('docs/safety-review.txt','Synthetic full-source, mapping and time review. Not real release evidence.');
 files.set('verification/selected-visible.json',JSON.stringify(snapshot));
 for(const [id,p] of [['safety-review','docs/safety-review.txt'],['selected-visible','verification/selected-visible.json']])a.evidence.push({id,path:p,sha256:sha(files.get(p)),kind:'review'});
 a.evidence.sort((a,b)=>a.path.localeCompare(b.path));
 a.checks.find(c=>c.id==='safety-and-age-fit').evidenceIds=[...evidenceIds,'selected-visible'];
 a.inheritedSafety=s;
}
