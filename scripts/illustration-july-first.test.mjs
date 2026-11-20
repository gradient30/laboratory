import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const targets=[[182,'7-9',3],[183,'4-6',3],[184,'7-9',2],[187,'4-6',2]];
const markup='data-material-batch="july-first-v1"';
const render=(d,a,s)=>renderActivityDiagram(data.find(e=>e.id===d),s-1,a);
const count=(svg,k)=>svg.split(`data-material="${k}"`).length-1;

test('July first render changes only the four source-pinned steps and retains their authored labels',()=>{
 const expected=new Set(targets.map(x=>x.join(':')));let changed=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(svg.includes(markup),expected.has(key),key);
  if(expected.has(key)){
   for(const el of s.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(el.text),el.text);
   changed++;
  }
 }
 assert.equal(changed,4);
});

test('July overlays fall back for changed text or geometry',()=>{
 for(const [d,a,s] of targets)for(const mutate of [x=>x.description+=' changed',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(data.find(e=>e.id===d));mutate(e.ageProtocols[a].diagrams[s-1]);
  assert.ok(!renderActivityDiagram(e,s-1,a).includes(markup));
 }
});

test('July actions preserve sequence, comparable setups, whole envelope and pre-alignment geometry',()=>{
 const rhythm=render(182,'7-9',3);
 const slots=[...rhythm.matchAll(/data-slot="(\d)" data-action="(tap|pause)"/g)].map(m=>m.slice(1).join(':'));
 assert.deepEqual(slots,['1:tap','2:pause','3:pause','4:tap','1:tap','2:tap','3:pause','4:tap']);
 assert.equal(count(rhythm,'same-ending-hand-above-cloth'),1);
 const cups=render(183,'4-6',3);
 assert.deepEqual([...cups.matchAll(/data-material="same-covered-cup-on-cross" data-cup="([CS])"/g)].map(m=>m[1]),['C','S']);
 assert.ok(cups.includes('不吹、不尝、不贴杯口')&&cups.includes('十字仅示位置'));
 const packs=render(184,'7-9',2);
 assert.deepEqual([...packs.matchAll(/data-material="(whole-folded-envelope|opened-envelope)"/g)].map(m=>m[1]),['whole-folded-envelope','whole-folded-envelope','opened-envelope']);
 assert.ok(packs.includes('先A后B，每轮全卡与空封复位')&&packs.includes('达到至少8张才停'));
 const triangles=render(187,'4-6',2);
 assert.equal(count(triangles,'triangle-a'),1);assert.equal(count(triangles,'triangle-b'),1);
 assert.ok(triangles.includes('data-material="three-corner-guides"'));
 assert.ok(triangles.includes('之后分开，才试铺整个框'));
});
