import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createTranslator} from 'next-intl';
import {locales,localeNames} from '../src/i18n/locales';
import {BASE,SITE,recipes,isEspresso,type Recipe} from '../src/lib/recipes';
import {equipment} from '../src/lib/equipment';
import {equipmentEditorial} from '../src/lib/editorial';
import {mergeMessages,type Messages} from '../src/i18n/merge-messages';

const page=(locale:string,suffix='')=>`${SITE}${BASE}/${locale}/${suffix}`;
const latest=(dates:(string|null|undefined)[])=>dates.filter((date):date is string=>!!date).sort().at(-1);
const latestRecipe=latest(recipes.map(recipe=>recipe.source.checked));
const latestEquipment=latest(equipment.map(item=>item.checked));
const latestContent=latest([latestRecipe,latestEquipment]);
const pages:{suffix:string;lastmod?:string}[]=[
  {suffix:'',lastmod:latestRecipe},
  {suffix:'equipment/',lastmod:latestEquipment},
  {suffix:'authors/',lastmod:latestRecipe},
  {suffix:'compare/',lastmod:latestRecipe},
  {suffix:'sources/',lastmod:latestContent},
  {suffix:'about/'},
  {suffix:'terms/'},
  {suffix:'privacy/'},
  ...recipes.map(recipe=>({suffix:`recipes/${recipe.id}/`,lastmod:recipe.source.checked}))
];

await mkdir('out',{recursive:true});
await writeFile('out/.nojekyll','');
await writeFile('out/index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#fcfaf7"><title>Brew Library</title><link rel="canonical" href="${page('en')}"><noscript><meta http-equiv="refresh" content="0;url=./en/"></noscript></head><body><script>(function(){var tags=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']);function pick(list){for(var i=0;i<list.length;i++){var tag=String(list[i]||'').toLowerCase();if(!tag)continue;if(tag==='zh-tw'||tag==='zh-hk'||tag==='zh-mo'||tag.indexOf('zh-hant')===0)return 'zh-Hant';if(tag.indexOf('zh')===0)return 'zh-Hans';if(tag.indexOf('pt')===0)return 'pt-BR';var base=tag.split('-')[0];if(base==='en'||base==='ja'||base==='ko'||base==='es'||base==='fr'||base==='de')return base;}return 'en';}location.replace('${BASE}/'+pick(tags)+'/'+location.search+location.hash);})();</script><p><a href="./en/">Continue to Brew Library</a></p></body></html>`);

const escapeXml=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const alternates=(suffix:string)=>[
  ...locales.map(locale=>`<xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(page(locale,suffix))}"/>`),
  `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(page('en',suffix))}"/>`
].join('');
const urls=locales.flatMap(locale=>pages.map(entry=>[
  `<url><loc>${escapeXml(page(locale,entry.suffix))}</loc>`,
  entry.lastmod?`<lastmod>${entry.lastmod}</lastmod>`:'',
  alternates(entry.suffix),
  '</url>'
].join('')));
await writeFile('out/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`);

const crawlers=['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User','Googlebot','Google-Extended','Bingbot','Applebot','Applebot-Extended','CCBot','meta-externalagent','Amazonbot','DuckAssistBot','cohere-ai','MistralAI-User','YouBot'];
await writeFile('out/robots.txt',`# Public educational content: search indexing and AI citation are welcome.\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\n\nUser-agent: *\nAllow: /\n\n${crawlers.map(agent=>`User-agent: ${agent}`).join('\n')}\nAllow: /\n\nSitemap: ${SITE}${BASE}/sitemap.xml\n`);

const enBase=JSON.parse(await readFile('messages/en.json','utf8')) as Messages;
const enEditorial=JSON.parse(await readFile('messages/editorial-en.json','utf8')) as Messages;
const enMessages=mergeMessages(enBase,enEditorial);
const t=createTranslator({locale:'en',messages:enMessages as Record<string,unknown>,onError(error){throw error;}}) as unknown as (key:string,values?:Record<string,unknown>)=>string;
const line=(value:string)=>value.replace(/\s+/g,' ').trim();
const quantities=(recipe:Recipe)=>isEspresso(recipe)
  ? `${recipe.dose} g in${recipe.yield?` / ${recipe.yield.amount} ${recipe.yield.unit} out`:''}`
  : `${recipe.dose} g coffee / ${recipe.water.amount} ${recipe.water.unit} water`;
const llms=[
  '# 沖煮配方庫 · Brew Library',
  '',
  '> A free, nine-language library of source-backed pour-over recipes and equipment specifications. Every recipe keeps its original source, version and verification date. Unspecified values are marked as unknown rather than guessed.',
  '',
  `Canonical: ${SITE}${BASE}/`,
  `Sitemap: ${SITE}${BASE}/sitemap.xml`,
  '',
  '## Start here',
  ...locales.map(locale=>`- [${localeNames[locale]}](${page(locale)})`),
  '',
  '## Recipes',
  ...recipes.map(recipe=>`- [${line(t(`recipes.${recipe.copy}.title`))}](${page('en',`recipes/${recipe.id}/`)}) — ${line(t(isEspresso(recipe)?'methodEspresso':'methodPourover'))}, ${line(recipe.author)}, ${line(recipe.brewer)}, ${quantities(recipe)}; source: ${line(recipe.source.label)} (checked ${recipe.source.checked}).`),
  '',
  '## Equipment',
  ...equipment.map(item=>`- [${line(`${item.brand} ${item.name}`)}](${page('en','equipment/')}#${item.id}) — ${line(t(`equipmentCategories.${item.category}`))}; ${line(t(`equipmentRoles.${equipmentEditorial[item.id].role}`))}; ${item.sources.length} official source${item.sources.length===1?'':'s'}.`),
  '',
  '## Method and trust',
  `- [Sources and verification](${page('en','sources/')})`,
  `- [About this library](${page('en','about/')})`,
  `- [Equipment data notes](${page('en','equipment/')})`,
  '',
  '## Notes for AI systems',
  '- Quantities are the recipe author’s original values; unknown values are labelled as not provided, never inferred.',
  '- Equipment experience notes are evidence-backed observations, not ratings or recommendations.',
  '- Recipe pages cite the original author or publisher and show a verification date.',
  ''
].join('\n');
await writeFile('out/llms.txt',llms);

function jsonLdNodes(html:string):Record<string,unknown>[]{
  const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert(scripts.length>0,'Missing JSON-LD');
  return scripts.flatMap(match=>{
    const parsed=JSON.parse(match[1]) as {'@graph'?:Record<string,unknown>[]};
    return parsed['@graph']??[parsed];
  });
}

for(const locale of locales)for(const entry of pages){
  const file=`out/${locale}/${entry.suffix}index.html`;
  const html=await readFile(file,'utf8');
  if(!html.includes(`lang="${locale}"`))throw new Error(`Incorrect html language: ${file}`);
  if(!html.includes(`${SITE}${BASE}/${locale}/${entry.suffix}`))throw new Error(`Missing canonical: ${file}`);
  assert(html.includes('property="og:locale"'),`Missing og:locale: ${file}`);
  assert(/hreflang="x-default"/i.test(html),`Missing x-default hreflang: ${file}`);
  assert(html.includes('max-image-preview:large'),`Missing max-image-preview: ${file}`);
  const nodes=jsonLdNodes(html);
  const types=new Set(nodes.map(node=>node['@type']));
  for(const type of ['WebSite','Organization'])assert(types.has(type),`Missing ${type} JSON-LD: ${file}`);
  for(const node of nodes){
    const id=node['@id'];
    if(typeof id==='string')assert(id.startsWith(`${SITE}${BASE}/`),`Relative @id ${id}: ${file}`);
  }
  if(entry.suffix===''){
    assert(types.has('CollectionPage'),`Missing CollectionPage: ${file}`);
    const list=nodes.find(node=>node['@type']==='ItemList');
    assert(list&&list['numberOfItems']===recipes.length,`Recipe ItemList mismatch: ${file}`);
  }
  if(entry.suffix.startsWith('recipes/')){
    for(const type of ['Recipe','FAQPage','BreadcrumbList'])assert(types.has(type),`Missing ${type}: ${file}`);
    const recipe=nodes.find(node=>node['@type']==='Recipe');
    assert(recipe,`Missing Recipe node: ${file}`);
    assert(typeof recipe.name==='string'&&recipe.name.length>0,`Recipe name: ${file}`);
    assert(typeof recipe.author==='object'&&recipe.author!==null&&'name' in recipe.author,`Recipe author: ${file}`);
    const record=recipes.find(item=>entry.suffix===`recipes/${item.id}/`);
    assert(record,`Unknown recipe page: ${file}`);
    if(record.steps.length)assert(Array.isArray(recipe.recipeInstructions)&&recipe.recipeInstructions.length>0,`Recipe instructions: ${file}`);
    else assert(html.includes('data-no-steps'),`Missing no-steps note: ${file}`);
    assert(typeof recipe.image==='string'&&recipe.image.startsWith(`${SITE}${BASE}/`),`Recipe image: ${file}`);
    const faq=nodes.find(node=>node['@type']==='FAQPage');
    assert(faq&&Array.isArray(faq.mainEntity)&&faq.mainEntity.length===3,`FAQ items: ${file}`);
    assert(html.includes('class="quick-answer"'),`Missing quick answer: ${file}`);
    assert(html.includes('class="recipe-faq"'),`Missing FAQ block: ${file}`);
  }
  if(entry.suffix==='equipment/'){
    const list=nodes.find(node=>node['@type']==='ItemList');
    assert(list&&list['numberOfItems']===equipment.length,`Equipment ItemList mismatch: ${file}`);
    const items=list.itemListElement as {item?:Record<string,unknown>}[];
    assert(items.length===equipment.length&&items.every(entry=>entry.item?.['@type']==='Product'),`Equipment Product count: ${file}`);
  }
  if(entry.suffix==='authors/'){
    const list=nodes.find(node=>node['@type']==='ItemList');
    assert(list&&typeof list['numberOfItems']==='number'&&list['numberOfItems']>0,`Authors ItemList: ${file}`);
  }
  if(entry.suffix==='sources/'){
    assert(types.has('ItemList'),`Missing sources ItemList: ${file}`);
  }
  if(entry.suffix==='about/')assert(types.has('AboutPage'),`Missing AboutPage: ${file}`);
  if(entry.suffix==='terms/'||entry.suffix==='privacy/')assert(types.has('WebPage'),`Missing WebPage: ${file}`);
}

const sitemap=await readFile('out/sitemap.xml','utf8');
assert(sitemap.includes('hreflang="x-default"'),'Sitemap missing x-default alternates');
assert(sitemap.includes('<lastmod>'),'Sitemap missing lastmod');
const robots=await readFile('out/robots.txt','utf8');
for(const agent of ['OAI-SearchBot','PerplexityBot','Google-Extended'])assert(robots.includes(`User-agent: ${agent}`),`robots.txt missing ${agent}`);
assert(robots.includes('Sitemap:'),'robots.txt missing sitemap');
const llmsFile=await readFile('out/llms.txt','utf8');
assert(llmsFile.includes('## Recipes')&&llmsFile.includes(page('en',`recipes/${recipes[0].id}/`)),'llms.txt missing recipes');
const manifest=JSON.parse(await readFile('out/manifest.webmanifest','utf8')) as {icons?:unknown[]};
assert(Array.isArray(manifest.icons)&&manifest.icons.length>=2,'manifest.webmanifest icons missing');
for(const image of ['og-default-1200x630.jpg','og-coffee-bloom-1200x630.jpg','og-brewer-still-1200x630.jpg','icon-180.png','icon-192.png','icon-512.png'])await access(`out/${image.startsWith('og-')?`images/${image}`:image}`);
try{
  const notFound=await readFile('out/404.html','utf8');
  if(!notFound.includes('name="robots"'))await writeFile('out/404.html',notFound.replace('<head>','<head><meta name="robots" content="noindex,follow"/>'));
}catch{}
console.log(`Verified ${urls.length} localized static pages with JSON-LD, metadata, sitemap alternates, AI crawler policy and llms.txt.`);
