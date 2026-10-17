import {getDb} from '@/db';
import {consumerReviews} from '@/db/schema';
import {adminUser,body,failure,log} from '@/lib/server';
import {publicReview} from '@/lib/trust';
import {and,eq,desc} from 'drizzle-orm';
import {z} from 'zod';
export const dynamic='force-dynamic';
export async function GET(){if(!await adminUser())return failure(new Error('Editor access required.'),403);const rows=await getDb().select().from(consumerReviews).orderBy(desc(consumerReviews.updated)).limit(200);return Response.json({reviews:rows.map(r=>({...publicReview(r),status:r.status,moderationNote:r.moderationNote}))},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){try{const user=await adminUser();if(!user)return failure(new Error('Editor access required.'),403);const d=z.object({id:z.string().regex(/^[a-f0-9]{64}$/),revision:z.number().int().positive(),status:z.enum(['published','rejected']),note:z.string().trim().min(20).max(800),confirm:z.literal(true)}).parse(await body(req));
 const db=getDb(),row=(await db.select().from(consumerReviews).where(eq(consumerReviews.id,d.id)))[0];if(!row||row.status==='withdrawn')return failure(new Error('This review is no longer available for moderation.'),409);
 const now=new Date().toISOString();const changed=await db.update(consumerReviews).set({status:d.status,publishedAt:d.status==='published'?now:null,moderationNote:d.note,revision:row.revision+1}).where(and(eq(consumerReviews.id,d.id),eq(consumerReviews.revision,d.revision))).returning({id:consumerReviews.id});if(!changed.length)return failure(new Error('The reviewer edited this review. Refresh and assess the latest version.'),409);
 await log(user.userId,d.id,'moderate_review',{status:d.status,note:d.note,revision:d.revision});return Response.json({ok:true});
}catch(e){return failure(e);}}
