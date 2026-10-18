import {guideDefinitions} from '@/components/EquipmentGuide';
import Marketplace from '@/components/marketplace';
import {catalog,research} from '@/lib/server';
import {trustProfilesList,trustHistory} from '@/lib/trust-server';
import {summarizeTrust} from '@/lib/trust';
import {notFound} from 'next/navigation';
type Props={params:Promise<{path?:string[]}>,searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props){const path=(await params).path||[];const all=await catalog();const brand=path[0]==='brands'?all.find(p=>p.brandId===path[1]):undefined;const p=path[0]==='product'?all.find(p=>p.id===path[1]):undefined;return {title:path[0]==='discover'?'Discover equipment | Wellness Marketplace':path[0]==='guides'?`${guideDefinitions.find(g=>g.slug===path[1])?.title||'Guides'} | Wellness Marketplace`:path[0]==='cart'?'Your Cart | Wellness Marketplace':brand?`${brand.brand} Evidence & Reviews | Wellness Marketplace`:path[0]==='research'?'Evidence & Consumer Reviews | Wellness Marketplace':path[0]==='methodology'?'How Brand evidence works | Wellness Marketplace':p?`${p.brand} ${p.name} | Wellness Marketplace`:['supplements','drinks'].includes(path[0])?`${path[0]==='supplements'?'Supplements by goal, ingredient & form':'Drinks by type, caffeine & ingredients'} | Wellness Marketplace`:'Wellness Marketplace — Recovery and home gym research',description:p?p.description:'Discover recovery and home gym equipment. Compare specifications, ownership details and documented sources.'};}
export default async function Page({params,searchParams}:Props){
  const path=(await params).path||[];const all=await catalog();
  const routes=['discover','guides','supplements','drinks','shop','category','search','product','brands','compare','cart','saved','research','methodology','disclosure','for-brands','submit','correction','privacy','terms','admin'];
  if((path.length && !routes.includes(path[0]))||(path[0]==='product'&&!all.some(p=>p.id===path[1]))||(path[0]==='brands'&&path[1]&&!all.some(p=>p.brandId===path[1])))notFound();
  if(path[0]==='guides'&&path.length>1&&(path.length!==2||!guideDefinitions.some(g=>g.slug===path[1])))notFound();
  const profiles=await trustProfilesList();const brandId=path[0]==='brands'?path[1]:path[0]==='product'?all.find(p=>p.id===path[1])?.brandId:undefined;
  return <Marketplace trustSummaries={profiles.map(summarizeTrust)} brandProfile={profiles.find(p=>p.brandId===brandId)} trustHistory={brandId&&path[0]==='brands'?await trustHistory(brandId):[]}  path={path.join('/')} initialQuery={await searchParams} products={all} assessments={await research()}/>;
}
