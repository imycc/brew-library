import {basketText,duration,isEspresso,preInfusionText,pressureText,yieldText,type Recipe} from './recipes';

export type Translator=(key:string,values?:Record<string,string|number>)=>string;

export function temperatureText(recipe:Recipe,t:Translator):string{
  return recipe.temperature?`${recipe.temperature}°C`:t(recipe.temperatureMode==='boiling'?'boiling':'unknown');
}

export function brewTimeText(recipe:Recipe,t:Translator):string{
  return recipe.duration?duration(recipe):t('unknown');
}

// Every answer reads from a published number or says the source is silent; a missing
// espresso yield is never replaced by the water the source happened to state.
export function recipeFaq(recipe:Recipe,t:Translator):{question:string;answer:string}[]{
  const title=t(`recipes.${recipe.copy}.title`);
  const espresso=isEspresso(recipe);
  const amountAnswer=espresso
    ? t('faqEspressoAmountAnswer',{dose:recipe.dose,yield:yieldText(recipe)||t('unknown'),basket:basketText(recipe)||t('unknown'),pressure:pressureText(recipe)||t('unknown'),preInfusion:preInfusionText(recipe)||t('unknown')})
    : t('faqAmountAnswer',{dose:recipe.dose,water:recipe.water.amount,unit:recipe.water.unit});
  return [
    {
      question:t(espresso?'faqEspressoAmountQuestion':'faqAmountQuestion',{recipe:title}),
      answer:amountAnswer
    },
    {
      question:t('faqTemperatureQuestion',{recipe:title}),
      answer:t('faqTemperatureAnswer',{temperature:temperatureText(recipe,t),grind:t(`recipes.${recipe.copy}.grind`)})
    },
    {
      question:t(espresso?'faqShotTimeQuestion':'faqTimeQuestion',{recipe:title}),
      answer:t('faqTimeAnswer',{time:brewTimeText(recipe,t)})
    }
  ];
}
