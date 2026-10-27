import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {locales} from '../src/i18n/locales';
import {BASE,SITE,recipes} from '../src/lib/recipes';
await mkdir('out',{recursive:true});
await writeFile('out/.nojekyll','');
await writeFile('out/index.html',`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>手沖配方庫</title><meta http-equiv="refresh" content="0;url=./zh-Hant/"><link rel="canonical" href="${SITE}${BASE}/zh-Hant/"></head><body><a href="./zh-Hant/">進入手沖配方庫</a></body></html>`);
const suffixes=['','authors/','compare/','sources/',...recipes.map(r=>`recipes/${r.id}/`)];
const urls=locales.flatMap(locale=>suffixes.map(suffix=>`${SITE}${BASE}/${locale}/${suffix}`));
await writeFile('out/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>`);
await writeFile('out/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${SITE}${BASE}/sitemap.xml\n`);
for(const locale of locales)for(const suffix of suffixes){
 const file=`out/${locale}/${suffix}index.html`;
 const html=await readFile(file,'utf8');
 if(!html.includes(`lang="${locale}"`))throw new Error(`Incorrect html language: ${file}`);
 if(!html.includes(`${SITE}${BASE}/${locale}/${suffix}`))throw new Error(`Missing canonical: ${file}`);
}
console.log(`Verified ${urls.length} localized static pages and generated root entry, sitemap and robots.`);
