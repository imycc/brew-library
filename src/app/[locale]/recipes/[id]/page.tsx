import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {isLocale} from '@/i18n/locales';
import {recipes} from '@/lib/recipes';
import {RecipeDetail} from '@/components/library';
import {JsonLd} from '@/components/json-ld';
import {pageMetadata} from '@/lib/metadata';
import {recipeGraph} from '@/lib/seo';
import {pageTranslator} from '@/lib/seo-server';
type Props={params:Promise<{locale:string;id:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return recipes.map(r=>({id:r.id}));}
export async function generateMetadata({params}:Props){const {locale,id}=await params;return isLocale(locale)?pageMetadata(locale,`recipes/${id}/`,id):{};}
export default async function Page({params}:Props){
 const {locale,id}=await params;if(!isLocale(locale))notFound();
 const recipe=recipes.find(r=>r.id===id);if(!recipe)notFound();
 setRequestLocale(locale);
 const t=await pageTranslator(locale);
 return <><JsonLd data={recipeGraph(locale,recipe,t)}/><RecipeDetail id={id}/></>;
}
