import ts from 'typescript';
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const expansionIds=new Set(['research/catalog-expansion-2026-10-17.json','research/home-gym-expansion-2026-10-17.json','research/high-ticket-expansion-2026-10-17.json','research/tier1-catalog-2026-10-17.json'].flatMap(file=>JSON.parse(readFileSync(file,'utf8')).products.map(p=>p.productId)));
// Keep baseline regressions stable; additions have separate full-catalog coverage.
const seed=JSON.parse(readFileSync('data/catalog.json','utf8')).filter(p=>!expansionIds.has(p.id));
function compile(file,imports={}){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',code)(name=>imports[name]||require(name),module,module.exports);return module.exports;}
const {productSchema}=compile('lib/validation.ts');
const {normalizeProduct}=compile('lib/catalog-data.ts',{'@/data/catalog.json':{default:seed},'./validation':{productSchema}});
const {parseBrowse,browseUrl,filterProducts,matches,caffeineBand}=compile('lib/browse.ts');
let checks=0;const check=(value,label)=>{assert.ok(value,label);checks++;};
for(const p of seed){productSchema.parse(p);check(existsSync('assets/product-sources/'+p.image.split('/').pop()),'local image '+p.id);check(p.affiliate===false,'no implied affiliate');}
check(seed.length===86,'86 products');check(new Set(seed.map(p=>p.id)).size===86,'unique IDs');check(new Set(seed.map(p=>p.brandId)).size===56,'56 brands');
const find=(category,query={})=>filterProducts(seed,parseBrowse(category,query));
check(find('supplements').length===44,'supplement total');check(find('drinks').length===21,'drink total');check(find('apparel').length===15,'apparel total');
check(find('supplements',{goals:'sleep',form:'gummy',filters:'noMelatonin'}).map(p=>p.id).sort().join()==='bpn-peak-sleep-berry,maryruths-adult-sleep-gummies','specific combined goal/form/exclusion');
check(find('supplements',{ingredient:'ashwagandha,magnesium'}).length>find('supplements',{ingredient:'ashwagandha'}).length,'OR within facet');
check(find('supplements',{goals:'sleep',ingredient:'ashwagandha'}).every(p=>p.facets.goals.includes('sleep')&&p.facets.ingredient.includes('ashwagandha')),'AND across groups');
check(!find('supplements',{filters:'caffeineFree'}).some(p=>p.id==='transparent-labs-creatine-hmb'),'unknown caffeine excluded');
check(find('drinks',{drinkType:'hydration',filters:'noStevia'}).some(p=>p.id==='lmnt-raw-unflavored'),'unsweetened hydration findable');
check(!find('drinks',{caffeine:'caffeine-free'}).some(p=>p.id==='skratch-sport-lemon-lime'),'unknown zero caffeine excluded');
check(find('drinks',{drinkType:'energy',caffeine:'high'}).length===3,'energy caffeine filter');
check(find('apparel',{filters:'noElastane'}).every(p=>p.filters.noElastane),'apparel absence filter');
check(find('apparel',{material:'wool',fit:'womens'}).length===1,'fabric and collection');
check(find('hydration').length===8,'legacy hydration route retains narrowed selection');
check(find('',{min:'20',max:'25'}).every(p=>p.price>=20&&p.price<=25),'price bounds');check(find('',{min:'50',max:'10'}).length===0,'inverted bounds empty');
const sorted=find('supplements',{sort:'price-asc'});check(sorted.every((p,i)=>!i||p.price>=sorted[i-1].price),'price sorting');
const state=parseBrowse('supplements',{goals:'sleep',form:'gummy',brands:'olly,maryruths',min:'10',max:'30',filters:'noMelatonin',sort:'name',q:'sleep'});const u=new URL(browseUrl(state),'https://example.test');assert.deepEqual(parseBrowse('supplements',Object.fromEntries(u.searchParams)),state);checks++;
const base=seed[0],legacy={...base,category:'hydration',facets:undefined,filters:{stevia:true}};check(normalizeProduct(legacy).facets.drinkType.includes('hydration'),'legacy taxonomy enrichment');
const edited={...legacy,name:'Editorial override',price:99,status:'draft',filters:{noSucralose:false}};const n=normalizeProduct(edited);check(n.price===99&&n.status==='draft'&&!n.facets&&n.filters.noSucralose===false,'editor changes preserved');
const explicit={...legacy,facets:{},filters:{noSucralose:false}};check(Object.keys(normalizeProduct(explicit).facets).length===0&&!normalizeProduct(explicit).filters.noSucralose,'explicit taxonomy and flag override preserved');
// Boundary checks prevent the old 1–80 mg range from being relabeled as <50 mg.
for(const [mg,band] of [[0,'caffeine-free'],[0.5,'low'],[49.9,'low'],[50,'moderate'],[80,'moderate'],[150,'moderate'],[150.1,'high']]){
 check(caffeineBand({...base,category:'drinks',attributes:{Caffeine:`${mg} mg / serving`}})===band,`documented caffeine boundary ${mg}`);
}
check(caffeineBand({...base,category:'drinks',attributes:{},facets:{caffeine:['low']},filters:{caffeineFree:true}})===null,'legacy tags and flags cannot invent a caffeine amount');
check(caffeineBand({...base,category:'drinks',attributes:{Caffeine:'Contains caffeine; amount not specified'}})===null,'unknown caffeine is not none');
check(caffeineBand({...base,category:'drinks',attributes:{Caffeine:'Caffeine-free, per brand FAQ'}})==='caffeine-free','explicit brand caffeine-free statement qualifies');
check(caffeineBand({...base,category:'drinks',attributes:{Caffeine:'20 mg / 100 g'}})===null,'unsupported units are not treated as serving amounts');
check(find('drinks',{caffeine:'low'}).length===0,'no current drinks falsely qualify for under 50 mg');
check(find('drinks',{caffeine:'moderate'}).map(p=>p.id).sort().join()==='gorgie-peach-tea,olipop-vintage-cola,skratch-caffeinated-lemon-lime','50 mg drinks move into the moderate band');
check(find('drinks',{caffeine:'caffeine-free'}).length===8,'documented caffeine-free choices');
check(find('drinks',{filters:'noSucralose,noStevia'}).every(p=>p.filters.noSucralose===true&&p.filters.noStevia===true),'sweetener exclusions combine with AND');
check(find('drinks',{filters:'noStevia,stevia'}).length===0,'contradictory sweetener requests show an empty result');
check(find('drinks',{filters:'zeroSugar'}).every(p=>p.filters.zeroSugar===true),'unknown sugar is excluded');
check(!find('drinks',{filters:'noStevia'}).some(p=>p.id==='hopwtr-classic-six'),'missing stevia review is not an absence claim');
check(find('',{caffeine:'moderate',filters:'noSucralose,stevia'}).map(p=>p.id).sort().join()==='gorgie-peach-tea,olipop-vintage-cola','shop combines caffeine and preference groups');
check(find('drinks',{caffeine:'low,moderate'}).length===3,'OR within a caffeine group');
console.log(`${checks} catalog/filter assertions passed, including all 86 schema/image checks.`);
