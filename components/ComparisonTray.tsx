'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ChevronDown,ChevronUp,X} from 'lucide-react';
import {Product,money} from '@/lib/catalog';
import {comparisonHref,relatedBrowseHref} from '@/lib/comparison';
export default function ComparisonTray({products,onRemove,onClear,storageUnavailable}:{products:Product[];onRemove:(id:string)=>void;onClear:()=>void;storageUnavailable:boolean}){
 const ref=useRef<HTMLElement>(null);const [expanded,setExpanded]=useState(true);
 useEffect(()=>{if(!ref.current)return;const measure=()=>document.documentElement.style.setProperty('--comparison-tray-height',`${ref.current?.getBoundingClientRect().height||0}px`);const ro=new ResizeObserver(measure);ro.observe(ref.current);document.body.classList.add('has-comparison-tray');measure();return()=>{ro.disconnect();document.body.classList.remove('has-comparison-tray');document.documentElement.style.removeProperty('--comparison-tray-height');};},[]);
 return <aside ref={ref} className="research-compare-tray" aria-label="Comparison shortlist">
  <div className="comparison-tray-heading"><div><strong>{products.length} of 4 selected</strong><span>{storageUnavailable?'Available for this visit. Browser storage is unavailable.':'Your comparison shortlist'}</span></div><button type="button" className="tray-collapse" aria-expanded={expanded} aria-controls="comparison-tray-products" onClick={()=>setExpanded(!expanded)}>{expanded?'Hide items':'Show items'}{expanded?<ChevronDown size={15}/>:<ChevronUp size={15}/>}</button><button type="button" className="tray-clear-all" onClick={onClear}>Clear all</button></div>
  {expanded&&<ul id="comparison-tray-products" className="comparison-tray-products">{products.map(p=><li key={p.id}><Link prefetch={false} href={'/product/'+p.id}><img src={p.image} alt=""/><span><small>{p.brand}</small><strong>{p.name}</strong><b>{money(p.price)}</b></span></Link><button type="button" aria-label={'Remove '+p.name+' from comparison'} onClick={()=>onRemove(p.id)}><X size={16}/></button></li>)}</ul>}
  <div className="comparison-tray-actions"><Link prefetch={false} className="text-link" href={relatedBrowseHref(products[0])}>Add {products.length===1?'a similar product':'another product'}</Link><Link prefetch={false} className="button dark" href={comparisonHref(products.map(p=>p.id))}>{products.length>1?`Compare ${products.length} products`:'Review shortlist'}<ArrowRight size={16}/></Link></div>
 </aside>;
}
