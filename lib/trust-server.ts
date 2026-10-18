import {getDb} from '@/db';
import {trustProfiles,trustVersions,consumerReviews} from '@/db/schema';
import seed from '@/data/trust-profiles.json';
import updates from '@/data/trust-research-update.json';
import expansion from '@/data/trust-specialist-expansion.json';
import registry from '@/data/trust-scored-registry.json';
import {researchUpdateState} from './trust-updates';
import {eq,desc,and} from 'drizzle-orm';
import {trustSchema} from './trust-validation';
import {trustScore,type TrustProfile,type TrustHistory,type StoredReview} from './trust';
import {setting} from './server';
import {settings} from '@/db/schema';
function profilesFromFiles(includeDrafts:boolean):TrustProfile[]{
 const byId=new Map<string,TrustProfile>();
 for(const raw of seed){const profile=trustSchema.parse(raw);byId.set(profile.brandId,profile);}
 for(const wave of [updates,expansion,registry]){
  for(const raw of wave){
   const next=trustSchema.parse(raw),current=byId.get(next.brandId),baseline=seed.find(item=>item.brandId===next.brandId);
   const state=researchUpdateState(current?{data:JSON.stringify(current),status:current.status}:undefined,baseline?trustSchema.parse(baseline):undefined,next);
   if(state==='insert'||state==='update')byId.set(next.brandId,next);
  }
 }
 return [...byId.values()].filter(profile=>includeDrafts||profile.status==='published');
}
function database(){try{return getDb();}catch(error){if(error instanceof Error&&error.message.includes('D1 binding'))return null;throw error;}}
export async function trustProfilesList(includeDrafts=false):Promise<TrustProfile[]> {
 const db=database();
 if(!db)return profilesFromFiles(includeDrafts);
 if(seed.length&&!await setting('trust-profiles-v2-initial')){
  const profiles=seed.map(p=>trustSchema.parse(p));
  for(let i=0;i<profiles.length;i+=10){
   const batch=profiles.slice(i,i+10);
   await db.insert(trustProfiles).values(batch.map(p=>({brandId:p.brandId,data:JSON.stringify(p),status:p.status,updated:p.reviewed}))).onConflictDoNothing();
   await db.insert(trustVersions).values(batch.map(p=>({id:'initial-v2-'+p.brandId,brandId:p.brandId,data:JSON.stringify(p),actor:'initial-research',created:p.reviewed+'T12:00:00Z'}))).onConflictDoNothing();
  }
  await db.insert(settings).values({key:'trust-profiles-v2-initial',value:'true'}).onConflictDoNothing();
 }
 const waves=[{key:'trust-research-depth-2026-10-16',prefix:'depth-2026-10-16-',profiles:updates},{key:'trust-specialist-expansion-2026-10-16',prefix:'specialists-2026-10-16-',profiles:expansion},{key:'trust-scored-registry-2026-10-16',prefix:'registry-2026-10-16-',profiles:registry}];
 for(const wave of waves){
 if(wave.profiles.length&&!await setting(wave.key)){
  for(const raw of wave.profiles){
   const p=trustSchema.parse(raw),data=JSON.stringify(p),baseline=seed.find(x=>x.brandId===p.brandId);
   const current=(await db.select().from(trustProfiles).where(eq(trustProfiles.brandId,p.brandId)))[0];
   const action=researchUpdateState(current,baseline?trustSchema.parse(baseline):undefined,p);
   if(action==='skip')continue;
   if(action==='insert')await db.insert(trustProfiles).values({brandId:p.brandId,data,status:p.status,updated:p.reviewed}).onConflictDoNothing();
   if(action==='update'&&current)await db.update(trustProfiles).set({data,status:p.status,updated:p.reviewed}).where(and(eq(trustProfiles.brandId,p.brandId),eq(trustProfiles.data,current.data),eq(trustProfiles.status,current.status)));
   // Re-read after the conditional write: concurrent editorial changes always win.
   const applied=(await db.select().from(trustProfiles).where(eq(trustProfiles.brandId,p.brandId)))[0];
   if(applied?.data===data&&applied.status===p.status)await db.insert(trustVersions).values({id:wave.prefix+p.brandId,brandId:p.brandId,data,actor:'research-update',created:new Date().toISOString()}).onConflictDoNothing();
  }
  await db.insert(settings).values({key:wave.key,value:'true'}).onConflictDoNothing();
 }
 }
 return (await db.select().from(trustProfiles)).filter(r=>includeDrafts||r.status==='published').map(r=>({...JSON.parse(r.data),status:r.status}));
}
export async function trustHistory(brandId:string):Promise<TrustHistory[]> {
 const db=database();
 if(!db)return [];
 return (await db.select().from(trustVersions).where(eq(trustVersions.brandId,brandId)).orderBy(desc(trustVersions.created))).flatMap(r=>{const p=JSON.parse(r.data) as TrustProfile;return p.status==='published'?[{id:r.id,brandId:r.brandId,created:r.created,note:p.changeNote,score:trustScore(p,p.reviewed).score,version:p.version,reviewer:p.reviewer}]:[];}).slice(0,20);
}
export async function brandReviewRows(brandId:string):Promise<StoredReview[]> {return getDb().select().from(consumerReviews).where(eq(consumerReviews.brandId,brandId)).orderBy(desc(consumerReviews.updated));}
export async function reviewId(userId:string,brandId:string,productId:string|null){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([userId,brandId,productId])));return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');}

export async function publishedTrustVersion(brandId:string,id:string):Promise<TrustProfile|null>{const row=(await getDb().select().from(trustVersions).where(and(eq(trustVersions.brandId,brandId),eq(trustVersions.id,id))))[0];if(!row)return null;const p=JSON.parse(row.data) as TrustProfile;return p.status==='published'?p:null;}
