import {getDb} from '@/db';
import {products,assessments,submissions,settings,audit,events} from '@/db/schema';
import {adminUser,body,failure,setting,catalog,log} from '@/lib/server';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {productSchema,assessmentSchema} from '@/lib/validation';
import {eq,desc,sql} from 'drizzle-orm';
import {z} from 'zod';
export async function GET(){
  const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to manage the marketplace.',signin:true},{status:401});
  if(!await setting('owner'))return Response.json({setup:true});
  if(!await adminUser())return Response.json({error:'This workspace belongs to another account.'},{status:403});
  const db=getDb();return Response.json({products:await catalog(true),assessments:await db.select().from(assessments),submissions:await db.select().from(submissions).orderBy(desc(submissions.created)).limit(200),audit:await db.select().from(audit).orderBy(desc(audit.created)).limit(30),metrics:await db.select({name:events.name,count:sql<number>`count(*)`}).from(events).groupBy(events.name),methodology:await setting('methodology')==='community-v1'});
}
export async function POST(req:Request){try{
  const input=await body(req);const db=getDb();
  if(input.action==='initialize'){
    const user=await getChatGPTUser();if(!user)return failure(new Error('Sign in first.'),401);
    if(await setting('owner'))return failure(new Error('An owner has already been configured.'),409);
    // Initial claim is available only inside the site's owner-private hosting boundary.
    await db.insert(settings).values({key:'owner',value:user.userId}).onConflictDoNothing();
    if(await setting('owner')!==user.userId)return failure(new Error('Owner setup already completed.'),409);
    await log(user.userId,'owner','initialize',{});return Response.json({ok:true});
  }
  const user=await adminUser();if(!user)return failure(new Error('Owner access required.'),403);
  if(input.action==='methodology'){
    if(input.confirm!==true)throw new Error('Explicit approval is required.');
    await db.insert(settings).values({key:'methodology',value:'community-v1'}).onConflictDoUpdate({target:settings.key,set:{value:'community-v1'}});
    await log(user.userId,'community-v1','approve_methodology',{});
  }else if(input.action==='product'){
    const p=productSchema.parse(input.product);const now=new Date().toISOString();
    await db.insert(products).values({id:p.id,data:JSON.stringify(p),status:p.status,updated:now}).onConflictDoUpdate({target:products.id,set:{data:JSON.stringify(p),status:p.status,updated:now}});
    await log(user.userId,p.id,'save_product',p);
  }else if(input.action==='assessment'){
    const a=assessmentSchema.parse(input.assessment);
    const all=await catalog(true);
    if(!all.some(p=>a.scope==='product'?p.id===a.entity:p.brandId===a.entity))throw new Error('Choose an existing catalog entity.');
    if(a.status==='published' && (input.confirm!==true || await setting('methodology')!=='community-v1'))throw new Error('Approve the methodology and explicitly confirm this research before publishing.');
    if(new Set(a.sources.map(s=>s.url)).size<2)throw new Error('Supply at least two distinct sources.');
    if(a.reviewed>new Date().toISOString().slice(0,10))throw new Error('Review date cannot be in the future.');
    await db.insert(assessments).values({id:a.id,entity:a.entity,scope:a.scope,data:JSON.stringify(a),status:a.status,updated:new Date().toISOString()}).onConflictDoUpdate({target:assessments.id,set:{entity:a.entity,scope:a.scope,data:JSON.stringify(a),status:a.status,updated:new Date().toISOString()}});
    await log(user.userId,a.entity,'save_assessment',a);
  }else if(input.action==='submission'){
    const d=z.object({id:z.string().uuid(),status:z.enum(['new','reviewing','resolved','declined'])}).parse(input);
    await db.update(submissions).set({status:d.status}).where(eq(submissions.id,d.id));await log(user.userId,d.id,'submission_status',d.status);
  }else throw new Error('Unknown action.');
  return Response.json({ok:true});
}catch(e){return failure(e);}}
