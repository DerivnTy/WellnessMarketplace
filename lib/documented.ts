// Placeholder ingredient copy is not a recorded fact. Shoppers see one muted row.
const placeholder = /full current ingredient list not yet transcribed/i;

export function ingredientRows(text: string): {facts?: string; unknown: boolean} {
  const value = (text || '').trim();
  if (!value || placeholder.test(value)) return {unknown: true};
  const sentences = value.split(/(?<=\.)\s+/);
  const facts = sentences.filter(sentence => !/not documented/i.test(sentence)).join(' ').trim();
  const unknown = sentences.some(sentence => /not documented/i.test(sentence));
  if (!facts) return {unknown: true};
  return {facts, unknown};
}

export function specText(value: string | undefined): string {
  const text = (value || '').trim();
  return text || 'Not documented';
}
