import {accountedAdditions,isPourOver,type PourOverRecipe,type Recipe} from './recipes';

export type ScaledStepAmount={
  amount:number|null;
  cumulative:number|null;
};

export type ScaledPourSchedule={
  dose:number;
  water:number;
  factor:number;
  steps:ScaledStepAmount[];
};

const additionActions=new Set(['pour','bloom','pulses','topup']);

export function canScalePourOver(recipe:Recipe):recipe is PourOverRecipe {
  if(!isPourOver(recipe))return false;
  // Ranges, upper limits, ice and derived multi-range formulas describe more than
  // one possible brew. Turning one endpoint into a fixed ratio would invent a
  // precision the source never published.
  return recipe.doseLimit==='exact'
    && recipe.doseMax===undefined
    && recipe.water.waterMax===undefined
    && recipe.ice===undefined;
}

export function roundRecipeAmount(value:number):number {
  const rounded=Math.round((value+Number.EPSILON)*10)/10;
  return Object.is(rounded,-0)?0:rounded;
}

export function waterForDose(recipe:PourOverRecipe,dose:number):number {
  assertPositive(dose);
  return roundRecipeAmount(dose*(recipe.water.amount/recipe.dose));
}

export function doseForWater(recipe:PourOverRecipe,water:number):number {
  assertPositive(water);
  return roundRecipeAmount(water/(recipe.water.amount/recipe.dose));
}

export function scalePourSchedule(recipe:PourOverRecipe,targetWater:number):ScaledPourSchedule {
  assertPositive(targetWater);
  const factor=targetWater/recipe.water.amount;
  const steps=recipe.steps.map(step=>({
    amount:step.amount===null?null:roundRecipeAmount(step.amount*factor),
    cumulative:step.cumulative===null?null:roundRecipeAmount(step.cumulative*factor)
  }));

  const fullyAccounted=accountedAdditions(recipe)!==null;
  if(fullyAccounted){
    // Keep the published pour proportions while making the final quantified
    // addition absorb sub-tenth rounding, so the displayed schedule reaches the
    // user's requested total rather than drifting by 0.1-0.3.
    const additionIndexes=recipe.steps.flatMap((step,index)=>additionActions.has(step.action)&&step.amount!==null?[index]:[]);
    const last=additionIndexes.at(-1);
    if(last!==undefined){
      const total=additionIndexes.reduce((sum,index)=>sum+(steps[index].amount||0),0);
      steps[last].amount=roundRecipeAmount((steps[last].amount||0)+(targetWater-total));
    }
    let cumulative=0;
    for(const [index,step] of recipe.steps.entries()){
      if(!additionActions.has(step.action)||step.amount===null)continue;
      cumulative=roundRecipeAmount(cumulative+(steps[index].amount||0));
      if(step.cumulative!==null)steps[index].cumulative=cumulative;
    }
  }

  return {
    dose:doseForWater(recipe,targetWater),
    water:roundRecipeAmount(targetWater),
    factor,
    steps
  };
}

function assertPositive(value:number){
  if(!Number.isFinite(value)||value<=0)throw new RangeError('Recipe amounts must be positive finite numbers');
}
