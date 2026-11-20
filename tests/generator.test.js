import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FIELDS, pickPair, generateResult, validateData } from '../generator.js';
const data = JSON.parse(await readFile(new URL('../data/WN_TAGS_PL.json', import.meta.url), 'utf8'));
test('Osiem kategorii i 490 kompletnych tagów', () => {
  validateData(data);
  assert.equal(data.categories.length, 8);
  assert.equal(data.categories.reduce((sum, category) => sum + category.tags.length, 0), 490);
});
test('Przykład 1 + 50: opisy i propozycje z obu tagów', () => {
  const result = generateResult(data.categories[0], ['world-abandoned-colony', 'world-minimal-contact'], () => 0);
  assert.deepEqual(result.tags.map(tag => tag.name), ['Opuszczona kolonia', 'Minimalny kontakt']);
  assert.equal(result.entries.Enemies[0], 'Oszalali ocalali');
  assert.ok(result.tags.every(tag => tag.description.length > 0));
  assert.equal(result.entries.Enemies[1], result.tags[1].Enemies[0]);
});
for (const category of data.categories) {
  test(`${category.name}: różne tagi i poprawne propozycje`, () => {
    for (let i = 0; i < 100; i++) {
      const ids = pickPair(category);
      assert.equal(new Set(ids).size, 2);
      const result = generateResult(category, ids);
      for (const field of FIELDS) {
        assert.equal(result.entries[field].length, 2);
        result.entries[field].forEach((entry, index) => assert.ok(result.tags[index][field].includes(entry)));
      }
    }
    for (const rng of [() => 0, () => 0.999999]) assert.equal(new Set(pickPair(category, rng)).size, 2);
  });
}
test('Odrzucanie powtórzeń, obcych tagów i niepełnej pary', () => {
  const category = data.categories[0];
  const id = category.tags[0].id;
  for (const ids of [[id, id], [id], [id, 'missing']]) assert.throws(() => generateResult(category, ids));
});
test('Propozycja z przecinkami pozostaje jednym elementem', () => {
  const text = 'Kupiec, który zna sekret, ale milczy';
  const tags = ['one', 'two'].map(id => ({ id, ...Object.fromEntries(FIELDS.map(field => [field, [text]])) }));
  assert.deepEqual(generateResult({ tags }, ['one', 'two']).entries.Enemies, [text, text]);
});
