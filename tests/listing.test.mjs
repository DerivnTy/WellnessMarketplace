import ts from 'typescript';
import {readFileSync} from 'node:fs';
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

const products = JSON.parse(readFileSync('data/catalog.json', 'utf8'));
const manifest = JSON.parse(readFileSync('data/image-manifest.json', 'utf8'));
const catalog = compile('lib/catalog.ts');
const browse = compile('lib/browse.ts');
const documented = compile('lib/documented.ts');
const facts = compile('lib/card-facts.ts', {'./documented': documented});
const badge = compile('components/BrandEvidenceBadge.tsx');
const image = compile('components/ProductImage.tsx', {'@/data/image-manifest.json': {default: manifest}});
const card = compile('components/ProductCard.tsx', {'@/lib/catalog': catalog, '@/lib/browse': browse, '@/lib/card-facts': facts, './BrandEvidenceBadge': badge, './ProductImage': image}).default;
const preference = compile('components/PreferenceFilters.tsx');
const listingState = compile('components/ListingState.tsx');
const grid = compile('components/catalog-motion.tsx', {'./home-motion': {usePageMotion: () => ({running: false}), MotionToggle: () => null}, './ProductImage': image, '@/lib/catalog': catalog}).SmoothProductGrid;
const browser = compile('components/catalog-browser.tsx', {
  '@/lib/catalog': catalog,
  '@/lib/browse': browse,
  './PreferenceFilters': preference,
  './ListingState': listingState,
  './home-motion': {HomeMotion: ({children}) => React.createElement('div', null, children), BrandCarousel: () => null},
  './catalog-motion': {DepartmentHero: () => null, SmoothProductGrid: grid},
}).default;

let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const get = id => products.find(product => product.id === id);
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

const empty = {id: 'empty', slug: 'empty', name: 'Untitled', brand: 'Example', brandId: 'example', category: 'recovery', type: 'sauna', description: '', image: '', price: 10, qty: '1 unit', variant: '', source: '', url: '', checked: '', available: true, status: 'published', affiliate: false, badges: [], attributes: {}, ingredients: '', filters: {}};
const emptyFacts = facts.cardFacts(empty);
check(emptyFacts.length >= 2 && emptyFacts.length <= 3, 'a card shows two or three decision facts');
check(emptyFacts.every(fact => fact.value === 'Not documented'), 'missing specs read Not documented');
check(!JSON.stringify(emptyFacts).includes('/100'), 'missing specs do not invent a score');

const panel = get('hooga-hg300');
const panelFacts = facts.cardFacts(panel);
check(panelFacts.some(fact => fact.label === 'Wavelengths' && fact.value === panel.attributes.Wavelengths), 'recorded wavelengths are copied');
check(panelFacts.every(fact => fact.value === 'Not documented' || fact.value === panel.attributes[fact.label]), 'card facts never invent a value');
const drink = get('cure-tropical-punch');
const drinkFacts = facts.cardFacts(drink);
check(drinkFacts.some(fact => fact.label === 'Caffeine' && fact.value === 'Not documented'), 'a missing lead spec reads Not documented');
check(drinkFacts.some(fact => fact.value === drink.attributes['Added sugar']), 'recorded drink facts stay exact');

const tee = get('mate-tee');
const teeFacts = facts.cardFacts(tee);
check(teeFacts.some(fact => fact.value === '145 GSM'), 'an alternate fabric key still uses the recorded value');
check(teeFacts.some(fact => fact.value === 'Not documented'), 'a missing apparel spec reads Not documented');

const renderCard = (product, summary) => renderToStaticMarkup(React.createElement(card, {variant: 'listing', product, evidence: summary, saved: false, compared: false, cartDisabled: false, onSave() {}, onCompare() {}, onAddToCart() {}}));
const unscored = renderCard(drink);
check(unscored.includes('Brand evidence Not scored'), 'listing card says Brand evidence Not scored');
check(!unscored.includes('Add to cart'), 'listing card has one primary action');
check(unscored.includes('View product') && unscored.includes('Compare'), 'primary link and Compare are both present');
check(unscored.includes('Not documented'), 'listing card renders Not documented');
check(unscored.includes(`href="/product/${drink.id}"`) && unscored.includes(`alt="${drink.name}, ${drink.brand}"`), 'product link and alt text are present');
const entry = manifest[drink.image];
check(unscored.includes(`width="${entry.width}"`) && unscored.includes(`height="${entry.height}"`), 'optimized image keeps width and height');
const scored = text(renderCard(panel, {score: 77, brandId: panel.brandId}));
check(scored.includes('Brand evidence 77/100'), 'listing card uses the recorded evidence score');
check(!scored.includes('high-ticket') && !scored.includes('premium tier'), 'listing card copy stays factual');

const list = renderToStaticMarkup(React.createElement(grid, {products: [panel, tee], renderCard: product => React.createElement('article', null, product.name)}));
check(list.startsWith('<ul') && (list.match(/<li /g) || []).length === 2, 'the listing grid is a semantic list');
check(list.includes('aria-label="Products"'), 'the product list has an accessible name');

const filters = renderToStaticMarkup(React.createElement(preference.default, {groups: [{id: 'sweeteners', label: 'Sweeteners', options: [{id: 'without', label: 'No stevia'}, {id: 'zero', label: 'Unavailable', count: 0}]}], activeFilters: {sweeteners: ['without']}, onChange() {}}));
check(filters.includes('aria-expanded="true"') && filters.includes('Sweeteners'), 'filter groups are expandable');
check(filters.includes('No stevia') && filters.includes('Unavailable'), 'filter choices stay in the document when the group is open');
check(!filters.includes('display:none'), 'open filter groups are not hidden with inline CSS');

const loading = renderToStaticMarkup(React.createElement(listingState.ListingLoading));
const emptyState = renderToStaticMarkup(React.createElement(listingState.ListingEmpty, {title: 'No products match.', text: 'No products match these filters.'}));
check(text(loading).includes('Loading products.'), 'loading state is factual');
check(text(emptyState).includes('No products match.'), 'empty state is factual');

const recovery = renderToStaticMarkup(React.createElement(browser, {products, category: 'recovery', query: {deviceType: 'cold-plunge'}, renderCard: product => React.createElement(card, {variant: 'listing', product, saved: false, compared: false, cartDisabled: false, onSave() {}, onCompare() {}, onAddToCart() {}}), onCategoryChange() {}}));
check(recovery.includes('filter-chip') && recovery.includes('Remove Cold plunges filter'), 'active filters render as removable chips');
check(recovery.includes('browse-result-count') && recovery.includes('Sort by'), 'listing shows a result count and sort control');
check((recovery.match(/<li /g) || []).length > 0, 'a recovery listing renders product cards in the list');
const none = renderToStaticMarkup(React.createElement(browser, {products, category: 'recovery', query: {q: 'zzzz-not-a-product'}, pending: false, renderCard: product => product.name, onCategoryChange() {}}));
check(none.includes('No products match.'), 'an unmatched search uses the empty state');
const waiting = renderToStaticMarkup(React.createElement(browser, {products, category: 'drinks', query: {}, pending: true, renderCard: product => product.name, onCategoryChange() {}}));
check(waiting.includes('Loading products.'), 'a pending listing uses the loading state');

const css = readFileSync('app/listing.css', 'utf8');
const globals = readFileSync('app/globals.css', 'utf8') + readFileSync('app/mobile.css', 'utf8');
check(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css), 'mobile and tablet listings use two columns');
check(/min-width:\s*1100px\)\{\.catalog-page \.listing-grid\{grid-template-columns:repeat\(3/.test(css), 'listings use three columns from 1100px');
check(/min-width:\s*1450px\)\{\.catalog-page \.listing-grid\{grid-template-columns:repeat\(4/.test(css), 'listings use four columns from 1450px');
check(css.includes('aspect-ratio:1/1') && css.includes('min-height:44px'), 'cards keep a fixed image ratio and 44px targets');
check(!globals.includes('.contextual-filters .department-filter-block{display:none}'), 'department filters are not removed with mobile CSS');
check(!css.includes('.card-facts{display:none}') && !css.includes('high-ticket'), 'listing facts stay visible without hype wording');
for (const size of css.match(/font-size:\s*(\d+)px/g) || []) {
  check(Number(size.match(/\d+/)[0]) >= 12, 'listing text stays at least 12px: ' + size);
}

console.log(`${checks} listing card, grid, and filter checks passed.`);
