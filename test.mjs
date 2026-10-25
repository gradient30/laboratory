import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderActivityDiagram} from './dist/diagrams.js';
const data=JSON.parse(readFileSync('./dist/data.json','utf8'));
const ages=['4-6','7-9','10-12','13-16'];
assert.equal(data.experiments.length,365);
const identities=JSON.parse(readFileSync('./scripts/activity-identities.json','utf8'));
assert.deepEqual(Object.fromEntries(data.experiments.map(e=>[e.id,e.contentKey])),identities,'Frozen activity IDs must not be reassigned to different content');
assert.equal(new Set(data.experiments.map(e=>e.contentKey)).size,365);
const categories=new Set(['physics','chemistry','maths','biology','history','geography','everyday']);
const visualKinds=new Set(['compare','measure','pattern','map','timeline','evidence','plant','water','light','structure','sort','flow']);
const titleSet=new Set(),procedures=new Set(),counts={};
const originalTitles=JSON.parse(readFileSync('./scripts/original-titles.json','utf8'));
assert.deepEqual(data.experiments.slice(0,30).map(e=>e.title),originalTitles,'Original day IDs must retain their activity identity');

let diagrams=0, links=0;const hashes=new Set();
for(const [index,e] of data.experiments.entries()){
 assert.equal(e.id,index+1);assert.equal(Number(e.day),e.id);assert.equal(e.steps.length,4);
 assert.ok(!titleSet.has(e.title),`Duplicate title ${e.id}`);titleSet.add(e.title);
 const procedure=e.steps.map(s=>s.detail.replace(/\s+/g,'')).join('|');assert.ok(!procedures.has(procedure),`Duplicate full procedure ${e.id}`);procedures.add(procedure);
 assert.ok(categories.has(e.category),`Unknown category ${e.id}`);counts[e.category]=(counts[e.category]||0)+1;
 for(const key of ['problem','solve','learn','evolve','limits'])assert.ok(e.inquiry?.[key]?.trim(),`Missing inquiry ${e.id}/${key}`);
 assert.ok(['source-reviewed','reviewed-with-limitations'].includes(e.review?.status),`Invalid review status ${e.id}`);
 assert.match(e.review.checkedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(e.review.method?.trim());assert.ok(e.review.limitations?.trim());
 assert.ok(e.sources.length>0,`No evidence source ${e.id}`);
 if(e.id>30){assert.ok(visualKinds.has(e.visual?.kind),`Missing visual kind ${e.id}`);assert.equal(e.visual.labels.length,4);for(const label of e.visual.labels)assert.ok(label.trim());}
 for(const step of e.steps){for(const field of ['title','shortText','detail'])assert.ok(step[field]?.trim(),`${e.id} step ${field}`);assert.ok(['adult','child','together'].includes(step.actor));}

 for(const field of ['title','domain','duration','question','safety','observations','explanation'])assert.ok(e[field]?.trim(),`${e.id} ${field}`);
 assert.ok(e.materials.length);assert.ok(e.extension?.steps.length);
 for(const s of e.sources){assert.equal(new URL(s.url).protocol,'https:');links++}
 const captions=[];
 for(const age of ages){
 const g=e.ageGuides[age];assert.ok(g?.goal);assert.ok(g.observe);assert.ok(g.recordFields.length);assert.equal(g.steps.length,4);assert.ok(e.ageTasks[age]);
 captions.push(JSON.stringify({goal:g.goal,observe:g.observe,recordFields:g.recordFields,control:g.control,support:g.support,steps:g.steps}));
 for(let step=0;step<4;step++){
 assert.ok(g.steps[step].caption);assert.ok(g.steps[step].adultNote);
 const svg=renderActivityDiagram(e,step,age);assert.ok(svg.startsWith('<svg'),`SVG ${e.id}/${step}/${age}`);assert.ok(svg.includes('viewBox="0 0 640 360"'));assert.ok(!/undefined|NaN/.test(svg));assert.ok(!/<script|<foreignObject|(?:href|src)=["']https?:/i.test(svg));
 assert.match(svg,/<title[ >]/);assert.match(svg,/<desc[ >]/);diagrams++;hashes.add(createHash('sha256').update(svg.replace(/science-diagram-\d+-\d+-\d+/g,'diagram').replace(/<title[^>]*>.*?<\/title>|<desc[^>]*>.*?<\/desc>/g,'')).digest('hex'));
 }
 }
 assert.equal(new Set(captions).size,4,`Age scaffolds must differ: day ${e.id}`);
}
assert.deepEqual(new Set(Object.keys(counts)),categories);
const html=readFileSync('./dist/index.html','utf8'),js=readFileSync('./dist/app.js','utf8'),css=readFileSync('./dist/styles.css','utf8');
assert.match(html,/lang="zh-CN"/);assert.match(html,/<dialog/);assert.match(html,/type="module"/);assert.match(css,/prefers-reduced-motion/);assert.match(js,/localStorage/);assert.ok(!/https?:\/\//.test(js),'App must use same-origin authenticated APIs, never external record endpoints');
assert.ok(readdirSync('./dist').every(f=>['index.html','styles.css','app.js','data.json','diagrams.js'].includes(f)));
console.log(JSON.stringify({status:'passed',experiments:365,categories:counts,ageModes:4,illustratedVariants:diagrams,distinctRenderedArtwork:hashes.size,sourceLinks:links,outputFiles:readdirSync('./dist'),scope:'Data integrity, exact duplicate detection (not semantic fact validation), age-scaffold uniqueness, SVG rendering, static privacy/accessibility contracts. Source accuracy and browser QA require separate review.'},null,2));

// Pure scheduling helpers are tested without importing browser-side effects.
import vm from 'node:vm';
const helperSource=js.slice(js.indexOf('const monthLengths='),js.indexOf('const safeURL='));
const context=vm.createContext({Date,Number,String});vm.runInContext(helperSource+';globalThis.helpers={monthForDay,dateOrdinal,validLocalDate};',context);
const h=context.helpers;
assert.equal(h.monthForDay(1),1);assert.equal(h.monthForDay(31),1);assert.equal(h.monthForDay(32),2);assert.equal(h.monthForDay(365),12);
assert.equal(h.dateOrdinal('2026-03-09')-h.dateOrdinal('2026-03-08'),1,'DST transitions are calendar days');
assert.equal(h.dateOrdinal('2026-11-02')-h.dateOrdinal('2026-11-01'),1);
assert.equal(h.dateOrdinal('2028-03-01')-h.dateOrdinal('2028-02-28'),2);
assert.equal(h.validLocalDate('2026-02-30'),false);assert.equal(h.validLocalDate('2028-02-29'),true);
assert.match(js,/const KEY='little-lab-v2'/);assert.match(js,/littleLabDialog/);
assert.match(html,/id="map-month"/);assert.match(html,/id="map-search"/);
for(const key of categories)assert.ok(html.includes(`data-filter="${key}"`));
console.log('Annual schedule, legacy storage key, category labels, navigation contracts passed.');

const frozenLegacySchemas=JSON.parse(readFileSync('./scripts/legacy-record-schemas.json','utf8'));
const embeddedLegacySchemas=JSON.parse(js.match(/const legacyRecordSchemas=(\{[^\n]+\});/)[1]);
assert.deepEqual(embeddedLegacySchemas,frozenLegacySchemas,'Legacy labels must remain exact, not merely keep positional values');
for(const category of categories){const e=data.experiments.find(x=>x.id>30&&x.category===category);for(const age of ages){const svg=renderActivityDiagram(e,3,age);for(const field of e.ageGuides[age].recordFields.slice(0,4))assert.ok(svg.includes(field.slice(0,17).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')),`Record drawing must use actual age fields ${e.id}/${age}/${field}`)}}
console.log('Exact legacy field schema and age-specific SVG recording prompts passed.');
