import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

function compile(file, imports) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => imports[name], module, module.exports);
  return module.exports;
}

const product = {id: 'sample', url: 'https://example.com/product'};
let logged = 0;
const route = compile('app/api/out/route.ts', {
  '@/db': {getDb() { return {insert() { return {values: async () => { logged += 1; if (logged === 1) throw new Error('log failed'); }}; }}; }},
  '@/db/schema': {events: {}},
  '@/lib/server': {catalog: async () => [product]},
});

const failed = await route.GET(new Request('http://localhost/api/out?id=sample'));
assert.equal(failed.status, 302);
assert.equal(failed.headers.get('location'), product.url);
const loggedRedirect = await route.GET(new Request('http://localhost/api/out?id=sample'));
assert.equal(loggedRedirect.status, 302);
assert.equal(logged, 2);
const missing = await route.GET(new Request('http://localhost/api/out?id=missing'));
assert.equal(missing.status, 404);
console.log('out redirect stays available when click logging fails');
