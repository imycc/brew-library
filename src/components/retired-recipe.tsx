'use client';

import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowLeft,ArrowRight} from '@phosphor-icons/react';

export function RetiredRecipeNotice({replacementRecipeId,equipmentId}:{replacementRecipeId:string;equipmentId:string}){
  const t=useTranslations();
  const locale=useLocale();
  return <main id="main" className="page retired-recipe">
    <Link className="back-link" href={`/${locale}/`}><ArrowLeft size={16}/>{t('back')}</Link>
    <p className="eyebrow">RETIRED</p>
    <h1>{t('retiredRecipe.title')}</h1>
    <p className="page-subtitle">{t('retiredRecipe.body')}</p>
    <div className="detail-actions">
      <Link className="button button-primary" href={`/${locale}/recipes/${replacementRecipeId}/`}>{t('retiredRecipe.replacementAction')}<ArrowRight size={15}/></Link>
      <Link className="button button-outline" href={`/${locale}/equipment/#${equipmentId}`}>{t('retiredRecipe.equipmentAction')}<ArrowRight size={15}/></Link>
    </div>
  </main>;
}
