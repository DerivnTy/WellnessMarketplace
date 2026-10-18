'use client';
import {Check} from 'lucide-react';
import {listedPrice,type Product} from '@/lib/catalog';
import type {TrustSummary} from '@/lib/trust';
import {cardFacts} from '@/lib/card-facts';
import BrandEvidenceBadge from './BrandEvidenceBadge';
import ProductImage from './ProductImage';

type Props={product:Product;evidence?:TrustSummary;saved:boolean;compared:boolean;cartDisabled:boolean;onSave:(id:string)=>void;onCompare:(product:Product)=>void;onAddToCart:(product:Product)=>void;variant?:'listing'};
export default function ProductCard({product:p,evidence,compared,onCompare}:Props){
 const fact=cardFacts(p)[0];
 return <article className="product-card research-product-card">
  <a className="research-card-image" href={'/product/'+p.id} aria-label={'View '+p.brand+' '+p.name}><ProductImage src={p.image} alt={p.name+', '+p.brand} sizes="(max-width: 599px) 90vw, (max-width: 1099px) 44vw, 420px"/></a>
  <div className="research-card-body">
   <a className="research-card-brand" href={'/brands/'+p.brandId}>{p.brand}</a>
   <h3><a href={'/product/'+p.id}>{p.name}</a></h3>
   <div className="research-card-price">{listedPrice(p.price)}<span>{p.qty}</span></div>
   <p className="research-card-date">Price checked: <time dateTime={p.checked}>{p.checked||'Not documented'}</time></p>
   <p className="research-card-spec"><span>{fact?.label||'Specification'}</span> {fact?.value||'Not documented'}</p>
   <BrandEvidenceBadge brandId={p.brandId} summary={evidence}/>
   <button type="button" className={'research-card-compare '+(compared?'selected':'')} aria-label={'Compare '+p.name} aria-pressed={compared} onClick={()=>onCompare(p)}>{compared&&<Check size={16} aria-hidden="true"/>}{compared?'In comparison':'Compare'}</button>
  </div>
 </article>;
}
