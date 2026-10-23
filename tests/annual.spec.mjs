import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const {experiments}=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url),'utf8'));
const subjects=['physics','chemistry','maths','biology','history','geography','everyday'];
const localDate=()=>new Date().toISOString().slice(0,10);
async function seed(page,record){await page.addInitScript(value=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem('little-lab-v2',typeof value==='string'?value:JSON.stringify(value));sessionStorage.setItem('qa-seeded','yes')}},record)}
async function ready(page){await page.goto('/');await expect(page.locator('#begin')).toBeVisible()}
async function choose(page,id){await page.locator('.map-trigger').first().click();await expect(page.locator('#day-map')).toBeVisible();await page.locator('#map-month').selectOption('all');await page.locator('[data-filter="all"]').click();await page.locator('#map-search').fill(String(id));await page.locator(`#map-grid [data-day="${id}"]`).click();await expect(page.locator('#day-map')).not.toBeVisible();await expect(page.locator('#day-number')).toContainText('DAY '+experiments[id-1].day+' / 365');await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null)}
test('annual navigation, subject badges, inquiry and month boundaries',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 await page.locator('.map-trigger').first().click();await expect(page.locator('.map-day')).toHaveCount(31);
 await page.locator('#map-month').selectOption('2');await expect(page.locator('.map-day')).toHaveCount(28);
 await page.locator('#map-month').selectOption('all');await expect(page.locator('.map-day')).toHaveCount(365);
 for(const category of subjects){await page.locator(`[data-filter="${category}"]`).click();await expect(page.locator('.map-day')).toHaveCount(experiments.filter(e=>e.category===category).length)}
 await page.locator('#map-search').fill('不存在的测试主题XYZ');await expect(page.locator('.empty-map')).toBeVisible();
 await page.locator('#close-map').click();await expect(page.locator('#day-map')).not.toBeVisible();
 for(const id of [1,30,31,32,59,60,334,335,365]){await choose(page,id);await expect(page.locator('.experiment-top .category-badge')).toBeVisible();await expect(page.locator('.inquiry-grid article')).toHaveCount(4)}
 await expect(page.locator('#day-next')).toBeDisabled();await expect(page.locator('#day-prev')).toBeEnabled();expect(errors).toEqual([]);
});
test('each subject and age has safe four-step guidance, zoom and Back/Escape',async({page})=>{
 test.setTimeout(90000);await ready(page);
 for(const subject of subjects){const id=experiments.find(e=>e.category===subject&&e.id>30).id;await choose(page,id);
  for(const age of ['4-6','7-9','10-12','13-16']){await page.locator(`[data-age="${age}"]`).click();await expect(page.locator('#begin')).toBeDisabled();await expect(page.locator('#step-next')).toBeDisabled();await page.locator('#preview-steps').click();const g=experiments[id-1].ageGuides[age];if(g.control)await expect(page.locator('.age-control-note')).toContainText(g.control);if(g.support)await expect(page.locator('.age-support')).toContainText(g.support);await page.locator('.extension summary').click();if(experiments[id-1].extension.ageNote)await expect(page.locator('.extension-age-note')).toContainText(experiments[id-1].extension.ageNote);
   for(let step=0;step<4;step++){await page.locator(`[data-step="${step}"]`).click();await expect(page.locator('#step-stage svg title')).toHaveText(new RegExp(`第${step+1}步`));const core=experiments[id-1].steps[step].detail,action=experiments[id-1].ageGuides[age].steps[step].action;if(!action.includes(core))await expect(page.locator('.step-detail')).toHaveText(core);else await expect(page.locator('.step-detail')).toHaveCount(0);await expect(page.locator('.age-action')).toContainText(action)}
  }
 }
 await page.locator('#zoom-diagram').click();await expect(page.locator('#diagram-dialog')).toBeVisible();await page.goBack();await expect(page.locator('#diagram-dialog')).not.toBeVisible();
 await page.locator('#zoom-diagram').click();await page.keyboard.press('Escape');await expect(page.locator('#diagram-dialog')).not.toBeVisible();
 await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#zoom-diagram').click();await page.locator('#close-diagram').click();await expect(page.locator('#diagram-dialog')).not.toBeVisible();
});
test('adult preparation is a gate and relocks when conditions change',async({page})=>{
 await ready(page);await page.locator('[data-check="0"]').check();await page.locator('[data-check="1"]').check();await expect(page.locator('#begin')).toBeDisabled();await page.locator('[data-check="2"]').check();await expect(page.locator('#begin')).toBeEnabled();await page.locator('#begin').click();await expect(page.locator('#step-next')).toBeEnabled();await page.locator('[data-check="1"]').uncheck();await expect(page.locator('#step-next')).toBeDisabled();
});
test('legacy day1/day30 records survive annual upgrade and day365 persists',async({page})=>{
 await seed(page,{startDate:localDate(),lastOpenDate:localDate(),day:30,age:'7-9',records:{'1:4-6':{spoken:'QA legacy first day'},'30:7-9':{field0:'QA legacy day30'}},completed:{'1:4-6':true,'30:7-9':true},steps:{'30:7-9':2}});await ready(page);
 await expect(page.locator('[data-field="field0"]')).toHaveValue('QA legacy day30');await expect(page.locator('#step-counter')).toContainText('3');
 await choose(page,1);await page.locator('[data-age="4-6"]').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('QA legacy first day');
 await choose(page,365);await page.locator('[data-age="7-9"]').click();await page.locator('[data-field="field0"]').fill('QA final day');await page.reload();await expect(page.locator('[data-field="field0"]')).toHaveValue('QA final day');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-lab-v2')));expect(stored.records['1:4-6'].spoken).toBe('QA legacy first day');expect(stored.records['30:7-9'].field0).toBe('QA legacy day30');expect(stored.records['365:7-9'].field0).toBe('QA final day');
});
test('invalid JSON and malformed per-record storage recover without crash',async({page})=>{
 await seed(page,'{not valid');await ready(page);await expect(page.locator('#day-number')).toContainText('/ 365');
 await page.evaluate(()=>{localStorage.setItem('little-lab-v2',JSON.stringify({day:365,age:'7-9',records:{'365:7-9':'bad'},steps:{'365:7-9':1.5},completed:[]}))});await page.reload();await expect(page.locator('[data-field="field0"]')).toBeVisible();await page.locator('[data-field="field0"]').fill('recovered');await expect(page.locator('#step-counter')).toHaveText('1 / 4 步');
});
test('out of range and future-date recommendations stay bounded',async({page})=>{
 await seed(page,{day:366,age:'4-6',startDate:localDate(),lastOpenDate:localDate()});await ready(page);await expect(page.locator('#day-number')).toContainText('DAY 365 / 365');
 await page.evaluate(()=>localStorage.setItem('little-lab-v2',JSON.stringify({startDate:'2099-01-01',lastOpenDate:'2000-01-01'})));await page.reload();await expect(page.locator('#day-number')).toContainText('DAY 01 / 365');
});
test('no horizontal page overflow; interactive controls retain readable access',async({page})=>{
 await ready(page);for(const id of [1,365,experiments.find(e=>e.category==='history').id]){await choose(page,id);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.category-badge').first()).toHaveText(/物理|化学|数学|生物|历史|地理|生活常识/)}
 await page.locator('.map-trigger').first().click();expect(await page.evaluate(()=>document.querySelector('#day-map').getBoundingClientRect().width<=innerWidth)).toBe(true);
});

test('storage refusal does not prevent reading safe activity guidance',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked for QA','SecurityError')}}));await ready(page);await page.locator('#preview-steps').click();await expect(page.locator('#step-next')).toBeEnabled();await expect(page.locator('#save-status')).toContainText('不能保存');
});

test('changed legacy teenager fields are archived under original labels exactly once',async({page})=>{
 const schemas=JSON.parse(readFileSync(new URL('../scripts/legacy-record-schemas.json',import.meta.url),'utf8'));
 const records=Object.fromEntries(Object.entries(schemas).map(([key,labels])=>[key,Object.fromEntries(labels.map((label,i)=>[`field${i}`,`QA ${key}: ${label}`]))]));
 await seed(page,{startDate:localDate(),lastOpenDate:localDate(),day:1,age:'13-16',records,completed:{'1:13-16':true},steps:{'1:13-16':3}});await ready(page);
 for(const [key,labels] of Object.entries(schemas)){await choose(page,Number(key.split(':')[0]));const archive=page.locator('.legacy-record');await expect(archive).toBeVisible();await expect(archive.locator('dt')).toHaveText(labels);await expect(archive.locator('dd')).toHaveText(labels.map(label=>`QA ${key}: ${label}`));await expect(page.locator('[data-field="field0"]')).toHaveValue('')}
 await page.locator('[data-field="field0"]').fill('QA new-schema answer');await page.reload();await expect(page.locator('[data-field="field0"]')).toHaveValue('QA new-schema answer');const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-lab-v2')));expect(stored.recordSchemaVersion).toBe(3);expect(Object.keys(stored.legacyRecords)).toHaveLength(8);expect(stored.completed['1:13-16']).toBe(true);expect(stored.legacyRecords['1:13-16'].originalRecord).toEqual(records['1:13-16']);
});
test('dialog reload normalizes stale history and Back then Forward restores modal',async({page})=>{
 await ready(page);await page.locator('.map-trigger').first().click();await page.reload();await expect(page.locator('#begin')).toBeVisible();await expect(page.locator('#day-map')).not.toBeVisible();expect(await page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('.map-trigger').first().click();await page.goBack();await expect(page.locator('#day-map')).not.toBeVisible();await page.goForward();await expect(page.locator('#day-map')).toBeVisible();await page.locator('#close-map').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#preview-steps').click();await page.locator('[data-step="2"]').click();await page.locator('#zoom-diagram').click();await page.goBack();await expect(page.locator('#diagram-dialog')).not.toBeVisible();await page.goForward();await expect(page.locator('#diagram-dialog')).toBeVisible();await expect(page.locator('#diagram-dialog-title')).toContainText('第3步');await page.keyboard.press('Escape');await expect(page.locator('#diagram-dialog')).not.toBeVisible();
});
test('printed view retains activity-specific safety and warns it is a single-step view',async({page})=>{
 await ready(page);await page.emulateMedia({media:'print'});await expect(page.locator('.safety-box')).toBeVisible();await expect(page.locator('.safety-specific')).toContainText(experiments[0].safety);expect(await page.locator('.procedure').evaluate(e=>getComputedStyle(e,'::before').content)).toContain('仅显示当前选中的步骤');
});

test('fresh first-month subject filtering offers a direct whole-year escape',async({page})=>{
 await ready(page);await page.locator('.map-trigger').first().click();await page.locator('#map-month').selectOption('1');await page.locator('[data-filter="history"]').click();await page.locator('#map-show-year').click();await expect(page.locator('#map-month')).toHaveValue('all');await expect(page.locator('.map-day')).toHaveCount(experiments.filter(e=>e.category==='history').length);
});

test('synthetic visual review snapshots for seven subjects and four ages',async({page},testInfo)=>{
 test.setTimeout(90000);await ready(page);
 const {mkdir}=await import('node:fs/promises');await mkdir('test-results/visual-review',{recursive:true});
 for(const subject of subjects){const id=experiments.find(e=>e.category===subject&&e.id>30).id;await choose(page,id);
  for(const age of ['4-6','7-9','10-12','13-16']){await page.locator(`[data-age="${age}"]`).click();await page.locator('#preview-steps').click();await page.locator('[data-step="1"]').click();await page.locator('#step-stage').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-${subject}-${age}.png`,fullPage:false})}
 }
});

test('malformed nested state is normalized and explicit reset also clears archived records',async({page})=>{
 await seed(page,{age:'13-16',day:1,startDate:'2026-02-30',records:[],completed:[],steps:[],legacyRecords:[],recordSchemaVersion:3});await ready(page);await expect(page.locator('#day-number')).toContainText('DAY 01');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('little-lab-v2'));s.legacyRecords={'1:13-16':{fields:[null,{label:'旧观察',value:'合成验收数据'}],originalRecord:{field0:'合成验收数据'}}};localStorage.setItem('little-lab-v2',JSON.stringify(s))});await page.reload();await expect(page.locator('.legacy-record')).toContainText('合成验收数据');
 page.on('dialog',dialog=>dialog.accept());await page.locator('#reset-progress').click();await expect(page.locator('.legacy-record')).toHaveCount(0);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('little-lab-v2')).legacyRecords)).toEqual({});await page.reload();await expect(page.locator('.legacy-record')).toHaveCount(0);
});

test('Dots static snapshot is a separate accessible view with truthful limits and Back navigation',async({page},testInfo)=>{
 await ready(page);await choose(page,365);await page.locator('nav a[href="#dots"]').click();await expect(page.locator('#dots-view')).toBeVisible();await expect(page.locator('#learning-view')).not.toBeVisible();await expect(page.locator('#dots-content')).toContainText('9');await expect(page.locator('#dots-content')).toContainText('不声称独占80核');await expect(page.locator('#dots-content')).toContainText('不是 Cloudflare Workers 配置');await expect(page.locator('#dots-content time')).toHaveAttribute('datetime','2026-10-23T09:34:43.300460+00:00');const {mkdir}=await import('node:fs/promises');await mkdir('test-results/visual-review',{recursive:true});await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-dots.png`,fullPage:false});await page.locator('.dots-card').nth(1).scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-dots-resources.png`,fullPage:false});await page.reload();await expect(page.locator('#dots-view')).toBeVisible();await page.locator('#dots-view a[href="#lab"]').click();await expect(page.locator('#learning-view')).toBeVisible();await expect(page.locator('#day-number')).toContainText('365');await page.goBack();await expect(page.locator('#dots-view')).toBeVisible();await page.goBack();await expect(page.locator('#learning-view')).toBeVisible();
});

test('header map from Dots returns to the chosen learning activity',async({page})=>{
 await ready(page);await page.locator('nav a[href="#dots"]').click();await expect(page.locator('#dots-view')).toBeVisible();await choose(page,35);await expect(page.locator('#learning-view')).toBeVisible();await expect(page.locator('#dots-view')).not.toBeVisible();await expect(page.locator('#day-map')).not.toBeVisible();await expect(page.locator('#day-number')).toContainText('35');
});
