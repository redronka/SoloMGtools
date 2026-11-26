import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeProfile, extractMapData, formatProfile, getLevelMetric, ehex, EXAMPLE, EXAMPLE_PASTE } from '../uwp.js';
import { LEVEL_GUIDES } from '../uwp-levels.js';
import { LAWS } from '../uwp-data.js';

test('Przykład z mapy: 8 cech UWP, Ix oraz po 4 cechy Ex i Cx', () => {
  const extracted = extractMapData(EXAMPLE_PASTE);
  assert.deepEqual(extracted.errors, []);
  const result = decodeProfile(extracted.fields);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.fields, EXAMPLE);
  assert.deepEqual(result.sections.map(section => section.items.length), [8, 1, 4, 4]);
  assert.match(result.sections[0].items[0].extra, /500 Cr\/t/);
  assert.equal(result.sections[0].items[1].title.replaceAll(/\s/g, ''), 'Średnicaok.8000km');
  assert.equal(result.sections[0].items[4].title, 'Miliardy');
  assert.equal(result.sections[0].items[7].value, 10);
  assert.equal(result.sections[2].items[0].value, 13);
  assert.equal(result.sections[3].items[1].value, 13);
});

test('Ręczne kody przyjmują małe litery, odstępy, nawiasy opcjonalne i różne myślniki', () => {
  for (const dash of ['-', '‐', '‑', '‒', '–', '—', '−', '－']) {
    const result = decodeProfile({ uwp: ` a593943 ${dash} a `, importance: '+4', economics: ` d8e +1 `, culture: '6d27' });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.fields, EXAMPLE);
  }
});

test('Porty gwiezdne i lokalne podają właściwe usługi oraz paliwo', () => {
  for (const port of 'ABCDEXFGHY') {
    const result = decodeProfile({ uwp: `${port}867742-C` });
    assert.deepEqual(result.errors, [], port);
    const text = formatProfile(result);
    const item = result.sections[0].items[0];
    if ('AB'.includes(port)) assert.match(item.extra, /rafinowane: 500/);
    else if ('CDFG'.includes(port)) assert.match(item.extra, /nierafinowane: 100/);
    else assert.match(item.extra, /Brak sprzedaży/);
    if ('FGHY'.includes(port)) assert.match(item.title, /lokaln/);
    assert.ok(!text.includes('undefined'));
  }
});

test('eHex pomija I i O; wyższe kody dekodują się dziesiętnie', () => {
  assert.equal(ehex('H'), 17);
  assert.equal(ehex('J'), 18);
  assert.equal(ehex('L'), 20);
  const result = decodeProfile({ uwp: 'A8677XL-L', economics: '(JEH-5)', culture: '[GFA L]' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.sections[0].items[7].value, 20);
  assert.equal(result.sections[1].items[0].value, 18);
  assert.equal(result.sections[2].items[3].value, 20);
  for (const culture of ['[6I27]', '[6O27]', '[HFA L]', '[6G27]', '[6DB7]', '[6D2M]']) {
    assert.equal(decodeProfile({ culture }).errors[0].field, 'culture', culture);
  }
});

test('Błędny UWP nie obcina cyfr ani nie myli sąsiednich parametrów', () => {
  for (const uwp of ['A3234112-A', 'A59394-A', 'A593943-AA', 'I593943-A', 'A5G3943-A', 'A59B943-A', 'A593943-I', 'A593943-O', 'A59394I-A', 'A593943-A garbage']) {
    const result = decodeProfile({ uwp });
    assert.equal(result.errors[0].field, 'uwp', uwp);
    assert.equal(result.sections.length, 0);
  }
  const imported = extractMapData('UWP:\tA3234112-A');
  assert.equal(imported.fields.uwp, 'A3234112-A');
  assert.equal(decodeProfile(imported.fields).errors[0].field, 'uwp');
});

test('Nieznane cechy, pas asteroid, lód i egzotyczne oceany', () => {
  const unknown = decodeProfile({ uwp: '???????-?' });
  assert.deepEqual(unknown.errors, []);
  assert.ok(unknown.sections[0].items.every(item => item.value === null && item.title === 'Brak danych'));
  assert.equal(decodeProfile({ uwp: 'X000000-0' }).sections[0].items[1].title, 'Pas asteroid');
  assert.match(decodeProfile({ uwp: 'F201321-8' }).sections[0].items[3].description, /lód/);
  assert.match(decodeProfile({ uwp: 'A8AA743-B' }).sections[0].items[3].description, /nie musi być woda/);
});

test('Każdy standardowy kod ma opis, w tym obce ustroje i specjalne prawo S', () => {
  for (const [index, codes] of [[1, '0123456789ABCDEF'], [2, '0123456789ABCDEF'], [3, '0123456789A'], [4, '0123456789ABCDEF'], [5, '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'], [6, '0123456789ABCDEFGHJKLS'], [8, '0123456789ABCDEFGHJKL']]) {
    for (const code of codes) {
      const chars = [...'A867742-C'];
      chars[index] = code;
      const result = decodeProfile({ uwp: chars.join('') });
      assert.deepEqual(result.errors, [], chars.join(''));
      assert.ok(!/undefined|NaN/.test(formatProfile(result)), chars.join(''));
    }
  }
});

test('Populacja jest rzędem wielkości, a nie dokładną liczbą mieszkańców', () => {
  const item = decodeProfile({ uwp: 'A867742-C' }).sections[0].items[4];
  assert.match(item.description, /10 000 000/);
  assert.match(item.description, /100 000 000/);
  assert.match(item.description, /PBG/);
});

test('Hologramy i wcześniejsze technologie pokazują się od właściwego TL', () => {
  const tech = tl => decodeProfile({ uwp: `A867742-${tl}` }).sections[0].items[7];
  assert.doesNotMatch(tech('A').extra, /holograficzne/);
  assert.match(tech('B').extra, /holograficzne/);
  assert.match(tech('F').extra, /holograficzne/);
  assert.match(tech('C').extra, /autodoktorzy/);
});

test('Rozszerzenia można dekodować niezależnie, puste pola nie tworzą fikcyjnych wyników', () => {
  for (const field of ['importance', 'economics', 'culture']) {
    const result = decodeProfile({ [field]: EXAMPLE[field] });
    assert.deepEqual(result.errors, []);
    assert.equal(result.sections.length, 1);
  }
  assert.equal(decodeProfile({ uwp: EXAMPLE.uwp }).sections.length, 1);
  assert.equal(decodeProfile({}).errors.length, 1);
});

test('Walidacja zakresów, efektywności, nawiasów i niepoprawnych pól naraz', () => {
  for (const economics of ['(D8E1)', '(D8E+9)', '(K8E+1)', '(DFE+1)', '(D8J+1)', '(D8I+1)', '(D8E+1', '()', '(D8E+10)']) {
    assert.equal(decodeProfile({ economics }).errors[0].field, 'economics', economics);
  }
  for (const importance of ['{6}', '{-4}', '{2.5}', '4 Important', '{}']) assert.equal(decodeProfile({ importance }).errors[0].field, 'importance');
  assert.equal(decodeProfile({ uwp: 'bad', culture: 'bad', importance: 'bad', economics: 'bad' }).errors.length, 4);
  for (const efficiency of ['-5', '-1', '+0', '-0', '+1', '+5']) assert.deepEqual(decodeProfile({ economics: `(D8E${efficiency})` }).errors, []);
});

test('Import: sam UWP, pełny wiersz sektora i etykiety w jednym wierszu', () => {
  for (const text of [EXAMPLE.uwp, EXAMPLE_PASTE.replaceAll('\n', '\\'), EXAMPLE_PASTE.replaceAll('\n', ' '), '1910 Regina A788899-C Ht Ri Pa Ph An Cp (Amindii)2 { 4 } (D7E+5) [9C6D] BcCeF NS - 703 8 ImDd F7 V BD M3 V']) {
    const extracted = extractMapData(text);
    assert.deepEqual(extracted.errors, [], text);
    assert.deepEqual(decodeProfile(extracted.fields).errors, [], text);
  }
  const result = extractMapData(EXAMPLE.uwp);
  assert.deepEqual(result.fields, { uwp: EXAMPLE.uwp, importance: '', economics: '', culture: '' });
});

test('Import wykrywa wiele światów, brak kodów i nie ukrywa błędnego rozszerzenia z etykietą', () => {
  assert.ok(extractMapData('A593943-A\nB867742-C').errors.length);
  assert.ok(extractMapData(`${EXAMPLE_PASTE}\n${EXAMPLE_PASTE}`).errors.length);
  assert.ok(extractMapData('UWP: A593943-A A867742-C').errors.length);
  assert.ok(extractMapData('').errors.length);
  assert.ok(extractMapData('dowolny tekst').errors.length);
  for (const line of ['Economics: (bad)', 'Culture: [6I27]', 'Culture: [6D2', 'Importance: bad']) {
    assert.ok(decodeProfile(extractMapData(`${EXAMPLE.uwp}\n${line}`).fields).errors.length, line);
  }
  assert.ok(decodeProfile(extractMapData('A593943-A (D8E+I)').fields).errors.length);
  assert.ok(decodeProfile(extractMapData('UWP: A593943-A\nCulture:\nEconomics: (D8E+1)').fields).errors.length);
});

test('Import odróżnia uwagi o rasach od rozszerzeń i przyjmuje brak danych rozszerzeń', () => {
  const extracted = extractMapData('A593943-A [Human] [Asla] (Amindii)2 { 4 } (D8E+1) [6D27]');
  assert.deepEqual(extracted.errors, []);
  assert.deepEqual(decodeProfile(extracted.fields).fields, EXAMPLE);
  assert.deepEqual(decodeProfile(extractMapData('UWP: A593943-A\nEconomics: -\nCulture: -\nImportance: -').fields).errors, []);
});

test('Zerowe profile i sprzeczności populacji z kulturą mają czytelne ostrzeżenia', () => {
  assert.deepEqual(decodeProfile({ uwp: 'X000000-0', economics: '(000+0)', culture: '[0000]' }).errors, []);
  const empty = decodeProfile({ culture: '[0000]' });
  assert.ok(empty.sections[0].items.every(item => item.title === 'Brak kultury do opisania'));
  assert.ok(decodeProfile({ uwp: 'X000000-0', culture: '[6D27]' }).warnings.length);
  assert.ok(decodeProfile({ uwp: EXAMPLE.uwp, culture: '[0000]' }).warnings.length);
  assert.equal(decodeProfile(EXAMPLE).warnings.length, 0);
});

test('Kopiowany opis zawiera kompletne wyniki, interpretacje oraz źródła', () => {
  const result = decodeProfile(EXAMPLE);
  const text = formatProfile(result);
  for (const section of result.sections) {
    assert.ok(text.includes(section.code));
    for (const item of section.items) assert.ok(text.includes(item.description));
  }
  assert.match(text, /Heterogeneity/);
  assert.match(text, /D = 13/);
  assert.match(text, /interpretacją MG/);
  assert.match(text, /travellermap.com\/doc\/secondsurvey/);
});

test('Każdy poziom Ex, Cx i TL ma własny opis świata i skutków dla przybyszów', () => {
  const bounds = { resources: [0, 18], labor: [0, 14], infrastructure: [0, 17], efficiency: [-5, 5], heterogeneity: [0, 16], acceptance: [0, 15], strangeness: [0, 10], symbols: [0, 20], technology: [0, 20] };
  assert.deepEqual(Object.keys(LEVEL_GUIDES), Object.keys(bounds));
  for (const [key, [min, max]] of Object.entries(bounds)) {
    const worlds = new Set(), visitors = new Set();
    for (let value = min; value <= max; value++) {
      const item = getLevelMetric(key, value);
      assert.equal(item.min, min);
      assert.equal(item.max, max);
      assert.equal(item.value, value);
      assert.ok(item.title.length > 5, `${key}:${value}`);
      assert.ok(item.interpretation.world.length > 60, `${key}:${value} świat`);
      assert.ok(item.interpretation.visitors.length > 60, `${key}:${value} przybysze`);
      worlds.add(item.interpretation.world);
      visitors.add(item.interpretation.visitors);
    }
    assert.equal(worlds.size, max - min + 1, `${key}: unikalne opisy świata`);
    assert.equal(visitors.size, max - min + 1, `${key}: unikalne wskazówki dla przybyszów`);
    assert.throws(() => getLevelMetric(key, min - 1), RangeError);
    assert.throws(() => getLevelMetric(key, max + 1), RangeError);
    assert.throws(() => getLevelMetric(key, min + .5), RangeError);
  }
});

test('Podgląd innych poziomów nie zmienia profilu, zerowego Cx ani kopiowanych wartości', () => {
  for (const fields of [EXAMPLE, { economics: '(000-0)', culture: '[0000]', uwp: 'X000000-0' }]) {
    const result = decodeProfile(fields);
    const snapshot = structuredClone(result);
    const copy = formatProfile(result);
    for (const item of result.sections.flatMap(section => section.items).filter(item => item.guideKey)) {
      for (let value = item.min; value <= item.max; value++) getLevelMetric(item.guideKey, value);
    }
    assert.deepEqual(result, snapshot);
    assert.equal(formatProfile(result), copy);
    for (const item of result.sections.flatMap(section => section.items).filter(item => item.interpretation)) {
      assert.ok(copy.includes(item.interpretation.world));
      assert.ok(copy.includes(item.interpretation.visitors));
    }
  }
  assert.equal(getLevelMetric('efficiency', -1).code, '-1');
  assert.equal(getLevelMetric('efficiency', 1).code, '+1');
  assert.equal(getLevelMetric('technology', 18).code, 'J');
});

test('Prawo pokazuje wszystkie poprzednie zakazy, z jednym oznaczonym bieżącym poziomem', () => {
  const codes = '0123456789ABCDEFGHJKL';
  for (const [value, code] of [...codes].entries()) {
    const result = decodeProfile({ uwp: `A86774${code}-C` });
    const law = result.sections[0].items[6];
    assert.equal(law.restrictions.length, value || 1);
    assert.equal(law.restrictions.filter(entry => entry.current).length, 1);
    assert.equal(law.restrictions.at(-1).description, LAWS[value][1]);
    if (value > 0) {
      assert.equal(law.restrictions[0].code, '1');
      assert.ok(!law.restrictions.some(entry => entry.code === '0'));
    }
    for (const entry of law.restrictions) assert.ok(formatProfile(result).includes(entry.description));
  }
  for (const code of ['?', 'S']) assert.equal(decodeProfile({ uwp: `A86774${code}-C` }).sections[0].items[6].restrictions, undefined);
});
