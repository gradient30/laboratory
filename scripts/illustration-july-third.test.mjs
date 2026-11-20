import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const targets=[[194,'4-6',2],[195,'4-6',2],[197,'4-6',2],[198,'4-6',3],[199,'7-9',2]];
const marker='data-material-batch="july-third-v1"';
const get=d=>data.find(e=>e.id===d);
const render=(d,a,s)=>renderActivityDiagram(get(d),s-1,a);
test('July third scenes match only five pinned slots and retain authored text',()=>{
 const expected=new Set(targets.map(x=>x.join(':')));let count=0;
 for(const e of data)for(const [a,p] of Object.entries(e.ageProtocols))for(const [i,s] of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,i,a),key=[e.id,a,i+1].join(':');
  assert.equal(svg.includes(marker),expected.has(key),key);
  if(expected.has(key))for(const el of s.elements.filter(x=>x.type==='text'))assert.ok(svg.includes(el.text),el.text);
  count++;
 }
 assert.equal(count,5840);
});
test('July third exact source guards still fall back after edits',()=>{
 for(const [d,a,s] of targets)for(const mutate of [x=>x.description+=' 新版',x=>x.elements[0].x+=.5,x=>x.elements.reverse()]){
  const e=structuredClone(get(d));mutate(e.ageProtocols[a].diagrams[s-1]);
  assert.ok(!renderActivityDiagram(e,s-1,a).includes(marker));
 }
});
test('July third shows physical actions while preserving original evidence boundaries',()=>{
 const angle=render(194,'4-6',2);
 assert.match(angle,/data-material="fixed-base-origin-and-directions".*data-material="opaque-right-mask".*左边对准 x=14.*data-material="transparent-origin-and-base-guide"/s);
 const spider=render(195,'4-6',2);
 assert.match(spider,/data-material="same-printed-photo-placeholder".*data-material="opaque-sheet-over-photo-lower-part".*不猜遮住的足/s);
 assert.doesNotMatch(spider,/<image\b|<path\b/);
 const cloud=render(197,'4-6',2);
 assert.match(cloud,/data-material="unchanged-photo-screen".*data-material="same-record-adult-left-column-covered".*另一整张 A4.*不向孩子说或暗示自己的选择/s);
 assert.doesNotMatch(cloud,/<image\b/);
 assert.match(render(198,'4-6',3),/data-material="same-empty-tub-before-and-after".*整纸遮住.*回到同一位置.*揭开标志不等于取得投放许可/s);
 assert.match(render(199,'7-9',2),/data-material="adult-vertical-card-hole-height-setup".*尺先移出.*data-material="wait-then-flat-hole-on-target-paper".*纸已移动或孔翘起，记缺测/s);
});
