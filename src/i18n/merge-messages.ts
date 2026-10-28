export type MessageValue=string|number|boolean|null|MessageValue[]|{[key:string]:MessageValue};
export type Messages=Record<string,MessageValue>;

export function mergeMessages(base:Messages,overlay:Messages):Messages{
  const merged:Messages={...base};
  for(const [key,value] of Object.entries(overlay)){
    const current=merged[key];
    merged[key]=isRecord(current)&&isRecord(value)?mergeMessages(current,value):value;
  }
  return merged;
}

function isRecord(value:MessageValue|undefined):value is Messages{
  return typeof value==='object'&&value!==null&&!Array.isArray(value);
}
