import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[213,'4-6',1],[213,'4-6',2],[215,'4-6',2],[216,'7-9',3],[218,'10-12',2]];
const marker='data-material-batch="august-first-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('August first overlays apply to five exact scoped scenes and preserve every authored label',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('August first exact overlays fall back when authored description or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('August first retains fixed apparatus, exact cue sets and blank outcomes',()=>{
 const shadow=svg(213,'4-6',2);
 assert.deepEqual([...shadow.matchAll(/data-screen-gap="(5|25)"/g)].map(m=>m[1]),['5','25']);
 assert.match(shadow,/方卡同高、与屏平行.*灯和屏不动/s);
 const slide=svg(215,'4-6',2);
 assert.match(slide,/data-material="one-common-horizontal-baseline".*data-position="start".*data-position="target".*先保存实际落位/s);
 assert.match(svg(216,'7-9',3),/data-material="unchanged-four-pieces-collected-off-board".*绿底原轮.*白底新一轮.*成人不让搜索者看到布局/s);
 const setup=svg(213,'4-6',1);
 assert.match(setup,/data-path="clear".*先无卡：看纸屏.*data-screen-gap="5".*再放卡：离屏5厘米.*只看纸屏，不直视灯/s);
 const thermo=svg(218,'10-12',2);
 assert.deepEqual([...thermo.matchAll(/data-display-step="([0-2])"/g)].map(m=>m[1]),['0','1','2']);
 assert.equal((thermo.match(/>____<\/text>/g)||[]).length,3);
});
