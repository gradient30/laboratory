import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const target=[[177,'4-6',2],[177,'10-12',3],[178,'4-6',1],[179,'4-6',3],[180,'4-6',2],[180,'13-16',3],[181,'4-6',1],[181,'10-12',3]];
const make=(d,a,s)=>renderActivityDiagram(data.find(e=>e.id===d),s-1,a);
const mark='data-material-batch="june-final-v1"';
const count=(s,k)=>s.split(`data-material="${k}"`).length-1;
test('June final renderer targets exactly the eight validated scenes and preserves all authored text',()=>{
 const expected=new Set(target.map(x=>x.join(':')));let n=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,scene] of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,i,a), key=[e.id,a,i+1].join(':');
  assert.equal(svg.includes(mark),expected.has(key),key);
  if(expected.has(key))for(const el of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(el.text),el.text);
  n++;
 } assert.equal(n,5840);
});
test('June final falls back if matching scene wording or geometry changes',()=>{
 for(const [d,a,s] of target)for(const mutate of [x=>x.description+=' changed',x=>x.elements[0].x+=.5,x=>x.elements[0].text+=' changed',x=>x.elements.reverse()]){
  const e=structuredClone(data.find(e=>e.id===d));mutate(e.ageProtocols[a].diagrams[s-1]);
  assert.ok(!renderActivityDiagram(e,s-1,a).includes(mark));
 }
});
test('separate scales and dedicated materials never supply measured outcomes',()=>{
 const pack=make(177,'10-12',3);
 assert.equal(count(pack,'scale-with-blank-display'),2);
 for(const k of ['bare-folded-cloth','empty-package-and-lid','optional-original-l-buffer'])assert.equal(count(pack,k),1);
 assert.equal(count(make(177,'4-6',2),'blank-tally-two-by-six'),1);
 const mix=make(179,'4-6',3);
 assert.equal(count(mix,'dedicated-cup'),2);assert.equal(count(mix,'dedicated-spoon'),2);
 assert.equal(count(make(178,'4-6',1),'baseline-and-nearest-mark'),1);
 const probe=make(181,'10-12',3);
 assert.equal(count(probe,'neutral-probe-cross-section'),1);
 assert.ok(probe.includes('不再压到第二接触，不预填结果'));
 assert.equal(count(make(181,'4-6',1),'paintbrush-and-dedicated-tray'),1);
 assert.equal(count(make(181,'4-6',1),'sponge-and-dedicated-tray'),1);
});
test('geometry keeps all twelve squares and the 8 by 8 coordinates; no solution filled',()=>{
 const row=make(180,'4-6',2);
 const g=row.match(/data-material="twelve-square-straight-row".*?<\/g>/)?.[0];
 assert.equal(g?.split('<rect').length-1,12);
 const grid=make(180,'13-16',3);
 const cells=[...grid.matchAll(/data-row="(\d)" data-col="(\d)" data-filled="(true|false)"/g)];
 assert.equal(cells.length,64);assert.equal(cells.filter(m=>m[3]==='true').length,12);
 for(const [_,r,c,f] of cells){
  const a=Number(r),b=Number(c);
  assert.equal(f==='true',a>=2&&a<=5&&b>=2&&b<=5&&(a===2||a===5||b===2||b===5));
 }
 assert.ok(grid.includes('拟移动：____ → ____'));
});
