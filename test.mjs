import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderDiagram} from './dist/diagrams.js';
const data=JSON.parse(readFileSync('./dist/data.json','utf8'));
const ages=['4-6','7-9','10-12','13-16'];
assert.equal(data.experiments.length,30);
let diagrams=0, links=0;const hashes=new Set();
for(const [index,e] of data.experiments.entries()){
 assert.equal(e.id,index+1);assert.equal(e.steps.length,4);
 for(const field of ['title','domain','duration','question','safety','observations','explanation'])assert.ok(e[field]?.trim(),`${e.id} ${field}`);
 assert.ok(e.materials.length);assert.ok(e.extension?.steps.length);
 for(const s of e.sources){assert.equal(new URL(s.url).protocol,'https:');links++}
 const captions=[];
 for(const age of ages){
 const g=e.ageGuides[age];assert.ok(g?.goal);assert.ok(g.observe);assert.ok(g.recordFields.length);assert.equal(g.steps.length,4);assert.ok(e.ageTasks[age]);
 captions.push(g.steps.map(s=>s.caption).join('|'));
 for(let step=0;step<4;step++){
 assert.ok(g.steps[step].caption);assert.ok(g.steps[step].adultNote);
 const svg=renderDiagram(e.id,step,age);assert.ok(svg.startsWith('<svg'),`SVG ${e.id}/${step}/${age}`);assert.ok(svg.includes('viewBox="0 0 640 360"'));assert.ok(!/undefined|NaN/.test(svg));assert.ok(!/<script|<foreignObject|(?:href|src)=["']https?:/i.test(svg));
 assert.match(svg,/<title[ >]/);assert.match(svg,/<desc[ >]/);diagrams++;hashes.add(createHash('sha256').update(svg.replace(/science-diagram-\d+-\d+-\d+/g,'diagram').replace(/<title[^>]*>.*?<\/title>|<desc[^>]*>.*?<\/desc>/g,'')).digest('hex'));
 }
 }
 assert.equal(new Set(captions).size,4,`Age scaffolds must differ: day ${e.id}`);
}
const html=readFileSync('./dist/index.html','utf8'),js=readFileSync('./dist/app.js','utf8'),css=readFileSync('./dist/styles.css','utf8');
assert.match(html,/lang="zh-CN"/);assert.match(html,/<dialog/);assert.match(html,/type="module"/);assert.match(css,/prefers-reduced-motion/);assert.match(js,/localStorage/);assert.ok(!/https?:\/\//.test(js),'App must not send records externally');
assert.ok(readdirSync('./dist').every(f=>['index.html','styles.css','app.js','data.json','diagrams.js'].includes(f)));
console.log(JSON.stringify({status:'passed',experiments:30,ageModes:4,illustratedVariants:diagrams,distinctRenderedArtwork:hashes.size,sourceLinks:links,outputFiles:readdirSync('./dist'),scope:'Data integrity, age-scaffold uniqueness, SVG output, static privacy/accessibility contracts. Browser QA is separate.'},null,2));
