import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[231,'4-6',3],[232,'4-6',2],[233,'4-6',3],[234,'4-6',2],[236,'4-6',3]];
const marker='data-material-batch="august-fourth-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('August fourth applies to precisely five authored scenes and retains all labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('August fourth drawings fall back if description or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('August fourth shows changed classifications and controlled physical operations without recorded outcomes',()=>{
 assert.match(svg(231,'4-6',3),/data-material="three-identity-cards-in-one-team-frame".*data-material="empty-position-frames-after-reclassification".*不是把历史倒放/s);
 const rain=svg(232,'4-6',2);
 assert.deepEqual([...rain.matchAll(/data-round="([12])"/g)].map(m=>m[1]),['1','2']);
 assert.equal((rain.match(/80毫升/g)||[]).length,1);
 assert.match(rain,/B原位，不加.*水面平静，再同高度从侧面看.*孩子不碰湿杯/s);
 assert.match(svg(233,'4-6',3),/data-material="continuous-table-contact".*松手 → 观察.*再松手 → 观察.*书边一直贴桌.*干预如实记录/s);
 const turn=svg(234,'4-6',2);
 assert.deepEqual([...turn.matchAll(/data-planned-angle="(0|60|80)"/g)].map(m=>m[1]),['0','60','80']);
 assert.match(turn,/计划不是结果.*俯视：上盘转，轴不搬.*中心偏移如实记/s);
 assert.match(svg(236,'4-6',3),/data-material="one-face-interior-shared-edge-and-corner".*① 面内.*② 这条边.*③ 这个角.*轻指，不碰身体/s);
});
