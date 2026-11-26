import { randomIndex } from './generator.js?v=2';

export function validatePlanetData(data) {
  if (data?.schema_version !== 1 || !Array.isArray(data.types) || !data.types.length) {
    throw new Error('Nieprawidłowa biblioteka nazw planet.');
  }
  const isText = value => typeof value === 'string' && value === value.trim() && value.length > 0;
  const ids = new Set();
  const types = new Set();
  const names = new Set();
  for (const type of data.types) {
    if (!isText(type.id) || !/^[a-z]+(?:-[a-z]+)*$/.test(type.id) || ids.has(type.id) ||
        !isText(type.name) || types.has(type.name) || !isText(type.label) ||
        !Array.isArray(type.names) || type.names.length < 2) {
      throw new Error('Nieprawidłowy typ planety.');
    }
    ids.add(type.id);
    types.add(type.name);
    for (const name of type.names) {
      const key = typeof name === 'string' ? name.normalize('NFC').toLocaleLowerCase('pl') : name;
      if (!isText(name) || names.has(key)) throw new Error(`Nieprawidłowa lub powtórzona nazwa: ${name}.`);
      names.add(key);
    }
  }
  return data;
}

// Każda nazwa ma równe szanse; pomijamy tylko poprzedni wynik tego typu.
export function pickPlanetName(type, previousName, rng = Math.random) {
  const previousIndex = type.names.indexOf(previousName);
  const index = randomIndex(type.names.length - (previousIndex >= 0 ? 1 : 0), rng);
  return type.names[index + (previousIndex >= 0 && index >= previousIndex ? 1 : 0)];
}

export function formatPlanetName(name, type) {
  return `${name} (${type.name})`;
}
