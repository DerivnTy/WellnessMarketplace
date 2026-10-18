import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
function compile(file,imports={}){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',code)(name=>imports[name]||require(name),module,module.exports);return module.exports;}
const seed=JSON.parse(readFileSync('data/catalog.json','utf8'));
const baseline=JSON.parse(readFileSync('tests/fixtures/tier1-baseline.json','utf8'));
const additions=new Set(JSON.parse(readFileSync('research/tier1-catalog-2026-10-17.json','utf8')).products.map(p=>p.productId));
const normalizer=compile('lib/catalog-data.ts',{'@/data/catalog.json':{default:seed},'./validation':compile('lib/validation.ts')});
const enrichedId=Object.keys(baseline.enriched).find(id=>seed.find(p=>p.id===id)?.terms);
const original=baseline.enriched[enrichedId],current=seed.find(p=>p.id===enrichedId);
assert.deepEqual(normalizer.normalizeProduct(original).terms,current.terms,'older matching records receive researched terms');
const customTerms={returnWindow:'Editorial correction',sources:[]};
assert.deepEqual(normalizer.normalizeProduct({...original,terms:customTerms}).terms,customTerms,'editorial terms win');
assert.equal(normalizer.normalizeProduct({...original,terms:undefined}).terms,undefined,'explicit clearing is preserved');
assert.equal(normalizer.normalizeProduct({...original,attributes:{...original.attributes,Warranty:'Edited warranty'}}).terms,undefined,'changed facts are not backfilled');
assert.equal(normalizer.normalizeProduct({...original,source:'https://example.com/corrected-source'}).terms,undefined,'changed source is not backfilled');
const productTable={},settingsTable={key:'key'};
const stored=new Map(seed.filter(p=>!additions.has(p.id)).map(p=>{const old=baseline.enriched[p.id]||p;return [p.id,{id:p.id,status:p.status,data:JSON.stringify(old),updated:p.checked}];}));
const settings=new Map([['catalog-high-ticket-expansion-2026-10-17','true']]);
const edited=seed.find(p=>!additions.has(p.id)&&p.id!==enrichedId);
stored.set(edited.id,{...stored.get(edited.id),data:JSON.stringify({...edited,name:'Editorially corrected product name'})});
const withdrawnId=[...additions][0];const withdrawn=seed.find(p=>p.id===withdrawnId);
stored.set(withdrawnId,{id:withdrawnId,status:'draft',data:JSON.stringify({...withdrawn,status:'draft'}),updated:withdrawn.checked});
let writes=0;
const db={
 select:()=>({from:table=>table===productTable?[...stored.values()]:{where:key=>settings.has(key)?[{value:settings.get(key)}]:[]}}),
 insert:table=>({values:values=>({onConflictDoNothing:async()=>{writes++;for(const value of Array.isArray(values)?values:[values]){if(table===productTable&&!stored.has(value.id))stored.set(value.id,value);if(table===settingsTable&&!settings.has(value.key))settings.set(value.key,value.value);}}})}),
};
const server=compile('lib/server.ts',{'@/db':{getDb:()=>db},'@/db/schema':{products:productTable,settings:settingsTable},'@/data/catalog.json':{default:seed},'drizzle-orm':{eq:(_,key)=>key},'@/app/chatgpt-auth':{},'./catalog-data':normalizer});
const result=await server.catalog();
assert.equal(stored.size,seed.length,'new listings reach an already-seeded database');
assert.equal(result.length,seed.length-1,'withdrawn listing stays unpublished');
assert.ok(result.some(p=>p.id===[...additions][1]),'new listing appears publicly');
assert.equal(result.find(p=>p.id===edited.id).name,'Editorially corrected product name','seed never overwrites editorial records');
assert.deepEqual(result.find(p=>p.id===enrichedId).terms,current.terms,'live catalog exposes researched terms');
const firstWrites=writes;await server.catalog();
assert.equal(writes,firstWrites,'completed import does not repeat writes');
assert.ok((await server.catalog(true)).some(p=>p.id===withdrawnId&&p.status==='draft'),'editor can still access withdrawn record');
console.log('Catalog deployment checks passed: existing database, new listings, editorial overrides, drafts, terms and idempotency.');
