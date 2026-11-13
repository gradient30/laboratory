import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {resolveAgeProtocol,protocolAges} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const original=data.experiments.find(e=>e.id===106);
const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const currentDeclaration=app.split('\n').find(line=>line.startsWith('const current=()=>'));
for(const age of protocolAges)test(`day106 ${age}: current UI projection uses reviewed steps, never retained erroneous legacy sequence`,()=>{
 const before=structuredClone(original),p=original.ageProtocols[age];
 assert.match(original.steps[1].detail,/1、2、3、2、1/,'Retain original legacy fields, do not silently rewrite history');
 const ctx=vm.createContext({resolveAgeProtocol,selectedDetail:{childId:'synthetic-child',day:106,revision:'synthetic-revision',experiment:original},activeChild:{id:'synthetic-child'},state:{day:106,age},curriculumRevision:'synthetic-revision',experiments:data.experiments});
 vm.runInContext(currentDeclaration+'\nglobalThis.currentProjection=current;',ctx);
 for(const useDetail of [true,false]){
  ctx.selectedDetail=useDetail?{childId:'synthetic-child',day:106,revision:'synthetic-revision',experiment:original}:null;
  const output=ctx.currentProjection();
  assert.equal(output.activeAgeProtocol,p);assert.equal(output.protocolStatus,'candidate');
  assert.deepEqual(output.steps,p.steps.map(s=>({title:s.title,shortText:s.action,detail:s.action,actor:s.actor})));
  assert.deepEqual(output.ageGuides[age].steps,p.steps);
  assert.equal(output.inquiry.solve,p.steps.map(s=>s.action).join(' '));
  assert.doesNotMatch(JSON.stringify({steps:output.steps,ageSteps:output.ageGuides[age].steps,solve:output.inquiry.solve}),/1、2、3、2、1/);
  assert.notDeepEqual(output.steps,original.steps);
 }
 assert.deepEqual(original,before,'Projection must not change retained original or protocol data');
});
