import {test,expect} from '@playwright/test';

test('production analytics counts navigation once and ignores filter changes',async({page,baseURL})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events:string[]=[];
 // Serve the built site under its production hostname without making production requests.
 await page.route('https://imycc.github.io/pour-over-coffee/**',async route=>{
   const url=new URL(route.request().url());
   await route.fulfill({response:await route.fetch({url:`${baseURL}${url.pathname}${url.search}`})});
 });
 await page.route('https://*.goatcounter.com/**',async route=>{
   events.push(new URL(route.request().url()).searchParams.get('p')||'');
   await route.fulfill({status:204});
 });
 await page.route('https://gc.zgo.at/count.js',route=>route.fulfill({contentType:'application/javascript',body:`window.goatcounter={count:function(event){navigator.sendBeacon('https://imycc.goatcounter.com/count?p='+encodeURIComponent(event.path));}};`}));
 await page.goto('https://imycc.github.io/pour-over-coffee/en/');
 await expect.poll(()=>events).toEqual(['/pour-over-coffee/en/']);
 await page.getByRole('searchbox').fill('Kobayashi');
 await expect(page.locator('[data-recipe]')).toHaveCount(1);
 await page.locator('[data-recipe="kobayashi-origami"] .card-actions a').click();
 await expect(page.getByTestId('pour-timeline')).toBeVisible();
 await expect.poll(()=>events).toEqual(['/pour-over-coffee/en/','/pour-over-coffee/en/recipes/kobayashi-origami/']);
 await page.locator('.language-trigger').click();await page.locator('.language-options a[lang="ja"]').click();
 await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await expect.poll(()=>events).toEqual(['/pour-over-coffee/en/','/pour-over-coffee/en/recipes/kobayashi-origami/','/pour-over-coffee/ja/recipes/kobayashi-origami/']);
});

test('analytics never sends pageviews from a local preview',async({page})=>{
 test.skip(!process.env.NEXT_PUBLIC_GOATCOUNTER_CODE,'Analytics is disabled when no account code is configured.');
 const events:string[]=[];
 await page.route('https://gc.zgo.at/count.js',route=>route.fulfill({contentType:'application/javascript',body:`window.goatcounter={count:function(){fetch('https://imycc.goatcounter.com/count');}};`}));
 await page.route('https://*.goatcounter.com/**',async route=>{events.push(route.request().url());await route.fulfill({status:204});});
 await page.goto('/pour-over-coffee/en/');
 await expect(page.locator('script#goatcounter')).toBeAttached();
 await page.locator('[data-recipe="kobayashi-origami"] .card-actions a').click();
 await expect(page.getByTestId('pour-timeline')).toBeVisible();
 expect(events).toEqual([]);
});
