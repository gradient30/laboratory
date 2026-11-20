import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[268,'4-6',3],[270,'4-6',2],[271,'4-6',3],[272,'4-6',2],[272,'4-6',3]];
const marker='data-material-batch="september-final-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('September final applies only to five pinned authored scenes and keeps their labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('September final falls back if authored text or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('September final separates reset, moving the original, comparison and one representative',()=>{
 assert.match(svg(268,'4-6',3),/drain-refill-dry-gate-before-B.*倒空接水杯.*再量到同一 50 mL 线.*擦干托盘和两杯外壁.*不做 B.*original-B-geometry-no-predicted-drops.*按 B 倒一次.*水平外侧约5cm.*起始高约2cm.*不补画水滴/s);
 assert.match(svg(270,'4-6',2),/paper-Na-1-from-R1-to-P1-example-only.*先记原卡 ID.*R1.*Na-1.*P1.*P2.*P3.*Na-1.*只示一张.*不复制.*空组框不是实际结果/s);
 assert.match(svg(271,'4-6',3),/one-pair-check-not-a-finished-count.*只示一对.*两列是否一样多.*不追加第二次搬动/s);
 const slide=svg(272,'4-6',2);
 assert.match(slide,/one-actual-ID-slide-after-pointing-no-stacking.*未点：留在原处.*原位空.*ID 07.*指过再移.*点过：移到旁边摆平.*ID 01.*不叠起来.*实数自己记/s);
 assert.equal((slide.match(/>ID 01<\/text>/g)||[]).length,1);
 assert.match(svg(272,'4-6',3),/one-representative-for-each-observed-nonempty-group.*两张同类卡.*ID 01.*ID 02.*数量照实数，不当全组.*前方一张代表这一组.*只数非空组.*B\/C 留空待分组/s);
});
