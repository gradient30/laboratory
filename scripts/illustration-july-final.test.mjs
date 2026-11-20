import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[206,'4-6',1],[206,'4-6',3],[208,'7-9',3],[208,'10-12',2],[210,'10-12',3]];
const marker='data-material-batch="july-final-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('July final illustrations apply to five exact scoped scenes and preserve every authored label',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('July final scenes fall back when authored description or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('July final shows clear path, equivalent card positions, independent fold sheets, whole-page flip and shared corners',()=>{
 const setup=svg(206,'4-6',1);
 assert.match(setup,/data-material="unobstructed-light-path".*无卡：先看中央照区.*屏位距零面 60 厘米/s);
 assert.doesNotMatch(setup,/data-card-position=/);
 const slide=svg(206,'4-6',3);
 assert.deepEqual([...slide.matchAll(/data-card-position="(30|45)"/g)].map(m=>m[1]),['30','45']);
 assert.match(slide,/灯不动，纸屏仍在60厘米.*不填理想倍率/s);
 const axes=svg(208,'7-9',3);
 assert.deepEqual([...axes.matchAll(/data-axis="(vertical|horizontal)"/g)].map(m=>m[1]),['vertical','horizontal']);
 const flip=svg(208,'10-12',2);
 assert.match(flip,/data-face="front".*data-face="back".*L 对 L／H 对 H.*掀起整张翻面/s);
 assert.deepEqual([...svg(210,'10-12',3).matchAll(/data-pair="(BD|CD|AD)"/g)].map(m=>m[1]),['BD','CD','AD']);
});
