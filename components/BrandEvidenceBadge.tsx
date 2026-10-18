import type {TrustSummary} from '@/lib/trust';

export default function BrandEvidenceBadge({summary,brandId}:{summary?:TrustSummary;brandId:string}){
 const score=summary?.score;
 const scored=typeof score==='number'&&Number.isFinite(score)&&score>=0&&score<=100&&!summary?.stale;
 return <a className={'research-status trust-badge '+(scored?'has-score':'')} href={'/brands/'+brandId+'#evidence'} title={scored?(summary?.provisional?'Provisional, AI-assisted evidence review. Inspect the source records.':'Inspect the evidence and source records.'):'No current evidence score is available. Inspect the research status.'}>{scored?`Brand evidence ${score}/100`:'Brand evidence · Not scored'}</a>;
}
