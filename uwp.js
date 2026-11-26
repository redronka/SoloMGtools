import { PORTS, ATMOSPHERES, GOVERNMENTS, LAWS, TECH_EXAMPLES } from './uwp-data.js?v=1';
import { LEVEL_GUIDES } from './uwp-levels.js?v=1';

export const EHEX = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const EXAMPLE = { uwp: 'A593943-A', importance: '{ 4 }', economics: '(D8E+1)', culture: '[6D27]' };
export const EXAMPLE_PASTE = 'UWP:\tA593943–A\nImportance:\t{ 4 } Important\nEconomics:\t(D8E+1)\nCulture:\t[6D27]';
const FIELDS = ['uwp', 'importance', 'economics', 'culture'];
const LABELS = { uwp: 'UWP', importance: 'Znaczenie (Ix)', economics: 'Ekonomia (Ex)', culture: 'Kultura (Cx)' };

export function normalize(value) {
  return String(value ?? '').normalize('NFKC').replace(/[‐‑‒–—−﹣－]/g, '-').trim().toUpperCase();
}
export function ehex(code) { return code === '?' ? null : EHEX.indexOf(code); }
function invalid(field, message) { return { field, message: `${LABELS[field]}: ${message}` }; }
function fail(field, message) { throw invalid(field, message); }
const compact = value => normalize(value).replace(/\s/g, '');
const fmt = value => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value);
const metric = (label, code, title, description, extra = '', value = ehex(code)) => ({ label, code, value, title, description, extra });
const unknown = label => metric(label, '?', 'Brak danych', 'Znak „?” oznacza nieznaną wartość.');

export function parseUwp(input) {
  const code = compact(input);
  if (!code) return null;
  if (!/^[A-HXY?][0-9A-Z?]{6}-[0-9A-Z?]$/.test(code)) {
    fail('uwp', 'wpisz port i 6 znaków, myślnik oraz TL, np. A593943-A (7 znaków przed myślnikiem).');
  }
  const chars = [...code.slice(0, 7), code.at(-1)];
  const allowed = ['ABCDEXFGHY?', '0123456789ABCDEF?', '0123456789ABCDEF?', '0123456789A?', '0123456789ABCDEF?', `${EHEX}?`, '0123456789ABCDEFGHJKLS?', '0123456789ABCDEFGHJKL?'];
  const names = ['port', 'wielkość', 'atmosfera', 'hydrografia', 'populacja', 'ustrój', 'prawo', 'technologia'];
  chars.forEach((char, i) => { if (!allowed[i].includes(char)) fail('uwp', `nieobsługiwany kod „${char}” w polu „${names[i]}”.`); });
  return { code, chars };
}

function unwrap(input, open, close, field) {
  const code = compact(input);
  if (!code) return '';
  if (code.startsWith(open) && code.endsWith(close)) return code.slice(1, -1);
  if (code.includes(open) || code.includes(close)) fail(field, `zamknij zapis nawiasami ${open}${close} albo wpisz sam kod.`);
  return code;
}
export function parseImportance(input) {
  const code = unwrap(input, '{', '}', 'importance');
  if (!code) { if (compact(input)) fail('importance', 'nawiasy są puste.'); return null; }
  if (!/^[+-]?\d+$/.test(code) || Number(code) < -3 || Number(code) > 5) fail('importance', 'oczekiwana liczba całkowita od -3 do 5, np. { 4 }.');
  const value = Number(code);
  return { code: `{ ${value} }`, value };
}
export function parseEconomics(input) {
  const code = unwrap(input, '(', ')', 'economics');
  if (!code) { if (compact(input)) fail('economics', 'nawiasy są puste.'); return null; }
  if (!/^[0-9A-HJ-NP-Z]{3}[+-]\d$/.test(code)) fail('economics', 'oczekiwane 3 znaki eHex i efektywność ze znakiem, np. (D8E+1). Litery I i O nie należą do eHex.');
  const values = [...code.slice(0, 3)].map(ehex);
  const efficiency = Number(code.slice(3));
  if (values[0] > 18 || values[1] > 14 || values[2] > 17 || Math.abs(efficiency) > 5) fail('economics', 'zakresy: zasoby 0–J, siła robocza 0–E, infrastruktura 0–H, efektywność -5…+5.');
  return { code: `(${code})`, chars: [...code.slice(0, 3), code.slice(3)], values: [...values, efficiency] };
}
export function parseCulture(input) {
  const code = unwrap(input, '[', ']', 'culture');
  if (!code) { if (compact(input)) fail('culture', 'nawiasy są puste.'); return null; }
  if (!/^[0-9A-HJ-NP-Z]{4}$/.test(code)) fail('culture', 'oczekiwane 4 znaki eHex, np. [6D27]. Litery I i O nie należą do eHex.');
  const values = [...code].map(ehex);
  if (values.some((value, i) => value > [16, 15, 10, 20][i])) fail('culture', 'zakresy: różnorodność 0–G, akceptacja 0–F, odmienność 0–A, symbole 0–L.');
  return { code: `[${code}]`, chars: [...code], values };
}

// Importujemy pojedynczy świat. Etykietowane, uszkodzone pole zawsze trafia do walidatora.
export function extractMapData(input) {
  const text = normalize(input).replace(/\\/g, '\n');
  const aliases = { uwp: 'UWP', importance: 'IMPORTANCE|ZNACZENIE|IX', economics: 'ECONOMICS|ECONOMIC|EKONOMIA|EX', culture: 'CULTURE|CULTURAL|KULTURA|CX' };
  const patterns = { uwp: /(?:^|[^A-Z0-9?])([A-HXY?][A-Z0-9?]{6,}-[A-Z0-9?])(?=$|[^A-Z0-9?])/g, importance: /\{[^{}\n]*\}/g, economics: /\([^()\n]*\)/g, culture: /\[[^\[\]\n]*\]/g };
  const result = Object.fromEntries(FIELDS.map(field => [field, '']));
  const errors = [];
  for (const field of FIELDS) {
    const label = new RegExp(`(?:^|[\\s;])(?:${aliases[field]})[ \\t]*:[ \\t]*([^\\n\\r]*)`, 'g');
    const labelled = [...text.matchAll(label)];
    let tokens = [...text.matchAll(patterns[field])];
    // Nazwy ras w uwagach też używają () i []; rozszerzenia mają własny kształt i kolejność.
    if (field === 'economics') tokens = tokens.filter(match => /^\([0-9A-Z?]{3}[+-]/.test(match[0]) || /^\([0-9A-Z?]{4,5}\)$/.test(match[0]) && /\d/.test(match[0]));
    if (field === 'culture') {
      const economicToken = text.match(/\([0-9A-Z?]{3}[+-][^()\n]*\)/);
      const anchor = economicToken?.index ?? -1;
      tokens = tokens.filter(match => match.index > anchor && (match[0].length === 6 || /\d/.test(match[0])));
    }
    let matches;
    if (labelled.length) {
      matches = labelled.map(match => {
        const line = match[1].trim();
        if (field === 'uwp') return line.split(/\s/)[0] || '?';
        if (line === '-') return '';
        const opener = { importance: '{', economics: '(', culture: '[' }[field];
        if (line.startsWith(opener)) return line.match(patterns[field])?.[0] || line;
        return line.split(/\s/)[0] || '?';
      });
    } else {
      matches = tokens.map(match => field === 'uwp' ? match[1] : match[0]);
    }
    if (matches.length > 1 || tokens.length > 1) errors.push(invalid(field, 'znaleziono kilka wartości. Wklej dane jednego świata.'));
    result[field] = matches[0] || '';
  }
  if (!FIELDS.some(field => result[field])) errors.push(invalid('uwp', 'nie znaleziono kodów. Wklej UWP lub dane świata z Traveller Map.'));
  return { fields: result, errors };
}

const UWP_PREVIEW_CODES = {
  port: 'ABCDEXFGHY', size: EHEX.slice(0, 16), atmosphere: EHEX.slice(0, 16),
  hydro: EHEX.slice(0, 11), population: EHEX.slice(0, 16), government: EHEX,
  law: `${EHEX.slice(0, 21)}S`, technology: EHEX.slice(0, 21),
};
const UWP_LABELS = { port: 'Port', size: 'Wielkość', atmosphere: 'Atmosfera', hydro: 'Hydrografia', population: 'Populacja', government: 'Ustrój', law: 'Poziom prawa', technology: 'Poziom technologiczny' };

function uwpMetric(key, code, context = {}) {
  const value = ehex(code);
  let item;
  if (code === '?') item = unknown(UWP_LABELS[key]);
  else if (key === 'port') item = metric('Port', code, ...PORTS[code], null);
  else if (key === 'size') {
    const gravity = [null, .122, .240, .377, .5, .625, .840, .875, 1, 1.120, 1.250, 1.375, 1.5, 1.625, 1.750, 1.875];
    item = metric('Wielkość', code, value === 0 ? 'Pas asteroid' : `Średnica ok. ${fmt(value * 1600)} km`, value === 0 ? 'Światem jest pas małych ciał, a nie pojedyncza planeta.' : `Orientacyjna grawitacja: ${fmt(gravity[value])} g przy gęstości zbliżonej do ziemskiej. Rzeczywista gęstość może ją zmieniać.`);
  } else if (key === 'atmosphere') item = metric('Atmosfera', code, ...ATMOSPHERES[value]);
  else if (key === 'hydro') {
    const a = context.atmosphere;
    item = metric('Hydrografia', code, value === 0 ? 'Suchy świat' : `${value * 10}% powierzchni pokrytej cieczą`, value === 0 ? 'Brak rozległych mórz i oceanów.' : `To przybliżony udział powierzchni mórz i oceanów.${a !== null && a >= 10 ? ' Przy takiej atmosferze cieczą nie musi być woda.' : ''}${a !== null && a <= 1 ? ' W próżni lub śladowej atmosferze zasoby mogą występować jako lód.' : ''}`);
  } else if (key === 'population') {
    const names = ['Brak lub nieliczni mieszkańcy', 'Dziesiątki', 'Setki', 'Tysiące', 'Dziesiątki tysięcy', 'Setki tysięcy', 'Miliony', 'Dziesiątki milionów', 'Setki milionów', 'Miliardy', 'Dziesiątki miliardów', 'Setki miliardów', 'Biliony', 'Dziesiątki bilionów', 'Setki bilionów', 'Biliardy'];
    item = metric('Populacja', code, names[value], value === 0 ? 'Kod 0 oznacza brak lub mniej niż 10 mieszkańców.' : `Rząd wielkości: od ${fmt(10 ** value)} do mniej niż ${fmt(10 ** (value + 1))} mieszkańców. Dokładna liczba wymaga mnożnika z PBG; sam UWP jej nie podaje.`);
  } else if (key === 'government') item = metric('Ustrój', code, ...GOVERNMENTS[code]);
  else if (key === 'law') item = code === 'S' ? metric('Poziom prawa', code, 'Sytuacja specjalna / zmienna', 'Zasady zależą od miejsca lub okoliczności; kod nie podaje jednolitego poziomu.', '', null) : lawMetric(code);
  else if (key === 'technology') item = getLevelMetric('technology', value, code);
  return { ...item, previewKey: key, previewContext: context };
}

function decodeUwp(parsed) {
  const keys = Object.keys(UWP_PREVIEW_CODES);
  return { title: 'Profil świata', code: parsed.code, items: keys.map((key, i) => uwpMetric(key, parsed.chars[i], { atmosphere: ehex(parsed.chars[2]) })) };
}

// UWP ma również kody umowne (port, ustrój, prawo S), więc podgląd nie używa samego +/-1.
export function getPreviewValues(item) {
  if (item.previewKey) return [...(item.code === '?' ? '?' : ''), ...UWP_PREVIEW_CODES[item.previewKey]];
  if (item.guideKey) return Array.from({ length: item.max - item.min + 1 }, (_, i) => item.min + i);
  return [];
}
export function getPreviewValue(item) { return item.previewKey ? item.code : item.value; }
export function previewMetric(item, value) {
  if (!getPreviewValues(item).includes(value)) throw new RangeError('Poziom poza zakresem podglądu.');
  if (value === getPreviewValue(item)) return item;
  return item.previewKey ? uwpMetric(item.previewKey, value, item.previewContext) : getLevelMetric(item.guideKey, value);
}

export function getLevelMetric(key, value, originalCode) {
  const guide = LEVEL_GUIDES[key];
  const max = guide ? guide.min + guide.levels.length - 1 : -1;
  if (!guide || !Number.isInteger(value) || value < guide.min || value > max) throw new RangeError('Poziom poza zakresem podglądu.');
  const [title, world, visitors] = guide.levels[value - guide.min];
  const code = originalCode ?? (key === 'efficiency' ? `${value >= 0 ? '+' : ''}${value}` : EHEX[value]);
  const extra = key === 'technology' ? TECH_EXAMPLES.filter(([level]) => level <= value).map(([, text]) => text).join(' ') : guide.extremes;
  return {
    ...metric(guide.label, code, key === 'technology' ? `TL ${value} — ${title}` : title, guide.definition, extra, value),
    guideKey: key, min: guide.min, max, originalName: guide.originalName,
    scaleDescription: guide.extremes, interpretation: { world, visitors },
  };
}

function lawMetric(code) {
  const value = ehex(code);
  const item = metric('Poziom prawa', code, LAWS[value][0], value === 0 ? 'Brak narastających zakazów.' : 'Obowiązują poniższe ograniczenia z poprzednich poziomów oraz wyróżniony poziom bieżący.', 'Opis według Second Survey; szczegóły i wyjątki lokalnego prawa ustala MG.');
  // Kod 0 oznacza brak zakazów, więc nie jest zakazem dziedziczonym przez poziomy 1+.
  item.restrictions = Array.from({ length: value || 1 }, (_, offset) => {
    const level = value === 0 ? 0 : offset + 1;
    return { code: EHEX[level], description: LAWS[level][1], current: level === value };
  });
  return item;
}

function decodeEconomics(parsed) {
  return { title: 'Ekonomia', code: parsed.code, items: ['resources', 'labor', 'infrastructure', 'efficiency'].map((key, i) => getLevelMetric(key, parsed.values[i], parsed.chars[i])) };
}
function decodeCulture(parsed) {
  const items = ['heterogeneity', 'acceptance', 'strangeness', 'symbols'].map((key, i) => getLevelMetric(key, parsed.values[i], parsed.chars[i]));
  if (parsed.values.every(value => value === 0)) {
    for (const item of items) {
      item.title = 'Brak kultury do opisania';
      item.interpretation = { world: 'Zapis [0000] jest stosowany dla światów bez ludności. Nie ma bieżącej kultury do oceny.', visitors: 'Zachowania ewentualnej ekspedycji, nowej kolonii lub pozostałości dawnych mieszkańców wymagają osobnego opisu.' };
    }
  }
  return { title: 'Kultura', code: parsed.code, items };
}

export function decodeProfile(fields) {
  const errors = [], parsed = {}, canonical = {}, sections = [], warnings = [];
  const parsers = { uwp: parseUwp, importance: parseImportance, economics: parseEconomics, culture: parseCulture };
  for (const field of FIELDS) {
    try { parsed[field] = parsers[field](fields[field]); canonical[field] = parsed[field]?.code || ''; }
    catch (error) { if (!error.field) throw error; errors.push(error); }
  }
  if (!FIELDS.some(field => compact(fields[field]))) errors.push(invalid('uwp', 'wpisz co najmniej jeden kod. Rozszerzenia są opcjonalne i można je też odczytać osobno.'));
  if (errors.length) return { errors, sections: [], warnings: [], fields: canonical };
  if (parsed.uwp) sections.push(decodeUwp(parsed.uwp));
  if (parsed.importance) {
    const { value, code } = parsed.importance;
    sections.push({ title: 'Znaczenie', code, items: [metric('Znaczenie regionalne (Ix)', String(value), value < 0 ? 'Świat mało znaczący' : value === 0 ? 'Świat przeciętny' : value < 4 ? 'Świat znaczący' : 'Świat ważny', 'Względna rola świata w regionie. Łączy m.in. port, technologię, populację i potencjał handlowy.', 'Dla MG: wysoki wynik sprzyja roli węzła handlowego lub politycznego; niski — peryferyjnej placówki. Ix nie jest oceną bezpieczeństwa.', value)] });
  }
  if (parsed.economics) {
    sections.push(decodeEconomics(parsed.economics));
    if (parsed.economics.values[0] < 2) warnings.push('Zasoby Ex poniżej 2 są poza typowym zakresem opisowym Second Survey; zachowano wpisaną wartość (np. zapis zerowy).');
  }
  if (parsed.culture) {
    sections.push(decodeCulture(parsed.culture));
    if (parsed.culture.values.slice(0, 3).some(value => value === 0) && parsed.culture.values.some(value => value !== 0)) warnings.push('Kultura ma pojedyncze zera: dla zamieszkanego świata pierwsze trzy skale zwykle zaczynają się od 1.');
    const pop = parsed.uwp ? ehex(parsed.uwp.chars[4]) : null;
    if (pop === 0 && parsed.culture.values.some(value => value !== 0)) warnings.push('Populacja UWP ma kod 0, ale Cx jest niezerowe. Sprawdź, czy rozszerzenie dotyczy tego samego świata.');
    if (pop !== null && pop > 0 && parsed.culture.values.every(value => value === 0)) warnings.push('Świat jest zamieszkany według UWP, ale [0000] zwykle oznacza świat bez ludności.');
  }
  return { errors, sections, warnings, fields: canonical };
}

export function formatProfile(result) {
  const sections = result.sections.map(section => `${section.title}: ${section.code}\n${section.items.map(item => {
    const lines = [`${item.label}${item.originalName ? ` (${item.originalName})` : ''} [${item.code}${item.value !== null && item.code !== String(item.value) ? ` = ${item.value}` : ''}]: ${item.title}`, item.description];
    if (item.interpretation) lines.push(`Świat: ${item.interpretation.world}`, `Dla przybyszów: ${item.interpretation.visitors}`);
    if (item.restrictions) lines.push(...item.restrictions.map(entry => `${entry.code}${entry.current ? ' (bieżący)' : ''}: ${entry.description}`));
    if (item.extra) lines.push(item.extra);
    return lines.join('\n');
  }).join('\n\n')}`);
  return [...sections, ...result.warnings.map(warning => `Uwaga: ${warning}`), 'Podstawa: Traveller Map — Second Survey. Ceny paliwa i przykłady wyposażenia: Mongoose Traveller SRD. Opisy poziomów Ex/Cx i wskazówki do sesji są interpretacją MG; TL nie gwarantuje dostępności każdego urządzenia. Kopia zawiera wartości źródłowe, niezależnie od podglądu innych poziomów.', 'https://travellermap.com/doc/secondsurvey', 'https://www.traveller-srd.com/core-rules/spacecraft-operations/', 'https://www.traveller-srd.com/core-rules/equipment/'].join('\n\n');
}
