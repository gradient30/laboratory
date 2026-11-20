import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[257,'4-6',3],[258,'4-6',3],[259,'4-6',3],[260,'4-6',2],[261,'4-6',2]];
const marker='data-material-batch="september-third-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('September third applies only to five pinned authored scenes and keeps their labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('September third falls back if authored text or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('September third separates route sheets, restores the frame, and keeps modeled examples from becoming actual results',()=>{
 assert.match(svg(257,'4-6',3),/keep-two-separate-route-sheets.*原纸：右右上.*T\(2,1\).*另纸：上右右.*T\(2,1\).*别擦第一条/s);
 const framed=svg(258,'4-6',3);
 assert.match(framed,/same-A-under-lift-and-reset.*提开 B，找两侧.*B 回原位.*B 框.*整框，不裁图.*同一张图，不换植物/s);
 assert.equal((framed.match(/>8<\/text>/g)||[]).length,2);
 assert.equal((framed.match(/>1<\/text>/g)||[]).length,2);
 assert.match(svg(259,'4-6',3),/real-consent-readback-no-assumed-confirmation.*纠正 \/ 未确认 \/ 停止.*未确认就留待核.*fiction-paper-source-self-check-only.*虚构：只核卡，不记A确认/s);
 assert.match(svg(260,'4-6',2),/A → B → C.*three-fixed-setup-ball-positions-no-shading.*① A.*② B.*③ C.*C 后关灯.*保持灯与座位不动.*不追看，不预填答案.*位置示意，不标亮暗/s);
 const pairing=svg(261,'4-6',2);
 assert.match(pairing,/one-adult-demo-remaining-links-empty.*one-pair-may-be-demonstrated.*成人可示范一对.*其余由孩子指或画/s);
 assert.equal((pairing.match(/<polygon /g)||[]).length,1);
});
