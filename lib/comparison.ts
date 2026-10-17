import type {Product} from './catalog';
export const MAX_COMPARISON=4;
export function comparisonIds(value:unknown,products:Product[]):string[]{
 let input:unknown=value;
 if(typeof value==='string'){try{input=JSON.parse(value);}catch{return [];}}
 if(!Array.isArray(input))return [];
 const valid=Array.from(new Set(input.filter((id):id is string=>typeof id==='string'&&products.some(p=>p.id===id&&p.status==='published'))));
 const first=products.find(p=>p.id===valid[0]);
 return valid.filter(id=>products.find(p=>p.id===id)?.type===first?.type).slice(0,MAX_COMPARISON);
}
export function comparisonProducts(ids:string[],products:Product[]){return ids.flatMap(id=>{const p=products.find(p=>p.id===id);return p?[p]:[];});}
export const comparisonHref=(ids:string[])=>'/compare?ids='+ids.map(encodeURIComponent).join(',');
export function relatedBrowseHref(p?:Product){if(!p)return '/category/recovery';const q=new URLSearchParams();if(p.facets?.deviceType?.[0])q.set('deviceType',p.facets.deviceType[0]);if(p.facets?.equipmentType?.[0])q.set('equipmentType',p.facets.equipmentType[0]);return(p.category==='supplements'?'/supplements':p.category==='drinks'?'/drinks':'/category/'+p.category)+(q.size?'?'+q:'');}
