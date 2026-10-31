import test from 'node:test';
import assert from 'node:assert/strict';
import {ANALYTICS_EVENTS,PRODUCTION_ANALYTICS_HOST,createAnalyticsEvent,isProductionAnalyticsHost} from '../src/lib/analytics';

test('UX analytics event catalogue is stable and low-cardinality',()=>{
  const names=Object.values(ANALYTICS_EVENTS);
  assert.equal(new Set(names).size,names.length);
  for(const name of names)assert.match(name,/^[a-z][a-z0-9_]*$/);
  assert.deepEqual(names,[
    'learn_recipe_open',
    'learn_lab_view',
    'compare_page_empty',
    'compare_page_table',
    'compare_recipe_select',
    'compare_differences_toggle',
    'compare_recipe_open',
    'equipment_experience_filter',
    'equipment_recipe_filter',
    'equipment_recipe_open'
  ]);
});

test('UX analytics events use the GoatCounter event protocol',()=>{
  assert.deepEqual(createAnalyticsEvent(ANALYTICS_EVENTS.compareDifferencesToggle,'Show only different comparison rows'),{
    path:'compare_differences_toggle',
    title:'Show only different comparison rows',
    event:true
  });
});

test('analytics only accepts the production Pages host',()=>{
  assert.equal(isProductionAnalyticsHost(PRODUCTION_ANALYTICS_HOST),true);
  assert.equal(isProductionAnalyticsHost('localhost'),false);
  assert.equal(isProductionAnalyticsHost('127.0.0.1'),false);
  assert.equal(isProductionAnalyticsHost('preview.example.com'),false);
});
