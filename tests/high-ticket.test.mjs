import ts from 'typescript';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
function compile(file){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',code)(require,module,module.exports);return module.exports;}
const products=JSON.parse(readFileSync('data/catalog.json','utf8'));
const record=JSON.parse(readFileSync('research/high-ticket-expansion-2026-10-17.json','utf8'));
const ids=new Set(record.products.map(p=>p.productId)),added=products.filter(p=>ids.has(p.id));
const {productSchema}=compile('lib/validation.ts');
const {parseBrowse,filterProducts,browseUrl,facetValues,facetKeys,facetGroups,recoveryFacetProducts,gymEquipmentOptions,recoveryTypeOptions,selectRecoveryType}=compile('lib/browse.ts');
const {canCompare}=compile('lib/catalog.ts');
let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
const find=(category,query={})=>filterProducts(products,parseBrowse(category,query));
check(added.length>=40&&added.length<=70,'requested 40–70 distinct additions');
check(products.length===118+added.length,'original 118 products retained');
check(new Set(products.map(p=>p.id)).size===products.length,'all catalog IDs unique');
check(record.affiliateTrackingLinksInstalled===0,'no approved affiliate links represented as installed');
for(const p of added){
 check(productSchema.safeParse(p).success,p.id+' schema');
 check(existsSync('assets/product-sources/'+p.image.split('/').pop()),p.id+' real image');
 check(p.price>0&&Number.isFinite(p.price)&&p.checked==='2026-10-17',p.id+' dated real price');
 check(p.affiliate===false&&!('score'in p)&&!('trustScore'in p),p.id+' no invented commission or score');
 check(p.badges.length>=2&&p.badges.length<=4,p.id+' useful badges');
 check(Object.values(p.attributes).some(v=>v.startsWith('https://')),p.id+' source links');
 check(Boolean(p.attributes['Price basis']),p.id+' explicit priced configuration');
 check(find(p.category).some(x=>x.id===p.id),p.id+' discoverable in category');
 for(const [key,values] of Object.entries(p.facets||{})){
  check(facetKeys.includes(key),p.id+' registered '+key);
  check(values.every(v=>v&&!v.includes(',')),p.id+' URL-safe '+key);
  check(facetGroups[p.category].some(g=>g.key===key),p.id+' visible '+key);
  for(const value of values)check(find(p.category,{[key]:value}).some(x=>x.id===p.id),p.id+' filter '+key+'='+value);
 }
 if(p.category==='recovery'){
  for(const key of ['Dimensions','Warranty','Placement','Setup type','Power requirements'])check(Boolean(p.attributes[key]),p.id+' '+key);
  check(facetValues(p,'priceBand').length===1,p.id+' computed price band');
  check(p.facets.deviceType.every(v=>recoveryTypeOptions.includes(v)),p.id+' recovery collection shortcut');
  if(p.facets.deviceType.includes('home-gym'))check(p.facets.equipmentType.every(v=>gymEquipmentOptions.some(([id])=>id===v)),p.id+' gym shortcut');
 }
}
const vuori=products.find(p=>p.id==='ht-vuori-seaside-fullzip');
check(find('apparel',{material:'polyester'}).some(p=>p.id===vuori.id),'synthetic blend discoverable honestly');
check(!find('apparel',{filters:'noPolyester'}).some(p=>p.id===vuori.id),'polyester blend excluded from no-polyester');
check(!find('apparel',{filters:'allNaturalMain'}).some(p=>p.id===vuori.id),'blend not presented as all natural');
const sleep=products.find(p=>p.id==='ht-eight-sleep-pod6-queen');
check(sleep.price===2899+299,'required first-year plan included in Pod listing price');
check(sleep.badges.includes('Annual renewal')&&sleep.attributes['Ongoing cost'].includes('$299/year'),'recurring cost visible');
check(find('recovery',{deviceType:'sleep-system',subscription:'required'}).some(p=>p.id===sleep.id),'required subscription filter');
check(!find('recovery',{deviceType:'sleep-system',subscription:'no-subscription'}).some(p=>p.id===sleep.id),'subscription not falsely optional');
check(!sleep.facets.warranty,'conditional warranty does not appear as unconditional minimum');
const state=parseBrowse('recovery',{deviceType:'home-gym',equipmentType:'rowing-machine',resistance:'air',userCapacity:'500-lb-user',sort:'price-desc'});
assert.deepEqual(parseBrowse('recovery',Object.fromEntries(new URL(browseUrl(state),'https://example.test').searchParams)),state);checks++;
check(find('recovery',{deviceType:'home-gym',equipmentType:'rowing-machine'}).length>=2,'at least two actual rowers');
check(find('recovery',{deviceType:'home-gym',equipmentType:'treadmill'}).length>=2,'at least two actual treadmills');
check(recoveryFacetProducts(products,state,'resistance').every(p=>p.facets.equipmentType.includes('rowing-machine')),'cardio details scoped to rowers');
check(find('recovery',{deviceType:'home-gym',equipmentType:'treadmill',temperature:'below-40f'}).length===0,'no thermal claims leak into cardio');
check(!canCompare([sleep],find('recovery',{equipmentType:'treadmill'})[0]),'different equipment types not falsely compared');
const switched={...state,...selectRecoveryType(state,'sauna')};
check(!switched.selected.equipmentType&&!switched.selected.userCapacity,'switching collections clears incompatible cardio specs');
const drink=products.find(p=>p.id==='ht-needed-hydration-lime');
check(find('drinks',{filters:'noStevia,noSucralose',sweetener:'monk-fruit'}).some(p=>p.id===drink.id),'documented sweetener exclusions work');
check(!find('drinks',{caffeine:'caffeine-free'}).some(p=>p.id===drink.id),'unquantified caffeine does not pass zero filter');
console.log(`${checks} high-ticket catalog and filter assertions passed for ${added.length} additions.`);
