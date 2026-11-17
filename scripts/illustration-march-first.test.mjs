import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{renderActivityDiagram}from '../dist/diagrams.js';
const rows=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments,ages=['4-6','7-9','10-12','13-16'],pending=new Set(['order60-46-observe','order60-79-time','order60-79-repeat','order60-1012-stage','order60-1316-observe','order60-1316-limits']);
const count=(s,m)=>s.split(m).length-1,esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('March first scene locks preserve all source labels, material bounds, arrows, guide lines and grains',()=>{
 for(const id of[60,61])for(const a of ages)for(let step=0;step<4;step++){
 const e=rows[id-1],scene=e.ageProtocols[a].diagrams[step],svg=renderActivityDiagram(e,step,a);assert.match(svg,/march-first-v1/);
 for(const p of scene.elements){
 if(p.type==='text')assert.ok(svg.includes(esc(p.text)));
 if(['line','arrow'].includes(p.type))assert.ok(svg.includes(`x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"`));
 if(p.type==='rect')assert.ok(svg.includes(`x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"`)||svg.includes(`data-bounds="${p.x},${p.y},${p.width},${p.height}"`));
 if(p.type==='circle')assert.ok(svg.includes(`cx="${p.x}" cy="${p.y}" r="${p.r}"`));
 }
 const c=structuredClone(e);c.ageProtocols[a].diagrams[step].description+=' changed';assert.doesNotMatch(renderActivityDiagram(c,step,a),/march-first-v1/);
 }
 for(const e of rows.filter(e=>![60,61].includes(e.id)))for(const a of ages)for(let s=0;s<4;s++)assert.doesNotMatch(renderActivityDiagram(e,s,a),/march-first-v1/);
});
test('only true observation scenes gain unknown placeholders, without covering spoon or fabricating residual sugar',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[59].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[59],s,a),waters=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#DAE4E2'),spoons=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#C6CFCE');
 assert.equal(count(svg,'data-observation="unrecorded"'),pending.has(scene.sceneKey)?waters.length:0);
 assert.equal(count(svg,'<circle '),scene.elements.filter(p=>p.type==='circle').length);
 assert.equal(count(svg,'data-material="rounded-plastic-spoon"'),spoons.length);
 for(const p of spoons){assert.ok(p.y+p.height<280);const w=waters.find(w=>p.x>w.x&&p.x<w.x+w.width);assert.ok(w);assert.ok(w.x+110<p.x);assert.ok(p.y>w.y);}
 }
});
test('all six paper cards stay in original drawn regions and masks remain opaque and above hidden cards',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[60].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[60],s,a),cards=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#C6DDD2'),regions=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#F8F3E5'),covers=scene.elements.filter(p=>p.type==='rect'&&p.fill==='#E4CEAB');
 assert.equal(cards.length,6);assert.equal(count(svg,'data-material="counting-paper-card"'),6);assert.equal(count(svg,'data-material="drawn-paper-region"'),regions.length);assert.equal(count(svg,'data-material="opaque-cover-paper"'),covers.length);
 for(const p of cards)assert.ok(regions.some(r=>p.x>r.x&&p.y>r.y&&p.x+p.width<r.x+r.width&&p.y+p.height<r.y+r.height));
 for(const cover of covers){assert.ok(svg.indexOf('data-material="opaque-cover-paper"')>svg.lastIndexOf('data-material="counting-paper-card"'));assert.match(svg,/fill="#F1E8D7"/);}
 }
});
test('numbered card identity is neither duplicated nor introduced into younger quantity-only tasks',()=>{
 for(const a of ages)for(let s=0;s<4;s++){
 const scene=rows[60].ageProtocols[a].diagrams[s],svg=renderActivityDiagram(rows[60],s,a);
 const ids=scene.elements.filter(p=>p.type==='text'&&/^[1-6]$/.test(p.text)).map(p=>p.text);
 if(a==='13-16')assert.deepEqual([...ids].sort(),['1','2','3','4','5','6']);else assert.equal(ids.length,0);
 for(const n of ['1','2','3','4','5','6'])assert.equal(count(svg,`>${n}</text>`),ids.includes(n)?1:0);
 }
});
