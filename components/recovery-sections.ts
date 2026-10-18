import type {Product} from '@/lib/catalog';

export const recoverySections = [
 {id:'cold-plunge',label:'Cold plunges',description:'Tubs and cooling systems for cold-water immersion.'},
 {id:'sauna',label:'Saunas',description:'Enclosed spaces with infrared or traditional heating.'},
 {id:'massage-chair',label:'Massage chairs',description:'Reclining chairs with built-in massage mechanisms.'},
 {id:'red-light-panel',label:'Red light and light therapy',description:'Panels with documented light and power specifications.'},
 {id:'compression-boots,percussion-massager',label:'Compression and recovery devices',description:'Compression boots and handheld massage devices.'},
 {id:'sleep-system',label:'Sleep systems',description:'Bed temperature systems and sleep-tracking devices.'},
];
export const recoveryHref=(id:string)=>'/category/recovery?deviceType='+encodeURIComponent(id);
export const inSection=(product:Product,id:string)=>product.category==='recovery'&&product.status==='published'&&id.split(',').some(type=>product.facets?.deviceType?.includes(type));
export const recoveryMenu=(products:Product[])=>recoverySections.filter(section=>section.id!=='sleep-system'&&products.some(product=>inSection(product,section.id)));
export const discoveryIds=['ht-inergize-inergize-cold-plunge-tub','hooga-hg300','perfectly-snug-smart-topper'];
