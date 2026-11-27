import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionResults } from '../session-results.js';
import { heading, startLevel } from '../markdown.js';

test('Historia obejmuje tylko wygenerowane wpisy i zachowuje kolejność kolejnych losowań', () => {
  const session = createSessionResults();
  const counts = [];
  const unsubscribe = session.subscribe(count => counts.push(count));
  assert.equal(session.format(), '');
  const updateFirst = session.add(level => heading(level, 'BN 1'));
  session.add(level => heading(level, 'Planeta'));
  session.add(level => heading(level, 'BN 2'));
  updateFirst(level => heading(level, 'BN 1 po edycji'));
  assert.equal(session.format(4), '#### BN 1 po edycji\n\n#### Planeta\n\n#### BN 2');
  assert.deepEqual(counts, [0, 1, 2, 3, 3]);
  unsubscribe();
  session.add(level => heading(level, 'Misja'));
  assert.deepEqual(counts, [0, 1, 2, 3, 3]);
  assert.equal(createSessionResults().format(), '');
});

test('Poziomy Markdown: wybór formularza jest liczbą, głębokie gałęzie nie tworzą błędnych nagłówków', () => {
  assert.equal(startLevel('4'), 4);
  assert.equal(startLevel(0), 2);
  assert.equal(startLevel(7), 2);
  assert.equal(heading(6, 'Cecha'), '###### Cecha');
  assert.equal(heading(7, 'Szczegół'), '**Szczegół**');
});

test('Zbiorczy eksport scala imiona każdej grupy mimo innych losowań i zachowuje edycje oraz licznik', () => {
  const session = createSessionResults();
  const arabic = { groupKey: 'names-arabic', title: 'Imiona i nazwy arabskie' };
  const counts = [];
  session.subscribe(count => counts.push(count));
  const edit = session.add(() => 'Mężczyzna: Mohammed Abdel', arabic);
  session.add(level => heading(level, 'BN 1'));
  session.add(() => 'Kobieta: Daliya Khalil', arabic);
  session.add(() => 'Mężczyzna: Ken Sato', { groupKey: 'names-japanese', title: 'Imiona i nazwy japońskie' });
  session.add(() => 'Nazwisko: Rasheed', arabic);
  session.add(() => 'Miejsce: Hibah', arabic);
  session.add(level => heading(level, 'BN 2'));
  edit(() => 'Mężczyzna: Aamir Abdel');
  for (const level of [1, 2, 3, 4]) {
    const hashes = '#'.repeat(level);
    assert.equal(session.format(level), [
      `${hashes} Imiona i nazwy arabskie\n\nMężczyzna: Aamir Abdel\nKobieta: Daliya Khalil\nNazwisko: Rasheed\nMiejsce: Hibah`,
      `${hashes} BN 1`,
      `${hashes} Imiona i nazwy japońskie\n\nMężczyzna: Ken Sato`,
      `${hashes} BN 2`,
    ].join('\n\n'));
  }
  assert.deepEqual(counts, [0, 1, 2, 3, 4, 5, 6, 7, 7]);
});
