import {z} from 'zod';
import rawRecipes from '../../content/recipes.json';

const stepSchema = z.object({
  action: z.enum(['pour','bloom','swirl','pause','finish','close','open','topup','pulses','level']),
  at: z.number().nonnegative().nullable(),
  end: z.number().nonnegative().optional(),
  amount: z.number().positive().nullable(),
  cumulative: z.number().positive().nullable(),
  unit: z.enum(['g','mL']).optional(),
  temperature: z.number().positive().optional(),
  instruction: z.string().optional()
});
export const recipeSchema = z.object({
  id:z.string().regex(/^[a-z0-9-]+$/), copy:z.string().regex(/^[a-z0-9-]+$/),
  author:z.string(), authorId:z.string(), brewer:z.string(), brewerId:z.string(),
  kind:z.enum(['hot','iced']), dose:z.number().positive(),
  water:z.object({amount:z.number().positive(), unit:z.enum(['g','mL']), derived:z.boolean().default(false)}),
  temperature:z.number().positive().nullable(), temperatureMode:z.enum(['boiling','unknown']).default('unknown'), duration:z.tuple([z.number().positive(),z.number().positive()]).nullable(),
  source:z.object({label:z.string(), url:z.url(), video:z.url().optional(), published:z.string().nullable(), checked:z.iso.date()}),
  image:z.enum(['coffee-bloom','brewer-still']),
  steps:z.array(stepSchema).min(1), preparation:z.array(z.string()),
  waterConditions:z.enum(['unknown','soft','rao']), beanConditions:z.enum(['unknown','light']),
  filterConditions:z.enum(['unknown','pulsar']), context:z.enum(['daily','competition']),
  beanNote:z.string().optional(), waterNote:z.string().optional(), filterNote:z.string().optional(),
  grinder:z.object({id:z.string(),name:z.string(),setting:z.string().nullable()}).optional(),
  paper:z.object({id:z.string(),name:z.string(),shape:z.enum(['cone','wave','flat']).optional()}).optional(),
  coffee:z.object({name:z.string().optional(),origin:z.string().optional(),variety:z.string().optional(),process:z.enum(['washed','natural','honey','anaerobic']).optional(),roast:z.enum(['light','medium','dark']).optional()}).optional()
});
export type Recipe = z.infer<typeof recipeSchema>;
export const recipes: Recipe[] = z.object({schemaVersion:z.literal(1),recipes:z.array(recipeSchema)}).parse(rawRecipes).recipes;
export const BASE = '/pour-over-coffee';
export const SITE = 'https://imycc.github.io';
export function time(seconds:number):string {return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
export function duration(recipe:Recipe):string {return !recipe.duration?'—':recipe.duration[0]===recipe.duration[1]? time(recipe.duration[0]) : `${time(recipe.duration[0])}–${time(recipe.duration[1])}`;}
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
