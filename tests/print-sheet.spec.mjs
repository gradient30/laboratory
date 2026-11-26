import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {resetServer,fixture,loginAPI} from './account-helpers.mjs';
test('A4 preview contains all four steps and prints without marking the experiment complete',async({page})=>{
 await resetServer(page);await fixture(page);await loginAPI(page);await page.goto('/');
 await expect(page.locator('#print-experiment')).toBeVisible();
 const before=await page.locator('#complete-day').getAttribute('aria-pressed');
 const popupPromise=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await popupPromise;
 await expect(popup.locator('#print-fit')).not.toHaveText('正在排版…');
 await expect(popup.locator('.step-art svg.science-diagram[role="img"]')).toHaveCount(4);
 await expect(popup.locator('.materials li svg')).toHaveCount(4);
 await expect(popup.locator('.safety')).toContainText('安全要点');
 await expect(popup.locator('.safety')).toContainText('不放任何重物');
 await expect(popup.locator('.safety')).toContainText('滑落、碰托盘或书移动就停');
 await expect(popup.locator('.safety')).not.toContainText('全程近距离陪伴');
 expect(await popup.locator('.discovery .lines').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(90);
 await expect(popup.locator('#print-now')).toBeEnabled();
 if(test.info().project.name==='mobile-chromium'){
  await expectPhonePreview(popup);
  const boxes=await popup.locator('.visual-step').evaluateAll(steps=>steps.map(step=>step.getBoundingClientRect().top));
  expect(boxes.every((y,i)=>i===0||y>boxes[i-1])).toBe(true);
  await mkdir('test-results/visual-review',{recursive:true});
  await popup.screenshot({path:'test-results/visual-review/a4-normal-phone-preview.png'});
 }
 await popup.emulateMedia({media:'print'});await expect(popup.locator('.toolbar')).toBeHidden();
 const illustrated=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
 expect((illustrated.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
 await mkdir('test-results/visual-review',{recursive:true});
 await popup.locator('.sheet').screenshot({path:`test-results/visual-review/a4-illustrated-${test.info().project.name}.png`});
 await popup.emulateMedia({media:'screen'});
 await popup.locator('#switch-print').click();
 await expect(popup.locator('#switch-print')).toHaveText('返回看图卡');
 await expect(popup.locator('#print-fit')).not.toHaveText('正在排版…');await expect(popup.locator('.step')).toHaveCount(4);await expect(popup.locator('.materials li').first()).toBeVisible();await expect(popup.locator('.safety')).toContainText('成人全程近距离陪伴');
 if(test.info().project.name==='mobile-chromium')await expectPhonePreview(popup);
 await popup.emulateMedia({media:'print'});await expect(popup.locator('.toolbar')).toBeHidden();
 const sizes=await popup.locator('.sheet').evaluate(el=>({width:el.scrollWidth,available:el.clientWidth,font:parseFloat(el.style.getPropertyValue('--body-size')),height:el.scrollHeight,blocked:el.ownerDocument.body.classList.contains('print-overflow')}));
 expect(sizes.width).toBeLessThanOrEqual(sizes.available+1);expect(sizes.font).toBeGreaterThanOrEqual(10);expect(sizes.blocked).toBe(false);await expect(popup.locator('#print-now')).toBeEnabled();expect(sizes.height).toBeLessThanOrEqual(281*96/25.4+1);
 const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
 // Chromium emits one /Type /Page dictionary per physical PDF page.
 expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
 await popup.emulateMedia({media:'screen'});
 await popup.evaluate(()=>{const sheet=document.querySelector('.sheet');window.originalPrintHTML=sheet.innerHTML;sheet.innerHTML+='<p>'+('完整安全提示，不能裁剪。'.repeat(1500))+'</p>';window.dispatchEvent(new Event('beforeprint'));});
 await expect(popup.locator('#print-now')).toBeDisabled();await expect(popup.locator('#print-fit')).toContainText('暂不提供单页打印');
 await popup.emulateMedia({media:'print'});await expect(popup.locator('.print-blocker')).toBeVisible();await expect(popup.locator('.sheet')).toBeHidden();
 await popup.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 await expect(popup.locator('#print-now')).toBeDisabled();
 await popup.emulateMedia({media:'screen'});await popup.evaluate(()=>{document.querySelector('.sheet').innerHTML=window.originalPrintHTML;window.dispatchEvent(new Event('beforeprint'));});await expect(popup.locator('#print-now')).toBeEnabled();
 await popup.locator('#switch-print').click();await expect(popup.locator('.visual-step')).toHaveCount(4);
 await expect(popup.locator('#print-now')).toBeEnabled();
 await popup.close();expect(await page.locator('#complete-day').getAttribute('aria-pressed')).toBe(before);
});


async function expectPhonePreview(popup){
 const layout=await popup.evaluate(()=>({
  viewport:window.innerWidth,root:document.documentElement.scrollWidth,
  sheet:document.querySelector('.sheet').getBoundingClientRect().width,
  controls:[...document.querySelectorAll('.toolbar button')].map(button=>button.getBoundingClientRect().right),
  measuring:document.body.classList.contains('paper-measure')
 }));
 expect(layout.viewport).toBeLessThan(550);expect(layout.root).toBeLessThanOrEqual(layout.viewport+1);
 expect(layout.sheet).toBeLessThan(layout.viewport);expect(Math.max(...layout.controls)).toBeLessThanOrEqual(layout.viewport);
 expect(layout.measuring).toBe(false);
}

for(const [age,prompt] of [['4-6',/等一样久.*5圈和20圈/],['7-9',/不搅、搅5圈、搅20圈/],['10-12',/同一观察时窗.*小圆和较大圆.*5或20圈.*水杯参照/],['13-16',/搅10圈的B和C.*缺测或无差别/]]){
 test(`Day 172 ${age} illustrated A4 keeps the key comparison, safety and drawing space`,async({page})=>{
  await resetServer(page);await fixture(page,{children:[{nickname:'合成探险家',ageBand:age}]});await loginAPI(page);await page.goto('/');
  await page.locator('#navigator-handle').click();await expect(page.locator('#day-map')).toBeVisible();
  await page.locator('#map-month').selectOption('all');await page.locator('[data-filter="all"]').click();
  await page.locator('#map-search').fill('172');await page.locator('#map-grid [data-day="172"]').click();
  await expect(page.locator('#day-map')).toBeHidden();await expect(page.locator('#day-number')).toContainText('DAY 172 / 365');
  const opening=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await opening;
  await expect(popup.locator('h1')).toHaveText('轻搅和多搅后的油滴');
  await expect(popup.locator('.discovery p')).toHaveText(prompt);await expect(popup.locator('.safety')).toContainText('护目镜');
  await expect(popup.locator('.step-art svg.science-diagram')).toHaveCount(4);
  for(const n of [2,3,4])await expect(popup.locator(`[data-a4-action="${n}"]`)).toBeVisible();
  await expect(popup.locator('[data-a4-action="3"] text')).toContainText(['10 秒','60 秒','180 秒']);
  if(age==='7-9'){
   await expect(popup.locator('[data-a4-action="2"]')).toContainText('C0 · 不搅');
   await expect(popup.locator('[data-a4-action="3"]')).toContainText('指定零点');
  }
  if(age==='13-16'){
   await expect(popup.locator('[data-a4-action="2"]')).toContainText('A1 → D1 → B1 → C1 → C2 → B2 → D2 → A2');
   await expect(popup.locator('[data-a4-action="4"]')).toContainText('B / C 同为 10 圈');
  }
  await expect(popup.locator('#print-now')).toBeEnabled();
  await popup.emulateMedia({media:'print'});await expect(popup.locator('.sheet')).toBeVisible();
  for(const art of await popup.locator('.step-art > svg').all())await expect(art).toBeVisible();
  expect(await popup.locator('.discovery .lines').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(90);
  const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
  expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  await mkdir('test-results/visual-review',{recursive:true});
  await popup.locator('.sheet').screenshot({path:`test-results/visual-review/a4-day172-${age}-${test.info().project.name}.png`});
  await popup.close();
 });
}

for(const [day,age,icons] of [[9,'4-6',['measure','book','measure']],[14,'4-6',['cup']],[7,'10-12',['paper']],[14,'13-16',['cup']]]){
 test(`Day ${day} ${age} uses recognizable materials and prints on one A4 page`,async({page})=>{
  await resetServer(page);await fixture(page,{children:[{nickname:'合成探险家',ageBand:age}]});await loginAPI(page);await page.goto('/');
  await page.locator('#navigator-handle').click();await expect(page.locator('#day-map')).toBeVisible();
  await page.locator('#map-month').selectOption('all');await page.locator('[data-filter="all"]').click();
  await page.locator('#map-search').fill(String(day));await page.locator(`#map-grid [data-day="${day}"]`).click();
  await expect(page.locator('#day-map')).toBeHidden();
  await expect(page.locator('#day-number')).toContainText(`DAY ${String(day).padStart(2,'0')} / 365`);
  const opening=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await opening;
  const materials=popup.locator('.materials');
  if(day===9){
   const actual=await materials.locator('li svg').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-icon')));
   expect(actual).toEqual(icons);
   await expect(materials).toContainText('厚书1本');
  }else if(day===7){
   const cardboard=materials.locator('li').filter({hasText:'硬纸板1张'});
   await expect(cardboard.locator('[data-icon="paper"]')).toBeVisible();
   await expect(cardboard).toContainText('成人裁');
  }else{
   await expect(materials.locator('.recognize [data-icon="cup"]')).toBeVisible();
   await expect(materials).toContainText('请成人按完整版的材料表准备');
  }
  await expect(popup.locator('.safety')).toContainText('安全要点');
  await expect(popup.locator('.step-art > svg[viewBox="24 65 592 235"]')).toHaveCount(4);
  await expect(popup.locator('#print-now')).toBeEnabled();
  if(test.info().project.name==='mobile-chromium')await expectPhonePreview(popup);
  await popup.emulateMedia({media:'print'});
  await expect(materials).toBeVisible();
  await expect(popup.locator('.safety')).toBeVisible();
  if(day===7)await expect(materials.locator('li').filter({hasText:'硬纸板1张'}).locator('[data-icon="paper"]')).toBeVisible();
  else for(const icon of new Set(icons))await expect(materials.locator(`[data-icon="${icon}"]`).first()).toBeVisible();
  for(const artwork of await popup.locator('.step-art > svg').all())await expect(artwork).toBeVisible();
  const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
  expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  await mkdir('test-results/visual-review',{recursive:true});
  await popup.locator('.sheet').screenshot({path:`test-results/visual-review/a4-day${day}-${age}-materials-${test.info().project.name}.png`});
  await popup.close();
 });
}

test('A dense card prints a single A4 without dropping its stop and cleanup instructions',async({page})=>{
 await resetServer(page);await fixture(page,{children:[{nickname:'合成探险家',ageBand:'13-16'}]});await loginAPI(page);await page.goto('/');
 await page.locator('#navigator-handle').click();await expect(page.locator('#day-map')).toBeVisible();
 await page.locator('#map-month').selectOption('all');await page.locator('[data-filter="all"]').click();
 await page.locator('#map-search').fill('130');await page.locator('#map-grid [data-day="130"]').click();
 await expect(page.locator('#day-number')).toContainText('DAY 130 / 365');
 const opening=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await opening;
 await expect(popup.locator('#print-now')).toBeEnabled();
 await popup.emulateMedia({media:'print'});
 await expect(popup.locator('.safety')).toBeVisible();
 await expect(popup.locator('.safety')).toContainText('严禁干倒或吹扫');
 await expect(popup.locator('.safety')).toContainText('发现霉样物、异常色或污染立即停止');
 await expect(popup.locator('.step-art svg.science-diagram')).toHaveCount(4);
 expect(await popup.locator('.sheet').evaluate(sheet=>parseFloat(sheet.style.getPropertyValue('--body-size')))).toBeGreaterThanOrEqual(10);
 expect(await popup.locator('.discovery .lines').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(90);
 const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
 expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
 await mkdir('test-results/visual-review',{recursive:true});
 await popup.locator('.sheet').screenshot({path:`test-results/visual-review/a4-dense-day130-${test.info().project.name}.png`});
 await popup.close();
});
