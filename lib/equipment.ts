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
 {id:'load',label:'Weight capacity',keys:['Weight capacity']},
 {id:'user',label:'User capacity / fit',keys:['User capacity','User fit']},
 {id:'resistance',label:'Resistance / weight range',keys:['Resistance','Weight range','Cable ratio']},
 {id:'materials',label:'Materials / construction',keys:['Construction','Materials','Main fabric']},
 {id:'setup',label:'Setup & installation',keys:['Setup type']},
 {id:'chiller',label:'Chiller included',keys:['Chiller included']},
 {id:'included',label:'What is included',keys:['Included','Not included','Safety accessories']},
 {id:'ongoing',label:'Ongoing costs',keys:['Ongoing cost','Ongoing costs','Subscription']},
 {id:'delivery',label:'Delivery & returns',keys:['Delivery','Returns']},
 {id:'basis',label:'Price basis / exclusions',keys:['Price basis']},
];
export function specValue(p:Product,row:SpecRow):string|undefined{
 if(row.id==='chiller'){
  const facet=p.facets?.chiller?.[0];
  if(facet==='included-chiller')return 'Chiller included';
  if(facet==='optional-chiller')return 'Chiller sold separately';
  if(facet==='ice-only')return 'Ice-only setup';
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
  const required=new Set(['dimensions','footprint','power','warranty','materials','setup','included','ongoing','basis']);
  if(['sauna','cold-plunge'].includes(type))['capacity','temperature','heat'].forEach(k=>required.add(k));
  if(type==='cold-plunge')required.add('chiller');
  if(type==='massage-chair')required.add('user');
  if(products[0].facets?.deviceType?.includes('home-gym'))['load','resistance','user'].forEach(k=>required.add(k));
  const rows=recoverySpecs.filter(row=>required.has(row.id)||products.some(p=>specValue(p,row)));
  const used=new Set(recoverySpecs.flatMap(row=>row.keys));
  return [...rows,...Array.from(new Set(products.flatMap(p=>Object.keys(p.attributes).filter(k=>!used.has(k)&&!p.attributes[k].startsWith('https://'))))).map(key=>({id:key,label:key,keys:[key]}))];
 }
 const always:Record<string,string[]>={
  drinks:['Added sugar','Total sugar','Caffeine','Serving size'],
  supplements:['Form','Serving size','Amount per serving','Testing'],
  apparel:['Main fabric','Fit','Care'],
  nutrition:['Protein','Added sugar','Total sugar','Contains'],
 };
 const present=Array.from(new Set(products.flatMap(p=>Object.keys(p.attributes).filter(k=>!p.attributes[k].startsWith('https://')))));
 const category=products[0].category;
 return [...new Set([...(always[category]||[]),...present])].map(key=>({id:key,label:key,keys:[key]}));
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
export const notListedByBrand='Not listed by brand';
export type PurchaseMatter={id:string;label:string;fact:string;note:string;sourceUrl:string;sourceLabel:string};
function recorded(value?:string){const text=value?.trim();return text||notListedByBrand;}
function recordedLines(parts:Array<string|false|undefined>){const lines=parts.filter((part):part is string=>typeof part==='string'&&part.trim().length>0);return lines.length?lines.join('\n'):notListedByBrand;}
export function purchaseMatters(p:Product):PurchaseMatter[]{
 const sources=sourceLinks(p);
 const withSource=(id:string,label:string,fact:string,note:string,pattern:RegExp):PurchaseMatter=>{
  const source=sources.find(item=>pattern.test(item.label))||sources[0]||{label:'Official product listing',url:p.source};
  return {id,label,fact,note,sourceUrl:source.url,sourceLabel:source.label};
 };
 if(p.category==='recovery'){
  const upkeep=p.type==='cold-plunge'?'Check water care, filter changes, cleaning and electricity use in the model manual.':p.type==='sauna'?'Check ventilation, cleaning, heater care and electricity use in the model manual.':'Check upkeep, replacement parts, energy use and any recurring fee in the brand materials.';
  return [
   withSource('space','Space',recorded(p.attributes['Dimensions']||p.attributes['Equipment footprint']||p.attributes['Footprint basis']),'Confirm clearance beyond the product footprint and the route through doorways or stairs.',/dimension|specification|manual|footprint/i),
   withSource('power','Power',recorded(p.attributes['Power requirements']),'A listed voltage does not confirm the outlet, circuit or installation at your address.',/power|electrical|specification|manual/i),
   withSource('installation','Installation',recorded(p.attributes['Setup type']),'Confirm assembly, floor support and any electrical or plumbing work for this exact model.',/setup|install|manual|specification/i),
   withSource('delivery','Delivery',recordedLines([p.attributes['Delivery']&&`Delivery: ${p.attributes['Delivery']}`,p.attributes['Returns']&&`Returns: ${p.attributes['Returns']}`]),'Confirm delivery to your address, placement and return freight with the brand.',/delivery|shipping|return/i),
   withSource('maintenance','Maintenance',recorded(p.attributes['Ongoing cost']||p.attributes['Ongoing costs']||p.attributes['Subscription']),upkeep,/care|manual|ongoing|subscription/i),
   withSource('warranty','Warranty',recorded(p.attributes['Warranty']),'Warranty length does not establish reliability. Confirm parts, labor, shipping and exclusions.',/warrant|guarantee|after.sales|repair policy/i),
  ];
 }
 if(p.category==='drinks')return [
  withSource('sugar','Sugar',recordedLines([p.attributes['Added sugar']&&`Added sugar: ${p.attributes['Added sugar']}`,p.attributes['Total sugar']&&`Total sugar: ${p.attributes['Total sugar']}`]),'No added sugar and no total sugar are different. An unlisted amount stays unknown.',/nutrition|label|ingredient/i),
  withSource('caffeine','Caffeine',recorded(p.attributes['Caffeine']),'Compare the amount per listed serving when the brand gives one.',/caffeine|label|nutrition/i),
  withSource('sweeteners','Sweeteners',recorded(p.attributes['Sweeteners']||p.attributes['Sweetener']),'A formula can list more than one sweetener. Absence is not assumed.',/ingredient|label|sweet/i),
  withSource('serving','Serving',recorded(p.attributes['Serving size']||p.attributes['Serving']),'Price per serving uses the recorded serving count when that count is listed.',/serving|nutrition|label/i),
 ];
 if(p.category==='supplements')return [
  withSource('form','Form',recorded(p.attributes['Form']||p.attributes['Supplement form']),'The listed form is the option in this record, not every version the brand sells.',/label|supplement|ingredient/i),
  withSource('serving','Serving',recordedLines([p.attributes['Serving size']&&`Serving size: ${p.attributes['Serving size']}`,p.attributes['Amount per serving']&&`Amount per serving: ${p.attributes['Amount per serving']}`]),'Compare labeled amounts per serving, not per container, unless the listing says otherwise.',/serving|label|supplement/i),
  withSource('ingredients','Other ingredients',recorded(p.attributes['Other ingredients']||p.attributes['Ingredients']||p.attributes['Full ingredient panel']),'A short ingredient line is not the full label when the listing does not say it is.',/ingredient|label/i),
  withSource('testing','Testing',recorded(p.attributes['Testing']||p.attributes['Testing scope']),'A brand link to batch results is not an independent verification of the unit you receive.',/test|coa|lab/i),
 ];
 if(p.category==='apparel')return [
  withSource('fabric','Main fabric',recorded(p.attributes['Main fabric']||p.attributes['Fabric']),'The main fabric can differ from waistbands, trims and stitching.',/fabric|material|fiber/i),
  withSource('components','Components',recordedLines([p.attributes['Waistband']&&`Waistband: ${p.attributes['Waistband']}`,p.attributes['Trims and stitching']&&`Trims and stitching: ${p.attributes['Trims and stitching']}`,p.attributes['Panels, trims and stitching']&&`Panels, trims and stitching: ${p.attributes['Panels, trims and stitching']}`]),'Component fibers are listed only when the brand records them.',/fabric|material|component/i),
  withSource('fit','Fit',recorded(p.attributes['Fit']),'Fit names are the brand’s description, not a measurement of a particular body.',/fit|size|spec/i),
  withSource('care','Care and returns',recordedLines([p.attributes['Care']&&`Care: ${p.attributes['Care']}`,p.attributes['Returns']&&`Returns: ${p.attributes['Returns']}`]),'Confirm the current return window with the brand before ordering.',/care|return|policy/i),
 ];
 return [
  withSource('ingredients','Ingredients',recorded(p.attributes['Ingredients']||p.attributes['Contains']),'Allergen statements are included here only when the listing records them.',/ingredient|label|allergen/i),
  withSource('sugar','Sugar',recordedLines([p.attributes['Added sugar']&&`Added sugar: ${p.attributes['Added sugar']}`,p.attributes['Total sugar']&&`Total sugar: ${p.attributes['Total sugar']}`]),'No added sugar and no total sugar are different.',/nutrition|label|sugar/i),
  withSource('protein','Protein',recorded(p.attributes['Protein']),'The amount is for the listed serving or bar, as the brand wrote it.',/nutrition|protein|label/i),
  withSource('serving','Serving',recorded(p.attributes['Serving size']||p.attributes['Serving']),'Use the recorded serving when comparing products.',/serving|nutrition|label/i),
 ];
}
