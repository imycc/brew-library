import {z} from 'zod';
import rawRecipes from '../../content/recipes.json';

const pourPattern=z.enum(['centre','circular','spiral','vertical','lateral','wholeBed','any']);
const pourStyle=z.enum(['aggressive','turbulent','slow','gentle','steady','forceful']);
const stepSchema = z.object({
  action: z.enum(['pour','bloom','swirl','stir','pause','drain','finish','close','open','topup','pulses','level']),
  at: z.number().nonnegative().nullable(),
  end: z.number().nonnegative().optional(),
  amount: z.number().positive().nullable(),
  cumulative: z.number().positive().nullable(),
  unit: z.enum(['g','mL']).optional(),
  temperature: z.number().positive().optional(),
  instruction: z.string().optional(),
  pattern: pourPattern.optional(),
  style: pourStyle.optional(),
  count: z.number().int().positive().optional(),
  direction: z.enum(['clockwise','counterclockwise']).optional(),
  levelMin: z.number().nonnegative().optional(),
  levelMax: z.number().nonnegative().optional(),
  derived: z.boolean().optional()
});
export const recipeSchema = z.object({
  id:z.string().regex(/^[a-z0-9-]+$/), copy:z.string().regex(/^[a-z0-9-]+$/),
  author:z.string(), authorId:z.string(), brewer:z.string(), brewerId:z.string(),
  kind:z.enum(['hot','iced']), dose:z.number().positive(),
  water:z.object({amount:z.number().positive(), unit:z.enum(['g','mL']), derived:z.boolean().default(false),
    tds:z.number().positive().optional(), ppm:z.number().positive().optional(), hardness:z.number().positive().optional(), hardnessUnit:z.enum(['ppm','mg/L']).optional(), alkalinity:z.number().positive().optional(), alkalinityUnit:z.enum(['ppm','mg/L']).optional()}),
  ice:z.object({amount:z.number().positive(), amountMax:z.number().positive().optional(), approximate:z.boolean().optional(), unit:z.enum(['g','mL']), placement:z.enum(['server','brewer','glass'])}).optional(),
  temperature:z.number().positive().nullable(), temperatureMode:z.enum(['boiling','unknown']).default('unknown'), duration:z.tuple([z.number().positive(),z.number().positive()]).nullable(),
  removalAt:z.number().nonnegative().optional(),
  yield:z.object({amount:z.number().positive(), unit:z.enum(['g','mL']), basis:z.enum(['observed','target'])}).optional(),
  ratioStated:z.string().optional(),
  beverageTds:z.number().positive().optional(),
  doseGround:z.number().positive().optional(),
  bedPrep:z.array(z.enum(['rinseFilter','coldRinse','discardRinse','prewarmServer','levelBed','crater','siftFines','removeChaff'])).optional(),
  valve:z.enum(['open','closed']).optional(),
  grindHedged:z.boolean().optional(),
  source:z.object({label:z.string(), url:z.url(), video:z.url().optional(), videoPublished:z.string().nullable().optional(), published:z.string().nullable(), publishedBasis:z.enum(['page','video','event']).optional(), updated:z.string().nullable().optional(), archive:z.url().optional(), videoArchive:z.url().optional(), checked:z.iso.date()}),
  image:z.enum(['coffee-bloom','brewer-still']),
  steps:z.array(stepSchema).min(1), preparation:z.array(z.string()),
  waterConditions:z.enum(['unknown','soft','rao']), beanConditions:z.enum(['unknown','light']),
  filterConditions:z.enum(['unknown','pulsar']), context:z.enum(['daily','competition']),
  beanNote:z.string().optional(), waterNote:z.string().optional(), filterNote:z.string().optional(),
  grinder:z.object({id:z.string(),name:z.string(),setting:z.string().nullable(),secondSetting:z.string().optional()}).optional(),
  grindMicron:z.object({value:z.number().positive(), basis:z.enum(['psdPeak'])}).optional(),
  paper:z.object({id:z.string(),name:z.string(),shape:z.enum(['cone','wave','flat']).optional()}).optional(),
  coffee:z.object({name:z.string().optional(),origin:z.string().optional(),variety:z.string().optional(),process:z.enum(['washed','natural','honey','anaerobic']).optional(),roast:z.enum(['light','medium','dark']).optional(),asRecommendation:z.boolean().optional()}).optional()
});
export type Recipe = z.infer<typeof recipeSchema>;
export const recipes: Recipe[] = z.object({schemaVersion:z.literal(1),recipes:z.array(recipeSchema)}).parse(rawRecipes).recipes;
export const BASE = '/brew-library';
export const SITE = 'https://imycc.github.io';
export function time(seconds:number):string {return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
export function duration(recipe:Recipe):string {return !recipe.duration?'—':recipe.duration[0]===recipe.duration[1]? time(recipe.duration[0]) : `${time(recipe.duration[0])}–${time(recipe.duration[1])}`;}
export function iceAmountText(recipe:Recipe):string {
  if(!recipe.ice)return '';
  const{amount,amountMax,approximate,unit}=recipe.ice;
  return `${approximate?'~':''}${amount}${amountMax!==undefined?`–${amountMax}`:''} ${unit}`;
}
export function totalLiquid(recipe:Recipe):{amount:number;unit:string;derived:boolean}|null {
  if(!recipe.ice)return {amount:recipe.water.amount,unit:recipe.water.unit,derived:recipe.water.derived};
  // Ice is never converted into water: a mismatched pair simply has no total.
  if(recipe.ice.unit!==recipe.water.unit)return null;
  return {amount:recipe.water.amount+recipe.ice.amount,unit:recipe.water.unit,derived:true};
}
export function ratio(recipe:Recipe, locale:string):string {
  const total=totalLiquid(recipe);
  // Cannot pair the two units: show the water ratio alone rather than inventing a total.
  if(!total)return recipe.water.unit==='g'?`1 : ${new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(recipe.water.amount/recipe.dose)}`:`${recipe.dose} g : ${recipe.water.amount} mL`;
  return total.unit==='g'?`1 : ${new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(total.amount/recipe.dose)}`:`${recipe.dose} g : ${total.amount} mL`;
}

const ADDITIONS=new Set(['pour','bloom','pulses','topup']);
function additions(recipe:Recipe) {return recipe.steps.filter(s=>ADDITIONS.has(s.action)&&s.amount!==null);}
export function additionUnit(recipe:Recipe):string|null {
  const measured=additions(recipe);
  if(!measured.length)return null;
  const units=new Set(measured.map(s=>s.unit||recipe.water.unit));
  return units.size===1?[...units][0]:null;
}
// Only when every published addition is quantified in the water's own unit can a
// percentage be read as a share of the recipe rather than a share of a partial list.
export function accountedAdditions(recipe:Recipe):{amount:number;unit:string}|null {
  const unit=additionUnit(recipe);
  if(!unit||unit!==recipe.water.unit)return null;
  const amount=additions(recipe).reduce((sum,s)=>sum+(s.amount as number),0);
  return amount===recipe.water.amount?{amount,unit}:null;
}
export function bloomShare(recipe:Recipe):number|null {
  const total=accountedAdditions(recipe);
  const bloom=recipe.steps.find(s=>s.action==='bloom'&&s.amount!==null);
  return bloom&&total?(bloom.amount as number)/total.amount:null;
}
export type PourPhase={endsAt:number;kind:'end'|'start';drawdown:number|null};
export function pourPhase(recipe:Recipe):PourPhase|null {
  // Every pouring step counts here, quantified or not: an untimed later burst means the
  // source never published when pouring finished.
  const stages=recipe.steps.filter(s=>ADDITIONS.has(s.action));
  if(!stages.length||stages.some(s=>s.at===null))return null;
  const measured=stages.filter(s=>s.amount!==null);
  if(!measured.length)return null;
  const starts=stages.map(s=>s.at as number);
  const ends=stages.map(s=>s.end).filter((end):end is number=>end!==undefined&&end!==null);
  const lastStart=Math.max(...starts);
  const lastEnd=Math.max(...ends);
  const hasEnd=ends.length&&lastEnd>=lastStart;
  const endsAt=hasEnd?lastEnd:lastStart;
  const finish=recipe.duration?recipe.duration[0]:null;
  return {endsAt,kind:hasEnd?'end':'start',drawdown:finish!==null&&finish>=endsAt?finish-endsAt:null};
}
export function sourceFacts(recipe:Recipe):{provided:boolean;key:string;label:string}[] {
  const measured=additions(recipe);
  return [
    {key:'temperature',label:'temperature',provided:recipe.temperature!==null||recipe.temperatureMode==='boiling'},
    {key:'brewTime',label:'brewTime',provided:recipe.duration!==null},
    {key:'grinder',label:'grinder',provided:!!recipe.grinder?.setting},
    {key:'paper',label:'filterPaper',provided:!!recipe.paper||recipe.filterConditions!=='unknown'},
    {key:'beans',label:'beans',provided:!!recipe.coffee||!!recipe.beanNote},
    {key:'waterChemistry',label:'waterQuality',provided:recipe.waterConditions!=='unknown'||!!recipe.waterNote},
    {key:'allAdditions',label:'allAdditions',provided:measured.length>0&&measured.every(s=>s.at!==null)},
    {key:'totalWater',label:'totalWaterPublished',provided:!!accountedAdditions(recipe)}
  ];
}
export function parseSelection(raw:string|null, list:Recipe[]=recipes) {
  const requested=(raw||'').split(',').filter(Boolean);
  const valid=new Set(list.map(r=>r.id));
  const ids=[...new Set(requested.filter(id=>valid.has(id)))].slice(0,3);
  return {ids,invalid:requested.some(id=>!valid.has(id))||new Set(requested).size>3||new Set(requested).size!==requested.length};
}
export function toggleSelection(ids:string[], id:string, list:Recipe[]=recipes):{ids:string[];limit:boolean} {
  if(ids.includes(id)) return {ids:ids.filter(x=>x!==id),limit:false};
  if(!list.some(r=>r.id===id))return {ids,limit:false};
  if(ids.length>=3)return {ids,limit:true};
  return {ids:[...ids,id],limit:false};
}
export const filterKeys=['q','brewer','author','kind','dose','grinder','paper','process','roast'] as const;
export type RecipeFilters=Partial<Record<typeof filterKeys[number],string>>;
export function filterRecipes(list:Recipe[], filters:RecipeFilters, title:(r:Recipe)=>string) {
  const query=(filters.q||'').normalize('NFKC').toLocaleLowerCase().trim();
  return list.filter(r=>(!query || `${title(r)} ${r.author} ${r.brewer} ${r.id} ${r.grinder?.name||''} ${r.paper?.name||''} ${r.coffee?.name||''} ${r.coffee?.origin||''} ${r.coffee?.variety||''}`.normalize('NFKC').toLocaleLowerCase().includes(query))
    &&(!filters.brewer||r.brewerId===filters.brewer)&&(!filters.author||r.authorId===filters.author)
    &&(!filters.kind||r.kind===filters.kind)&&(!filters.dose||String(r.dose)===filters.dose)
    &&(!filters.grinder||r.grinder?.id===filters.grinder)&&(!filters.paper||r.paper?.id===filters.paper)
    &&(!filters.process||r.coffee?.process===filters.process)&&(!filters.roast||r.coffee?.roast===filters.roast));
}
