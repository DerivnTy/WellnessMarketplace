import type {Product} from './catalog';
export const TRUST_VERSION='evidence-v2' as const;
export const CHECKS=[
 {key:'ingredients',label:'Ingredients, materials or specifications',weight:15,group:'disclosure'},
 {key:'amounts',label:'Amounts and composition',weight:10,group:'disclosure'},
 {key:'caveats',label:'Warnings, allergens or component limits',weight:5,group:'disclosure'},
 {key:'namedVerification',label:'Named external testing or certification',weight:5,group:'verification'},
 {key:'originalVerification',label:'Original independent record accessible',weight:15,group:'verification'},
 {key:'productMatch',label:'Independent record matches a reviewed product',weight:10,group:'verification'},
 {key:'returns',label:'Return and refund terms',weight:10,group:'terms'},
 {key:'shipping',label:'Shipping and delivery terms',weight:10,group:'terms'},
 {key:'contact',label:'A documented support channel',weight:10,group:'accountability'},
 {key:'traceability',label:'Origin, supply chain or batch traceability',weight:10,group:'accountability'},
] as const;
export const GROUPS=[{id:'disclosure',label:'Product disclosure',max:30},{id:'verification',label:'Independent verification',max:30},{id:'terms',label:'Buying terms',max:20},{id:'accountability',label:'Accountability & traceability',max:20}];
export type CheckKey=typeof CHECKS[number]['key'];
export type CheckStatus='documented'|'partial'|'not_found'|'not_reviewed';
export type EvidenceSource={id:string;title:string;url:string;kind:'brand'|'independent'|'review-platform';publisher:string;checked:string;note:string};
export type EvidenceCheck={key:CheckKey;status:CheckStatus;sourceIds:string[];reason:string};
export type ConsumerSource={sourceId:string;rating?:number;count?:number;countUnit?:'reviews'|'ratings'|'posts';summary:string;topics?:string[];limitations:string;positives?:string[];concerns?:string[];sampling?:string;basis?:'platform-overview'|'review-sample'|'brand-selected';sampleSize?:number;sampleStart?:string;sampleEnd?:string};
export type TrustProfile={brandId:string;reviewed:string;scopeProductIds:string[];summary:string;checks:EvidenceCheck[];sources:EvidenceSource[];limitations:string[];consumerSources:ConsumerSource[];version:typeof TRUST_VERSION;reviewer:'AI-assisted desk research'|'Editorial review';status:'draft'|'published';changeNote:string};
export type TrustHistory={id:string;brandId:string;created:string;note:string;score:number|null;version:string;reviewer:string};
export const checkLabels:Record<CheckStatus,string>={documented:'Documented',partial:'Partial evidence',not_found:'Not located in reviewed sources',not_reviewed:'Not assessed'};
export const sourceLabels={brand:'Brand-published',independent:'Independent source','review-platform':'Consumer-review source'};
export const day=(value:string)=>new Date(value.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
export function checkPoints(check:EvidenceCheck|undefined,weight:number){return !check||check.status==='not_reviewed'?null:check.status==='documented'?weight:check.status==='partial'?weight/2:0;}
export function trustScore(p:TrustProfile|undefined,today=new Date().toISOString().slice(0,10)){
 const rows=CHECKS.map(c=>({...c,check:p?.checks.find(x=>x.key===c.key),points:checkPoints(p?.checks.find(x=>x.key===c.key),c.weight)}));
 const assessed=rows.filter(r=>r.points!==null).length,documented=rows.filter(r=>r.check?.status==='documented').length;
 let reason='Research has not been completed.';
 const independent=(key:CheckKey)=>{const c=p?.checks.find(c=>c.key===key);return c?.status==='documented'&&c.sourceIds.some(id=>p?.sources.some(s=>s.id===id&&s.kind==='independent'));};
 const age=p?(Date.parse(today)-Date.parse(p.reviewed))/86400000:Infinity;
 const validSources=p&&new Set(p.sources.map(s=>s.url)).size>=3;
 let score:number|null=null;
 if(p?.status==='published'){
  if(age<0||!Number.isFinite(age)||age>90)reason='This profile needs a fresh source review before a current score can be shown.';
  else if(!p.scopeProductIds.length||assessed!==CHECKS.length||!validSources)reason='Some research checks are incomplete. No numerical score is assigned yet.';
  else if(!independent('originalVerification')||!independent('productMatch'))reason='An original independent record has not yet been matched to a reviewed catalog product.';
  else {score=Math.round(rows.reduce((n,r)=>n+(r.points||0),0));reason='Calculated from the ten documented checks below. It measures evidence and transparency, not safety or effectiveness.';}
 }
 return {score,reason,assessed,documented,rows,stale:age>90,provisional:p?.reviewer!=='Editorial review',label:score===null?'Not scored':score>=85?'Broad documentation':score>=65?'Developing documentation':'Limited documentation'};
}
export type ReviewData={publicName:string;rating:number;title:string;body:string;experienceDate:string;purchaseChannel:'brand'|'retailer'|'gift';relationship:'none'|'free-product'|'paid'|'employee';topics:string[];consent:true};
export type PublicReview=ReviewData&{id:string;brandId:string;productId:string|null;created:string;updated:string;publishedAt:string|null;revision:number};
export type StoredReview={id:string;userId:string;brandId:string;productId:string|null;scope:string;data:string;status:string;created:string;updated:string;publishedAt:string|null;revision:number;moderationNote:string};
export type ReviewStats={count:number;contributors:number;average:number|null;distribution:number[];excluded:number};
export function reviewStats(rows:StoredReview[]):ReviewStats {
 const published=rows.filter(r=>r.status==='published'),eligible=published.filter(r=>JSON.parse(r.data).relationship==='none');
 const people=new Map<string,StoredReview>();for(const r of [...eligible].sort((a,b)=>a.updated.localeCompare(b.updated)))people.set(r.userId,r);
 const selected=Array.from(people.values()),distribution=[0,0,0,0,0];for(const r of selected)distribution[JSON.parse(r.data).rating-1]++;
 return {count:published.length,contributors:selected.length,average:selected.length>=5?selected.reduce((n,r)=>n+JSON.parse(r.data).rating,0)/selected.length:null,distribution,excluded:published.length-eligible.length};
}
export function publicReview(r:StoredReview):PublicReview {const d=JSON.parse(r.data) as ReviewData;return {...d,id:r.id,brandId:r.brandId,productId:r.productId,created:r.created,updated:r.updated,publishedAt:r.publishedAt,revision:r.revision};}
export const relationshipLabels={'none':'No brand relationship declared','free-product':'Received a free product','paid':'Paid or sponsored contributor','employee':'Brand employee or affiliate'};
export function profileProducts(p:TrustProfile|undefined,products:Product[]){return products.filter(x=>p?.scopeProductIds.includes(x.id));}
export type TrustSummary={brandId:string;score:number|null;reason:string;assessed:number;documented:number;provisional:boolean;stale:boolean;reviewed:string;scopeCount:number;sourceCount:number;consumerSourceCount:number};
export function summarizeTrust(p:TrustProfile):TrustSummary{const s=trustScore(p);return {brandId:p.brandId,score:s.score,reason:s.reason,assessed:s.assessed,documented:s.documented,provisional:s.provisional,stale:s.stale,reviewed:p.reviewed,scopeCount:p.scopeProductIds.length,sourceCount:p.sources.length,consumerSourceCount:p.consumerSources.length};}
