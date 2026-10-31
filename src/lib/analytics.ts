export const PRODUCTION_ANALYTICS_HOST = 'imycc.github.io';

export const ANALYTICS_EVENTS = {
  learnRecipeOpen: 'learn_recipe_open',
  learnLabView: 'learn_lab_view',
  comparePageEmpty: 'compare_page_empty',
  comparePageTable: 'compare_page_table',
  compareRecipeSelect: 'compare_recipe_select',
  compareDifferencesToggle: 'compare_differences_toggle',
  compareRecipeOpen: 'compare_recipe_open',
  equipmentExperienceFilter: 'equipment_experience_filter',
  equipmentRecipeFilter: 'equipment_recipe_filter',
  equipmentRecipeOpen: 'equipment_recipe_open'
} as const;

export type AnalyticsEventName=(typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
export type GoatCounterEvent={path:string;title:string;event:true};
export type GoatCounterClient={count:(event:{path:string;title?:string;event?:boolean})=>void};

declare global {
  interface Window {goatcounter?:GoatCounterClient}
}

const pendingEvents:GoatCounterEvent[]=[];
const maxPendingEvents=30;

export function isProductionAnalyticsHost(hostname:string){
  return hostname===PRODUCTION_ANALYTICS_HOST;
}

export function createAnalyticsEvent(name:AnalyticsEventName,title:string):GoatCounterEvent{
  return {path:name,title,event:true};
}

export function trackAnalyticsEvent(name:AnalyticsEventName,title:string){
  if(typeof window==='undefined'||!isProductionAnalyticsHost(window.location.hostname))return false;
  const event=createAnalyticsEvent(name,title);
  if(window.goatcounter?.count){window.goatcounter.count(event);return true;}
  if(pendingEvents.length<maxPendingEvents)pendingEvents.push(event);
  return false;
}

export function flushAnalyticsEvents(){
  if(typeof window==='undefined'||!window.goatcounter?.count)return;
  for(const event of pendingEvents.splice(0))window.goatcounter.count(event);
}
