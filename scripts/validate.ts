import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {locales} from '../src/i18n/locales';
import {recipes} from '../src/lib/recipes';
import {createTranslator} from 'next-intl';
export function flatten(obj:Record<string,unknown>,prefix=''):Record<string,string>{
 return Object.fromEntries(Object.entries(obj).flatMap(([key,value])=>typeof value==='string'?[[`${prefix}${key}`,value]]:Object.entries(flatten(value as Record<string,unknown>,`${prefix}${key}.`))));
}
export async function validate(){
 const english=JSON.parse(await readFile('messages/en.json','utf8'));
 const base=flatten(english);
 const placeholders=(text:string)=>[...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(m=>m[1]).sort();
 assert.equal(new Set(recipes.map(r=>r.id)).size,recipes.length,'Duplicate recipe id');
 for(const r of recipes){
   assert(r.duration[1]>=r.duration[0],r.id);
   const measured=r.steps.filter(s=>s.amount!==null);
   if(r.copy!=='rao'){
     let cumulative=0;
     for(const s of measured){cumulative+=s.amount!;assert.equal(s.cumulative,cumulative,`${r.id} cumulative`);}
     assert.equal(cumulative,r.water.amount,`${r.id} water total`);
   }
   for(const s of r.steps){if(s.end!==undefined&&s.at!==null)assert(s.end>=s.at,`${r.id} time range`);}
 }
 for(const locale of locales){
   const messages=JSON.parse(await readFile(`messages/${locale}.json`,'utf8'));
   const flat=flatten(messages);
   assert.deepEqual(Object.keys(flat).sort(),Object.keys(base).sort(),`${locale} missing/extra translations`);
   const t=createTranslator({locale,messages,onError(error){throw error;}});
   for(const [key,value]of Object.entries(flat)){
     assert(value.trim(),`${locale}/${key} empty`);
     assert.deepEqual(placeholders(value),placeholders(base[key]),`${locale}/${key} placeholders`);
     t(key,{count:3});
   }
   for(const r of recipes){
     for(const key of ['title','summary','version','grind','equipment','notes','finish'])assert(flat[`recipes.${r.copy}.${key}`],`${locale}/${r.id}/${key}`);
     for(const s of r.steps){assert(flat[`step.${s.action}`]);if(s.action!=='finish')assert(flat[`instruction.${s.action}`]);}
   }
 }
 console.log(`Validated ${recipes.length} source-backed recipes and ${Object.keys(base).length} messages × ${locales.length} locales.`);
}
if(process.argv[1]?.endsWith('validate.ts'))await validate();
