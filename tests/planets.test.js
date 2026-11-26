import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePlanetData, pickPlanetName, formatPlanetName } from '../planets.js';

const data = JSON.parse(await readFile(new URL('../data/PLANET_NAMES_PL.json', import.meta.url), 'utf8'));
const extended = new Set(['Asteroid Belt World', 'Big World', 'Desert World', 'Ice World', 'Rad World']);
const expectedTypes = [
  'Asteroid Belt World', 'Big World', 'Cold World', 'Desert World', 'Fluid World',
  'Frozen World', 'Garden World', 'Hell World', 'Hospitable World', 'Hot World',
  'Ice World', 'Inferno World', 'Inner World', 'Inhospitable World', 'Locked World',
  'Meso World', 'Ocean World', 'Outer World', 'Panthallasic World', 'Planetoid Belt World',
  'Rad World', 'Small World', 'Storm World', 'Temperate World', 'Tiny World',
  'Tropical World', 'Tundra World', 'Twilight Zone World', 'Vacuum World', 'Water World', 'Worldlet',
];

test('Wszystkie 31 zamówionych typów i 1470 różnych nazw, z właściwą wielkością pul', () => {
  validatePlanetData(data);
  assert.deepEqual(data.types.map(type => type.name), expectedTypes);
  assert.equal(data.types.flatMap(type => type.names).length, 1470);
  for (const type of data.types) {
    assert.equal(type.names.length, extended.has(type.name) ? 60 : 45, type.name);
    assert.ok(type.names.every(name => !/[\p{Script=Cyrillic}]/u.test(name)), type.name);
  }
});

test('Każda nazwa jest osiągalna; ponowne losowanie nie powtarza poprzedniej i nie wyklucza innych', () => {
  for (const type of data.types) {
    for (let index = 0; index < type.names.length; index++) {
      assert.equal(pickPlanetName(type, undefined, () => (index + 0.5) / type.names.length), type.names[index]);
    }
    for (const previous of type.names) {
      const reached = new Set();
      for (let index = 0; index < type.names.length - 1; index++) {
        reached.add(pickPlanetName(type, previous, () => (index + 0.5) / (type.names.length - 1)));
      }
      assert.ok(!reached.has(previous));
      assert.deepEqual(reached, new Set(type.names.filter(name => name !== previous)));
    }
  }
});

test('Wynik i schowek zawierają pełną nazwę oraz oryginalny typ w nawiasie', () => {
  for (const type of data.types) assert.equal(formatPlanetName(type.names[0], type), `${type.names[0]} (${type.name})`);
});

test('Biblioteka odrzuca puste nazwy, duplikaty i nieprawidłowe typy', () => {
  const mutations = [
    copy => { copy.schema_version = 9; },
    copy => { copy.types = []; },
    copy => { copy.types[0].names = ['Jedyna']; },
    copy => { copy.types[0].names[0] = ' '; },
    copy => { copy.types[0].names[0] = copy.types[1].names[0].toUpperCase(); },
    copy => { copy.types[0].id = copy.types[1].id; },
    copy => { copy.types[0].name = copy.types[1].name; },
    copy => { copy.types[0].label = ''; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(data);
    mutate(copy);
    assert.throws(() => validatePlanetData(copy));
  }
});
