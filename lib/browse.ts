import type {Product} from './catalog';
export type BrowseState={category:string;q:string;selected:Record<string,string[]>;filters:string[];brands:string[];min:string;max:string;sort:string};
export const goalOptions=[['calm','Calm & stress'],['sleep','Sleep support'],['brain','Brain & focus'],['hormonal','Hormonal support'],['gut','Gut & digestion'],['heart','Heart support'],['immune','Immune support'],['performance','Performance']];
export const drinkOptions=[['hydration','Daily hydration'],['sport','Sport & electrolytes'],['energy','Energy & focus'],['calm','Calm & unwind'],['gut','Prebiotic & gut']];
export const names:Record<string,string>={'5-htp':'5-HTP',gaba:'GABA',dha:'DHA',hmb:'HMB',whey:'Whey protein','vitamin-c':'Vitamin C','vitamin-b6':'Vitamin B6',inositol:'Inositol',apigenin:'Apigenin',unsweetened:'Unsweetened',capsule:'Capsules',gummy:'Gummies',powder:'Powders',softgel:'Softgels',liquid:'Liquids',tablet:'Tablets',can:'Cans',bottle:'Bottles',ashwagandha:'Ashwagandha',magnesium:'Magnesium','l-theanine':'L-theanine',melatonin:'Melatonin','lions-mane':"Lion’s mane",creatine:'Creatine','omega-3':'Omega-3',coq10:'CoQ10','vitamin-d':'Vitamin D',zinc:'Zinc',probiotic:'Probiotics',vitex:'Vitex',vegan:'Vegan',vegetarian:'Vegetarian','gluten-free':'Gluten-free',stevia:'Stevia','monk-fruit':'Monk fruit',sucralose:'Sucralose','acesulfame-k':'Acesulfame K',sugar:'Sugar',allulose:'Allulose',erythritol:'Erythritol','caffeine-free':'0 mg caffeine',low:'1–80 mg caffeine',moderate:'81–150 mg caffeine',high:'151+ mg caffeine',cotton:'Cotton',hemp:'Hemp',linen:'Linen',wool:'Wool',tee:'T-shirts',underwear:'Underwear',socks:'Socks',leggings:'Leggings',shorts:'Shorts','lounge-pants':'Lounge pants',mens:'Men’s',womens:'Women’s',unisex:'Unisex','protein-bar':'Protein bars','energy-chew':'Energy chews','red-light-panel':'Red light panels','60':'60 LEDs','100':'100 LEDs'};
export const facetKeys=['goals','ingredient','form','dietary','drinkType','caffeine','sweetener','garment','material','fit','foodType','deviceType','ledCount'];
export const preferenceLabels:Record<string,string>={madeInUSA:'Made in USA',noAddedSugar:'0g added sugar',zeroSugar:'0g total sugar',stevia:'Contains stevia',cotton:'Cotton in main fabric',testing:'Brand links to batch results',noMelatonin:'No melatonin listed',caffeineFree:'No caffeine listed',noStevia:'No stevia listed',noSucralose:'No sucralose listed',organicCotton:'Organic cotton listed',allNaturalMain:'100% natural main fabric',noPolyester:'No polyester in main fabric',noElastane:'No elastane in main fabric',vegan:'Vegan claim',glutenFree:'Gluten-free claim'};
export type FacetGroup={key:string;label:string;hint?:string;options?:string[][]};
export const facetGroups:Record<string,FacetGroup[]>={
 supplements:[{key:'goals',label:'Support goal',options:goalOptions},{key:'ingredient',label:'Featured ingredient'},{key:'form',label:'Supplement form'},{key:'dietary',label:'Dietary preferences',hint:'As described by the brand.'}],
 drinks:[{key:'drinkType',label:'Drink type',options:drinkOptions},{key:'form',label:'Format'},{key:'caffeine',label:'Caffeine per serving',options:[['caffeine-free','0 mg'],['low','1–80 mg'],['moderate','81–150 mg'],['high','151+ mg']]},{key:'sweetener',label:'Sweeteners listed',hint:'A formula can contain more than one.'}],
 apparel:[{key:'garment',label:'Garment type'},{key:'material',label:'Main fabric contains',hint:'Blends can contain other fibers.'},{key:'fit',label:'Collection'}],
 nutrition:[{key:'foodType',label:'Food type'},{key:'dietary',label:'Dietary preferences'}],
 recovery:[{key:'deviceType',label:'Device type'},{key:'ledCount',label:'LED count'}],
};
export const preferenceGroups:Record<string,{label:string;keys:string[];hint:string}[]>={
 supplements:[{label:'Leave out',keys:['noMelatonin','caffeineFree'],hint:'Requires a complete documented ingredient list or an explicit brand statement.'},{label:'Source transparency',keys:['testing'],hint:'A link to results is not an independent verification of this product lot.'}],
 drinks:[{label:'Sugar preferences',keys:['noAddedSugar','zeroSugar'],hint:'No added sugar and no total sugar are different.'},{label:'Leave out',keys:['noStevia','noSucralose'],hint:'Unknown ingredients never count as absent.'}],
 apparel:[{label:'Fabric preferences',keys:['organicCotton','allNaturalMain'],hint:'These describe the main fabric, not every component.'},{label:'Leave out of main fabric',keys:['noPolyester','noElastane'],hint:'Waistbands, stitching and trims may differ. See product details.'}],
 nutrition:[{label:'Sugar preferences',keys:['noAddedSugar','zeroSugar'],hint:'Documented values per labeled serving.'}],
 recovery:[],
};
export const labelFor=(id:string)=>names[id]||id.split('-').map(s=>s[0]?.toUpperCase()+s.slice(1)).join(' ');
export const categoryHref=(id:string)=>id==='supplements'?'/supplements':id==='drinks'?'/drinks':id?'/category/'+id:'/shop';
const values=(v:unknown)=>typeof v==='string'?Array.from(new Set(v.split(',').filter(Boolean))):[];
export function parseBrowse(category:string,query:Record<string,unknown>):BrowseState{
 const legacy=category==='hydration'||query.category==='hydration';
 const cat=category||String(query.category||'');
 const selected:Record<string,string[]>={};for(const key of facetKeys){const v=values(query[key]);if(v.length)selected[key]=v;}
 if(legacy&&!selected.drinkType)selected.drinkType=['hydration'];
 return {category:cat==='hydration'?'drinks':cat,q:String(query.q||''),selected,filters:values(query.filters).filter(k=>k in preferenceLabels),brands:values(query.brands||query.brand),min:validPrice(query.min),max:validPrice(query.max),sort:['price-asc','price-desc','name'].includes(String(query.sort))?String(query.sort):'featured'};
}
const validPrice=(v:unknown)=>v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?String(Number(v)):'';
export function browseUrl(s:BrowseState){const p=new URLSearchParams();if(s.q)p.set('q',s.q);for(const key of facetKeys)if(s.selected[key]?.length)p.set(key,s.selected[key].join(','));if(s.filters.length)p.set('filters',s.filters.join(','));if(s.brands.length)p.set('brands',s.brands.join(','));if(s.min)p.set('min',s.min);if(s.max)p.set('max',s.max);if(s.sort!=='featured')p.set('sort',s.sort);return categoryHref(s.category)+(p.size?'?'+p.toString():'');}
export function matches(p:Product,s:BrowseState,ignore?:string){
 if(p.status!=='published'||s.category&&p.category!==s.category)return false;
 if(ignore!=='brands'&&s.brands.length&&!s.brands.includes(p.brandId))return false;
 if(s.min&&p.price<Number(s.min)||s.max&&p.price>Number(s.max))return false;
 const text=[p.name,p.brand,p.description,p.ingredients,p.category,...p.badges,...Object.values(p.attributes),...Object.values(p.facets||{}).flat()].join(' ').toLowerCase().replace(/[^a-z0-9]+/g,' ');
 const terms=s.q.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);if(!terms.every(t=>text.includes(t)))return false;
 if(!s.filters.filter(k=>k!==ignore).every(k=>(k==='madeInUSA'?isMadeInUSA(p):p.filters[k]===true)))return false;
 return Object.entries(s.selected).every(([key,v])=>key===ignore||!v.length||v.some(value=>p.facets?.[key]?.includes(value)));
}
export function filterProducts(products:Product[],s:BrowseState){const result=products.filter(p=>matches(p,s));if(s.sort==='price-asc')result.sort((a,b)=>a.price-b.price);if(s.sort==='price-desc')result.sort((a,b)=>b.price-a.price);if(s.sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));return result;}
export function optionsFor(products:Product[],category:string,group:FacetGroup){const actual=new Set(products.filter(p=>!category||p.category===category).flatMap(p=>p.facets?.[group.key]||[]));const predefined=group.options||[];return [...predefined.filter(([id])=>actual.has(id)),...Array.from(actual).filter(id=>!predefined.some(([v])=>v===id)).sort().map(id=>[id,labelFor(id)])];}

// Only an explicit product-origin statement with a source qualifies.
export function isMadeInUSA(p:Product){return !!p.attributes['Manufacturing source'] && ['USA','United States','United States of America'].includes(p.attributes['Made in']||'');}
