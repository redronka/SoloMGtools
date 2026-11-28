import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locationQuery, worldToPaste, fetchWorldProfile } from '../uwp-api.js';
import { extractMapData, decodeProfile, formatProfile } from '../uwp.js';
import { extractAdditionalData, FULL_EXAMPLE_PASTE } from '../uwp-map.js';
import { createProfileLink, readProfileLink } from '../uwp-share.js';

const fixture = JSON.parse(await readFile(new URL('fixtures/uwp-world.json', import.meta.url), 'utf8'));
const location = { sector: 'Spinward Marches', hex: '1920' };
const response = data => async () => ({ ok: true, json: async () => data });

test('Krótki import przyjmuje sam sektor i heks lub dwa nagłówki, ale nigdy nie nadpisuje pełnego opisu', () => {
  for (const value of ['Spinward Marches 1920', '  Spinward Marches   1920  ', 'Lanth Subsector\nSpinward Marches 1920', 'Lanth Subsector\\Spinward Marches 1920']) {
    assert.deepEqual(locationQuery(value), location, value);
  }
  assert.deepEqual(locationQuery('Spinward Marches 0101'), { sector: 'Spinward Marches', hex: '0101' });
  for (const value of [FULL_EXAMPLE_PASTE, 'Spinward Marches 1920\nUWP: bad', 'Spinward Marches', '1920', 'Spinward Marches 0000', 'Spinward Marches 3341', 'Spinward Marches 1920\nInny Sektor 0101']) {
    assert.equal(locationQuery(value), null, value);
  }
});

test('API odtwarza komplet profili i dodatkowych danych z prawidłowo ograniczonego zapytania', async () => {
  let requested;
  const { source, result } = await fetchWorldProfile(location, { fetcher: async (url, options) => {
    requested = { url: new URL(url), options };
    return { ok: true, json: async () => fixture };
  } });
  assert.equal(requested.url.origin, 'https://travellermap.com');
  assert.equal(requested.url.searchParams.get('sector'), location.sector);
  assert.equal(requested.url.searchParams.get('hex'), '1920');
  assert.equal(requested.url.searchParams.get('jump'), '0');
  assert.equal(requested.options.credentials, 'omit');
  assert.deepEqual(result.fields, { uwp: 'B420410-D', importance: '{ 1 }', economics: '(934-3)', culture: '[1518]' });
  assert.equal(result.summary.location.name, "D'Ganzio");
  assert.equal(result.summary.location.subsector, 'Lanth');
  const facts = Object.fromEntries(result.additional.items.map(item => [item.key, item.value]));
  assert.equal(facts.allegiance, 'Trzecie Imperium, Domena Deneb (ImDd)');
  assert.match(facts.system, /M0 V czerwony karzeł.*M3 V czerwony karzeł/);
  assert.match(facts.system, /2 gazowe olbrzymy — 1 pas planetoid — 2 pozostałe światy/);
  assert.match(facts.population, /^30\s000 mieszkańców$/);
  assert.equal(facts.bases, 'Baza marynarki');
  assert.equal(facts.nobility, 'Rycerz');
  assert.equal(facts.zone, 'Bez ograniczeń');
  assert.equal(facts.tas, 'Zielona');
  assert.deepEqual(result.additional.remarks.map(item => item.code), ['De', 'He', 'Ni', 'Po', 'Ht']);
  assert.ok(source.startsWith('Lanth Subsector\nSpinward Marches 1920\n'));
  assert.equal(result.additional.sourceText, source);
});

test('Pobrany opis można zmienić lokalnie i odtworzyć zmiany z Markdown bez ponownego odpytywania API', async () => {
  const { source } = await fetchWorldProfile(location, { fetcher: response(fixture) });
  const customSource = source.replace('B420410-D', 'B420410-C').replace('(934-3)', '(934+2)').replace('30,000', '40,000').replace('Rycerz', 'Baron');
  const imported = extractMapData(customSource);
  const custom = decodeProfile(imported.fields, imported.additional);
  assert.deepEqual(custom.errors, []);
  assert.equal(custom.fields.uwp, 'B420410-C');
  assert.equal(custom.fields.economics, '(934+2)');
  assert.equal(custom.additional.items.find(item => item.key === 'nobility').value, 'Baron');
  const state = readProfileLink(new URL(createProfileLink(custom, 'https://example.com/')).hash);
  const restored = decodeProfile(state.fields, extractAdditionalData(state.text));
  assert.equal(formatProfile(restored), formatProfile(custom));
});

test('Brak opcjonalnych pól nie tworzy fikcyjnej populacji, zasobów układu ani rozszerzeń', async () => {
  const { source, result } = await fetchWorldProfile(location, { fetcher: response({ Worlds: [{ Hex: '1920', UWP: 'X000000-0' }] }) });
  assert.deepEqual(result.errors, []);
  assert.equal(result.sections.length, 1);
  assert.doesNotMatch(source, /Population:|Gas Giants|Planetoid Belts|Other Worlds|Nobility:|Economics:/);
  const unknown = worldToPaste({ Hex: '1920', UWP: 'B420410-D', PBG: '???', Worlds: 6 }, location);
  assert.doesNotMatch(unknown, /Population:|Gas Giants|Other Worlds/);
});

test('Bursztynowa/czerwona strefa, wiele baz i szlachectwo nie są mylone z zieloną strefą', async () => {
  const world = { ...fixture.Worlds[0], Zone: 'A', Bases: 'NS', Nobility: 'BcCeF' };
  const { result } = await fetchWorldProfile(location, { fetcher: response({ Worlds: [world] }) });
  const fact = key => result.additional.items.find(item => item.key === key).value;
  assert.equal(fact('tas'), 'Bursztynowa');
  assert.equal(fact('zone'), 'Zalecana ostrożność');
  assert.equal(fact('bases'), 'Baza marynarki, Baza zwiadowcza');
  assert.equal(fact('nobility'), 'Rycerz, Baronet, Baron, Wicehrabia, Książę podsektora');
});

test('Pusty heks, uszkodzona odpowiedź i niepoprawny UWP pokazują błąd zamiast cudzego świata', async () => {
  for (const data of [{ Worlds: [] }, { Worlds: [{ ...fixture.Worlds[0], Hex: '1910' }] }, {}, null, { Worlds: [{ Hex: '1920' }] }, { Worlds: [{ Hex: '1920', UWP: 'bad' }] }]) {
    await assert.rejects(fetchWorldProfile(location, { fetcher: response(data) }), /świata|odpowiedź|profilu|Profil/);
  }
  await assert.rejects(fetchWorldProfile(location, { fetcher: async () => ({ ok: false, status: 404 }) }), /Nie znaleziono sektora/);
  await assert.rejects(fetchWorldProfile(location, { fetcher: async () => ({ ok: false, status: 503 }) }), /błąd 503/);
  await assert.rejects(fetchWorldProfile(location, { fetcher: async () => ({ ok: true, json: async () => { throw new SyntaxError(); } }) }), /nieprawidłowe dane/);
});

test('Błąd sieci i timeout pozostawiają możliwość użycia pełnego opisu', async () => {
  await assert.rejects(fetchWorldProfile(location, { fetcher: async () => { throw new TypeError('network'); } }), /Sprawdź internet albo wklej pełne dane/);
  const pending = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  await assert.rejects(fetchWorldProfile(location, { fetcher: pending, timeoutMs: 5 }), /nie odpowiada/);
  const controller = new AbortController();
  const request = fetchWorldProfile(location, { fetcher: pending, signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
});
