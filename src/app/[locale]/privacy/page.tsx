import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {isLocale} from '@/i18n/locales';
import {PrivacyPage} from '@/components/library';
import {pageMetadata} from '@/lib/metadata';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;return isLocale(locale)?pageMetadata(locale,'privacy/'):{};}
export default async function Page({params}:Props){const {locale}=await params;if(!isLocale(locale))notFound();setRequestLocale(locale);return <PrivacyPage/>;}
