'use client';

import Link from 'next/link';
import {Check, Heart, ShoppingCart, Scale} from 'lucide-react';
import {money, type Product} from '@/lib/catalog';
import type {TrustSummary} from '@/lib/trust';
import {isMadeInUSA} from '@/lib/browse';
import BrandEvidenceBadge from './BrandEvidenceBadge';

type Props = {
  product: Product;
  evidence?: TrustSummary;
  saved: boolean;
  compared: boolean;
  cartDisabled: boolean;
  onSave: (id: string) => void;
  onCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
};

export default function ProductCard({product: p, evidence, saved, compared, cartDisabled, onSave, onCompare, onAddToCart}: Props) {
  const badges = Array.from(new Set([...(isMadeInUSA(p) ? ['Made in USA · Brand statement'] : []), ...p.badges])).slice(0, 3);
  return <article className={"product-card "+(p.category==='recovery'?'equipment-card':'')}>
    <div className="product-visual">
      <a href={'/product/' + p.id} aria-label={`View ${p.brand} ${p.name}`}><img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy"/></a>
      <button type="button" className={'save-button ' + (saved ? 'selected' : '')} aria-label={`${saved ? 'Unsave' : 'Save'} ${p.name}`} aria-pressed={saved} onClick={() => onSave(p.id)}><Heart size={17} fill={saved ? 'currentColor' : 'none'}/></button>
      {!p.available && <span className="image-label">Check availability</span>}
    </div>
    <div className="product-info">
      <Link prefetch={false} className="brand-label" href={'/brands/' + p.brandId}>{p.brand}</Link>
      <a className="product-name" href={'/product/' + p.id}>{p.name}</a>
      <div className="price">{money(p.price)} <span>{p.qty}</span></div>
      <div className="product-badges">{badges.map(badge => <span className="attribute-tag" key={badge}>{badge}</span>)}</div>
      <BrandEvidenceBadge brandId={p.brandId} summary={evidence}/>
      <div className="product-shopping-actions">
        <button type="button" className="card-cart-button" aria-label={'Add ' + p.name + ' to cart'} disabled={cartDisabled || !p.available} onClick={() => onAddToCart(p)}><ShoppingCart size={14}/>Add to cart</button>
        <button type="button" className={'compare-action ' + (compared ? 'selected' : '')} aria-label={'Compare ' + p.name} aria-pressed={compared} onClick={() => onCompare(p)}>{p.category==='recovery'?(compared?<Check size={16}/>:<Scale size={16}/>):<span className="checkbox">{compared && <Check size={11}/>}</span>}{compared?'In comparison':'Compare'}</button>
      </div>
    </div>
  </article>;
}
