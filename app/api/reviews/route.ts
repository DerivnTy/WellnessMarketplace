import {getDb} from '@/db';
import {consumerReviews} from '@/db/schema';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {body,failure,catalog} from '@/lib/server';
import {reviewSchema} from '@/lib/trust-validation';
import {brandReviewRows,reviewId} from '@/lib/trust-server';
import {reviewStats,publicReview} from '@/lib/trust';
import {eq,and,sql} from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const brandId=new URL(req.url).searchParams.get('brand')||'';const products=(await catalog()).filter(p=>p.brandId===brandId);if(!products.length)return failure(new Error('Brand not found.'),404);
 const user=await getChatGPTUser(),rows=await brandReviewRows(brandId);
 return Response.json({reviews:rows.filter(r=>r.status==='published').map(publicReview),stats:reviewStats(rows),productStats:Object.fromEntries(products.map(p=>[p.id,reviewStats(rows.filter(r=>r.productId===p.id))])),signedIn:!!user,mine:user?rows.filter(r=>r.userId===user.userId).map(r=>({...publicReview(r),status:r.status,moderationNote:r.moderationNote})):[]},{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e);}}
export async function POST(req:Request){try{
 const user=await getChatGPTUser();if(!user)return failure(new Error('Sign in to share your experience.'),401);
 const input=await body(req),db=getDb();
 if(input.action==='withdraw'){
  const row=(await db.select().from(consumerReviews).where(eq(consumerReviews.id,String(input.id))))[0];
  if(!row||row.userId!==user.userId)return failure(new Error('Review not found.'),404);
  await db.update(consumerReviews).set({status:'withdrawn',updated:new Date().toISOString(),revision:sql`${consumerReviews.revision}+1`}).where(and(eq(consumerReviews.id,row.id),eq(consumerReviews.userId,user.userId)));
  return Response.json({ok:true,status:'withdrawn'});
 }
 const r=reviewSchema.parse(input);const products=await catalog();if(!products.some(p=>p.brandId===r.brandId)||r.productId&&!products.some(p=>p.id===r.productId&&p.brandId===r.brandId))throw new Error('Choose a product from this brand.');
 const id=await reviewId(user.userId,r.brandId,r.productId),existing=(await db.select().from(consumerReviews).where(eq(consumerReviews.id,id)))[0];
 if(existing&&input.revision!==existing.revision)return failure(new Error('This review changed. Refresh before editing it.'),409);
 const {brandId,productId,...data}=r,now=new Date().toISOString();
 if(existing){
  const changed=await db.update(consumerReviews).set({data:JSON.stringify(data),status:'pending',updated:now,publishedAt:null,moderationNote:'',revision:existing.revision+1}).where(and(eq(consumerReviews.id,id),eq(consumerReviews.revision,existing.revision))).returning({id:consumerReviews.id});
  if(!changed.length)return failure(new Error('This review changed. Refresh before editing it.'),409);
 }else await db.insert(consumerReviews).values({id,userId:user.userId,brandId,productId,scope:productId||'brand',data:JSON.stringify(data),status:'pending',created:now,updated:now,revision:1}).onConflictDoNothing();
 return Response.json({ok:true,id,status:'pending'});
}catch(e){return failure(e);}}
