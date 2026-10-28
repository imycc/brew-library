'use client';

import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowRight,ArrowUpRight,CoffeeBean,MagnifyingGlass} from '@phosphor-icons/react';
import {useState} from 'react';
import {equipment,equipmentCategories,filterEquipment,type EquipmentCategory} from '@/lib/equipment';
import {recipes} from '@/lib/recipes';

function EquipmentCard({item}:{item:(typeof equipment)[number]}){
  const t=useTranslations();
  const locale=useLocale();
  const related=item.recipeIds.flatMap(id=>recipes.find(recipe=>recipe.id===id)||[]);
  return <article className="equipment-card" data-equipment={item.id}>
    <header><div><span>{t(`equipmentCategories.${item.category}`)}</span><strong>{item.brand}</strong></div>{item.status!=='current'?<span className={`equipment-status ${item.status}`}>{t(`equipmentStatus.${item.status}`)}</span>:null}</header>
    <h2>{item.name}</h2>
    <dl className="equipment-details">{item.details.map(detail=><div key={`${detail.key}-${detail.value}`}><dt>{t(`equipmentSpecs.${detail.key}`)}</dt><dd>{detail.value}{detail.unit?<span>{t(`equipmentUnits.${detail.unit}`)}</span>:null}</dd></div>)}</dl>
    {related.length?<div className="equipment-recipes"><h3>{t('equipmentRelated')}</h3>{related.map(recipe=><Link key={recipe.id} href={`/${locale}/recipes/${recipe.id}/`}>{t(`recipes.${recipe.copy}.title`)}<ArrowRight size={14}/></Link>)}</div>:null}
    <footer><span>{t('equipmentChecked')} · {item.checked}</span><div>{item.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={14}/></a>)}</div></footer>
  </article>;
}

export function EquipmentPage(){
  const t=useTranslations();
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState<EquipmentCategory|'all'>('all');
  const visible=filterEquipment(equipment,query,category);
  return <main id="main" className="page equipment-page">
    <p className="eyebrow">EQUIPMENT INDEX</p>
    <div className="equipment-title"><div><h1>{t('equipmentTitle')}</h1><p className="page-subtitle">{t('equipmentIntro')}</p></div><div className="equipment-total"><strong>{equipment.length}</strong><span>{t('equipmentItems')}</span></div></div>
    <div className="equipment-toolbar"><label className="search-field"><MagnifyingGlass size={22}/><span className="sr-only">{t('equipmentSearch')}</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={t('equipmentSearch')}/></label><div className="equipment-category" role="group" aria-label={t('equipmentCategory')}>{(['all',...equipmentCategories] as const).map(value=><button key={value} className={category===value?'active':''} aria-pressed={category===value} onClick={()=>setCategory(value)}>{t(value==='all'?'all':`equipmentCategories.${value}`)}<span>{value==='all'?equipment.length:equipment.filter(item=>item.category===value).length}</span></button>)}</div></div>
    <div className="equipment-results" aria-live="polite"><span>{t('equipmentResults',{count:visible.length})}</span><p>{t('equipmentNote')}</p></div>
    {visible.length?<div className="equipment-grid">{visible.map(item=><EquipmentCard key={item.id} item={item}/>)}</div>:<div className="empty-state"><CoffeeBean size={36}/><p>{t('equipmentEmpty')}</p><button className="button button-outline" onClick={()=>{setQuery('');setCategory('all');}}>{t('reset')}</button></div>}
  </main>;
}
