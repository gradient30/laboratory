import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[244,'7-9',3],[245,'4-6',3],[246,'4-6',3],[247,'4-6',2],[247,'13-16',3],[248,'4-6',2]];
const marker='data-material-batch="september-first-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('September first applies only to six pinned authored scenes and retains accurate labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key)&&key!=='247:13-16:3')for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('September first illustrations fall back if authored text or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('September first distinguishes conceptual conversion, fixed sites, revision pages, card transfer and mirror setup',()=>{
 assert.match(svg(244,'7-9',3),/light-enters-plant.*conversion-inside-one-plant.*植物内：形成有机物.*有机物中的化学能.*来源支持的概念，不是实测.*light-direction/s);
 assert.match(svg(245,'4-6',3),/same-fixed-sites-old-new.*旧页：A 作起点.*新页：D 作起点.*只换起点.*纸不转/s);
 assert.match(svg(246,'4-6',3),/keep-first-page-open-second-unmarked.*先留原来的连线.*另页重做核对.*核对另页不擦原线/s);
 assert.match(svg(247,'4-6',2),/first-target-A-top-only-example.*盒顶 C → T.*盒顶 A → F.*T 顶 C → 盒.*现场次数自行记录/s);
 const mirror=svg(248,'4-6',2);
 assert.match(mirror,/whole-supported-mirror-plan-fixed-o.*基准 0°.*计划 \+10°.*前侧 \+y；纸与座椅不动.*移整架.*对回 O.*V \/ P \/ N \/ \? 都可记录/s);
 const surfaces=[...mirror.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="#356D89" stroke-width="5"/g)].map(m=>m.slice(1).map(Number));
 assert.equal(surfaces.length,2);assert.equal(surfaces[0][1],surfaces[0][3]);assert.ok(surfaces[1][3]>surfaces[1][1]&&surfaces[1][2]>surfaces[1][0]);
});

test('Older card-order protocol compares R/S/V on the changed paper-only task without results',()=>{
 const r=svg(247,'13-16',3);
 assert.match(r,/paper-only-task-Q2-and-layout-V.*只做纸上模型.*旧任务 Q：A → B → C → D → E.*新任务 Q₂：E → A → D → B → C.*V 从盒顶到底按 Q₂ 排.*blank-paper-model-counts-I-b-r-g-m.*比较 R \/ S \/ V.*不再做实体轮次/s);
 const table=r.split('data-material="blank-paper-model-counts-I-b-r-g-m"')[1].split('</g>')[0];
 assert.deepEqual([...table.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m=>m[1]).filter(Boolean),['同一个新任务；比较 R / S / V','方案','I','b','r','g','m','R','S','V']);
 assert.doesNotMatch(r,/每轮重置|本龄：R\/S|同卡 \/ 同任务|下一预定轮/);
});
