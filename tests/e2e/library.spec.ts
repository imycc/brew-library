import {test,expect} from '@playwright/test';
import {locales} from '../../src/i18n/locales';
const base='/pour-over-coffee';
test('homepage is editorial; complete instructions are on the detail page',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/zh-Hant/`);
 await expect(page.locator('h1')).toContainText('每一杯');
 await expect(page.getByTestId('pour-timeline')).toHaveCount(0);
 await expect(page.locator('[data-recipe]')).toHaveCount(3);
 await page.locator('[data-recipe="kasuya-46"] .card-actions a').click();
 await expect(page.getByTestId('pour-timeline')).toBeVisible();
 await expect(page.getByTestId('pour-timeline')).toContainText('2:10');
 await expect(page.getByTestId('pour-timeline')).toContainText('2:40');
 await expect(page.locator('.detail-sidebar')).toContainText('水質');
 await expect(page.locator('.step-list li')).toHaveCount(6);
 expect(errors).toEqual([]);
});
test('filters, empty result, reset and shared comparison work',async({page})=>{
 await page.goto(`${base}/en/`);
 await page.getByRole('searchbox').fill('Hoffmann');await expect(page.locator('[data-recipe]')).toHaveCount(1);
 await page.getByLabel('Choose a brewer').selectOption('pulsar');await expect(page.locator('[data-recipe]')).toHaveCount(0);
 await page.getByRole('button',{name:'Reset filters',exact:true}).last().click();await expect(page.locator('[data-recipe]')).toHaveCount(3);
 for(const id of ['kasuya-46','hoffmann-one-cup','rao-pulsar'])await page.locator(`[data-recipe="${id}"] button`).click();
 await page.locator('.compare-tray a').click();await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
 await expect(page.getByTestId('pour-timeline')).toHaveCount(0);
 const url=page.url();await page.reload();await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
 expect(page.url()).toBe(url);
 await page.locator('.language-control select').selectOption('de');await expect(page).toHaveURL(/\/de\/compare\/\?ids=/);await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.locator('.comparison-table')).toContainText('300 mL');
});
test('invalid comparison links are understandable and recoverable',async({page})=>{
 await page.goto(`${base}/en/compare/?ids=missing`);await expect(page.getByRole('status').filter({hasText:'Some recipes'})).toBeVisible();await expect(page.locator('.empty-state')).toContainText('Choose recipes');
});
for(const locale of locales)test(`static ${locale} pages render complete locale content`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const suffix of ['','authors/','sources/','recipes/hoffmann-one-cup/','recipes/rao-pulsar/']){
   const response=await page.goto(`${base}/${locale}/${suffix}`);expect(response?.status()).toBe(200);await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('h1')).not.toBeEmpty();
 }
 expect(errors).toEqual([]);
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
