export type Product = {
  id: string; slug: string; name: string; brand: string; brandId: string;
  category: string; type: string; description: string; image: string;
  price: number; qty: string; variant: string; servings?: number;
  source: string; url: string; checked: string; available: boolean;
  status: string; affiliate: boolean; badges: string[];
  attributes: Record<string, string>; ingredients: string;
  filters: Record<string, boolean>;
  facets?: Record<string, string[]>;
};
export type Assessment = {
  id: string; entity: string; scope: 'product' | 'brand' | 'merchant';
  score: number; summary: string; sources: {url: string; label: string}[];
  topics: string[]; coverage: string; limitations: string; reviewed: string;
  status: string; methodology: string;
};
export const categories = [
  { id:'drinks', name:'Drinks & hydration', caption:'Hydrate, energize, unwind', image:'cure-tropical-punch' },
  { id:'nutrition', name:'Food & nutrition', caption:'Fuel for your everyday', image:'btr-cinnamon' },
  { id:'supplements', name:'Supplements', caption:'Know what goes in', image:'puori-unflavored' },
  { id:'apparel', name:'Natural-fiber apparel', caption:'A closer look at materials', image:'wama-boxer' },
  { id:'recovery', name:'Recovery & devices', caption:'Make space to recharge', image:'hooga-hg300' },
];
export const money = (n: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
export const merchantLinkNote = (affiliate: boolean) => affiliate ? 'We may earn a commission if you buy from the brand.' : 'Direct merchant link.';
export const filterLabels: Record<string,string> = {noAddedSugar:'0g added sugar',zeroSugar:'0g total sugar',stevia:'Contains stevia',cotton:'Cotton in main fabric',testing:'Brand links to batch results'};
export function matchingProducts(products: Product[], query: string, category: string, filters: string[], sort: string, brand = '') {
  const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result=products.filter(p=>p.status==='published' && (!category||p.category===(category==='hydration'?'drinks':category)) && (!brand||p.brandId===brand) && terms.every(t=>`${p.name} ${p.brand} ${p.description} ${p.category} ${p.ingredients} ${Object.values(p.attributes).join(' ')} ${Object.values(p.facets||{}).flat().join(' ')} ${p.badges.join(' ')}`.toLowerCase().includes(t)) && filters.every(f=>p.filters[f]===true));
  if(sort==='price-asc')result.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc')result.sort((a,b)=>b.price-a.price);
  if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
  return result;
}
export function canCompare(selected: Product[], next: Product) {
  return selected.length<4 && (!selected.length || selected.every(p=>p.type===next.type));
}
export function scoreFor(assessments: Assessment[], p: Product) {
  return assessments.find(a=>a.scope==='product' && a.entity===p.id && a.status==='published');
}
