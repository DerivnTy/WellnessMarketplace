import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
function compile(file,imports={}){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const compiled={exports:{}};new Function('require','module','exports',code)(name=>imports[name]||require(name),compiled,compiled.exports);return compiled.exports;}
const trust=compile('lib/trust.ts'),validation=compile('lib/validation.ts');
const {trustSchema,reviewSchema}=compile('lib/trust-validation.ts',{'./trust':trust,'./validation':validation});
const baseline=JSON.parse(readFileSync('data/trust-profiles.json','utf8')),updates=JSON.parse(readFileSync('data/trust-research-update.json','utf8')),expansion=JSON.parse(readFileSync('data/trust-specialist-expansion.json','utf8'));
const registry=JSON.parse(readFileSync('data/trust-scored-registry.json','utf8'));
const seed=Array.from(new Map([...baseline,...updates,...expansion,...registry].map(p=>[p.brandId,p])).values()),products=JSON.parse(readFileSync('data/catalog.json','utf8'));
let n=0;const check=(ok,message)=>{assert.ok(ok,message);n++;};
check(new Set(seed.map(p=>p.brandId)).size===seed.length&&seed.every(p=>products.some(product=>product.brandId===p.brandId)),'unique evidence profiles belong to catalog brands');
for(const brandId of new Set(products.map(p=>p.brandId))){if(!seed.some(p=>p.brandId===brandId))check(trust.trustScore(undefined).score===null,brandId+' remains unscored without research');}
for(const p of seed){const parsed=trustSchema.safeParse(p);check(parsed.success,p.brandId+': '+JSON.stringify(parsed.error?.issues));check(p.scopeProductIds.every(id=>products.some(x=>x.id===id&&x.brandId===p.brandId)),p.brandId+' scope matches catalog');check(p.reviewer==='AI-assisted desk research','initial research honestly attributed');check(p.sources.every(s=>s.url.startsWith('https://')),'all original links HTTPS');}
const eligible=seed.filter(p=>trust.trustScore(p).score!==null);check(eligible.length>0&&eligible.length<seed.length,'numeric scores require evidence');
for(const p of registry)check(trust.trustScore(p).score!==null&&p.consumerSources.length>0,p.brandId+' registry addition meets score threshold and includes consumer research');
const base=structuredClone(eligible[0]);
check(trust.CHECKS.reduce((n,c)=>n+c.weight,0)===100,'weights total 100');
check(trust.checkPoints({status:'partial'},15)===7.5,'partial points');
check(trust.checkPoints(undefined,15)===null,'missing evidence not zero');
for(const key of ['originalVerification','productMatch']){const p=structuredClone(base);p.checks.find(c=>c.key===key).status='partial';check(trust.trustScore(p).score===null,key+' must be documented');}
{const p=structuredClone(base);p.sources=p.sources.map(s=>({...s,kind:'brand'}));check(trust.trustScore(p).score===null,'independent gate cannot be fulfilled by brand claims');}
{const p=structuredClone(base);p.checks[0].status='not_reviewed';check(trust.trustScore(p).score===null,'incomplete research never rescaled');}
check(trust.trustScore({...base,status:'draft'}).score===null,'draft hidden');
check(trust.trustScore({...base,scopeProductIds:[]}).score===null,'scope required');
check(trust.trustScore({...base,reviewed:'2026-01-01'},'2026-05-01').score===null,'stale score expires');
check(trust.trustScore({...base,reviewed:'2026-10-16'},'2026-10-15').score===null,'future review date blocked');
check(trust.trustScore({...base,reviewed:'2026-01-01'},'2026-04-01').score!==null,'90 day boundary inclusive');
check(!trustSchema.safeParse({...base,reviewed:'2026-02-30'}).success,'invalid calendar date');
check(!trustSchema.safeParse({...base,checks:base.checks.map((x,i)=>i===1?base.checks[0]:x)}).success,'duplicate criteria rejected');
check(!trustSchema.safeParse({...base,sources:base.sources.map(s=>({...s,url:'javascript:alert(1)'}))}).success,'unsafe links rejected');
check(!trustSchema.safeParse({...base,checks:base.checks.map((x,i)=>i===0?{...x,sourceIds:['missing']}:x)}).success,'missing source references rejected');
check(!trustSchema.safeParse({...base,consumerSources:[{sourceId:'missing',summary:'Consumer source summary',limitations:'Unknown underlying sample and collection.'}]}).success,'consumer source references validated');
const data={publicName:'Local test alias',rating:1,title:'A critical experience',body:'This is synthetic local test content to verify review validation and moderation.',experienceDate:'2026-10-15',purchaseChannel:'brand',relationship:'none',topics:['support'],consent:true};
check(reviewSchema.safeParse({...data,brandId:base.brandId,productId:null}).success,'critical review accepted');
check(!reviewSchema.safeParse({...data,brandId:base.brandId,productId:null,publicName:'name@example.test'}).success,'email alias blocked');
check(!reviewSchema.safeParse({...data,brandId:base.brandId,productId:null,purchaseChannel:'gift'}).success,'brand gift relationship required');
check(!reviewSchema.safeParse({...data,brandId:base.brandId,productId:null,experienceDate:'2099-01-01'}).success,'future experience blocked');
check(!reviewSchema.safeParse({...data,brandId:base.brandId,productId:null,consent:false}).success,'publication consent required');
const row=(i,patch={})=>({id:'id'+i,userId:'user'+i,brandId:base.brandId,productId:null,scope:'brand',data:JSON.stringify(data),status:'published',created:'2026-10-15',updated:'2026-10-15T12:00:00Z',publishedAt:'2026-10-15',revision:1,moderationNote:'Private editorial reasoning.',...patch});
check(trust.reviewStats([]).average===null,'empty review average absent');
check(trust.reviewStats([1,2,3,4].map(i=>row(i))).average===null,'four reviewers insufficient');
check(trust.reviewStats([1,2,3,4,5].map(i=>row(i))).average===1,'five critical reviewers produce one-star average');
check(trust.reviewStats([1,2,3,4,5].map(i=>row(i,{userId:'same'}))).contributors===1,'one person cannot inflate brand average');
check(trust.reviewStats([row(1),row(2,{userId:'user1',updated:'2026-10-16T12:00:00Z',data:JSON.stringify({...data,rating:5})})]).distribution[4]===1,'latest eligible account review used');
check(trust.reviewStats([row(1,{status:'pending'}),row(2,{status:'rejected'}),row(3,{status:'withdrawn'})]).count===0,'nonpublic statuses excluded');
const incentive=trust.reviewStats([row(1,{data:JSON.stringify({...data,relationship:'paid'})})]);check(incentive.count===1&&incentive.excluded===1&&incentive.contributors===0,'incentivized review remains visible but excluded');
const pub=trust.publicReview(row(1));check(!('userId'in pub)&&!('moderationNote'in pub)&&!('status'in pub)&&!('scope'in pub),'private fields never public');
const {researchUpdateState}=compile('lib/trust-updates.ts');
const original=trustSchema.parse(baseline[0]),next={...original,changeNote:'A new independently sourced research update.'};
check(researchUpdateState(undefined,original,next)==='insert','new research inserts');
check(researchUpdateState({data:JSON.stringify(original),status:'published'},original,next)==='update','untouched seed can update');
check(researchUpdateState({data:JSON.stringify(next),status:'published'},original,next)==='record','retry can record missing history');
check(researchUpdateState({data:JSON.stringify({...original,reviewer:'Editorial review'}),status:'published'},original,next)==='skip','editorial research preserved');
check(researchUpdateState({data:JSON.stringify(original),status:'draft'},original,next)==='skip','editorial draft preserved');
check(researchUpdateState({data:JSON.stringify({...original,summary:'A manually revised research summary.'}),status:'published'},original,next)==='skip','any custom research preserved');
const consumerId=base.sources.find(s=>s.kind==='brand').id;
const sample={sourceId:consumerId,summary:'A limited source review.',limitations:'Not a representative sample.',basis:'review-sample',sampling:'Three visible reviews selected by date.',sampleSize:3,count:100,sampleStart:'2026-01-01',sampleEnd:'2026-10-01',positives:['Clear ordering process.'],concerns:['Delayed delivery reported.']};
const withSample=(patch)=>({...base,consumerSources:[{...sample,...patch}]});
check(trustSchema.safeParse(withSample({})).success,'transparent sample schema accepted');
check(!trustSchema.safeParse(withSample({sampleSize:undefined})).success,'sample requires count');
check(!trustSchema.safeParse(withSample({sampling:undefined})).success,'sample requires selection method');
check(!trustSchema.safeParse(withSample({sampleSize:101})).success,'sample cannot exceed platform total');
check(!trustSchema.safeParse(withSample({sampleEnd:'2025-01-01'})).success,'sample date ordering checked');
check(!trustSchema.safeParse(withSample({sampleEnd:'2099-01-01'})).success,'future sample rejected');
console.log(`${n} evidence/review checks passed. ${eligible.length} provisional scored profiles: ${eligible.map(p=>p.brandId+' '+trust.trustScore(p).score).join(', ')}.`);
