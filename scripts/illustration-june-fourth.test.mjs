import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';

const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const targets=[[170,'4-6',1],[171,'4-6',1],[171,'4-6',2],[172,'4-6',1],[172,'7-9',1],[172,'7-9',3],[175,'4-6',2],[175,'4-6',3]];
const key=(day,age,step)=>`${day}:${age}:${step}`;
const wanted=new Set(targets.map(x=>key(...x)));
const day=id=>data.find(e=>e.id===id);
const render=(d,a,s)=>renderActivityDiagram(day(d),s-1,a);
const overlay='data-material-batch="june-fourth-v1"';
const count=(svg,tag)=>(svg.match(new RegExp(`data-material="${tag}"`,'g'))||[]).length;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

test('June fourth batch targets exactly eight of 5840 and preserves all original visible wording',()=>{
 let total=0,changed=0;
 for(const e of data)for(const [age,p] of Object.entries(e.ageProtocols))for(const [i,scene] of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,i,age),expected=wanted.has(key(e.id,age,i+1));
  assert.equal(svg.includes(overlay),expected,key(e.id,age,i+1));
  if(expected){changed++;for(const el of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(el.text)),el.text);}
  total++;
 }
 assert.equal(total,5840);assert.equal(changed,8);
});
test('June fourth overlays fall back on source wording, geometry, ordering, description or extra content changes',()=>{
 for(const [d,a,s] of targets)for(const edit of [
  scene=>scene.description+=' changed',
  scene=>scene.elements[0].x+=.1,
  scene=>scene.elements[0].text+=' changed',
  scene=>scene.elements.reverse(),
  scene=>scene.elements.push({...scene.elements[0],y:299})
 ]){
  const activity=structuredClone(day(d));edit(activity.ageProtocols[a].diagrams[s-1]);
  assert.ok(!renderActivityDiagram(activity,s-1,a).includes(overlay));
 }
});
test('numbered upright bags and visibly separate paper contents-model cards keep the 3×2 arrangement',()=>{
 const svg=render(170,'4-6',1);
 assert.equal(count(svg,'opaque-numbered-paper-bag'),6);
 assert.equal(count(svg,'separate-contents-model-card'),6);
 const bags=[...svg.matchAll(/data-number="(\d)"[^>]*><rect x="(\d+)" y="(\d+)" width="54" height="70"/g)].map(m=>m.slice(1).map(Number));
 assert.deepEqual(bags,[[1,145,118],[2,319,118],[3,493,118],[4,145,196],[5,319,196],[6,493,196]]);
 for(const bag of svg.matchAll(/data-material="opaque-numbered-paper-bag"[^>]*>(.*?)<\/g>/g))assert.ok(!/<text|[>](RP|BP|M|E|R|G)</.test(bag[1]));
 const cards=[...svg.matchAll(/data-material="separate-contents-model-card"><rect x="(\d+)" y="(\d+)" width="42" height="59"/g)].map(m=>m.slice(1).map(Number));
 assert.equal(cards.length,6);
 cards.forEach(([x,y],i)=>{assert.ok(x+42<bags[i][1]);assert.equal(y-bags[i][2],6);});
});
test('paper cones have an open rim, a flat folded end and both release rims on the same 40 cm reference',()=>{
 const inspect=svg=>[...svg.matchAll(/data-opening="(up|down)" transform="translate\((\d+) (\d+)\) scale\(1 (-?1)\)"/g)].map(m=>m.slice(1));
 const pose=render(171,'4-6',1),alignment=render(171,'4-6',2);
 assert.deepEqual(inspect(pose),[['up','144','143','1'],['down','438','210','-1']]);
 assert.deepEqual(inspect(alignment),[['up','116','187','1'],['down','226','187','-1']]);
 for(const svg of [pose,alignment])assert.equal((svg.match(/H5 Q24 39 48 0 Z/g)||[]).length,2);
 assert.ok(alignment.includes('data-rim-y="187"'));assert.ok(alignment.includes('口沿参考40厘米'));
 assert.ok(!alignment.includes('data-observation-result'));
});
test('empty cups use rim/base geometry and a clear 2:1 observation window with four external markers',()=>{
 for(const [age,step,n] of [['4-6',1,2],['7-9',1,3],['7-9',3,1]]){
  const svg=render(172,age,step);
  assert.equal(count(svg,'empty-transparent-plastic-cup'),n);
  assert.equal((svg.match(/ry="8"/g)||[]).length,n);
  assert.ok(!svg.includes('data-waterline')&&!svg.includes('data-observation-result'));
 }
 const svg=render(172,'7-9',3);
 const window=svg.match(/data-window-bounds="128,187,80,40">(.*?)<\/g>/)?.[1];
 assert.ok(window);assert.equal((window.match(/<path/g)||[]).length,4);assert.ok(!window.includes('<rect')&&!window.includes('<circle'));
 for(const coordinates of ['M126 177 V185 H118','M210 177 V185 H218','M126 237 V229 H118','M210 237 V229 H218'])assert.ok(window.includes(coordinates));
});
test('fictional paper cards distinguish one-point versus two-point rules without showing totals',()=>{
 for(const [step,n] of [[2,1],[3,2]]){
  const svg=render(175,'4-6',step);
  assert.equal(count(svg,'fictional-point-paper-card'),n);
  assert.equal(count(svg,'fictional-p-paper-card'),1);
  assert.ok(!svg.includes('data-observation-result'));
 }
});
test('new scene SVG IDs remain unique and all local references resolve',()=>{
 const unique=new Set();
 for(const target of targets){
  const svg=render(...target);
  assert.ok(!/NaN|undefined/.test(svg));
  const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ids){assert.ok(!unique.has(id));unique.add(id);}
  for(const ref of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(ref[1]));
 }
});
