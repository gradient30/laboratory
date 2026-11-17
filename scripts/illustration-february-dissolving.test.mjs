import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const ages=['4-6','7-9','10-12','13-16'],count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('stirring spoons keep original bowl bounds and dry sugar remains only on source trays',()=>{
 for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[45],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age),bowls=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#CDD7D6');assert.equal(count(svg,'data-material="rounded-spoon-bowl"'),bowls.length);
 for(const p of bowls)assert.ok(svg.includes(`data-bounds="${p.x},${p.y},${p.width},${p.height}"`));
 assert.equal(count(svg,'data-material="dry-sugar-paper-tray"'),scene.elements.filter(p=>p.type==='rect'&&p.fill==='#F2EEE4').length);
 }
});
test('dissolving material styles keep labels, exact scene guards and unique gradient IDs',()=>{
 for(const id of[39,46])for(const age of ages)for(let s=0;s<4;s++){
 const e=rows[id-1],scene=e.ageProtocols[age].diagrams[s],svg=renderActivityDiagram(e,s,age);assert.match(svg,/february-(residue|stir)-v1/);for(const p of scene.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(p.text)));
 const again=renderActivityDiagram(e,s,age);for(const m of svg.matchAll(/id="([^"]+)"/g))assert.ok(!again.includes(`id="${m[1]}"`));
 const c=structuredClone(e);c.ageProtocols[age].diagrams[s].description+=' changed';assert.doesNotMatch(renderActivityDiagram(c,s,age),/february-(residue|stir)-v1/);
 }
 for(const e of rows.filter(e=>![39,46].includes(e.id)))for(const age of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,age),/february-(residue|stir)-v1/);
});
test('whole-system weighing spoons lie on their own tray and are not added to partial systems',()=>{
 const expected=['sugar39-1012-system','sugar39-1012-before','sugar39-1012-after','sugar39-1012-repeat','sugar39-1316-system','sugar39-1316-total'];const seen=[];
 for(const age of ages)for(let step=0;step<4;step++){const e=rows[38],scene=e.ageProtocols[age].diagrams[step],svg=renderActivityDiagram(e,step,age);const n=count(svg,'data-action="spoon-rests-on-system-tray"');assert.equal(n,expected.includes(scene.sceneKey)?1:0);if(n){seen.push(scene.sceneKey);assert.ok(svg.includes('M238 269H268'));}}
 assert.deepEqual(seen,expected);
});
