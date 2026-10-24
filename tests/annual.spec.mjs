import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const {experiments}=JSON.parse(readFileSync(new URL('../dist/data.json',import.meta.url),'utf8'));
const subjects=['physics','chemistry','maths','biology','history','geography','everyday'];
const localDate=()=>new Date().toISOString().slice(0,10);
async function seed(page,record){await page.addInitScript(value=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem('little-lab-v2',typeof value==='string'?value:JSON.stringify(value));sessionStorage.setItem('qa-seeded','yes')}},record)}
async function ready(page){await page.goto('/');await expect(page.locator('#open-safety')).toBeVisible()}
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
  for(const age of ['4-6','7-9','10-12','13-16']){await page.locator(`[data-age="${age}"]`).click();await page.locator('#open-safety').click();await expect(page.locator('#begin')).toBeDisabled();await page.locator('#close-safety').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await expect(page.locator('#step-next')).toBeDisabled();await page.locator('#preview-main').click();const g=experiments[id-1].ageGuides[age];if(g.control)await expect(page.locator('.age-control-note')).toContainText(g.control);if(g.support)await expect(page.locator('.age-support')).toContainText(g.support);await page.locator('[data-panel="learning-panel"]').click();await page.locator('.extension summary').click();if(experiments[id-1].extension.ageNote)await expect(page.locator('.extension-age-note')).toContainText(experiments[id-1].extension.ageNote);
   await page.locator('[data-panel="procedure"]').click();for(let step=0;step<4;step++){await page.locator(`[data-step="${step}"]`).click();await expect(page.locator('#step-stage svg title')).toHaveText(new RegExp(`第${step+1}步`));const core=experiments[id-1].steps[step].detail,action=experiments[id-1].ageGuides[age].steps[step].action;if(!action.includes(core))await expect(page.locator('.step-detail')).toHaveText(core);else await expect(page.locator('.step-detail')).toHaveCount(0);await expect(page.locator('.age-action')).toContainText(action)}
  }
 }
 await page.locator('#zoom-diagram').click();await expect(page.locator('#diagram-dialog')).toBeVisible();await page.goBack();await expect(page.locator('#diagram-dialog')).not.toBeVisible();
 await page.locator('#zoom-diagram').click();await page.keyboard.press('Escape');await expect(page.locator('#diagram-dialog')).not.toBeVisible();
 await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#zoom-diagram').click();await page.locator('#close-diagram').click();await expect(page.locator('#diagram-dialog')).not.toBeVisible();
});
test('adult preparation is a gate and relocks when conditions change',async({page})=>{
 await ready(page);await page.locator('#open-safety').click();await page.locator('[data-check="0"]').check();await page.locator('[data-check="1"]').check();await expect(page.locator('#begin')).toBeDisabled();await page.locator('[data-check="2"]').check();await expect(page.locator('#begin')).toBeEnabled();await page.locator('#begin').click();await expect(page.locator('#step-next')).toBeEnabled();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await page.locator('#open-safety').click();await page.locator('[data-check="1"]').uncheck();await expect(page.locator('#step-next')).toBeDisabled();
});
test('legacy day1/day30 records survive annual upgrade and day365 persists',async({page})=>{
 await seed(page,{startDate:localDate(),lastOpenDate:localDate(),day:30,age:'7-9',records:{'1:4-6':{spoken:'QA legacy first day'},'30:7-9':{field0:'QA legacy day30'}},completed:{'1:4-6':true,'30:7-9':true},steps:{'30:7-9':2}});await ready(page);
 await expect(page.locator('[data-field="field0"]')).toHaveValue('QA legacy day30');await expect(page.locator('#step-counter')).toContainText('3');
 await choose(page,1);await page.locator('[data-age="4-6"]').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('QA legacy first day');
 await choose(page,365);await page.locator('[data-age="7-9"]').click();await page.locator('[data-panel="observations"]').click();await page.locator('[data-field="field0"]').fill('QA final day');await page.reload();await expect(page.locator('[data-field="field0"]')).toHaveValue('QA final day');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-lab-v2')));expect(stored.records['1:4-6'].spoken).toBe('QA legacy first day');expect(stored.records['30:7-9'].field0).toBe('QA legacy day30');expect(stored.records['365:7-9'].field0).toBe('QA final day');
});
test('invalid JSON and malformed per-record storage recover without crash',async({page})=>{
 await seed(page,'{not valid');await ready(page);await expect(page.locator('#day-number')).toContainText('/ 365');
 await page.evaluate(()=>{localStorage.setItem('little-lab-v2',JSON.stringify({day:365,age:'7-9',records:{'365:7-9':'bad'},steps:{'365:7-9':1.5},completed:[]}))});await page.reload();await page.locator('[data-panel="observations"]').click();await expect(page.locator('[data-field="field0"]')).toBeVisible();await page.locator('[data-panel="observations"]').click();await page.locator('[data-field="field0"]').fill('recovered');await expect(page.locator('#step-counter')).toHaveText('1 / 4 步');
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
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked for QA','SecurityError')}}));await ready(page);await page.locator('#preview-main').click();await expect(page.locator('#step-next')).toBeEnabled();await expect(page.locator('#save-status')).toContainText('不能保存');
});

test('changed legacy teenager fields are archived under original labels exactly once',async({page})=>{
 const schemas=JSON.parse(readFileSync(new URL('../scripts/legacy-record-schemas.json',import.meta.url),'utf8'));
 const records=Object.fromEntries(Object.entries(schemas).map(([key,labels])=>[key,Object.fromEntries(labels.map((label,i)=>[`field${i}`,`QA ${key}: ${label}`]))]));
 await seed(page,{startDate:localDate(),lastOpenDate:localDate(),day:1,age:'13-16',records,completed:{'1:13-16':true},steps:{'1:13-16':3}});await ready(page);
 for(const [key,labels] of Object.entries(schemas)){await choose(page,Number(key.split(':')[0]));await page.locator('[data-panel="observations"]').click();const archive=page.locator('.legacy-record');await expect(archive).toBeVisible();await expect(archive.locator('dt')).toHaveText(labels);await expect(archive.locator('dd')).toHaveText(labels.map(label=>`QA ${key}: ${label}`));await expect(page.locator('[data-field="field0"]')).toHaveValue('')}
 await page.locator('[data-panel="observations"]').click();await page.locator('[data-field="field0"]').fill('QA new-schema answer');await page.reload();await expect(page.locator('[data-field="field0"]')).toHaveValue('QA new-schema answer');const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-lab-v2')));expect(stored.recordSchemaVersion).toBe(3);expect(Object.keys(stored.legacyRecords)).toHaveLength(8);expect(stored.completed['1:13-16']).toBe(true);expect(stored.legacyRecords['1:13-16'].originalRecord).toEqual(records['1:13-16']);
});
test('dialog reload normalizes stale history and Back then Forward restores modal',async({page})=>{
 await ready(page);await page.locator('.map-trigger').first().click();await page.reload();await expect(page.locator('#open-safety')).toBeVisible();await expect(page.locator('#day-map')).not.toBeVisible();expect(await page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('.map-trigger').first().click();await page.goBack();await expect(page.locator('#day-map')).not.toBeVisible();await page.goForward();await expect(page.locator('#day-map')).toBeVisible();await page.locator('#close-map').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#preview-main').click();await page.locator('[data-step="2"]').click();await page.locator('#zoom-diagram').click();await page.goBack();await expect(page.locator('#diagram-dialog')).not.toBeVisible();await page.goForward();await expect(page.locator('#diagram-dialog')).toBeVisible();await expect(page.locator('#diagram-dialog-title')).toContainText('第3步');await page.keyboard.press('Escape');await expect(page.locator('#diagram-dialog')).not.toBeVisible();
});
test('printed view retains activity-specific safety and warns it is a single-step view',async({page})=>{
 await ready(page);await page.emulateMedia({media:'print'});await expect(page.locator('.print-safety')).toBeVisible();await expect(page.locator('.print-safety')).toContainText(experiments[0].safety);expect(await page.locator('.procedure').evaluate(e=>getComputedStyle(e,'::before').content)).toContain('仅显示当前选中的步骤');
});

test('fresh first-month subject filtering offers a direct whole-year escape',async({page})=>{
 await ready(page);await page.locator('.map-trigger').first().click();await page.locator('#map-month').selectOption('1');await page.locator('[data-filter="history"]').click();await page.locator('#map-show-year').click();await expect(page.locator('#map-month')).toHaveValue('all');await expect(page.locator('.map-day')).toHaveCount(experiments.filter(e=>e.category==='history').length);
});

test('synthetic visual review snapshots for seven subjects and four ages',async({page},testInfo)=>{
 test.setTimeout(90000);await ready(page);
 const {mkdir}=await import('node:fs/promises');await mkdir('test-results/visual-review',{recursive:true});
 for(const subject of subjects){const id=experiments.find(e=>e.category===subject&&e.id>30).id;await choose(page,id);
  for(const age of ['4-6','7-9','10-12','13-16']){await page.locator(`[data-age="${age}"]`).click();await page.locator('#preview-main').click();await page.locator('[data-step="1"]').click();await page.locator('#step-stage').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-${subject}-${age}.png`,fullPage:false})}
 }
});

test('malformed nested state is normalized and explicit reset also clears archived records',async({page})=>{
 await seed(page,{age:'13-16',day:1,startDate:'2026-02-30',records:[],completed:[],steps:[],legacyRecords:[],recordSchemaVersion:3});await ready(page);await expect(page.locator('#day-number')).toContainText('DAY 01');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('little-lab-v2'));s.legacyRecords={'1:13-16':{fields:[null,{label:'旧观察',value:'合成验收数据'}],originalRecord:{field0:'合成验收数据'}}};localStorage.setItem('little-lab-v2',JSON.stringify(s))});await page.reload();await expect(page.locator('.legacy-record')).toContainText('合成验收数据');
 page.on('dialog',dialog=>dialog.accept());await page.locator('nav a[href="#journey"]').click();await page.locator('#reset-progress').click();await expect(page.locator('.legacy-record')).toHaveCount(0);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('little-lab-v2')).legacyRecords)).toEqual({});await page.reload();await expect(page.locator('.legacy-record')).toHaveCount(0);
});

test('Dots static snapshot is a separate accessible view with truthful limits and Back navigation',async({page},testInfo)=>{
 await ready(page);await choose(page,365);await page.locator('nav a[href="#dots"]').click();await expect(page.locator('#dots-view')).toBeVisible();await expect(page.locator('#learning-view')).not.toBeVisible();await expect(page.locator('#dots-content')).toContainText('9');await expect(page.locator('#dots-content')).toContainText('不声称独占80核');await expect(page.locator('#dots-content')).toContainText('不是 Cloudflare Workers 配置');await expect(page.locator('#dots-content time')).toHaveAttribute('datetime','2026-10-23T09:34:43.300460+00:00');const {mkdir}=await import('node:fs/promises');await mkdir('test-results/visual-review',{recursive:true});await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-dots.png`,fullPage:false});await page.locator('.dots-card').nth(1).scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-dots-resources.png`,fullPage:false});await page.reload();await expect(page.locator('#dots-view')).toBeVisible();await page.locator('#dots-view a[href="#lab"]').click();await expect(page.locator('#learning-view')).toBeVisible();await expect(page.locator('#day-number')).toContainText('365');await page.goBack();await expect(page.locator('#dots-view')).toBeVisible();await page.goBack();await expect(page.locator('#learning-view')).toBeVisible();
});

test('header map from Dots returns to the chosen learning activity',async({page})=>{
 await ready(page);await page.locator('nav a[href="#dots"]').click();await expect(page.locator('#dots-view')).toBeVisible();await choose(page,35);await expect(page.locator('#learning-view')).toBeVisible();await expect(page.locator('#dots-view')).not.toBeVisible();await expect(page.locator('#day-map')).not.toBeVisible();await expect(page.locator('#day-number')).toContainText('35');
});

test('focused panels retain records and support keyboard tab navigation',async({page})=>{
 await ready(page);await expect(page.locator('#procedure')).toBeVisible();await expect(page.locator('#observations')).not.toBeVisible();await expect(page.locator('#learning-panel')).not.toBeVisible();await expect(page.locator('#journey')).not.toBeVisible();await expect(page.locator('#sources')).not.toBeVisible();
 await page.locator('#tab-procedure').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#materials-panel')).toBeVisible();await expect(page.locator('#tab-materials-panel')).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.locator('#observations')).toBeVisible();await page.locator('[data-field="spoken"]').fill('QA focused panel record');await page.locator('#tab-procedure').click();await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('QA focused panel record');await page.reload();await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('QA focused panel record');
});
test('safety dismissal never authorizes; popup traps focus and resets on day or age change',async({page})=>{
 await ready(page);await page.locator('#open-safety').click();await expect(page.locator('#safety-dialog')).toBeVisible();await expect(page.locator('#safety-dialog-content')).toContainText(experiments[0].safety);for(const material of experiments[0].materials)await expect(page.locator('.dialog-materials')).toContainText(material);
 await page.locator('[data-check="0"]').check();await page.keyboard.press('Escape');await expect(page.locator('#safety-dialog')).not.toBeVisible();await expect(page.locator('#step-next')).toBeDisabled();await expect(page.locator('#open-safety')).toBeFocused();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#open-safety').click();for(let i=0;i<12;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.querySelector('#safety-dialog').contains(document.activeElement))).toBe(true)}for(let i=0;i<12;i++){await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>document.querySelector('#safety-dialog').contains(document.activeElement))).toBe(true)}await expect(page.locator('#begin')).not.toBeFocused();
 await page.goBack();await expect(page.locator('#safety-dialog')).not.toBeVisible();await expect(page.locator('#step-next')).toBeDisabled();await page.goForward();await expect(page.locator('#safety-dialog')).toBeVisible();await page.locator('[data-check="1"]').check();await page.locator('[data-check="2"]').check();await page.locator('#begin').click();await expect(page.locator('#safety-dialog')).not.toBeVisible();await expect(page.locator('#step-next')).toBeEnabled();await expect(page.locator('#prep-summary')).toContainText('已完成');
 await page.locator('[data-age="7-9"]').click();await expect(page.locator('#step-next')).toBeDisabled();await page.locator('#open-safety').click();await expect(page.locator('[data-check="0"]')).not.toBeChecked();await page.locator('#close-safety').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await choose(page,32);await page.locator('#open-safety').click();await expect(page.locator('[data-check="1"]')).not.toBeChecked();
});
test('persistent drawer works after scrolling and retains month, search and subject filters',async({page})=>{
 await ready(page);await page.locator('#tab-learning-panel').click();await page.locator('.extension').scrollIntoViewIfNeeded();await expect(page.locator('#navigator-handle')).toBeInViewport();await page.locator('#navigator-handle').click();await expect(page.locator('#navigator-handle')).toHaveAttribute('aria-expanded','true');await page.locator('#map-all-year').click();await page.locator('[data-filter="history"]').click();await page.locator('#map-search').fill('时间');const count=await page.locator('.map-day').count();await page.locator('#close-map').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await expect(page.locator('#navigator-handle')).toBeFocused();await page.locator('#navigator-handle').click();await expect(page.locator('#map-month')).toHaveValue('all');await expect(page.locator('#map-search')).toHaveValue('时间');await expect(page.locator('.map-day')).toHaveCount(count);expect(await page.evaluate(()=>document.querySelector('#day-map').getBoundingClientRect().left)).toBe(0);
});
test('compact mobile 360px layout has no overflow in tabs, safety or navigator',async({page})=>{
 await page.setViewportSize({width:360,height:800});await ready(page);for(const panel of ['materials-panel','observations','learning-panel','procedure']){await page.locator(`[data-panel="${panel}"]`).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}await page.locator('#open-safety').click();expect(await page.locator('#safety-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.locator('#close-safety').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await page.locator('#navigator-handle').click();expect(await page.locator('#day-map').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});

test('stale safety Forward restores its own context without transferring consent',async({page})=>{
 await ready(page);await page.locator('#open-safety').click();await page.locator('[data-check="0"]').check();await page.goBack();await expect(page.locator('#safety-dialog')).not.toBeVisible();await page.locator('#day-next').click();await page.locator('[data-age="7-9"]').click();await page.goForward();await expect(page.locator('#safety-dialog')).toBeVisible();await expect(page.locator('#day-number')).toContainText('DAY 01');await expect(page.locator('[data-age="4-6"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-check="0"]')).not.toBeChecked();await expect(page.locator('#begin')).toBeDisabled();await expect(page.locator('#safety-dialog-content')).toContainText(experiments[0].ageGuides['4-6'].support);
});
test('switching from long knowledge to records aligns the selected panel',async({page})=>{
 await ready(page);await page.locator('#tab-learning-panel').click();await page.locator('.source-disclosure').scrollIntoViewIfNeeded();await page.locator('#tab-observations').click();await expect(page.locator('#observations > .minor-heading')).toBeInViewport();await expect(page.locator('#tab-observations')).toHaveAttribute('aria-selected','true');
});
test('focused interface review screenshots include first fold, modal and drawer',async({page},testInfo)=>{
 await ready(page);const {mkdir}=await import('node:fs/promises');await mkdir('test-results/visual-review',{recursive:true});const shot=async(name)=>{await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-focused-${name}.png`,fullPage:false})};
 const handle=await page.locator('#navigator-handle').boundingBox(),handleText=await page.locator('#navigator-handle span').boundingBox();expect(handleText.x).toBeGreaterThanOrEqual(handle.x);expect(handleText.y+handleText.height).toBeLessThanOrEqual(handle.y+handle.height);await shot('first-fold');await page.locator('#open-safety').click();await shot('parent-preparation');await page.locator('#close-safety').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await page.locator('#navigator-handle').click();await shot('left-navigator');await page.locator('#close-map').click();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await page.locator('#tab-observations').click();await shot('record-panel');await page.setViewportSize({width:360,height:640});await page.goto('/');await expect(page.locator('#open-safety')).toBeVisible();await shot('360-first-fold');await page.locator('#preview-main').click();const targetTop=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));await expect.poll(async()=>Math.abs((await page.locator('#step-stage').boundingBox()).y-targetTop)).toBeLessThan(2);await expect(page.locator('#step-stage .diagram-panel')).toBeInViewport();await expect(page.locator('#toast')).not.toHaveClass(/show/);await shot('360-after-preview');await page.locator('#open-safety').click();await shot('360-safety');
});


test('Begin and dialog preview settle on the current diagram after history closes',async({page},testInfo)=>{
 await ready(page);const {mkdir}=await import('node:fs/promises');await mkdir('test-results/visual-review',{recursive:true});
 const geometry=()=>page.evaluate(()=>{const stage=document.querySelector('#step-stage').getBoundingClientRect(),header=document.querySelector('.site-header').getBoundingClientRect(),tabs=document.querySelector('.workspace-tabs').getBoundingClientRect(),maxScroll=Math.max(0,document.scrollingElement.scrollHeight-innerHeight),padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),documentY=stage.top+scrollY,desiredScroll=Math.max(0,Math.min(documentY-padding,maxScroll));return {scrollY,maxScroll,documentY,padding,desiredScroll,error:Math.abs(scrollY-desiredScroll),stageTop:stage.top,stageBottom:stage.bottom,headerBottom:header.bottom,tabsBottom:tabs.bottom,viewportHeight:innerHeight}});
 const assertStepAligned=async(label)=>{await expect(page.locator('#safety-dialog')).not.toBeVisible();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);await expect.poll(async()=>(await geometry()).error).toBeLessThan(2);const actual=await geometry();console.log('settled-diagram-geometry',testInfo.project.name,label,JSON.stringify(actual));expect(actual.stageTop).toBeGreaterThanOrEqual(Math.max(actual.headerBottom,actual.tabsBottom)-2);await expect(page.locator('#step-stage .diagram-panel')).toBeInViewport({ratio:0.5});await page.screenshot({path:`test-results/visual-review/${testInfo.project.name}-focused-${label}-settled.png`,fullPage:false})};
 await page.locator('#open-safety').click();await page.locator('#preview-steps').click();await assertStepAligned('modal-preview');await expect(page.locator('#view-state')).toContainText('仅预览');
 await page.locator('#open-safety').click();for(const index of [0,1,2])await page.locator(`[data-check="${index}"]`).check();await page.locator('#begin').click();await assertStepAligned('begin');await expect(page.locator('#view-state')).toContainText('准备就绪');
});
