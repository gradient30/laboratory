import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './release-evidence-fixture.mjs';
import {releaseGates,validateReleaseEvidence} from './release-evidence.mjs';
import {safetyHash,timeWindowKeys} from './inherited-safety-evidence.mjs';
const safety=f=>f.reports.get('facts').inheritedSafety;
const failed=f=>{f.seal();assert.ok(validateReleaseEvidence(f.evidence,f.context).some(e=>e.includes('Final facts review')));};
const passed=f=>{f.seal();assert.deepEqual(validateReleaseEvidence(f.evidence,f.context),[]);};
const reviewApproval=f=>({...safety(f).renderingReview});
function snapshotChange(f,change){
 const a=f.reports.get('facts'),entry=a.evidence.find(e=>e.id==='selected-visible'),snap=JSON.parse(f.files.get(entry.path));change(snap);
 f.files.set(entry.path,JSON.stringify(snap));entry.sha256=safetyHash(f.files.get(entry.path));
 for(const r of safety(f).coverage){const visible=snap.coverage.find(x=>x.day===r.day&&x.age===r.age)?.visible;if(visible)r.selectedVisibleSha256=safetyHash(visible);}
}
test('five gates unchanged, actual final reviews stay empty and blocked',()=>{
 assert.deepEqual(releaseGates,['specification','facts','quality','regression','user-feedback']);
 const actual=JSON.parse(fs.readFileSync('docs/age-protocol-release.json'));assert.deepEqual(actual.reviews,[]);
 const f=fixture();assert.equal(validateReleaseEvidence(actual,f.context).length,5);
});
test('old facts report no longer passes without inherited safety and candidate context',()=>{
 for(const change of [f=>delete f.reports.get('facts').inheritedSafety,f=>delete f.context.safetyCandidate]){const f=fixture();change(f);failed(f);}
});
test('exact scope, whole original reads and 365 x 4 unique coverage are mandatory',()=>{
 const mutations=[
  s=>s.status='partial',s=>s.status='blocked',s=>s.expectedScope.days.pop(),s=>s.expectedScope.ageBands.reverse(),s=>s.expectedScope.expectedPairs=1200,
  s=>s.days.pop(),s=>s.days[1]=s.days[0],s=>s.days[0].fullOriginalRead=false,s=>s.days[0].extraction.method='keyword-scan',s=>s.days[0].reviewer='',
  s=>s.coverage.pop(),s=>s.coverage[1]=s.coverage[0],s=>s.coverage[0].day=366,s=>s.coverage[0].day='1',s=>s.coverage[0].age='all',s=>s.coverage[0].status='pending',s=>s.coverage[0].reviewMode='automated-hit',
  s=>s.coverage[0].fullOriginalRead=false,s=>s.coverage[0].fullSelectedVisibleTextRead=false,s=>s.coverage[0].contradictionScanComplete=false,s=>s.coverage[0].remainingScope=['cleanup not read'],s=>s.remainingScope=['last 65 days'],s=>s.openFindings=[{id:'not-fixed'}],
 ];
 for(const mutate of mutations){const f=fixture();mutate(safety(f));failed(f);}
});
test('source, renderer, app, asset, original, protocol and visible/report hashes bind current bytes',()=>{
 for(const mutate of [
  s=>s.dataSha256='f'.repeat(64),s=>s.sourceSha256='f'.repeat(64),s=>s.rendererSha256='f'.repeat(64),s=>s.appSha256='f'.repeat(64),s=>s.generatedAssetManifestSha256='f'.repeat(64),
  s=>s.days[0].originalSha256='f'.repeat(64),s=>s.coverage[0].originalSha256='f'.repeat(64),s=>s.coverage[0].protocolSha256='f'.repeat(64),s=>s.coverage[0].selectedVisibleSha256='f'.repeat(64),s=>s.coverage[0].sourceSha256='f'.repeat(64),
 ]){const f=fixture();mutate(safety(f));failed(f);}
 for(const mutate of [
  f=>f.context.safetyCandidate.data.experiments[0].safety='Changed original safety.',
  f=>f.context.safetyCandidate.data.experiments[0].ageProtocols['4-6'].safety='Changed protocol safety.',
  f=>f.files.set('docs/safety-review.txt','Changed after review.'),
  f=>f.files.set('verification/selected-visible.json','Changed snapshot.'),
 ]){const f=fixture();mutate(f);failed(f);}
 const f=fixture();safety(f).reviewer='Changed unsigned report'; // Rehashing supports cannot conceal a stale report hash.
 f.files.set('docs/final-facts.json',JSON.stringify(f.reports.get('facts')));assert.ok(validateReleaseEvidence(f.evidence,f.context).length);
});
test('unresolved, omitted, wrong-age and false literal obligations fail closed',()=>{
 for(const mutate of [
  s=>s.days[0].obligations[0].originalEvidence[0].quote='Absent original quotation',
  s=>s.days[0].obligations[0].applicableAges=['4-6','4-6'],s=>s.days[0].obligations[0].applicableAges=[],
  s=>s.coverage[0].judgments=[],s=>s.coverage[0].judgments.push(s.coverage[0].judgments[0]),
  s=>s.coverage[0].judgments[0].status='missing',s=>s.coverage[0].judgments[0].status='unresolved',s=>s.coverage[0].judgments[0].status='contradiction',
  s=>s.coverage[0].judgments[0].selectedVisibleEvidence=[{pointer:'/legacyAgeGuide/safety',quote:'Do not taste.'}],
  s=>s.coverage[0].judgments[0].selectedVisibleEvidence=[{pointer:'/safety',quote:'Invented evidence'}],
  s=>s.coverage[0].judgments[0].selectedVisibleEvidence=[{pointer:'/steps/0/action',quote:'Observe for 5 minutes.'}],
  s=>s.coverage[0].judgments[0].evidenceIds=['test'],
 ]){const f=fixture();mutate(safety(f));failed(f);}
});
test('evidence-backed semantic retention, removed risks and boundary changes can pass structurally',()=>{
 for(const status of ['retained_semantic_reviewed','risk_removed_independently_approved','changed_boundary_independently_approved']){
  const f=fixture(),j=safety(f).coverage[0].judgments[0];j.status=status;
  if(status.includes('independently')){j.approval=reviewApproval(f);j.removedRiskObject='Synthetic removed exposure';}
  passed(f);
 }
 for(const status of ['risk_removed_independently_approved','changed_boundary_independently_approved']){
  for(const mutate of [j=>delete j.approval,j=>j.approval.status='pending',j=>j.approval.sourceSha256='f'.repeat(64),j=>j.approval.evidenceIds=['test'],j=>j.approval.reviewMode='author-self-check']){
   const f=fixture(),j=safety(f).coverage[0].judgments[0];j.status=status;j.approval=reviewApproval(f);j.removedRiskObject='Synthetic exposure';mutate(j);failed(f);
  }
 }
});
test('non-safety exclusions and duplicate dispositions are allowed, not 38k new obligations',()=>{
 const f=fixture();passed(f);
 const d=safety(f).days[0];d.exclusions.push({id:'duplicate-source-path',originalEvidence:[{pointer:'/safety',quote:'Do not taste.'}],disposition:'duplicate',duplicateOf:'no-tasting',rationale:'Same exact obligation already covered.',evidenceIds:['safety-review']});passed(f);
 for(const mutate of [s=>s.days[0].exclusions[0].rationale='',s=>s.days[0].exclusions[0].disposition='auto-keyword-exclusion',s=>s.days[0].exclusions[0].evidenceIds=[],s=>s.days[0].exclusions[0].originalEvidence[0].quote='Absent',s=>{s.days[0].exclusions[0].disposition='duplicate';s.days[0].exclusions[0].duplicateOf='unknown';}]){const x=fixture();mutate(safety(x));failed(x);}
});
test('numeric limits and adult roles cannot be silently weakened under retained labels',()=>{
 const definitions={numeric_limit:{object:'sample',value:'10',unit:'minute',direction:'<=',scope:'total',anchor:'activity start',tolerance:'none',unknownStopRule:'Stop if elapsed time is unknown.'},adult_only:{preparation:'adult alone',operation:'adult alone',cleanup:'adult alone',supervision:'adult continuously present'}};
 for(const [kind,boundary] of Object.entries(definitions)){
  const f=fixture(),s=safety(f);s.days[0].obligations[0].kind=kind;s.days[0].obligations[0].boundary=boundary;
  for(const row of s.coverage.filter(r=>r.day===1))row.judgments[0].boundary=structuredClone(boundary);
  passed(f);const j=s.coverage[0].judgments[0];j.boundary[Object.keys(boundary)[0]]='Weakened';failed(f);
  j.status='changed_boundary_independently_approved';j.approval=reviewApproval(f);passed(f);
  delete j.boundary[Object.keys(boundary)[0]];failed(f);
 }
});
test('time source conflict, unknown windows and cleanup omissions block even with suppressed old wait',()=>{
 for(const mutate of [
  t=>t.durationSource='legacy.duration',t=>t.legacyWait='hidden',t=>t.renderedWait='3 days',t=>t.legacyWaitDisposition='reviewed-retained',
  t=>t.conflictingSources=['guide.time versus cleanup'],t=>t.requiredWindowsComplete=false,t=>t.internalConsistencyReviewed=false,t=>t.supplementarySurfacesReviewed=false,
  t=>delete t.sources,t=>t.sources.steps.status='not-applicable',t=>t.sources.safety.selectedVisibleEvidence=[{pointer:'/guideTime',quote:'10 minutes'}],
  t=>delete t.windows.cleanupDeadline,t=>t.windows.cleanupDeadline.status='unresolved',t=>delete t.windows.cleanupDeadline.anchor,t=>t.windows.observationStart.rationale='',
 ]){const f=fixture();mutate(safety(f).coverage[0].time);failed(f);}
 for(const name of timeWindowKeys){const f=fixture();delete safety(f).coverage[0].time.windows[name];failed(f);}
});
test('legacy wait cannot be hidden only in the report while the actual resolver still renders it',()=>{
 const f=fixture(),old=f.context.safetyCandidate.resolveAgeProtocol;
 f.context.safetyCandidate.resolveAgeProtocol=(e,age)=>({...old(e,age),wait:e.wait});failed(f);
 snapshotChange(f,s=>{for(const r of s.coverage)r.visible.wait='3 days';});
 for(const r of safety(f).coverage){r.time.renderedWait='3 days';r.time.legacyWaitDisposition='reviewed-retained';}failed(f);
});
test('changed capture with freshly resealed hashes still must match actual selected sources and scope',()=>{
 for(const change of [s=>s.coverage.pop(),s=>s.coverage[1]=s.coverage[0],s=>s.selection='entire-raw-record',s=>s.appSha256='f'.repeat(64),s=>s.coverage[0].visible.duration='1 day',s=>s.coverage[0].visible.steps[0].action='Wait one day',s=>delete s.coverage[0].visible.diagramText,s=>s.coverage[0].visible.safety='Different age safety']){const f=fixture();snapshotChange(f,change);failed(f);}
 for(const change of [s=>s.renderingReview.fullSelectedSurfaceMappingReviewed=false,s=>s.renderingReview.sourceSha256='f'.repeat(64),s=>s.renderingReview.evidenceIds=[]]){const f=fixture();change(safety(f));failed(f);}
});
test('snapshot consumes only the byte copy whose inventory SHA was verified, never a second read',()=>{
 const f=fixture(),a=f.reports.get('facts'),entry=a.evidence.find(e=>e.id==='selected-visible');
 const valid=f.files.get(entry.path),originalRead=f.context.readReport;let reads=0;
 entry.sha256=safetyHash('{}');f.context.readReport=p=>p===entry.path?(++reads===1?'{}':valid):originalRead(p);
 failed(f);assert.equal(reads,1);
 const x=fixture(),path='verification/selected-visible.json',read=x.context.readReport;let count=0;
 x.context.readReport=p=>p===path?(++count===1?read(p):'{}'):read(p);
 passed(x);assert.equal(count,1);
});
test('feedback also consumes the verified support bytes, not a later unbound source',()=>{
 const f=fixture(),a=f.reports.get('user-feedback'),entry=a.evidence.find(e=>e.id==='source');
 entry.sha256=safetyHash('No such quote');f.files.set(entry.path,'No such quote');
 const originalRead=f.context.readReport;let reads=0;
 // The file is shared by all five fixtures. Return unbound quote only after
 // the user-feedback inventory has read its fifth (and final) verified copy.
 f.context.readReport=p=>p===entry.path?(++reads<=5?'No such quote':a.feedback[0].exactQuote):originalRead(p);
 for(const report of f.reports.values())report.evidence.find(e=>e.id==='source').sha256=entry.sha256;
 f.seal();assert.ok(validateReleaseEvidence(f.evidence,f.context).some(e=>e.includes('Final user-feedback review')));assert.equal(reads,5);
});
test('resealed snapshots reject legacy, other-age and arbitrary metadata namespaces',()=>{
 for(const name of ['legacyAgeGuide','otherAge','ageProtocols','activeAgeProtocol','original','metadata','safety/legacy','unlistedText']){
  const f=fixture();snapshotChange(f,s=>{s.coverage[0].visible[name]={safety:'Do not taste.'};});
  safety(f).coverage[0].judgments[0].selectedVisibleEvidence=[{pointer:`/${name.replace(/~/g,'~0').replace(/\//g,'~1')}/safety`,quote:'Do not taste.'}];failed(f);
 }
 const f=fixture();snapshotChange(f,s=>{s.coverage[0].visible.legacyAgeGuide={safety:'Not even referenced.'};});failed(f);
});
test('resealed snapshots reject extra step fields and non-string additional text trees',()=>{
 for(const change of [
  v=>v.steps[0].legacyAgeGuide={safety:'Do not taste.'},
  v=>v.otherText=[{legacyAgeGuide:{safety:'Do not taste.'}}],
  v=>v.diagramText=[{otherAge:{safety:'Do not taste.'}}],
  v=>v.supplementaryText=[{metadata:{safety:'Do not taste.'}}],
  v=>delete v.otherText,
 ]){const f=fixture();snapshotChange(f,s=>change(s.coverage[0].visible));failed(f);}
});
test('all selected-visible quote consumers reject out-of-schema paths and aliases',()=>{
 const badPaths=['/legacyAgeGuide/safety','/otherAge/safety','/ageProtocols/7-9/safety','/otherText/0/legacyAgeGuide','/steps/0/actor','/steps/00/action','/steps/0/action/extra','/safety~1legacy'];
 for(const pointer of badPaths){
  for(const target of ['judgment','source','window']){
   const f=fixture(),r=safety(f).coverage[0],quote='Do not taste.';
   if(target==='judgment')r.judgments[0].selectedVisibleEvidence=[{pointer,quote}];
   if(target==='source')r.time.sources.safety.selectedVisibleEvidence=[{pointer,quote}];
   if(target==='window')r.time.windows.cleanupDeadline.selectedVisibleEvidence=[{pointer,quote}];
   failed(f);
  }
 }
});
test('documented additional selected-text leaves remain supported without semantic classification',()=>{
 for(const field of ['otherText','diagramText','supplementaryText']){
  const f=fixture();snapshotChange(f,s=>{s.coverage[0].visible[field]=['Do not taste.'];});
  safety(f).coverage[0].judgments[0].selectedVisibleEvidence=[{pointer:`/${field}/0`,quote:'Do not taste.'}];passed(f);
 }
});
