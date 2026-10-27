import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {isLocale} from '@/i18n/locales';
import {recipes} from '@/lib/recipes';
import {RecipeDetail} from '@/components/library';
import {pageMetadata} from '@/lib/metadata';
type Props={params:Promise<{locale:string;id:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return recipes.map(r=>({id:r.id}));}
export async function generateMetadata({params}:Props){const {locale,id}=await params;return isLocale(locale)?pageMetadata(locale,`recipes/${id}/`,id):{};}
export default async function Page({params}:Props){const {locale,id}=await params;if(!isLocale(locale)||!recipes.some(r=>r.id===id))notFound();setRequestLocale(locale);return <RecipeDetail id={id}/>;}
