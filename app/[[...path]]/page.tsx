import Marketplace from '@/components/marketplace';
import {catalog,research} from '@/lib/server';
import {trustProfilesList,trustHistory} from '@/lib/trust-server';
import {summarizeTrust} from '@/lib/trust';
import {notFound} from 'next/navigation';
type Props={params:Promise<{path?:string[]}>,searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props){const path=(await params).path||[];const all=await catalog();const brand=path[0]==='brands'?all.find(p=>p.brandId===path[1]):undefined;const p=path[0]==='product'?all.find(p=>p.id===path[1]):undefined;return {title:path[0]==='cart'?'Your Cart | Wellness Marketplace':brand?`${brand.brand} Evidence & Reviews | Wellness Marketplace`:path[0]==='research'?'Evidence & Consumer Reviews | Wellness Marketplace':path[0]==='methodology'?'How Trust Scores Work | Wellness Marketplace':p?`${p.brand} ${p.name} | Wellness Marketplace`:['supplements','drinks'].includes(path[0])?`${path[0]==='supplements'?'Supplements by goal, ingredient & form':'Drinks by type, caffeine & ingredients'} | Wellness Marketplace`:'Wellness Marketplace — Better choices, all in one place.',description:p?p.description:'Discover and compare wellness products, ingredient details and independent community research. A clearer way to shop.'};}
export default async function Page({params,searchParams}:Props){
  const path=(await params).path||[];const all=await catalog();
  const routes=['supplements','drinks','shop','category','search','product','brands','compare','cart','saved','research','methodology','disclosure','for-brands','submit','correction','privacy','terms','admin'];
  if((path.length && !routes.includes(path[0]))||(path[0]==='product'&&!all.some(p=>p.id===path[1]))||(path[0]==='brands'&&path[1]&&!all.some(p=>p.brandId===path[1])))notFound();
  const profiles=await trustProfilesList();const brandId=path[0]==='brands'?path[1]:path[0]==='product'?all.find(p=>p.id===path[1])?.brandId:undefined;
  return <Marketplace trustSummaries={profiles.map(summarizeTrust)} brandProfile={profiles.find(p=>p.brandId===brandId)} trustHistory={brandId&&path[0]==='brands'?await trustHistory(brandId):[]}  path={path.join('/')} initialQuery={await searchParams} products={all} assessments={await research()}/>;
}
