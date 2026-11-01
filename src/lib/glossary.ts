export const glossaryTerms=[
  {key:'wdt', pattern:/\bWDT\b|Wet WDT/i},
  {key:'melodrip', pattern:/Melodrip/i},
  {key:'tds', pattern:/\bTDS\b/i},
  {key:'ppm', pattern:/\bppm\b|CaCO₃/i},
  {key:'redClix', pattern:/Red Clix/i},
  {key:'vst', pattern:/\bVST\b/i},
  {key:'linePressure', pattern:/line pressure|管路壓力/i},
  {key:'bypass', pattern:/低繞流|no bypass|low bypass/i},
  {key:'w60', pattern:/\bW60\b/i}
] as const;

export type GlossaryTermKey=typeof glossaryTerms[number]['key'];

export function glossaryForRecipe(text:string):GlossaryTermKey[]{
  return glossaryTerms.filter(term=>term.pattern.test(text)).map(term=>term.key);
}
