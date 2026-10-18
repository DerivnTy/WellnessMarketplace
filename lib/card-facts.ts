import type {Product} from './catalog';
import {specText} from './documented';

type Slot = {keys: string[]};

// Priority is editorial, but every value is copied from the product record.
// An empty or non-text slot stays "Not documented" rather than a guessed spec.
const slotsFor = (product: Product): Slot[] => {
  if (product.category === 'drinks') return slots('Caffeine', 'Added sugar', 'Total sugar', 'Serving size', 'Sodium', 'Calories');
  if (product.category === 'nutrition') return slots('Protein', 'Added sugar', 'Calories', 'Total sugar', 'Serving size');
  if (product.category === 'apparel') return slots(['Main fabric', 'Fabric'], 'Fit', 'Fabric weight', 'Care', 'Inseam');
  if (product.category === 'supplements') return slots('Serving size', 'Amount per serving', 'Form', 'Servings per container', 'Protein', 'Creatine', 'Ingredient', 'Package');
  if (product.category === 'recovery') return recoverySlots(product);
  return slots(['Serving size'], ['Form'], ['Warranty']);
};

const slots = (...groups: (string | string[])[]): Slot[] => groups.map(group => ({keys: Array.isArray(group) ? group : [group]}));

function recoverySlots(product: Product): Slot[] {
  const type = product.facets?.deviceType?.[0] || product.type;
  if (product.facets?.deviceType?.includes('home-gym') || type === 'home-gym') {
    if (['adjustable-dumbbells', 'weight-plates', 'barbell'].includes(product.type)) return slots('Weight range', 'Dimensions', 'Warranty', 'Construction');
    if (['power-rack', 'bench'].includes(product.type)) return slots('Weight capacity', 'Dimensions', 'Warranty', 'Included');
    if (product.type === 'functional-trainer') return slots('Resistance', 'Dimensions', 'Warranty', 'Weight capacity');
    return slots('Dimensions', 'Warranty', 'Weight capacity', 'Resistance');
  }
  if (type === 'cold-plunge') return slots('Temperature range', 'Dimensions', 'Warranty', 'Power requirements');
  if (type === 'sauna') return slots('Heat type', 'Capacity', 'Dimensions', 'Warranty');
  if (type === 'massage-chair') return slots('Dimensions', ['User capacity', 'Capacity'], 'Warranty', 'Power requirements');
  if (type === 'red-light-panel') return slots('Wavelengths', 'Power consumption', 'Warranty', 'Dimensions');
  if (type === 'compression-boots') return slots('Pressure range', 'Dimensions', 'Warranty', ['Battery life', 'Battery']);
  if (type === 'percussion-massager') return slots('Battery life', 'Settings', 'Warranty', 'Dimensions');
  if (type === 'sleep-system') return slots(['Ongoing cost', 'Subscription'], 'Dimensions', 'Warranty', 'Temperature range');
  return slots('Warranty', 'Dimensions', 'Power requirements', 'Setup type');
}

export function factValue(raw: string | undefined): string {
  const text = specText(raw).replace(/\s+/g, ' ').trim();
  if (text === 'Not documented' || /^https?:\/\//i.test(text)) return 'Not documented';
  return text;
}

export type CardFact = {label: string; value: string};

function recordedFact(product: Product, slot: Slot): CardFact | undefined {
  return slot.keys.map(key => ({label: key, value: factValue(product.attributes[key])})).find(fact => fact.value !== 'Not documented');
}

export function cardFacts(product: Product): CardFact[] {
  const slots = slotsFor(product);
  const facts: CardFact[] = [];
  const [lead, ...rest] = slots;
  if (lead) facts.push(recordedFact(product, lead) || {label: lead.keys[0], value: 'Not documented'});
  for (const slot of rest) {
    if (facts.length >= 3) break;
    const recorded = recordedFact(product, slot);
    if (recorded) facts.push(recorded);
  }
  for (const slot of rest) {
    if (facts.length >= 3) break;
    if (facts.some(fact => slot.keys.includes(fact.label))) continue;
    facts.push({label: slot.keys[0], value: 'Not documented'});
  }
  return facts.slice(0, 3);
}
