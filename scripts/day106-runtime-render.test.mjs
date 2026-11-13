import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolveAgeProtocol,renderActivityDiagram,protocolAges} from '../dist/diagrams.js';
import {curriculumArtifacts} from './build-curriculum.mjs';
// Exercise generated deployment artifacts and actual app functions with minimal DOM stubs.
// This is deterministic Node regression coverage, not browser or layout verification.
const root=fileURLToPath(new URL('../',import.meta.url));
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const artifacts=curriculumArtifacts(root);
const committedIndex=JSON.parse(fs.readFileSync(new URL('../worker/curriculum-index.json',import.meta.url)));
assert.deepEqual(artifacts.index,committedIndex,'Regenerated artifacts must match the committed deployment index');
const entry=artifacts.index.days[105];
const original=JSON.parse(artifacts.files.get(entry.path.slice(1)));
const before=JSON.stringify(original);
const revision=artifacts.index.revision;
// Match the Worker catalog response shape: generated summaries plus access flags, not authoring records.
const catalog=artifacts.index.days.map(({summary})=>({...summary,locked:false}));
assert.equal(catalog[105].id,106);
for(const key of ['steps','ageGuides','ageProtocols','inquiry'])assert.equal(catalog[105][key],undefined);
assert.doesNotMatch(JSON.stringify(catalog),/1、2、3、2、1/);
assert.match(original.steps[1].detail,/1、2、3、2、1/);
// Fail clearly if application declaration boundaries change instead of testing a copied implementation.
function line(start){
 const result=app.split('\n').find(l=>l.startsWith(start));
 assert.ok(result,`Missing application declaration: ${start}`);
 return result;
}
function declaration(name){
 const start=app.indexOf('function '+name+'(');
 assert.ok(start>=0,`Missing application function: ${name}`);
 const tail=app.slice(start+1),next=tail.search(/\n(?:async )?function [A-Za-z]/);
 assert.ok(next>=0,`Missing function boundary after ${name}`);
 return app.slice(start,start+1+next);
}
const script=[line('const escapeHTML='),line('const safeURL='),app.slice(app.indexOf('const ages={'),app.indexOf('\nconst localDate=')),line('const current='),line('const guide='),declaration('renderPaperPanel'),declaration('bindPaperResources'),declaration('renderExperiment'),declaration('renderStep'),declaration('renderInquiry'),declaration('renderReview'),declaration('populateDiagram'),declaration('renderDetailUnavailable'),line('function extensionNodes('),'globalThis.selectedProjection=current;globalThis.htmlEscape=escapeHTML;'].join('\n');
for(const age of protocolAges)test(`day106 ${age}: generated catalog stays loading until matching detail; actual step, modal and inquiry render reviewed instructions`,()=>{
 const nodes=new Map();
 function node(id){
  if(!nodes.has(id))nodes.set(id,{
   innerHTML:'',textContent:'',dataset:{},hidden:false,disabled:false,
   addEventListener(){},setAttribute(){},
   replaceChildren(){this.innerHTML='';this.textContent='';}
  });
  return nodes.get(id);
 }
 const ctx=vm.createContext({URL,resolveAgeProtocol,renderActivityDiagram,selectedDetail:null,activeChild:{id:'a',ageBand:age},state:{day:106,age},curriculumRevision:revision,curriculumAccessVersion:1,contextEpoch:0,detailEpoch:0,experiments:catalog,document:{title:''},$:node,$$:()=>[],loadingRecord:false,loadedRecordKey:'selected',progressKey:()=> 'selected',restorePreparation(){},currentProgress:()=>false,stepNumber:()=>ctx.stepIndex,stepIndex:0,monthForDay:()=>4,recommendation:()=>106,totalDays:365,badge:()=>'',category:e=>e.category,materialIcon:()=>'',checks:[false,false,false],gate:'preview',cloudStatusText:()=>'',buildWorkspace(){},renderRecord(){},watchDisplayedStep(){},updateReadingProgress(){},queueDisplayedStep(){},detailLoading:true,detailError:'',curriculumError:''});
 vm.runInContext(script,ctx);
 // Missing or stale detail must never expose any authoring instructions from the catalog.
 for(const mode of ['catalog-only','wrong-child','wrong-day','wrong-revision']){
  ctx.selectedDetail=mode==='catalog-only'?null:{childId:mode==='wrong-child'?'other':'a',day:mode==='wrong-day'?105:106,revision:mode==='wrong-revision'?'0'.repeat(64):revision,experiment:original};
  assert.equal(ctx.selectedProjection().ageGuides,undefined);assert.equal(ctx.selectedProjection().steps,undefined);ctx.renderExperiment();assert.match(node('#experiment').innerHTML,/正在读取当天/);assert.doesNotMatch(node('#experiment').innerHTML,/1、2、3、2、1/);
 }
 // Sentinels make accidental fallback visible even if the legacy wording later changes.
 for(const poisoned of [false,true]){
  const selected=structuredClone(original);if(poisoned){selected.steps.forEach(s=>{s.detail+=' LEGACY_SEQUENCE_SENTINEL';s.shortText+=' LEGACY_SEQUENCE_SENTINEL';s.title+=' LEGACY_SEQUENCE_SENTINEL';});Object.values(selected.ageGuides).forEach(g=>g.steps.forEach(s=>{s.action+=' LEGACY_SEQUENCE_SENTINEL';s.caption+=' LEGACY_SEQUENCE_SENTINEL';}));selected.inquiry.solve+=' LEGACY_SEQUENCE_SENTINEL';selected.visual.labels=selected.visual.labels.map(x=>x+' LEGACY_SEQUENCE_SENTINEL');}
  ctx.selectedDetail={childId:'a',day:106,revision,experiment:selected};const p=selected.ageProtocols[age],projected=ctx.selectedProjection();assert.equal(projected.activeAgeProtocol,p);assert.equal(projected.inquiry.solve,p.steps.map(s=>s.action).join(' '));
  ctx.renderExperiment();assert.doesNotMatch(node('#experiment').innerHTML,/1、2、3、2、1|LEGACY_SEQUENCE_SENTINEL/);
  for(let i=0;i<4;i++){
   ctx.stepIndex=i;ctx.renderStep();ctx.populateDiagram();const stage=node('#step-stage').innerHTML,modal=node('#enlarged-instruction').textContent,diagram=node('#enlarged-diagram').innerHTML,inquiry=ctx.renderInquiry(projected);
   assert.ok(stage.includes(ctx.htmlEscape(p.steps[i].action)),`${age}/${i} step action`);assert.ok(modal.includes(p.steps[i].action),`${age}/${i} modal action`);assert.ok(inquiry.includes(ctx.htmlEscape(p.steps[i].action)),`${age}/${i} inquiry action`);assert.doesNotMatch([stage,modal,diagram,inquiry].join('\n'),/1、2、3、2、1|LEGACY_SEQUENCE_SENTINEL/);
  }
 }
 assert.equal(JSON.stringify(original),before,'Rendering must preserve exact original data');
});
