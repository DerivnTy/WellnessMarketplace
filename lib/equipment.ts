import type {Product} from './catalog';
export type SpecRow={id:string;label:string;keys:string[]};
export const recoverySpecs:SpecRow[]=[
 {id:'capacity',label:'Capacity / occupancy',keys:['Capacity']},
 {id:'dimensions',label:'Dimensions',keys:['Dimensions']},
 {id:'footprint',label:'Footprint & clearance',keys:['Equipment footprint','Footprint basis','Clearance','Fit check']},
 {id:'power',label:'Power requirements',keys:['Power requirements']},
 {id:'warranty',label:'Warranty',keys:['Warranty']},
 {id:'temperature',label:'Temperature range',keys:['Temperature range']},
 {id:'heat',label:'Heat / cooling system',keys:['Heat type']},
 {id:'chiller',label:'Chiller included',keys:['Chiller included']},
 {id:'load',label:'Weight capacity',keys:['Weight capacity']},
 {id:'user',label:'User capacity / fit',keys:['User capacity','User fit']},
 {id:'resistance',label:'Resistance / weight range',keys:['Resistance','Weight range','Cable ratio']},
 {id:'materials',label:'Materials / construction',keys:['Construction','Materials','Main fabric']},
 {id:'setup',label:'Setup & installation',keys:['Setup type']},
 {id:'included',label:'What is included',keys:['Included','Not included','Safety accessories']},
 {id:'ongoing',label:'Ongoing costs',keys:['Ongoing cost','Ongoing costs','Subscription']},
 {id:'delivery',label:'Delivery & returns',keys:['Delivery','Returns']},
 {id:'basis',label:'Price basis / exclusions',keys:['Price basis']},
];
export function specValue(p:Product,row:SpecRow):string|undefined{
 if(row.id==='chiller'&&!p.attributes['Chiller included']){
  if(p.facets?.chiller?.includes('included-chiller'))return 'Included in the listed configuration';
  if(p.facets?.chiller?.includes('optional-chiller'))return 'Optional; not included in the listed configuration';
  return undefined;
 }
 const values=row.keys.filter(k=>p.attributes[k]&&!p.attributes[k].startsWith('https://')).map(k=>({key:k,value:p.attributes[k]}));
 if(!values.length)return undefined;
 if(values.length===1&&values[0].key!=='Not included')return values[0].value;
 return values.map(({key,value})=>`${key}: ${value}`).join('\n');
}
export function comparisonRows(products:Product[]):SpecRow[]{
 if(!products.length)return [];
 if(products.every(p=>p.category==='recovery')){
  const type=products[0].type;
  const required=new Set(['dimensions','power','warranty','materials','setup','included','ongoing','basis']);
  if(['sauna','cold-plunge'].includes(type))['capacity','temperature','heat'].forEach(k=>required.add(k));
  if(type==='cold-plunge')required.add('chiller');
  if(products[0].facets?.deviceType?.includes('home-gym'))['load','resistance'].forEach(k=>required.add(k));
  const rows=recoverySpecs.filter(row=>required.has(row.id)||products.some(p=>specValue(p,row)));
  const used=new Set(recoverySpecs.flatMap(row=>row.keys));
  return [...rows,...Array.from(new Set(products.flatMap(p=>Object.keys(p.attributes).filter(k=>!used.has(k)&&!p.attributes[k].startsWith('https://'))))).map(key=>({id:key,label:key,keys:[key]}))];
 }
 return Array.from(new Set(products.flatMap(p=>Object.keys(p.attributes).filter(k=>!p.attributes[k].startsWith('https://'))))).map(key=>({id:key,label:key,keys:[key]}));
}
export const sourceLinks=(p:Product)=>Array.from(new Map([{label:'Official product listing',url:p.source},...Object.entries(p.attributes).filter(([,v])=>v.startsWith('https://')).map(([k,url])=>({label:k.replace(/^Source: /,''),url}))].map(s=>[s.url,s])).values());
export const decisionFacts=(p:Product)=>[
 {label:'Space',value:p.attributes['Dimensions']||'Dimensions not documented. Confirm the installed size and access route.'},
 {label:'Power',value:p.attributes['Power requirements']||'Electrical supply not documented. Confirm the exact model requirements.'},
 {label:'Installation',value:p.attributes['Setup type']||'Setup requirements not documented.'},
 {label:'Ongoing cost',value:p.attributes['Ongoing cost']||p.attributes['Ongoing costs']||p.attributes['Subscription']||'Running costs not documented. Check consumables, energy use and any recurring fees.'},
 {label:'Warranty',value:p.attributes['Warranty']||'Coverage not documented. Confirm parts, labor and service terms.'},
];
export function ownershipNotes(p:Product){
 const sources=sourceLinks(p);const source=(pattern:RegExp)=>sources.find(s=>pattern.test(s.label))||sources[0];
 return [
 {title:'Delivery & access',fact:p.attributes['Delivery']||p.attributes['Returns'],check:'Confirm delivery to your address, curbside versus room placement, return freight and the route through doorways or stairs.',source:source(p.attributes['Delivery']?/delivery|shipping/i:/return/i)},
 {title:'Installation & space',fact:p.attributes['Clearance']||p.attributes['Equipment footprint']||p.attributes['Footprint basis'],check:'Allow operating clearance beyond the product footprint. Confirm assembly, floor support and any electrical or plumbing work using the exact model manual.',source:source(/manual|installation|specification/i)},
 {title:'Upkeep & running costs',fact:p.attributes['Ongoing cost']||p.attributes['Ongoing costs']||p.attributes['Subscription'],check:p.type==='cold-plunge'?'Check water care, filter replacements, cleaning intervals, electricity use and freeze-protection instructions.':p.type==='sauna'?'Check ventilation, cleaning, timber care, heater maintenance and electricity use.':'Check maintenance, replacement parts, energy use and any required membership or consumables.',source:source(/care|manual|setup/i)},
 {title:'Service & reliability',fact:p.attributes['Warranty'],check:'Check coverage for parts, labor and shipping, the service process and local support. Warranty length alone does not establish long-term reliability.',source:source(/warrant|guarantee|after.sales|repair policy/i)},
 ];
}
