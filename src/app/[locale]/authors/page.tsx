import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {isLocale} from '@/i18n/locales';
import {AuthorsPage} from '@/components/library';
import {JsonLd} from '@/components/json-ld';
import {pageMetadata} from '@/lib/metadata';
import {authorsGraph} from '@/lib/seo';
import {pageTranslator} from '@/lib/seo-server';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;return isLocale(locale)?pageMetadata(locale,'authors/'):{};}
export default async function Page({params}:Props){
 const {locale}=await params;if(!isLocale(locale))notFound();setRequestLocale(locale);
 const t=await pageTranslator(locale);
 return <><JsonLd data={authorsGraph(locale,t)}/><AuthorsPage/></>;
}
