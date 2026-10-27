export const locales = ['zh-Hant','zh-Hans','en','ja','ko','es','fr','de','pt-BR'] as const;
export type Locale = typeof locales[number];
export const localeNames: Record<Locale, string> = {
  'zh-Hant':'繁體中文', 'zh-Hans':'简体中文', en:'English', ja:'日本語', ko:'한국어',
  es:'Español', fr:'Français', de:'Deutsch', 'pt-BR':'Português (Brasil)'
};
export function isLocale(value: string): value is Locale {return locales.includes(value as Locale);}
