import {test,expect} from '@playwright/test';
import {locales} from '../../src/i18n/locales';
import {readFileSync} from 'node:fs';
const {recipes}=JSON.parse(readFileSync('content/recipes.json','utf8')) as {recipes:{id:string}[]};
const base='/pour-over-coffee';
test.beforeEach(async({page})=>{
 await page.route('https://gc.zgo.at/**',route=>route.abort());
 await page.route('https://*.goatcounter.com/**',route=>route.abort());
 await page.route('https://fonts.googleapis.com/**',route=>route.abort());
 await page.route('https://fonts.gstatic.com/**',route=>route.abort());
});
test('homepage is editorial; complete instructions are on the detail page',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/zh-Hant/`);
 await expect(page.locator('h1')).toContainText('每一杯');
 await expect(page.getByTestId('pour-timeline')).toHaveCount(0);
 await expect(page.locator('[data-recipe]')).toHaveCount(19);
 await page.locator('[data-recipe="kasuya-46"] .card-actions a').click();
 await expect(page.getByTestId('pour-timeline')).toBeVisible();
 await expect(page.getByTestId('pour-timeline')).toContainText('2:10');
 await expect(page.getByTestId('pour-timeline')).toContainText('2:40');
 await expect(page.locator('.detail-sidebar')).toContainText('水質');
 await expect(page.locator('[data-recipe-editorial]')).toContainText('適合');
 await expect(page.locator('[data-recipe-editorial]')).toContainText('優點');
 await expect(page.locator('[data-recipe-editorial]')).toContainText('需要留意');
 await expect(page.locator('.recipe-detail-image[data-source-image="official"]')).toHaveCount(1);
 await expect(page.locator('.step-list li')).toHaveCount(6);
 expect(errors).toEqual([]);
});
test('filters, empty result, reset and shared comparison work',async({page})=>{
 await page.goto(`${base}/en/`);
 await page.getByRole('searchbox').fill('Hoffmann');await expect(page.locator('[data-recipe]')).toHaveCount(2);
 await page.getByLabel('Choose a brewer').selectOption('pulsar');await expect(page.locator('[data-recipe]')).toHaveCount(0);
 await page.getByRole('button',{name:'Reset filters',exact:true}).last().click();await expect(page.locator('[data-recipe]')).toHaveCount(19);
 for(const id of ['kasuya-46','hoffmann-one-cup','rao-pulsar'])await page.locator(`[data-recipe="${id}"] button`).click();
 await page.locator('[data-recipe="licata-v60"] button').click();
 await expect(page.getByRole('status').filter({hasText:'You can compare up to three recipes.'})).toHaveCount(1);
 await expect(page.locator('.tray-item')).toHaveCount(3);
 await page.locator('.compare-tray a').click();await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
 await expect(page.getByTestId('pour-timeline')).toHaveCount(0);
 const url=page.url();await page.reload();await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
 expect(page.url()).toBe(url);
 await page.locator('.language-trigger').click();await page.locator('.language-options a[lang="de"]').click();await expect(page).toHaveURL(/\/de\/compare\/\?ids=/);await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.locator('.comparison-table')).toContainText('300 mL');
});
test('invalid comparison links are understandable and recoverable',async({page})=>{
 await page.goto(`${base}/en/compare/?ids=missing`);await expect(page.getByRole('status').filter({hasText:'Some recipes'})).toBeVisible();await expect(page.locator('.empty-state')).toContainText('Choose recipes');
});
for(const locale of locales)test(`static ${locale} pages render complete locale content`,async({page})=>{
 test.setTimeout(90_000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const suffix of ['','equipment/','authors/','sources/','about/','terms/','privacy/',...recipes.map(r=>`recipes/${r.id}/`)]){
   const response=await page.goto(`${base}/${locale}/${suffix}`,{waitUntil:'domcontentloaded'});expect(response?.status()).toBe(200);await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('h1')).not.toBeEmpty();
 }
 expect(errors).toEqual([]);
});
test('equipment catalogue filters official records and links source-backed recipes',async({page})=>{
 await page.goto(`${base}/zh-Hant/equipment/`);
 await expect(page.locator('[data-equipment]')).toHaveCount(55);
 await expect(page.locator('[data-equipment="origami-air-s"]')).toContainText('64');
 await expect(page.locator('[data-equipment="origami-air-s"] .equipment-experience')).toContainText('杯感與實際使用回饋');
 await expect(page.locator('[data-equipment="origami-air-s"] .experience-tags')).toContainText('酸質與清晰度較突出');
 await expect(page.locator('[data-equipment="origami-air-s"] .equipment-card-image[data-source-image="official"]')).toHaveCount(1);
 await expect(page.locator('[data-equipment="ek-unspecified"]')).toContainText('型號待確認');
 await expect(page.locator('[data-equipment="ek-unspecified"] .equipment-card-image')).toHaveCount(0);
 await expect(page.locator('[data-equipment="hario-v60-mugen-02"]')).toContainText('V60 MUGEN');
 await expect(page.locator('[data-equipment="hario-v60-mugen-02"] a[href*="lamill-mugen"]')).toHaveCount(1);
 await expect(page.locator('.equipment-grid')).toHaveCSS('column-width','300px');
 await page.getByLabel('搜尋品牌、型號或相容性').fill('ZP6');
 await expect(page.locator('[data-equipment]')).toHaveCount(1);
 await expect(page.locator('[data-equipment="1zpresso-zp6-special"]')).toContainText('90 clicks per rotation');
 await page.getByLabel('搜尋品牌、型號或相容性').fill('');
 await page.getByRole('button',{name:/手沖壺/}).click();
 await expect(page.locator('[data-equipment]')).toHaveCount(11);
 await expect(page.locator('[data-equipment="fellow-stagg-ekg-pro"]')).toContainText('40–100');
 await page.getByRole('button',{name:/磨豆器/}).click();
 await expect(page.locator('[data-equipment]')).toHaveCount(9);
 await expect(page.locator('[data-equipment="1zpresso-zp6-special"] footer a[href="https://1zpresso.coffee/product/zp6-special/"]')).toHaveCount(1);
 await expect(page.locator('[data-equipment="1zpresso-zp6-special"] a[href*="rincon-origami"]')).toHaveCount(1);
 await page.setViewportSize({width:390,height:844});
 expect(await page.locator('.equipment-card').evaluateAll(cards=>new Set(cards.map(card=>Math.round(card.getBoundingClientRect().x))).size)).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('mobile and long-language layouts keep controls inside viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const locale of ['zh-Hant','ja','de']){
  await page.goto(`${base}/${locale}/?ids=kasuya-46,hoffmann-one-cup,rao-pulsar`);
  await expect(page.locator('.mobile-menu')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.locator('.mobile-menu').click();await expect(page.locator('.main-nav')).toBeVisible();
 }
});
test('tablet headers support long localized labels',async({page})=>{
 await page.setViewportSize({width:768,height:1024});
 for(const locale of ['de','fr','pt-BR']){
  await page.goto(`${base}/${locale}/`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await expect(page.locator('.mobile-menu')).toBeVisible();
 }
});

test('language links preserve recipe and query; keyboard and outside click dismiss the list',async({page})=>{
 await page.goto(`${base}/zh-Hant/recipes/wong-switch/?ids=kasuya-46,wong-switch&brewer=switch`);
 const trigger=page.locator('.language-trigger');
 await trigger.focus();await page.keyboard.press('Enter');
 await expect(trigger).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('.language-options a')).toHaveCount(9);
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(page.locator('.language-options')).toHaveCount(0);
 await trigger.click();await page.locator('h1').click();await expect(page.locator('.language-options')).toHaveCount(0);
 await trigger.click();await page.locator('.language-options a[lang="ja"]').click();
 await expect(page).toHaveURL(/ja\/recipes\/wong-switch\/\?ids=kasuya-46%2Cwong-switch&brewer=switch/);
 await expect(page.locator('html')).toHaveAttribute('lang','ja');
});
test('expanded catalogue and source-specific instructions remain usable',async({page})=>{
 await page.goto(`${base}/zh-Hant/`);
 await page.getByLabel('選擇濾杯').selectOption('switch');await expect(page.locator('[data-recipe]')).toHaveCount(3);
 await page.goto(`${base}/zh-Hant/recipes/boen-switch/`);
 await expect(page.locator('.detail-intro')).toContainText('比賽原版配方');
 await expect(page.locator('.parameters')).toContainText('240 mL');
 await expect(page.getByTestId('pour-timeline')).toContainText('50 g');
 await expect(page.locator('.step-list')).toContainText('在 1:30 再次關閉閥門');
 await page.goto(`${base}/zh-Hant/recipes/wong-switch/`);
 await expect(page.locator('.parameters')).toContainText('來源未提供');
 await page.goto(`${base}/zh-Hant/recipes/rojewska-v60/`);
 await expect(page.locator('.parameters')).toContainText('2:15');
 await expect(page.getByTestId('pour-timeline')).toContainText('—');
 await page.goto(`${base}/zh-Hant/recipes/grill-v60/`);
 await expect(page.locator('.parameters')).toContainText('92°C');
 await page.goto(`${base}/zh-Hant/recipes/chronicler-switch/`);
 await expect(page.locator('.detail-intro')).toContainText('Coffee Chronicler');
});

test('Origami conditions combine, survive language switching and reset completely',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}/zh-Hant/`);
 await expect(page.locator('.site-footer')).not.toContainText('imycc');
 await page.getByLabel('選擇濾杯').selectOption('origami');
 await expect(page.locator('[data-recipe]')).toHaveCount(5);
 await page.locator('.condition-filters summary').click();
 await page.getByLabel('磨豆器',{exact:true}).selectOption('zp6-special');
 await page.getByLabel('濾紙',{exact:true}).selectOption('sibarist-conic');
 await page.getByLabel('處理法',{exact:true}).selectOption('natural');
 await expect(page.locator('[data-recipe]')).toHaveCount(1);
 await expect(page.locator('[data-recipe]')).toHaveAttribute('data-recipe','rincon-origami');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('.condition-filters').screenshot({path:'outputs/qa/origami-conditions-mobile.png'});
 await page.reload();await expect(page.locator('[data-recipe]')).toHaveCount(1);
 await page.locator('.language-trigger').click();await page.locator('.language-options a[lang="de"]').click();
 await expect(page).toHaveURL(/grinder=zp6-special/);await expect(page.getByLabel('Filterpapier',{exact:true})).toHaveValue('sibarist-conic');
 await page.getByRole('button',{name:'Filter zurücksetzen',exact:true}).click();
 await expect(page.locator('[data-recipe]')).toHaveCount(19);
 expect(new URL(page.url()).search).toBe('');
});

test('original grinder notation, per-pour temperatures and missing times remain visible',async({page})=>{
 await page.goto(`${base}/zh-Hant/recipes/kobayashi-origami/`);
 await expect(page.locator('.detail-sidebar')).toContainText('RED CLICKS');
 await expect(page.locator('.detail-sidebar')).toContainText('Wave');
 await expect(page.locator('.step-list')).toContainText('75°C');
 await page.goto(`${base}/zh-Hant/recipes/rincon-origami/`);
 await expect(page.locator('.parameters')).toContainText('來源未提供');
 await expect(page.locator('.step-list')).toContainText('92°C');
 await expect(page.locator('.step-list')).toContainText('86°C');
 await expect(page.locator('.detail-sidebar')).toContainText('日曬');
 await page.goto(`${base}/zh-Hant/compare/?ids=kobayashi-origami,rincon-origami,gil-origami-2024`);
 await expect(page.locator('.comparison-table')).toContainText('1Zpresso K-Ultra');
 await expect(page.locator('.comparison-table')).toContainText('Sibarist Conic');
});
