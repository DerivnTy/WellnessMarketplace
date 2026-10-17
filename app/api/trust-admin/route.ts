import {getDb} from '@/db';
import {trustProfiles,trustVersions} from '@/db/schema';
import {adminUser,body,failure,catalog,log} from '@/lib/server';
import {trustProfilesList} from '@/lib/trust-server';
import {trustSchema} from '@/lib/trust-validation';
export const dynamic='force-dynamic';
export async function GET(){if(!await adminUser())return failure(new Error('Editor access required.'),403);return Response.json({profiles:await trustProfilesList(true)},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){try{const user=await adminUser();if(!user)return failure(new Error('Editor access required.'),403);const input=await body(req),p=trustSchema.parse(input.profile),all=await catalog(true);
 if(!all.some(x=>x.brandId===p.brandId)||p.scopeProductIds.some(id=>!all.some(x=>x.id===id&&x.brandId===p.brandId)))throw new Error('Review scope must contain products from this brand.');
 if(p.status==='published'&&input.confirm!==true)throw new Error('Confirm that you reviewed the evidence and scoring decisions.');
 const now=new Date().toISOString(),data=JSON.stringify({...p,reviewer:'Editorial review'}),db=getDb();
 await db.batch([db.insert(trustProfiles).values({brandId:p.brandId,data,status:p.status,updated:now}).onConflictDoUpdate({target:trustProfiles.brandId,set:{data,status:p.status,updated:now}}),db.insert(trustVersions).values({id:crypto.randomUUID(),brandId:p.brandId,data,actor:user.userId,created:now})]);
 await log(user.userId,p.brandId,'update_trust_profile',{changeNote:p.changeNote,status:p.status});return Response.json({ok:true});
}catch(e){return failure(e);}}
