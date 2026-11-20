export const FIELDS = ['Enemies', 'Friends', 'Complications', 'Things', 'Places'];

export function randomIndex(length, rng = Math.random) {
  if (!Number.isInteger(length) || length < 1) throw new Error('Brak elementów do losowania.');
  return Math.floor(rng() * length);
}

// Jednolite losowanie z tags, zgodnie z sampling.tag_selection w źródłowym JSON.
export function pickPair(category, rng = Math.random) {
  if (category.tags.length < 2) throw new Error('Kategoria wymaga co najmniej dwóch tagów.');
  const first = randomIndex(category.tags.length, rng);
  const next = randomIndex(category.tags.length - 1, rng);
  const second = next >= first ? next + 1 : next;
  return [category.tags[first].id, category.tags[second].id];
}

export function generateResult(category, ids, rng = Math.random) {
  if (ids.length !== 2 || ids[0] === ids[1]) throw new Error('Wybierz dwa różne tagi.');
  const tags = ids.map(id => category.tags.find(tag => tag.id === id));
  if (tags.some(tag => !tag)) throw new Error('Nie znaleziono wybranych tagów.');
  const entries = Object.fromEntries(FIELDS.map(field => [field, tags.map(tag => {
    const items = tag[field];
    // Cały element jest jedną propozycją, także gdy zawiera przecinki.
    return items[randomIndex(items.length, rng)];
  })]));
  return { tags, entries };
}

export function validateData(data) {
  if (!Array.isArray(data.categories) || !data.categories.length) throw new Error('Brak kategorii w pliku danych.');
  const categoryIds = new Set();
  for (const category of data.categories) {
    if (!category.id || categoryIds.has(category.id)) throw new Error('Nieprawidłowe identyfikatory kategorii.');
    categoryIds.add(category.id);
    if (!Array.isArray(category.tags) || category.tags.length < 2 || category.tag_count !== category.tags.length) throw new Error(`Nieprawidłowa liczba tagów: ${category.name}.`);
    const ids = new Set();
    for (const tag of category.tags) {
      if (!tag.id || ids.has(tag.id) || !tag.name || !tag.description) throw new Error(`Nieprawidłowy tag: ${category.name}.`);
      ids.add(tag.id);
      for (const field of FIELDS) {
        if (!Array.isArray(tag[field]) || !tag[field].length || tag[field].some(item => typeof item !== 'string' || !item.trim())) throw new Error(`Brak propozycji: ${tag.id} / ${field}.`);
      }
    }
  }
  return data;
}
