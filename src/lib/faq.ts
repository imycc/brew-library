import {basketText,duration,iceAmountText,isEspresso,preInfusionText,pressureText,yieldText,type Recipe} from './recipes';
import {formatTemperature,type TemperatureUnit} from './temperature';

export type Translator=(key:string,values?:Record<string,string|number>)=>string;

export type TemperatureFormatter=(value:number,source:TemperatureUnit,max?:number)=>string;
const sourceUnit:TemperatureFormatter=(value,source,max)=>formatTemperature(value,source,null,max).text;

export function temperatureText(recipe:Recipe,t:Translator,format:TemperatureFormatter=sourceUnit):string{
  return recipe.temperature?format(recipe.temperature,recipe.temperatureUnit,recipe.temperatureMax):t(recipe.temperatureMode==='boiling'?'boiling':'unknown');
}

export function brewTimeText(recipe:Recipe,t:Translator):string{
  if(recipe.brewTimeKey)return t(recipe.brewTimeKey);
  if(!recipe.duration)return t('unknown');
  const time=duration(recipe);
  if(isEspresso(recipe)&&recipe.extraction?.timeBasis==='unknown'&&recipe.extraction.preInfusion?.seconds!=null){
    return t('sourceTimeBasisUnknown',{time});
  }
  return time;
}

// Every answer reads from a published number or says the source is silent; a missing
// espresso yield is never replaced by the water the source happened to state.
export function recipeFaq(recipe:Recipe,t:Translator,format:TemperatureFormatter=sourceUnit):{question:string;answer:string}[]{
  const title=t(`recipes.${recipe.copy}.title`);
  const espresso=isEspresso(recipe);
  const details=espresso?[basketText(recipe),pressureText(recipe),preInfusionText(recipe)].filter(Boolean).join(' · '):'';
  let amountAnswer:string;
  if(recipe.method==='pour-over'&&recipe.doseLimit==='upTo'&&recipe.water.derived){
    amountAnswer=t('faqAmountAnswerUpTo',{dose:recipe.dose,ratio:recipe.ratioStated||ratioText(recipe)});
  }else if(espresso){
    amountAnswer=`${t('faqEspressoAmountAnswer',{dose:recipe.dose,yield:yieldText(recipe)||t('unknown')})}${details?` ${t('faqEspressoDetails',{details})}`:''}`;
  }else if(recipe.method==='pour-over'){
    if(recipe.ice){
      amountAnswer=t('faqAmountAnswerIced',{dose:recipe.dose,water:recipe.water.amount,unit:recipe.water.unit,ice:iceAmountText(recipe)});
    }else if(recipe.doseMax!==undefined&&recipe.water.waterMax!==undefined){
      amountAnswer=t('faqAmountRangeAnswer',{doseMin:recipe.dose,doseMax:recipe.doseMax,waterMin:recipe.water.amount,waterMax:recipe.water.waterMax,unit:recipe.water.unit});
    }else{
      amountAnswer=t('faqAmountAnswer',{dose:recipe.dose,water:recipe.water.amount,unit:recipe.water.unit});
    }
  }else{
    throw new Error('Unsupported recipe method');
  }
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

function ratioText(recipe:Recipe):string{
  if(recipe.method!=='pour-over'||!recipe.water.derived)return '';
  const low=recipe.water.waterMax?recipe.water.amount/recipe.dose:null;
  const high=recipe.water.waterMax?recipe.water.waterMax/recipe.dose:null;
  return low!==null&&high!==null?`1:${low.toFixed(2)}–${high.toFixed(2)}`:'';
}
