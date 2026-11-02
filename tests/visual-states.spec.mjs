import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resetServer,fixture,loginAPI,cloudSaved} from './account-helpers.mjs';
async function ready(page,options={}){await resetServer(page);const seed=await fixture(page,options);await loginAPI(page,options.email||'owner@qa.test');await page.goto('/#lab');await expect(page.locator('#family-bar')).toBeVisible();if(await page.locator('#child-switch').inputValue()!==seed.children[0].id)await page.locator('#child-switch').selectOption(seed.children[0].id);await expect(page.locator('#open-safety')).toBeVisible();return seed}
async function appearance(node){return node.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,border:s.borderStyle,opacity:s.opacity}})}
async function contrast(node){return node.evaluate(el=>{const s=getComputedStyle(el),luminance=color=>{const values=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2]};const levels=[luminance(s.color),luminance(s.backgroundColor)].sort((a,b)=>b-a);return(levels[0]+.05)/(levels[1]+.05)})}
async function shot(page,info,name){mkdirSync('test-results/visual-review',{recursive:true});await page.screenshot({path:`test-results/visual-review/${info.project.name}-visual-states-${name}.png`,fullPage:false})}

test('current viewed and unviewed steps use distinct accessible treatments and labels',async({page},info)=>{
 await ready(page);await page.locator('#preview-main').click();await expect(page.locator('#workspace-toolbar')).toHaveAttribute('data-preparation','preview');await expect(page.locator('.safety-compact')).toHaveCSS('background-color','rgb(234, 241, 255)');await page.locator('#step-next').click();
 const current=page.locator('.flow-button[data-read-state=current]'),viewed=page.locator('.flow-button[data-read-state=viewed]').first(),unviewed=page.locator('.flow-button[data-read-state=unviewed]').first();
 await expect(current).toContainText('当前查看');await expect(viewed).toContainText('已查看');await expect(unviewed).toContainText('未查看');
 const styles=await Promise.all([current,viewed,unviewed].map(appearance));expect(new Set(styles.map(s=>s.background)).size).toBe(3);expect(styles[2].border).toBe('dashed');
 for(const node of [current,viewed,unviewed])expect(await contrast(node)).toBeGreaterThanOrEqual(4.5);
 // Programmatic focus after mouse input does not establish :focus-visible.
 await current.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await expect(current).toBeFocused();await expect(current).toHaveCSS('outline-style','solid');await expect(current).toHaveCSS('outline-width','3px');
 await page.locator('.flow').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,info,'steps');
});

test('preparation and primary secondary disabled states are visually distinguishable',async({page},info)=>{
 await ready(page);await expect(page.locator('#workspace-toolbar')).toHaveAttribute('data-preparation','locked');const before=await appearance(page.locator('.safety-compact'));
 await page.locator('#open-safety').click();const disabled=await appearance(page.locator('#begin'));expect(disabled.opacity).toBe('1');expect(disabled.border).toBe('dashed');expect(await contrast(page.locator('#begin'))).toBeGreaterThanOrEqual(4.5);
 for(const i of [0,1,2])await page.locator(`[data-check="${i}"]`).check();await expect(page.locator('#begin')).toBeEnabled();
 // Wait for the declared transition to reach its real enabled color, not an intermediate frame.
 await expect(page.locator('#begin')).toHaveCSS('background-color','rgb(18, 100, 84)');expect((await appearance(page.locator('#begin'))).background).not.toBe(disabled.background);expect(await contrast(page.locator('#begin'))).toBeGreaterThanOrEqual(4.5);await page.locator('#begin').click();await expect(page.locator('#workspace-toolbar')).toHaveAttribute('data-preparation','ready');await expect(page.locator('#open-safety')).toContainText('已确认');const after=await appearance(page.locator('.safety-compact'));expect(after.background).not.toBe(before.background);
 await expect(page.locator('#safety-dialog')).not.toBeVisible();await expect.poll(()=>page.evaluate(()=>history.state?.littleLabDialog||null)).toBe(null);
 await expect(page.locator('#open-safety')).toHaveCSS('background-color','rgb(255, 255, 255)');expect(await contrast(page.locator('#open-safety'))).toBeGreaterThanOrEqual(4.5);
 await expect.poll(()=>page.evaluate(()=>{const stage=document.querySelector('#step-stage').getBoundingClientRect(),padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),max=Math.max(0,document.scrollingElement.scrollHeight-innerHeight);return Math.abs(scrollY-Math.max(0,Math.min(stage.top+scrollY-padding,max)))})).toBeLessThan(2);
 await expect.poll(async()=>Math.abs((await page.locator('.site-header').boundingBox()).y)).toBeLessThan(2);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await shot(page,info,'confirmed');await cloudSaved(page);await expect(page.locator('#cloud-status')).toHaveAttribute('data-save-state','saved');expect(await contrast(page.locator('#cloud-status'))).toBeGreaterThanOrEqual(4.5);
});

test('locked months retain readable contrast and opaque friendly explanation',async({page},info)=>{
 await ready(page,{email:'visual-parent@qa.test',role:'parent',unlockAll:false,unlockThrough:1});await page.locator('nav a[href="#journey"]').click();const open=page.locator('[data-journey-month="1"]'),locked=page.locator('[data-journey-month="2"]');await expect(locked).toBeVisible();expect((await appearance(locked)).border).toBe('dashed');expect((await appearance(open)).background).not.toBe((await appearance(locked)).background);expect(await contrast(locked)).toBeGreaterThanOrEqual(4.5);await locked.focus();await page.keyboard.press('Enter');await expect(page.locator('#toast')).toHaveClass(/show/);await expect(page).toHaveURL(/#journey$/);await expect.poll(async()=>Number((await appearance(page.locator('#toast'))).opacity)).toBe(1);expect(await contrast(page.locator('#toast'))).toBeGreaterThanOrEqual(4.5);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,info,'locked');
});
