import {z} from 'zod';
import rawEquipment from '../../content/equipment.json';

const detailKeySchema=z.enum([
  'capacity','materials','dimensions','weight','compatibility','mode','madeIn','model',
  'burr','adjustment','precision','groundsCapacity','format','packs','technology'
]);
const unitSchema=z.enum(['cups','mL','mm','g','in','lb','µm','sheets']);

export const equipmentSchema=z.object({
  id:z.string().regex(/^[a-z0-9-]+$/),
  category:z.enum(['dripper','grinder','filter']),
  brand:z.string().min(1),
  name:z.string().min(1),
  status:z.enum(['current','legacy','unresolved']),
  aliases:z.array(z.string().min(1)).default([]),
  details:z.array(z.object({
    key:detailKeySchema,
    value:z.string().min(1),
    unit:unitSchema.optional()
  })).min(1),
  recipeIds:z.array(z.string()).default([]),
  sources:z.array(z.object({label:z.string().min(1),url:z.url()})).min(1),
  checked:z.iso.date()
});

export type Equipment=z.infer<typeof equipmentSchema>;
export type EquipmentCategory=Equipment['category'];
export const equipmentCategories=['dripper','grinder','filter'] as const;
export const equipment:Equipment[]=z.object({
  schemaVersion:z.literal(1),
  equipment:z.array(equipmentSchema)
}).parse(rawEquipment).equipment;

export function filterEquipment(list:Equipment[],query:string,category:EquipmentCategory|'all'){
  const needle=query.normalize('NFKC').toLocaleLowerCase().trim();
  return list.filter(item=>(category==='all'||item.category===category) && (!needle||[
    item.brand,item.name,...item.aliases,...item.details.flatMap(detail=>[detail.key,detail.value,detail.unit||''])
  ].join(' ').normalize('NFKC').toLocaleLowerCase().includes(needle)));
}
