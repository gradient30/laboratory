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
const revision=artifacts.index.revision;
const catalog=artifacts.index.days.map(({summary})=>({...summary,locked:false}));
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
const entries=artifacts.index.days.filter(e=>e.summary.id<=304);assert.equal(entries.length,304);
for(const entry of entries)for(const age of protocolAges)test(`timing day ${entry.summary.id} ${age}: actual app header never merges legacy wait`,()=>{
 const original=JSON.parse(artifacts.files.get(entry.path.slice(1)));
 const before=JSON.stringify(original);
 const nodes=new Map();
 function node(id){
  if(!nodes.has(id))nodes.set(id,{
   innerHTML:'',textContent:'',dataset:{},hidden:false,disabled:false,
   addEventListener(){},setAttribute(){},
   replaceChildren(){this.innerHTML='';this.textContent='';}
  });
  return nodes.get(id);
 }
 const ctx=vm.createContext({URL,resolveAgeProtocol,renderActivityDiagram,selectedDetail:null,activeChild:{id:'a',ageBand:age},state:{day:original.id,age},curriculumRevision:revision,curriculumAccessVersion:1,contextEpoch:0,detailEpoch:0,experiments:catalog,document:{title:''},$:node,$$:()=>[],loadingRecord:false,loadedRecordKey:'selected',progressKey:()=> 'selected',restorePreparation(){},currentProgress:()=>false,stepNumber:()=>ctx.stepIndex,stepIndex:0,monthForDay:()=>4,recommendation:()=>original.id,totalDays:365,badge:()=>'',category:e=>e.category,materialIcon:()=>'',checks:[false,false,false],gate:'preview',cloudStatusText:()=>'',buildWorkspace(){},renderRecord(){},watchDisplayedStep(){},updateReadingProgress(){},queueDisplayedStep(){},detailLoading:true,detailError:'',curriculumError:''});
 vm.runInContext(script,ctx);

 const selected=structuredClone(original);selected.wait='LEGACY_WAIT_SENTINEL';
 ctx.selectedDetail={childId:'a',day:original.id,revision,experiment:selected};
 ctx.renderExperiment();
 const html=node('#experiment').innerHTML;
 assert.ok(html.includes(ctx.htmlEscape(selected.ageProtocols[age].guide.time)));
 assert.doesNotMatch(html,/LEGACY_WAIT_SENTINEL|⏳ 等待：/);
 assert.equal(ctx.selectedProjection().wait,null);
 assert.equal(JSON.stringify(original),before);
});
