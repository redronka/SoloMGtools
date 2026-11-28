import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileLink, readProfileLink } from '../uwp-share.js';
import { decodeProfile, extractMapData, formatProfile } from '../uwp.js';
import { FULL_EXAMPLE_PASTE, extractAdditionalData } from '../uwp-map.js';
import { createSessionResults } from '../session-results.js';

const BASE_URL = 'https://example.com/SoloMGtools/';
function importWorld(source = FULL_EXAMPLE_PASTE) {
  const imported = extractMapData(source);
  return decodeProfile(imported.fields, imported.additional);
}
function restore(url) {
  const state = readProfileLink(new URL(url).hash);
  return decodeProfile(state.fields, state.text ? extractAdditionalData(state.text) : null);
}

test('Link odtwarza pełny profil, lokalizację, polskie znaki i komplet danych dodatkowych', () => {
  const result = importWorld(`Żółć — Świat Łąk\n${FULL_EXAMPLE_PASTE}`);
  const link = createProfileLink(result, `${BASE_URL}?debug=1#uwp`);
  const url = new URL(link);
  assert.equal(url.origin, 'https://example.com');
  assert.equal(url.pathname, '/SoloMGtools/');
  assert.equal(url.search, '');
  assert.match(url.hash, /^#uwp\?world=[A-Za-z0-9_-]+$/);
  const reopened = restore(link);
  assert.deepEqual(reopened.errors, []);
  assert.deepEqual(reopened.fields, result.fields);
  assert.deepEqual(reopened.additional, result.additional);
  assert.deepEqual(reopened.summary, result.summary);
  assert.equal(formatProfile(reopened), formatProfile(result));
});

test('Link odtwarza ręczne kody bez podsumowania i nie wymaga wcześniejszej sesji', () => {
  const result = decodeProfile({ uwp: 'A593943-A', economics: '(D8E+1)' });
  const reopened = restore(createProfileLink(result, BASE_URL));
  assert.deepEqual(reopened.fields, result.fields);
  assert.equal(reopened.additional, null);
  assert.equal(reopened.summary, null);
  assert.equal(formatProfile(reopened), formatProfile(result));
});

test('Link zapisuje zmienione rozszerzenia, a nie ich dawną wartość we wklejonym tekście', () => {
  const initial = importWorld();
  const edited = decodeProfile({ ...initial.fields, economics: '(934+2)', culture: '[2518]' }, initial.additional);
  const reopened = restore(createProfileLink(edited, BASE_URL));
  assert.equal(reopened.fields.economics, '(934+2)');
  assert.equal(reopened.fields.culture, '[2518]');
  assert.equal(reopened.additional.location.hex, '1920');
  assert.equal(formatProfile(reopened), formatProfile(edited));
});

test('Markdown zaczyna się od klikalnego linku i obsługuje ścieżkę z nawiasami', () => {
  const result = importWorld();
  for (const level of [1, 2, 3, 4]) {
    const text = formatProfile(result, level, 'https://example.com/solo(mg)/index.html#uwp');
    assert.match(text, /^\[See in SoloMGtools\]\(https:\/\/example\.com\/solo%28mg%29\/index\.html#uwp\?world=[A-Za-z0-9_-]+\)\n\n/);
    const link = /^\[See in SoloMGtools\]\(([^\n]+)\)/.exec(text)[1];
    assert.equal(formatProfile(restore(link)), formatProfile(result));
  }
});

test('Eksport wszystkich wyników zachowuje osobny link do każdego odczytu świata', () => {
  const session = createSessionResults();
  const first = importWorld();
  const second = decodeProfile({ uwp: 'X000000-0' });
  session.add(level => formatProfile(first, level, BASE_URL));
  session.add(level => formatProfile(second, level, BASE_URL));
  const text = session.format();
  const links = [...text.matchAll(/\[See in SoloMGtools\]\(([^\n]+)\)/g)].map(match => match[1]);
  assert.equal(links.length, 2);
  assert.equal(restore(links[0]).fields.uwp, 'B420410-D');
  assert.equal(restore(links[1]).fields.uwp, 'X000000-0');
});

test('Zwykłe zakładki nie są linkiem profilu; uszkodzony link daje czytelny błąd', () => {
  for (const hash of ['', '#tags', '#uwp', '#uwp?other=value', '#tags?world=bad']) assert.equal(readProfileLink(hash), null);
  for (const hash of ['#uwp?world=', '#uwp?world=bad', '#uwp?world=***', '#uwp?world=e30', '#uwp?world=e30&world=e30']) {
    assert.throws(() => readProfileLink(hash), /Link do opisu świata jest niepełny lub uszkodzony/);
  }
  const token = value => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  const fields = { uwp: 'B420410-D', importance: '', economics: '', culture: '' };
  for (const value of [{ v: 2, fields, text: '' }, { v: 1, fields: [], text: '' }, { v: 1, fields, text: 5 }, { v: 1, fields: { ...fields, uwp: 12 }, text: '' }]) {
    assert.throws(() => readProfileLink(`#uwp?world=${token(value)}`), /uszkodzony/);
  }
});
