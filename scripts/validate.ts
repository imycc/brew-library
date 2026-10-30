import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {locales} from '../src/i18n/locales';
import {recipes,isEspresso,isPourOver,puckPrepKeys} from '../src/lib/recipes';
import {equipment} from '../src/lib/equipment';
import {equipmentEditorial,equipmentEditorialRoles,editorialTraitKeys,equipmentExperience,equipmentExperienceTags,recipeEditorial} from '../src/lib/editorial';
import {mergeMessages,type Messages} from '../src/i18n/merge-messages';
import {createTranslator} from 'next-intl';
export function flatten(obj:Record<string,unknown>,prefix=''):Record<string,string>{
 return Object.fromEntries(Object.entries(obj).flatMap(([key,value])=>typeof value==='string'?[[`${prefix}${key}`,value]]:Object.entries(flatten(value as Record<string,unknown>,`${prefix}${key}.`))));
}
export async function validate(){
 const english=mergeMessages(JSON.parse(await readFile('messages/en.json','utf8')) as Messages,JSON.parse(await readFile('messages/editorial-en.json','utf8')) as Messages);
 const base=flatten(english);
 const placeholders=(text:string)=>[...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(m=>m[1]).sort();
 assert.equal(new Set(recipes.map(r=>r.id)).size,recipes.length,'Duplicate recipe id');
 assert.equal(new Set(equipment.map(item=>item.id)).size,equipment.length,'Duplicate equipment id');
 const recipeIds=new Set(recipes.map(r=>r.id));
 const equipmentIds=new Set(equipment.map(item=>item.id));
 for(const [id,experience] of Object.entries(equipmentExperience)){
   assert(equipmentIds.has(id),`${id} experience references unknown equipment`);
   assert(experience.sources.length>0,`${id} experience needs a source`);
 }
 for(const item of equipment){
   for(const recipeId of item.recipeIds)assert(recipeIds.has(recipeId),`${item.id} references unknown recipe ${recipeId}`);
   assert(item.sources.length>0,`${item.id} needs a source`);
   const editorial=equipmentEditorial[item.id];
   assert(editorial,`${item.id} needs editorial copy`);
   if(editorial.sourceImage)assert(item.sources.some(source=>source.url===editorial.sourceImage?.sourceUrl),`${item.id} image needs an official listed source`);
 }
 for(const r of recipes){
   const editorial=recipeEditorial[r.id];
   assert(editorial,`${r.id} needs editorial copy`);
   if(editorial.sourceImage)assert(editorial.sourceImage.sourceUrl===r.source.url,`${r.id} image source mismatch`);
   if(r.duration&&r.removalAt!==undefined)assert(r.removalAt<=r.duration[1]+120,`${r.id} removal far past the stated finish`);
   if(r.doseGround!==undefined)assert(r.doseGround>=r.dose,`${r.id} cannot dose more than it ground`);
   if(r.doseMax!==undefined)assert(r.doseMax>r.dose,`${r.id} dose range must run upward`);
   if(r.method==='pour-over'&&r.water.waterMax!==undefined)assert(r.water.waterMax>r.water.amount,`${r.id} water range must run upward`);
   let lastVideoAt=-1;
   for(const s of r.steps){
     if(s.videoAt===undefined)continue;
     assert(r.source.video,`${r.id} has a step video time but no video source`);
     assert(s.videoAt>=lastVideoAt,`${r.id} step video times must not run backwards`);
     lastVideoAt=s.videoAt;
   }
   for(const item of r.teaching||[]){
     assert(item.step===undefined||item.step<r.steps.length,`${r.id} teaching points past the last step`);
     assert(r.source.video||item.step!==undefined,`${r.id} teaching step needs a step list`);
   }
   if(r.kind==='iced')assert(r.ice,`${r.id} is iced but states no ice`);
   if(r.kind==='hot')assert(!r.ice,`${r.id} is hot but states ice`);
   if(r.ice){
     const liquidUnit=isPourOver(r)?r.water.unit:r.water?.unit;
     if(liquidUnit)assert(r.ice.unit===liquidUnit,`${r.id} ice and water must share a unit`);
     assert(r.ice.placement,`${r.id} ice needs a placement`);
     if(r.ice.amountMax!==undefined)assert(r.ice.amountMax>r.ice.amount,`${r.id} ice range must run upward`);
   }
   if(isPourOver(r)&&r.valve)assert(r.steps.some(s=>['open','close'].includes(s.action)),`${r.id} states a valve but has no valve step`);
   if(r.water?.hardness!==undefined)assert(r.water.hardnessUnit,`${r.id} hardness needs its published unit`);
   if(r.water?.alkalinity!==undefined)assert(r.water.alkalinityUnit,`${r.id} alkalinity needs its published unit`);
   if(r.ratioStated){
     const numbers=(r.ratioStated.match(/[\d.]+/g)||[]).map(Number).sort((a,b)=>a-b);
     assert(numbers.length===2,`${r.id} ratio must state two numbers`);
     const[small,large]=numbers as [number,number];
     // Iced sources state water and ice separately; the ratio they quote is over both.
     const liquid=isPourOver(r)&&r.ice&&r.ice.unit===r.water.unit?r.water.amount+r.ice.amount:isPourOver(r)?r.water.amount:null;
     const computed=isPourOver(r)?liquid!/r.dose:r.yield?r.yield.amount/r.dose:null;
     if(computed!==null)assert(Math.abs(large/small-computed)<.5,`${r.id} stated ratio disagrees with its own dose and liquid`);
   }
   if(r.yield&&isPourOver(r))assert(r.yield.amount<r.water.amount,`${r.id} beverage yield cannot exceed the water poured`);
   for(const s of r.steps){
     if(s.count!==undefined)assert(['stir','swirl'].includes(s.action),`${r.id} a count needs an agitation step`);
     if(s.derived)assert(s.amount!==null,`${r.id} only a quantified addition can be marked derived`);
     if(s.levelMin!==undefined&&s.levelMax!==undefined)assert(s.levelMax>=s.levelMin,`${r.id} water level range`);
   }
   if(r.duration)assert(r.duration[1]>=r.duration[0],r.id);
   if(r.temperatureMax!==undefined){assert(r.temperature!==null,`${r.id} temperature range needs a lower bound`);assert(r.temperatureMax>=r.temperature,`${r.id} temperature range must run upward`);}
   if(isPourOver(r)){
     const measured=r.steps.filter(s=>s.amount!==null);
     assert(new Set(measured.map(s=>s.unit||r.water.unit)).size<=1,`${r.id} cannot sum mixed step units`);
     let cumulative:number|null=0;
     for(const s of r.steps){
       if(!['pour','bloom','pulses'].includes(s.action))continue;
       if(s.amount!==null&&cumulative!==null){cumulative+=s.amount;if(s.cumulative!==null)assert.equal(s.cumulative,cumulative,`${r.id} cumulative`);}
       else cumulative=s.cumulative;
     }
     // Only compare totals when mass/volume units actually match. Never convert g to mL.
     if(cumulative!==null&&measured.every(s=>(s.unit||r.water.unit)===r.water.unit))assert.equal(cumulative,r.water.amount,`${r.id} water total`);
   }
   if(isEspresso(r)){
     const pre=r.extraction?.preInfusion;
     if(pre?.seconds!=null&&r.duration)assert(pre.seconds<=r.duration[1],`${r.id} pre-infusion runs past the stated shot time`);
     assert(!r.steps.some(s=>['pour','bloom','topup','pulses'].includes(s.action)),`${r.id} espresso records do not carry pour-over additions`);
   }
   for(const s of r.steps){if(s.end!==undefined&&s.at!==null)assert(s.end>=s.at,`${r.id} time range`);}
 }
 for(const locale of locales){
   const messages=mergeMessages(JSON.parse(await readFile(`messages/${locale}.json`,'utf8')) as Messages,JSON.parse(await readFile(`messages/editorial-${locale}.json`,'utf8')) as Messages);
   const flat=flatten(messages);
   assert.deepEqual(Object.keys(flat).sort(),Object.keys(base).sort(),`${locale} missing/extra translations`);
   // The message catalogue is intentionally checked by dynamic keys. Cast the
   // translator at this boundary so next-intl's generated key union does not
   // turn a runtime catalogue audit into an excessively deep type instantiation.
   const t=createTranslator({locale,messages:messages as Record<string, unknown>,onError(error){throw error;}}) as unknown as (key:string,values?:Record<string,unknown>)=>string;
   for(const [key,value]of Object.entries(flat)){
     assert(value.trim(),`${locale}/${key} empty`);
     assert.deepEqual(placeholders(value),placeholders(base[key]),`${locale}/${key} placeholders`);
     const values=Object.fromEntries(placeholders(value).map(name=>[name,name==='count'?3:'example']));
     t(key,values);
   }
   for(const r of recipes){
     const editorial=recipeEditorial[r.id];
     for(const trait of editorial.strengths)assert(flat[`editorialStrengths.${trait}`],`${locale}/recipe strength ${r.id}/${trait}`);
     for(const trait of editorial.considerations)assert(flat[`editorialConsiderations.${trait}`],`${locale}/recipe consideration ${r.id}/${trait}`);
     for(const key of ['title','summary','version','grind','equipment','notes','finish','overview','bestFor'])assert(flat[`recipes.${r.copy}.${key}`],`${locale}/${r.id}/${key}`);
     for(const s of r.steps){assert(flat[`step.${s.action}`]);if(s.action!=='finish')assert(flat[`instruction.${s.action}`]);}
     for(const key of [...r.preparation,r.beanNote,r.waterNote,r.filterNote,...r.steps.map(s=>s.instruction)].filter((key):key is string=>!!key))assert(flat[key],`${locale}/${r.id}/${key}`);
     for(const s of r.steps){
       if(s.pattern)assert(flat[`pourPatterns.${s.pattern}`],`${locale}/${r.id} pour pattern ${s.pattern}`);
       if(s.style)assert(flat[`pourStyles.${s.style}`],`${locale}/${r.id} pour style ${s.style}`);
       if(s.direction)assert(flat[`pourDirections.${s.direction}`],`${locale}/${r.id} direction ${s.direction}`);
     }
     for(const key of (isPourOver(r)?r.bedPrep||[]:puckPrepKeys(r)))assert(flat[isPourOver(r)?`bedPrepLabels.${key}`:`puckPrepLabels.${key}`],`${locale}/${r.id} prep ${key}`);
     if(isPourOver(r)&&r.valve)assert(flat[`valveStates.${r.valve}`],`${locale}/${r.id} valve state`);
     if(r.yield)assert(flat[`yieldBases.${r.yield.basis}`],`${locale}/${r.id} yield basis`);
     if(r.source.publishedBasis)assert(flat[`publishedBases.${r.source.publishedBasis}`],`${locale}/${r.id} published basis`);
     if(r.grindHedged)assert(flat['grindHedged'],`${locale}/${r.id} hedged grind label`);
     for(const item of r.teaching||[])assert(flat[item.key],`${locale}/${r.id} teaching key ${item.key}`);
     for(const key of r.tasting||[])assert(flat[key],`${locale}/${r.id} tasting key ${key}`);
     for(const key of r.tasting||[])assert(flat[key],`${locale}/${r.id} tasting key ${key}`);
     if(r.grindMicron)assert(flat[`grindMicronBases.${r.grindMicron.basis}`],`${locale}/${r.id} micron basis`);
   }
   for(const key of ['equipmentNav','equipmentTitle','equipmentIntro','equipmentItems','equipmentSearch','equipmentCategory','equipmentResults','equipmentNote','equipmentRelated','equipmentChecked','equipmentEmpty'])assert(flat[`${key}`],`${locale}/${key}`);
   for(const item of equipment){
     assert(flat[`equipmentCategories.${item.category}`],`${locale}/equipment category ${item.category}`);
     assert(flat[`equipmentStatus.${item.status}`]||item.status==='current',`${locale}/equipment status ${item.status}`);
     for(const detail of item.details){assert(flat[`equipmentSpecs.${detail.key}`],`${locale}/equipment spec ${detail.key}`);if(detail.unit)assert(flat[`equipmentUnits.${detail.unit}`],`${locale}/equipment unit ${detail.unit}`);if(detail.valueKey)assert(flat[`equipmentValues.${detail.valueKey}`],`${locale}/equipment value ${detail.valueKey}`);}
     if(detailMaterialKeys(item.details))for(const material of detailMaterialKeys(item.details)!)assert(flat[`equipmentMaterials.${material}`],`${locale}/equipment material ${material}`);
     const editorial=equipmentEditorial[item.id];
     assert(flat[`equipmentRoles.${editorial.role}`],`${locale}/equipment role ${editorial.role}`);
     for(const trait of editorial.strengths)assert(flat[`editorialStrengths.${trait}`],`${locale}/strength ${trait}`);
     for(const trait of editorial.considerations)assert(flat[`editorialConsiderations.${trait}`],`${locale}/consideration ${trait}`);
     const experience=equipmentExperience[item.id];
     if(experience)for(const tag of experience.tags)assert(flat[`equipmentExperienceTags.${tag}`],`${locale}/experience tag ${tag}`);
   }
   for(const key of ['recipeOverview','bestFor','strengths','considerations','equipmentEditorialNote','sourceImageUnavailable','sourceImageAlt','sourceImageRecipe','sourceImageEquipment','sourceImageCredit','sourceImageView','equipmentExperienceTitle','equipmentExperienceNote','equipmentExperienceSources','equipmentExperienceUnavailable'])assert(flat[key],`${locale}/${key}`);
   for(const tag of equipmentExperienceTags)assert(flat[`equipmentExperienceTags.${tag}`],`${locale}/experience tag ${tag}`);
 }
 assert(equipmentEditorialRoles.length>0&&editorialTraitKeys.strengths.length>0&&editorialTraitKeys.considerations.length>0&&equipmentExperienceTags.length>0,'Editorial vocabulary must not be empty');
 console.log(`Validated ${recipes.length} source-backed recipes, ${equipment.length} equipment records and ${Object.keys(base).length} messages × ${locales.length} locales.`);
}
if(process.argv[1]?.endsWith('validate.ts'))await validate();

function detailMaterialKeys(details:{key:string;value:string}[]){
  const material=details.find(detail=>detail.key==='materials')?.value;
  return material?.split(';').map(value=>value.trim())||null;
}
