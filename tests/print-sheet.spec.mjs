import {test,expect} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
import {resolveAgeProtocol} from '../dist/diagrams.js';
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

const inventorySource=JSON.parse(await readFile(new URL('../dist/data.json',import.meta.url),'utf8'));
for(const [day,age,icons] of [
 [9,'4-6',['measure','book','measure']],[7,'10-12',['paper']],
 ...['4-6','7-9','10-12','13-16'].map(age=>[14,age,['cup','goggles','spoon','tray']]),
 ...['7-9','10-12','13-16'].map(age=>[5,age,['cup','goggles','filter','spoon']]),
]){
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
   await expect(materials.locator('.materials-reference')).toHaveCount(0);
   await expect(materials.locator('ul[data-review="full"]')).toBeVisible();
  }
  await expect(popup.locator('.safety')).toContainText('安全要点');
  await expect(popup.locator('.step-art > svg[viewBox="24 65 592 235"]')).toHaveCount(4);
  await expect(popup.locator('#print-now')).toBeEnabled();
  if(test.info().project.name==='mobile-chromium')await expectPhonePreview(popup);
  await popup.emulateMedia({media:'print'});
  await expect(materials).toBeVisible();
  await expect(popup.locator('.safety')).toBeVisible();
  if([5,14].includes(day)){
   await popup.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
   const authored=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age).materials;
   await expect(materials.locator('ul[data-review="full"] li span')).toHaveText(authored);
   expect(await popup.locator('.discovery .lines').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(90);
  }
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


for(const [day,age,full,frame=45,balanced=false] of [
 [24,'4-6',true,38,true],[106,'13-16',true],[176,'10-12',true,38],[302,'13-16',true],
 ...['4-6','7-9','10-12','13-16'].map(age=>[73,age,'box',45]),
 ...['4-6','7-9','10-12','13-16'].map(age=>[136,age,'car',38]),
 ...['4-6','7-9','10-12','13-16'].map(age=>[172,age,'oil',38]),
 [200,'4-6',false],[203,'10-12','photo'],[203,'13-16','photo'],[209,'10-12',true,38],
 [228,'4-6','setup',38],[228,'7-9','setup',38],[228,'10-12',false],[228,'13-16',false],
 ...['4-6','7-9','10-12','13-16'].map(age=>[235,age,'wet']),
 ...['4-6','7-9','10-12','13-16'].map(age=>[240,age,'filler']),
 ...['4-6','7-9','10-12','13-16'].map(age=>[248,age,'folding']),
 ...['4-6','7-9','10-12','13-16'].map(age=>[250,age,'coordinates']),
 ...['4-6','7-9','10-12','13-16'].map(age=>[255,age,'optics']),
 ...['4-6','7-9','10-12','13-16'].map(age=>[307,age,'dishes']),
]){
 test(`Day ${day} ${age}: A4 preserves four full-size diagrams and chooses the fitting materials list`,async({page})=>{
  await resetServer(page);await fixture(page,{children:[{nickname:'合成探险家',ageBand:age}]});await loginAPI(page);await page.goto('/');
  await page.locator('#navigator-handle').click();await expect(page.locator('#day-map')).toBeVisible();
  await page.locator('#map-month').selectOption('all');await page.locator('[data-filter="all"]').click();
  await page.locator('#map-search').fill(String(day));await page.locator(`#map-grid [data-day="${day}"]`).click();
  await expect(page.locator('#day-number')).toContainText(`DAY ${day} / 365`);
  const opening=page.waitForEvent('popup');await page.locator('#print-experiment').click();const popup=await opening;
  await expect(popup.locator('#print-now')).toBeEnabled();
  if(test.info().project.name==='mobile-chromium')await expectPhonePreview(popup);
  await popup.emulateMedia({media:'print'});
  await popup.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  const materials=popup.locator('.materials');
  const reference=materials.locator('.materials-reference');
  if(full){
   await expect(reference).toBeHidden();
   const list=materials.locator('[data-fit-inventory]');
   await expect(list).toBeVisible();
   expect(await list.getAttribute('data-balanced')!==null).toBe(balanced);
   expect(await list.locator('li').evaluateAll(items=>items.every(item=>item.getClientRects().length===1))).toBe(true);
   if(full==='setup'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list.locator('li').first()).toContainText('先贴耐水标签');
    await expect(list.locator('li').nth(1)).toContainText(age==='4-6'?'清水W＋圆形、稀释白醋V＋方形':'左至右W1/V1/W2/V2；T仅供成人换位');
    await expect(list).toContainText('每杯5毫升样品＋5毫升I指示液');
    await expect(list).toContainText('不串杯、不回倒');
    await expect(list).toContainText('具体配方、器具尺寸和摆位照网页版');
    await expect(popup.locator('.safety')).toContainText('标签湿糊/脱落或身份不明立即停');
   }else if(full==='oil'){
    await expect(list).toHaveAttribute('data-review','setup');
    const counts={'4-6':'2杯2专勺','7-9':'3杯2专勺，C0不插勺','10-12':'5杯5专勺；W只有50毫升水也搅','13-16':'8杯8专勺'};
    await expect(list).toContainText(counts[age]);
    await expect(list).toContainText(age==='13-16'?'废液罐≥1升':'废液罐≥500毫升');
    await expect(list).toContainText('另备清理水50毫升');
    if(age==='10-12')await expect(popup.locator('.step-art').nth(1).locator('[data-a4-water-only]')).toContainText('W · 纯水');
    await expect(popup.locator('.safety')).toContainText(resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age).safety);
   }else if(full==='photo'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list.locator('[data-icon="photo"]')).toBeVisible();
    await expect(list).toContainText('2003-19574');
    await expect(list).toContainText('印不清，记未实施');
    await expect(list).toContainText(age==='10-12'?'先盖字段，依次看局部、全图、全图＋字段':'对象／照片／扫描／上传分行；未列日期不落点');
    if(age==='10-12')await expect(popup.locator('.sheet')).not.toContainText(/1950s|1950年代|1903/);
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety);
   }else if(full==='filler'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list).toContainText('模板100%打印，核对100毫米标线');
    await expect(list).toContainText('需强推就只做纸上');
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety);
    if(age==='4-6'){
     await expect(popup.locator('.step-art').nth(2)).toContainText('只做F0和F2');
     await expect(popup.locator('.sheet')).not.toContainText('F1');
    }else await expect(popup.locator('.step-art').nth(2)).toContainText('F1仅L');
    if(age==='13-16')await expect(list).toContainText('实测和收整完再打开虚构模型');
   }else if(full==='coordinates'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list).toContainText('连续量程≥10厘米、分度1毫米');
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety);
    const cards=popup.locator('[data-a4-coordinate-exercise]');
    await expect(cards).toHaveCount(age==='10-12'?1:age==='13-16'?3:2);
    await expect(cards.locator('circle,polygon')).toHaveCount(0);
    if(age==='10-12'){
     await expect(popup.locator('.step-art').first()).toContainText('预给A/B/C/D四点');
     await expect(popup.locator('.sheet')).not.toContainText('交换仍同点');
    }
    if(age==='13-16'){
     await expect(cards.first()).toContainText('u=x−2，v=y−2');
     await expect(popup.locator('.sheet')).not.toContainText(/P在T为|Q在T为/);
    }
   }else if(full==='optics'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list.locator('[data-icon="lamp"]')).toBeVisible();
    await expect(list).toContainText({'4-6':'4张观察空表','7-9':'5张观察空表','10-12':'8张观察空表','13-16':'6张观察空表'}[age]);
    await expect(list).toContainText('按100%打印，先核100毫米线');
    await expect(list).toContainText('装置不合格就只做纸上');
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety);
    if(age==='13-16'){
     await expect(popup.locator('[data-a4-optics-model]')).toContainText('推算不回填真实观察');
     await expect(popup.locator('.sheet')).not.toContainText(/cot\(2θ\)|x靶 =/);
    }
   }else if(full==='folding'||full==='wet'){
    await expect(list).toHaveAttribute('data-review','setup');
    const roles=popup.locator('.step-role');
    await expect(roles).toHaveCount(4);
    await expect(roles.filter({hasText:'亲子一起'})).toHaveCount(0);
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety);
    if(full==='folding'){
     await expect(list.locator('[data-icon="mirror"]')).toBeVisible();
     await expect(list.locator('[data-icon="fold"]')).toBeVisible();
     await expect(list).toContainText('按100%打印，先核100毫米线');
     await expect(list).toContainText(age==='7-9'?'X框自选位置画':'X框留空');
     await expect(roles.nth(age==='13-16'?0:2)).toContainText('剪好收剪刀 · 孩子再拿纸');
     if(age==='13-16')await expect(popup.locator('.sheet')).not.toContainText(/10°：d<0，背侧|P′=P−2/);
    }else{
     await expect(roles.first()).toContainText('成人备样 · 孩子');
     await expect(list).toContainText('干区离湿盘至少40厘米');
     await expect(popup.locator('.step-art').nth(1)).toContainText('杯图不预填液体色');
    }
   }else if(full==='dishes'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list.locator('[data-icon="dishes"]')).toBeVisible();
    await expect(list).toContainText('只做干样观察，不加水');
    await expect(list).toContainText('仅观察，不入口');
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety.replace('成人处理小样和水滴','成人处理干样'));
    await expect(popup.locator('.safety')).not.toContainText('成人处理小样和水滴');
    if(age==='13-16'){
     const scenes=popup.locator('.step-art');
     await expect(scenes.nth(1)).toContainText('虚构输入');
     const audit=scenes.nth(2);
     await expect(audit).toContainText('假设数据 · 不是实测');
     await expect(audit.locator('circle')).toHaveCount(6);
     await expect(audit).not.toContainText(/白且粗：|仍不可分/);
    }
   }else if(full==='box'||full==='car'){
    await expect(list).toHaveAttribute('data-review','setup');
    await expect(list.locator(`[data-icon="${full}"]`)).toBeVisible();
    await expect(list.locator('[data-icon="ramp"]')).toBeVisible();
    const distinct=full==='car'?{'4-6':'E后30厘米','7-9':'3/6/6/3/3/6','10-12':'H3/H6的R线','13-16':'A3/A6/B3/B6各记三次'}:{'4-6':'板只抬2厘米','7-9':'1厘米区间','10-12':'2、7或12厘米','13-16':'闭盒平转180°'};
    await expect(list.locator('li').last()).toContainText(distinct[age]);
    const protocol=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age);
    await expect(popup.locator('.safety')).toContainText(protocol.safety);

   }else{
    const source=resolveAgeProtocol(inventorySource.experiments.find(e=>e.id===day),age).materials;
    await expect(list.locator('li span')).toHaveText(source);
   }
  }else{
   await expect(reference).toBeVisible();
   await expect(materials.locator('[data-fit-inventory]')).toBeHidden();
  }
  await expect(popup.locator('.safety')).toBeVisible();
  for(const svg of await popup.locator('.step-art > svg').all())await expect(svg).toBeVisible();
  await expect(popup.locator('.step-art > svg')).toHaveCount(4);
  const sizes=await popup.locator('.sheet').evaluate(sheet=>['--body-size','--art-height'].map(key=>sheet.style.getPropertyValue(key)));
  expect(sizes).toEqual(['11pt',frame+'mm']);
  if(frame===38){
   const scales=await popup.locator('.sheet').evaluate(sheet=>{
    const read=()=>Array.from(sheet.querySelectorAll('.step-art > svg'),svg=>{
     const m=svg.getScreenCTM();return [m.a,m.b,m.c,m.d];
    });
    const reduced=read();
    sheet.style.setProperty('--art-height','45mm');
    const original=read();
    sheet.style.setProperty('--art-height','38mm');
    return {original,reduced};
   });
   expect(scales.reduced).toEqual(scales.original);
  }
  expect(await popup.locator('.discovery .lines').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(90);
  const pdf=await popup.pdf({format:'A4',preferCSSPageSize:true,displayHeaderFooter:false,scale:1});
  expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  await popup.close();
 });
}
