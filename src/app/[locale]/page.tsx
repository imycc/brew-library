import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {isLocale} from '@/i18n/locales';
import {Home} from '@/components/library';
import {JsonLd} from '@/components/json-ld';
import {BASE} from '@/lib/recipes';
import {pageMetadata} from '@/lib/metadata';
import {homeGraph} from '@/lib/seo';
import {pageTranslator} from '@/lib/seo-server';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;return isLocale(locale)?pageMetadata(locale):{};}
export default async function Page({params}:Props){
 const {locale}=await params;if(!isLocale(locale))notFound();setRequestLocale(locale);
 const t=await pageTranslator(locale);
 return <>
   <link rel="preload" as="image" href={`${BASE}/images/editorial-hero-1920.avif`} type="image/avif" media="(min-width: 761px)" fetchPriority="high"/>
   <link rel="preload" as="image" href={`${BASE}/images/editorial-hero-mobile-960.avif`} type="image/avif" media="(max-width: 760px)" fetchPriority="high"/>
   <JsonLd data={homeGraph(locale,t)}/>
   <Home/>
 </>;
}
