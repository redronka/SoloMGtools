import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGeneratorLibrary, generateSet, updateChoice, rerollSet, flattenNodes, rollTable, rowText, formatName, formatNameEntry, formatGeneratorSet } from '../generators.js';

const data = JSON.parse(await readFile(new URL('../data/WN_GENERATORS_PL.json', import.meta.url), 'utf8'));
const tags = JSON.parse(await readFile(new URL('../data/WN_TAGS_PL_v2.json', import.meta.url), 'utf8'));
const library = createGeneratorLibrary(data, tags);
const tables = result => flattenNodes(result.tree).filter(node => node.kind === 'table');
const choices = result => flattenNodes(result.tree).filter(node => node.kind === 'choice');
const find = (result, id) => tables(result).find(node => node.tableId === id);
const choose = (result, id, rowIndex, rng = () => 0) => {
  const node = find(result, id);
  return updateChoice(library, result, node.key, library.tables.get(id).rows[rowIndex].id, rng);
};
function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
}

test('Kompletna biblioteka: 15 grup, 50 generatorów, 253 tabele, 3761 wierszy i 142 opisy', () => {
  assert.equal(data.categories.length, 15);
  assert.equal(data.generators.length, 50);
  assert.equal(data.tables.length, 253);
  assert.equal(data.tables.reduce((sum, table) => sum + table.rows.length, 0), 3761);
  assert.equal(data.records.length, 142);
  assert.equal(library.categories.length, 13);
  assert.ok(!library.categories.some(category => category.id === 'cyberpunk-missions'));
  const missions = library.categories.find(category => category.id === 'missions');
  assert.equal(missions.name_pl, 'Misje');
  assert.equal(missions.generator_ids.length, 11);
  assert.ok(missions.generator_ids.includes('mission-defense'));
  assert.ok(missions.generator_ids.includes('mission-theft'));
  assert.ok(missions.generator_ids.includes('one-roll-mission'));
  assert.ok(!library.categories.some(category => category.id === 'one-roll-characters'));
  const people = library.categories.find(category => category.id === 'people');
  assert.equal(people.name_pl, 'Postacie');
  assert.deepEqual(people.generator_ids, ['one-roll-npc', 'one-roll-patron', 'one-roll-fixer']);
  const navigationIds = library.categories.flatMap(category => category.generator_ids);
  assert.equal(navigationIds.length, 50);
  assert.equal(new Set(navigationIds).size, 50);
});

test('Każdy generator wykonuje procedurę i zwraca wyłącznie wyniki z danych', () => {
  const rng = seeded(20261126);
  for (const generator of data.generators) for (let i = 0; i < 20; i++) {
    const result = generateSet(library, generator.id, { rng });
    assert.ok(tables(result).length, generator.id);
    for (const node of tables(result)) assert.ok(library.tables.get(node.tableId).rows.some(row => row.id === node.rowId));
    assert.ok(formatGeneratorSet(library, result).startsWith(`## ${generator.name_pl}`));
  }
});

test('Rzuty respektują zakresy i wagi wszystkich tabel, także dwa osobne k6', () => {
  for (const table of data.tables) {
    if (table.dice.method === 'nested') {
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
        const sequence = [(a - 0.5) / 6, (b - 0.5) / 6];
        const selection = rollTable(table, () => sequence.shift());
        const row = table.rows.find(row => row.id === selection.rowId);
        assert.deepEqual([row.first_roll, row.second_roll], [a, b]);
      }
    } else for (let roll = table.dice.min; roll <= table.dice.max; roll++) {
      const selection = rollTable(table, () => (roll - 0.5) / table.dice.max);
      const row = table.rows.find(row => row.id === selection.rowId);
      assert.ok(row.roll.min <= roll && row.roll.max >= roll, table.id);
    }
  }
});

test('Imię, nazwisko i miejsce można losować niezależnie', () => {
  for (const id of library.generators.get('names-arabic').table_ids) {
    const result = generateSet(library, 'names-arabic', { tableId: id, rng: () => 0 });
    assert.deepEqual(tables(result).map(node => node.tableId), [id]);
    const changed = choose(result, id, 1);
    assert.equal(tables(changed)[0].rowId, library.tables.get(id).rows[1].id);
    const labels = { male: 'Mężczyzna', female: 'Kobieta', surname: 'Nazwisko', place: 'Miejsce' };
    assert.equal(formatNameEntry(library, changed), `${labels[id.split('-').at(-1)]}: ${formatName(library, changed)}`);
  }
});

test('Każde imię męskie i żeńskie tworzy parę z nazwiskiem, edytowaną niezależnie', () => {
  for (const generator of data.generators.filter(item => item.category_id === 'names')) {
    for (const sex of ['male', 'female']) {
      const ids = [`${generator.id}-${sex}`, `${generator.id}-surname`];
      const result = generateSet(library, generator.id, { tableIds: ids, rng: () => 0 });
      assert.deepEqual(tables(result).map(node => node.tableId), ids);
      const changed = choose(result, ids[0], 1, () => { throw new Error('Nazwisko musi pozostać bez zmian.'); });
      assert.deepEqual(tables(changed)[1], tables(result)[1]);
      const surnameChanged = choose(changed, ids[1], 2);
      assert.deepEqual(tables(surnameChanged)[0], tables(changed)[0]);
      assert.deepEqual(tables(rerollSet(library, surnameChanged, () => 0.5)).map(node => node.tableId), ids);
      const text = formatGeneratorSet(library, surnameChanged, 3);
      assert.ok(text.startsWith(`### ${generator.name_pl}\n\n`));
      const name = rowText(library.tables.get(ids[0]), library.tables.get(ids[0]).rows[1]);
      const surname = rowText(library.tables.get(ids[1]), library.tables.get(ids[1]).rows[2]);
      assert.equal(formatName(library, surnameChanged), `${name} ${surname}`);
      assert.equal(formatNameEntry(library, surnameChanged), `${sex === 'male' ? 'Mężczyzna' : 'Kobieta'}: ${name} ${surname}`);
      assert.equal(text, `### ${generator.name_pl}\n\n${name} ${surname}`);
    }
  }
});

test('Eksport Markdown respektuje poziom startowy i zagnieżdżenie misji z pośrednikiem', () => {
  let result = generateSet(library, 'one-roll-mission', { rng: () => 0 });
  const toggle = flattenNodes(result.tree).find(node => node.kind === 'toggle');
  result = updateChoice(library, result, toggle.key, true, () => 0);
  for (const level of [1, 2, 3, 4]) {
    const text = formatGeneratorSet(library, result, level);
    const headings = text.split('\n').filter(line => /^#+ /.test(line));
    assert.ok(headings[0].startsWith(`${'#'.repeat(level)} `));
    assert.ok(headings.some(line => line.startsWith(`${'#'.repeat(level + 1)} `)));
    assert.ok(headings.some(line => line.startsWith(`${'#'.repeat(level + 2)} `)));
    assert.ok(headings.every(line => /^#{1,6} /.test(line)));
    for (const node of tables(result)) {
      const table = library.tables.get(node.tableId);
      assert.ok(text.includes(rowText(table, table.rows.find(row => row.id === node.rowId))));
    }
  }
});

test('Edycja BN i megakorporacji zachowuje pozostałe pola i trafia do eksportu', () => {
  for (const id of ['one-roll-npc', 'megacorp', 'mission-espionage']) {
    const result = generateSet(library, id, { rng: () => 0 });
    const first = tables(result)[0];
    const changed = choose(result, first.tableId, 1, () => { throw new Error('Nie powinno być ponownego losowania.'); });
    assert.deepEqual(tables(changed).slice(1), tables(result).slice(1));
    const text = rowText(library.tables.get(first.tableId), library.tables.get(first.tableId).rows[1]);
    assert.ok(formatGeneratorSet(library, changed).includes(text));
  }
});

test('Zmiana kategorii układu i zagrożenia przebudowuje wyłącznie zależną gałąź', () => {
  for (const [id, selector, independent] of [
    ['system-point-of-interest', 'system-point-of-interest-type', 0],
    ['adventure-problem', 'adventure-problem-type', 2],
    ['adventure-place', 'adventure-place-hazard-type', 3],
  ]) {
    const result = generateSet(library, id, { rng: () => 0 });
    const changed = choose(result, selector, 1);
    assert.equal(tables(changed).length, independent + 3);
    assert.deepEqual(tables(changed).slice(0, independent), tables(result).slice(0, independent));
    assert.ok(tables(changed).slice(-2).every(node => node.tableId.includes('-2-')));
  }
});

test('Pełna misja: dwa różne tagi, inspiracje i sześć składników wybranego typu', () => {
  let result = generateSet(library, 'one-roll-mission', { rng: () => 0 });
  assert.equal(new Set(tables(result).filter(node => node.tableId === 'wn-tags-mission').map(node => node.rowId)).size, 2);
  assert.equal(tables(result).length, 19);
  const tagNodes = tables(result).filter(node => node.tableId !== 'mission-types-roll' && !node.tableId.startsWith('mission-defense'));
  result = choose(result, 'mission-types-roll', 3);
  assert.deepEqual(tables(result).filter(node => node.tableId !== 'mission-types-roll' && !node.tableId.startsWith('mission-rescue')), tagNodes);
  assert.equal(tables(result).filter(node => node.tableId.startsWith('mission-rescue')).length, 6);
  const toggle = flattenNodes(result.tree).find(node => node.kind === 'toggle');
  result = updateChoice(library, result, toggle.key, true, () => 0);
  assert.equal(tables(result).filter(node => node.tableId.startsWith('one-roll-fixer')).length, 6);
  result = updateChoice(library, result, toggle.key, false, () => 0);
  assert.equal(tables(result).length, 19);
});

test('Podwójny typ misji uruchamia dwie pełne procedury i znika po zmianie typu', () => {
  let result = generateSet(library, 'mission-types', { rng: () => 0 });
  const sequence = [0, 0, 0, 0, 0, 0, 0, 0.35, 0, 0, 0, 0, 0, 0];
  result = choose(result, 'mission-types-roll', 9, () => sequence.shift() ?? 0);
  assert.equal(tables(result).filter(node => node.tableId === 'mission-types-roll').length, 3);
  assert.equal(tables(result).filter(node => node.tableId.startsWith('mission-defense')).length, 6);
  assert.equal(tables(result).filter(node => node.tableId.startsWith('mission-rescue')).length, 6);
  result = choose(result, 'mission-types-roll', 4);
  assert.equal(tables(result).length, 7);
  assert.equal(tables(result).filter(node => node.tableId.startsWith('mission-retrieval')).length, 6);
});

test('Dodatkowy rzut pochodzenia BN używa k4, a ręczna zmiana usuwa starą gałąź', () => {
  let result = generateSet(library, 'one-roll-npc', { rng: () => 0 });
  result = choose(result, 'one-roll-npc-background', 4, () => 0.9999);
  const backgrounds = tables(result).filter(node => node.tableId === 'one-roll-npc-background');
  assert.equal(backgrounds.length, 2);
  assert.equal(backgrounds[1].roll, 4);
  result = choose(result, 'one-roll-npc-background', 0);
  assert.equal(tables(result).filter(node => node.tableId === 'one-roll-npc-background').length, 1);
});

test('Zmieniająca się cecha dzielnicy wykonuje dwa dalsze rzuty', () => {
  const result = choose(generateSet(library, 'district-building', { rng: () => 0 }), 'district-traits', 41);
  assert.equal(tables(result).length, 4);
  assert.ok(formatGeneratorSet(library, result).includes('Zmieniająca się cecha'));
});

test('Liczba zagrożeń daje dokładnie tyle przykładów, z osobnym wyborem rodzaju', () => {
  let result = generateSet(library, 'encounter-site-hazards', { rng: () => 0 });
  assert.equal(tables(result).length, 1);
  result = choose(result, 'encounter-site-hazards-count', 3);
  assert.equal(tables(result).length, 4);
  assert.equal(choices(result).length, 3);
  result = updateChoice(library, result, choices(result)[1].key, 'encounter-site-hazards-occupant', () => 0);
  assert.equal(tables(result).filter(node => node.tableId === 'encounter-site-hazards-environmental').length, 2);
  assert.equal(tables(result).filter(node => node.tableId === 'encounter-site-hazards-occupant').length, 1);
  result = choose(result, 'encounter-site-hazards-count', 0);
  assert.equal(tables(result).length, 1);
  assert.equal(choices(result).length, 0);
});

test('Wybór kampanii wykonuje tylko właściwą tabelę mieszkańców/podróży', () => {
  let result = generateSet(library, 'encounter-site-occupants', { rng: () => 0 });
  result = choose(result, 'encounter-site-occupants-presence', 2);
  assert.equal(tables(result).length, 2);
  result = updateChoice(library, result, choices(result)[0].key, 'deadlands', () => 0);
  assert.ok(find(result, 'encounter-site-occupants-deadlands'));
  assert.ok(!find(result, 'encounter-site-occupants-mutant-wasteland'));
  result = choose(result, 'encounter-site-occupants-presence', 0);
  assert.equal(tables(result).length, 1);
  result = generateSet(library, 'travel-encounter-tables', { rng: () => 0 });
  result = updateChoice(library, result, choices(result)[0].key, 'mutant-wasteland', () => 0);
  assert.equal(tables(result).length, 2);
  assert.ok(find(result, 'travel-encounter-tables-mutant-wasteland'));
});

test('Losowanie sprawców respektuje szansę i zachowuje decyzję przy edycji innego pola', () => {
  const base = generateSet(library, 'travel-encounter-tables', { rng: () => 0 });
  const absent = choose(base, 'travel-encounter-tables-after-the-fall', 5, () => 0.9);
  assert.equal(tables(absent).length, 2);
  const present = choose(base, 'travel-encounter-tables-after-the-fall', 5, () => 0);
  assert.equal(tables(present).length, 3);
  const edited = choose(present, 'travel-encounter-tables-hazards', 1, () => { throw new Error('Szansa powinna być zachowana.'); });
  assert.equal(tables(edited).length, 3);
});

test('Ponowne losowanie zachowuje wybraną kampanię, liczbę zestawów i opcjonalnego pośrednika', () => {
  let travel = generateSet(library, 'travel-encounter-tables', { rng: () => 0 });
  travel = updateChoice(library, travel, choices(travel)[0].key, 'mutant-wasteland', () => 0);
  const nextTravel = rerollSet(library, travel, () => 0.4);
  assert.equal(choices(nextTravel)[0].value, 'mutant-wasteland');
  assert.ok(find(nextTravel, 'travel-encounter-tables-mutant-wasteland'));
  assert.notEqual(tables(nextTravel)[0].rowId, tables(travel)[0].rowId);
  let city = generateSet(library, 'city-creation', { rng: () => 0 });
  const count = choices(city).find(node => node.label === 'Tworzenie megakorporacji');
  city = updateChoice(library, city, count.key, '5', () => 0);
  city = rerollSet(library, city, () => 0.4);
  assert.equal(flattenNodes(city.tree).filter(node => node.generatorId === 'megacorp').length, 5);
  let mission = generateSet(library, 'one-roll-mission', { rng: () => 0 });
  const toggle = flattenNodes(mission.tree).find(node => node.kind === 'toggle');
  mission = updateChoice(library, mission, toggle.key, true, () => 0);
  mission = rerollSet(library, mission, () => 0.4);
  assert.equal(tables(mission).filter(node => node.tableId.startsWith('one-roll-fixer')).length, 6);
});

test('Tworzenie miasta respektuje liczby korporacji i dzielnic', () => {
  let result = generateSet(library, 'city-creation', { rng: () => 0 });
  assert.equal(flattenNodes(result.tree).filter(node => node.generatorId === 'megacorp').length, 4);
  assert.equal(flattenNodes(result.tree).filter(node => node.generatorId === 'district-building').length, 3);
  const count = choices(result).find(node => node.label === 'Tworzenie megakorporacji');
  result = updateChoice(library, result, count.key, '5', () => 0);
  assert.equal(flattenNodes(result.tree).filter(node => node.generatorId === 'megacorp').length, 5);
});

test('Walidacja odrzuca brakujące odwołania, luki, duplikaty i puste wyniki', () => {
  for (const mutate of [
    d => { d.tables[0].rows[0].cells.result = ''; },
    d => { d.tables[0].rows[0].roll.min = 2; },
    d => { d.tables[0].rows[1].id = d.tables[0].rows[0].id; },
    d => { d.generators[0].steps[0].table_id = 'missing'; },
    d => { d.tables[0].rows[0].record_id = 'missing'; },
  ]) {
    const copy = structuredClone(data);
    mutate(copy);
    assert.throws(() => createGeneratorLibrary(copy));
  }
});
