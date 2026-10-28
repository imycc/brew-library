'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowRight,ArrowUpRight,ArrowLeft,MagnifyingGlass,Plus,X,Globe,CaretDown,Check,CoffeeBean,Drop,Thermometer,Clock,ShareNetwork,List as MenuIcon,Funnel} from '@phosphor-icons/react';
import {createContext,useContext,useEffect,useState,useCallback,useRef,type ReactNode} from 'react';
import {BASE,recipes,parseSelection,toggleSelection,filterRecipes,filterKeys,time,duration,type Recipe} from '@/lib/recipes';
import {recipeEditorial} from '@/lib/editorial';
import {recipeFaq} from '@/lib/faq';
import {OfficialSourceImage} from '@/components/source-image';
import {locales,localeNames,type Locale} from '@/i18n/locales';

type UrlContextType={params:URLSearchParams;setParams:(changes:Record<string,string|null>)=>void;ids:string[];toggle:(id:string)=>void;notice:string};
const UrlContext=createContext<UrlContextType|null>(null);
function useLibrary(){const v=useContext(UrlContext);if(!v)throw new Error('Missing library provider');return v;}
export function LibraryProvider({children}:{children:ReactNode}){
  const t=useTranslations();
  const [params,setState]=useState(()=>new URLSearchParams());
  const [notice,setNotice]=useState('');
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
    setNotice('');setParams({ids:result.ids.join(',')});
  };
  return <UrlContext.Provider value={{params,setParams,ids,toggle,notice}}>{children}<div className="sr-only" role="status" aria-live="polite">{notice}</div></UrlContext.Provider>;
}
function useHref(){const locale=useLocale();const {params}=useLibrary();return (suffix='',extra?:Record<string,string>)=>{
  const query=new URLSearchParams(params);if(extra)for(const [k,v]of Object.entries(extra))query.set(k,v);
  return `/${locale}/${suffix}${query.size?`?${query}`:''}`;
};}
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
    <LanguageSwitcher/>
    <button className="icon-button mobile-menu" aria-label={open?t('close'):t('menu')} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<MenuIcon size={22}/>}</button>
  </header></>;
}
export function Footer(){const t=useTranslations();const href=useHref();return <footer className="site-footer"><div><strong>{t('brand')}</strong></div><div className="footer-links"><nav className="footer-info" aria-label={t('siteInfo.nav')}><Link href={href('about/')}>{t('siteInfo.aboutNav')}</Link><Link href={href('terms/')}>{t('siteInfo.termsNav')}</Link><Link href={href('privacy/')}>{t('siteInfo.privacyNav')}</Link><Link href={href('sources/')}>{t('sourcesNav')}</Link></nav><a href="https://github.com/imycc/pour-over-coffee" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14}/></a></div></footer>;}
function temperature(r:Recipe,t:ReturnType<typeof useTranslations>){return r.temperature?`${r.temperature}°C`:t(r.temperatureMode==='boiling'?'boiling':'unknown');}
function coffeeDetails(r:Recipe,t:ReturnType<typeof useTranslations>){return [r.coffee?.name,r.coffee?.origin,r.coffee?.variety,r.coffee?.process?t(`processes.${r.coffee.process}`):null,r.coffee?.roast?t(`roasts.${r.coffee.roast}`):null].filter(Boolean).join(' · ')||t(r.beanNote||(r.beanConditions==='light'?'light':'unknown'));}
function grinderDetails(r:Recipe,t:ReturnType<typeof useTranslations>){return r.grinder?`${r.grinder.name} · ${r.grinder.setting||t('unknown')}`:t('unknown');}
function paperDetails(r:Recipe,t:ReturnType<typeof useTranslations>){return r.paper?.name||(r.filterNote?t(r.filterNote):r.filterConditions==='pulsar'?'NextLevel Pulsar':t('unknown'));}
function Parameters({recipe:r,compact=false}:{recipe:Recipe;compact?:boolean}){
  const t=useTranslations();const values=[{key:'dose',value:`${r.dose} g`,Icon:CoffeeBean},{key:'water',value:`${r.water.amount} ${r.water.unit}`,Icon:Drop},{key:'temperature',value:temperature(r,t),Icon:Thermometer},{key:'brewTime',value:r.duration?duration(r):t('unknown'),Icon:Clock}];
  return <dl className={compact?'parameters compact':'parameters'}>{values.map(({key,value,Icon})=><div key={key}><dt>{compact?<><Icon size={16} aria-hidden="true"/><span className="sr-only">{t(key)}</span></>:t(key)}</dt><dd title={value} data-long={value.length>10||undefined}>{value}</dd></div>)}</dl>;
}
export function CompareButton({recipe:r,compact=false}:{recipe:Recipe;compact?:boolean}){const {ids,toggle}=useLibrary();const t=useTranslations();const selected=ids.includes(r.id);return <button className={compact?`compare-compact${selected?' is-selected':''}`:`button button-secondary${selected?' is-selected':''}`} onClick={()=>toggle(r.id)} aria-pressed={selected} aria-label={`${selected?t('remove'):t('add')} · ${t(`recipes.${r.copy}.title`)}`}>{compact?<>{selected?<Check size={15}/>:<Plus size={15}/>}<span>{t('compareNav')}</span></>:<>{selected?<Check size={16}/>:null}{selected?t('remove'):t('add')}{selected?null:<Plus size={15}/>}</>}</button>;}
function recipeTitle(r:Recipe,t:ReturnType<typeof useTranslations>){const title=t(`recipes.${r.copy}.title`);return title.startsWith(`${r.author} · `)?title.slice(r.author.length+3):title;}
function RecipeTop({r,index}:{r:Recipe;index:number}){return <div className="recipe-card-top"><span className="recipe-index">{String(index+1).padStart(2,'0')}</span><span title={r.brewer.split(' · ')[0]}>{r.brewer.split(' · ')[0]}</span><span title={r.author}>{r.author}</span></div>;}
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
export function Home(){
  const t=useTranslations();const {params,setParams}=useLibrary();
  const filters=Object.fromEntries(filterKeys.map(k=>[k,params.get(k)||'']));
  const reset=()=>setParams(Object.fromEntries(filterKeys.map(k=>[k,null])));
  const filtered=filterRecipes(recipes,filters,r=>`${t(`recipes.${r.copy}.title`)} ${t(`recipes.${r.copy}.summary`)}`);
  const active=Object.values(filters).some(Boolean);
  return <main id="main">
    <section className="hero"><div className="hero-art"/><div className="hero-content"><p className="hero-kicker">COFFEE EDITORIAL <span/></p><h1><span>{t('hero1')}</span><span>{t('hero2')}</span></h1><p className="hero-subtitle">{t('heroSubtitle')}</p>
      <div className="hero-search"><label className="search-field"><MagnifyingGlass size={24}/><span className="sr-only">{t('search')}</span><input type="search" placeholder={t('search')} value={filters.q} onChange={e=>setParams({q:e.target.value})}/></label>
        <label className="brewer-select"><Funnel size={20}/><span className="sr-only">{t('chooseBrewer')}</span><select aria-label={t('chooseBrewer')} value={filters.brewer} onChange={e=>setParams({brewer:e.target.value})}><option value="">{t('chooseBrewer')}</option>{[...new Map(recipes.map(r=>[r.brewerId,r.brewer.split(' · ')[0]])).entries()].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      </div></div>
    </section>
    <section className="recipe-section" id="recipes"><div className="section-heading"><h2>{t('sectionTitle')}</h2><span className="heading-rule"/><p>{t('sectionIntro')}</p></div>
      <div className="filter-row"><span className="result-count" aria-live="polite">{t('results',{count:filtered.length})}</span>
        <div className="secondary-filters"><label><span>{t('author')}</span><select aria-label={t('author')} value={filters.author} onChange={e=>setParams({author:e.target.value})}><option value="">{t('all')}</option>{recipes.map(r=><option key={r.id} value={r.authorId}>{r.author}</option>)}</select></label>
          <label><span>{t('kind')}</span><select aria-label={t('kind')} value={filters.kind} onChange={e=>setParams({kind:e.target.value})}><option value="">{t('all')}</option><option value="hot">{t('hot')}</option><option value="iced">{t('iced')}</option></select></label>
          <label><span>{t('dose')}</span><select aria-label={t('dose')} value={filters.dose} onChange={e=>setParams({dose:e.target.value})}><option value="">{t('all')}</option>{[...new Set(recipes.map(r=>r.dose))].map(n=><option key={n} value={String(n)}>{n} g</option>)}</select></label>
          {active?<button className="text-button" onClick={reset}>{t('reset')}</button>:null}
        </div></div>
      <details className="condition-filters" open={!!(filters.grinder||filters.paper||filters.process||filters.roast)}><summary>{t('conditionFilters')}</summary><p>{t('conditionHint')}</p><div className="secondary-filters">
        {(['grinder','paper','process','roast'] as const).map(key=>{
          const options=key==='grinder'||key==='paper'?[...new Map(recipes.flatMap(r=>r[key]?[[r[key]!.id,r[key]!.name] as const]:[])).entries()]:[...new Set(recipes.flatMap(r=>r.coffee?.[key]?[r.coffee[key]!]:[]))].map(value=>[value,t(`${key==='process'?'processes':'roasts'}.${value}`)]);
          return <label key={key}><span>{t(key)}</span><select aria-label={t(key)} value={filters[key]} onChange={e=>setParams({[key]:e.target.value})}><option value="">{t('all')}</option>{options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>;
        })}
      </div></details>
      {filtered.length?<div className="recipe-grid">{filtered.map((r,i)=>i===0?<RecipeLead key={r.id} recipe={r} index={recipes.indexOf(r)}/>:<RecipeCard key={r.id} recipe={r} index={recipes.indexOf(r)}/>)}</div>:<div className="empty-state"><CoffeeBean size={34}/><p>{t('noResults')}</p><button className="button button-outline" onClick={reset}>{t('reset')}</button></div>}
    </section>
  </main>;
}
export function ComparisonTray(){const t=useTranslations();const {ids,toggle,notice}=useLibrary();const href=useHref();const pathname=usePathname();if(!ids.length||pathname.includes('/compare')||pathname.includes('/recipes/'))return null;
 return <aside className="compare-tray" aria-label={t('compareNav')}><strong>{t('selected',{count:ids.length})}</strong><div className="tray-items">{ids.map(id=>{const r=recipes.find(r=>r.id===id)!;return <div className="tray-item" key={id}><span className="tray-index">{String(recipes.indexOf(r)+1).padStart(2,'0')}</span><span>{t(`recipes.${r.copy}.title`)}</span><button className="icon-button" aria-label={`${t('remove')} · ${t(`recipes.${r.copy}.title`)}`} onClick={()=>toggle(id)}><X size={16}/></button></div>;})}</div><Link className="button button-primary" href={href('compare/')}>{t('compareAction')}<ArrowRight size={17}/></Link>{notice?<p role="alert">{notice}</p>:null}</aside>;
}
export function RecipeDetail({id}:{id:string}){
 const t=useTranslations();const href=useHref();const r=recipes.find(r=>r.id===id)!;
 const editorial=recipeEditorial[r.id];
 const faq=recipeFaq(r,t);
 const related=recipes.filter(item=>item.id!==r.id&&(item.brewerId===r.brewerId||item.authorId===r.authorId)).slice(0,3);
 const pours=r.steps.filter(s=>['pour','bloom','pulses'].includes(s.action));
 return <main id="main" className="page detail-page"><Link className="back-link" href={href()}><ArrowLeft size={16}/>{t('back')}</Link>
   <section className="detail-intro"><div><p className="eyebrow">{r.author} · {t(r.context)}</p><h1>{t(`recipes.${r.copy}.title`)}</h1><p className="detail-version">{t(`recipes.${r.copy}.version`)}</p><p className="detail-summary">{t(`recipes.${r.copy}.summary`)}</p><p className="quick-answer">{t('quickAnswer',{dose:r.dose,water:r.water.amount,unit:r.water.unit,temperature:temperature(r,t),grind:t(`recipes.${r.copy}.grind`),time:r.duration?duration(r):t('unknown')})}</p><OfficialSourceImage image={editorial.sourceImage} name={t(`recipes.${r.copy}.title`)} kind="recipe" className="recipe-detail-image"/><Parameters recipe={r}/><div className="detail-grind"><span>{t('grind')}</span><strong>{t(`recipes.${r.copy}.grind`)}</strong></div><div className="detail-actions"><CompareButton recipe={r}/><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{t('source')}<ArrowUpRight size={17}/></a></div></div><div className="detail-spec-card"><div><span>{t('equipment')}</span><strong>{r.brewer}</strong></div><div><span>{t('grinder')}</span><strong>{grinderDetails(r,t)}</strong></div><div><span>{t('beans')}</span><strong>{coffeeDetails(r,t)}</strong></div><div><span>{t('filterPaper')}</span><strong>{paperDetails(r,t)}</strong></div></div></section>
   <section className="recipe-editorial" data-recipe-editorial>
     <div className="recipe-editorial-intro"><p className="eyebrow">EDITORIAL NOTES</p><h2>{t('recipeOverview')}</h2><p>{t(`recipes.${r.copy}.overview`)}</p><div className="best-for"><span>{t('bestFor')}</span><strong>{t(`recipes.${r.copy}.bestFor`)}</strong></div></div>
     <div className="editorial-tradeoffs"><div><h3><span aria-hidden="true">＋</span>{t('strengths')}</h3><ul>{editorial.strengths.map(key=><li key={key}>{t(`editorialStrengths.${key}`)}</li>)}</ul></div><div><h3><span aria-hidden="true">−</span>{t('considerations')}</h3><ul>{editorial.considerations.map(key=><li key={key}>{t(`editorialConsiderations.${key}`)}</li>)}</ul></div></div>
   </section>
   <div className="detail-body"><div>
     {r.preparation.length?<section className="preparation"><h2>{t('preparation')}</h2>{r.preparation.map(key=><p key={key}>{t(key)}</p>)}</section>:null}
     <section className="timeline-section" data-testid="pour-timeline"><div className="section-heading small"><h2>{t('timeline')}</h2><span className="heading-rule"/><p>{t('stepAmount')}</p></div><ol className="pour-timeline">{pours.map((s,i)=><li key={i}><span className="timeline-dot">{i+1}</span><strong>{s.at===null?t('sequence'):time(s.at)}</strong><span>{s.amount===null?'—':`${s.amount} ${s.unit||r.water.unit}`}</span></li>)}</ol>{r.copy==='rao'?<p className="muted">{t(`recipes.${r.copy}.notes`)}</p>:null}</section>
     <section className="steps-section"><h2>{t('steps')}</h2><ol className="step-list">{r.steps.map((s,i)=><li key={i}><span className="step-number">{String(i+1).padStart(2,'0')}</span><div><div className="step-title"><h3>{t(`step.${s.action}`)}</h3><span className="step-time">{s.at===null?t('sequence'):time(s.at)}{s.end?`–${time(s.end)}`:''}</span></div><div className="step-meta">{s.temperature?<span>{t('temperature')} {s.temperature}°C</span>:null}{s.amount!==null?<span>+{s.amount} {s.unit||r.water.unit}</span>:null}{s.cumulative!==null?<span>{t('cumulative')} {s.cumulative} {s.unit||r.water.unit}</span>:null}</div><p>{s.action==='finish'?t(`recipes.${r.copy}.finish`):t(s.instruction||`instruction.${s.action}`)}</p></div></li>)}</ol></section>
     <section className="recipe-notes"><h2>{t('notes')}</h2><p>{t(`recipes.${r.copy}.notes`)}</p>{r.water.derived?<p>{t('derived')} {r.dose} × 17 = {r.water.amount} g.</p>:null}</section>
     <section className="recipe-faq"><h2>{t('faqTitle')}</h2>{faq.map(item=><article key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</section>
     {related.length?<section className="related-recipes"><h2>{t('relatedRecipes')}</h2><ul>{related.map(item=><li key={item.id}><Link href={href(`recipes/${item.id}/`)}><strong>{t(`recipes.${item.copy}.title`)}</strong><span>{item.author} · {item.brewer.split(' · ')[0]}</span><ArrowRight size={15}/></Link></li>)}</ul></section>:null}
   </div><aside className="detail-sidebar"><h2>{t('equipment')}</h2><p>{t(`recipes.${r.copy}.equipment`)}</p><h2>{t('conditions')}</h2><dl className="facts"><div><dt>{t('grinder')}</dt><dd>{grinderDetails(r,t)}</dd></div><div><dt>{t('beans')}</dt><dd>{coffeeDetails(r,t)}</dd></div><div><dt>{t('waterQuality')}</dt><dd>{t(r.waterNote||(r.waterConditions==='unknown'?'unknown':r.waterConditions==='soft'?'soft':'raoWater'))}</dd></div><div><dt>{t('filterPaper')}</dt><dd>{paperDetails(r,t)}</dd></div></dl><h2>{t('sourcesNav')}</h2><dl className="facts"><div><dt>{t('version')}</dt><dd>{t(`recipes.${r.copy}.version`)}</dd></div><div><dt>{t('published')}</dt><dd>{r.source.published||t('unknown')}</dd></div><div><dt>{t('checked')}</dt><dd>{r.source.checked}</dd></div></dl><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{r.source.label}<ArrowUpRight size={16}/></a>{r.source.video?<a className="source-link" href={r.source.video} target="_blank" rel="noreferrer">{t('video')}<ArrowUpRight size={16}/></a>:null}</aside></div>
 </main>;
}
export function ComparePage(){
 const t=useTranslations();const locale=useLocale();const {params,ids,toggle,setParams}=useLibrary();const href=useHref();const [shared,setShared]=useState(false);const [manual,setManual]=useState('');
 const selected=ids.map(id=>recipes.find(r=>r.id===id)!);
 const rows:[string,(r:Recipe)=>string][]=[['equipment',r=>t(`recipes.${r.copy}.equipment`)],['dose',r=>`${r.dose} g`],['water',r=>`${r.water.amount} ${r.water.unit}${r.water.derived?' *':''}`],['temperature',r=>temperature(r,t)],['grind',r=>t(`recipes.${r.copy}.grind`)],['grinder',r=>grinderDetails(r,t)],['paper',r=>paperDetails(r,t)],['beans',r=>coffeeDetails(r,t)],['brewTime',r=>r.duration?duration(r):t('unknown')],['ratio',r=>r.water.unit==='g'?`1 : ${new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(r.water.amount/r.dose)}`:`${r.dose} g : ${r.water.amount} mL`],['version',r=>t(`recipes.${r.copy}.version`)]];
 return <main id="main" className="page compare-page"><Link className="back-link" href={href()}><ArrowLeft size={16}/>{t('back')}</Link><div className="page-title-row"><div><h1>{t('compareTitle')}</h1><p className="page-subtitle">{t('compareSubtitle')}</p></div>{ids.length?<button className="button button-primary" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setShared(true);}catch{setManual(window.location.href);}}}>{shared?<Check size={18}/>:<ShareNetwork size={18}/>} {t(shared?'copied':'share')}</button>:null}</div>
 {parseSelection(params.get('ids')).invalid?<p role="status" className="notice">{t('invalidSelection')}</p>:null}
 {manual?<label className="copy-fallback">{t('copyError')}<input readOnly value={manual} onFocus={e=>e.target.select()}/></label>:null}
 {!selected.length?<div className="empty-state"><CoffeeBean size={36}/><p>{t('compareEmpty')}</p><Link className="button button-primary" href={href()}>{t('back')}<ArrowRight size={16}/></Link></div>:<><div className="comparison-scroll" tabIndex={0} aria-label={t('compareTitle')}><table className="comparison-table"><thead><tr><td/><>{selected.map(r=><th scope="col" key={r.id}><div className="comparison-identity"><span className="comparison-index">{String(recipes.indexOf(r)+1).padStart(2,'0')}</span><strong>{r.brewer.split(' · ')[0]}</strong><small>{grinderDetails(r,t)}</small></div><button className="icon-button" aria-label={`${t('remove')} · ${t(`recipes.${r.copy}.title`)}`} onClick={()=>toggle(r.id)}><X size={18}/></button><h2>{t(`recipes.${r.copy}.title`)}</h2><span>{r.author}</span></th>)}{selected.length<3?<th scope="col" className="empty-comparison"><Link href={href()}><Plus size={30}/>{t('addSlot')}</Link></th>:null}</></tr></thead><tbody>{rows.map(([label,getValue])=><tr key={label}><th scope="row">{t(label)}</th>{selected.map(r=><td key={r.id}>{getValue(r)}</td>)}{selected.length<3?<td>—</td>:null}</tr>)}<tr><th scope="row">{t('source')}</th>{selected.map(r=><td key={r.id}><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{r.source.label}<ArrowUpRight size={14}/></a></td>)}{selected.length<3?<td>—</td>:null}</tr><tr><th scope="row">{t('recipesNav')}</th>{selected.map(r=><td key={r.id}><Link className="button button-outline" href={href(`recipes/${r.id}/`)}>{t('view')}<ArrowRight size={15}/></Link></td>)}{selected.length<3?<td>—</td>:null}</tr></tbody></table></div><p className="comparison-note">{t('compareNote')}</p>{selected.some(r=>r.water.derived)?<p className="comparison-note">* {t('derived')}</p>:null}<button className="text-button" onClick={()=>setParams({ids:null})}>{t('clearAll')}</button></>}
 </main>;
}
export function AuthorsPage(){const t=useTranslations();const href=useHref();return <main id="main" className="page"><p className="eyebrow">COFFEE EDITORIAL</p><h1>{t('authorsTitle')}</h1><p className="page-subtitle">{t('authorsIntro')}</p><div className="author-list">{recipes.map((r,i)=><article key={r.authorId} id={r.authorId}><span className="author-index">{String(i+1).padStart(2,'0')}</span><div><h2>{r.author}</h2><p>{t(`recipes.${r.copy}.summary`)}</p></div><Link className="button button-outline" href={href('',{author:r.authorId})}>{t('recipesNav')}<ArrowRight size={17}/></Link></article>)}</div></main>;}
export function SourcesPage(){const t=useTranslations();return <main id="main" className="page sources-page"><p className="eyebrow">COFFEE EDITORIAL</p><h1>{t('sourceTitle')}</h1><p className="page-subtitle">{t('sourceIntro')}</p><div className="sources-grid"><div>{recipes.map(r=><article className="source-record" key={r.id}><p className="eyebrow">{r.author}</p><h2>{t(`recipes.${r.copy}.title`)}</h2><p>{t(`recipes.${r.copy}.version`)}</p><a className="source-link" href={r.source.url} target="_blank" rel="noreferrer">{r.source.label}<ArrowUpRight size={16}/></a><p className="source-date">{t('checked')} · {r.source.checked}</p></article>)}</div><aside><h2>{t('methodTitle')}</h2><p>{t('methodText')}</p><p>{t('translationNote')}</p><p>{t('imageNote')}</p></aside></div></main>;}

export function AboutPage(){const t=useTranslations();return <main id="main" className="page info-page"><p className="eyebrow">COFFEE EDITORIAL</p><h1>{t('siteInfo.aboutTitle')}</h1><p className="page-subtitle">{t('siteInfo.aboutIntro')}</p><div className="info-grid"><section><h2>{t('siteInfo.aboutPurposeHeading')}</h2><p>{t('siteInfo.aboutPurpose')}</p></section><section><h2>{t('siteInfo.aboutPrinciplesHeading')}</h2><p>{t('siteInfo.aboutPrinciples')}</p></section><section><h2>{t('siteInfo.aboutIndependenceHeading')}</h2><p>{t('siteInfo.aboutIndependence')}</p></section><section><h2>{t('siteInfo.contributeHeading')}</h2><p>{t('siteInfo.contributeText')}</p><a className="source-link" href="https://github.com/imycc/pour-over-coffee/issues" target="_blank" rel="noreferrer">{t('siteInfo.contributeAction')}<ArrowUpRight size={16}/></a></section></div></main>;}

export function TermsPage(){const t=useTranslations();return <main id="main" className="page info-page"><p className="eyebrow">{t('siteInfo.nav')}</p><h1>{t('siteInfo.termsTitle')}</h1><p className="page-subtitle">{t('siteInfo.termsIntro')}</p><p className="muted">{t('siteInfo.lastUpdated')}</p><div className="info-grid"><section><h2>{t('siteInfo.termsUseHeading')}</h2><p>{t('siteInfo.termsUse')}</p></section><section><h2>{t('siteInfo.termsAccuracyHeading')}</h2><p>{t('siteInfo.termsAccuracy')}</p></section><section><h2>{t('siteInfo.termsResponsibilityHeading')}</h2><p>{t('siteInfo.termsResponsibility')}</p></section><section><h2>{t('siteInfo.termsRightsHeading')}</h2><p>{t('siteInfo.termsRights')}</p></section></div></main>;}

export function PrivacyPage(){const t=useTranslations();return <main id="main" className="page info-page"><p className="eyebrow">{t('siteInfo.nav')}</p><h1>{t('siteInfo.privacyTitle')}</h1><p className="page-subtitle">{t('siteInfo.privacyIntro')}</p><p className="muted">{t('siteInfo.lastUpdated')}</p><div className="info-grid"><section><h2>{t('siteInfo.privacyDataHeading')}</h2><p>{t('siteInfo.privacyData')}</p></section><section><h2>{t('siteInfo.privacyAnalyticsHeading')}</h2><p>{t('siteInfo.privacyAnalytics')} <a className="source-link" href="https://www.goatcounter.com/privacy" target="_blank" rel="noreferrer">GoatCounter<ArrowUpRight size={16}/></a></p></section><section><h2>{t('siteInfo.privacyExternalHeading')}</h2><p>{t('siteInfo.privacyExternal')}</p></section></div></main>;}
