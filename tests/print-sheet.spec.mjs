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
 await expect(popup.locator('.safety')).toContainText('先请成人读完整版');
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
 await expect(popup.locator('#print-fit')).not.toHaveText('正在排版…');await expect(popup.locator('.step')).toHaveCount(4);await expect(popup.locator('.materials li').first()).toBeVisible();await expect(popup.locator('.safety')).toContainText('成人');
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

for(const [age,prompt] of [['4-6',/等一样久.*5圈和20圈/],['10-12',/同一观察时窗.*小圆和较大圆.*5或20圈.*水杯参照/]]){
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
  await expect(popup.locator('#print-now')).toBeEnabled();
  await popup.emulateMedia({media:'print'});await expect(popup.locator('.sheet')).toBeVisible();
  expect(await popup.locator('.discovery .lines').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(90);
  const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
  expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  await mkdir('test-results/visual-review',{recursive:true});
  await popup.locator('.sheet').screenshot({path:`test-results/visual-review/a4-day172-${age}-${test.info().project.name}.png`});
  await popup.close();
 });
}
