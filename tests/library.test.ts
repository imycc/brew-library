import test from 'node:test';
import assert from 'node:assert/strict';
import {convertTemperature,formatTemperature} from '../src/lib/temperature';
import {espressoSchema,pourOverSchema,filterRecipes,methodFilterKeys,methodFilterParam,parseSelection,toggleSelection,recipes,pourOverRecipes,espressoRecipes,time,ratio,accountedAdditions,bloomShare,pourPhase,sourceFacts,totalLiquid,yieldText,pressureText,preInfusionText,basketText,type Recipe,videoLink} from '../src/lib/recipes';
import {equipment,filterEquipment} from '../src/lib/equipment';
import {equipmentEditorial,equipmentExperience,recipeEditorial} from '../src/lib/editorial';
import {validate} from '../scripts/validate';
test('source and translation validation',async()=>{await validate();});
test('original HARIO times and units remain distinct',()=>{
 const r=pourOverRecipes[0];assert.equal(r.water.unit,'mL');assert.deepEqual(r.steps.filter(s=>s.amount).map(s=>s.at),[0,45,90,130,160]);
 assert.equal(pourOverRecipes[1].temperature,null);assert.equal(pourOverRecipes[1].water.unit,'g');
});
test('Pulsar amount is transparently derived without invented later pour times',()=>{
 const r=pourOverRecipes[2];assert(r.water.derived);assert.equal(r.water.amount,r.dose*17);assert(r.steps.some(s=>s.at===null));
});
test('filters combine and support empty results',()=>{
 assert.equal(filterRecipes(recipes,{q:'JAMES',brewer:'v60',dose:'15'},r=>r.author).length,1);
 assert.equal(filterRecipes(recipes,{author:'hoffmann',brewer:'pulsar'},r=>r.author).length,0);
 assert.equal(filterRecipes(recipes,{kind:'iced'},r=>r.author).length,2);
});
test('each method tab owns its filter keys and query names',()=>{
 assert.deepEqual(methodFilterKeys['pour-over'],['q','brewer','author','kind','dose','grinder','paper','process','roast']);
 assert.deepEqual(methodFilterKeys.espresso,['q','brewer','author','kind','dose','grinder','process','roast']);
 assert.equal(methodFilterParam('pour-over','grinder'),'po.grinder');
 assert.equal(methodFilterParam('espresso','dose'),'es.dose');
 assert.deepEqual(filterRecipes(espressoRecipes,{q:'Camber',kind:'hot'},r=>r.author).map(r=>r.id),['camber-espresso']);
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
const po=(id:string)=>pourOverRecipes.find(recipe=>recipe.id===id)!;
test('times retain seconds and ranges are not decimal minutes',()=>{assert.equal(time(130),'2:10');assert.equal(time(210),'3:30');});

test('expanded original recipes preserve unknown temperatures and mixed source units',()=>{
 assert.equal(recipes.length,38);
 const find=(id:string)=>recipes.find(r=>r.id===id)!;
 assert.equal(find('wong-switch').temperatureMode,'unknown');
 assert.equal(find('wong-switch').temperature,null);
 assert.equal(find('boen-switch').context,'competition');
 assert.equal(po('boen-switch').water.unit,'mL');
 assert.equal(find('boen-switch').steps.find(s=>s.amount)?.unit,'g');
 assert.equal(po('hoang-w60').water.unit,'g');
 assert.equal(find('hoang-w60').steps[0].unit,'mL');
 assert.equal(find('rojewska-v60').steps[0].amount,null);
 assert.equal(find('rojewska-v60').duration?.[0],135);
 assert.equal(filterRecipes(recipes,{brewer:'switch'},r=>r.author).length,3);
 assert.equal(find('grill-v60').temperature,92);
 assert.equal(find('mallouhi-v60').temperatureMode,'unknown');
 assert.equal(find('chronicler-switch').duration?.[0],165);
});
test('added official V60 recipes keep source volumes, units and coffee conditions',()=>{
 const find=(id:string)=>recipes.find(r=>r.id===id)!;
 const ultimate=po('hoffmann-ultimate-v60');
 assert.equal(ultimate.water.amount,500);
 assert.equal(ultimate.water.unit,'mL');
 assert.equal(ultimate.temperatureMode,'boiling');
 assert.equal(ultimate.steps.filter(step=>step.amount!==null).reduce((sum,step)=>sum+(step.amount||0),0),500);
 assert.equal(ultimate.steps[4].instruction,'recipes.hoffmann-ultimate.s04');
 assert.equal(ultimate.steps[4].count,1);
 assert.equal(ultimate.steps[4].direction,'clockwise');
 assert.equal(ultimate.steps[5].direction,'counterclockwise');
 assert.equal(ultimate.steps[6].action,'drain');
 assert.equal(ultimate.steps[6].at,null);
 assert.equal(ultimate.steps[1].end,undefined);
 assert(ultimate.steps.every(step=>step.action==='finish'||step.instruction));
 const camber=po('camber-v60');
 assert.equal(camber.water.amount,345);
 assert.equal(camber.water.unit,'g');
 assert.equal(camber.coffee?.process,'anaerobic');
 assert.deepEqual(camber.duration,[180,195]);
 assert.deepEqual(filterRecipes(recipes,{q:'Camber',method:'pour-over'},r=>r.author).map(r=>r.id),['camber-v60']);
 const lamill=po('lamill-mugen');
 assert.equal(lamill.dose,16.5);
 assert.equal(lamill.water.amount,225);
 assert.equal(lamill.brewerId,'mugen');
 assert.deepEqual(lamill.steps.map(step=>step.action),['pour','finish']);
 assert.equal(lamill.preparation[0],'recipes.lamill.prepare');
 assert.deepEqual(filterRecipes(recipes,{q:'LAMILL'},r=>r.author).map(r=>r.id),['lamill-mugen']);
});
test('equipment and coffee filters match recorded source conditions together',()=>{
 const find=(filters:Parameters<typeof filterRecipes>[1])=>filterRecipes(recipes,filters,r=>r.author).map(r=>r.id);
 assert.deepEqual(find({brewer:'origami',grinder:'zp6-special',paper:'sibarist-conic',process:'natural'}),['rincon-origami']);
 assert.deepEqual(find({brewer:'origami',process:'washed',roast:'light'}),['kodama-origami','kobayashi-origami']);
 assert.deepEqual(find({grinder:'c40-mk3-redclix',paper:'cafec-origami'}),[]);
 assert.deepEqual(find({q:'Milton Monrroy'}),['rincon-origami']);
 assert.equal(recipes.find(r=>r.id==='rincon-origami')?.duration,null);
 assert.equal(recipes.find(r=>r.id==='kobayashi-origami')?.steps[2].temperature,75);
});
test('equipment catalogue is source-backed, searchable and keeps unresolved models explicit',()=>{
 assert.equal(equipment.length,69);
 assert.equal(filterEquipment(equipment,'','machine').length,3);
 assert.deepEqual(filterEquipment(equipment,'Synchronika','all').map(item=>item.id),['ecm-synchronika-ii']);
 assert.equal(equipment.find(item=>item.id==='rocket-r58-tune')?.details.find(detail=>detail.key==='power')?.value,'1600');
 assert.equal(equipment.find(item=>item.id==='ecm-classika-iii')?.details.find(detail=>detail.key==='group')?.value,'ECM-61 Core Heat');
 assert.deepEqual(filterEquipment(equipment,'ZP6','all').map(item=>item.id),['1zpresso-zp6-special']);
 assert.deepEqual(filterEquipment(equipment,'Sibarist','filter').map(item=>item.id),['sibarist-cone','sibarist-unspecified','sibarist-fast','sibarist-flat']);
 assert.equal(filterEquipment(equipment,'','dripper').length,24);
 assert.equal(filterEquipment(equipment,'','kettle').length,11);
 assert.equal(filterEquipment(equipment,'','filter').length,15);
 assert.equal(filterEquipment(equipment,'','grinder').length,16);
 assert.deepEqual(filterEquipment(equipment,'Buono','kettle').map(item=>item.id),['hario-v60-buono-1-2l','hario-v60-buono-electric','hario-v60-buono-copper-0-9l']);
 assert.deepEqual(filterEquipment(equipment,'Mugen','dripper').map(item=>item.id),['hario-v60-mugen-02']);
 assert.deepEqual(filterEquipment(equipment,'Chestnut','all').map(item=>item.id),['timemore-chestnut-c3s','timemore-chestnut-s3','timemore-chestnut-s5-pro']);
 assert.equal(equipment.find(item=>item.id==='mavo-wizard-z')?.details.find(detail=>detail.key==='burr')?.valueKey,'burr43Volcanic');
 assert.equal(equipment.find(item=>item.id==='timemore-chestnut-s5-pro')?.details.find(detail=>detail.key==='burr')?.valueKey,'burr48S5TwelveStar');
 assert.equal(equipment.find(item=>item.id==='mavo-wizard-z-pro')?.details.find(detail=>detail.key==='adjustment')?.valueKey,'adjust100Stepless');
 assert.equal(equipment.find(item=>item.id==='ek-unspecified')?.status,'unresolved');
 assert.equal(equipment.find(item=>item.id==='origami-air-s')?.details.find(detail=>detail.key==='weight')?.value,'64');
 assert.equal(equipment.find(item=>item.id==='kalita-wave-185-stainless')?.category,'dripper');
 assert.equal(equipment.find(item=>item.id==='fellow-ode-gen-2')?.category,'grinder');
 assert.equal(equipment.find(item=>item.id==='cafec-deep27-filter')?.category,'filter');
 assert.equal(equipment.find(item=>item.id==='fellow-stagg-ekg-pro')?.details.find(detail=>detail.key==='temperatureRange')?.value,'40–100');
 assert.equal(equipment.find(item=>item.id==='kalita-wave-kettle-1l')?.category,'kettle');
 assert.equal(equipment.find(item=>item.id==='hario-v60-mugen-02')?.recipeIds[0],'lamill-mugen');
 assert.equal(equipment.find(item=>item.id==='hario-v60-suiren-02')?.category,'dripper');
 assert.equal(equipment.find(item=>item.id==='fellow-stagg-stovetop-1l')?.category,'kettle');
 const buono=equipment.find(item=>item.id==='hario-v60-buono-1-2l')!;
 assert.equal(buono.details.find(detail=>detail.key==='mode')?.valueKey,'stovetopGooseneck12');
 assert.equal(buono.details.find(detail=>detail.key==='compatibility')?.valueKey,'stovetopUse');
 assert.equal(buono.details.find(detail=>detail.key==='madeIn')?.valueKey,'madeInJapan');
});
test('editorial overlay covers every recipe and equipment record',()=>{
 assert.deepEqual(Object.keys(recipeEditorial).sort(),recipes.map(recipe=>recipe.id).sort());
 assert.deepEqual(Object.keys(equipmentEditorial).sort(),equipment.map(item=>item.id).sort());
 for(const editorial of Object.values(recipeEditorial).concat(Object.values(equipmentEditorial))){
  assert(editorial.strengths.length>=1&&editorial.strengths.length<=3);
  assert(editorial.considerations.length>=1&&editorial.considerations.length<=3);
 }
 assert(recipeEditorial['kasuya-46'].sourceImage?.url.startsWith('https://'));
 assert.equal(equipmentEditorial['ek-unspecified'].sourceImage,undefined);
});
test('equipment experience stays specific and source-backed',()=>{
 assert(equipmentExperience['origami-air-s'].tags.includes('brightClarity'));
 assert(equipmentExperience['origami-s'].tags.includes('fullerBody'));
 assert(equipmentExperience['1zpresso-zp6-special'].tags.includes('flavorSeparation'));
 assert(equipmentExperience['1zpresso-zp6-special'].sources.every(source=>source.url.startsWith('https://')));
 assert.equal(equipmentExperience['timemore-sculptor-064'],undefined);
});

test('derived percentages stay hidden until the pours account for the published water',()=>{
 const find=(id:string)=>recipes.find(recipe=>recipe.id===id)!;
 assert.deepEqual(accountedAdditions(find('kasuya-46')),{amount:300,unit:'mL'});
 assert.equal(bloomShare(find('kasuya-46')),1/6);
 assert.equal(accountedAdditions(find('rao-pulsar')),null);
 assert.equal(bloomShare(find('rao-pulsar')),null);
 assert.equal(accountedAdditions(find('boen-switch')),null);
 assert.equal(bloomShare(find('boen-switch')),null);
 assert.equal(ratio(find('hoffmann-one-cup'),'en'),'1 : 16.67');
 assert.equal(ratio(find('kasuya-46'),'en'),'20 g : 300 mL');
});
test('pour phase refuses to guess when a later addition is untimed',()=>{
 const find=(id:string)=>recipes.find(recipe=>recipe.id===id)!;
 const oneCup=pourPhase(find('hoffmann-one-cup'))!;
 assert.equal(oneCup.kind,'end');assert.equal(oneCup.endsAt,120);assert.equal(oneCup.drawdown,60);
 const kasuya=pourPhase(find('kasuya-46'))!;
 assert.equal(kasuya.kind,'start');assert.equal(kasuya.endsAt,160);assert.equal(kasuya.drawdown,50);
 assert.equal(pourPhase(find('rao-pulsar')),null);
 assert.equal(pourPhase(find('rojewska-v60')),null);
});
test('source completeness counts only published facts',()=>{
 const find=(id:string)=>recipes.find(recipe=>recipe.id===id)!;
 const provided=(id:string)=>sourceFacts(find(id)).filter(fact=>fact.provided).length;
 assert.equal(provided('chronicler-switch'),3);
 assert.equal(provided('lamill-mugen'),3);
 assert.equal(provided('hoffmann-one-cup'),5);
});

test('added competition records keep unstated drippers and ranges honest',()=>{
 const find=(id:string)=>recipes.find(recipe=>recipe.id===id)!;
 const medina=find('medina-wbrc');
 assert.equal(medina.brewerId,'unspecified');
 assert.equal(medina.duration,null);
 assert.equal(medina.steps.filter(step=>step.amount!==null).reduce((sum,step)=>sum+(step.amount||0),0),250);
 assert(medina.steps.every(step=>step.derived||step.action==='finish'));
 const ohno=po('ohno-origami');
 assert.equal(ohno.water.amount,190);
 assert.equal(ohno.doseGround,32);
 assert.equal(ohno.yield,undefined);
 assert.equal(ohno.beverageTds,1.07);
 assert.deepEqual(ohno.duration,[90,95]);
 assert(ohno.steps.some(step=>step.action==='topup'&&step.amount===null));
 const vuolo=find('vuolo-mk');
 assert.equal(vuolo.temperature,null);
 assert.equal(vuolo.steps[0].temperature,96);
 assert.equal(vuolo.paper?.shape,'flat');
 const gil=find('gil-zp6-2025');
 assert.equal(gil.grinder?.setting,'6.7');
 assert.equal(find('gil-origami-2024').grinder?.setting,'7.5');
 assert.equal(pourPhase(medina)?.drawdown,null);
 assert.equal(recipes.filter(recipe=>recipe.authorId==='gil').length,2);
});

test('new gear is linked to the recipes that named it',()=>{
 const byId=(id:string)=>equipment.find(item=>item.id===id)!;
 assert.deepEqual(byId('graycano-dripper').recipeIds,['maisonnette-graycano','pinnola-graycano','kaygusuz-graycano']);
 assert.deepEqual(byId('1zpresso-k-ultra').recipeIds,['gil-origami-2024','maisonnette-graycano','torres-wbrc','pinnola-graycano','kaygusuz-graycano']);
 assert.deepEqual(byId('1zpresso-zp6-special').recipeIds,['selorio-origami','rincon-origami','medina-wbrc','gil-zp6-2025']);
 assert.deepEqual(byId('sibarist-flat').recipeIds,['vuolo-mk']);
 assert.equal(byId('1zpresso-k-pro').status,'legacy');
 assert.equal(byId('mk-dripper').status,'unresolved');
});

test('iced recipes count ice in the total liquid but never in the poured water',()=>{
 const hot=po('hoffmann-one-cup');
 const iced={...hot,kind:'iced' as const,ice:{amount:100,unit:'g' as const,placement:'server' as const}};
 assert.deepEqual(totalLiquid(iced),{amount:350,unit:'g',derived:true});
 assert.equal(ratio(iced,'en'),'1 : 23.33');
 assert.deepEqual(accountedAdditions(iced),{amount:250,unit:'g'});
 assert.deepEqual(totalLiquid(hot),{amount:250,unit:'g',derived:false});
 const mixed={...iced,water:{...iced.water,unit:'mL' as const}};
 assert.equal(totalLiquid(mixed),null);
 assert.equal(ratio(mixed,'en'),'15 g : 250 mL');
});

test('the iced record keeps ice out of the poured-water maths',()=>{
 const iced=pourOverRecipes.find(recipe=>recipe.kind==='iced')!;
 assert.equal(iced.id,'kurasu-flash-brew');
 assert.deepEqual(iced.ice,{amount:65,amountMax:70,approximate:true,unit:'g',placement:'server'});
 assert.deepEqual(totalLiquid(iced),{amount:215,unit:'g',derived:true});
 assert.deepEqual(accountedAdditions(iced),{amount:150,unit:'g'});
 assert.equal(iced.temperature,null);
 assert.equal(iced.brewerId,'unspecified');
 assert.deepEqual(pourPhase(iced),{endsAt:70,kind:'start',drawdown:30});
 assert.equal(ratio(iced,'en'),'1 : 14.33');
 assert.equal(recipes.filter(recipe=>recipe.kind==='iced').length,2);
 assert.equal(recipes.filter(recipe=>recipe.kind==='hot').length,36);
});

const shotRecord=espressoSchema.parse({...pourOverRecipes[0],id:'test-shot',copy:'kasuya',method:'espresso',
  water:undefined,duration:[27,27],temperature:93,
  yield:{amount:36,unit:'g',basis:'observed'},
  extraction:{pressureBar:9,preInfusion:{seconds:8},basket:{grams:18,style:'double'},puckPrep:['rinse','tamp']},
  steps:[{action:'grind',at:null,amount:null,cumulative:null},{action:'extract',at:0,end:27,amount:36,unit:'g',cumulative:null}]});

test('espresso ratios and pour maths read the beverage yield, never an invented water amount',()=>{
 assert.equal(ratio(shotRecord,'en'),'1 : 1.8');
 assert.equal(yieldText(shotRecord),'36 g');
 assert.equal(pressureText(shotRecord),'9 bar');
 assert.equal(preInfusionText(shotRecord),'8 s');
 assert.equal(basketText(shotRecord),'18 g');
 assert.equal(accountedAdditions(shotRecord),null);
 assert.equal(bloomShare(shotRecord),null);
 assert.equal(pourPhase(shotRecord),null);
 const withoutYield={...shotRecord,id:'test-shot-open',yield:undefined};
 assert.equal(ratio(withoutYield,'en'),'—');
 assert.throws(()=>pourOverSchema.parse({...shotRecord,method:'pour-over',water:undefined}));
});

test('espresso source facts count extraction values and keep the two methods apart',()=>{
 const facts=new Map(sourceFacts(shotRecord).map(fact=>[fact.key,fact.provided]));
 assert.equal(sourceFacts(shotRecord).length,9);
 assert.equal(facts.get('yield'),true);
 assert.equal(facts.get('pressure'),true);
 assert.equal(facts.get('preInfusion'),true);
 assert.equal(facts.get('basket'),true);
 const mixed:Recipe[]=[...recipes,shotRecord];
 assert.equal(filterRecipes(mixed,{method:'espresso'},r=>r.author).length,recipes.filter(r=>r.method==='espresso').length+1);
 assert.equal(filterRecipes(mixed,{method:'pour-over'},r=>r.author).length,recipes.filter(r=>r.method==='pour-over').length);
 assert.deepEqual(parseSelection('kasuya-46,test-shot',mixed).ids,['kasuya-46']);
 assert(parseSelection('kasuya-46,test-shot',mixed).mismatch);
 const toggle=toggleSelection(['kasuya-46'],'test-shot',mixed);
 assert(toggle.mismatch);
 assert.deepEqual(toggle.ids,['kasuya-46']);
 assert.deepEqual(toggleSelection(['test-shot'],'kasuya-46',mixed).ids,['test-shot','kasuya-46'].filter(id=>id==='test-shot'));
});

test('temperature conversion is display-only, marked and rounded once',()=>{
 assert.equal(convertTemperature(93.5,'C','F'),200.3);
 assert.equal(convertTemperature(202,'F','C'),94.4);
 assert.equal(convertTemperature(93.5,'C','C'),93.5);
 const source=formatTemperature(202,'F',null,204);
 assert.deepEqual(source,{text:'202–204°F',converted:false});
 const celsius=formatTemperature(202,'F','C',204);
 assert.deepEqual(celsius,{text:'≈ 94.4–95.6°C',converted:true});
 assert.equal(formatTemperature(93.5,'C','F').text,'≈ 200.3°F');
 assert.equal(formatTemperature(24,'C','F',24).text,'≈ 75.2°F');
});

test('video records carry provenance, timestamps and teaching without inventing values',()=>{
 const find=(id:string)=>recipes.find(recipe=>recipe.id===id)!;
 const rolf=find('rolf-v60-113');
 assert.equal(rolf.source.video,rolf.source.url);
 assert.equal(rolf.source.publishedBasis,'video');
 assert.equal(rolf.steps[0].videoAt,0);
 assert.equal(rolf.steps[4].videoAt,150);
 assert.equal(videoLink(rolf.source.video!,90),'https://www.youtube.com/watch?v=otk2jFRCcmE&t=90');
 assert.equal(rolf.teaching?.length,3);
 assert.equal(rolf.teaching?.[0].step,0);
 assert(rolf.source.evidence?.includes('13g - 200g'));
 const kasuya=find('kasuya-neo');
 assert.equal(kasuya.temperatureMax,96);
 assert.equal(kasuya.steps.length,10);
 assert.equal(kasuya.steps[1].instruction,'recipes.kasuya-neo.pour');
 assert.equal(kasuya.duration,null);
 assert.equal(kasuya.steps.filter(step=>step.videoAt!==undefined).length,1);
 assert.equal(kasuya.steps.reduce((sum,step)=>sum+(step.amount||0),0),300);
 const origami=find('rolf-origami-117');
 assert.deepEqual(origami.duration,[150,150]);
 assert.equal(origami.steps[1].end,80);
 assert(origami.source.evidence?.includes('roast degree'));
});
