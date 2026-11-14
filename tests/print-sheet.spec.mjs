import {test,expect} from '@playwright/test';
import {resetServer,fixture,loginAPI} from './account-helpers.mjs';
test('A4 preview contains all four steps and prints without marking the experiment complete',async({page})=>{
 await resetServer(page);await fixture(page);await loginAPI(page);await page.goto('/');
 await expect(page.locator('#print-experiment')).toBeVisible();
 const before=await page.locator('#complete-day').getAttribute('aria-pressed');
 const popupPromise=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await popupPromise;
 await expect(popup.locator('#print-fit')).not.toHaveText('正在排版…');await expect(popup.locator('.step')).toHaveCount(4);await expect(popup.locator('.materials li').first()).toBeVisible();await expect(popup.locator('.safety')).toContainText('成人');
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
 await popup.close();expect(await page.locator('#complete-day').getAttribute('aria-pressed')).toBe(before);
});
