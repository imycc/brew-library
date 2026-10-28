import {getTranslations} from 'next-intl/server';
import type {Locale} from '@/i18n/locales';
import type {Translator} from './faq';

export async function pageTranslator(locale:Locale):Promise<Translator>{
  const t=await getTranslations({locale});
  return t as unknown as Translator;
}
