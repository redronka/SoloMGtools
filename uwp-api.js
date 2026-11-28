import { decodeProfile, extractMapData, ehex } from './uwp.js?v=8';

const BASES = {
  C: 'Baza korsarska', D: 'Skład marynarki', E: 'Ambasada', F: 'Ruiny', H: 'Baza zaopatrzeniowa Hiverów',
  I: 'Placówka kontaktowa', K: 'Baza marynarki', L: 'Baza marynarki', M: 'Baza wojskowa', N: 'Baza marynarki',
  O: 'Posterunek marynarki', R: 'Baza klanowa', S: 'Baza zwiadowcza', T: 'Baza Tlauku', V: 'Baza eksploracyjna',
  W: 'Stacja etapowa', X: 'Stacja przekaźnikowa', Z: 'Baza marynarki i wojsk lądowych',
};
const NOBILITY = { B: 'Rycerz', c: 'Baronet', C: 'Baron', D: 'Markiz', e: 'Wicehrabia', E: 'Hrabia', f: 'Książę', F: 'Książę podsektora', G: 'Arcyksiążę', H: 'Cesarz' };
const ZONES = {
  '': ['Bez ograniczeń', 'Zielona'], A: ['Zalecana ostrożność', 'Bursztynowa'], R: ['Dostęp ograniczony', 'Czerwona'],
  B: ['Dyktatura wsparta zaawansowaną technologią', 'Według służb danych Koalicji'],
  F: ['Wstęp zabroniony', 'Według służb danych Konsulatu'], U: ['Świat niezintegrowany', 'Według służb danych Konsulatu'],
};
const text = value => typeof value === 'string' ? value.trim() : '';

// Tylko lokalizacja (opcjonalnie z wierszem podsektora), nigdy pełny opis z kodami.
export function locationQuery(input) {
  const lines = String(input ?? '').replace(/\\/g, '\n').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const candidates = lines.filter(line => !/^.+\s+(?:Subsector|Subsektor|Podsektor)$/i.test(line));
  if (candidates.length !== 1 || lines.length > 2) return null;
  const match = /^([^:\n]+?)\s+(\d{4})$/.exec(candidates[0]);
  if (!match) return null;
  const x = Number(match[2].slice(0, 2)), y = Number(match[2].slice(2));
  return x >= 1 && x <= 32 && y >= 1 && y <= 40 ? { sector: match[1], hex: match[2] } : null;
}

function stellarDescription(stellar) {
  const classes = { Ia: 'nadolbrzym', Ib: 'nadolbrzym', II: 'jasny olbrzym', III: 'olbrzym', IV: 'podolbrzym', V: 'karzeł (ciąg główny)', VI: 'podkarzeł', VII: 'biały karzeł' };
  const colors = { O: 'niebieski', B: 'niebieski', A: 'biały', F: 'żółtobiały', G: 'żółty', K: 'pomarańczowy', M: 'czerwony' };
  const compact = { D: 'biały karzeł', BD: 'brązowy karzeł', BH: 'czarna dziura', PSR: 'pulsar', NS: 'gwiazda neutronowa' };
  return stellar.replace(/[OBAFGKM][0-9] D/g, 'D').split(/\s+(?!Ia\b|Ib\b|II\b|III\b|IV\b|V\b|VI\b|VII\b)/).map(code => {
    if (compact[code]) return `${code} ${compact[code]}`;
    const match = /^([OBAFGKM])[0-9]\s+(Ia|Ib|II|III|IV|V|VI|VII)$/.exec(code);
    if (!match) return code;
    const detail = match[2] === 'V' && 'OBA'.includes(match[1]) ? 'gwiazda ciągu głównego' : classes[match[2]];
    return `${code} ${colors[match[1]]} ${detail}`;
  }).join(' · ');
}

// Zapis w formacie wejściowym daje identyczną ścieżkę edycji, eksportu i odtwarzania linku.
export function worldToPaste(world, location) {
  const sector = text(world.Sector) || location.sector;
  const lines = [
    ...(text(world.SubsectorName) ? [`${text(world.SubsectorName)} Subsector`] : []),
    `${sector} ${location.hex}`,
    ...(text(world.Name) ? [`Name: ${text(world.Name)}`] : []),
  ];
  const add = (label, value) => { if (value !== '' && value !== null && value !== undefined) lines.push(`${label}: ${value}`); };
  const allegiance = text(world.Allegiance), allegianceName = text(world.AllegianceName);
  add('Allegiance', allegianceName && allegianceName !== allegiance ? `${allegianceName}${allegiance ? ` (${allegiance})` : ''}` : allegiance);
  const system = [];
  if (text(world.Stellar)) system.push(stellarDescription(text(world.Stellar)));
  const pbg = text(world.PBG).toUpperCase();
  const digit = index => pbg[index] && pbg[index] !== '?' && ehex(pbg[index]) >= 0 ? ehex(pbg[index]) : null;
  const belts = digit(1), giants = digit(2);
  const counts = [];
  if (giants !== null) counts.push(`${giants} Gas Giants`);
  if (belts !== null) counts.push(`${belts} Planetoid Belts`);
  const worlds = Number(world.Worlds);
  if (world.Worlds !== undefined && world.Worlds !== null && world.Worlds !== '' && Number.isInteger(worlds) && worlds > 0 && belts !== null && giants !== null) {
    counts.push(`${Math.max(worlds - 1 - belts - giants, 0)} Other Worlds`);
  }
  if (counts.length) system.push(counts.join(' — '));
  add('System', system.join('\n'));
  let bases = [...text(world.Bases)].map(code => BASES[code] || `Baza — kod ${code}`);
  if (/^Zh/.test(allegiance) && world.Bases === 'KM') bases = ['Baza Zhodani'];
  if (/^Zh/.test(allegiance) && world.Bases === 'W') bases = ['Stacja przekaźnikowa Zhodani'];
  add('Bases', [...new Set(bases)].join(', '));
  add('UWP', text(world.UWP));
  add('Importance', text(world.Ix));
  add('Economics', text(world.Ex));
  add('Culture', text(world.Cx));
  const exponent = text(world.UWP)[4], multiplier = digit(0);
  if (exponent && exponent !== '?' && ehex(exponent) >= 0 && multiplier !== null) {
    const population = BigInt(multiplier) * 10n ** BigInt(ehex(exponent));
    add('Population', `${multiplier} × 10^${ehex(exponent)} = ${population.toLocaleString('en-US')}`);
  }
  add('Nobility', [...text(world.Nobility)].map(code => NOBILITY[code] || `Kod ${code}`).join(', '));
  add('Remarks', text(world.Remarks));
  const zoneCode = text(world.Zone);
  const zone = ZONES[zoneCode] || [`Strefa — kod ${zoneCode}`, 'Brak danych'];
  add('Travel Zone', zone[0]);
  add("Travellers' Aid Society Rating", zone[1]);
  return lines.join('\n');
}

export async function fetchWorldProfile(location, { signal, fetcher = fetch, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const query = new URLSearchParams({ sector: location.sector, hex: location.hex, jump: '0' });
    let response;
    try {
      response = await fetcher(`https://travellermap.com/api/jumpworlds?${query}`, { signal: controller.signal, referrerPolicy: 'no-referrer', credentials: 'omit' });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error(timedOut ? 'Traveller Map nie odpowiada. Spróbuj ponownie albo wklej pełne dane.' : 'Nie udało się połączyć z Traveller Map. Sprawdź internet albo wklej pełne dane.');
    }
    if (!response.ok) throw new Error(response.status === 404 ? 'Nie znaleziono sektora lub świata pod tym heksem.' : `Traveller Map zwrócił błąd ${response.status}. Spróbuj ponownie albo wklej pełne dane.`);
    let data;
    try { data = await response.json(); }
    catch { throw new Error('Traveller Map zwrócił nieprawidłowe dane. Spróbuj ponownie albo wklej pełny opis.'); }
    if (!Array.isArray(data?.Worlds)) throw new Error('Traveller Map zwrócił nieprawidłową odpowiedź.');
    const world = data.Worlds.find(world => world && text(world.Hex) === location.hex);
    if (!world) throw new Error('Nie znaleziono świata pod tym heksem. Sprawdź sektor i współrzędne lub wklej własne dane.');
    if (!text(world.UWP)) throw new Error('Wybrany obiekt nie ma profilu UWP. Wklej własne dane.');
    const source = worldToPaste(world, location);
    const imported = extractMapData(source);
    if (imported.errors.length) throw new Error('Dane świata z Traveller Map są niejednoznaczne. Wklej pełne dane ręcznie.');
    const result = decodeProfile(imported.fields, imported.additional);
    if (result.errors.length) throw new Error(`Profil świata z API wymaga poprawy: ${result.errors.map(error => error.message).join(' ')}`);
    return { source, result };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
