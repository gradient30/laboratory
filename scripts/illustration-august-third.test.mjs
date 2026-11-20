import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[225,'4-6',2],[226,'4-6',2],[228,'4-6',4],[229,'4-6',2],[230,'4-6',3]];
const marker='data-material-batch="august-third-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('August third applies overlays to five exact authored scenes and retains all authored labels',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('August third overlays fall back after authored description or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('August third keeps sequential movement, originals, safe operations and record limits visible',()=>{
 const thermometer=svg(225,'4-6',2);
 assert.deepEqual([...thermometer.matchAll(/data-story-stage="([0-2])"/g)].map(m=>m[1]),['0','1','2']);
 assert.match(thermometer,/先移「当前」.*再移「到目前最大」.*没有测量现实室温/s);
 assert.match(svg(226,'4-6',2),/data-material="open-original-tuck-tab".*data-material="same-carton-existing-creases".*不开刀、不拆胶缝、不压坏.*卡住或撕裂就停/s);
 const labels=svg(228,'4-6',4);
 assert.deepEqual([...labels.matchAll(/data-cup="([WV])"/g)].map(m=>m[1]),['W','V']);
 assert.match(labels,/清水 W.*勿饮用.*＋I.*稀释白醋 V.*勿饮用.*＋I.*不按颜色猜回名字/s);
 assert.match(svg(229,'4-6',2),/data-material="four-paper-edges-and-center-check".*看中央四个角.*边靠边，不让纸相互盖住.*裁边小缝和成人帮助如实记/s);
 assert.match(svg(230,'4-6',3),/data-material="same-cloth-one-active-transfer".*第一边.*这一步.*同一块布.*箭头尾H、头C.*不是测出全部能量都给了下一级/s);
});
