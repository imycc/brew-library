import {z} from 'zod';
import rawRecipes from '../../content/recipes.json';

const stepSchema = z.object({
  action: z.enum(['pour','bloom','swirl','pause','finish','close','open','topup','pulses','level']),
  at: z.number().nonnegative().nullable(),
  end: z.number().nonnegative().optional(),
  amount: z.number().positive().nullable(),
  cumulative: z.number().positive().nullable()
});
export const recipeSchema = z.object({
  id:z.string().regex(/^[a-z0-9-]+$/), copy:z.string().regex(/^[a-z0-9-]+$/),
  author:z.string(), authorId:z.string(), brewer:z.string(), brewerId:z.string(),
  kind:z.enum(['hot','iced']), dose:z.number().positive(),
  water:z.object({amount:z.number().positive(), unit:z.enum(['g','mL']), derived:z.boolean().default(false)}),
  temperature:z.number().positive().nullable(), duration:z.tuple([z.number().positive(),z.number().positive()]),
  source:z.object({label:z.string(), url:z.url(), video:z.url().optional(), published:z.string().nullable(), checked:z.iso.date()}),
  image:z.enum(['coffee-bloom','brewer-still']),
  steps:z.array(stepSchema).min(1), preparation:z.array(z.string()),
  waterConditions:z.enum(['unknown','soft','rao']), beanConditions:z.enum(['unknown','light']),
  filterConditions:z.enum(['unknown','pulsar']), context:z.literal('daily')
});
export type Recipe = z.infer<typeof recipeSchema>;
export const recipes: Recipe[] = z.object({schemaVersion:z.literal(1),recipes:z.array(recipeSchema)}).parse(rawRecipes).recipes;
export const BASE = '/pour-over-coffee';
export const SITE = 'https://imycc.github.io';
export function time(seconds:number):string {return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
export function duration(recipe:Recipe):string {return recipe.duration[0]===recipe.duration[1]? time(recipe.duration[0]) : `${time(recipe.duration[0])}–${time(recipe.duration[1])}`;}
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
export function filterRecipes(list:Recipe[], filters:{q?:string;brewer?:string;author?:string;kind?:string;dose?:string}, title:(r:Recipe)=>string) {
  const query=(filters.q||'').normalize('NFKC').toLocaleLowerCase().trim();
  return list.filter(r=>(!query || `${title(r)} ${r.author} ${r.brewer} ${r.id}`.normalize('NFKC').toLocaleLowerCase().includes(query))
    &&(!filters.brewer||r.brewerId===filters.brewer)&&(!filters.author||r.authorId===filters.author)
    &&(!filters.kind||r.kind===filters.kind)&&(!filters.dose||String(r.dose)===filters.dose));
}
