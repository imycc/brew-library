import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createTranslator} from 'next-intl';
import {BASE,SITE,pourOverRecipes,recipes} from '../src/lib/recipes';
import {equipment} from '../src/lib/equipment';
import {equipmentEditorial} from '../src/lib/editorial';
import {mergeMessages,type Messages} from '../src/i18n/merge-messages';
import {authorsGraph,equipmentGraph,homeGraph,infoGraph,learnGraph,recipeGraph,sourcesGraph,siteGraph} from '../src/lib/seo';
import {recipeFaq} from '../src/lib/faq';

const enMessages=mergeMessages(
  JSON.parse(await readFile('messages/en.json','utf8')) as Messages,
  JSON.parse(await readFile('messages/editorial-en.json','utf8')) as Messages
);
const educationMessages=JSON.parse(await readFile('messages/education-en.json','utf8')) as Messages;
const completeMessages=mergeMessages(enMessages,educationMessages);
const t=createTranslator({locale:'en',messages:completeMessages as Record<string,unknown>,onError(error){throw error;}}) as unknown as (key:string,values?:Record<string,unknown>)=>string;
const nodes=(graph:{'@graph':Record<string,unknown>[]})=>graph['@graph'];
const find=(graph:{'@graph':Record<string,unknown>[]},type:string)=>nodes(graph).find(node=>node['@type']===type) as Record<string,unknown>|undefined;

test('site graph exposes a stable organization and localized website',()=>{
 const graph=siteGraph('en',t);
 const organization=find(graph,'Organization');
 const website=find(graph,'WebSite');
 assert(organization&&website);
 assert.equal(organization.name,t('brand'));
 assert.equal(organization.url,`${SITE}${BASE}/en/`);
 assert.deepEqual(organization.sameAs,['https://github.com/imycc/brew-library']);
 assert.equal(website.url,`${SITE}${BASE}/en/`);
 assert.equal(website.inLanguage,'en');
 assert.deepEqual(website.publisher,{'@id':organization['@id']});
});

test('recipe graph is complete, localized and source-backed',()=>{
 const recipe=recipes[0];
 const graph=recipeGraph('en',recipe,t);
 const node=find(graph,'Recipe');
 assert(node);
 assert.equal(node.name,t(`recipes.${recipe.copy}.title`));
 assert.equal(node.description,t(`recipes.${recipe.copy}.summary`));
 assert.equal(node.inLanguage,'en');
 assert.equal(node.dateModified,recipe.source.checked);
 assert.equal((node.citation as {url:string}).url,recipe.source.url);
 assert.equal((node.isBasedOn as {'@id':string})['@id'],recipe.source.url);
 assert.equal((node.author as {name:string}).name,recipe.author);
 assert.equal((node.recipeInstructions as unknown[]).length,recipe.steps.length);
 assert((node.recipeIngredient as string[]).length>=2);
 assert((node.tool as unknown[]).length>=1);
 assert(String(node.url).startsWith(`${SITE}${BASE}/en/recipes/${recipe.id}/`));
 assert(String(node.image).startsWith(`${SITE}${BASE}/images/`));
 assert.equal(node.recipeCategory,t('schemaRecipeCategory'));
 assert.equal(node.recipeCuisine,t('schemaRecipeCuisine'));
 const faq=find(graph,'FAQPage');
 assert(faq);
 assert.equal((faq.mainEntity as unknown[]).length,3);
 const breadcrumb=find(graph,'BreadcrumbList');
 assert(breadcrumb);
 const trail=breadcrumb.itemListElement as {name:string;item:string}[];
 assert.equal(trail.length,2);
 assert.equal(trail[1].name,node.name);
 assert(trail[1].item.startsWith(`${SITE}${BASE}/en/recipes/${recipe.id}/`));
});

test('recipe FAQ answers contain the recorded quantities',()=>{
 const recipe=pourOverRecipes[0];
 const faq=recipeFaq(recipe,t);
 assert.equal(faq.length,3);
 assert(faq.every(item=>item.question.length>0&&item.answer.length>0));
 assert(faq[0].answer.includes(String(recipe.dose)));
 assert(faq[0].answer.includes(String(recipe.water.amount)));
 assert(faq[1].answer.includes(t(`recipes.${recipe.copy}.grind`)));
});

test('collection graphs expose every recipe, equipment item and source',()=>{
 const home=find(homeGraph('en',t),'ItemList');
 assert.equal(home?.['numberOfItems'],recipes.length);
 const equipmentList=find(equipmentGraph('en',t),'ItemList');
 assert.equal(equipmentList?.['numberOfItems'],equipment.length);
 const equipmentItems=equipmentList?.itemListElement as {item:Record<string,unknown>}[];
 assert.equal(equipmentItems.length,equipment.length);
 assert(equipmentItems.every(entry=>entry.item['@type']==='Product'));
 const product=equipmentItems[0].item;
 const first=equipment[0];
 assert.equal(product.name,`${first.brand} ${first.name}`);
 assert.equal(product.identifier,first.id);
 assert.equal((product.additionalProperty as unknown[]).length,first.details.length);
 assert.deepEqual(product.sameAs,first.sources.map(source=>source.url));
 assert.equal((product.seeAlso as string[]).length,first.recipeIds.length);
 assert(equipmentEditorial[first.id]);
 const authors=find(authorsGraph('en',t),'ItemList');
 assert.equal(authors?.['numberOfItems'],new Set(recipes.map(recipe=>recipe.authorId)).size);
 const sources=find(sourcesGraph('en',t),'ItemList');
 assert.equal(sources?.['numberOfItems'],recipes.length);
});

test('info pages map to the correct schema type',()=>{
 assert(find(infoGraph('en','about/',t),'AboutPage'));
 assert(find(infoGraph('en','terms/',t),'WebPage'));
 assert(find(infoGraph('en','privacy/',t),'WebPage'));
});

test('learning guide exposes a typed learning resource',()=>{
 const graph=learnGraph('en',t);
 const resource=find(graph,'LearningResource');
 assert(resource);
 assert.equal(resource.name,t('learn.title'));
 assert.deepEqual(resource.teaches,[t('learn.readTitle'),t('learn.brewTitle'),t('learn.observeTitle'),t('learn.adjustTitle')]);
 assert(find(graph,'BreadcrumbList'));
});
