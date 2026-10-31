import {z} from 'zod';
import {isEspresso,isPourOver,recipes,type Recipe} from './recipes';
import rawLearning from '../../content/learning.json';

export type LearningLevel='guided'|'practice'|'reference';
export type TranslateLearning=(key:string)=>string;

export type TimelineItem={
  start:number|null;
  end:number|null;
  amount:number|null;
  unit:string|null;
  labelKey:string;
  cumulative:number|null;
};

const learningRecordSchema=z.object({
  focusKey:z.string().regex(/^[a-zA-Z0-9.-]+$/),
  checkpoints:z.array(z.object({
    step:z.number().int().nonnegative(),
    cueKey:z.string().regex(/^[a-zA-Z0-9.-]+$/)
  })).min(1).max(3),
  practiceKey:z.string().regex(/^[a-zA-Z0-9.-]+$/)
});
export type LearningRecord=z.infer<typeof learningRecordSchema>;
export const recipeLearning:Record<string,LearningRecord>=z.object({
  schemaVersion:z.literal(1),
  recipes:z.record(z.string(),learningRecordSchema)
}).parse(rawLearning).recipes;

// A deliberately small, curated route into the wider catalogue. These recipes
// contrast a structured pour, an immersion method, iced brewing and espresso
// without implying that one method is better than another.
export const curatedLearningRecipeIds=[
  'hoffmann-one-cup',
  'kasuya-46',
  'rao-pulsar',
  'woelfl-v60',
  'kurasu-flash-brew',
  'lamarzocco-brew-ratios',
  'coffeecollective-espresso',
  'onyx-monarch-espresso'
] as const;

export const curatedLearningRecipes=curatedLearningRecipeIds.map(id=>{
  const recipe=recipes.find(item=>item.id===id);
  if(!recipe)throw new Error(`Unknown curated learning recipe: ${id}`);
  return recipe;
});

export function learningLevel(recipe:Recipe):LearningLevel{
  if(!recipe.steps.length)return 'reference';
  if(recipeLearning[recipe.id]||recipe.teaching?.length)return 'guided';
  return 'practice';
}

export function learningLevelKey(recipe:Recipe):string{
  return `learningLevels.${learningLevel(recipe)}`;
}

export function learningFor(recipe:Recipe):LearningRecord|undefined{
  return recipeLearning[recipe.id];
}

export function searchableRecipeText(recipe:Recipe,t:TranslateLearning):string{
  const finish=t(`recipes.${recipe.copy}.finish`);
  const steps=recipe.steps.map(step=>step.action==='finish'?finish:t(step.instruction||`instruction.${step.action}`));
  const lesson=learningFor(recipe);
  return [
    t(`recipes.${recipe.copy}.title`),
    t(`recipes.${recipe.copy}.summary`),
    t(`recipes.${recipe.copy}.overview`),
    t(`recipes.${recipe.copy}.bestFor`),
    t(`recipes.${recipe.copy}.notes`),
    ...recipe.preparation.map(t),
    ...(recipe.teaching||[]).map(item=>t(item.key)),
    ...(recipe.tasting||[]).map(t),
    ...(lesson?[t(lesson.focusKey),t(lesson.practiceKey),...lesson.checkpoints.map(item=>t(item.cueKey))]:[]),
    ...steps,
    recipe.id,
    recipe.author,
    recipe.brewer,
    recipe.grinder?.name||'',
    recipe.paper?.name||'',
    recipe.coffee?.name||'',
    recipe.coffee?.origin||'',
    recipe.coffee?.variety||''
  ].filter(Boolean).join(' ');
}

export function secondsLabel(value:number):string{
  const tenths=Math.round(value*10);
  const whole=Math.floor(tenths/10);
  const fraction=tenths%10;
  const minutes=Math.floor(whole/60);
  const seconds=whole%60;
  return `${minutes}:${String(seconds).padStart(2,'0')}${fraction?`.${fraction}`:''}`;
}

// Pour-over steps are discrete additions. Espresso needs ranges: the end of a
// pre-infusion is the start of extraction, and a target yield belongs to the end
// of the shot rather than to 0:00. This keeps the timeline aligned with the data.
export function brewTimeline(recipe:Recipe):TimelineItem[]{
  if(isEspresso(recipe)){
    const phases:TimelineItem[]=recipe.steps.flatMap(step=>{
      if(!['preinfuse','extract'].includes(step.action))return [];
      const start=step.at??0;
      const stop=recipe.steps.find(candidate=>candidate.action==='stop'&&candidate.at!==null&&candidate.at>=start)?.at;
      const end=step.end??(step.action==='extract'?stop??recipe.duration?.[1]??null:null);
      return [{start,end,amount:step.amount,unit:step.unit||recipe.yield?.unit||null,labelKey:`step.${step.action}`,cumulative:step.cumulative}];
    });
    return phases;
  }
  if(!isPourOver(recipe))return [];
  return recipe.steps
    .filter(step=>['pour','bloom','pulses','topup'].includes(step.action))
    .map(step=>({start:step.at,end:step.end??null,amount:step.amount,unit:step.unit||recipe.water.unit,labelKey:`step.${step.action}`,cumulative:step.cumulative}));
}
