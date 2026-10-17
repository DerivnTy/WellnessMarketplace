'use client';
import {useEffect,useRef,type RefObject} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {X,ChevronRight,Search} from 'lucide-react';
import {categories} from '@/lib/catalog';
import {categoryHref} from '@/lib/browse';

type Props={open:boolean;onClose:()=>void;path:string;saved:number;cart:number;trigger:RefObject<HTMLButtonElement|null>};
export default function MobileMenu({open,onClose,path,saved,cart,trigger}:Props){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null);
 const router=useRouter();
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
  {title:'Explore',links:[['/','Home'],['/shop','All products'],...categories.map(c=>[categoryHref(c.id),c.name]),['/brands','Discover brands']]},
  {title:'Your picks',links:[['/saved','Saved products',String(saved)],['/cart','Your cart',String(cart)],['/compare','Compare products']]},
  {title:'Research & trust',links:[['/research','Evidence & reviews'],['/methodology','How scoring works'],['/disclosure','Independence & disclosure']]},
  {title:'Contribute',links:[['/for-brands','For brands'],['/submit','Submit a product'],['/correction','Suggest a correction'],['/admin','Editorial workspace']]},
 ];
 return <dialog ref={dialog} className="mobile-menu-screen" aria-labelledby="mobile-menu-title" onCancel={e=>{e.preventDefault();onClose();}}>
  <div className="mobile-menu-top"><div><span>WELLNESS MARKETPLACE</span><h2 id="mobile-menu-title">Explore</h2></div><button ref={close} type="button" aria-label="Close menu" onClick={onClose}><X size={24}/></button></div>
  <div className="mobile-menu-content">
   <form className="mobile-menu-search" role="search" onSubmit={e=>{e.preventDefault();const q=String(new FormData(e.currentTarget).get('q')||'').trim();onClose();router.push('/shop'+(q?'?q='+encodeURIComponent(q):''));}}><input name="q" type="search" aria-label="Search products and brands" placeholder="Search products & brands" enterKeyHint="search" autoComplete="off"/><button type="submit" aria-label="Search"><Search size={20}/></button></form>
   {groups.map(group=><section className="mobile-menu-group" key={group.title}><h3>{group.title}</h3>{group.links.map(([href,label,count])=><Link prefetch={false} key={href} href={href} aria-current={'/'+path===href?'page':undefined} onClick={onClose}><span>{label}</span>{count!==undefined&&<small>{count}</small>}<ChevronRight size={17}/></Link>)}</section>)}
   <div className="mobile-menu-legal"><Link prefetch={false} href="/privacy" onClick={onClose}>Privacy</Link><Link prefetch={false} href="/terms" onClick={onClose}>Terms</Link></div>
  </div>
 </dialog>;
}
