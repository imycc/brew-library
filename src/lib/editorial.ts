import {z} from 'zod';
import rawEditorial from '../../content/editorial.json';
import rawEquipmentExperience from '../../content/equipment-experience.json';

const traitSchema=z.string().regex(/^[a-z][a-zA-Z0-9]*$/);
const sourceImageSchema=z.object({
  url:z.url().refine(value=>value.startsWith('https://'),'Source image must use HTTPS'),
  sourceLabel:z.string().min(1),
  sourceUrl:z.url().refine(value=>value.startsWith('https://'),'Official image source must use HTTPS')
});
const experienceSourceSchema=z.object({
  label:z.string().min(1),
  url:z.url().refine(value=>value.startsWith('https://'),'Experience source must use HTTPS')
});
const equipmentExperienceSchema=z.object({
  tags:z.array(traitSchema).min(1).max(6),
  sources:z.array(experienceSourceSchema).min(1).max(3)
});
const editorialBaseSchema=z.object({
  strengths:z.array(traitSchema).min(1).max(3),
  considerations:z.array(traitSchema).min(1).max(3),
  sourceImage:sourceImageSchema.optional()
});

export const recipeEditorialSchema=editorialBaseSchema;
export const equipmentEditorialSchema=editorialBaseSchema.extend({role:traitSchema});

export type SourceImage=z.infer<typeof sourceImageSchema>;
export type RecipeEditorial=z.infer<typeof recipeEditorialSchema>;
export type EquipmentEditorial=z.infer<typeof equipmentEditorialSchema>;
export type EquipmentExperience=z.infer<typeof equipmentExperienceSchema>;

const parsed=z.object({
  schemaVersion:z.literal(1),
  recipes:z.record(z.string(),recipeEditorialSchema),
  equipment:z.record(z.string(),equipmentEditorialSchema)
}).parse(rawEditorial);

export const recipeEditorial:Record<string,RecipeEditorial>=parsed.recipes;
export const equipmentEditorial:Record<string,EquipmentEditorial>=parsed.equipment;
const parsedExperience=z.object({
  schemaVersion:z.literal(1),
  equipment:z.record(z.string(),equipmentExperienceSchema)
}).parse(rawEquipmentExperience);
export const equipmentExperience:Record<string,EquipmentExperience>=parsedExperience.equipment;
export const equipmentExperienceTags=[...new Set(Object.values(parsedExperience.equipment).flatMap(item=>item.tags))].sort();
export const editorialTraitKeys={
  strengths:[...new Set(Object.values(parsed.recipes).flatMap(item=>item.strengths).concat(Object.values(parsed.equipment).flatMap(item=>item.strengths)))].sort(),
  considerations:[...new Set(Object.values(parsed.recipes).flatMap(item=>item.considerations).concat(Object.values(parsed.equipment).flatMap(item=>item.considerations)))].sort()
};
export const equipmentEditorialRoles=[...new Set(Object.values(parsed.equipment).map(item=>item.role))].sort();
