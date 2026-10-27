import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages,setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isLocale,locales} from '@/i18n/locales';
import {LibraryProvider,Header,Footer,ComparisonTray} from '@/components/library';
import '../globals.css';

export function generateStaticParams(){return locales.map(locale=>({locale}));}
export const dynamicParams=false;
export default async function LocaleLayout({children,params}:{children:ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();setRequestLocale(locale);
 const messages=await getMessages();
 return <html lang={locale}><head>
   <link rel="icon" href="/pour-over-coffee/icon.png" type="image/png"/>
   <link rel="preconnect" href="https://fonts.googleapis.com"/>
   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
   <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Libre+Baskerville:wght@400;700&family=Noto+Serif+TC:wght@500;600;700&family=Noto+Serif+JP:wght@500;600;700&family=Noto+Serif+KR:wght@500;600;700&display=swap" rel="stylesheet"/>
 </head><body><NextIntlClientProvider locale={locale} messages={messages}><LibraryProvider><Header/>{children}<Footer/><ComparisonTray/></LibraryProvider></NextIntlClientProvider></body></html>;
}
