'use client';
import type {ReactNode} from 'react';
import {categories,type Product} from '@/lib/catalog';

// Static presentation; reduced-motion preferences are honored silently in CSS.
export const usePageMotion=()=>({running:false,paused:true,reduced:true,toggle:()=>{}});
export function HomeMotion({children,className=''}:{children:ReactNode;className?:string;refreshKey?:string}){
 return <div className={'home-motion '+className} data-motion="paused">{children}</div>;
}
export function MotionToggle(_props:{compact?:boolean}){return null;}
const featuredBrands=['cure','goodonya','b-t-r-nation','wama','puori','hooga','momentous','gorgie','woolly','promix','maryruths','olipop'];
export function BrandCarousel({products,brandIds=featuredBrands}:{products:Product[];brandIds?:string[]}){
 const brands=brandIds.flatMap(id=>{const product=products.find(p=>p.brandId===id);return product?[product]:[];});
 return <ul className="static-brand-list" aria-label="Brands in this department">{brands.map(p=><li key={p.brandId}><a href={'/brands/'+p.brandId}><strong>{p.brand}</strong><span>{categories.find(c=>c.id===p.category)?.name}</span></a></li>)}</ul>;
}
