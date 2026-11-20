import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[251,'4-6',2],[251,'4-6',3],[252,'4-6',1],[254,'4-6',3],[255,'4-6',2]];
const marker='data-material-batch="september-second-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('September second applies only to five pinned authored scenes and keeps their labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('September second falls back if authored text or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('September second neutral choices, identical book and W, and lamp-off transition preserve the operation without invented results',()=>{
 for(const [step,q] of [[2,'休息'],[3,'找食']]){
  const s=svg(251,'4-6',step);
  assert.match(s,new RegExp('three-unmarked-choice-zones.*neutral-question-outside-all-zones.*x="538" y="92"[^>]*>'+q+'？','s'));
  assert.doesNotMatch(s,new RegExp('y="245"[^>]*>'+q+'？'));
 }
 assert.match(svg(251,'4-6',3),/初图不擦.*可选同一区，也可未知/s);
 assert.match(svg(252,'4-6',1),/same-closed-book-two-faces.*合着看正面.*只看背面.*成人翻面.*同一本书.*先得物主许可.*不抄写、不上传私人信息/s);
 assert.match(svg(254,'4-6',3),/aligned-W-with-A-far-B-near.*W.*W 仍在同一位置.*four-trips-repeat-only-on-B.*W → P → W → B → W/s);
 assert.match(svg(255,'4-6',2),/俯视简图，不画光路.*C-covered-off-before-U45-exposed.*C 盖镜.*先关灯.*成人只在关灯时撤盖.*U45露镜.*镜固定，手退出再开灯.*blank-target-no-presumed-light-result.*空框留真实所见，不填预期.*只看靶，不看灯或镜/s);
});
