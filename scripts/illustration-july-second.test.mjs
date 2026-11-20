import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const targets=[[188,'4-6',3],[189,'7-9',3],[192,'4-6',2],[193,'4-6',2],[193,'10-12',3]];
const markup='data-material-batch="july-second-v1"';
const render=(d,a,s)=>renderActivityDiagram(data.find(e=>e.id===d),s-1,a);
test('July second render targets only five exact scenes and retains authored labels',()=>{
 const expected=new Set(targets.map(x=>x.join(':')));let changed=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(svg.includes(markup),expected.has(key),key);
  if(expected.has(key)){
   for(const el of s.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(el.text),el.text);
   changed++;
  }
 }
 assert.equal(changed,targets.length);
});
test('July second render falls back when source description or geometry differs',()=>{
 for(const [d,a,s] of targets)for(const mutate of [x=>x.description+=' changed',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(data.find(e=>e.id===d));mutate(e.ageProtocols[a].diagrams[s-1]);
  assert.ok(!renderActivityDiagram(e,s-1,a).includes(markup));
 }
});
test('July operation hints retain body connection, independent card versions, fixed height and blank readings',()=>{
 const insects=render(188,'4-6',3);
 assert.deepEqual([...insects.matchAll(/data-material="paper-insect-stage" data-stage="([^"]+)"/g)].map(m=>m[1]),['attached','removed','returned']);
 assert.equal(insects.split('data-material="same-detached-leg-pair"').length-1,1);
 const versions=render(189,'7-9',3);
 assert.deepEqual([...versions.matchAll(/data-material="separate-version-card" data-version="([PCR])"/g)].map(m=>m[1]),['P','C','R']);
 assert.ok(versions.includes('data-material="separate-empty-check-sheet"')&&versions.includes('按P修复 · 日期____'));
 const rotors=render(192,'4-6',2);
 assert.deepEqual([...rotors.matchAll(/data-material="adult-same-stem-grip" data-fold="([OS])"/g)].map(m=>m[1]),['O','S']);
 assert.ok(rotors.includes('柄底目标50厘米')&&rotors.includes('收尺才松指'));
 const change=render(193,'4-6',2);
 assert.match(change,/<rect x="65"[^>]+fill="#FFFDF6"[^>]*\/>.*<rect x="345"[^>]+fill="#193D40"[^>]*\/>/s);
 assert.match(change,/① 白卡.*② 黑卡.*同一罐/s);
 const oil=render(193,'10-12',3);
 assert.ok(oil.includes('外底为 0，尺不入液')&&oil.includes('不清不补值'));
 assert.ok(oil.includes('I 水油界面：____ / ____')&&oil.includes('T 最上可辨油面：____ / ____'));
});
