import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[238,'4-6',2],[239,'4-6',3],[240,'4-6',3],[241,'4-6',2],[243,'4-6',3]];
const marker='data-material-batch="august-final-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('August final applies to exactly five pinned authored scenes and keeps all labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('August final overlays fall back if descriptions or geometry change',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('August final distinguishes source frames, missing values, age conditions, actual observations, and folding sequence',()=>{
 assert.match(svg(238,'4-6',2),/data-material="blank-subject-frame-requires-child-drawing".*对象先留空.*data-material="camera-source-outside-image".*在下框画自己的相机符号.*拍摄处不等于入镜物/s);
 const weather=svg(239,'4-6',3);
 assert.match(weather,/D1 · 0.0.*D3 · 3.0.*data-material="missing-status-outside-plot".*D2 缺测（无数值）/s);
 assert.doesNotMatch(weather,/D2 · [0-9]/);
 const packing=svg(240,'4-6',3);
 assert.deepEqual([...packing.matchAll(/data-condition="(F[0-2])"/g)].map(m=>m[1]),['F0','F2']);
 assert.match(packing,/F0 不加填充.*F2 两侧各一件.*先复位.*F1 不用于本龄/s);
 assert.match(svg(241,'4-6',2),/data-material="fixed-mirror-and-parallel-p-only".*沿镜面；先只观察 P.*data-material="empty-original-and-mirror-observation".*镜里所见另记.*本步不换纸/s);
 assert.match(svg(243,'4-6',3),/data-material="original-connected-v-net-solid-cut-short-dashed-fold".*实线剪外沿；短虚线只折不剪.*data-material="fixed-b-base-a-then-e-gesture-not-a-closed-cube".*① A.*② E.*B不转，先A后E.*不强拉也不要求闭盒/s);
});
