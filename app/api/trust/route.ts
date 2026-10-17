import {trustProfilesList,trustHistory,publishedTrustVersion} from '@/lib/trust-server';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const params=new URL(req.url).searchParams,brand=params.get('brand'),version=params.get('version');
 const headers={'Cache-Control':'no-store'};
 if(version){if(!brand)return Response.json({error:'A brand is required.'},{status:400,headers});const profile=await publishedTrustVersion(brand,version);return profile?Response.json({profile},{headers}):Response.json({error:'Published version not found.'},{status:404,headers});}
 const profiles=await trustProfilesList();return Response.json({profiles:brand?profiles.filter(p=>p.brandId===brand):profiles,history:brand?await trustHistory(brand):[]},{headers});
}
