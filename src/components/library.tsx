'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowRight,ArrowUpRight,ArrowLeft,MagnifyingGlass,Plus,X,Globe,CaretDown,Check,CoffeeBean,Drop,Thermometer,Clock,ShareNetwork,List as MenuIcon,Funnel} from '@phosphor-icons/react';
import {createContext,useContext,useEffect,useState,useCallback,useRef,type ReactNode,type KeyboardEvent} from 'react';
import {BASE,recipes,parseSelection,toggleSelection,filterRecipes,methodFilterKeys,methodFilterParam,recipeIndex,time,duration,ratio,doseText,waterText,videoLink,accountedAdditions,bloomShare,pourPhase,sourceFacts,iceAmountText,isEspresso,isPourOver,pourOverRecipes,espressoRecipes,yieldText,pressureText,preInfusionText,basketText,puckPrepKeys,temperatureLabel,type Recipe,type FilterKey,type RecipeFilters,type Method} from '@/lib/recipes';
import {formatTemperature,temperatureUnits,type TemperatureUnit} from '@/lib/temperature';
import {recipeEditorial} from '@/lib/editorial';
import {recipeFaq} from '@/lib/faq';
import {OfficialSourceImage} from '@/components/source-image';
import {locales,localeNames,type Locale} from '@/i18n/locales';

type UrlContextType={params:URLSearchParams;setParams:(changes:Record<string,string|null>)=>void;ids:string[];toggle:(id:string)=>void;notice:string};
const UrlContext=createContext<UrlContextType|null>(null);
type TemperatureContextType={unit:TemperatureUnit|null;setUnit:(unit:TemperatureUnit|null)=>void};
const TemperatureContext=createContext<TemperatureContextType|null>(null);
function useTemperature(){const value=useContext(TemperatureContext);if(!value)throw new Error('Missing temperature provider');return value;}
function useLibrary(){const v=useContext(UrlContext);if(!v)throw new Error('Missing library provider');return v;}
export function LibraryProvider({children}:{children:ReactNode}){
  const t=useTranslations();
  const [params,setState]=useState(()=>new URLSearchParams());
  const [notice,setNotice]=useState('');
  const [unit,setUnitState]=useState<TemperatureUnit|null>(null);
  useEffect(()=>{const stored=window.localStorage.getItem('brew-temperature-unit');if(stored==='C'||stored==='F')setUnitState(stored);},[]);
  const setUnit=useCallback((next:TemperatureUnit|null)=>{setUnitState(next);try{next?window.localStorage.setItem('brew-temperature-unit',next):window.localStorage.removeItem('brew-temperature-unit');}catch{/* storage can be unavailable; the toggle still works for this page */}} ,[]);
  useEffect(()=>{
    const read=()=>setState(new URLSearchParams(window.location.search));
    read();window.addEventListener('popstate',read);
    return()=>window.removeEventListener('popstate',read);
  },[]);
  const setParams=useCallback((changes:Record<string,string|null>)=>{
    const next=new URLSearchParams(params);
    for(const [key,value] of Object.entries(changes)) {if(value)next.set(key,value);else next.delete(key);}
    const query=next.toString();
    window.history.replaceState(null,'',`${window.location.pathname}${query?`?${query}`:''}${window.location.hash}`);
    setState(next);
  },[params]);
  const ids=parseSelection(params.get('ids')).ids;
  const toggle=(id:string)=>{
    const result=toggleSelection(ids,id);
    if(result.limit){setNotice(t('limit'));return;}
    if(result.mismatch){setNotice(t('compareMismatch'));return;}
    setNotice('');setParams({ids:result.ids.join(',')});
  };
  return <UrlContext.Provider value={{params,setParams,ids,toggle,notice}}><TemperatureContext.Provider value={{unit,setUnit}}>{children}<div className="sr-only" role="status" aria-live="polite">{notice}</div></TemperatureContext.Provider></UrlContext.Provider>;
}
function useHref(){const locale=useLocale();const {params}=useLibrary();return (suffix='',extra?:Record<string,string>)=>{
  const query=new URLSearchParams(params);if(extra)for(const [k,v]of Object.entries(extra))query.set(k,v);
  return `/${locale}/${suffix}${query.size?`?${query}`:''}`;
};}
function TemperatureSwitcher(){
  const t=useTranslations();const {unit,setUnit}=useTemperature();
  return <div className="temperature-control" role="group" aria-label={t('temperatureUnitLabel')}>
    {temperatureUnits.map(value=><button key={value} type="button" className={unit===value?'is-active':''} aria-pressed={unit===value} aria-label={t(value==='C'?'showCelsius':'showFahrenheit')} title={t(value==='C'?'showCelsius':'showFahrenheit')} onClick={()=>setUnit(unit===value?null:value)}>°{value}</button>)}
    <span className="sr-only">{unit?t('showCelsius'):t('followSourceUnit')}</span>
  </div>;
}
function LanguageSwitcher(){
  const t=useTranslations();const locale=useLocale() as Locale;const {params}=useLibrary();
  const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
  const pathname=usePathname();const rest=pathname.replace(/^\/[^/]+/,'');
  useEffect(()=>{
    if(!open)return;
    const dismiss=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    document.addEventListener('pointerdown',dismiss);
    return()=>document.removeEventListener('pointerdown',dismiss);
  },[open]);
  return <div className="language-control" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}}}>
    <button ref={trigger} className="language-trigger" aria-label={t('language')} aria-expanded={open} aria-controls="language-options" onClick={()=>setOpen(!open)}><Globe size={16} weight="light"/><span>{localeNames[locale]}</span><CaretDown size={11} className={open?'is-open':''}/></button>
    {open?<nav id="language-options" className="language-options" aria-label={t('language')}>{locales.map(l=><Link key={l} href={`/${l}${rest}${params.size?`?${params}`:''}`} hrefLang={l} lang={l} aria-current={l===locale?'true':undefined} onClick={()=>setOpen(false)}><span>{localeNames[l]}</span>{l===locale?<Check size={14}/>:null}</Link>)}</nav>:null}
  </div>;
}
export function Header(){
  const t=useTranslations();const locale=useLocale() as Locale;const href=useHref();const [open,setOpen]=useState(false);const pathname=usePathname();
  return <><a className="skip-link" href="#main">{t('skip')}</a><header className="site-header">
    <Link className="wordmark" href={`/${locale}/`}>{t('brand')}<span>{t('tagline')}</span></Link>
    <nav className={open?'main-nav open':'main-nav'} aria-label={t('menu')}>
      {[['recipesNav',''],['equipmentNav','equipment/'],['authorsNav','authors/'],['compareNav','compare/'],['sourcesNav','sources/']].map(([label,path])=>{const current=path?pathname.includes(`/${path.replace(/\/$/,'')}`):!['/equipment','/authors','/compare','/sources'].some(s=>pathname.includes(s));return <Link key={label} href={href(path)} aria-current={current?'page':undefined} onClick={()=>setOpen(false)}>{t(label)}</Link>;})}
    </nav>
    <TemperatureSwitcher/>
    <LanguageSwitcher/>
    <button className="icon-button mobile-menu" aria-label={open?t('close'):t('menu')} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<MenuIcon size={22}/>}</button>
  </header></>;
}
export function Footer(){const t=useTranslations();const href=useHref();return <footer className="site-footer"><div><strong>{t('brand')}</strong></div><div className="footer-links"><nav className="footer-info" aria-label={t('siteInfo.nav')}><Link href={href('about/')}>{t('siteInfo.aboutNav')}</Link><Link href={href('terms/')}>{t('siteInfo.termsNav')}</Link><Link href={href('privacy/')}>{t('siteInfo.privacyNav')}</Link><Link href={href('sources/')}>{t('sourcesNav')}</Link></nav><a href="https://github.com/imycc/brew-library" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14}/></a></div></footer>;}
function temperature(r:Recipe,t:ReturnType<typeof useTranslations>,unit:TemperatureUnit|null=null){return r.temperature?temperatureLabel(r,unit):t(r.temperatureMode==='boiling'?'boiling':'unknown');}
function coffeeDetails(r:Recipe,t:ReturnType<typeof useTranslations>){
  const parts=[r.coffee?.name,r.coffee?.origin,r.coffee?.variety,r.coffee?.process?t(`processes.${r.coffee.process}`):null,r.coffee?.roast?t(`roasts.${r.coffee.roast}`):null].filter(Boolean).join(' · ');
  if(parts&&r.coffee?.asRecommendation)return t('recommendedCoffee',{value:parts});
  return parts||t(r.beanNote||(r.beanConditions==='light'?'light':'unknown'));
}
function grinderDetails(r:Recipe,t:ReturnType<typeof useTranslations>){return r.grinder?`${r.grinder.name} · ${r.grinder.setting||t('unknown')}${r.grinder.secondSetting?` · ${r.grinder.secondSetting}`:''}`:t('unknown');}
function paperDetails(r:Recipe,t:ReturnType<typeof useTranslations>){return r.paper?.name||(r.filterNote?t(r.filterNote):r.filterConditions==='pulsar'?'NextLevel Pulsar':t('unknown'));}
type Step=Recipe['steps'][number];
function stepFacets(s:Step,t:ReturnType<typeof useTranslations>){
  return [s.pattern?t(`pourPatterns.${s.pattern}`):null,s.style?t(`pourStyles.${s.style}`):null,
   s.count!==undefined?`×${s.count}${s.direction?` ${t(`pourDirections.${s.direction}`)}`:''}`:null,
   s.levelMin!==undefined?`${s.levelMin}${s.levelMax!==undefined&&s.levelMax!==s.levelMin?`–${s.levelMax}`:''} cm`:null
  ].filter((x):x is string=>!!x);
}
function stepUnit(r:Recipe,s:Step):string{return s.unit||(isPourOver(r)?r.water.unit:r.yield?.unit||'');}
function waterDetails(r:Recipe,t:ReturnType<typeof useTranslations>){
  const water=r.water;
  const parts=[water?.tds?`TDS ${water.tds} ppm`:null,water?.ppm?`${water.ppm} ppm`:null,
   water?.hardness?`${t('hardness')} ${water.hardness} ${water.hardnessUnit||'ppm'}`:null,water?.alkalinity?`${t('alkalinity')} ${water.alkalinity} ${water.alkalinityUnit||'ppm'}`:null].filter(Boolean);
  const stated=r.waterConditions==='unknown'&&!r.waterNote?t('unknown'):t(r.waterNote||(r.waterConditions==='soft'?'soft':'raoWater'));
  return [stated,...parts].join(' · ');
}
function bedPrepText(r:Recipe,t:ReturnType<typeof useTranslations>){
  return isEspresso(r)?puckPrepKeys(r).map(key=>t(`puckPrepLabels.${key}`)):(isPourOver(r)?r.bedPrep||[]:[]).map(key=>t(`bedPrepLabels.${key}`));
}
function iceAmount(r:Recipe){return iceAmountText(r);}
function iceText(r:Recipe,t:ReturnType<typeof useTranslations>){return r.ice?`${iceAmount(r)} · ${t(`icePlacements.${r.ice.placement}`)}`:t('unknown');}
function Parameters({recipe:r,compact=false}:{recipe:Recipe;compact?:boolean}){
  const t=useTranslations();const {unit}=useTemperature();
  const values=isEspresso(r)
    ? [{key:'dose',value:`${doseText(r)} g`,Icon:CoffeeBean},{key:'yield',value:yieldText(r)||t('unknown'),Icon:Drop},{key:'temperature',value:temperature(r,t,unit),Icon:Thermometer},{key:'shotTime',value:r.duration?duration(r):t('unknown'),Icon:Clock}]
    : [{key:'dose',value:`${doseText(r)} g`,Icon:CoffeeBean},{key:'water',value:`${waterText(r)} ${r.water.unit}`,Icon:Drop},...r.ice?[{key:'ice',value:iceAmount(r),Icon:Drop}]:[],{key:'temperature',value:temperature(r,t,unit),Icon:Thermometer},{key:'brewTime',value:r.duration?duration(r):t('unknown'),Icon:Clock}];
  return <dl className={compact?'parameters compact':'parameters'}>{values.map(({key,value,Icon})=><div key={key}><dt>{compact?<><Icon size={16} aria-hidden="true"/><span className="sr-only">{t(key)}</span></>:t(key)}</dt><dd title={value} data-long={value.length>10||undefined}>{value}</dd></div>)}</dl>;
}
export function CompareButton({recipe:r,compact=false}:{recipe:Recipe;compact?:boolean}){const {ids,toggle}=useLibrary();const t=useTranslations();const selected=ids.includes(r.id);return <button className={compact?`compare-compact${selected?' is-selected':''}`:`button button-secondary${selected?' is-selected':''}`} onClick={()=>toggle(r.id)} aria-pressed={selected} aria-label={`${selected?t('remove'):t('add')} · ${t(`recipes.${r.copy}.title`)}`}>{compact?<>{selected?<Check size={15}/>:<Plus size={15}/>}<span>{t('compareNav')}</span></>:<>{selected?<Check size={16}/>:null}{selected?t('remove'):t('add')}{selected?null:<Plus size={15}/>}</>}</button>;}
function brewerName(r:Recipe,t:ReturnType<typeof useTranslations>){return r.brewerId==='unspecified'?t(isEspresso(r)?'machineUnspecified':'brewerUnspecified'):r.brewer.split(' · ')[0];}
function recipeTitle(r:Recipe,t:ReturnType<typeof useTranslations>){const title=t(`recipes.${r.copy}.title`);return title.startsWith(`${r.author} · `)?title.slice(r.author.length+3):title;}
function RecipeTop({r,index}:{r:Recipe;index:number}){const t=useTranslations();return <div className="recipe-card-top"><span className="recipe-index">{String(index+1).padStart(2,'0')}</span><span title={brewerName(r,t)}>{brewerName(r,t)}</span><span title={r.author}>{r.author}</span></div>;}
function RecipeCard({recipe:r,index=0}:{recipe:Recipe;index?:number}){
  const t=useTranslations();const href=useHref();
  return <article className="recipe-card" data-recipe={r.id}>
    <RecipeTop r={r} index={index}/>
    <div className="card-copy"><h3><Link href={href(`recipes/${r.id}/`)}>{recipeTitle(r,t)}</Link></h3><p className="card-summary">{t(`recipes.${r.copy}.summary`)}</p>
      <Parameters recipe={r} compact/>
      <div className="card-actions"><Link className="card-link" aria-label={`${t('view')} · ${t(`recipes.${r.copy}.title`)}`} href={href(`recipes/${r.id}/`)}>{t('view')}<ArrowRight size={15}/></Link><CompareButton recipe={r} compact/></div>
    </div>
  </article>;
}
function RecipeLead({recipe:r,index=0}:{recipe:Recipe;index?:number}){
  const t=useTranslations();const href=useHref();
  return <article className="recipe-card featured" data-recipe={r.id}>
    <RecipeTop r={r} index={index}/>
    <div className="card-copy"><div className="lead-main"><h3><Link href={href(`recipes/${r.id}/`)}>{recipeTitle(r,t)}</Link></h3><p className="card-summary">{t(`recipes.${r.copy}.summary`)}</p>
      <div className="card-actions"><Link className="button button-primary" aria-label={`${t('view')} · ${t(`recipes.${r.copy}.title`)}`} href={href(`recipes/${r.id}/`)}>{t('view')}<ArrowRight size={16}/></Link><CompareButton recipe={r} compact/></div></div>
      <div className="lead-record"><Parameters recipe={r}/><a className="small-source" href={r.source.url} target="_blank" rel="noreferrer">{t('source')} · {r.source.label} <ArrowUpRight size={13}/></a></div>
    </div>
  </article>;
}
type FilterOption=readonly [string,string];
function uniqueOptions(entries:Iterable<readonly [string,string]>):FilterOption[]{return [...new Map(entries).entries()];}
function methodFilterOptions(list:Recipe[],t:ReturnType<typeof useTranslations>){
  return {
    brewer:uniqueOptions(list.map(r=>[r.brewerId,brewerName(r,t)] as const)),
    author:uniqueOptions(list.map(r=>[r.authorId,r.author] as const)),
    kind:uniqueOptions(list.map(r=>[r.kind,t(r.kind)] as const)),
    dose:[...new Set(list.map(r=>r.dose))].sort((a,b)=>a-b).map(n=>[String(n),`${n} g`] as const)
  };
}
function conditionFilterOptions(list:Recipe[],t:ReturnType<typeof useTranslations>){
  return {
    grinder:uniqueOptions(list.flatMap(r=>r.grinder?[[r.grinder.id,r.grinder.name] as const]:[])),
    paper:uniqueOptions(list.flatMap(r=>r.paper?[[r.paper.id,r.paper.name] as const]:[])),
    process:uniqueOptions(list.flatMap(r=>r.coffee?.process?[[r.coffee.process,t(`processes.${r.coffee.process}`)] as const]:[])),
    roast:uniqueOptions(list.flatMap(r=>r.coffee?.roast?[[r.coffee.roast,t(`roasts.${r.coffee.roast}`)] as const]:[]))
  };
}
const methodTabs:Method[]=['pour-over','espresso'];
const methodLabelKeys={ 'pour-over':'methodPourover', espresso:'methodEspresso' } as const;
// A filter with a single possible value cannot narrow anything; it only appears once
// the method's own records offer a real choice.
const hasChoice=(options:FilterOption[])=>options.length>1;
export function Home(){
  const t=useTranslations();const {params,setParams}=useLibrary();
  const method:Method=params.get('method')==='espresso'?'espresso':'pour-over';
  const list=method==='espresso'?espressoRecipes:pourOverRecipes;
  const filters=Object.fromEntries(methodFilterKeys[method].map(key=>[key,params.get(methodFilterParam(method,key))||''])) as RecipeFilters;
  const setFilter=(key:FilterKey,value:string)=>setParams({[methodFilterParam(method,key)]:value||null});
  const selectMethod=(next:Method)=>{if(next!==method)setParams({method:next==='espresso'?'espresso':null});};
  const reset=()=>setParams(Object.fromEntries(methodFilterKeys[method].map(key=>[methodFilterParam(method,key),null])));
  const tabKeyDown=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    const last=methodTabs.length-1;let next:number|null=null;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=index===last?0:index+1;
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=index===0?last:index-1;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=last;
    if(next===null)return;
    event.preventDefault();selectMethod(methodTabs[next]);
    document.getElementById(`method-tab-${methodTabs[next]}`)?.focus();
  };
  const options=methodFilterOptions(list,t);
  const conditionOptions=conditionFilterOptions(list,t);
  const conditionKeys=(['grinder','paper','process','roast'] as const).filter(key=>methodFilterKeys[method].includes(key));
  const conditionFilters=conditionKeys.map(key=>({key,label:t(key),options:conditionOptions[key]})).filter(filter=>hasChoice(filter.options));
  const mainFilters=[
    {key:'author' as const,label:t('author'),options:options.author},
    {key:'kind' as const,label:t('kind'),options:options.kind},
    {key:'dose' as const,label:t('dose'),options:options.dose}
  ].filter(filter=>hasChoice(filter.options));
  const filtered=filterRecipes(list,filters,r=>`${t(`recipes.${r.copy}.title`)} ${t(`recipes.${r.copy}.summary`)}`);
  const active=methodFilterKeys[method].some(key=>!!filters[key]);
  return <main id="main">
    <section className="hero"><div className="hero-art"/><div className="hero-content"><p className="hero-kicker">COFFEE EDITORIAL <span/></p><h1><span>{t('hero1')}</span><span>{t('hero2')}</span></h1><p className="hero-subtitle">{t('heroSubtitle')}</p></div>
    </section>
    <section className="recipe-section" id="recipes"><div className="section-heading"><h2>{t('sectionTitle')}</h2><span className="heading-rule"/><p>{t('sectionIntro')}</p></div>
      <div className="method-tabs" role="tablist" aria-label={t('method')}>{methodTabs.map((tab,index)=>{const count=tab==='espresso'?espressoRecipes.length:pourOverRecipes.length;return <button key={tab} id={`method-tab-${tab}`} type="button" role="tab" aria-selected={tab===method} aria-controls="recipe-panel" tabIndex={tab===method?0:-1} onClick={()=>selectMethod(tab)} onKeyDown={event=>tabKeyDown(event,index)}><span>{t(methodLabelKeys[tab])}</span><span className="tab-count" aria-hidden="true">{count}</span><span className="sr-only">{t('results',{count})}</span></button>;})}</div>
      <div id="recipe-panel" role="tabpanel" aria-labelledby={`method-tab-${method}`} tabIndex={0}>
        <div className="library-toolbar"><label className="search-field"><MagnifyingGlass size={24}/><span className="sr-only">{t('search')}</span><input type="search" placeholder={t('search')} value={filters.q||''} onChange={e=>setFilter('q',e.target.value)}/></label>
          {hasChoice(options.brewer)?<label className="brewer-select"><Funnel size={20}/><span className="sr-only">{t('chooseBrewer')}</span><select aria-label={t('chooseBrewer')} value={filters.brewer||''} onChange={e=>setFilter('brewer',e.target.value)}><option value="">{t('chooseBrewer')}</option>{options.brewer.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>:null}
        </div>
        <div className="filter-row"><span className="result-count" aria-live="polite">{t('results',{count:filtered.length})}</span>
          <div className="secondary-filters">
            {mainFilters.map(({key,label,options})=><label key={key}><span>{label}</span><select aria-label={label} value={filters[key]||''} onChange={e=>setFilter(key,e.target.value)}><option value="">{t('all')}</option>{options.map(([value,optionLabel])=><option key={value} value={value}>{optionLabel}</option>)}</select></label>)}
            {active?<button className="text-button" onClick={reset}>{t('reset')}</button>:null}
          </div></div>
        {conditionFilters.length?<details className="condition-filters" open={conditionFilters.some(filter=>!!filters[filter.key])}><summary>{t('conditionFilters')}</summary><p>{t('conditionHint')}</p><div className="secondary-filters">
          {conditionFilters.map(({key,label,options})=><label key={key}><span>{label}</span><select aria-label={label} value={filters[key]||''} onChange={e=>setFilter(key,e.target.value)}><option value="">{t('all')}</option>{options.map(([value,optionLabel])=><option key={value} value={value}>{optionLabel}</option>)}</select></label>)}
        </div></details>:null}
        {filtered.length?<div className="recipe-grid">{filtered.map((r,i)=>i===0?<RecipeLead key={r.id} recipe={r} index={recipeIndex(r)}/>:<RecipeCard key={r.id} recipe={r} index={recipeIndex(r)}/>)}</div>:<div className="empty-state"><CoffeeBean size={34}/><p>{t('noResults')}</p><button className="button button-outline" onClick={reset}>{t('reset')}</button></div>}
      </div>
    </section>
  </main>;
}
export function ComparisonTray(){const t=useTranslations();const {ids,toggle,notice}=useLibrary();const href=useHref();const pathname=usePathname();if(!ids.length||pathname.includes('/compare')||pathname.includes('/recipes/'))return null;
 return <aside className="compare-tray" aria-label={t('compareNav')}><strong>{t('selected',{count:ids.length})}</strong><div className="tray-items">{ids.map(id=>{const r=recipes.find(r=>r.id===id)!;return <div className="tray-item" key={id}><span className="tray-index">{String(recipeIndex(r)+1).padStart(2,'0')}</span><span>{t(`recipes.${r.copy}.title`)}</span><button className="icon-button" aria-label={`${t('remove')} · ${t(`recipes.${r.copy}.title`)}`} onClick={()=>toggle(id)}><X size={16}/></button></div>;})}</div><Link className="button button-primary" href={href('compare/')}>{t('compareAction')}<ArrowRight size={17}/></Link>{notice?<p role="alert">{notice}</p>:null}</aside>;
}
function quickAnswer(r:Recipe,t:ReturnType<typeof useTranslations>,unit:TemperatureUnit|null=null){
  if(isEspresso(r))return t('quickAnswerEspresso',{dose:r.dose,yield:yieldText(r)||t('unknown'),temperature:temperature(r,t,unit),grind:t(`recipes.${r.copy}.grind`),time:r.duration?duration(r):t('unknown'),pressure:pressureText(r)||t('unknown')});
  return t(r.ice?'quickAnswerIced':'quickAnswer',{dose:doseText(r),water:waterText(r),unit:r.water.unit,ice:r.ice?.amount||0,temperature:temperature(r,t,unit),grind:t(`recipes.${r.copy}.grind`),time:r.duration?duration(r):t('unknown')});
}
export function RecipeDetail({id}:{id:string}){
 const t=useTranslations();const locale=useLocale();const {unit}=useTemperature();const href=useHref();const r=recipes.find(r=>r.id===id)!;
 const editorial=recipeEditorial[r.id];
 const faq=recipeFaq(r,t,(value,source,max)=>formatTemperature(value,source,unit,max).text);
 const related=recipes.filter(item=>item.id!==r.id&&item.method===r.method&&(item.brewerId===r.brewerId||item.authorId===r.authorId)).slice(0,3);
 const pours=r.steps.filter(s=>['pour','bloom','pulses'].includes(s.action));
 const timeline=isEspresso(r)?r.steps.filter(s=>s.at!==null):pours;
 const postPreInfusion=isEspresso(r)&&r.duration&&r.extraction?.preInfusion?.seconds!=null?r.duration[0]-r.extraction.preInfusion.seconds:null;
 const percent=new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1});
 const additionTotal=accountedAdditions(r);
 const phase=pourPhase(r);
 const missing=sourceFacts(r).filter(fact=>!fact.provided);
 const provided=sourceFacts(r).length-missing.length;
 return <main id="main" className="page detail-page"><Link className="back-link" href={href()}><ArrowLeft size={16}/>{t('back')}</Link>
   <section className="detail-intro"><div><p className="eyebrow">{r.author} · {t(r.context)} · {t(isEspresso(r)?'methodEspresso':'methodPourover')}</p><h1>{t(`recipes.${r.copy}.title`)}</h1><p className="detail-version">{t(`recipes.${r.copy}.version`)}</p><p className="detail-summary">{t(`recipes.${r.copy}.summary`)}</p><p className="quick-answer">{quickAnswer(r,t,unit)}</p><OfficialSourceImage image={editorial.sourceImage} name={t(`recipes.${r.copy}.title`)} kind="recipe" className="recipe-detail-image"/><Parameters recipe={r}/><div className="detail-grind"><span>{t('grind')}</span><strong>{t(`recipes.${r.copy}.grind`)}</strong>{r.grindHedged?<em className="grind-hedged">{t('grindHedged')}</em>:null}</div><div className="detail-actions"><CompareButton recipe={r}/><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{t('source')}<ArrowUpRight size={17}/></a></div></div><div className="detail-spec-card"><div><span>{t('equipment')}</span><strong>{r.brewerId==='unspecified'?t(isEspresso(r)?'machineUnspecified':'brewerUnspecified'):r.brewer}</strong></div><div><span>{t('grinder')}</span><strong>{grinderDetails(r,t)}</strong></div><div><span>{t('beans')}</span><strong>{coffeeDetails(r,t)}</strong></div><div><span>{t(isEspresso(r)?'basket':'filterPaper')}</span><strong>{isEspresso(r)?basketText(r)||t('unknown'):paperDetails(r,t)}</strong></div></div></section>
   <section className="recipe-editorial" data-recipe-editorial>
     <div className="recipe-editorial-intro"><p className="eyebrow">EDITORIAL NOTES</p><h2>{t('recipeOverview')}</h2><p>{t(`recipes.${r.copy}.overview`)}</p><div className="best-for"><span>{t('bestFor')}</span><strong>{t(`recipes.${r.copy}.bestFor`)}</strong></div></div>
     <div className="editorial-tradeoffs"><div><h3><span aria-hidden="true">＋</span>{t('strengths')}</h3><ul>{editorial.strengths.map(key=><li key={key}>{t(`editorialStrengths.${key}`)}</li>)}</ul></div><div><h3><span aria-hidden="true">−</span>{t('considerations')}</h3><ul>{editorial.considerations.map(key=><li key={key}>{t(`editorialConsiderations.${key}`)}</li>)}</ul></div></div>
   </section>
   <section className="derived-panel" data-derived-panel>
     <div className="derived-head"><h2>{t('derivedTitle')}</h2><p>{t('derivedNote')}</p></div>
     <dl className={isEspresso(r)&&postPreInfusion===null?'derived-grid single':'derived-grid'}>
       <div><dt>{t(isEspresso(r)?'ratioEspresso':'ratio')}</dt><dd>{ratio(r,locale)}</dd></div>
       {isEspresso(r)?(postPreInfusion!==null&&postPreInfusion>=0?<div><dt>{t('afterPreInfusion')}</dt><dd>{time(postPreInfusion)}</dd></div>:null):<>
       <div><dt>{t('bloomShare')}</dt><dd>{bloomShare(r)===null?t('unknown'):percent.format(bloomShare(r)!)}</dd></div>
       <div><dt>{t(phase&&phase.kind==='start'?'lastPourStarts':'pourEnds')}</dt><dd>{phase?time(phase.endsAt):t('unknown')}</dd></div>
       <div><dt>{t(phase&&phase.kind==='start'?'afterLastPourStart':'drawdown')}</dt><dd>{phase&&phase.drawdown!==null?time(phase.drawdown):t('unknown')}</dd></div>
       </>}
     </dl>
     <div className="derived-facts">
       <p className="facts-score"><span>{t('sourceFacts')}</span><strong>{provided} / {sourceFacts(r).length}</strong></p>
       {missing.length?<p className="facts-missing">{t('missingFacts')} {missing.map(fact=>t(fact.label)).join(' · ')}.</p>:<p className="facts-missing">{t('missingNone')}</p>}
       {unit&&r.temperature!==null&&unit!==r.temperatureUnit?<p className="facts-missing" data-converted-temp>{t('convertedNote',{value:temperatureLabel(r)})}</p>:null}
     </div>
   </section>
   {r.teaching?.length?<section className="teaching" data-teaching><h2>{t('teachingTitle')}</h2><ul>{r.teaching.map((item,i)=><li key={i}>{item.step!==undefined?<a className="teaching-step" href={`#step-${item.step+1}`}>{t('teachingStep',{number:item.step+1})}</a>:null}<span>{t(item.key)}</span></li>)}</ul></section>:null}
   <div className="detail-body"><div>
     {r.preparation.length||bedPrepText(r,t).length||r.doseGround?<section className="preparation"><h2>{t('preparation')}</h2>{r.preparation.map(key=><p key={key}>{t(key)}</p>)}{bedPrepText(r,t).length?<ul className="bed-prep">{bedPrepText(r,t).map(chip=><li key={chip}>{chip}</li>)}</ul>:null}{r.doseGround?<p className="muted">{t('groundMoreThanDosed',{ground:r.doseGround,dose:r.dose})}</p>:null}</section>:null}
     {timeline.length?<section className="timeline-section" data-testid="pour-timeline"><div className="section-heading small"><h2>{t('timeline')}</h2><span className="heading-rule"/><p>{t(isEspresso(r)?'shotTimeline':'stepAmount')}</p></div><ol className="pour-timeline">{timeline.map((s,i)=><li key={i}><span className="timeline-dot">{i+1}</span><strong>{s.at===null?t('sequence'):time(s.at)}</strong><span>{s.amount===null?'—':`${s.amount} ${stepUnit(r,s)}`}{s.amount!==null&&additionTotal?<em className="timeline-share"> {percent.format(s.amount/additionTotal.amount)}</em>:null}</span></li>)}</ol>{r.copy==='rao'?<p className="muted">{t(`recipes.${r.copy}.notes`)}</p>:null}</section>:null}
     <section className="steps-section"><h2>{t('steps')}</h2>{r.steps.length?<ol className="step-list">{r.steps.map((s,i)=><li key={i} id={`step-${i+1}`}><span className="step-number">{String(i+1).padStart(2,'0')}</span><div><div className="step-title"><h3>{t(`step.${s.action}`)}</h3><span className="step-time">{s.at===null?t('sequence'):time(s.at)}{s.end?`–${time(s.end)}`:''}{r.source.video&&s.videoAt!==undefined?<a className="step-video" href={videoLink(r.source.video,s.videoAt)} target="_blank" rel="noreferrer">{t('videoStep',{time:time(s.videoAt)})}</a>:null}</span></div><div className="step-meta">{s.temperature?<span>{t('temperature')} {formatTemperature(s.temperature,r.temperatureUnit,unit).text}</span>:null}{s.pressure!==undefined?<span>{t('pressure')} {s.pressure} bar</span>:null}{s.amount!==null?<span>+{s.amount} {stepUnit(r,s)}{s.derived?'*':null}</span>:null}{s.cumulative!==null?<span>{t('cumulative')} {s.cumulative} {stepUnit(r,s)}</span>:null}{stepFacets(s,t).map(facet=><span className="step-facet" key={facet}>{facet}</span>)}</div><p>{s.action==='finish'?t(`recipes.${r.copy}.finish`):t(s.instruction||`instruction.${s.action}`)}</p></div></li>)}</ol>:<p className="muted" data-no-steps>{t('noStepsPublished')}</p>}{r.steps.some(s=>s.derived)?<p className="muted">* {t('stepDerived')}</p>:null}</section>
     <section className="recipe-notes"><h2>{t('notes')}</h2><p>{t(`recipes.${r.copy}.notes`)}</p>{isPourOver(r)&&r.water.derived?<p>{t('derived')} {r.dose} × {new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(r.water.amount/r.dose)} = {r.water.amount} {r.water.unit}.</p>:null}</section>
     <section className="recipe-faq"><h2>{t('faqTitle')}</h2>{faq.map(item=><article key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</section>
     {related.length?<section className="related-recipes"><h2>{t('relatedRecipes')}</h2><ul>{related.map(item=><li key={item.id}><Link href={href(`recipes/${item.id}/`)}><strong>{t(`recipes.${item.copy}.title`)}</strong><span>{item.author} · {brewerName(item,t)}</span><ArrowRight size={15}/></Link></li>)}</ul></section>:null}
   </div><aside className="detail-sidebar"><h2>{t('equipment')}</h2><p>{t(`recipes.${r.copy}.equipment`)}</p><h2>{t('conditions')}</h2><dl className="facts"><div><dt>{t('grinder')}</dt><dd>{grinderDetails(r,t)}</dd></div><div><dt>{t('beans')}</dt><dd>{coffeeDetails(r,t)}</dd></div><div><dt>{t('waterQuality')}</dt><dd>{waterDetails(r,t)}</dd></div><div><dt>{t(isEspresso(r)?'basket':'filterPaper')}</dt><dd>{isEspresso(r)?basketText(r)||t('unknown'):paperDetails(r,t)}</dd></div>
    {r.yield?<div><dt>{t('yieldLabel')}</dt><dd>{r.yield.amount} {r.yield.unit} · {t(`yieldBases.${r.yield.basis}`)}</dd></div>:null}
    {r.removalAt!==undefined?<div><dt>{t('removalAt')}</dt><dd>{time(r.removalAt)}</dd></div>:null}
    {r.ratioStated?<div><dt>{t('ratioStated')}</dt><dd>{r.ratioStated}</dd></div>:null}
    {isPourOver(r)&&r.valve?<div><dt>{t('valveInitial')}</dt><dd>{t(`valveStates.${r.valve}`)}</dd></div>:null}
    {r.grindMicron?<div><dt>{t('micron')}</dt><dd>≈ {r.grindMicron.value} µm {t(`grindMicronBases.${r.grindMicron.basis}`)}</dd></div>:null}
    {r.ice?<div><dt>{t('ice')}</dt><dd>{iceText(r,t)}</dd></div>:null}</dl><h2>{t('sourcesNav')}</h2><dl className="facts"><div><dt>{t('version')}</dt><dd>{t(`recipes.${r.copy}.version`)}</dd></div><div><dt>{t('published')}</dt><dd>{r.source.published?`${r.source.published}${r.source.publishedBasis?` · ${t(`publishedBases.${r.source.publishedBasis}`)}`:''}`:t('unknown')}</dd></div>
    {r.source.updated?<div><dt>{t('updated')}</dt><dd>{r.source.updated}</dd></div>:null}<div><dt>{t('checked')}</dt><dd>{r.source.checked}</dd></div></dl><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{r.source.label}<ArrowUpRight size={16}/></a>{r.source.video?<a className="source-link" href={r.source.video} target="_blank" rel="noreferrer">{t('video')}<ArrowUpRight size={16}/></a>:null}{r.source.archive?<a className="source-link source-archive" href={r.source.archive} target="_blank" rel="noreferrer">{t('archiveLink')}<ArrowUpRight size={16}/></a>:null}{r.source.evidence?<blockquote className="source-evidence" data-evidence><span>{t('evidenceLabel')}</span>{r.source.evidence}</blockquote>:null}</aside></div>
 </main>;
}
export function ComparePage(){
 const t=useTranslations();const locale=useLocale();const {unit}=useTemperature();const {params,ids,toggle,setParams}=useLibrary();const href=useHref();const [shared,setShared]=useState(false);const [manual,setManual]=useState('');
 const selected=ids.map(id=>recipes.find(r=>r.id===id)!);
 const sharedRows:[string,(r:Recipe)=>string][]=[['equipment',r=>t(`recipes.${r.copy}.equipment`)],['dose',r=>`${doseText(r)} g`]];
 const pourOverRows:[string,(r:Recipe)=>string][]=[['water',r=>isPourOver(r)?`${waterText(r)} ${r.water.unit}${r.water.derived?' *':''}`:t('unknown')],['temperature',r=>temperature(r,t,unit)],['grind',r=>t(`recipes.${r.copy}.grind`)],['grinder',r=>grinderDetails(r,t)],['paper',r=>paperDetails(r,t)],['beans',r=>coffeeDetails(r,t)],['brewTime',r=>r.duration?duration(r):t('unknown')],['ratio',r=>ratio(r,locale)],['version',r=>t(`recipes.${r.copy}.version`)]];
 const espressoRows:[string,(r:Recipe)=>string][]=[['yield',r=>yieldText(r)||t('unknown')],['temperature',r=>temperature(r,t,unit)],['grind',r=>t(`recipes.${r.copy}.grind`)],['grinder',r=>grinderDetails(r,t)],['basket',r=>basketText(r)||t('unknown')],['pressure',r=>pressureText(r)||t('unknown')],['preInfusion',r=>preInfusionText(r)||t('unknown')],['beans',r=>coffeeDetails(r,t)],['shotTime',r=>r.duration?duration(r):t('unknown')],['ratioEspresso',r=>ratio(r,locale)],['version',r=>t(`recipes.${r.copy}.version`)]];
 // Comparison is limited to one method, so the row set follows the first selected recipe.
 const baseRows:[string,(r:Recipe)=>string][]=[...sharedRows,...selected[0]&&isEspresso(selected[0])?espressoRows:pourOverRows];
 const rows:[string,(r:Recipe)=>string][]=selected.some(r=>r.ice)?[...baseRows.slice(0,2),['ice',r=>iceText(r,t)],...baseRows.slice(2)]:baseRows;
 return <main id="main" className="page compare-page"><Link className="back-link" href={href()}><ArrowLeft size={16}/>{t('back')}</Link><div className="page-title-row"><div><h1>{t('compareTitle')}</h1><p className="page-subtitle">{t('compareSubtitle')}</p></div>{ids.length?<button className="button button-primary" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setShared(true);}catch{setManual(window.location.href);}}}>{shared?<Check size={18}/>:<ShareNetwork size={18}/>} {t(shared?'copied':'share')}</button>:null}</div>
 {parseSelection(params.get('ids')).invalid?<p role="status" className="notice">{t('invalidSelection')}</p>:null}
 {parseSelection(params.get('ids')).mismatch?<p role="status" className="notice">{t('compareMismatch')}</p>:null}
 {manual?<label className="copy-fallback">{t('copyError')}<input readOnly value={manual} onFocus={e=>e.target.select()}/></label>:null}
 {!selected.length?<div className="empty-state"><CoffeeBean size={36}/><p>{t('compareEmpty')}</p><Link className="button button-primary" href={href()}>{t('back')}<ArrowRight size={16}/></Link></div>:<><div className="comparison-scroll" tabIndex={0} aria-label={t('compareTitle')}><table className="comparison-table"><thead><tr><td/><>{selected.map(r=><th scope="col" key={r.id}><div className="comparison-identity"><span className="comparison-index">{String(recipeIndex(r)+1).padStart(2,'0')}</span><strong>{brewerName(r,t)}</strong><small>{grinderDetails(r,t)}</small></div><button className="icon-button" aria-label={`${t('remove')} · ${t(`recipes.${r.copy}.title`)}`} onClick={()=>toggle(r.id)}><X size={18}/></button><h2>{t(`recipes.${r.copy}.title`)}</h2><span>{r.author}</span></th>)}{selected.length<3?<th scope="col" className="empty-comparison"><Link href={href()}><Plus size={30}/>{t('addSlot')}</Link></th>:null}</></tr></thead><tbody>{rows.map(([label,getValue])=><tr key={label}><th scope="row">{t(label)}</th>{selected.map(r=><td key={r.id}>{getValue(r)}</td>)}{selected.length<3?<td>—</td>:null}</tr>)}<tr><th scope="row">{t('source')}</th>{selected.map(r=><td key={r.id}><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{r.source.label}<ArrowUpRight size={14}/></a></td>)}{selected.length<3?<td>—</td>:null}</tr><tr><th scope="row">{t('recipesNav')}</th>{selected.map(r=><td key={r.id}><Link className="button button-outline" href={href(`recipes/${r.id}/`)}>{t('view')}<ArrowRight size={15}/></Link></td>)}{selected.length<3?<td>—</td>:null}</tr></tbody></table></div><p className="comparison-note">{t('compareNote')}</p>{selected.some(r=>isPourOver(r)&&r.water.derived)?<p className="comparison-note">* {t('derived')}</p>:null}<button className="text-button" onClick={()=>setParams({ids:null})}>{t('clearAll')}</button></>}
 </main>;
}
export function AuthorsPage(){
 const t=useTranslations();const href=useHref();
 const authors:{id:string;name:string;items:Recipe[]}[]=[];
 for(const r of recipes){
   let author=authors.find(item=>item.id===r.authorId);
   if(!author){author={id:r.authorId,name:r.author,items:[]};authors.push(author);}
   author.items.push(r);
 }
 return <main id="main" className="page"><p className="eyebrow">COFFEE EDITORIAL</p><h1>{t('authorsTitle')}</h1><p className="page-subtitle">{t('authorsIntro')}</p><div className="author-list">{authors.map((author,index)=>{
   const method=author.items[0].method;
   const query:Record<string,string>=method==='espresso'?{method:'espresso'}:{};
   query[methodFilterParam(method,'author')]=author.id;
   return <article key={author.id} id={author.id}><span className="author-index">{String(index+1).padStart(2,'0')}</span><div><h2>{author.name}</h2><p className="author-count">{t('authorRecordCount',{count:author.items.length})}</p><ul className="author-recipes">{author.items.map(r=><li key={r.id}><Link href={href(`recipes/${r.id}/`)}>{t(`recipes.${r.copy}.title`)}</Link><span>{brewerName(r,t)} · {r.dose} g</span></li>)}</ul></div><Link className="button button-outline" href={href('',query)}>{t('recipesNav')}<ArrowRight size={17}/></Link></article>;
 })}</div></main>;
}
export function SourcesPage(){const t=useTranslations();return <main id="main" className="page sources-page"><p className="eyebrow">COFFEE EDITORIAL</p><h1>{t('sourceTitle')}</h1><p className="page-subtitle">{t('sourceIntro')}</p><div className="sources-grid"><div>{recipes.map(r=><article className="source-record" key={r.id}><p className="eyebrow">{r.author}</p><h2>{t(`recipes.${r.copy}.title`)}</h2><p>{t(`recipes.${r.copy}.version`)}</p><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{r.source.label}<ArrowUpRight size={16}/></a>{r.source.archive?<a className="source-link source-archive" href={r.source.archive} target="_blank" rel="noreferrer">{t('archiveLink')}<ArrowUpRight size={14}/></a>:<span className="source-date">{t('archiveMissing')}</span>}<p className="source-date">{t('checked')} · {r.source.checked}</p></article>)}</div><aside><h2>{t('methodTitle')}</h2><p>{t('methodText')}</p><p>{t('translationNote')}</p><p>{t('imageNote')}</p></aside></div></main>;}

export function AboutPage(){const t=useTranslations();return <main id="main" className="page info-page"><p className="eyebrow">COFFEE EDITORIAL</p><h1>{t('siteInfo.aboutTitle')}</h1><p className="page-subtitle">{t('siteInfo.aboutIntro')}</p><div className="info-grid"><section><h2>{t('siteInfo.aboutPurposeHeading')}</h2><p>{t('siteInfo.aboutPurpose')}</p></section><section><h2>{t('siteInfo.aboutPrinciplesHeading')}</h2><p>{t('siteInfo.aboutPrinciples')}</p></section><section><h2>{t('siteInfo.aboutIndependenceHeading')}</h2><p>{t('siteInfo.aboutIndependence')}</p></section><section><h2>{t('siteInfo.contributeHeading')}</h2><p>{t('siteInfo.contributeText')}</p><a className="source-link" href="https://github.com/imycc/brew-library/issues" target="_blank" rel="noreferrer">{t('siteInfo.contributeAction')}<ArrowUpRight size={16}/></a></section></div></main>;}

export function TermsPage(){const t=useTranslations();return <main id="main" className="page info-page"><p className="eyebrow">{t('siteInfo.nav')}</p><h1>{t('siteInfo.termsTitle')}</h1><p className="page-subtitle">{t('siteInfo.termsIntro')}</p><p className="muted">{t('siteInfo.lastUpdated')}</p><div className="info-grid"><section><h2>{t('siteInfo.termsUseHeading')}</h2><p>{t('siteInfo.termsUse')}</p></section><section><h2>{t('siteInfo.termsAccuracyHeading')}</h2><p>{t('siteInfo.termsAccuracy')}</p></section><section><h2>{t('siteInfo.termsResponsibilityHeading')}</h2><p>{t('siteInfo.termsResponsibility')}</p></section><section><h2>{t('siteInfo.termsRightsHeading')}</h2><p>{t('siteInfo.termsRights')}</p></section></div></main>;}

export function PrivacyPage(){const t=useTranslations();return <main id="main" className="page info-page"><p className="eyebrow">{t('siteInfo.nav')}</p><h1>{t('siteInfo.privacyTitle')}</h1><p className="page-subtitle">{t('siteInfo.privacyIntro')}</p><p className="muted">{t('siteInfo.lastUpdated')}</p><div className="info-grid"><section><h2>{t('siteInfo.privacyDataHeading')}</h2><p>{t('siteInfo.privacyData')}</p></section><section><h2>{t('siteInfo.privacyAnalyticsHeading')}</h2><p>{t('siteInfo.privacyAnalytics')} <a className="source-link" href="https://www.goatcounter.com/privacy" target="_blank" rel="noreferrer">GoatCounter<ArrowUpRight size={16}/></a></p></section><section><h2>{t('siteInfo.privacyExternalHeading')}</h2><p>{t('siteInfo.privacyExternal')}</p></section></div></main>;}
