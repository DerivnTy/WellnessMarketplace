import type {Product,ResearchField,TermField} from './catalog';
import {listedPrice} from './catalog';
export type ResearchRow={id:string;label:string;keys:string[];group:'Decision details'|'Technical specifications'|'Returns and policies';question:string};
export type ResearchFact={value:string;status:'documented'|'not-documented'|'not-applicable';sourceUrl?:string;checked?:string;note?:string};
const row=(id:string,label:string,keys:string[],question:string,group:ResearchRow['group']='Technical specifications'):ResearchRow=>({id,label,keys,question,group});
export const ownershipRows:ResearchRow[]=[
 row('space','Space',['Dimensions','Equipment footprint','Clearance'],'What are the installed dimensions and required clearance?','Decision details'),
 row('power','Power',['Power requirements'],'What electrical supply and plug does this configuration require?','Decision details'),
 row('installation','Installation',['Setup type'],'What installation or assembly is required?','Decision details'),
 row('delivery','Delivery',['Delivery'],'What is the delivery arrangement for this configuration?','Decision details'),
 row('maintenance','Maintenance',['Maintenance','Water care','Care'],'What maintenance is required, and at what intervals?','Decision details'),
 row('warranty','Warranty',['Warranty'],'What does the included warranty cover?','Decision details'),
];
export const policyRows:ResearchRow[]=[row('returns','Return terms',['Returns'],'What are the return terms for this configuration?','Returns and policies'),row('returnWindow','Return window',[],'What is the return window?','Returns and policies'),row('restockingFee','Restocking fee',[],'Is there a restocking fee?','Returns and policies'),row('returnShipping','Return shipping',[],'Who pays return shipping?','Returns and policies')];
const definitions:Record<string,ResearchRow[]>={
 'cold-plunge':[row('cooling','Cooling method',['Heat type','Cooling method'],'How is the water cooled?'),row('chiller','Chiller included',['Chiller included'],'Is a chiller included in the listed configuration?'),row('temperature','Temperature range',['Temperature range'],'What temperature range is documented?'),row('capacity','Capacity',['Capacity'],'What is the usable capacity?'),row('plug','Plug type',['Plug type'],'What plug and outlet are required?'),row('water-care','Water care',['Water care'],'What water-care routine is required?')],
 sauna:[row('heat','Heat type',['Heat type'],'Which heat type is included?'),row('seats','Seats / capacity',['Capacity'],'What is the documented occupancy?'),row('interior','Interior dimensions',['Interior dimensions'],'What are the interior dimensions?'),row('exterior','Exterior dimensions',['Dimensions'],'What are the exterior dimensions?'),row('placement','Indoor / outdoor',['Placement'],'Is this configuration documented for indoor or outdoor use?')],
 'massage-chair':[row('dimensions','Upright and reclined dimensions',['Dimensions'],'What are the upright and reclined dimensions?'),row('user','User height and weight range',['User capacity','User fit','Capacity'],'What user height and weight limits apply?'),row('height-range','User height range',['User height range'],'What user height range is supported?'),row('clearance','Wall clearance',['Clearance'],'How much wall clearance is required?'),row('power-draw','Power draw',['Power consumption'],'What power draw is documented?')],
 'power-rack':[row('height','Rack height',['Height'],'What is the rack height?'),row('load','Load rating',['Weight capacity'],'What load rating applies?'),row('steel','Steel gauge / construction',['Construction'],'What steel gauge and construction are documented?'),row('holes','Hole spacing',['Hole spacing'],'What is the hole spacing?'),row('compatibility','Attachment compatibility',['Attachment compatibility'],'Which attachments are compatible?'),row('assembly-time','Assembly time',['Assembly time'],'What assembly time is documented?')],
 'adjustable-dumbbells':[row('range','Weight range',['Weight range'],'What is the weight range per dumbbell?'),row('increment','Adjustment increments',['Adjustment increments'],'What adjustment increments are available?'),row('mechanism','Adjustment mechanism',['Adjustment','Setup type'],'How is the weight adjusted?'),row('price-pound','Price per pound',['Price per pound'],'What price-per-pound basis is documented for this set?')],
 'functional-trainer':[row('ceiling','Ceiling height',['Ceiling height'],'What ceiling height is required?'),row('stack','Stack weight / resistance',['Resistance','Weight range'],'What stack weight or resistance is included?'),row('ratio','Pulley ratio',['Cable ratio','Pulley ratio'],'What is the pulley ratio?'),row('attachments','Attachments included',['Included'],'Which attachments are included?')],
 'red-light-panel':[row('wavelengths','Wavelengths',['Wavelengths'],'What wavelengths are documented?'),row('power-draw','Power draw',['Power consumption'],'What power draw is documented?')],
 'compression-boots':[row('pressure','Pressure range',['Pressure range'],'What pressure range is documented?'),row('power-draw','Power draw',['Power consumption'],'What power draw is documented?')],
};
export function specificationRows(p:Product):ResearchRow[]{
 const primary=definitions[p.type]||[];
 const used=new Set([...ownershipRows,...policyRows,...primary].flatMap(r=>r.keys));
 const extras=Object.keys(p.attributes).filter(k=>!used.has(k)&&!/^Source:|^https?:/i.test(k)&&!/^https?:/i.test(p.attributes[k])&&!['Returns','Delivery'].includes(k)).map(k=>row(k,k,[k],`What is documented for ${k.toLowerCase()}?`));
 return [...primary,...extras];
}
export function productPolicyRows(p:Product){return policyRows.filter(r=>r.id==='returns'||!!p.terms?.[r.id as TermField]||p.terms?.unverified?.includes(r.id as TermField)||!!p.research?.specs?.[r.id]);}
export function researchRows(p:Product){return [...ownershipRows,...specificationRows(p),...productPolicyRows(p)];}
const safeUrl=(value?:string)=>value&&/^https?:\/\//i.test(value)?value:undefined;
export function checkedDate(value?:string){if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value+'T12:00:00Z')))return undefined;if(new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)return undefined;return value;}
export function dateLabel(value?:string){const valid=checkedDate(value);return valid?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(valid+'T12:00:00Z')):'Not documented';}
export function priceDate(p:Product){return `${listedPrice(p.price)}${checkedDate(p.checked)?' as of '+dateLabel(p.checked):' · Date not documented'}`;}
function sourceFor(p:Product,r:ResearchRow){
 const pattern=r.id==='warranty'?/warranty/i:['returns','returnWindow','restockingFee','returnShipping'].includes(r.id)?/return/i:r.id==='delivery'?/delivery|shipping/i:r.id==='installation'?/assembly|installation|setup/i:['maintenance','water-care'].includes(r.id)?/care|maintenance/i:['space','dimensions','exterior','power','plug','power-draw'].includes(r.id)?/specification|dimensions|electrical/i:/specification|product|model/i;
 return safeUrl(Object.entries(p.attributes).find(([key,value])=>/^Source:/i.test(key)&&pattern.test(key)&&safeUrl(value))?.[1])||safeUrl(p.source);
}
export function researchFact(p:Product,r:ResearchRow):ResearchFact{
 const override=p.research?.specs?.[r.id];
 if(override){const status=override.status||(!override.value?'not-documented':'documented');return {value:status==='not-applicable'?'Not applicable':status==='not-documented'?'Not documented':override.value||'Not documented',status,sourceUrl:safeUrl(override.sourceUrl),checked:checkedDate(override.checked)};}
 const termsKey=(['returnWindow','restockingFee','returnShipping','delivery'].includes(r.id)?r.id:undefined) as TermField|undefined;
 if(termsKey&&p.terms?.unverified?.includes(termsKey))return {value:'Not documented',status:'not-documented',sourceUrl:sourceFor(p,r),checked:checkedDate(p.checked)};
 let raw=r.keys.map(k=>p.attributes[k]).filter(v=>v&&!/^https?:/i.test(v)).join('\n');
 if(!raw&&termsKey)raw=p.terms?.[termsKey]||'';
 if(r.id==='chiller'&&!raw&&p.type==='cold-plunge'){const values=p.facets?.chiller||[];raw=values.includes('included-chiller')?'Included in the listed configuration':values.includes('optional-chiller')?'Not included in the listed configuration':values.includes('ice-only')?'Ice-only setup':'';}
 const unknown=!raw||/^(?:not documented|unknown|not yet verified|not confirmed|n\/a)\.?$/i.test(raw.trim());
 const na=/^not applicable(?:\b|$)/i.test(raw)||(r.id==='power'&&/^no electrical power required\.?$/i.test(raw));
 return {value:unknown?'Not documented':na?'Not applicable':raw,status:unknown?'not-documented':na?'not-applicable':'documented',sourceUrl:sourceFor(p,r),checked:checkedDate(p.checked),...(na&&raw!=='Not applicable'?{note:raw}:{})};
}
export function productQuestions(p:Product){const missing=researchRows(p).filter(r=>researchFact(p,r).status==='not-documented');const questions=missing.slice(0,5).map(r=>r.question);if(questions.length<3&&missing.some(r=>r.id==='maintenance'))questions.push('Which maintenance tasks must the owner carry out, and which require service?');return questions;}
export function researchSources(p:Product){return [...new Map([...researchRows(p).map(r=>researchFact(p,r).sourceUrl),p.source,...Object.entries(p.attributes).filter(([k])=>/^Source:/i.test(k)).map(([,v])=>v)].filter((url):url is string=>!!safeUrl(url)).map(url=>[url,url])).values()];}
export function comparisonResearchRows(products:Product[],differences:boolean){const rows=[...new Map(products.flatMap(researchRows).map(r=>[r.id,r])).values()];return rows.filter(r=>{const facts=products.map(p=>researchFact(p,r));if(facts.every(f=>f.status==='not-documented'))return false;return !differences||products.length<2||new Set(facts.map(f=>f.status+':'+f.value)).size>1;});}
