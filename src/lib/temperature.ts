export type TemperatureUnit='C'|'F';
export const temperatureUnits=['C','F'] as const;

export function convertTemperature(value:number,from:TemperatureUnit,to:TemperatureUnit):number{
  if(from===to)return value;
  const converted=from==='C'?value*9/5+32:(value-32)*5/9;
  return Math.round(converted*10)/10;
}

const round=(value:number)=>String(Number(value.toFixed(1)));

// A converted reading is always marked: the source's own unit and number stay canonical,
// the other unit is a display convenience.
export function formatTemperature(value:number,source:TemperatureUnit,display:TemperatureUnit|null,max?:number):{text:string;converted:boolean}{
  const target=display??source;
  const converted=target!==source;
  const prefix=converted?'≈ ':'';
  const unit=target==='C'?'°C':'°F';
  const low=convertTemperature(value,source,target);
  const high=max===undefined?undefined:convertTemperature(max,source,target);
  if(high!==undefined&&high!==low)return {text:`${prefix}${round(low)}–${round(high)}${unit}`,converted};
  return {text:`${prefix}${round(low)}${unit}`,converted};
}
