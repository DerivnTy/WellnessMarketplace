import type {ReactNode} from 'react';
import {categories,type Product} from '@/lib/catalog';
import {categoryHref} from '@/lib/browse';
import {recoverySections,recoveryHref,inSection,discoveryIds} from './recovery-sections';

export default function ResearchHome({products,renderCard}:{products:Product[];renderCard:(p:Product)=>ReactNode}){
 const published=products.filter(p=>p.status==='published');
 const count=(type:string)=>published.filter(p=>inSection(p,type)).length;
 return <div className="research-home">
  <section className="home-intro research-home-section" aria-labelledby="home-title">
   <p className="eyebrow">WELLNESS MARKETPLACE</p>
   <h1 id="home-title">Discover equipment.<br/>Understand your options.</h1>
   <p className="home-intro-copy">Explore recovery devices and home gym equipment you may not know, with practical details to help you choose.</p>
   <div className="home-intro-actions"><a className="button dark" href="/category/recovery">Explore recovery equipment</a><a className="button light" href={recoveryHref('home-gym')}>Browse home gym equipment</a></div>
  </section>
  <section className="research-home-section home-equipment" aria-labelledby="home-equipment-title">
   <div className="home-section-heading"><h2 id="home-equipment-title">Explore recovery</h2><a href="/category/recovery">All recovery equipment</a></div>
   <div className="home-equipment-grid">{recoverySections.filter(item=>count(item.id)>0).map(item=><a className="home-equipment-tile" key={item.id} href={recoveryHref(item.id)}><span>{count(item.id)} products</span><h3>{item.label}</h3><p>{item.description}</p></a>)}</div>
  </section>
  <section className="research-home-section home-featured" aria-labelledby="home-featured-title">
   <div className="home-section-heading"><div><h2 id="home-featured-title">Discover something different</h2><p>A selection from the equipment catalog.</p></div><a href="/discover">Explore Discover</a></div>
   <div className="research-featured-grid">{discoveryIds.flatMap(id=>{const product=published.find(p=>p.id===id);return product?[renderCard(product)]:[];})}</div>
  </section>
  <section className="research-home-section home-method" aria-labelledby="home-method-title">
   <h2 id="home-method-title">How we help you decide</h2>
   <ol><li><h3>Compare side by side</h3><p>See the specifications of up to four products of the same type.</p></li><li><h3>Check ownership details</h3><p>Review space, power, installation, delivery, maintenance and warranty.</p></li><li><h3>Follow the sources</h3><p>Open the original listings and see what is not documented.</p></li></ol>
  </section>
  <section className="research-home-section home-secondary" aria-labelledby="home-gym-title">
   <div className="home-gym-strip"><div><span className="eyebrow">{count('home-gym')} PRODUCTS</span><h2 id="home-gym-title">Make room for your training.</h2><p>Explore racks, benches, weights and trainers for your home gym.</p></div><a className="button light" href={recoveryHref('home-gym')}>Browse home gym equipment</a></div>
   <div id="everyday-essentials" className="home-everyday"><div><h3>Everyday essentials</h3><p>Also in the catalog.</p></div><div className="home-everyday-links">{categories.filter(c=>c.id!=='recovery').map(c=><a key={c.id} href={categoryHref(c.id)}>{c.name}</a>)}</div></div>
  </section>
  <p className="home-disclosure">Listings are research starting points, not endorsements. <a href="/disclosure">Affiliate disclosure</a></p>
 </div>;
}
