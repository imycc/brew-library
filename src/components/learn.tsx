'use client';

import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {ArrowRight,BookOpenText,Eye,Flask,SlidersHorizontal} from '@phosphor-icons/react';
import {curatedLearningRecipes,learningLevel,learningLevelKey} from '@/lib/learning';
import {isEspresso} from '@/lib/recipes';

const loopIcons=[BookOpenText,Flask,Eye,SlidersHorizontal];

export function LearnPage(){
  const t=useTranslations();
  const locale=useLocale();
  const loop=[
    ['readTitle','readText'],
    ['brewTitle','brewText'],
    ['observeTitle','observeText'],
    ['adjustTitle','adjustText']
  ] as const;
  const tastes=['tasteSour','tasteBitter','tasteWeak','tasteSlow'] as const;
  return <main id="main" className="page learn-page" data-learn-page>
    <header className="learn-hero">
      <p className="eyebrow">{t('learn.eyebrow')}</p>
      <h1>{t('learn.title')}</h1>
      <p className="page-subtitle">{t('learn.intro')}</p>
    </header>

    <section className="learn-section" aria-labelledby="learning-loop-title">
      <div className="learn-section-head"><h2 id="learning-loop-title">{t('learn.loopTitle')}</h2><p>{t('learn.loopIntro')}</p></div>
      <ol className="learning-loop">{loop.map(([title,text],index)=>{const Icon=loopIcons[index];return <li key={title}><span className="learning-step-index">{String(index+1).padStart(2,'0')}</span><Icon size={24} weight="light" aria-hidden="true"/><h3>{t(`learn.${title}`)}</h3><p>{t(`learn.${text}`)}</p></li>;})}</ol>
    </section>

    <section className="learn-section learn-foundations">
      <article>
        <p className="eyebrow">VARIABLES</p>
        <h2>{t('learn.variablesTitle')}</h2>
        <p>{t('learn.variablesText')}</p>
      </article>
      <article id="recipe-lab" className="learning-lab">
        <p className="eyebrow">CONTROLLED BREW</p>
        <h2>{t('learn.labTitle')}</h2>
        <p>{t('learn.labIntro')}</p>
        <ol>
          <li>{t('learn.labBaseline')}</li>
          <li>{t('learn.labChange')}</li>
          <li>{t('learn.labRecord')}</li>
        </ol>
      </article>
    </section>

    <section className="learn-section" aria-labelledby="taste-title">
      <div className="learn-section-head"><h2 id="taste-title">{t('learn.tasteTitle')}</h2><p>{t('learn.tasteIntro')}</p></div>
      <div className="taste-signals">{tastes.map((key,index)=><article key={key}><span>{String(index+1).padStart(2,'0')}</span><p>{t(`learn.${key}`)}</p></article>)}</div>
      <p className="learning-caveat">{t('learn.tasteCaveat')}</p>
    </section>

    <section className="learn-section evidence-guide" aria-labelledby="evidence-title">
      <div className="learn-section-head"><h2 id="evidence-title">{t('learn.evidenceTitle')}</h2></div>
      <dl>
        <div><dt>{t('sourceFacts')}</dt><dd>{t('learn.evidenceSource')}</dd></div>
        <div><dt>{t('derived')}</dt><dd>{t('learn.evidenceDerived')}</dd></div>
        <div><dt>{t('learn.evidenceEditorialLabel')}</dt><dd>{t('learn.evidenceEditorial')}</dd></div>
      </dl>
    </section>

    <section className="learn-section curated-learning" aria-labelledby="curated-title">
      <div className="learn-section-head"><h2 id="curated-title">{t('learn.curatedTitle')}</h2><p>{t('learn.curatedIntro')}</p></div>
      <div className="curated-learning-grid">{curatedLearningRecipes.map((recipe,index)=><article key={recipe.id} data-learning-recipe={recipe.id}>
        <div className="curated-learning-meta"><span>{String(index+1).padStart(2,'0')}</span><span>{t(isEspresso(recipe)?'methodEspresso':'methodPourover')}</span><span>{t(learningLevelKey(recipe))}</span></div>
        <h3><Link href={`/${locale}/recipes/${recipe.id}/`}>{t(`recipes.${recipe.copy}.title`)}</Link></h3>
        <p>{t(`recipes.${recipe.copy}.summary`)}</p>
        <div className="curated-learning-footer"><span>{recipe.author}</span><Link href={`/${locale}/recipes/${recipe.id}/`}>{t('view')}<ArrowRight size={15}/></Link></div>
      </article>)}</div>
    </section>
  </main>;
}
