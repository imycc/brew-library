'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {CoffeeBean,ArrowUpRight} from '@phosphor-icons/react';
import type {SourceImage} from '@/lib/editorial';

export function OfficialSourceImage({image,name,kind,className=''}:{image?:SourceImage;name:string;kind:'recipe'|'equipment';className?:string}){
  const t=useTranslations();
  const [failed,setFailed]=useState(false);
  if(!image||failed)return <figure className={`source-image source-image-fallback ${className}`} data-source-image="fallback">
    <CoffeeBean size={38} weight="light"/>
    <figcaption>{t('sourceImageUnavailable')}</figcaption>
  </figure>;
  return <figure className={`source-image ${className}`} data-source-image="official">
    <img src={image.url} alt={t('sourceImageAlt',{name,source:image.sourceLabel,kind:t(kind==='recipe'?'sourceImageRecipe':'sourceImageEquipment')})} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>
    <figcaption><span>{t('sourceImageCredit',{source:image.sourceLabel})}</span><a href={image.sourceUrl} target="_blank" rel="noreferrer">{t('sourceImageView')}<ArrowUpRight size={13}/></a></figcaption>
  </figure>;
}
