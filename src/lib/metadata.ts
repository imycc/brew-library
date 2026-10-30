import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {locales,type Locale} from '@/i18n/locales';
import {BASE,SITE,recipes} from './recipes';

const ogLocales:Record<Locale,string>={
  'zh-Hant':'zh_TW','zh-Hans':'zh_CN',en:'en_US',ja:'ja_JP',ko:'ko_KR',
  es:'es_ES',fr:'fr_FR',de:'de_DE','pt-BR':'pt_BR'
};

const pageKeys:Record<string,{title:string;description:string}>={
  'equipment/':{title:'equipmentTitle',description:'equipmentIntro'},
  'authors/':{title:'authorsTitle',description:'authorsIntro'},
  'compare/':{title:'compareTitle',description:'compareSubtitle'},
  'sources/':{title:'sourceTitle',description:'sourceIntro'},
  'about/':{title:'siteInfo.aboutTitle',description:'siteInfo.aboutIntro'},
  'terms/':{title:'siteInfo.termsTitle',description:'siteInfo.termsIntro'},
  'privacy/':{title:'siteInfo.privacyTitle',description:'siteInfo.privacyIntro'}
};

export async function pageMetadata(locale:Locale,suffix='',recipeId?:string):Promise<Metadata>{
 const t=await getTranslations({locale});
 const recipe=recipeId?recipes.find(item=>item.id===recipeId):undefined;
 const page=pageKeys[suffix];
 const title=recipe?`${t(`recipes.${recipe.copy}.title`)} · ${t('brand')}`:page?`${t(page.title)} · ${t('brand')}`:`${t('brand')} · ${t('tagline')}`;
 const description=recipe?t(`recipes.${recipe.copy}.summary`):t(page?.description||'homeDescription');
 const url=`${SITE}${BASE}/${locale}/${suffix}`;
 const imageName=recipe?.image?`og-${recipe.image}-1200x630.jpg`:'og-default-1200x630.jpg';
 const image={url:`${SITE}${BASE}/images/${imageName}`,width:1200,height:630,alt:`${t('brand')} · ${t('tagline')}`};
 const languages=Object.fromEntries([...locales.map(item=>[item,`${SITE}${BASE}/${item}/${suffix}`]),['x-default',`${SITE}${BASE}/zh-Hant/${suffix}`]]);
 const alternateLocale=locales.filter(item=>item!==locale).map(item=>ogLocales[item]);
 const robots:Metadata['robots']={index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1};
 const keywords=recipe?[
   t(`recipes.${recipe.copy}.title`),recipe.author,recipe.brewer,recipe.grinder?.name,recipe.paper?.name,
   recipe.coffee?.origin,recipe.coffee?.variety,
   recipe.coffee?.process?t(`processes.${recipe.coffee.process}`):null,
   recipe.coffee?.roast?t(`roasts.${recipe.coffee.roast}`):null,
   t('schemaRecipeCategory')
 ].filter((keyword):keyword is string=>!!keyword):undefined;
 const openGraph:Metadata['openGraph']=recipe?{
   type:'article',title,description,url,siteName:t('brand'),locale:ogLocales[locale],alternateLocale,images:[image],
   publishedTime:recipe.source.published||undefined,modifiedTime:recipe.source.checked,authors:[recipe.author],
   section:t('recipesNav'),tags:keywords
 }:{
   type:'website',title,description,url,siteName:t('brand'),locale:ogLocales[locale],alternateLocale,images:[image]
 };
 return {
   title,description,metadataBase:new URL(SITE),alternates:{canonical:url,languages},openGraph,robots,
   ...(recipe?{keywords,authors:[{name:recipe.author}]}:{})
 };
}
