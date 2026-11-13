import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {resetServer,fixture,loginAPI,cloudSaved} from './account-helpers.mjs';

for(const width of [320,360])for(const [name,nickname] of [['short','合成二'],['long-latin','ABCDEFGHIJKLMNOPQRSTUVWX'],['long-cjk','合成'.repeat(12)]]){
 test(`record saved badge stays coherent at ${width}px with ${name} nickname`,async({page},info)=>{
  await page.setViewportSize({width,height:800});await resetServer(page);
  await fixture(page,{children:[{nickname,ageBand:'4-6'}]});await loginAPI(page);await page.goto('/');
  await expect(page.locator('#open-safety')).toBeVisible();await page.locator('#tab-observations').click();
  const field=page.locator('[data-field="spoken"]'),status=page.locator('#save-status');
  await field.fill('QA saved layout');await cloudSaved(page);await expect(status).toHaveText('已保存 · '+nickname);
  await status.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await expect(status).toBeInViewport();
  const geometry=await status.evaluate(el=>{
   const box=el.getBoundingClientRect(),note=el.parentElement.getBoundingClientRect(),privacy=document.createRange();
   privacy.selectNodeContents(el.parentElement.firstChild);const privacyBox=privacy.getBoundingClientRect();
   const text=document.createRange();text.selectNodeContents(el);const lines=[...text.getClientRects()];
   return {fragments:el.getClientRects().length,below:box.top>=privacyBox.bottom,left:box.left>=note.left,right:box.right<=note.right+1,contentsFit:lines.every(r=>r.left>=box.left&&r.right<=box.right+1),lines:lines.length,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(geometry.fragments).toBe(1);expect(geometry.below).toBe(true);expect(geometry.left).toBe(true);expect(geometry.right).toBe(true);expect(geometry.contentsFit).toBe(true);expect(geometry.overflow).toBe(false);
  if(name==='short')expect(geometry.lines).toBe(1);
  if(name==='long-cjk')expect(geometry.lines).toBeGreaterThan(1);
  fs.mkdirSync('test-results/visual-review',{recursive:true});await page.screenshot({path:`test-results/visual-review/${info.project.name}-record-saved-${width}-${name}.png`,fullPage:false});
  await page.reload();await expect(page.locator('#open-safety')).toBeVisible();await page.locator('#tab-observations').click();await expect(field).toHaveValue('QA saved layout');await expect(status).toHaveText('已保存 · '+nickname);
 });
}
