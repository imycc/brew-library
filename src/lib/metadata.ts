import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {locales,type Locale} from '@/i18n/locales';
import {BASE,SITE,recipes} from './recipes';
export async function pageMetadata(locale:Locale,suffix='',recipeId?:string):Promise<Metadata>{
 const t=await getTranslations({locale});
 const r=recipes.find(r=>r.id===recipeId);
 const key=r?`recipes.${r.copy}.title`:suffix==='compare/'?'compareTitle':suffix==='authors/'?'authorsTitle':suffix==='equipment/'?'equipmentTitle':suffix==='sources/'?'sourceTitle':'brand';
 const description=r?t(`recipes.${r.copy}.summary`):suffix==='equipment/'?t('equipmentIntro'):t('heroSubtitle');
 const url=`${SITE}${BASE}/${locale}/${suffix}`;
 return {title:r||suffix?`${t(key)} · ${t('brand')}`:`${t('brand')} · ${t('tagline')}`,description,metadataBase:new URL(SITE),alternates:{canonical:url,languages:Object.fromEntries([...locales.map(l=>[l,`${SITE}${BASE}/${l}/${suffix}`]),['x-default',`${SITE}${BASE}/zh-Hant/${suffix}`]])},openGraph:{title:t(key),description,url,siteName:t('brand'),type:'website',images:[{url:`${SITE}${BASE}/images/brewer-still-1280.webp`,width:1280,height:960}]}};
}
