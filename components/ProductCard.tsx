'use client';

import {Check, Heart, ShoppingCart, Scale} from 'lucide-react';
import {money, type Product} from '@/lib/catalog';
import type {TrustSummary} from '@/lib/trust';
import {isMadeInUSA} from '@/lib/browse';
import {cardFacts} from '@/lib/card-facts';
import BrandEvidenceBadge from './BrandEvidenceBadge';
import ProductImage from './ProductImage';

type Props = {
  product: Product;
  evidence?: TrustSummary;
  saved: boolean;
  compared: boolean;
  cartDisabled: boolean;
  onSave: (id: string) => void;
  onCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  variant?: 'listing';
};

export default function ProductCard({product: p, evidence, saved, compared, cartDisabled, onSave, onCompare, onAddToCart, variant}: Props) {
  if (variant === 'listing') return <ListingCard product={p} evidence={evidence} compared={compared} onCompare={onCompare}/>;
  const badges = Array.from(new Set([...(isMadeInUSA(p) ? ['Made in USA · Brand statement'] : []), ...p.badges])).slice(0, 3);
  return <article className={"product-card "+(p.category==='recovery'?'equipment-card':'')}>
    <div className="product-visual">
      <a href={'/product/' + p.id} aria-label={`View ${p.brand} ${p.name}`}><ProductImage src={p.image} alt={`${p.name}, ${p.brand}`}/></a>
      <button type="button" className={'save-button ' + (saved ? 'selected' : '')} aria-label={`${saved ? 'Unsave' : 'Save'} ${p.name}`} aria-pressed={saved} onClick={() => onSave(p.id)}><Heart size={17} fill={saved ? 'currentColor' : 'none'}/></button>
      {!p.available && <span className="image-label">Check availability</span>}
    </div>
    <div className="product-info">
      <a className="brand-label" href={'/brands/' + p.brandId}>{p.brand}</a>
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

function ListingCard({product: p, evidence, compared, onCompare}: {product: Product; evidence?: TrustSummary; compared: boolean; onCompare: (product: Product) => void}) {
  const facts = cardFacts(p);
  return <article className={'product-card listing-card' + (p.category === 'recovery' ? ' equipment-card' : '')}>
    <div className="product-visual">
      <a href={'/product/' + p.id} aria-label={`View ${p.brand} ${p.name}`}><ProductImage src={p.image} alt={`${p.name}, ${p.brand}`} sizes="(max-width: 759px) 45vw, (max-width: 1099px) 40vw, (max-width: 1449px) 25vw, 320px"/></a>
      {!p.available && <span className="image-label">Check availability</span>}
    </div>
    <div className="product-info">
      <a className="brand-label" href={'/brands/' + p.brandId}>{p.brand}</a>
      <h3 className="product-name"><a href={'/product/' + p.id}>{p.name}</a></h3>
      <div className="price">{money(p.price)} <span>{p.qty}</span></div>
      <p className="card-facts" title={facts.map(fact => `${fact.label}: ${fact.value}`).join(' · ')}>
        {facts.map((fact, index) => <span key={fact.label}>{index > 0 && ' · '}{fact.label}: {fact.value === 'Not documented' ? <span className="unknown">Not documented</span> : fact.value}</span>)}
      </p>
      <BrandEvidenceBadge brandId={p.brandId} summary={evidence}/>
      <div className="product-shopping-actions">
        <a className="card-view" href={'/product/' + p.id}>View product</a>
        <button type="button" className={'compare-action' + (compared ? ' selected' : '')} aria-label={'Compare ' + p.name} aria-pressed={compared} onClick={() => onCompare(p)}>{compared ? 'In comparison' : 'Compare'}</button>
      </div>
    </div>
  </article>;
}
