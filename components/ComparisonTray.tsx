'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ChevronUp,X} from 'lucide-react';
import {Product,listedPrice} from '@/lib/catalog';
import {comparisonHref,relatedBrowseHref} from '@/lib/comparison';
import ProductImage from './ProductImage';

export default function ComparisonTray({products,onRemove,onClear,storageUnavailable}:{products:Product[];onRemove:(id:string)=>void;onClear:()=>void;storageUnavailable:boolean}){
 const ref=useRef<HTMLElement>(null),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),close=useRef<HTMLButtonElement>(null);
 const [drawerOpen,setDrawerOpen]=useState(false);
 useEffect(()=>{if(!ref.current)return;const measure=()=>document.documentElement.style.setProperty('--comparison-tray-height',`${ref.current?.getBoundingClientRect().height||0}px`);const ro=new ResizeObserver(measure);ro.observe(ref.current);document.body.classList.add('has-comparison-tray');measure();return()=>{ro.disconnect();document.body.classList.remove('has-comparison-tray');document.documentElement.style.removeProperty('--comparison-tray-height');};},[]);
 useEffect(()=>{
  if(!drawerOpen||!dialog.current)return;
  const node=dialog.current,y=window.scrollY,body=document.body;
  const previous={position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};
  body.style.position='fixed';body.style.top=`-${y}px`;body.style.width='100%';body.style.overflow='hidden';
  node.showModal();close.current?.focus({preventScroll:true});
  const desktop=window.matchMedia('(min-width:761px)'),resize=()=>{if(desktop.matches)setDrawerOpen(false);};desktop.addEventListener('change',resize);
  return()=>{desktop.removeEventListener('change',resize);node.close();Object.assign(body.style,previous);window.scrollTo({top:y,behavior:'instant'});if(trigger.current?.isConnected)trigger.current.focus({preventScroll:true});};
 },[drawerOpen]);
 const compareLabel=products.length>1?`Compare ${products.length} products`:'Review shortlist';
 const list=(drawer=false)=><ul id={drawer?'comparison-drawer-products':'comparison-tray-products'} className="comparison-tray-products">{products.map(p=><li key={p.id}><a href={'/product/'+p.id}><ProductImage src={p.image} alt="" sizes="56px"/><span><small>{p.brand}</small><strong>{p.name}</strong><b>{listedPrice(p.price)}</b></span></a><button type="button" aria-label={'Remove '+p.name+' from comparison'} onClick={()=>{onRemove(p.id);if(drawer)close.current?.focus({preventScroll:true});}}><X size={16}/></button></li>)}</ul>;
 const actions=<div className="comparison-tray-actions">{products.length<4&&<a className="text-link" href={relatedBrowseHref(products[0])}>Add {products.length===1?'a similar product':'another product'}</a>}<a className="button dark" href={comparisonHref(products.map(p=>p.id))}>{compareLabel}<ArrowRight size={16}/></a></div>;
 return <>
  <aside ref={ref} className="research-compare-tray" aria-label="Comparison shortlist">
   <div className="desktop-comparison-tray"><div className="comparison-tray-heading"><strong>{products.length} of 4 selected</strong><span>{storageUnavailable?'Saved for this visit only':'Your shortlist'}</span><button type="button" className="tray-clear-all" onClick={onClear}>Clear all</button></div>{list()}<div className="comparison-tray-cta"><a className="button dark" href={comparisonHref(products.map(p=>p.id))}>{compareLabel}<ArrowRight size={16}/></a>{products.length<4&&<a className="text-link" href={relatedBrowseHref(products[0])}>Add a similar product</a>}</div></div>
   <div className="mobile-comparison-launcher"><button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={drawerOpen} aria-controls="comparison-drawer" onClick={()=>setDrawerOpen(true)}><span className="shortlist-thumbnails" aria-hidden="true">{products.slice(0,2).map(p=><ProductImage key={p.id} src={p.image} alt="" sizes="32px"/>)}</span><span><strong>{products.length} of 4 selected</strong><small>View shortlist <ChevronUp size={13}/></small></span></button><a className="button dark" href={comparisonHref(products.map(p=>p.id))}>{products.length>1?'Compare':'Review'}<ArrowRight size={15}/></a></div>
  </aside>
  <dialog id="comparison-drawer" ref={dialog} className="comparison-mobile-drawer" aria-labelledby="comparison-drawer-title" aria-describedby="comparison-drawer-description" onCancel={e=>{e.preventDefault();setDrawerOpen(false);}}>
   <div className="comparison-drawer-heading"><div><span className="eyebrow">{products.length} OF 4 SELECTED</span><h2 id="comparison-drawer-title">Your comparison shortlist</h2></div><button ref={close} type="button" aria-label="Close comparison shortlist" onClick={()=>setDrawerOpen(false)}><X size={22}/></button></div>
   <p id="comparison-drawer-description">{storageUnavailable?'Available for this visit. Browser storage is unavailable.':'Keep your options together as you browse. Saved in this browser.'}</p>
   {list(true)}
   <button className="tray-clear-all" type="button" onClick={()=>{setDrawerOpen(false);onClear();}}>Clear all</button>
   {actions}
  </dialog>
 </>;
}
