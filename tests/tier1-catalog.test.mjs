import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require = createRequire(import.meta.url);
function compile(file, imports = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => imports[name] || require(name), module, module.exports);
  return module.exports;
}

const catalog = JSON.parse(readFileSync('data/catalog.json', 'utf8'));
const baseline = JSON.parse(readFileSync('tests/fixtures/tier1-baseline.json', 'utf8'));
const addedIds = JSON.parse(readFileSync('research/tier1-catalog-2026-10-17.json', 'utf8')).products.map(p => p.productId);
const manifest = JSON.parse(readFileSync('data/image-manifest.json', 'utf8'));
const catalogLib = compile('lib/catalog.ts');
const documented = compile('lib/documented.ts');
const equipment = compile('lib/equipment.ts', {'./documented': documented});
const browse = compile('lib/browse.ts', {'./catalog': catalogLib});
const badge = compile('components/BrandEvidenceBadge.tsx');
const attribute = compile('components/AttributeValue.tsx');
const image = compile('components/ProductImage.tsx', {'@/data/image-manifest.json': {default: manifest}});
const card = compile('components/ProductCard.tsx', {'@/lib/catalog': catalogLib, '@/lib/browse': browse, '@/lib/card-facts': compile('lib/card-facts.ts', {'./documented': documented}), './BrandEvidenceBadge': badge, './ProductImage': image}).default;
const details = compile('components/ProductDetails.tsx', {
  '@/lib/catalog': catalogLib,
  '@/lib/browse': browse,
  '@/lib/equipment': equipment,
  '@/lib/documented': documented,
  './BrandEvidenceBadge': badge,
  './trust-profile': {ProductEvidence: () => null},
  './review-board': {default: () => null},
  './AttributeValue': attribute,
  './ProductImage': image,
}).default;

const verifiedUsd = {
  'rep-pr5000-power-rack': 919.99,
  'joovv-duo-3': 3699,
  'joovv-elite-3': 11099,
  'hyperice-normatec-3-full-body': 1549,
  'hyperice-normatec-3-legs': 899,
  'clearlight-sanctuary-2': 7299,
  'clearlight-premier-2': 5799,
  'clearlight-plunge': 9799,
  'force-usa-c20': 6499,
  'force-usa-g20-pro': 5999,
  'force-usa-g15': 5499,
  'speediance-gym-monster-ultra': 6999,
  'speediance-gym-monster-3s': 5299,
};
const unpriced = ['rogue-sml-2c-squat-stand', 'rep-athena-side-mount', 'mitoadapt-4', 'mitopro-plus-v2', 'perfectly-snug-smart-topper', 'sleepme-chilipad-2', 'sleepme-chilipad-cube', 'sleepme-chilipad-1'];

let checks = 0;
const check = (ok, label) => { assert.ok(ok, label); checks++; };
const get = id => catalog.find(p => p.id === id);
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

check(addedIds.length === 21, '21 tier 1 listings');
check(new Set(catalog.map(p => p.id)).size === catalog.length, 'catalog ids stay unique');
for (const id of addedIds) {
  const product = get(id);
  check(product, id + ' exists');
  check(product.affiliate === false && product.checked === '2026-10-17' && product.status === 'published', id + ' direct listing');
  check(!('score' in product) && !('trustScore' in product), id + ' has no invented evidence score');
  check(!/high-ticket|premium tier/i.test(JSON.stringify(product)), id + ' copy stays factual');
  if (unpriced.includes(id)) check(!('price' in product), id + ' omits an unverified or non-single price');
  else check(product.price === verifiedUsd[id], id + ' uses the verified USD price');
}
check(Object.keys(verifiedUsd).length + unpriced.length === addedIds.length, 'every new listing is priced or explicitly unpriced');

for (const [id, hash] of Object.entries(baseline.sha256)) {
  const current = get(id);
  check(current, 'retained ' + id);
  if (baseline.enriched[id]) continue;
  check(createHash('sha256').update(JSON.stringify(current)).digest('hex') === hash, 'unchanged ' + id);
}
for (const [id, original] of Object.entries(baseline.enriched)) {
  const current = get(id);
  const {terms, facets: currentFacets, ...rest} = current;
  const {facets: originalFacets, ...oldRest} = original;
  assert.deepEqual(rest, oldRest, id + ' existing fields');
  checks++;
  check(terms && equipment.returnDeliveryText(current)?.includes('Not documented') || terms, id + ' terms added without replacing fields');
  if (originalFacets?.warranty) {
    assert.deepEqual(currentFacets, originalFacets, id + ' warranty facet preserved');
  } else {
    const {warranty, ...restFacets} = currentFacets || {};
    assert.deepEqual(restFacets, originalFacets || {}, id + ' other facets');
    if (warranty) assert.deepEqual(warranty, ['lifetime-limited']);
  }
  checks++;
  check(current.price === original.price && current.affiliate === false, id + ' price and affiliate preserved');
}
check(get('ht-eight-sleep-pod6-queen').price === 3198 && !get('ht-eight-sleep-pod6-queen').terms, 'Eight Sleep was left unchanged');
check(get('rogue-sml2-squat-stand').price === 525 && get('rogue-sml2-squat-stand').attributes.Warranty.startsWith('Limited lifetime'), 'Rogue SML-2 warranty text preserved');

const speed = get('speediance-gym-monster-ultra');
const row = equipment.recoverySpecs.find(r => r.id === 'return-terms');
check(equipment.specValue(speed, row).includes('Return window: Not documented'), 'unverified return window is explicit');
check(equipment.specValue(speed, row).includes('Restocking fee: Not documented'), 'unverified restocking fee is explicit');
check(equipment.specValue(speed, row).includes('Return shipping: Not documented'), 'unverified return shipping is explicit');
check(equipment.comparisonRows([speed]).some(r => r.label === 'Return and delivery terms'), 'product specs include the return row');

const page = text(renderToStaticMarkup(React.createElement(details, {
  product: speed, products: catalog, saved: false, compared: false, cartDisabled: false,
  onSave() {}, onCompare() {}, onAddToCart() {}, renderCard: () => null,
})));
check(page.includes('Return and delivery terms'), 'product page shows the return and delivery row');
check(page.includes('Return window: Not documented') && page.includes('Restocking fee: Not documented') && page.includes('Return shipping: Not documented'), 'product page renders unverified terms as Not documented');
check(page.includes('Warranty') && page.includes('Not documented'), 'missing warranty renders Not documented');
check(page.includes('Brand evidence · Not scored'), 'unscored brand stays Not scored');
check(page.includes('$6,999'), 'verified Speediance price is shown');
check(!/high-ticket|premium tier/i.test(page), 'product page copy stays factual');

const unpricedPage = text(renderToStaticMarkup(React.createElement(details, {
  product: get('rogue-sml-2c-squat-stand'), products: catalog, saved: false, compared: false, cartDisabled: false,
  onSave() {}, onCompare() {}, onAddToCart() {}, renderCard: () => null,
})));
check(unpricedPage.includes('Not documented') && !unpricedPage.includes('$545') && !unpricedPage.includes('$595'), 'configurable Rogue price stays unlisted');

const cardHtml = text(renderToStaticMarkup(React.createElement(card, {
  variant: 'listing', product: get('perfectly-snug-smart-topper'), saved: false, compared: false, cartDisabled: false,
  onSave() {}, onCompare() {}, onAddToCart() {},
})));
check(cardHtml.includes('Not documented') && cardHtml.includes('Brand evidence · Not scored'), 'listing card shows an unknown price and an unscored brand');
check(!cardHtml.includes('$1,595') && !cardHtml.includes('$2,495'), 'variant range is not shown as a price');

const plunge = get('ht-plunge-plunge');
check(equipment.returnDeliveryText(plunge).includes('25% restocking fee on shipped orders'), 'Plunge restocking fee is stated as recorded');
check(!plunge.attributes.Returns, 'Plunge listing did not gain an overwritten Returns attribute');

console.log(`${checks} tier 1 catalog assertions passed.`);
