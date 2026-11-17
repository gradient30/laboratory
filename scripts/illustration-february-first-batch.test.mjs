import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const ages=['4-6','7-9','10-12','13-16'];
test('every authored sock stays one object at its original position; relation labels preserved',()=>{
 const e=rows[32];for(const age of ages)for(let s=0;s<4;s++){
  const scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age),socks=scene.elements.filter(x=>x.type==='rect'&&x.width===20&&x.height===28);
  assert.equal(svg.split('data-material="single-knit-sock"').length-1,socks.length);
  for(const p of socks)assert.ok(svg.includes(`transform="translate(${p.x} ${p.y})"`));
  for(const p of scene.elements.filter(x=>x.type==='text'))assert.ok(svg.includes(p.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));
 }
});
test('February material source guards reject changed scenes and never style another day',()=>{
 for(const id of [32,33]){const e=structuredClone(rows[id-1]);e.ageProtocols['4-6'].diagrams[0].description+=' changed';assert.doesNotMatch(renderActivityDiagram(e,0,'4-6'),/february-(sugar|socks)-v1/);}
 for(const e of rows.filter(e=>![32,33].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(sugar|socks)-v1/);
});
test('February sugar preserves each material portion and every label; four portions are trays not cubes',()=>{
 const e=rows[31];for(const age of ages)for(let s=0;s<4;s++){
 const scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.match(svg,/february-sugar-v1/);
 for(const p of scene.elements.filter(x=>x.type==='text'))assert.ok(svg.includes(p.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));
 const pieces=scene.elements.filter(x=>x.type==='rect'&&x.fill==='#FFFDF2').length;
 const drawn=['whole-sugar-cube','coarse-sugar-fragment','portion-paper-tray'].reduce((n,m)=>n+svg.split(`data-material="${m}"`).length-1,0);assert.equal(drawn,pieces);
 if(scene.sceneKey==='sugar-1316-plan'||scene.sceneKey==='sugar-1316-add')assert.equal(svg.split('data-material="portion-paper-tray"').length-1,4);
 }
});
