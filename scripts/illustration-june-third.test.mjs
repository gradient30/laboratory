import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {renderActivityDiagram} from '../dist/diagrams.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))).experiments;
const source=fs.readFileSync(new URL('../dist/diagrams.js',import.meta.url),'utf8'),ctx={};
vm.runInNewContext(source.slice(source.indexOf('const juneThirdSources='),source.indexOf('function renderProtocolDiagram'))+';this.guards=juneThirdSources;',ctx);
const guards=ctx.guards,target=[];
for(const e of data)for(const[a,p]of Object.entries(e.ageProtocols))for(const[s,d]of p.diagrams.entries())if(guards[d.sceneKey])target.push({e,a,s,d});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const render=(day,age,step)=>renderActivityDiagram(data.find(e=>e.id===day),step-1,age);
test('six exact scene guards among all 5840 diagrams; original wording retained',()=>{
 let n=0,all=0;
 for(const e of data)for(const[a,p]of Object.entries(e.ageProtocols))for(const[s,d]of p.diagrams.entries()){
  const svg=renderActivityDiagram(e,s,a);all++;assert.equal(svg.includes('june-third-v1'),!!guards[d.sceneKey]);
  if(guards[d.sceneKey]){n++;for(const t of d.elements.filter(p=>p.type==='text'))assert.ok(svg.includes(esc(t.text)));}
 }
 assert.equal(all,5840);assert.equal(n,6);assert.deepEqual(target.reduce((m,x)=>(m[x.e.id]=(m[x.e.id]||0)+1,m),{}),{165:2,169:4});
});
test('description, geometry, text, element order and added content mutations fall back',()=>{
 for(const{e,a,s}of target)for(const mode of ['description','geometry','text','order','extra']){
  const c=structuredClone(e),d=c.ageProtocols[a].diagrams[s];
  if(mode==='description')d.description+=' changed';if(mode==='geometry')d.elements.find(p=>p.type==='rect').x+=.1;
  if(mode==='text')d.elements[0].text+=' changed';if(mode==='order')d.elements.reverse();if(mode==='extra')d.elements.push({...d.elements[0],y:299});
  assert.ok(!renderActivityDiagram(c,s,a).includes('june-third-v1'));
 }
});
test('unique SVG IDs, local references and finite geometry',()=>{
 const seen=new Set();for(const{e,a,s}of target){const svg=renderActivityDiagram(e,s,a);assert.ok(!/NaN|undefined/.test(svg));
 const ids=[...svg.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const id of ids){assert.ok(!seen.has(id));seen.add(id);}
 for(const ref of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(ref[1]));}
});
test('four chromatography assemblies: corrected 2 gap, 3 immersion, 5 water, 30 baseline, supported dry tape',()=>{
 let n=0;for(const{e,a,s,d}of target.filter(x=>x.e.id===165)){
  const svg=renderActivityDiagram(e,s,a);assert.equal((svg.match(/data-material="corrected-chromatography-assembly"/g)||[]).length,2);
  for(const dot of d.elements.filter(p=>p.type==='circle')){n++;const c=dot.x;
   for(const expected of [`x="${c-50}" y="138" width="100" height="132"`,`x="${c-15}" y="118" width="30" height="150"`,`x="${c-48}" y="265" width="96" height="5"`,`x="${c-75}" y="131" width="150" height="7"`,`data-bounds="${c-9},126,18,21"`,`cx="${c}" cy="238" r="3"`])assert.ok(svg.includes(expected),expected);
   assert.equal(138+132-(118+150),2);assert.equal(118+150-265,3);assert.equal(118+150-238,30);assert.equal(131+7,138);assert.equal(75-50,25);assert.ok(118+150-(126+21)>=115);
  }
  assert.ok(!svg.includes('data-observation-result'));
 }assert.equal(n,4);
});
test('youngest dishes: two gridded papers below two clear dishes in one tray, no invented water footprint',()=>{
 const svg=render(169,'4-6',1);for(const[type,n]of [['shared-catch-tray',1],['grid-paper-below-dish',2],['transparent-round-shallow-dish',2]])assert.equal((svg.match(new RegExp(`data-material="${type}"`,'g'))||[]).length,n);
 assert.equal((svg.match(/data-no-result-water="true"/g)||[]).length,2);assert.ok(svg.indexOf('grid-paper-below-dish')<svg.indexOf('transparent-round-shallow-dish'));
 assert.ok(!svg.includes('data-observation-result'));assert.ok(svg.includes('y="125"'));assert.ok(svg.includes('y="285"'));
});
test('two shallow dry kits retain a single folded cloth fully inside the C dish',()=>{
 const svg=render(169,'7-9',1);assert.equal((svg.match(/data-material="transparent-shallow-dish"/g)||[]).length,2);assert.equal((svg.match(/data-material="single-folded-cotton-cloth"/g)||[]).length,1);
 assert.ok(svg.includes('data-bounds="395,179,146,58"'));assert.ok(395>353&&395+146<353+230&&179>147&&179+58<147+112);
});
test('cold and room-temperature bottles retain two attached caps and no forecast condensation or liquid line',()=>{
 const svg=render(169,'10-12',1);assert.equal((svg.match(/data-material="closed-plastic-bottle"/g)||[]).length,2);
 for(const x of [123,419])assert.ok(svg.includes(`data-cap-bounds="${x},105,76,19"`));assert.ok(105+19>=123);
 for(const marker of ['data-condensation','data-waterline','data-observation-result'])assert.ok(!svg.includes(marker));
});
test('sealed system has one complete boundary, thin contained cloth, tray, cap and bottle pad contacting floor',()=>{
 const svg=render(169,'13-16',2);for(const type of ['closed-complete-system','transparent-shallow-dish','single-folded-cotton-cloth','closed-plastic-bottle','bottle-base-pad'])assert.equal((svg.match(new RegExp(`data-material="${type}"`,'g'))||[]).length,1);
 assert.ok(svg.includes('data-inner-floor-y="276"'));assert.ok(svg.includes('data-bounds="81,248,112,28"'));assert.ok(svg.includes('data-bounds="90,252,94,12"'));assert.ok(svg.includes('data-bounds="232,273,83,3"'));assert.ok(svg.includes('data-body-bounds="235,151,77,122"'));
 assert.equal(248+28,276);assert.equal(151+122,273);assert.equal(273+3,276);assert.ok(90>81&&90+94<81+112&&252>248&&252+12<248+28);assert.ok(235-(81+112)>0);assert.ok(348-(235+77)>0);
 assert.ok(!svg.includes('data-observation-result'));
});
