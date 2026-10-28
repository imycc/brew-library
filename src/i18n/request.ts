import {getRequestConfig} from 'next-intl/server';
import {isLocale} from './locales';
import {mergeMessages,type Messages} from './merge-messages';
export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : 'zh-Hant';
  const base=(await import(`../../messages/${locale}.json`)).default as Messages;
  const editorial=(await import(`../../messages/editorial-${locale}.json`)).default as Messages;
  return {locale, messages: mergeMessages(base,editorial), timeZone:'Asia/Hong_Kong'};
});
