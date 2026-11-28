import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMapData, decodeProfile, formatProfile, previewMetric } from '../uwp.js';
import { FULL_EXAMPLE_PASTE, extractAdditionalData, genericPlanetUrl, worldPlanetUrl, translateMapText } from '../uwp-map.js';
import { createSessionResults } from '../session-results.js';

function importWorld(text = FULL_EXAMPLE_PASTE) {
  const extracted = extractMapData(text);
  assert.deepEqual(extracted.errors, []);
  const result = decodeProfile(extracted.fields, extracted.additional);
  assert.deepEqual(result.errors, []);
  return result;
}

test('Pełny przykład zachowuje cztery profile, lokalizację oraz wszystkie dane dodatkowe po polsku', () => {
  const result = importWorld();
  assert.deepEqual(result.fields, { uwp: 'B420410-D', importance: '{ 1 }', economics: '(934-3)', culture: '[1518]' });
  assert.equal(FULL_EXAMPLE_PASTE.split('\n')[0], 'Lanth Subsector');
  assert.equal(FULL_EXAMPLE_PASTE.split('\n')[1], 'Spinward Marches 1920');
  assert.deepEqual(result.summary.location, { sector: 'Spinward Marches', hex: '1920', subsector: 'Lanth', name: '' });
  const facts = Object.fromEntries(result.additional.items.map(item => [item.key, item.value]));
  assert.equal(facts.allegiance, 'Trzecie Imperium, Domena Deneb (ImDd)');
  assert.match(facts.system, /M0 V czerwony karzeł \(ciąg główny\) M3 V czerwony karzeł/);
  assert.match(facts.system, /2 gazowe olbrzymy — 1 pas planetoid — 2 pozostałe światy/);
  assert.equal(facts.bases, 'Baza marynarki');
  assert.equal(facts.population.replaceAll(/\s/g, ' '), '30 000 mieszkańców');
  assert.equal(facts.nobility, 'Rycerz');
  assert.equal(facts.zone, 'Bez ograniczeń');
  assert.equal(facts.tas, 'Zielona');
  assert.deepEqual(result.additional.remarks.map(item => item.code), ['De', 'He', 'Ni', 'Po', 'Ht']);
  assert.equal(result.summary.planetIsGeneric, true);
});

test('Brak sektora, brak heksu i niepoprawne współrzędne pomijają podsumowanie i obrazy', () => {
  const body = FULL_EXAMPLE_PASTE.split('\n').slice(2).join('\n');
  for (const header of ['', 'Lanth Subsector\n', 'Spinward Marches\n', '1920\n', 'Spinward Marches 0000\n', 'Spinward Marches 3341\n']) {
    const result = importWorld(header + body);
    assert.equal(result.summary, null, header);
    const text = formatProfile(result);
    assert.doesNotMatch(text, /Podsumowanie świata|api\/jumpmap|generic_worlds/);
    assert.match(text, /Dane dodatkowe/);
    assert.match(text, /Baza marynarki/);
  }
  assert.equal(decodeProfile({ uwp: 'B420410-D' }).summary, null);
});

test('Sektor i heks wystarczają bez nazwy świata i podsektora; zachowywane są zera wiodące', () => {
  const result = importWorld('Spinward Marches 0101\nUWP: B420410-D');
  assert.equal(result.summary.location.hex, '0101');
  assert.equal(result.summary.location.name, '');
  assert.equal(result.summary.location.subsector, '');
  const url = new URL(result.summary.mapImage);
  assert.equal(url.searchParams.get('sector'), 'Spinward Marches');
  assert.equal(url.searchParams.get('hex'), '0101');
  assert.equal(url.searchParams.get('jump'), '2');
});

test('Import przyjmuje końcowe ukośniki i utracone indeksy górne w populacji', () => {
  const pasted = FULL_EXAMPLE_PASTE.replaceAll('\n', '\\\n').replace('10⁴', '104');
  const result = importWorld(pasted);
  assert.equal(result.summary.location.hex, '1920');
  assert.equal(result.additional.items.find(item => item.key === 'population').value.replaceAll(/\s/g, ''), '30000mieszkańców');
  assert.match(extractAdditionalData('Population: 30,000').items[0].value, /^30\s000 mieszkańców$/);
});

test('Markdown zawiera pełne dane, podsumowanie, planetę i mapę na końcu dla poziomów 1–4', () => {
  const result = importWorld();
  for (const level of [1, 2, 3, 4]) {
    const text = formatProfile(result, level);
    assert.match(text, /Dane dodatkowe/);
    assert.match(text, /Trzecie Imperium, Domena Deneb/);
    assert.match(text, /Świat nieprzemysłowy/);
    assert.ok(text.includes(`${'#'.repeat(level + 1)} Podsumowanie świata`));
    assert.ok(text.indexOf('Podsumowanie świata') > text.indexOf('Źródła i uwagi'));
    assert.ok(text.indexOf('generic_worlds/Hyd0.png') < text.indexOf('/api/jumpmap?'));
    assert.doesNotMatch(text, /print\/world|^#{7,}\s|Red Dwarf|Gas Giants|No Restrictions/m);
    assert.equal((text.match(/!\[/g) || []).length, 2);
  }
  const before = formatProfile(result);
  previewMetric(result.sections[0].items[7], 'E');
  assert.equal(formatProfile(result), before);
});

test('Historia zachowuje dodatkowe dane wcześniejszego świata, kolejny import ich nie dziedziczy', () => {
  const session = createSessionResults();
  const first = importWorld();
  session.add(level => formatProfile(first, level));
  const second = importWorld('UWP: A593943-A');
  session.add(level => formatProfile(second, level));
  assert.equal(second.summary, null);
  assert.deepEqual(second.additional.items, []);
  assert.equal((session.format().match(/Podsumowanie świata/g) || []).length, 1);
  assert.equal((session.format().match(/api\/jumpmap/g) || []).length, 1);
  // Odczytany dedykowany obraz zastępuje poglądowy również w eksporcie zbiorczym.
  first.summary.planetImage = worldPlanetUrl('Spin', '1920');
  first.summary.planetIsGeneric = false;
  assert.match(session.format(), /worlds\/Spin%201920\.png/);
});

test('Grafika poglądowa rozróżnia pas asteroid i hydrografię, niewiadome nie tworzą błędnych URL-i', () => {
  assert.match(genericPlanetUrl('B420410-D'), /Hyd0\.png$/);
  assert.match(genericPlanetUrl('A867742-C'), /Hyd7\.png$/);
  assert.match(genericPlanetUrl('X000000-0'), /Belt\.png$/);
  assert.equal(genericPlanetUrl('???????-?'), null);
  assert.equal(genericPlanetUrl(''), null);
});

test('Nazwy we wklejonych danych pozostają tekstem; adresy kodują znaki specjalne', () => {
  const result = importWorld('<img src=x> [nazwa]\nSektor & Test 1920\nUWP: B420410-D\nAllegiance: <script>alert(1)</script>');
  const text = formatProfile(result);
  assert.doesNotMatch(text, /<img|<script>/);
  assert.match(text, /&lt;img src=x&gt;/);
  const url = new URL(result.summary.mapImage);
  assert.equal(url.origin, 'https://travellermap.com');
  assert.equal(url.searchParams.get('sector'), 'Sektor & Test');
});

test('Tłumaczenie nie myli czerwonego karła z czerwoną strefą i odmienia liczebności układu', () => {
  assert.equal(translateMapText('Red'), 'Czerwona');
  assert.equal(translateMapText('Red Dwarf (Main Sequence)'), 'czerwony karzeł (ciąg główny)');
  assert.equal(translateMapText('1 Gas Giants — 12 Planetoid Belts — 24 Other Worlds'), '1 gazowy olbrzym — 12 pasów planetoid — 24 pozostałe światy');
});
