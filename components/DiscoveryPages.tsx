import type {ReactNode} from 'react';
import type {Product} from '@/lib/catalog';
import {recoverySections,recoveryHref,inSection} from './recovery-sections';

const selections:Record<string,string[]>={
 'cold-plunge':['ht-inergize-inergize-cold-plunge-tub','ht-renu-cold-stoic-2-0','ht-dynamic-dynamic-cold-therapy-barrel-304-stainless-steel-cold-plunge'],
 sauna:['ht-almostheaven-salem-2-person-barrel-sauna','ht-redwood-cabin-outdoor-sauna-4-person','clearlight-premier-2'],
 'massage-chair':['ogawa-masterdrive-ai2','infinity-genmax-4d','luraco-i9-max-plus'],
 'red-light-panel':['hooga-hg300','mitoadapt-4','platinum-biomax900'],
 'sleep-system':['perfectly-snug-smart-topper','sleepme-chilipad-2','ht-eight-sleep-pod6-queen'],
};
const productDescriptions:Record<string,string>={'cold-plunge':'A tub and cooling configuration for cold-water immersion.',sauna:'An enclosed sauna with the heat type shown in its specifications.','massage-chair':'A reclining chair with built-in massage mechanisms.','red-light-panel':'A light panel with its documented wavelengths in its specifications.','compression-boots':'Leg sleeves that use an air-compression system.','percussion-massager':'A handheld device with a powered massage attachment.','sleep-system':'A device for bed temperature control or sleep tracking.'};

export function DiscoverPage({products,renderCard}:{products:Product[];renderCard:(product:Product)=>ReactNode}){
 return <div className="section discovery-page"><header className="hub-page-heading"><p className="eyebrow">EQUIPMENT DISCOVERY</p><h1>A closer look at your options.</h1><p>A selection from the existing catalog, grouped by device type.</p></header><p className="listing-evidence-note">Not scored means there is not enough independent evidence yet.</p>
 {recoverySections.map(section=>{
  const candidates=products.filter(p=>inSection(p,section.id));
  const selected=selections[section.id]?selections[section.id].flatMap(id=>{const product=candidates.find(p=>p.id===id);return product?[product]:[];}):candidates.slice(0,3);
  return selected.length>0&&<section key={section.id} className="discovery-group" aria-labelledby={'discover-'+section.id}><div className="home-section-heading"><h2 id={'discover-'+section.id}>{section.label}</h2><a href={recoveryHref(section.id)}>View all</a></div><div className="research-featured-grid">{selected.map(p=><div key={p.id}>{renderCard(p)}<p className="discovery-product-description">{productDescriptions[p.type]||section.description}</p></div>)}</div></section>;
 })}</div>;
}
export function GuidesPage(){
 return <div className="section guides-page"><header className="hub-page-heading"><p className="eyebrow">RESEARCH & EDUCATION</p><h1>Guides</h1><p>Practical reading to support your equipment research.</p></header><section className="guide-index" aria-labelledby="available-guides"><h2 id="available-guides">Research resources</h2><a href="/methodology"><h3>How Brand evidence works</h3><p>Read the scoring methodology, source requirements and limitations.</p></a><a href="/research"><h3>Evidence and consumer reviews</h3><p>Explore the existing brand research and its supporting sources.</p></a></section><div className="guides-status"><h2>Equipment guides</h2><p>No equipment guides have been published yet. Available articles will appear here.</p></div></div>;
}
