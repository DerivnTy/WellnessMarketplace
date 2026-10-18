'use client';
import {Fragment,useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Plus,Search,X,Scale} from 'lucide-react';
import {Product,listedPrice,money} from '@/lib/catalog';
import type {TrustSummary} from '@/lib/trust';
import {comparisonRows,comparisonValue,comparisonSections,visibleComparisonRows} from '@/lib/equipment';
import {relatedBrowseHref} from '@/lib/comparison';
import BrandEvidenceBadge from './BrandEvidenceBadge';
import ProductImage from './ProductImage';

export default function ComparisonPage({selected,products,onChange,summaries,ready}:{selected:Product[];products:Product[];onChange:(ids:string[])=>void;summaries:TrustSummary[];ready:boolean}){
 const [query,setQuery]=useState(''),[adding,setAdding]=useState(false),[differences,setDifferences]=useState(false);
 const scroll=useRef<HTMLDivElement>(null),addButton=useRef<HTMLButtonElement>(null);
 const [edges,setEdges]=useState({left:false,right:false});
 const ids=selected.map(p=>p.id);
 const candidates=products.filter(p=>p.status==='published'&&!ids.includes(p.id)&&(!selected.length||p.type===selected[0].type)&&`${p.brand} ${p.name}`.toLowerCase().includes(query.toLowerCase()));
 const sections=comparisonSections(visibleComparisonRows(comparisonRows(selected),selected,differences));
 useEffect(()=>{
  const node=scroll.current;if(!node)return;
  const measure=()=>setEdges({left:node.scrollLeft>2,right:node.scrollLeft+node.clientWidth<node.scrollWidth-2});
  const observer=new ResizeObserver(measure);observer.observe(node);node.addEventListener('scroll',measure,{passive:true});measure();
  return()=>{observer.disconnect();node.removeEventListener('scroll',measure);};
 },[ready,ids.join(',')]);
 const move=(direction:number)=>{const node=scroll.current;if(node)node.scrollBy({left:direction*(node.querySelector('td')?.getBoundingClientRect().width||240),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 const closePicker=()=>{setAdding(false);setQuery('');addButton.current?.focus();};
 return <div className="section research-comparison">
  <div className="page-heading"><div><span className="eyebrow">RESEARCH SIDE BY SIDE</span><h1>See the differences.</h1><p>The same specifications. A clearer view of your options.</p></div>{selected.length>0&&<button className="button light" onClick={()=>onChange([])}>Clear comparison<X size={16}/></button>}</div>
  {!ready?<p role="status">Loading your comparison…</p>:<>
   <div className="comparison-controls"><button ref={addButton} className="button dark" disabled={selected.length>=4} aria-expanded={adding} aria-controls="compare-add-panel" onClick={()=>setAdding(!adding)}><Plus size={17}/>{selected.length===4?'4 of 4 selected':'Add a product'}</button><a className="text-link" href={relatedBrowseHref(selected[0])}>Browse {selected.length?'similar products':'Recovery & devices'}<ArrowUpRight size={15}/></a>{selected.length>1&&<label className="difference-toggle"><input type="checkbox" checked={differences} onChange={e=>setDifferences(e.target.checked)}/>Show differences only</label>}</div>
   {adding&&selected.length<4&&<section id="compare-add-panel" className="comparison-picker" aria-label="Add a product to compare" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();closePicker();}}}>
    <div className="comparison-picker-heading"><h2>Add to your comparison</h2><button aria-label="Close product search" onClick={closePicker}><X size={20}/></button></div>
    <label><Search size={18}/><input autoFocus aria-label="Find a product to compare" placeholder={selected.length?'Search products of the same type':'Search the catalog'} value={query} onChange={e=>setQuery(e.target.value)}/></label><p>{selected.length?'Only products of the same type appear here. Your current selection stays in place.':'Choose a product to start a focused comparison.'}</p>
    <ul>{candidates.slice(0,12).map(p=><li key={p.id}><ProductImage src={p.image} alt={`${p.name}, ${p.brand}`} sizes="64px"/><div><small>{p.brand}</small><strong>{p.name}</strong><span>{listedPrice(p.price)} · {p.qty}</span></div><button className="button light" aria-label={'Add '+p.name+' to comparison'} onClick={()=>{onChange([...ids,p.id]);closePicker();}}>Add<Plus size={15}/></button></li>)}</ul>{!candidates.length?<p role="status">No matching products. Try another name.</p>:candidates.length>12&&<p>Showing 12 of {candidates.length} matches. Search to narrow the list.</p>}
   </section>}
   {!selected.length?<div className="empty-state"><Scale size={32}/><h2>Start with the equipment you’re considering.</h2><p>Select up to four products of the same type. Your shortlist follows you as you browse.</p><a className="button dark" href="/category/recovery">Explore Recovery & devices<ArrowUpRight size={16}/></a></div>:<>
    <div className="comparison-table-intro"><div><strong>{selected.length} of 4 products</strong><p>{selected.length===1?'Add another of the same type to compare.':'Compare the exact listed configuration.'} Unknown details stay visible.</p></div><div className="comparison-scroll-controls" hidden={!edges.left&&!edges.right}><span>Scroll to compare</span><button aria-label="Previous comparison column" disabled={!edges.left} onClick={()=>move(-1)}><ArrowLeft size={18}/></button><button aria-label="Next comparison column" disabled={!edges.right} onClick={()=>move(1)}><ArrowRight size={18}/></button></div></div>
    <div ref={scroll} className="comparison-scroll research-table-scroll" tabIndex={0} role="region" aria-label="Product specifications comparison">
     <table className="comparison-table research-table" style={{'--comparison-count':selected.length} as CSSProperties}>
      <caption className="sr-only">Comparison of {selected.map(p=>p.name).join(', ')}. Manufacturer-reported specifications; missing information is marked Not documented.</caption>
      <thead><tr><th scope="col">Your shortlist<small>Same type.<br/>Same decision criteria.</small></th>{selected.map(p=><th scope="col" key={p.id}><button className="comparison-remove" aria-label={'Remove '+p.name+' from comparison'} onClick={()=>onChange(ids.filter(id=>id!==p.id))}><X size={18}/></button><a href={'/product/'+p.id}><ProductImage src={p.image} alt={`${p.name}, ${p.brand}`} sizes="180px"/><small>{p.brand}</small><strong>{p.name}</strong></a></th>)}</tr></thead>
      <tbody>
       <tr className="comparison-price-row"><th scope="row">Listed price</th>{selected.map(p=><td key={p.id}><b>{listedPrice(p.price)}</b><small>{p.qty}<br/>{p.variant}</small></td>)}</tr>
       {selected.some(p=>p.servings)&&<tr><th scope="row">Price per serving</th>{selected.map(p=><td key={p.id}>{p.servings&&typeof p.price==='number'?money(p.price/p.servings):'Not documented'}</td>)}</tr>}
       {sections.map(section=><Fragment key={section.id}><tr className="comparison-section-row"><th colSpan={selected.length+1} scope="colgroup">{section.label}</th></tr>{section.rows.map(row=><tr key={row.id}><th scope="row">{row.label}</th>{selected.map(p=><td className={comparisonValue(p,row)==='Not documented'?'unknown':undefined} key={p.id}>{comparisonValue(p,row)}</td>)}</tr>)}</Fragment>)}
       <tr className="comparison-section-row"><th colSpan={selected.length+1} scope="colgroup">Evidence & next steps</th></tr>
       <tr><th scope="row">Brand evidence<small>Inspect the underlying sources</small></th>{selected.map(p=><td key={p.id}><BrandEvidenceBadge brandId={p.brandId} summary={summaries.find(s=>s.brandId===p.brandId)}/></td>)}</tr>
       <tr><th scope="row">Source checked</th>{selected.map(p=><td key={p.id}><a href={p.source} target="_blank" rel="noreferrer">{p.checked}<ArrowUpRight size={13}/></a><small>Official product listing</small></td>)}</tr>
       <tr><th scope="row">Next step</th>{selected.map(p=><td key={p.id}><a className="button dark" href={'/api/out?id='+p.id} target="_blank" rel={p.affiliate?'sponsored noreferrer':'noreferrer'}>Shop with brand<ArrowUpRight size={15}/></a><small>{p.affiliate?'Affiliate link. We may earn a commission.':'Direct merchant link.'}</small><a className="text-link" href={'/product/'+p.id}>Read product details</a></td>)}</tr>
      </tbody>
     </table>
    </div>
    <p className="pricing-note">Prices apply to the listed configuration and source date. Confirm delivery, tax, installation and final terms with the merchant. Specifications are manufacturer-reported; missing data does not establish equivalence.</p>
   </>}
  </>}
 </div>;
}
