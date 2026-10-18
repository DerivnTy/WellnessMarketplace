'use client';
import type {ReactNode} from 'react';
import type {Product} from '@/lib/catalog';
const copy:Record<string,{title:string;description:string}>={
 supplements:{title:'Supplements',description:'Compare ingredients, serving sizes and documented testing details.'},
 drinks:{title:'Drinks & hydration',description:'Explore drink types, then compare sugar, sweeteners and caffeine.'},
 apparel:{title:'Natural-fiber apparel',description:'Compare garment types, fabric composition and care requirements.'},
};
export function DepartmentHero({category,products}:{category:string;products:Product[]}){
 return <section className="department-hero"><div className="department-copy"><h1>{copy[category].title}</h1><p>{copy[category].description}</p><p className="department-meta">{products.length} products · {new Set(products.map(p=>p.brandId)).size} brands</p></div></section>;
}
export function SmoothProductGrid({products,renderCard}:{products:Product[];renderCard:(p:Product)=>ReactNode}){
 return <ul className="product-grid listing-grid smooth-product-grid" aria-label="Products">{products.map(p=><li className="product-motion-item" key={p.id}>{renderCard(p)}</li>)}</ul>;
}
