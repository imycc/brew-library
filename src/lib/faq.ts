import {basketText,duration,isEspresso,preInfusionText,pressureText,yieldText,type Recipe} from './recipes';
import {formatTemperature,type TemperatureUnit} from './temperature';

export type Translator=(key:string,values?:Record<string,string|number>)=>string;

export type TemperatureFormatter=(value:number,source:TemperatureUnit,max?:number)=>string;
const sourceUnit:TemperatureFormatter=(value,source,max)=>formatTemperature(value,source,null,max).text;

export function temperatureText(recipe:Recipe,t:Translator,format:TemperatureFormatter=sourceUnit):string{
  return recipe.temperature?format(recipe.temperature,recipe.temperatureUnit,recipe.temperatureMax):t(recipe.temperatureMode==='boiling'?'boiling':'unknown');
}

export function brewTimeText(recipe:Recipe,t:Translator):string{
  return recipe.duration?duration(recipe):t('unknown');
}

// Every answer reads from a published number or says the source is silent; a missing
// espresso yield is never replaced by the water the source happened to state.
export function recipeFaq(recipe:Recipe,t:Translator,format:TemperatureFormatter=sourceUnit):{question:string;answer:string}[]{
  const title=t(`recipes.${recipe.copy}.title`);
  const espresso=isEspresso(recipe);
  const details=espresso?[basketText(recipe),pressureText(recipe),preInfusionText(recipe)].filter(Boolean).join(' · '):'';
  const amountAnswer=espresso
    ? `${t('faqEspressoAmountAnswer',{dose:recipe.dose,yield:yieldText(recipe)||t('unknown')})}${details?` ${t('faqEspressoDetails',{details})}`:''}`
    : t('faqAmountAnswer',{dose:recipe.dose,water:recipe.water.amount,unit:recipe.water.unit});
  return [
    {
      question:t(espresso?'faqEspressoAmountQuestion':'faqAmountQuestion',{recipe:title}),
      answer:amountAnswer
    },
    {
      question:t('faqTemperatureQuestion',{recipe:title}),
      answer:t('faqTemperatureAnswer',{temperature:temperatureText(recipe,t,format),grind:t(`recipes.${recipe.copy}.grind`)})
    },
    {
      question:t(espresso?'faqShotTimeQuestion':'faqTimeQuestion',{recipe:title}),
      answer:t('faqTimeAnswer',{time:brewTimeText(recipe,t)})
    }
  ];
}
