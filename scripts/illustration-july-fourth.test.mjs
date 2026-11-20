import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const targets=[[200,'4-6',3],[201,'4-6',1],[202,'4-6',2],[204,'4-6',2],[205,'10-12',3]];
const marker='data-material-batch="july-fourth-v1"';
const get=d=>data.find(e=>e.id===d);
const render=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('July fourth illustration touches five exact authored scenes only',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(svg.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(svg.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('July fourth drawing falls back for changed descriptions or element shapes',()=>{
 for(const [d,a,s] of targets)for(const mutate of [x=>x.description+=' 改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));mutate(e.ageProtocols[a].diagrams[s-1]);
  assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('July fourth drawings retain action sequence and avoid substituted results',()=>{
 const jars=render(200,'4-6',3);
 assert.deepEqual([...jars.matchAll(/data-material="closed-c-position" data-position="([0-3])"/g)].map(m=>m[1]),['0','1','2','3']);
 assert.deepEqual([...jars.matchAll(/rotate\((-?\d+)\)/g)].map(m=>m[1]),['-10','0','10','0']);
 assert.match(render(201,'4-6',1),/data-material="square-two-endpoints-before-press".*两端都对，尚未压折.*只碰到一个角还不够/s);
 assert.match(render(202,'4-6',2),/data-material="continuous-four-panel-accordion".*每次只打开相邻一格.*纸折打开不能证明真实蜕变/s);
 const clouds=render(204,'4-6',2);
 assert.match(clouds,/data-material="fixed-blank-photo-a".*data-material="fixed-blank-photo-b-with-unrotated-overlay".*data-material="same-overlay-horizontal-transfer".*只平移，不转纸/s);
 assert.doesNotMatch(clouds,/<image\b|rotate\(/);
 assert.match(render(205,'10-12',3),/data-material="three-original-card-covers-reveal".*1 纸盒.*2 塑料瓶.*3 金属罐.*没有清洗或改品类/s);
});
