import { getDb } from '@/db';
import { products, assessments, settings, audit } from '@/db/schema';
import seed from '@/data/catalog.json';
import { eq } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { Product, Assessment } from './catalog';
import { normalizeProduct } from './catalog-data';

export async function catalog(includeDrafts=false): Promise<Product[]> {
  const db=getDb();
  // Seed data independently of schema migrations; existing editorial records are never overwritten.
  if(!await setting('catalog-home-gym-10-products-2026-10-17')) {
    // D1 accepts at most 100 bound values per statement. Each product uses four.
    // A retry is safe even if an earlier request stopped partway through the seed.
    for(let offset=0;offset<seed.length;offset+=20) {
      await db.insert(products).values(seed.slice(offset,offset+20).map(p=>({id:p.id,data:JSON.stringify(p),status:p.status,updated:p.checked}))).onConflictDoNothing();
    }
    await db.insert(settings).values({key:'catalog-home-gym-10-products-2026-10-17',value:'true'}).onConflictDoNothing();
  }
  const rows=await db.select().from(products);
  return rows.filter(r=>includeDrafts||r.status==='published').map(r=>normalizeProduct({...JSON.parse(r.data),status:r.status}));
}
export async function research(): Promise<Assessment[]> {
  return (await getDb().select().from(assessments).where(eq(assessments.status,'published'))).map(r=>({...JSON.parse(r.data),id:r.id,entity:r.entity,scope:r.scope,status:r.status}));
}
export async function setting(key: string) { return (await getDb().select().from(settings).where(eq(settings.key,key)))[0]?.value; }
export async function adminUser() {
  const user=await getChatGPTUser();
  return user && await setting('owner')===user.userId ? user : null;
}
export async function log(actor: string, entity: string, action: string, data: unknown) {
  await getDb().insert(audit).values({id:crypto.randomUUID(),actor,entity,action,data:JSON.stringify(data),created:new Date().toISOString()});
}
export async function body(request: Request) {
  const origin=request.headers.get('origin');
  if(origin && new URL(origin).host!==new URL(request.url).host)throw new Error('Cross-origin requests are not accepted.');
  if(!request.headers.get('content-type')?.includes('application/json'))throw new Error('Send JSON.');
  const raw=await request.text();
  if(raw.length>32000)throw new Error('Submission is too large.');
  return JSON.parse(raw);
}
export function failure(error: unknown, status=400) {
  return Response.json({error:error instanceof Error ? error.message : 'Unable to complete request.'},{status});
}
