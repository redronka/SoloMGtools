import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FIELDS, pickPair, generateResult, validateData } from '../generator.js';

const data = JSON.parse(await readFile(new URL('../data/WN_TAGS_PL_v2.json', import.meta.url), 'utf8'));
const original = JSON.parse(await readFile(new URL('../data/WN_TAGS_PL.json', import.meta.url), 'utf8'));

test('Wersja 2: osiem kategorii i 490 kompletnych tagów', () => {
  validateData(data);
  assert.equal(data.schema_version, 2);
  assert.equal(data.categories.length, 8);
  assert.equal(data.categories.reduce((sum, category) => sum + category.tag_table.length, 0), 490);
  assert.deepEqual(Object.keys(data), ['schema_version', 'categories']);
});

for (const [index, category] of data.categories.entries()) {
  test(`${category.name}: migracja zachowuje identyfikatory, kolejność i wszystkie treści`, () => {
    const source = original.categories[index];
    assert.equal(category.id_code, source.id);
    assert.equal(category.name, source.name);
    assert.equal(category.tag_table.length, source.tags.length);
    assert.equal(Object.keys(category.tags).length, source.tags.length);
    source.tags.forEach((tag, tagIndex) => {
      assert.deepEqual(category.tag_table[tagIndex], { number: tagIndex + 1, id_code: tag.id, name: tag.name });
      assert.deepEqual(category.tags[tag.id], {
        description: tag.description,
        ...Object.fromEntries(FIELDS.map(field => [field, { options: tag[field] }])),
      });
    });
  });

  test(`${category.name}: różne tagi i propozycje z właściwych obiektów`, () => {
    for (let i = 0; i < 100; i++) {
      const ids = pickPair(category);
      assert.equal(new Set(ids).size, 2);
      const result = generateResult(category, ids);
      assert.deepEqual(result.tags.map(tag => tag.id_code), ids);
      for (const field of FIELDS) {
        assert.equal(result.entries[field].length, 2);
        result.entries[field].forEach((entry, position) => {
          assert.ok(category.tags[ids[position]][field].options.includes(entry));
        });
      }
    }
    for (const rng of [() => 0, () => 0.999999]) assert.equal(new Set(pickPair(category, rng)).size, 2);
  });
}

test('Przykład 1 + 50: nazwy, numery, opisy i propozycje z obu tagów', () => {
  const result = generateResult(data.categories[0], ['world-abandoned-colony', 'world-minimal-contact'], () => 0);
  assert.deepEqual(result.tags.map(tag => tag.name), ['Opuszczona kolonia', 'Minimalny kontakt']);
  assert.deepEqual(result.tags.map(tag => tag.number), [1, 50]);
  assert.equal(result.entries.Enemies[0], 'Oszalali ocalali');
  assert.ok(result.tags.every(tag => tag.description.length > 0));
  assert.equal(result.entries.Enemies[1], result.tags[1].Enemies.options[0]);
});

test('Odrzucanie powtórzeń, obcych tagów i niepełnej pary', () => {
  const category = data.categories[0];
  const id = category.tag_table[0].id_code;
  for (const ids of [[id, id], [id], [id, 'missing']]) assert.throws(() => generateResult(category, ids));
});

test('Propozycja z przecinkami pozostaje jednym elementem', () => {
  const text = 'Kupiec, który zna sekret, ale milczy';
  const tag_table = ['one', 'two'].map((id_code, i) => ({ id_code, number: i + 1, name: id_code }));
  const tags = Object.fromEntries(tag_table.map(row => [row.id_code, Object.fromEntries(FIELDS.map(field => [field, { options: [text] }]))]));
  assert.deepEqual(generateResult({ tag_table, tags }, ['one', 'two']).entries.Enemies, [text, text]);
});

test('Walidacja wykrywa niespójności między tabelą a obiektami tagów', () => {
  const mutations = [
    copy => { copy.schema_version = 1; },
    copy => { copy.categories[0].tag_table[0].number = 0; },
    copy => { copy.categories[0].tag_table[1].id_code = copy.categories[0].tag_table[0].id_code; },
    copy => { delete copy.categories[0].tags['world-abandoned-colony']; },
    copy => { copy.categories[0].tags.orphan = copy.categories[0].tags['world-abandoned-colony']; },
    copy => { copy.categories[0].tags['world-abandoned-colony'].Enemies.options = []; },
    copy => { copy.categories[0].tags['world-abandoned-colony'].Friends.options = ['']; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(data);
    mutate(copy);
    assert.throws(() => validateData(copy));
  }
});
