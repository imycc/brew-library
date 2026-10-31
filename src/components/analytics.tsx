'use client';

import Script from 'next/script';
import {usePathname} from 'next/navigation';
import {useCallback,useEffect,useRef} from 'react';
import {BASE} from '@/lib/recipes';
import {flushAnalyticsEvents} from '@/lib/analytics';

// Public account identifier, not a credential. An unset value keeps tracking off.
const code=process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;
if(code&&!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(code))throw new Error('Invalid GoatCounter account code');

export function Analytics(){
  const pathname=usePathname();
  const latestPath=useRef(pathname);
  const countedPath=useRef<string|null>(null);
  const count=useCallback(()=>{
    if(window.location.hostname!=='imycc.github.io'||!window.goatcounter?.count)return;
    const path=`${BASE}${latestPath.current.replace(/\/$/,'')}/`;
    if(countedPath.current===path)return;
    window.goatcounter.count({path,title:document.title});
    countedPath.current=path;
  },[]);
  const ready=useCallback(()=>{count();flushAnalyticsEvents();},[count]);
  useEffect(()=>{latestPath.current=pathname;count();},[pathname,count]);
  if(!code)return null;
  return <Script id="goatcounter" src="https://gc.zgo.at/count.js" data-goatcounter={`https://${code}.goatcounter.com/count`} data-goatcounter-settings='{"no_onload":true}' strategy="afterInteractive" onReady={ready}/>;
}
