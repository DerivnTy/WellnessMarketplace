import ts from 'typescript';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
function compile(file,imports={}){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const compiled={exports:{}};new Function('require','module','exports',code)(name=>imports[name]||require(name),compiled,compiled.exports);return compiled.exports;}
const fullCatalog=JSON.parse(readFileSync('data/catalog.json','utf8'));
const laterIds=new Set(JSON.parse(readFileSync('research/high-ticket-expansion-2026-10-17.json','utf8')).products.map(p=>p.productId));
const products=fullCatalog.filter(p=>!laterIds.has(p.id));
const research=JSON.parse(readFileSync('research/catalog-expansion-2026-10-17.json','utf8'));
const ids=new Set(research.products.map(p=>p.productId)),added=products.filter(p=>ids.has(p.id));
const {productSchema}=compile('lib/validation.ts');
const {parseBrowse,browseUrl,filterProducts,facetKeys}=compile('lib/browse.ts');
const {normalizeProduct}=compile('lib/catalog-data.ts',{'@/data/catalog.json':{default:products},'./validation':{productSchema}});
let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
const find=(category,query={})=>filterProducts(products,parseBrowse(category,query));
check(added.length===22,'22 distinct researched additions');
check(products.length>=108&&new Set(products.map(p=>p.id)).size===products.length,'catalog IDs stay unique as new collections are added');
for(const [category,count] of Object.entries({recovery:10,apparel:4,supplements:4,drinks:3,nutrition:1}))check(added.filter(p=>p.category===category).length===count,category+' expansion count');
for(const p of added){
 check(productSchema.safeParse(p).success,p.id+' valid schema');
 check(existsSync('public'+p.image),p.id+' local image');
 check(p.price>0&&p.checked==='2026-10-17',p.id+' dated nonzero price');
 check(p.affiliate===false,p.id+' no invented affiliate relationship');
 check(!('score'in p)&&!('trustScore'in p),p.id+' no invented score');
 check(p.badges.length>0&&Object.keys(p.facets).length>0,p.id+' browsable details');
 check(Object.keys(p.attributes).some(k=>p.attributes[k].startsWith('https://')),p.id+' linked primary evidence');
 check(find(p.category).some(x=>x.id===p.id),p.id+' in correct department');
 if(p.category==='recovery')for(const key of ['Capacity','Power requirements','Dimensions','Warranty','Placement','Setup type'])check(Boolean(p.attributes[key]),p.id+' explicit '+key);
}
check(find('recovery',{deviceType:'cold-plunge'}).length===4,'four cold plunges');
check(find('recovery',{deviceType:'sauna'}).length===3,'three saunas');
check(find('recovery',{deviceType:'massage-chair'}).length===2,'two massage chairs');
check(find('recovery',{deviceType:'compression-boots'}).length===1,'one compression system');
check(find('recovery',{deviceType:'cold-plunge,sauna'}).length===7,'OR within device type');
check(find('recovery',{deviceType:'sauna',placement:'outdoor',power:'240v-dedicated'}).length===2,'sauna placement and power combine');
check(find('recovery',{deviceType:'cold-plunge',temperature:'below-40f',setup:'integrated'}).length===2,'cooling and integrated setup combine');
check(find('recovery',{deviceType:'cold-plunge',footprint:'under-10-sq-ft'}).map(p=>p.id).join()==='pod-icepod-pro-standard-chiller','compact footprint source-derived');
check(find('recovery',{deviceType:'sauna',footprint:'over-25-sq-ft'}).map(p=>p.id).join()==='plunge-sauna-standard','larger sauna footprint');
check(find('recovery',{power:'120v-standard'}).every(p=>p.id!=='icebarrel-500-chiller-bundle'),'unknown circuit requirement does not qualify');
check(find('recovery',{deviceType:'sauna',warranty:'1-year'}).length===2,'shortest warranty duration with full detail retained');
check(find('recovery',{min:'1000',sort:'price-desc'}).every((p,i,a)=>p.price>=1000&&(!i||p.price<=a[i-1].price)),'high-value price filter and sort');
check(find('apparel',{material:'cotton',filters:'noElastane'}).every(p=>p.id!=='mate-full-length-legging'),'cotton stretch blend excluded by no elastane');
check(find('apparel',{garment:'hoodie',material:'wool',fit:'womens'}).some(p=>p.id==='woolly-fleece-long-hoodie'),'premium wool hoodie discoverable');
check(find('supplements',{ingredient:'magnesium',form:'powder'}).some(p=>p.id==='thorne-magnesium-bisglycinate'),'powder magnesium discoverable');
check(find('drinks',{caffeine:'low'}).length>=1,'documented low caffeine gap filled');
check(find('drinks',{caffeine:'low'}).some(p=>p.brandId==='nuun'),'40mg Nuun matches low caffeine');
for(const key of ['capacity','temperature','heatType','power','placement','setup','footprint','warranty'])check(facetKeys.includes(key),key+' URL filter registered');
const state=parseBrowse('recovery',{deviceType:'cold-plunge',temperature:'below-40f',placement:'outdoor',power:'120v-dedicated',footprint:'10-25-sq-ft',warranty:'1-year'});
assert.deepEqual(parseBrowse('recovery',Object.fromEntries(new URL(browseUrl(state),'https://example.test').searchParams)),state);checks++;
// Exercise the real seed/import function against existing editorial data and a completed second run.
const tables={products:{},assessments:{},settings:{key:'key'},audit:{}};
const edited={...products[0],price:123.45,status:'draft',name:'Editorially changed product'};
const records=new Map([[tables.products,[{id:edited.id,data:JSON.stringify(edited),status:'draft',updated:'2026-10-17'}]],[tables.settings,[]]]);
let insertedCalls=0;
const db={
 select(){return {from(table){const rows=()=>records.get(table)||[];return {where(condition){return Promise.resolve(rows().filter(r=>r[condition.key]===condition.value));},then(resolve,reject){return Promise.resolve(rows()).then(resolve,reject);}};}};},
 insert(table){return {values(input){const incoming=Array.isArray(input)?input:[input];return {async onConflictDoNothing(){insertedCalls++;check(table!==tables.products||incoming.length<=20,'D1 bind limit respected');const rows=records.get(table)||[];for(const r of incoming){const key=table===tables.settings?'key':'id';if(!rows.some(x=>x[key]===r[key]))rows.push(r);}records.set(table,rows);}};}};}
};
const {catalog}=compile('lib/server.ts',{'@/db':{getDb:()=>db},'@/db/schema':tables,'@/data/catalog.json':{default:fullCatalog},'drizzle-orm':{eq:(key,value)=>({key,value})},'@/app/chatgpt-auth':{getChatGPTUser:()=>null},'./catalog-data':{normalizeProduct}});
const visible=await catalog();check(visible.length===fullCatalog.length-1,'new import preserves editorial draft');check(!visible.some(p=>p.id===edited.id),'draft stays hidden');
const all=await catalog(true);check(all.length===fullCatalog.length,'all new products imported once');check(all.find(p=>p.id===edited.id).price===123.45,'editorial price is not overwritten');
const before=insertedCalls;await catalog();check(insertedCalls===before,'completed import does not write on repeat');
console.log(`${checks} catalog expansion assertions passed.`);
