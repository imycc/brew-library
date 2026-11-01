import {z} from 'zod';
import rawGuidance from '../../content/guidance.json';
import type {Equipment} from './equipment';
import {recipes,time,type Recipe,type Method} from './recipes';

const methodFamilySchema=z.enum(['percolation','immersion','hybrid','espresso','unknown']);
const fieldSchema=z.enum(['brewer','grinder','paper','temperature','brewTime']);

const guidanceSchema=z.object({
  schemaVersion:z.literal(1),
  ruleVersion:z.string().min(1),
  equipmentAliases:z.record(z.string(),z.string()),
  brewerMethods:z.record(z.string(),methodFamilySchema),
  compatibleEquipment:z.array(z.object({
    equipmentId:z.string(),
    compatibleEquipmentIds:z.array(z.string()).min(1),
    basis:z.enum(['catalogue'])
  })),
  disabled:z.array(z.object({
    recipeId:z.string(),
    field:fieldSchema
  })).default([])
});

export const guidanceConfig=guidanceSchema.parse(rawGuidance);
export type MethodFamily=z.infer<typeof methodFamilySchema>;
export type GuidanceField=z.infer<typeof fieldSchema>;
export type GuidanceAvailability='provided'|'partial'|'missing'|'notApplicable';
export type GuidanceTier='sameModel'|'sameEquipment'|'sameMethod';
export type GuidanceValue=
  | {kind:'text';text:string}
  | {kind:'list';items:string[]}
  | {kind:'temperature';min:number;max:number;unit:'C'|'F'}
  | {kind:'duration';min:number;max:number};
export type GuidanceReference={recipeId:string;equipmentId?:string};
export type GuidanceItem={
  field:GuidanceField;
  availability:Exclude<GuidanceAvailability,'provided'|'notApplicable'>;
  tier:GuidanceTier;
  value:GuidanceValue;
  references:GuidanceReference[];
  rationaleKey:string;
  limitationKey:string;
  ruleVersion:string;
};

export const guidanceFieldLabelKeys:Record<GuidanceField,string>={
  brewer:'brewer',
  grinder:'grinder',
  paper:'filterPaper',
  temperature:'temperature',
  brewTime:'brewTime'
};

export const guidanceTierLabelKeys:Record<GuidanceTier,string>={
  sameModel:'guidance.sameModel',
  sameEquipment:'guidance.sameEquipment',
  sameMethod:'guidance.sameMethod'
};

const fieldOrder:GuidanceField[]=['brewer','grinder','paper','temperature','brewTime'];
const knownBrewer=(recipe:Recipe)=>recipe.brewerId!=='unspecified';
const knownGrinder=(recipe:Recipe)=>!!recipe.grinder?.setting;
const knownPaper=(recipe:Recipe)=>!!recipe.paper||recipe.filterConditions!=='unknown'||!!recipe.filterNote;
const knownTemperature=(recipe:Recipe)=>recipe.temperature!==null||recipe.temperatureMode==='boiling';
const knownBrewTime=(recipe:Recipe)=>!!recipe.duration;
const stepTemperature=(recipe:Recipe)=>recipe.steps.some(step=>step.temperature!==undefined);
const finishStepTime=(recipe:Recipe)=>recipe.steps.some(step=>step.action==='finish'&&step.at!==null);

export function guidanceAvailability(recipe:Recipe,field:GuidanceField):GuidanceAvailability{
  if(field==='brewer')return knownBrewer(recipe)?'provided':'missing';
  if(field==='grinder')return knownGrinder(recipe)?'provided':recipe.grinder?'partial':'missing';
  if(field==='paper')return recipe.method==='espresso'?'notApplicable':knownPaper(recipe)?'provided':'missing';
  if(field==='temperature'){
    if(knownTemperature(recipe))return 'provided';
    if(stepTemperature(recipe))return 'partial';
    return 'missing';
  }
  if(knownBrewTime(recipe))return 'provided';
  if(finishStepTime(recipe))return 'partial';
  return 'missing';
}

export function methodFamily(recipe:Recipe):MethodFamily{
  if(recipe.method==='espresso')return 'espresso';
  return guidanceConfig.brewerMethods[recipe.brewerId]||'unknown';
}

export function equipmentIdForRecipe(recipe:Recipe,field:'grinder'|'paper'|'brewer'):string|undefined{
  if(field==='grinder')return recipe.grinder?guidanceConfig.equipmentAliases[recipe.grinder.id]||recipe.grinder.id:undefined;
  if(field==='paper')return recipe.paper?guidanceConfig.equipmentAliases[recipe.paper.id]||recipe.paper.id:undefined;
  return undefined;
}

function sameEquipmentCandidates(recipe:Recipe,field:GuidanceField):Recipe[]{
  if(recipe.method==='espresso'||!knownBrewer(recipe))return [];
  return recipes.filter(candidate=>candidate.id!==recipe.id
    && candidate.method===recipe.method
    && candidate.brewerId===recipe.brewerId
    && candidate.kind===recipe.kind
    && availabilityHasValue(candidate,field));
}

function sameMethodCandidates(recipe:Recipe,field:GuidanceField):Recipe[]{
  const family=methodFamily(recipe);
  if(family==='unknown')return [];
  return recipes.filter(candidate=>candidate.id!==recipe.id
    && candidate.method===recipe.method
    && candidate.kind===recipe.kind
    && methodFamily(candidate)===family
    && availabilityHasValue(candidate,field));
}

function availabilityHasValue(recipe:Recipe,field:GuidanceField):boolean{
  if(field==='temperature')return recipe.temperature!==null&&recipe.temperatureMode!=='boiling';
  if(field==='brewTime')return !!recipe.duration;
  if(field==='paper')return !!recipe.paper;
  if(field==='grinder')return !!recipe.grinder?.setting;
  return knownBrewer(recipe);
}

function referenceScore(recipe:Recipe,target:Recipe,field:GuidanceField):number{
  let score=0;
  if(recipe.authorId===target.authorId)score+=4;
  if(field==='brewer'&&recipe.grinder&&target.grinder&&recipe.grinder.id===target.grinder.id)score+=4;
  if(recipe.coffee?.process&&target.coffee?.process&&recipe.coffee.process===target.coffee.process)score+=2;
  if(recipe.coffee?.roast&&target.coffee?.roast&&recipe.coffee.roast===target.coffee.roast)score+=2;
  if(recipe.brewerId===target.brewerId)score+=2;
  return score;
}

function orderedCandidates(recipe:Recipe,candidates:Recipe[],field:GuidanceField):Recipe[]{
  return [...candidates].sort((a,b)=>{
    const score=referenceScore(b,recipe,field)-referenceScore(a,recipe,field);
    if(score)return score;
    const checked=b.source.checked.localeCompare(a.source.checked);
    if(checked)return checked;
    return a.id.localeCompare(b.id);
  });
}

function textValue(items:string[]):GuidanceValue{
  const values=[...new Set(items.filter(Boolean))].slice(0,3);
  return values.length===1?{kind:'text',text:values[0]}:{kind:'list',items:values};
}

function candidateReferences(candidates:Recipe[],field:GuidanceField):GuidanceReference[]{
  return candidates.slice(0,3).map(recipe=>({recipeId:recipe.id,equipmentId:equipmentIdForRecipe(recipe,field==='paper'?'paper':field==='grinder'?'grinder':'brewer')}));
}

function buildItem(recipe:Recipe,field:GuidanceField,availability:Exclude<GuidanceAvailability,'provided'|'notApplicable'>,candidates:Recipe[],tier:GuidanceTier,value:GuidanceValue):GuidanceItem{
  return {
    field,
    availability,
    tier,
    value,
    references:candidateReferences(candidates,field),
    rationaleKey:`guidance.reason.${tier}`,
    limitationKey:`guidance.limit.${field}`,
    ruleVersion:guidanceConfig.ruleVersion
  };
}

function brewerGuidance(recipe:Recipe,availability:'missing'):GuidanceItem|undefined{
  if(!recipe.grinder)return;
  const candidates=recipes.filter(candidate=>candidate.id!==recipe.id
    && candidate.method===recipe.method
    && candidate.kind===recipe.kind
    && candidate.authorId===recipe.authorId
    && knownBrewer(candidate)
    && candidate.grinder?.id===recipe.grinder?.id);
  const unique=new Map(candidates.map(candidate=>[candidate.brewerId,candidate]));
  if(unique.size!==1)return;
  const [candidate]=unique.values();
  return buildItem(recipe,'brewer',availability,[candidate],'sameMethod',{kind:'text',text:candidate.brewer});
}

function paperGuidance(recipe:Recipe,availability:'missing'):GuidanceItem|undefined{
  const exact=orderedCandidates(recipe,sameEquipmentCandidates(recipe,'paper'),'paper');
  if(exact.length<2)return;
  const values=exact.flatMap(candidate=>candidate.paper?[candidate.paper.name]:[]);
  return buildItem(recipe,'paper',availability,exact,'sameEquipment',textValue(values));
}

function grinderGuidance(recipe:Recipe,availability:'missing'|'partial'):GuidanceItem|undefined{
  const targetModel=recipe.grinder?guidanceConfig.equipmentAliases[recipe.grinder.id]||recipe.grinder.id:null;
  const sameModel=targetModel?recipes.filter(candidate=>candidate.id!==recipe.id
    && candidate.method===recipe.method
    && candidate.kind===recipe.kind
    && candidate.brewerId===recipe.brewerId
    && knownGrinder(candidate)
    && (guidanceConfig.equipmentAliases[candidate.grinder!.id]||candidate.grinder!.id)===targetModel):[];
  const candidates=sameModel.length?orderedCandidates(recipe,sameModel,'grinder'):orderedCandidates(recipe,sameEquipmentCandidates(recipe,'grinder'),'grinder');
  if(!candidates.length)return;
  const tier:GuidanceTier=sameModel.length?'sameModel':'sameEquipment';
  const values=candidates.flatMap(candidate=>candidate.grinder?[`${candidate.grinder.name} · ${candidate.grinder.setting||'—'}`]:[]);
  return buildItem(recipe,'grinder',availability,candidates,tier,textValue(values));
}

function temperatureGuidance(recipe:Recipe,availability:'missing'):GuidanceItem|undefined{
  const exact=orderedCandidates(recipe,sameEquipmentCandidates(recipe,'temperature').filter(candidate=>candidate.temperatureUnit===recipe.temperatureUnit),'temperature');
  const candidates=exact.length?exact:orderedCandidates(recipe,sameMethodCandidates(recipe,'temperature').filter(candidate=>candidate.temperatureUnit===recipe.temperatureUnit),'temperature');
  const tier:GuidanceTier=exact.length?'sameEquipment':'sameMethod';
  const minimum=exact.length?2:3;
  if(candidates.length<minimum)return;
  const values=candidates.flatMap(candidate=>candidate.temperature===null?[]:[candidate.temperature]);
  if(!values.length)return;
  const min=Math.min(...values);const max=Math.max(...values);
  if(max-min>8)return;
  return buildItem(recipe,'temperature',availability,candidates,tier,{kind:'temperature',min,max,unit:recipe.temperatureUnit});
}

function brewTimeGuidance(recipe:Recipe,availability:'missing'):GuidanceItem|undefined{
  // Espresso source durations can use incompatible pre-infusion time bases.
  if(recipe.method==='espresso')return;
  const doseClose=(candidate:Recipe)=>Math.abs(candidate.dose-recipe.dose)/recipe.dose<=0.2;
  const exact=orderedCandidates(recipe,sameEquipmentCandidates(recipe,'brewTime').filter(doseClose),'brewTime');
  const candidates=exact.length?exact:orderedCandidates(recipe,sameMethodCandidates(recipe,'brewTime').filter(doseClose),'brewTime');
  const tier:GuidanceTier=exact.length?'sameEquipment':'sameMethod';
  const minimum=exact.length?2:3;
  if(candidates.length<minimum)return;
  const starts=candidates.flatMap(candidate=>candidate.duration?[candidate.duration[0]]:[]);
  const ends=candidates.flatMap(candidate=>candidate.duration?[candidate.duration[1]]:[]);
  if(!starts.length||!ends.length)return;
  const min=Math.min(...starts);const max=Math.max(...ends);
  if(max-min>120)return;
  return buildItem(recipe,'brewTime',availability,candidates,tier,{kind:'duration',min,max});
}

export function guidanceForRecipe(recipe:Recipe):GuidanceItem[]{
  const disabled=new Set(guidanceConfig.disabled.filter(item=>item.recipeId===recipe.id).map(item=>item.field));
  const items:GuidanceItem[]=[];
  for(const field of fieldOrder){
    if(disabled.has(field))continue;
    const availability=guidanceAvailability(recipe,field);
    if(availability==='provided'||availability==='notApplicable')continue;
    if(field==='brewer'&&availability==='missing'){
      const item=brewerGuidance(recipe,availability);if(item)items.push(item);
    }else if(field==='grinder'&&(availability==='missing'||availability==='partial')){
      const item=grinderGuidance(recipe,availability);if(item)items.push(item);
    }else if(field==='paper'&&availability==='missing'){
      const item=paperGuidance(recipe,availability);if(item)items.push(item);
    }else if(field==='temperature'&&availability==='missing'){
      const item=temperatureGuidance(recipe,availability);if(item)items.push(item);
    }else if(field==='brewTime'&&availability==='missing'){
      const item=brewTimeGuidance(recipe,availability);if(item)items.push(item);
    }
  }
  return items;
}

export function guidancePartialFields(recipe:Recipe):GuidanceField[]{
  return fieldOrder.filter(field=>guidanceAvailability(recipe,field)==='partial');
}

export function guidanceValueText(item:GuidanceItem):string{
  if(item.value.kind==='text')return item.value.text;
  if(item.value.kind==='list')return item.value.items.join(' · ');
  if(item.value.kind==='temperature')return `${item.value.min===item.value.max?item.value.min:`${item.value.min}–${item.value.max}`} ${item.value.unit}`;
  return item.value.min===item.value.max?time(item.value.min):`${time(item.value.min)}–${time(item.value.max)}`;
}

export function guidanceSearchText(recipe:Recipe):string{
  return guidanceForRecipe(recipe).flatMap(item=>[
    item.field,
    guidanceFieldLabelKeys[item.field],
    guidanceValueText(item),
    ...item.references.map(reference=>reference.recipeId)
  ]).join(' ');
}

export function equipmentGuidance(item:Equipment):{recipeIds:string[];methods:Method[]}{
  const related=recipes.filter(recipe=>item.recipeIds.includes(recipe.id));
  return {recipeIds:related.map(recipe=>recipe.id),methods:[...new Set(related.map(recipe=>recipe.method))]};
}

export function compatibleEquipment(item:Equipment):string[]{
  return guidanceConfig.compatibleEquipment.find(relation=>relation.equipmentId===item.id)?.compatibleEquipmentIds||[];
}
