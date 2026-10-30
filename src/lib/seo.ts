import {BASE,SITE,time,recipes,isEspresso,isPourOver,basketText,temperatureLabel,type Recipe,iceAmountText} from './recipes';
import {equipment,type Equipment} from './equipment';
import {equipmentEditorial,equipmentExperience} from './editorial';
import {brewTimeText,recipeFaq,temperatureText,type Translator} from './faq';
import type {Locale} from '@/i18n/locales';

type JsonLd=Record<string,unknown>;
type JsonLdGraph={'@context':'https://schema.org';'@graph':JsonLd[]};

export function absolute(path:string):string{
  return `${SITE}${BASE}${path.startsWith('/')?path:`/${path}`}`;
}

export function pageUrl(locale:Locale,suffix=''):string{
  return absolute(`/${locale}/${suffix}`);
}

function websiteId(locale:Locale):string{return `${pageUrl(locale)}#website`;}
function organizationId():string{return absolute('/#organization');}
function pageId(locale:Locale,suffix:string):string{return `${pageUrl(locale,suffix)}#webpage`;}

function graph(nodes:(JsonLd|undefined|null)[]):JsonLdGraph{
  return {'@context':'https://schema.org','@graph':nodes.filter((node):node is JsonLd=>node!==undefined&&node!==null)};
}

function breadcrumb(locale:Locale,suffix:string,items:{name:string;suffix:string}[]):JsonLd{
  return {
    '@type':'BreadcrumbList',
    '@id':`${pageUrl(locale,suffix)}#breadcrumb`,
    itemListElement:items.map((item,index)=>({
      '@type':'ListItem',
      position:index+1,
      name:item.name,
      item:pageUrl(locale,item.suffix)
    }))
  };
}

function webPage(locale:Locale,suffix:string,type:string,name:string,description:string,extra:JsonLd={}):JsonLd{
  return {
    '@type':type,
    '@id':pageId(locale,suffix),
    url:pageUrl(locale,suffix),
    name,
    description,
    inLanguage:locale,
    isPartOf:{'@id':websiteId(locale)},
    breadcrumb:{'@id':`${pageUrl(locale,suffix)}#breadcrumb`},
    ...extra
  };
}

export function siteGraph(locale:Locale,t:Translator):JsonLdGraph{
  return graph([
    {
      '@type':'Organization',
      '@id':organizationId(),
      name:t('brand'),
      url:pageUrl('zh-Hant'),
      slogan:t('tagline'),
      description:t('siteInfo.aboutIntro'),
      knowsAbout:[t('schemaRecipeCategory'),t('equipmentTitle')],
      logo:{'@type':'ImageObject',url:absolute('/icon-512.png'),width:512,height:512},
      sameAs:['https://github.com/imycc/brew-library'],
      publishingPrinciples:pageUrl(locale,'about/'),
      contactPoint:{
        '@type':'ContactPoint',
        contactType:'editorial',
        url:'https://github.com/imycc/brew-library/issues'
      }
    },
    {
      '@type':'WebSite',
      '@id':websiteId(locale),
      url:pageUrl(locale),
      name:t('brand'),
      alternateName:t('tagline'),
      description:t('siteInfo.aboutIntro'),
      inLanguage:locale,
      publisher:{'@id':organizationId()},
      about:{'@id':organizationId()},
      potentialAction:{
        '@type':'SearchAction',
        target:{'@type':'EntryPoint',urlTemplate:`${pageUrl(locale)}?q={search_term_string}`},
        'query-input':'required name=search_term_string'
      }
    }
  ]);
}

function recipeStepText(recipe:Recipe,step:Recipe['steps'][number],t:Translator):string{
  const instruction=step.action==='finish'?t(`recipes.${recipe.copy}.finish`):t(step.instruction||`instruction.${step.action}`);
  const timing=step.at===null?'':`${time(step.at)} · `;
  const unit=step.unit||(isPourOver(recipe)?recipe.water.unit:recipe.yield?.unit);
  const amount=step.amount===null||!unit?'':`${step.amount} ${unit} · `;
  const pressure=step.pressure===undefined?'':`${step.pressure} bar · `;
  return `${timing}${amount}${pressure}${instruction}`;
}

function totalTime(recipe:Recipe):string|undefined{
  if(!recipe.duration||recipe.duration[0]!==recipe.duration[1])return undefined;
  const seconds=recipe.duration[0];
  const minutes=Math.floor(seconds/60);
  const rest=seconds%60;
  return `PT${minutes?`${minutes}M`:''}${rest?`${rest}S`:''}`;
}

function isIsoDate(value:string|null|undefined):value is string{
  return !!value&&/^\d{4}-\d{2}-\d{2}$/.test(value);
}

function recipeNode(locale:Locale,recipe:Recipe,t:Translator):JsonLd{
  const title=t(`recipes.${recipe.copy}.title`);
  const url=pageUrl(locale,`recipes/${recipe.id}/`);
  const keywords=[
    t(isEspresso(recipe)?'methodEspresso':'methodPourover'),
    recipe.brewer,
    recipe.author,
    recipe.grinder?.name,
    recipe.paper?.name,
    recipe.coffee?.origin,
    recipe.coffee?.variety,
    recipe.coffee?.process?t(`processes.${recipe.coffee.process}`):null,
    recipe.coffee?.roast?t(`roasts.${recipe.coffee.roast}`):null
  ].filter(Boolean).join(', ');
  const duration=totalTime(recipe);
  return {
    '@type':'Recipe',
    '@id':`${url}#recipe`,
    name:title,
    description:t(`recipes.${recipe.copy}.summary`),
    url,
    mainEntityOfPage:{'@id':pageId(locale,`recipes/${recipe.id}/`)},
    isPartOf:{'@id':websiteId(locale)},
    inLanguage:locale,
    image:absolute(`/images/og-${recipe.image||'default'}-1200x630.jpg`),
    author:{
      '@type':'Person',
      name:recipe.author,
      url:`${pageUrl(locale,'authors/')}#${recipe.authorId}`
    },
    publisher:{'@id':organizationId()},
    recipeCategory:t(isEspresso(recipe)?'schemaEspressoCategory':'schemaRecipeCategory'),
    recipeCuisine:t('schemaRecipeCuisine'),
    keywords,
    recipeIngredient:[
      `${recipe.dose} g ${t('schemaCoffee')}`,
      // An espresso source that states its water recipe keeps it; a yield is never
      // rewritten into a water amount.
      ...recipe.water?[`${recipe.water.amount} ${recipe.water.unit} ${t('schemaWater')}${recipe.temperature?` (${temperatureLabel(recipe)})`:''}`]:[],
      ...recipe.ice?[`${iceAmountText(recipe)} ${t('ice')}`]:[]
    ],
    ...recipe.steps.length?{recipeInstructions:recipe.steps.map((step,index)=>({
      '@type':'HowToStep',
      position:index+1,
      name:t(`step.${step.action}`),
      text:recipeStepText(recipe,step,t)
    }))}:{},
    tool:[recipe.brewer,recipe.grinder?.name,recipe.paper?.name,basketText(recipe)].filter((name):name is string=>!!name).map(name=>({'@type':'HowToTool',name})),
    ...(isIsoDate(recipe.source.published)?{datePublished:recipe.source.published}:{}),
    dateModified:recipe.source.checked,
    ...(duration?{totalTime:duration}:{}),
    ...(recipe.yield?{recipeYield:`${recipe.yield.amount} ${recipe.yield.unit}`}:{}),
    citation:{'@type':'CreativeWork','@id':recipe.source.url,name:recipe.source.label,url:recipe.source.url},
    isBasedOn:{'@id':recipe.source.url},
    ...(recipe.source.video?{sameAs:[recipe.source.video]}:{})
  };
}

export function recipeGraph(locale:Locale,recipe:Recipe,t:Translator):JsonLdGraph{
  const suffix=`recipes/${recipe.id}/`;
  const url=pageUrl(locale,suffix);
  const title=t(`recipes.${recipe.copy}.title`);
  const faq=recipeFaq(recipe,t);
  return graph([
    webPage(locale,suffix,'WebPage',title,t(`recipes.${recipe.copy}.summary`),{
      mainEntity:{'@id':`${url}#recipe`},
      dateModified:recipe.source.checked
    }),
    breadcrumb(locale,suffix,[{name:t('brand'),suffix:''},{name:title,suffix}]),
    recipeNode(locale,recipe,t),
    {
      '@type':'FAQPage',
      '@id':`${url}#faq`,
      inLanguage:locale,
      mainEntity:faq.map(item=>({
        '@type':'Question',
        name:item.question,
        acceptedAnswer:{'@type':'Answer',text:item.answer}
      }))
    }
  ]);
}

function recipeList(locale:Locale,t:Translator):{name:string;url:string}[]{
  return recipes.map(recipe=>({
    name:t(`recipes.${recipe.copy}.title`),
    url:pageUrl(locale,`recipes/${recipe.id}/`)
  }));
}

export function homeGraph(locale:Locale,t:Translator):JsonLdGraph{
  const url=pageUrl(locale);
  const list=recipeList(locale,t);
  return graph([
    webPage(locale,'','CollectionPage',`${t('brand')} · ${t('tagline')}`,t('homeDescription'),{
      mainEntity:{'@id':`${url}#recipes`}
    }),
    breadcrumb(locale,'',[{name:t('brand'),suffix:''}]),
    {
      '@type':'ItemList',
      '@id':`${url}#recipes`,
      name:t('recipesNav'),
      numberOfItems:list.length,
      itemListElement:list.map((item,index)=>({
        '@type':'ListItem',
        position:index+1,
        name:item.name,
        url:item.url
      }))
    }
  ]);
}

function equipmentNode(locale:Locale,item:Equipment,t:Translator):JsonLd{
  const editorial=equipmentEditorial[item.id];
  const experience=equipmentExperience[item.id];
  const url=`${pageUrl(locale,'equipment/')}#${item.id}`;
  return {
    '@type':'Product',
    '@id':url,
    identifier:item.id,
    name:`${item.brand} ${item.name}`,
    brand:{'@type':'Brand',name:item.brand},
    category:t(`equipmentCategories.${item.category}`),
    description:editorial?t(`equipmentRoles.${editorial.role}`):undefined,
    url,
    additionalProperty:item.details.map(detail=>({
      '@type':'PropertyValue',
      name:t(`equipmentSpecs.${detail.key}`),
      value:`${detail.valueKey?t(`equipmentValues.${detail.valueKey}`):detail.value}${detail.unit?` ${t(`equipmentUnits.${detail.unit}`)}`:''}`
    })),
    ...(experience?{keywords:experience.tags.map(tag=>t(`equipmentExperienceTags.${tag}`)).join(', ')}:{}),
    sameAs:item.sources.map(source=>source.url),
    seeAlso:item.recipeIds.map(id=>pageUrl(locale,`recipes/${id}/`))
  };
}

export function equipmentGraph(locale:Locale,t:Translator):JsonLdGraph{
  const suffix='equipment/';
  const url=pageUrl(locale,suffix);
  const items=equipment.map(item=>equipmentNode(locale,item,t));
  return graph([
    webPage(locale,suffix,'CollectionPage',t('equipmentTitle'),t('equipmentIntro'),{
      mainEntity:{'@id':`${url}#equipment`}
    }),
    breadcrumb(locale,suffix,[{name:t('brand'),suffix:''},{name:t('equipmentNav'),suffix}]),
    {
      '@type':'ItemList',
      '@id':`${url}#equipment`,
      name:t('equipmentTitle'),
      numberOfItems:items.length,
      itemListElement:items.map((item,index)=>({
        '@type':'ListItem',
        position:index+1,
        item
      }))
    }
  ]);
}

function uniqueAuthors(locale:Locale,t:Translator):JsonLd[]{
  const seen=new Set<string>();
  return recipes.filter(recipe=>{
    if(seen.has(recipe.authorId))return false;
    seen.add(recipe.authorId);
    return true;
  }).map(recipe=>({
    '@type':'Person',
    '@id':`${pageUrl(locale,'authors/')}#${recipe.authorId}`,
    name:recipe.author,
    url:`${pageUrl(locale,'authors/')}#${recipe.authorId}`,
    description:t(`recipes.${recipe.copy}.summary`),
    knowsAbout:t('schemaRecipeCategory')
  }));
}

export function authorsGraph(locale:Locale,t:Translator):JsonLdGraph{
  const suffix='authors/';
  const url=pageUrl(locale,suffix);
  const people=uniqueAuthors(locale,t);
  return graph([
    webPage(locale,suffix,'CollectionPage',t('authorsTitle'),t('authorsIntro'),{
      mainEntity:{'@id':`${url}#authors`}
    }),
    breadcrumb(locale,suffix,[{name:t('brand'),suffix:''},{name:t('authorsNav'),suffix}]),
    {
      '@type':'ItemList',
      '@id':`${url}#authors`,
      name:t('authorsTitle'),
      numberOfItems:people.length,
      itemListElement:people.map((person,index)=>({
        '@type':'ListItem',
        position:index+1,
        item:person
      }))
    }
  ]);
}

function recipeSources(locale:Locale,t:Translator):JsonLd[]{
  return recipes.map(recipe=>({
    '@type':'CreativeWork',
    name:`${t(`recipes.${recipe.copy}.title`)} — ${recipe.source.label}`,
    url:recipe.source.url,
    author:{'@type':'Person',name:recipe.author},
    ...(isIsoDate(recipe.source.published)?{datePublished:recipe.source.published}:{}),
    seeAlso:pageUrl(locale,`recipes/${recipe.id}/`)
  }));
}

export function sourcesGraph(locale:Locale,t:Translator):JsonLdGraph{
  const suffix='sources/';
  const url=pageUrl(locale,suffix);
  const sources=recipeSources(locale,t);
  return graph([
    webPage(locale,suffix,'CollectionPage',t('sourceTitle'),t('sourceIntro'),{
      mainEntity:{'@id':`${url}#sources`}
    }),
    breadcrumb(locale,suffix,[{name:t('brand'),suffix:''},{name:t('sourcesNav'),suffix}]),
    {
      '@type':'ItemList',
      '@id':`${url}#sources`,
      name:t('sourceTitle'),
      numberOfItems:sources.length,
      itemListElement:sources.map((source,index)=>({
        '@type':'ListItem',
        position:index+1,
        item:source
      }))
    }
  ]);
}

export function compareGraph(locale:Locale,t:Translator):JsonLdGraph{
  const suffix='compare/';
  return graph([
    webPage(locale,suffix,'WebPage',t('compareTitle'),t('compareSubtitle')),
    breadcrumb(locale,suffix,[{name:t('brand'),suffix:''},{name:t('compareNav'),suffix}])
  ]);
}

export function infoGraph(locale:Locale,suffix:'about/'|'terms/'|'privacy/',t:Translator):JsonLdGraph{
  const key=suffix.replace('/','');
  const title=t(`siteInfo.${key}Title`);
  const description=t(`siteInfo.${key}Intro`);
  const type=suffix==='about/'?'AboutPage':'WebPage';
  return graph([
    webPage(locale,suffix,type,title,description,suffix==='about/'?{about:{'@id':organizationId()}}:{}),
    breadcrumb(locale,suffix,[{name:t('brand'),suffix:''},{name:title,suffix}])
  ]);
}
