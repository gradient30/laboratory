import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const {experiments:data}=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));
const targets=[[219,'7-9',2],[220,'4-6',2],[221,'4-6',2],[222,'4-6',2],[224,'4-6',2]];
const marker='data-material-batch="august-second-v1"';
const get=d=>data.find(e=>e.id===d);
const svg=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('August second illustrations affect only five exact scenes and preserve authored text',()=>{
 const wanted=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const r=renderActivityDiagram(e,i,a);
  const key=[e.id,a,i+1].join(':');
  assert.equal(r.includes(marker),wanted.has(key),key);
  if(wanted.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(r.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('August second exact overlays fall back if description or geometry changes',()=>{
 for(const [d,a,s] of targets)for(const alter of [x=>x.description+=' 修改',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));alter(e.ageProtocols[a].diagrams[s-1]);assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('August second preserves sheet identity, fixed apparatus and original event labels',()=>{
 assert.match(svg(219,'7-9',2),/D 正面.*同张 D 背面.*PS／TS 背面.*背面留空.*PD、TD 各自翻面/s);
 const lamps=svg(220,'4-6',2);
 assert.deepEqual([...lamps.matchAll(/data-lights="(left-only|both)"/g)].map(m=>m[1]),['left-only','both']);
 assert.match(lamps,/等5秒.*同一张卡、同一个纸屏/s);
 const backdrop=svg(221,'4-6',2);
 assert.deepEqual([...backdrop.matchAll(/data-background="(white|blue)"/g)].map(m=>m[1]),['white','blue']);
 assert.match(backdrop,/干燥大蓝卡.*眼位与照明保持.*实际原话/s);
 assert.match(svg(222,'4-6',2),/data-turn="start".*data-turn="quarter".*K 仍对 O.*实际看到后才记/s);
 assert.match(svg(224,'4-6',2),/data-material="selected-folder-slot-empty-and-two-still-closed".*原位暂空.*着陆 · 20日.*溅落 · 24日.*data-material="one-folded-sheet-opens-then-returns".*发射 · 16日.*地球出发.*合上，再放回/s);
});
