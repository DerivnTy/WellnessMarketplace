'use client';
import {useEffect,useRef,type RefObject} from 'react';
import {X,ChevronRight,Search} from 'lucide-react';
import {categories} from '@/lib/catalog';
import {categoryHref} from '@/lib/browse';

type Props={open:boolean;onClose:()=>void;path:string;saved:number;cart:number;trigger:RefObject<HTMLButtonElement|null>};
export default function MobileMenu({open,onClose,path,saved,cart,trigger}:Props){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null);
 const dismiss=useRef(onClose);dismiss.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const node=dialog.current;if(!node)return;
  const y=window.scrollY;
  const body=document.body;
  const previous={position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};
  body.style.position='fixed';body.style.top=`-${y}px`;body.style.width='100%';body.style.overflow='hidden';
  node.showModal();close.current?.focus({preventScroll:true});
  const desktop=window.matchMedia('(min-width:761px)');
  const resize=()=>{if(desktop.matches)dismiss.current();};desktop.addEventListener('change',resize);
  return()=>{desktop.removeEventListener('change',resize);node.close();Object.assign(body.style,previous);window.scrollTo({top:y,behavior:'instant'});trigger.current?.focus({preventScroll:true});};
 },[open,trigger]);
 const groups=[
  {title:'Recovery & devices',links:[['/category/recovery','All recovery & devices'],['/category/recovery?deviceType=home-gym','Home gym equipment'],['/category/recovery?deviceType=cold-plunge','Cold plunges'],['/category/recovery?deviceType=sauna','Saunas'],['/category/recovery?deviceType=massage-chair','Massage chairs']]},
  {title:'Explore',links:[['/','Home'],['/shop','All products'],...categories.filter(c=>c.id!=='recovery').map(c=>[categoryHref(c.id),c.name]),['/brands','Discover brands']]},
  {title:'Your picks',links:[['/saved','Saved products',String(saved)],['/cart','Your cart',String(cart)],['/compare','Compare products']]},
  {title:'Research & trust',links:[['/research','Evidence & reviews'],['/research','The trust standard'],['/brands','Discover brands'],['/methodology','How Brand evidence works'],['/disclosure','Independence & disclosure']]},
  {title:'Contribute',links:[['/for-brands','For brands'],['/submit','Submit a product'],['/correction','Suggest a correction'],['/admin','Editorial workspace']]},
 ];
 return <dialog ref={dialog} className="mobile-menu-screen" aria-labelledby="mobile-menu-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <div className="mobile-menu-top"><div><span>WELLNESS MARKETPLACE</span><h2 id="mobile-menu-title">Explore</h2></div><button ref={close} type="button" aria-label="Close menu" onClick={onClose}><X size={24}/></button></div>
  <div className="mobile-menu-content">
   <form className="mobile-menu-search" role="search" onSubmit={e=>{e.preventDefault();const q=String(new FormData(e.currentTarget).get('q')||'').trim();onClose();window.location.assign('/shop'+(q?'?q='+encodeURIComponent(q):''));}}><input name="q" type="search" aria-label="Search products and brands" placeholder="Search products & brands" enterKeyHint="search" autoComplete="off"/><button type="submit" aria-label="Search"><Search size={20}/></button></form>
   {groups.map(group=><section className="mobile-menu-group" key={group.title}><h3>{group.title}</h3>{group.links.map(([href,label,count])=><a key={label} href={href} aria-current={'/'+path===href?'page':undefined} onClick={onClose}><span>{label}</span>{count!==undefined&&<small>{count}</small>}<ChevronRight size={17}/></a>)}</section>)}
   <div className="mobile-menu-legal"><a href="/privacy" onClick={onClose}>Privacy</a><a href="/terms" onClick={onClose}>Terms</a></div>
  </div>
 </dialog>;
}
