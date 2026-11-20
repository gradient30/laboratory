import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[262,'4-6',3],[263,'4-6',3],[264,'4-6',3],[265,'4-6',2],[266,'4-6',3]];
const marker='data-material-batch="september-fourth-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('September fourth applies only to five pinned authored scenes and keeps their labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('September fourth falls back if authored text or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('September fourth clarifies foil, adult sequence, mapping, hidden records and explicit source phrases',()=>{
 assert.match(svg(262,'4-6',3),/same-front-foil-lift-inspect-original-seat.*同片F0.*原背板 \/ 原标线.*成人取下轻揉再展开.*折回四边，检查完好.*同面F1.*原背板 \/ 原标线.*破损就停.*孩子保持座位/s);
 assert.match(svg(263,'4-6',3),/A-safe-before-open-B-once.*A 结束观察，成人先确认安全.*A 留敞口.*再做 B 一次.*B 也敞口.*blank-B-observation-not-a-prediction.*无法安全照看 A 时，B 记未做/s);
 const map=svg(264,'4-6',3);
 assert.match(map,/same-size-numbered-rows-to-square.*1-1.*2-1.*2-2.*2-3.*纸上的 1×1 与 2×2.*1-1.*1-1.*2-3.*2-1.*2-2/s);
 assert.match(svg(265,'4-6',2),/X-then-Y-same-hidden-scene-facedown-records.*X 先看.*X 表翻扣.*Y 安全等候，不听不看.*Y 后看.*Y 表翻扣.*两人结束后再打开原表.*隔离做不到：标未独立/s);
 assert.match(svg(266,'4-6',3),/printed-fiction-source-vs-unsupported-claim.*虚构 A 的原话.*我上小学时常用铅笔.*待查错句，不是史实.*那个年代人人只用铅笔.*还只说 A 吗？可以说不知道/s);
});
