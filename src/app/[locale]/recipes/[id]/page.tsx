import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getTranslations,setRequestLocale} from 'next-intl/server';
import {isLocale} from '@/i18n/locales';
import {BASE,SITE,recipes} from '@/lib/recipes';
import {RecipeDetail} from '@/components/library';
import {RetiredRecipeNotice} from '@/components/retired-recipe';
import {JsonLd} from '@/components/json-ld';
import {pageMetadata} from '@/lib/metadata';
import {recipeGraph} from '@/lib/seo';
import {pageTranslator} from '@/lib/seo-server';
import {retiredRecipeIds,retiredRecipes} from '@/lib/retired-recipes';
type Props={params:Promise<{locale:string;id:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return [...recipes.map(recipe=>({id:recipe.id})),...retiredRecipeIds.map(id=>({id}))];}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,id}=await params;
 if(!isLocale(locale))return {};
 const retired=retiredRecipes[id as keyof typeof retiredRecipes];
 if(retired){
  const t=await getTranslations({locale});
  const canonical=`${SITE}${BASE}/${locale}/equipment/`;
  return {title:`${t('retiredRecipe.title')} · ${t('brand')}`,description:t('retiredRecipe.body'),alternates:{canonical},robots:{index:false,follow:true}};
 }
 return pageMetadata(locale,`recipes/${id}/`,id);
}
export default async function Page({params}:Props){
 const {locale,id}=await params;if(!isLocale(locale))notFound();
 setRequestLocale(locale);
 const retired=retiredRecipes[id as keyof typeof retiredRecipes];
 if(retired)return <RetiredRecipeNotice replacementRecipeId={retired.replacementRecipeId} equipmentId={retired.equipmentId}/>;
 const recipe=recipes.find(r=>r.id===id);if(!recipe)notFound();
 const t=await pageTranslator(locale);
 return <><JsonLd data={recipeGraph(locale,recipe,t)}/><RecipeDetail id={id}/></>;
}
