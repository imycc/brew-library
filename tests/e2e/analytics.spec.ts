import {test,expect,type Page} from '@playwright/test';

type CapturedEvent={path:string;event:string|null};

async function captureProductionAnalytics(page:Page,baseURL:string|undefined){
  if(!baseURL)throw new Error('Playwright baseURL is required');
  const events:CapturedEvent[]=[];
  await page.route('https://imycc.github.io/brew-library/**',async route=>{
    const url=new URL(route.request().url());
    await route.fulfill({response:await route.fetch({url:`${baseURL}${url.pathname}${url.search}`})});
  });
  await page.route('https://*.goatcounter.com/**',async route=>{
    const url=new URL(route.request().url());
    events.push({path:url.searchParams.get('p')||'',event:url.searchParams.get('event')});
    await route.fulfill({status:204});
  });
  await page.route('https://gc.zgo.at/count.js',route=>route.fulfill({contentType:'application/javascript',body:`window.goatcounter={count:function(event){navigator.sendBeacon('https://imycc.goatcounter.com/count?p='+encodeURIComponent(event.path)+'&event='+encodeURIComponent(String(event.event)));}};`}));
  return events;
}

async function gotoProduction(page:Page,path:string){
  await page.goto(`https://imycc.github.io/brew-library${path}`);
}

test('production analytics counts navigation once and ignores filter changes',async({page,baseURL})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events:string[]=[];
 // Serve the built site under its production hostname without making production requests.
 await page.route('https://imycc.github.io/brew-library/**',async route=>{
   const url=new URL(route.request().url());
   await route.fulfill({response:await route.fetch({url:`${baseURL}${url.pathname}${url.search}`})});
 });
 await page.route('https://*.goatcounter.com/**',async route=>{
   events.push(new URL(route.request().url()).searchParams.get('p')||'');
   await route.fulfill({status:204});
 });
 await page.route('https://gc.zgo.at/count.js',route=>route.fulfill({contentType:'application/javascript',body:`window.goatcounter={count:function(event){navigator.sendBeacon('https://imycc.goatcounter.com/count?p='+encodeURIComponent(event.path));}};`}));
 await page.goto('https://imycc.github.io/brew-library/en/');
 await expect.poll(()=>events).toEqual(['/brew-library/en/']);
 await page.getByRole('searchbox').fill('Kobayashi');
 await expect(page.locator('[data-recipe]')).toHaveCount(1);
 await page.locator('[data-recipe="kobayashi-origami"] .card-actions a').click();
 await expect(page.getByTestId('pour-timeline')).toBeVisible();
 await expect.poll(()=>events).toEqual(['/brew-library/en/','/brew-library/en/recipes/kobayashi-origami/']);
 await page.locator('.language-trigger').click();await page.locator('.language-options a[lang="ja"]').click();
 await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await expect.poll(()=>events).toEqual(['/brew-library/en/','/brew-library/en/recipes/kobayashi-origami/','/brew-library/ja/recipes/kobayashi-origami/']);
});

test('analytics never sends pageviews from a local preview',async({page})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events:string[]=[];
 await page.route('https://gc.zgo.at/count.js',route=>route.fulfill({contentType:'application/javascript',body:`window.goatcounter={count:function(){fetch('https://imycc.goatcounter.com/count');}};`}));
 await page.route('https://*.goatcounter.com/**',async route=>{events.push(route.request().url());await route.fulfill({status:204});});
 await page.goto('/brew-library/en/');
 await expect(page.locator('script#goatcounter')).toBeAttached();
 await page.locator('[data-recipe="kobayashi-origami"] .card-actions a').click();
 await expect(page.getByTestId('pour-timeline')).toBeVisible();
 expect(events).toEqual([]);
});

test('learning UX events distinguish lab views from recipe opens',async({page,baseURL})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events=await captureProductionAnalytics(page,baseURL);
 await gotoProduction(page,'/en/learn/');
 await page.locator('#recipe-lab').scrollIntoViewIfNeeded();
 await expect.poll(()=>events.some(event=>event.path==='learn_lab_view'&&event.event==='true')).toBe(true);
 await page.locator('.curated-learning-grid a').first().click();
 await expect.poll(()=>events.some(event=>event.path==='learn_recipe_open'&&event.event==='true')).toBe(true);
});

test('comparison UX events distinguish empty, table, filters and recipe opens',async({page,baseURL})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events=await captureProductionAnalytics(page,baseURL);
 await gotoProduction(page,'/en/compare/');
 await expect.poll(()=>events.some(event=>event.path==='compare_page_empty'&&event.event==='true')).toBe(true);
 await gotoProduction(page,'/en/compare/?ids=counterculture-go-to,lamarzocco-brew-ratios,onyx-monarch-espresso');
 await expect.poll(()=>events.some(event=>event.path==='compare_page_table'&&event.event==='true')).toBe(true);
 await page.getByRole('button',{name:'Differences only'}).click();
 await expect.poll(()=>events.some(event=>event.path==='compare_differences_toggle'&&event.event==='true')).toBe(true);
 await page.locator('.comparison-table th .icon-button').first().click();
 await expect.poll(()=>events.some(event=>event.path==='compare_recipe_select'&&event.event==='true')).toBe(true);
 await page.locator('.comparison-table tbody tr:last-child a.button').first().click();
 await expect.poll(()=>events.some(event=>event.path==='compare_recipe_open'&&event.event==='true')).toBe(true);
});

test('equipment UX events distinguish decision filters from recipe opens',async({page,baseURL})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events=await captureProductionAnalytics(page,baseURL);
 await gotoProduction(page,'/en/equipment/');
 const decisionFilters=page.locator('[data-equipment-filters] button');
 await decisionFilters.nth(0).click();
 await expect.poll(()=>events.some(event=>event.path==='equipment_experience_filter'&&event.event==='true')).toBe(true);
 await decisionFilters.nth(0).click();
 await decisionFilters.nth(1).click();
 await expect.poll(()=>events.some(event=>event.path==='equipment_recipe_filter'&&event.event==='true')).toBe(true);
 const recipeLink=page.locator('[data-equipment="hario-v60-mugen-02"] .equipment-recipes a').first();
 await recipeLink.scrollIntoViewIfNeeded();
 await recipeLink.click();
 await expect.poll(()=>events.some(event=>event.path==='equipment_recipe_open'&&event.event==='true')).toBe(true);
});
