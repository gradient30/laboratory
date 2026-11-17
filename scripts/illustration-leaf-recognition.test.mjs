import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderActivityDiagram} from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
test('mint is ovate with serrated margins and paired veins, celery remains lobed',()=>{
 const e=rows[2];
 for(const age of ['4-6','7-9','10-12','13-16'])for(let step=0;step<4;step++){
  const svg=renderActivityDiagram(e,step,age);
  const leaves=e.ageProtocols[age].diagrams[step].elements.filter(el=>el.type==='circle'&&el.fill==='#A5CF92').length;
  const shape=age==='7-9'?'lobed-celery':'serrated-ovate-mint';
  assert.equal(svg.split(`data-leaf-shape="${shape}"`).length-1,leaves);
  if(leaves&&age!=='7-9')assert.ok(svg.includes('M0 .63 Q-.2 .5 -.34 .31'));
 }
});
test('recognition detail does not spread to other courses or changed source',()=>{
 const e=structuredClone(rows[2]);e.ageProtocols['4-6'].diagrams[0].description+=' modified';
 assert.doesNotMatch(renderActivityDiagram(e,0,'4-6'),/data-leaf-shape/);
 for(const e of rows.filter(x=>x.id!==3))for(const age of Object.keys(e.ageProtocols))for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/data-leaf-shape/);
});
