// Ten sam format obsługuje dane wklejone ręcznie i pobrane z API.
export const FULL_EXAMPLE_PASTE = `Lanth Subsector
Spinward Marches 1920
Allegiance: Third Imperium, Domain of Deneb (ImDd)
System:
M0 V Red Dwarf (Main Sequence) M3 V Red Dwarf (Main Sequence)
2 Gas Giants — 1 Planetoid Belts — 2 Other Worlds
Naval Base
UWP: B420410–D
Importance: { 1 } Ordinary
Economics: (934−3)
Culture: [1518]
Population: 3 × 104 = 30,000
Nobility: Knight
Remarks: De Desert He Hellworld Ni Non-Industrial Po Poor Ht High Technology
Travel Zone: No Restrictions
Travellers' Aid Society Rating: Green`;

const REMARKS = {
  As: ['Pas asteroid', 'Świat składa się z małych ciał zamiast jednej planety.', 'size'],
  De: ['Świat pustynny', 'Brak rozległych powierzchni wody; zaopatrzenie w wodę jest istotne dla osad i podróżnych.', 'hydro'],
  Fl: ['Oceany innych cieczy', 'Ciecze na powierzchni nie muszą być wodą.', 'hydro'],
  Ga: ['Świat ogrodowy', 'Warunki fizyczne sprzyjają życiu podobnemu do ziemskiego.', 'atmosphere'],
  He: ['Świat skrajnie nieprzyjazny', 'Warunki środowiskowe są szczególnie trudne; potrzebne zabezpieczenia zależą od atmosfery i lokalnych warunków.', 'atmosphere'],
  Ic: ['Świat pokryty lodem', 'Zasoby cieczy występują przede wszystkim w postaci lodu.', 'hydro'],
  Oc: ['Świat oceaniczny', 'Oceany dominują na powierzchni świata.', 'hydro'],
  Va: ['Świat bez atmosfery', 'Na powierzchni konieczne jest podtrzymywanie życia.', 'atmosphere'],
  Wa: ['Świat wodny', 'Woda pokrywa niemal całą powierzchnię.', 'hydro'],
  Di: ['Wymarła populacja', 'Kod wskazuje na dawniej zamieszkany świat, którego ludność zanikła.', 'population'],
  Ba: ['Świat niezamieszkany', 'Brak stałej populacji i działającej gospodarki.', 'population'],
  Lo: ['Niska populacja', 'Niewielka liczba mieszkańców ogranicza skalę osadnictwa i usług.', 'population'],
  Ni: ['Świat nieprzemysłowy', 'Mała populacja ogranicza samowystarczalność przemysłową; złożone towary mogą wymagać importu.', 'population'],
  Ph: ['Rosnąca populacja', 'Populacja zbliża się do kategorii światów o wysokim zaludnieniu.', 'population'],
  Hi: ['Wysoka populacja', 'Duża populacja oznacza rozległy rynek i duże zapotrzebowanie na zasoby.', 'population'],
  Pa: ['Potencjał rolniczy', 'Świat zbliża się do kryteriów gospodarki rolniczej.'],
  Ag: ['Świat rolniczy', 'Warunki i populacja sprzyjają produkcji rolnej.'],
  Na: ['Świat nierolniczy', 'Warunki utrudniają rolnictwo na dużą skalę.'],
  Px: ['Więzienie lub obóz zesłańców', 'Świat pełni funkcję miejsca izolacji więźniów lub zesłańców.'],
  Pi: ['Potencjał przemysłowy', 'Świat zbliża się do kryteriów gospodarki przemysłowej.'],
  In: ['Świat przemysłowy', 'Duża populacja i warunki świata sprzyjają gospodarce przemysłowej.'],
  Po: ['Świat ubogi', 'Warunki naturalne utrudniają rozwój gospodarki; kod handlowy nie opisuje majątku każdego mieszkańca.'],
  Pr: ['Potencjał bogactwa', 'Świat zbliża się do kryteriów bogatej gospodarki.'],
  Ri: ['Świat bogaty', 'Profil świata sprzyja zamożnej gospodarce.'],
  Fr: ['Świat zamarznięty', 'Bardzo niskie temperatury kształtują warunki życia.'],
  Ho: ['Świat gorący', 'Wysokie temperatury utrudniają pobyt na powierzchni.'],
  Co: ['Świat zimny', 'Niskie temperatury wpływają na osadnictwo i podróże.'],
  Lk: ['Rotacja synchroniczna', 'Świat stale zwraca tę samą stronę ku ciału, wokół którego krąży.'],
  Tr: ['Świat tropikalny', 'Dominuje ciepły klimat.'],
  Tu: ['Tundra', 'Chłodny klimat ogranicza roślinność i rolnictwo.'],
  Tz: ['Strefa zmierzchu', 'Warunki osadnictwa wiążą się ze strefą pomiędzy stroną dzienną i nocną.'],
  Fa: ['Świat uprawny', 'Gospodarka jest związana z uprawą i produkcją żywności.'],
  Mi: ['Świat górniczy', 'Istotną rolę odgrywa wydobycie surowców.'],
  Mr: ['Rządy wojskowe', 'Władzę sprawują struktury wojskowe.', 'government'],
  Pe: ['Kolonia karna', 'Osadnictwo ma charakter kolonii karnej.'],
  Re: ['Rezerwat', 'Świat lub jego część podlega ochronie i ograniczeniom dostępu.'],
  Cp: ['Stolica podsektora', 'Świat pełni funkcję stolicy podsektora.'],
  Cs: ['Stolica sektora', 'Świat pełni funkcję stolicy sektora.'],
  Cx: ['Stolica', 'Świat jest ośrodkiem władzy politycznej.'],
  Cy: ['Kolonia', 'Świat ma status kolonii.'],
  Sa: ['Satelita', 'Główny świat jest księżycem innego ciała.'],
  Fo: ['Świat zakazany', 'Dostęp do świata jest zabroniony.'],
  Pz: ['Zagadka', 'Świat ma nietypowe lub niewyjaśnione cechy.'],
  Da: ['Niebezpieczeństwo', 'Kod ostrzega o szczególnych zagrożeniach.'],
  Ab: ['Repozytorium danych', 'Świat jest związany z przechowywaniem danych.'],
  An: ['Stanowisko Pradawnych', 'Odnotowano pozostałości związane z Pradawnymi.'],
  Rs: ['Stacja badawcza', 'Na świecie działa stacja badawcza.'],
  Lt: ['Niski poziom technologii', 'Lokalna technologia jest niska według klasyfikacji mapy.', 'technology'],
  Ht: ['Wysoki poziom technologii', 'Lokalna technologia jest wysoka według klasyfikacji mapy.', 'technology'],
  St: ['Świat stepowy', 'Na świecie występują rozległe obszary stepowe.'],
  Ex: ['Obóz zesłańców', 'Świat jest miejscem zesłania.'],
  Xb: ['Stacja kurierska', 'Na świecie działa stacja sieci kurierskiej.'],
  Cr: ['Stolica rezerwowa', 'Świat pełni funkcję rezerwowej stolicy.'],
};
const translations = [
  [/Third Imperium/gi, 'Trzecie Imperium'], [/Domain of Deneb/gi, 'Domena Deneb'],
  [/Naval Base/gi, 'Baza marynarki'], [/Scout Base/gi, 'Baza zwiadowcza'],
  [/Military Base/gi, 'Baza wojskowa'], [/Research Station/gi, 'Stacja badawcza'],
  [/No Restrictions/gi, 'Bez ograniczeń'], [/^Amber$/gi, 'Bursztynowa'], [/^Green$/gi, 'Zielona'], [/^Red$/gi, 'Czerwona'],
  [/^Caution$/gi, 'Zalecana ostrożność'], [/^Restricted$/gi, 'Dostęp ograniczony'], [/^Forbidden$/gi, 'Wstęp zabroniony'],
  [/^Technologically Elevated Dictatorship$/gi, 'Dyktatura wsparta zaawansowaną technologią'], [/^Unabsorbed$/gi, 'Świat niezintegrowany'],
  [/Knight/gi, 'Rycerz'], [/Baronet/gi, 'Baronet'], [/Baron/gi, 'Baron'], [/Marquis/gi, 'Markiz'],
  [/Viscount/gi, 'Wicehrabia'], [/Count/gi, 'Hrabia'], [/Archduke/gi, 'Arcyksiążę'], [/Duke/gi, 'Książę'], [/Emperor/gi, 'Cesarz'],
  [/Main Sequence/gi, 'ciąg główny'], [/Red Dwarf/gi, 'czerwony karzeł'], [/White Dwarf/gi, 'biały karzeł'],
  [/Brown Dwarf/gi, 'brązowy karzeł'], [/Gas Giants?/gi, 'gazowe olbrzymy'],
  [/Planetoid Belts?/gi, 'pasy planetoid'], [/Other Worlds?/gi, 'pozostałe światy'],
];
export function translateMapText(value) {
  const counted = [
    [/\b(\d+)\s+Gas Giants?\b/gi, ['gazowy olbrzym', 'gazowe olbrzymy', 'gazowych olbrzymów']],
    [/\b(\d+)\s+Planetoid Belts?\b/gi, ['pas planetoid', 'pasy planetoid', 'pasów planetoid']],
    [/\b(\d+)\s+Other Worlds?\b/gi, ['pozostały świat', 'pozostałe światy', 'pozostałych światów']],
  ];
  for (const [pattern, forms] of counted) value = value.replace(pattern, (_, count) => {
    const n = Number(count), plural = n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14);
    return `${count} ${forms[n === 1 ? 0 : plural ? 1 : 2]}`;
  });
  return translations.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function extractAdditionalData(input) {
  const lines = String(input ?? '').normalize('NFKC').replace(/\\/g, '\n').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const fields = {}, header = [];
  let current;
  for (const line of lines) {
    const label = /^([^:]{1,60}):\s*(.*)$/.exec(line);
    if (label) {
      current = label[1].toLowerCase().replace(/’/g, "'");
      fields[current] = label[2];
    } else if (current) fields[current] += `${fields[current] ? '\n' : ''}${line}`;
    else header.push(line);
  }
  let location = null, subsector = '', name = '';
  for (const line of header) {
    const sub = /^(.*?)\s+(?:Subsector|Subsektor|Podsektor)$/i.exec(line);
    const loc = /^(.+?)\s+(\d{4})$/.exec(line);
    if (sub) subsector = sub[1];
    else if (loc) {
      const x = Number(loc[2].slice(0, 2)), y = Number(loc[2].slice(2));
      if (x >= 1 && x <= 32 && y >= 1 && y <= 40) location = { sector: loc[1], hex: loc[2] };
    } else name ||= line;
  }
  name = fields.name || fields.nazwa || name;
  if (location) Object.assign(location, { subsector, name });
  const items = [];
  const add = (key, label, value) => { if (value && value !== '-') items.push({ key, label, value: translateMapText(value) }); };
  add('allegiance', 'Przynależność', fields.allegiance);
  const system = fields.system || '';
  const baseLines = system.split('\n').filter(line => /\b(?:Base|Station)\b/i.test(line));
  add('system', 'Układ gwiezdny', system.split('\n').filter(line => !baseLines.includes(line)).join('\n'));
  add('bases', 'Bazy i placówki', [fields.bases, ...baseLines].filter(Boolean).join(', '));
  const population = fields.population;
  if (population) {
    // Kopiowanie z HTML potrafi zgubić indeks górny w zapisie 10⁴ → 104.
    const exact = /(?:=\s*|^)([\d][\d, .\u00a0]*)$/.exec(population);
    const digits = exact?.[1].replace(/[^\d]/g, '');
    add('population', 'Dokładna populacja', digits ? `${BigInt(digits).toLocaleString('pl-PL')} mieszkańców` : population);
  }
  add('nobility', 'Szlachectwo', fields.nobility);
  add('zone', 'Strefa podróży', fields['travel zone']);
  add('tas', 'Ocena Towarzystwa Pomocy Podróżnym (TAS)', fields["travellers' aid society rating"]);
  const remarks = [...new Set((fields.remarks || '').match(/\b(?:Rs[A-Z]|[A-Z][a-z])\b/g) || [])].map(code => {
    const [title, description, parameter] = REMARKS[code] || (code.startsWith('Rs')
      ? [`Stacja badawcza ${code.slice(2)}`, 'Na świecie działa oznaczona tym kodem stacja badawcza.']
      : [`Kod ${code}`, 'Dodatkowe oznaczenie źródłowe; brak polskiego objaśnienia w lokalnej bibliotece.']);
    return { code, title, description, parameter };
  });
  return { location, items, remarks, rawRemarks: fields.remarks || '', sourceText: String(input ?? '') };
}

export function mapImageUrl(location) {
  const query = new URLSearchParams({ sector: location.sector, hex: location.hex, jump: '2', scale: '64', style: 'poster' });
  return `https://travellermap.com/api/jumpmap?${query}`;
}
export function genericPlanetUrl(uwp) {
  if (!uwp || uwp.includes('?')) return null;
  const type = uwp[1] === '0' ? 'Belt' : `Hyd${uwp[3]}`;
  return `https://travellermap.s3.amazonaws.com/images/generic_worlds/${type}.png`;
}
export function worldPlanetUrl(abbreviation, hex) {
  return `https://travellermap.s3.amazonaws.com/images/worlds/${encodeURIComponent(abbreviation)}%20${encodeURIComponent(hex)}.png`;
}
export function escapeMarkdown(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]#|]/g, '\\$&').replace(/\r?\n/g, ' · ');
}
