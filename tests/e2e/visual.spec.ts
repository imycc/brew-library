import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import type {Page} from '@playwright/test';
// These captures only need the DOM. Waiting for "load" makes the run hostage to the
// third-party product images on the equipment page, so fall back when one stalls.
const visit=async(page:Page,url:string)=>{
 try{await page.goto(url,{waitUntil:'load',timeout:20000});}
 catch{await page.waitForLoadState('domcontentloaded');}
};
test('capture selected editorial design and responsive detail surfaces',async({page})=>{
 await mkdir('outputs/qa',{recursive:true});
 await page.setViewportSize({width:1487,height:1090});
 await visit(page,'/brew-library/zh-Hant/?ids=kasuya-46');
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.featured .recipe-card-top')).toBeVisible();
 await page.screenshot({path:'outputs/qa/home-desktop.png'});
 await visit(page,'/brew-library/zh-Hant/recipes/kasuya-46/?ids=kasuya-46');
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'outputs/qa/detail-desktop.png',fullPage:true});
 await page.setViewportSize({width:1487,height:1058});
 await visit(page,'/brew-library/zh-Hant/compare/?ids=kasuya-46,hoffmann-one-cup');
 await expect(page.locator('.comparison-table')).toBeVisible();
 await page.screenshot({path:'outputs/qa/compare-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await visit(page,'/brew-library/zh-Hant/?ids=kasuya-46');
 await page.screenshot({path:'outputs/qa/home-mobile.png',fullPage:true});
 await page.setViewportSize({width:1487,height:1100});
 await visit(page,'/brew-library/zh-Hant/equipment/');
 await page.screenshot({path:'outputs/qa/equipment-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await visit(page,'/brew-library/zh-Hant/equipment/');
 await page.screenshot({path:'outputs/qa/equipment-mobile.png',fullPage:true});
});

test('capture refined language control at the reported viewport',async({page})=>{
 await mkdir('outputs/qa',{recursive:true});
 await page.setViewportSize({width:846,height:853});
 await visit(page,'/brew-library/zh-Hant/');await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'outputs/qa/language-closed.png'});
 await page.locator('.language-trigger').click();await expect(page.locator('.language-options a')).toHaveCount(9);
 await page.screenshot({path:'outputs/qa/language-open.png'});
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await expect(page.locator('.language-options a').last()).toBeInViewport();
 }
});
