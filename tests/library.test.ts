import test from 'node:test';
import assert from 'node:assert/strict';
import {filterRecipes,parseSelection,toggleSelection,recipes,time} from '../src/lib/recipes';
import {validate} from '../scripts/validate';
test('source and translation validation',async()=>{await validate();});
test('original HARIO times and units remain distinct',()=>{
 const r=recipes[0];assert.equal(r.water.unit,'mL');assert.deepEqual(r.steps.filter(s=>s.amount).map(s=>s.at),[0,45,90,130,160]);
 assert.equal(recipes[1].temperature,null);assert.equal(recipes[1].water.unit,'g');
});
test('Pulsar amount is transparently derived without invented later pour times',()=>{
 const r=recipes[2];assert(r.water.derived);assert.equal(r.water.amount,r.dose*17);assert(r.steps.some(s=>s.at===null));
});
test('filters combine and support empty results',()=>{
 assert.equal(filterRecipes(recipes,{q:'JAMES',brewer:'v60',dose:'15'},r=>r.author).length,1);
 assert.equal(filterRecipes(recipes,{author:'hoffmann',brewer:'pulsar'},r=>r.author).length,0);
 assert.equal(filterRecipes(recipes,{kind:'iced'},r=>r.author).length,0);
});
test('shared selections are validated, deduplicated and bounded',()=>{
 const raw='missing,kasuya-46,kasuya-46,hoffmann-one-cup,rao-pulsar';
 assert.deepEqual(parseSelection(raw).ids,recipes.slice(0,3).map(r=>r.id));assert(parseSelection(raw).invalid);
 assert(parseSelection('kasuya-46,kasuya-46').invalid);
 const fourth={...recipes[0],id:'test-fourth'};
 const ids=recipes.slice(0,3).map(r=>r.id);
 assert(toggleSelection(ids,'test-fourth',[...recipes,fourth]).limit);
 assert.deepEqual(toggleSelection(ids,'kasuya-46').ids,['hoffmann-one-cup','rao-pulsar']);
});
test('times retain seconds and ranges are not decimal minutes',()=>{assert.equal(time(130),'2:10');assert.equal(time(210),'3:30');});

test('expanded original recipes preserve unknown temperatures and mixed source units',()=>{
 assert.equal(recipes.length,8);
 const find=(id:string)=>recipes.find(r=>r.id===id)!;
 assert.equal(find('wong-switch').temperatureMode,'unknown');
 assert.equal(find('wong-switch').temperature,null);
 assert.equal(find('boen-switch').context,'competition');
 assert.equal(find('boen-switch').water.unit,'mL');
 assert.equal(find('boen-switch').steps.find(s=>s.amount)?.unit,'g');
 assert.equal(find('hoang-w60').water.unit,'g');
 assert.equal(find('hoang-w60').steps[0].unit,'mL');
 assert.equal(find('rojewska-v60').steps[0].amount,null);
 assert.equal(find('rojewska-v60').duration[0],135);
 assert.equal(filterRecipes(recipes,{brewer:'switch'},r=>r.author).length,2);
});
