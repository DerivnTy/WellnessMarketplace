import ts from 'typescript';
import {existsSync, readFileSync, statSync} from 'node:fs';
import assert from 'node:assert/strict';

function compile(file) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => { throw new Error('unexpected import ' + name); }, module, module.exports);
  return module.exports;
}

const {ingredientRows, specText} = compile('lib/documented.ts');
assert.equal(specText(undefined), 'Not documented');
assert.equal(specText('  '), 'Not documented');
assert.equal(specText('3 years'), '3 years');
assert.deepEqual(ingredientRows('Full current ingredient list not yet transcribed. See the manufacturer label.'), {unknown: true});
assert.equal(ingredientRows('Disclosed active ingredients: creatine monohydrate. Full current unflavored ingredient panel: not documented in the source images reviewed.').facts.includes('creatine monohydrate'), true);
assert.equal(ingredientRows('Disclosed active ingredients: creatine monohydrate. Full current unflavored ingredient panel: not documented in the source images reviewed.').unknown, true);

const products = JSON.parse(readFileSync('data/catalog.json', 'utf8'));
const manifest = JSON.parse(readFileSync('data/image-manifest.json', 'utf8'));
for (const product of products) {
  const entry = manifest[product.image];
  assert.ok(entry, 'manifest ' + product.id);
  assert.equal(existsSync('public' + product.image), false, 'original stays out of the shipped public path ' + product.id);
  assert.ok(existsSync('assets/product-sources/' + product.image.split('/').pop()), 'source retained ' + product.id);
  const cardWidth = entry.widths.filter(width => width <= 640).at(-1) || entry.widths[0];
  for (const format of ['webp', 'avif']) {
    const file = `public${entry.base}-${cardWidth}.${format}`;
    assert.ok(existsSync(file), file);
    assert.ok(statSync(file).size <= 150 * 1024, file + ' is under 150KB');
  }
}
const css = readFileSync('app/globals.css', 'utf8') + readFileSync('app/mobile.css', 'utf8');
assert.equal(css.includes('cursor:wait'), false);
assert.equal(css.includes('.filter-research{display:none}'), false);
assert.equal(css.includes('.category-nav>a:nth-last-child(-n+2){display:none}'), false);
assert.equal(css.includes('--accent:#1f4e79'), true);
assert.equal(css.includes('--muted:#54595e'), true);
console.log(`${products.length} product images and foundation checks passed.`);
