import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resetServer,fixture,loginAPI,authFetch,cloudSaved} from './account-helpers.mjs';
const progress=extra=>({startDate:'2026-10-26',day:1,age:'4-6',records:{},steps:{},completed:{},legacyRecords:{},...extra});
async function ready(page,options={}){
 await resetServer(page);const seed=await fixture(page,options);await loginAPI(page,options.email||'owner@qa.test');await page.goto('/#lab');await expect(page.locator('#open-safety')).toBeVisible();
 if(await page.locator('#child-switch').inputValue()!==seed.children[0].id)await page.locator('#child-switch').selectOption(seed.children[0].id);
 await expect(page.locator('#open-safety')).toBeVisible();return seed;
}
async function stored(page,id){return (await(await authFetch(page,'/api/children/'+id+'/state')).json()).state}
async function preview(page){await page.locator('#preview-main').click();await page.locator('#step-stage').scrollIntoViewIfNeeded();await expect(page.locator('#reading-count')).not.toHaveText('已查看 0 / 4 步')}
async function view(page,index){await page.locator(`[data-step="${index}"]`).click();await page.locator('#step-stage').scrollIntoViewIfNeeded();await expect(page.locator(`[data-step="${index}"]`)).toHaveAttribute('aria-label',/当前查看，已查看/)}
async function shot(page,info,name){mkdirSync('test-results/visual-review',{recursive:true});await page.screenshot({path:`test-results/visual-review/${info.project.name}-exploration-${name}.png`,fullPage:true});if(['fresh','nonsequential','360-current'].includes(name)){await page.locator('#reading-summary').evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`test-results/visual-review/${info.project.name}-exploration-${name}-viewport.png`,fullPage:false})}}

test('fresh hidden rendering does not imply views; explicit nonsequential viewing has truthful text and next unseen action',async({page},info)=>{
 const seed=await ready(page);await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await expect(page.locator('.flow-status')).toHaveText(Array(4).fill('○ 未查看'));await expect(page.locator('#step-stage')).not.toBeVisible();await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
 for(const id of ['materials-panel','observations','learning-panel','procedure'])await page.locator('#tab-'+id).click();expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({});await shot(page,info,'fresh');
 await preview(page);await view(page,3);await expect(page.locator('#reading-count')).toHaveText('已查看 2 / 4 步');await expect(page.locator('#reading-remaining')).toHaveText('还有 2 步未查看');await expect(page.locator('.flow-status')).toHaveText(['✓ 已查看','○ 未查看','○ 未查看','◉ 当前查看']);await expect(page.locator('#continue-reading')).toContainText('第 2 步');await expect(page.locator('#reading-position')).toHaveText('当前第 4 / 4 步');await cloudSaved(page);expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({'1:4-6':9});await shot(page,info,'nonsequential');
 await page.locator('#continue-reading').click();await expect(page.locator('#reading-count')).toHaveText('已查看 3 / 4 步');await expect(page.locator('[data-step="1"]')).toHaveAttribute('aria-current','step');
});

test('viewing all steps is not completion, observation, guardian confirmation or sequential unlocking',async({page})=>{
 const seed=await ready(page,{email:'reader@qa.test',role:'parent',unlockAll:false,unlockThrough:1});await preview(page);for(const i of [1,2,3])await view(page,i);await cloudSaved(page);
 const state=await stored(page,seed.children[0].id);expect(state.viewedSteps['1:4-6']).toBe(15);expect(state.completed).toEqual({});expect(Object.values(state.records).every(r=>Object.keys(r).length===0)).toBe(true);await expect(page.locator('#reading-next')).toContainText('尚未标记实际探索完成');await expect(page.locator('#prep-summary')).toContainText('仅预览');await expect(page.locator('#exploration-status')).toHaveText('实验 · 尚未标记完成');
 await page.locator('#continue-reading').click();await expect(page.locator('#observations')).toBeVisible();await expect(page.locator('#complete-day')).toHaveAttribute('aria-pressed','false');await page.locator('#day-next').click();await expect(page.locator('.locked-activity')).toBeVisible();await expect(page.locator('[data-step]')).toHaveCount(0);
});

test('legacy cursor and completed marker restore without fabricated viewed history; saved new views survive reload',async({page})=>{
 const seed=await ready(page,{children:[{nickname:'合成旧记录',ageBand:'7-9',state:progress({age:'7-9',steps:{'1:7-9':2},completed:{'1:7-9':true},records:{'1:7-9':{field0:'旧观察保留'}}})}]});
 await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await expect(page.locator('#reading-position')).toHaveText('上次停在第 3 / 4 步');await expect(page.locator('#step-next')).toBeDisabled();await page.locator('#continue-reading').click();await page.locator('#step-stage').scrollIntoViewIfNeeded();await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await expect(page.locator('[data-step="2"]')).toHaveAttribute('aria-current','step');await cloudSaved(page);
 await page.reload();await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await expect(page.locator('#reading-position')).toHaveText('上次停在第 3 / 4 步');await expect(page.locator('#step-stage')).not.toBeVisible();await expect(page.locator('#continue-reading')).toContainText('继续预览第 3 步');await page.locator('#tab-observations').click();await expect(page.locator('[data-field="field0"]')).toHaveValue('旧观察保留');const s=await stored(page,seed.children[0].id);expect(s.steps['1:7-9']).toBe(2);expect(s.viewedSteps['1:7-9']).toBe(4);expect(s.completed['1:7-9']).toBe(true);
});

test('repeated child, age and day switching isolates view masks and safety confirmation',async({page})=>{
 const seed=await ready(page,{children:[{nickname:'合成甲',ageBand:'4-6'},{nickname:'合成乙',ageBand:'4-6'}]});const [a,b]=seed.children;await preview(page);await view(page,3);await cloudSaved(page);
 await page.locator('[data-age="7-9"]').click();await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await expect(page.locator('#step-next')).toBeDisabled();await preview(page);await view(page,1);await cloudSaved(page);
 await page.locator('#day-next').click();await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await preview(page);await cloudSaved(page);
 for(let repeat=0;repeat<2;repeat++){
  await page.locator('#child-switch').selectOption(b.id);await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await expect(page.locator('#step-next')).toBeDisabled();await page.locator('#child-switch').selectOption(a.id);await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await expect(page.locator('#step-next')).toBeDisabled();
 }
 await page.locator('#day-prev').click();await page.locator('[data-age="4-6"]').click();await expect(page.locator('#reading-count')).toHaveText('已查看 2 / 4 步');await expect(page.locator('#reading-position')).toContainText('第 4 / 4 步');await cloudSaved(page);expect((await stored(page,a.id)).viewedSteps).toEqual({'1:4-6':9,'1:7-9':3,'2:7-9':1});expect((await stored(page,b.id)).viewedSteps).toEqual({});
});

test('read-only panels and hash navigation never manufacture new view state; resume returns to selected step',async({page})=>{
 const seed=await ready(page);await page.locator('#tab-observations').click();await page.locator('[data-age="7-9"]').click();await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await page.locator('#tab-procedure').click();await preview(page);await view(page,2);await cloudSaved(page);
 let writes=0;page.on('request',request=>{if(request.method()==='PUT'&&request.url().endsWith('/state'))writes++});for(let i=0;i<2;i++){await page.locator('#tab-learning-panel').click();await page.locator('nav a[href="#dots"]').click();await page.locator('nav a[href="#lab"]').click();await expect(page.locator('#learning-panel')).toBeVisible();await page.locator('#continue-reading').click();await expect(page.locator('#procedure')).toBeVisible();await expect(page.locator('[data-step="2"]')).toHaveAttribute('aria-current','step')}
 expect(writes).toBe(0);expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({'1:7-9':5});
});

test('safety modal dismissal and revocation hide steps without clearing views or authorizing operation',async({page})=>{
 await ready(page);await page.locator('#open-safety').click();await page.locator('[data-check="0"]').check();await page.keyboard.press('Escape');await expect(page.locator('#step-stage')).not.toBeVisible();await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#open-safety').click();for(const i of [1,2])await page.locator(`[data-check="${i}"]`).check();await page.locator('#begin').click();await page.locator('#step-stage').scrollIntoViewIfNeeded();await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await view(page,2);await cloudSaved(page);
 await page.locator('#open-safety').click();await page.locator('[data-check="1"]').uncheck();await page.locator('#close-safety').click();await expect(page.locator('#step-stage')).not.toBeVisible();await expect(page.locator('#step-next')).toBeDisabled();await expect(page.locator('[aria-current="step"]')).toHaveCount(0);await expect(page.locator('#reading-count')).toHaveText('已查看 2 / 4 步');await expect(page.locator('#complete-day')).toHaveAttribute('aria-pressed','false');await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await page.locator('#continue-reading').click();await expect(page.locator('#prep-summary')).toContainText('仅预览');await expect(page.locator('[data-step="2"]')).toHaveAttribute('aria-current','step');
});

test('view save failure stays unsaved and retry persists; no note or completion is synthesized',async({page},info)=>{
 const seed=await ready(page);const path='**/api/children/'+seed.children[0].id+'/state';await page.route(path,route=>route.request().method()==='PUT'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:{code:'QA_FAIL',message:'合成浏览保存失败'}})}):route.continue());
 await preview(page);await view(page,3);await expect(page.locator('#cloud-status')).toContainText('未保存到云端');await expect(page.locator('#reading-count')).toHaveText('已查看 2 / 4 步');expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({});await shot(page,info,'save-error');await page.unroute(path);await page.locator('#retry-save').click();await cloudSaved(page);await page.reload();await expect(page.locator('#reading-count')).toHaveText('已查看 2 / 4 步');expect((await stored(page,seed.children[0].id)).completed).toEqual({});
});

test('concurrent revision conflict does not silently overwrite viewed history or observations',async({page})=>{
 const seed=await ready(page);const path='/api/children/'+seed.children[0].id+'/state';const before=await(await authFetch(page,path)).json();expect((await authFetch(page,path,'PUT',{revision:before.revision,state:{...before.state,viewedSteps:{'1:4-6':2},records:{'1:4-6':{spoken:'另一设备的观察'}}}})).ok()).toBe(true);
 await preview(page);await expect(page.locator('#cloud-status')).toContainText('另一设备');expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({'1:4-6':2});await page.locator('#retry-save').click();await expect(page.locator('#reload-cloud')).toBeVisible();page.once('dialog',d=>d.accept());await page.locator('#reload-cloud').click();await page.locator('[data-select-child]').first().click();await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await expect(page.locator('[data-step="0"] .flow-status')).toHaveText('○ 未查看');await page.locator('#tab-observations').click();await expect(page.locator('[data-field="spoken"]')).toHaveValue('另一设备的观察');
});

test('server relock removes stale reading controls and preserves only previously saved history',async({page,request})=>{
 const seed=await ready(page,{email:'relock@qa.test',role:'parent',unlockAll:false,unlockThrough:1});await preview(page);await cloudSaved(page);
 // The isolated API context changes permissions without replacing the parent's cookie/CSRF session.
 const admin={request};await fixture(admin);await loginAPI(admin);expect((await authFetch(admin,'/api/admin/users/'+seed.user.id+'/access','POST',{mode:'locked'})).ok()).toBe(true);
 let release;const held=new Promise(resolve=>release=resolve);const savePath='**/api/children/'+seed.children[0].id+'/state';await page.route(savePath,async route=>{if(route.request().method()==='PUT')await held;await route.continue()});await view(page,3);await page.locator('#zoom-diagram').click();release();await expect(page.locator('.locked-activity')).toBeVisible();await page.unroute(savePath);await expect(page.locator('#diagram-dialog')).not.toBeVisible();await expect(page.locator('#enlarged-diagram')).toBeEmpty();await expect(page.locator('#enlarged-instruction')).toBeEmpty();await expect(page.locator('#cloud-status')).toContainText('另一设备');await expect(page.locator('#reading-summary')).toHaveCount(0);await expect(page.locator('#step-stage')).toHaveCount(0);expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({'1:4-6':1});
});

test('keyboard step controls, accessible names and 360px hierarchy remain usable',async({page},info)=>{
 await page.setViewportSize({width:360,height:800});await ready(page);await page.locator('#continue-reading').focus();await page.keyboard.press('Enter');await page.locator('#step-stage').scrollIntoViewIfNeeded();await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await page.locator('[data-step="3"]').focus();await page.keyboard.press('Enter');await page.locator('#step-stage').scrollIntoViewIfNeeded();await expect(page.locator('#step-stage')).toBeFocused();await expect(page.locator('[data-step="3"]')).toHaveAttribute('aria-label',/第4步.+当前查看/);await expect(page.locator('.flow-text').first()).toBeVisible();await expect(page.locator('.flow-status').nth(1)).toHaveText('○ 未查看');await shot(page,info,'360-current');
 for(const id of ['procedure','materials-panel','observations','learning-panel']){await page.locator('#tab-'+id).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,info,'360-'+id)}
 await page.locator('#tab-learning-panel').focus();await page.keyboard.press('Home');await expect(page.locator('#tab-procedure')).toBeFocused();await expect(page.locator('#procedure')).toBeVisible();await page.keyboard.press('ArrowRight');await expect(page.locator('#materials-panel')).toBeVisible();await expect(page.locator('#tab-materials-panel')).toBeFocused();
});


test('history Forward never views the step beneath a diagram modal; closing counts the now-displayed step',async({page})=>{
 const seed=await ready(page);await preview(page);await view(page,3);await cloudSaved(page);await page.locator('#zoom-diagram').click();await page.goBack();await expect(page.locator('#diagram-dialog')).not.toBeVisible();await cloudSaved(page);
 const path='/api/children/'+seed.children[0].id+'/state',before=await(await authFetch(page,path)).json();expect((await authFetch(page,path,'PUT',{revision:before.revision,state:{...before.state,viewedSteps:{}}})).ok()).toBe(true);
 await page.reload();await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await page.goForward();await expect(page.locator('#diagram-dialog')).toBeVisible();await expect(page.locator('#diagram-dialog-title')).toContainText('第4步');await expect(page.locator('#reading-count')).toHaveText('已查看 0 / 4 步');await page.evaluate(()=>document.querySelector('#step-stage').scrollIntoView({block:'start',behavior:'instant'}));
 await page.locator('#close-diagram').click();await expect(page.locator('#diagram-dialog')).not.toBeVisible();await expect(page.locator('#reading-count')).toHaveText('已查看 1 / 4 步');await cloudSaved(page);expect((await stored(page,seed.children[0].id)).viewedSteps).toEqual({'1:4-6':8});
});
