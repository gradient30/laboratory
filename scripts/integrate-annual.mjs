/** Maintainer utility: only reviewed local arrays; never fetches, renumbers an existing year, or publishes. */
import {readFileSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';
import assert from 'node:assert/strict';
const args=process.argv.slice(2),refresh=args.includes('--refresh-reviewed'),files=args.filter(s=>s!=='--refresh-reviewed');assert.ok(files.length,'Pass reviewed JSON array file paths.');
const data=JSON.parse(readFileSync('dist/data.json','utf8')),annualAlreadyBuilt=data.meta.identityRegistryVersion===1;
assert.ok(!annualAlreadyBuilt||refresh,'Annual IDs already frozen. Use --refresh-reviewed only for same-key reviewed corrections; never redistribute IDs.');
const base=data.experiments.slice(0,30).map(e=>({...e,contentKey:`legacy-${String(e.id).padStart(3,'0')}`}));assert.equal(base.length,30);
const additions=files.flatMap(file=>{const rows=JSON.parse(readFileSync(file,'utf8'));assert.ok(Array.isArray(rows),file);return rows.map((e,i)=>({...e,contentKey:e.contentKey||`${basename(file,'.json')}-${e.id??i+1}`}))});
assert.equal(additions.length,335,'Exactly335 reviewed additions are needed; do not publish placeholders.');assert.equal(new Set(additions.map(e=>e.contentKey)).size,335,'Content keys must be unique.');
let ordered;
if(annualAlreadyBuilt){
 const incoming=new Map(additions.map(e=>[e.contentKey,e]));
 assert.deepEqual([...incoming.keys()].sort(),data.experiments.slice(30).map(e=>e.contentKey).sort(),'Refresh must keep every existing content identity. Additions/removals need a separate migration.');
 ordered=data.experiments.slice(30).map(old=>({...incoming.get(old.contentKey),id:old.id,day:old.day,contentKey:old.contentKey}));
}else{
 const categories=['physics','chemistry','maths','biology','history','geography','everyday'];
 const groups=Object.fromEntries(categories.map(c=>[c,additions.filter(e=>e.category===c)]));assert.equal(Object.values(groups).reduce((sum,a)=>sum+a.length,0),335,'Unknown category');
 ordered=[];while(ordered.length<335)for(const category of categories)if(groups[category].length)ordered.push(groups[category].shift());
 ordered.forEach((e,i)=>{e.id=i+31;e.day=String(e.id).padStart(2,'0')});
}
data.experiments=[...base,...ordered];
data.meta={...data.meta,title:'12个月，动手看见世界',subtitle:'365个主活动 · 每日可选1个延伸 · 七类跨学科探究 · 四个年龄入口',description:'生活中的问题值得慢慢探索。每月是课程顺序，不要求连续打卡；根据兴趣、材料和成人陪伴情况自由选择。',scheduleNote:'365天为12个课程月的活动顺序，不绑定公历月份。等待日只记录变化也算当天活动；可跳过、重复或分多天完成。',reviewedAt:'2026-10-23',version:'3.0-annual-inquiry',identityRegistryVersion:1,curriculumMonths:[31,28,31,30,31,30,31,31,30,31,30,31],subjects:{physics:'物理',chemistry:'化学',maths:'数学',biology:'生物',history:'历史',geography:'地理',everyday:'生活常识'},reviewScope:'来源与文本交叉核查；未实地试做，非机构认证、真人专家签字或法律合规认证。'};
writeFileSync('dist/data.json',JSON.stringify(data,null,2)+'\n');
if(!annualAlreadyBuilt)writeFileSync('scripts/activity-identities.json',JSON.stringify(Object.fromEntries(data.experiments.map(e=>[e.id,e.contentKey])),null,2)+'\n');
console.log(refresh?'Refreshed reviewed content while preserving frozen IDs.':'Integrated365 activities and froze identity registry. Run full checks and independent review before release.');
