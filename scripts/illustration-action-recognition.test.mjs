import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {renderActivityDiagram} from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
test('January ruler material is plastic in all ages; only held step shows prescribed bend',()=>{
 for(const age of ['4-6','7-9','10-12','13-16'])for(let step=0;step<4;step++){
  const svg=renderActivityDiagram(rows[8],step,age);assert.match(svg,/data-material="flexible-plastic-ruler"/);
  assert.equal(svg.includes('data-action="held-small-bend"'),age==='4-6'&&step===1);
  assert.equal(svg.includes('data-action="finger-holds-free-end"'),age==='4-6'&&step===1);
  if(age==='4-6'&&step===1){assert.match(svg,/轻弯示意，非比例/);assert.match(svg,/保持，不摇动/);}
 }
});
test('source modifications fall back rather than apply action art to unreviewed steps',()=>{
 for(const [id,marker]of [[9,'flexible-plastic-ruler'],[30,'spoon-under-paper']]){
 const e=structuredClone(rows[id-1]);e.ageProtocols['4-6'].diagrams[1].description+=' changed';assert.ok(!renderActivityDiagram(e,1,'4-6').includes(marker));
 }
});
test('youngest beak activity shows distinct contact actions only in the matching steps',()=>{
 for(const age of ['4-6','7-9','10-12','13-16'])for(let step=0;step<4;step++){
 const svg=renderActivityDiagram(rows[29],step,age);
 assert.equal(svg.includes('data-action="spoon-under-paper"'),age==='4-6'&&step===1);
 assert.equal(svg.includes('data-action="rounded-tongs-around-paper"'),age==='4-6'&&step===2);
 }
});
