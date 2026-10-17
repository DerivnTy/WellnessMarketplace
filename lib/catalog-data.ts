import seed from '@/data/catalog.json';
import type { Product } from './catalog';
import { productSchema } from './validation';
const defaults=new Map(seed.map(record=>{const p=productSchema.parse(record);return [p.id,p];}));
export function normalizeProduct(product:Product):Product {
  const category=product.category==='hydration'?'drinks':product.category;
  const original=defaults.get(product.id);
  // Backfill taxonomy only when the editor's source and label still match.
  // Explicit editorial facets and filter decisions always take precedence.
  const sameSource=original && original.source===product.source && original.ingredients===product.ingredients && original.name===product.name && original.category===category;
  const sameFacts=sameSource&&JSON.stringify(original.attributes)===JSON.stringify(product.attributes);
  return {...product,category,
    facets:category==='recovery'&&sameFacts&&product.facets&&Object.keys(product.facets).length>0?{...original.facets,...product.facets}:product.facets??(sameSource?original.facets:undefined),
    filters:sameSource?{...original.filters,...product.filters}:product.filters,
  };
}
