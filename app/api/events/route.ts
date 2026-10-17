import {z} from 'zod';
import {getDb} from '@/db';
import {events} from '@/db/schema';
import {body,failure} from '@/lib/server';
const schema=z.object({name:z.enum(['save','compare','search']),product:z.string().regex(/^[a-z0-9-]{2,80}$/).optional()});
export async function POST(req:Request){try{const d=schema.parse(await body(req));await getDb().insert(events).values({id:crypto.randomUUID(),name:d.name,product:d.product,created:new Date().toISOString()});return Response.json({ok:true});}catch(e){return failure(e);}}
