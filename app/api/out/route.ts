import {getDb,vercelWithoutD1} from '@/db';
import {events} from '@/db/schema';
import {catalog} from '@/lib/server';
export async function GET(req:Request){
  const id=new URL(req.url).searchParams.get('id');const product=(await catalog()).find(p=>p.id===id);
  if(!product)return Response.json({error:'Product not found.'},{status:404});
  if(new URL(product.url).protocol!=='https:')return Response.json({error:'Invalid merchant link.'},{status:400});
  try{await getDb().insert(events).values({id:crypto.randomUUID(),name:'merchant_click',product:product.id,created:new Date().toISOString()});}
  catch(error){if(!vercelWithoutD1(error))throw error;}
  return Response.redirect(product.url,302);
}
