import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
function compile(file,imports={}){
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const compiled={exports:{}};
 new Function('require','module','exports',code)(name=>imports[name]||require(name),compiled,compiled.exports);
 return compiled.exports;
}
const catalog=compile('lib/catalog.ts'),browse=compile('lib/browse.ts');
const badge=compile('components/BrandEvidenceBadge.tsx');
const card=compile('components/ProductCard.tsx',{'@/lib/catalog':catalog,'@/lib/browse':browse,'./BrandEvidenceBadge':badge}).default;
const preference=compile('components/PreferenceFilters.tsx').default;
const seed=JSON.parse(readFileSync('data/catalog.json','utf8'));
let checks=0;
function check(value,label){assert.ok(value,label);checks++;}
const renderBadge=summary=>renderToStaticMarkup(React.createElement(badge.default,{brandId:'test',summary})).replace(/<[^>]*>/g,'');
for(const score of [0,77,100])check(renderBadge({score})===`Brand evidence ${score}/100`,'recorded score '+score);
for(const summary of [undefined,{}, {score:null},{score:NaN},{score:Infinity},{score:-1},{score:101},{score:90,stale:true}]){
 check(renderBadge(summary)==='Brand evidence · Not scored','missing, invalid, or stale evidence stays unscored');
}
check(renderBadge({score:77,provisional:true})==='Brand evidence 77/100','exact card wording for a provisional score');
const product={...seed[0],badges:['Badge one','Badge two','Badge three','Badge four']};
const html=renderToStaticMarkup(React.createElement(card,{product,saved:false,compared:false,cartDisabled:false,onSave(){},onCompare(){},onAddToCart(){}}));
check((html.match(/class="attribute-tag"/g)||[]).length===3&&!html.includes('Badge four'),'cards show at most three badges');
check(html.includes('Brand evidence · Not scored'),'card passes missing evidence through without a fallback score');
check(html.includes('Add to cart')&&html.includes('Compare'),'both shopping actions are present');
check(html.includes(product.name)&&html.includes(product.qty),'product name and pack information are present');
const filters=renderToStaticMarkup(React.createElement(preference,{groups:[{id:'sweeteners',label:'Sweeteners',options:[{id:'without',label:'No stevia'},{id:'zero',label:'Unavailable',count:0}]}],activeFilters:{sweeteners:['without']},onChange(){}}));
check(filters.includes('Details that matter')&&filters.includes('Reset'),'reusable sidebar heading and reset');
check(/aria-label="No stevia"[^>]*checked=""/.test(filters),'active checkbox renders without requiring a count');
check(/aria-label="Unavailable"[^>]*disabled=""/.test(filters),'explicit zero counts disable unselected choices');
console.log(`${checks} product-card and preference-component checks passed.`);
