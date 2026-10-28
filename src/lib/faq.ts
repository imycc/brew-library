import {duration,type Recipe} from './recipes';

export type Translator=(key:string,values?:Record<string,string|number>)=>string;

export function temperatureText(recipe:Recipe,t:Translator):string{
  return recipe.temperature?`${recipe.temperature}°C`:t(recipe.temperatureMode==='boiling'?'boiling':'unknown');
}

export function brewTimeText(recipe:Recipe,t:Translator):string{
  return recipe.duration?duration(recipe):t('unknown');
}

export function recipeFaq(recipe:Recipe,t:Translator):{question:string;answer:string}[]{
  const title=t(`recipes.${recipe.copy}.title`);
  return [
    {
      question:t('faqAmountQuestion',{recipe:title}),
      answer:t('faqAmountAnswer',{dose:recipe.dose,water:recipe.water.amount,unit:recipe.water.unit})
    },
    {
      question:t('faqTemperatureQuestion',{recipe:title}),
      answer:t('faqTemperatureAnswer',{temperature:temperatureText(recipe,t),grind:t(`recipes.${recipe.copy}.grind`)})
    },
    {
      question:t('faqTimeQuestion',{recipe:title}),
      answer:t('faqTimeAnswer',{time:brewTimeText(recipe,t)})
    }
  ];
}
