import {ArrowRight,ArrowUpRight} from 'lucide-react';
import type {Product} from '@/lib/catalog';

const paths=[
 {id:'home-gym',name:'Home gym equipment',image:'rep-pr4100-folding-rack-41',description:'Compare racks, benches, weights and trainers by footprint, capacity and construction.'},
 {id:'cold-plunge',name:'Cold plunges',image:'plunge-all-in-gen2-cold',description:'Check cooling systems, temperature range, power and the space each setup needs.'},
 {id:'sauna',name:'Saunas',image:'sun-home-luminar-2',description:'Understand heat type, occupancy, electrical supply and installation requirements.'},
 {id:'massage-chair',name:'Massage chairs',image:'human-touch-novo-flex-gray',description:'Compare reclined dimensions, user fit, delivery arrangements and warranty coverage.'},
];

export default function RecoveryDiscovery({products}:{products:Product[]}){
 const recovery=products.filter(p=>p.category==='recovery'&&p.status==='published');
 return <section className="section recovery-discovery" aria-labelledby="recovery-discovery-title">
  <div className="recovery-discovery-intro"><div><span className="eyebrow">RECOVERY & DEVICES</span><h2 id="recovery-discovery-title">Understand the equipment.<br/>Then make it yours.</h2><p>Start with your space, compare the specifications and check the ownership details before you choose.</p></div><a className="button dark" href="/category/recovery">Explore recovery & devices <ArrowRight size={17}/></a></div>
  <div className="recovery-discovery-grid">{paths.map((path,index)=>{const matches=recovery.filter(p=>p.facets?.deviceType?.includes(path.id));const image=matches.find(p=>p.id===path.image)||matches[0];return <a href={'/category/recovery?deviceType='+path.id} className="recovery-discovery-card" key={path.id}><div className="recovery-discovery-visual"><span>0{index+1}</span>{image&&<img src={image.image} alt="" loading="lazy"/>}<ArrowUpRight size={20}/></div><div className="recovery-discovery-copy"><small>{matches.length} products to research</small><h3>{path.name}</h3><p>{path.description}</p><span className="text-link">Explore options <ArrowRight size={15}/></span></div></a>;})}</div>
  <div className="recovery-research-note"><p><strong>A clearer path to a decision.</strong> Narrow by your requirements. Compare up to four products. Follow the source links.</p><a href="/category/recovery?deviceType=red-light-panel">Explore red light panels <ArrowRight size={15}/></a></div>
 </section>;
}
