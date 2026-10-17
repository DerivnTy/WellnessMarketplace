import {z} from 'zod';
import {getDb} from '@/db';
import {submissions} from '@/db/schema';
import {body,failure} from '@/lib/server';
import {httpsUrl} from '@/lib/validation';
const schema=z.object({type:z.enum(['brand','correction','experience']),name:z.string().min(2).max(100),email:z.string().email().max(250),subject:z.string().min(3).max(200),url:httpsUrl,details:z.string().min(30).max(5000),consent:z.literal(true),website:z.string().max(200).optional()});
export async function POST(req:Request){try{
  const d=schema.parse(await body(req));
  if(d.website)return Response.json({ok:true});
  const id=crypto.randomUUID();
  await getDb().insert(submissions).values({id,type:d.type,data:JSON.stringify({...d,website:undefined}),status:'new',created:new Date().toISOString()});
  return Response.json({ok:true,id});
}catch(e){return failure(e);}}
