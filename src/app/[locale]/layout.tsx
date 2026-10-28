import type {ReactNode} from 'react';
import type {Metadata,Viewport} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages,setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isLocale,locales} from '@/i18n/locales';
import {LibraryProvider,Header,Footer,ComparisonTray} from '@/components/library';
import {Analytics} from '@/components/analytics';
import {JsonLd} from '@/components/json-ld';
import {BASE,SITE} from '@/lib/recipes';
import {siteGraph} from '@/lib/seo';
import {pageTranslator} from '@/lib/seo-server';
import '../globals.css';

export function generateStaticParams(){return locales.map(locale=>({locale}));}
export const dynamicParams=false;
export const metadata:Metadata={metadataBase:new URL(SITE),manifest:`${BASE}/manifest.webmanifest`,icons:{icon:`${BASE}/icon.png`,apple:`${BASE}/icon-180.png`}};
export const viewport:Viewport={themeColor:'#fcfaf7'};
const cjkFonts:Record<string,string>={
  'zh-Hant':'&family=Noto+Sans+TC:wght@400..700&family=Noto+Serif+TC:wght@500..700',
  'zh-Hans':'&family=Noto+Sans+SC:wght@400..700&family=Noto+Serif+SC:wght@500..700',
  ja:'&family=Noto+Sans+JP:wght@400..700&family=Noto+Serif+JP:wght@500..700',
  ko:'&family=Noto+Sans+KR:wght@400..700&family=Noto+Serif+KR:wght@500..700'
};
const fontHref=(locale:string)=>`https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..600&family=Libre+Baskerville:wght@400;700${cjkFonts[locale]||''}&display=swap`;
export default async function LocaleLayout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();setRequestLocale(locale);
 const messages=await getMessages();
 const t=await pageTranslator(locale);
 return <html lang={locale}><head>
   <JsonLd data={siteGraph(locale,t)}/>
   <link rel="preconnect" href="https://fonts.googleapis.com"/>
   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
   <link href={fontHref(locale)} rel="stylesheet" fetchPriority="high"/>
 </head><body><NextIntlClientProvider locale={locale} messages={messages}><LibraryProvider><Header/>{children}<Footer/><ComparisonTray/></LibraryProvider></NextIntlClientProvider><Analytics/></body></html>;
}
