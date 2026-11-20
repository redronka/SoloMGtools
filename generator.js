export const FIELD_LABELS = {
  Enemies: 'Wrogowie',
  Friends: 'Przyjaciele',
  Complications: 'Komplikacje',
  Things: 'Rzeczy',
  Places: 'Miejsca',
};
export const FIELDS = Object.keys(FIELD_LABELS);

export function randomIndex(length, rng = Math.random) {
  if (!Number.isInteger(length) || length < 1) throw new Error('Brak elementów do losowania.');
  return Math.floor(rng() * length);
}

// Jednolite losowanie dwóch różnych pozycji z tabeli tagów.
export function pickPair(category, rng = Math.random) {
  if (category.tag_table.length < 2) throw new Error('Kategoria wymaga co najmniej dwóch tagów.');
  const first = randomIndex(category.tag_table.length, rng);
  const next = randomIndex(category.tag_table.length - 1, rng);
  const second = next >= first ? next + 1 : next;
  return [category.tag_table[first].id_code, category.tag_table[second].id_code];
}

export function generateResult(category, ids, rng = Math.random) {
  if (ids.length !== 2 || ids[0] === ids[1]) throw new Error('Wybierz dwa różne tagi.');
  const tags = ids.map(id => {
    const row = category.tag_table.find(tag => tag.id_code === id);
    const details = Object.hasOwn(category.tags, id) ? category.tags[id] : undefined;
    if (!row || !details) throw new Error('Nie znaleziono wybranych tagów.');
    return { ...row, ...details };
  });
  const entries = Object.fromEntries(FIELDS.map(field => [field, tags.map(tag => {
    const items = tag[field].options;
    // Cały element jest jedną propozycją, także gdy zawiera przecinki.
    return items[randomIndex(items.length, rng)];
  })]));
  return { tags, entries };
}

export function validateData(data) {
  if (data.schema_version !== 2) throw new Error('Wymagana wersja 2 pliku danych.');
  if (!Array.isArray(data.categories) || !data.categories.length) throw new Error('Brak kategorii w pliku danych.');
  const isText = value => typeof value === 'string' && value.trim().length > 0;
  const categoryIds = new Set();
  for (const category of data.categories) {
    if (!isText(category.id_code) || !isText(category.name) || categoryIds.has(category.id_code)) throw new Error('Nieprawidłowe identyfikatory lub nazwy kategorii.');
    categoryIds.add(category.id_code);
    if (!Array.isArray(category.tag_table) || category.tag_table.length < 2) throw new Error(`Nieprawidłowa tabela tagów: ${category.name}.`);
    if (!category.tags || typeof category.tags !== 'object' || Array.isArray(category.tags)) throw new Error(`Brak obiektów tagów: ${category.name}.`);
    const ids = new Set();
    for (const [index, row] of category.tag_table.entries()) {
      if (row.number !== index + 1 || !isText(row.id_code) || ids.has(row.id_code) || !isText(row.name)) throw new Error(`Nieprawidłowy wiersz tabeli: ${category.name}.`);
      ids.add(row.id_code);
      if (!Object.hasOwn(category.tags, row.id_code)) throw new Error(`Brak obiektu taga: ${row.id_code}.`);
      const tag = category.tags[row.id_code];
      if (!tag || !isText(tag.description)) throw new Error(`Brak opisu taga: ${row.id_code}.`);
      for (const field of FIELDS) {
        const options = tag[field]?.options;
        if (!Array.isArray(options) || !options.length || options.some(item => !isText(item))) throw new Error(`Brak propozycji: ${row.id_code} / ${field}.`);
      }
    }
    if (Object.keys(category.tags).some(id => !ids.has(id))) throw new Error(`Tag bez wpisu w tabeli: ${category.name}.`);
  }
  return data;
}
