import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {renderActivityDiagram} from '../dist/diagrams.js';

const {experiments}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=['281:4-6:3','282:4-6:2','282:4-6:3','284:4-6:3'];
const marker='data-material-batch="october-second-v1"';
const render=(day,step)=>renderActivityDiagram(experiments.find(e=>e.id===day),step-1,'4-6');

test('four source-locked October graphics render at their intended age, day and step',()=>{
 const actual=[];let first=0,all=0;
 for(const experiment of experiments)for(const [age,protocol] of Object.entries(experiment.ageProtocols))for(const [i,scene] of protocol.diagrams.entries()){
  const svg=renderActivityDiagram(experiment,i,age);all++;
  if(svg.includes('data-material-batch="october-first-rebuild-v1"'))first++;
  if(svg.includes(marker)){
   actual.push(`${experiment.id}:${age}:${i+1}`);
   assert.ok(svg.includes(scene.elements.find(e=>e.type==='text').text));
  }
 }
 assert.equal(all,5840);
 assert.equal(first,5);
 assert.deepEqual(actual,targets);
});

test('changed authored semantics or step geometry fall back to the validated scene',()=>{
 for(const key of targets){
  const [day,age,step]=key.split(':');
  for(const mutate of [s=>s.description+='（补充）',s=>s.elements[0].y+=1,s=>s.elements.reverse()]){
   const experiment=structuredClone(experiments.find(e=>e.id===Number(day)));
   mutate(experiment.ageProtocols[age].diagrams[step-1]);
   assert.ok(!renderActivityDiagram(experiment,step-1,age).includes(marker),key);
  }
 }
});

test('December panel keeps the two alignment slopes and lets the learner explain the difference',()=>{
 const svg=render(281,3);
 assert.match(svg,/x1="129" y1="221" x2="165" y2="147"/);
 assert.match(svg,/x1="477" y1="221" x2="513" y2="147"/);
 assert.match(svg,/约 6 月.*约 12 月.*孩子说哪里不同/s);
});

test('cup rear-wall dimensions, same card and independent blank observations match each step',()=>{
 const first=render(282,2),later=render(282,3);
 assert.deepEqual([...first.matchAll(/data-action="position-(\d+)"/g)].map(m=>m[1]),['2']);
 assert.deepEqual([...later.matchAll(/data-action="position-(\d+)"/g)].map(m=>m[1]),['5','10']);
 assert.equal((first.match(/data-observation="blank"/g)||[]).length,1);
 assert.equal((later.match(/data-observation="blank"/g)||[]).length,2);
 for(const svg of [first,later])assert.match(svg,/杯后外壁量；同一张卡，杯、眼位与原箭头方向不变/);
});

test('original and copy have only the single intended shape substitution',()=>{
 const svg=render(284,3);
 const original=svg.split('data-action="original-groups"')[1].split('</g>')[0];
 const revised=svg.split('data-action="one-square-to-circle"')[1].split('</g>')[0];
 const counts=group=>[...['#D7ECE3','#F2E4BD','#E8DDEE'].map(fill=>group.split('fill="'+fill+'"').length-1)];
 assert.deepEqual(counts(original),[2,3,1]);
 assert.deepEqual(counts(revised),[3,3,0]);
 assert.match(svg,/请孩子重新比较/);
});
