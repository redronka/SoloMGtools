import { el, action, notify } from './ui.js?v=3';
import { decodeProfile, extractMapData, formatProfile, getLevelMetric, EXAMPLE, EXAMPLE_PASTE } from './uwp.js?v=2';

function codeLabel(item) {
  return item.code + (item.value !== null && item.code !== String(item.value) ? ` = ${item.value}` : '');
}

function createLevelCard(item) {
  const card = el('article', 'uwp-card uwp-level-card');
  card.dataset.guide = item.guideKey;
  const top = el('div', 'uwp-card-top');
  const code = el('span', 'uwp-code', codeLabel(item));
  top.append(el('h4', '', item.label), code);
  const explanation = el('details', 'uwp-explanation');
  explanation.append(el('summary', '', 'Definicja i skala'));
  if (item.originalName) explanation.append(el('p', 'uwp-muted', `Nazwa oryginalna: ${item.originalName}.`));
  explanation.append(el('p', '', item.description), el('p', '', item.scaleDescription));
  const body = el('div', 'uwp-level-body');
  const toolbar = el('div', 'uwp-level-controls');
  const lower = el('button', 'button uwp-step', '← Niżej');
  const higher = el('button', 'button uwp-step', 'Wyżej →');
  const reset = el('button', 'button subtle uwp-reset', 'Reset');
  for (const button of [lower, higher, reset]) button.type = 'button';
  lower.setAttribute('aria-label', `${item.label}: pokaż niższy poziom`);
  higher.setAttribute('aria-label', `${item.label}: pokaż wyższy poziom`);
  reset.setAttribute('aria-label', `${item.label}: wróć do wartości źródłowej ${item.code}`);
  const previewStatus = el('p', 'uwp-preview-status');
  previewStatus.setAttribute('role', 'status');
  toolbar.append(lower, higher, reset);
  card.append(top, explanation, body, toolbar, previewStatus);
  let shown = item.value;

  function update() {
    const view = shown === item.value ? item : getLevelMetric(item.guideKey, shown);
    code.textContent = codeLabel(view);
    body.replaceChildren(el('p', 'uwp-value', view.title));
    for (const [label, text] of [['Świat', view.interpretation.world], ['Dla przybyszów', view.interpretation.visitors]]) {
      const paragraph = el('p', 'uwp-interpretation');
      paragraph.append(el('strong', '', `${label}: `), document.createTextNode(text));
      body.append(paragraph);
    }
    if (item.guideKey === 'technology' && view.extra) body.append(el('p', 'uwp-extra', view.extra));
    lower.disabled = shown <= item.min;
    higher.disabled = shown >= item.max;
    reset.disabled = shown === item.value;
    previewStatus.textContent = shown === item.value ? `Wartość z profilu: ${codeLabel(item)}` : `Podgląd: ${codeLabel(view)} · W profilu: ${codeLabel(item)}`;
    card.classList.toggle('is-preview', shown !== item.value);
  }
  lower.addEventListener('click', () => { shown = Math.max(item.min, shown - 1); update(); });
  higher.addEventListener('click', () => { shown = Math.min(item.max, shown + 1); update(); });
  reset.addEventListener('click', () => { shown = item.value; update(); });
  update();
  return card;
}

function createMetricCard(item) {
  if (item.guideKey) return createLevelCard(item);
  const card = el('article', 'uwp-card');
  const top = el('div', 'uwp-card-top');
  top.append(el('h4', '', item.label), el('span', 'uwp-code', codeLabel(item)));
  card.append(top, el('p', 'uwp-value', item.title), el('p', 'uwp-description', item.description));
  if (item.restrictions) {
    const list = el('ul', 'uwp-law-list');
    for (const entry of item.restrictions) {
      const line = el('li');
      const text = `${entry.code}${entry.current ? ' — bieżący' : ''}: ${entry.description}`;
      line.append(el(entry.current ? 'strong' : 'span', '', text));
      list.append(line);
    }
    card.append(list);
  }
  if (item.extra) card.append(el('p', 'uwp-extra', item.extra));
  return card;
}

export function initUwp(container) {
  const editor = el('details', 'uwp-editor');
  editor.open = true;
  const editorSummary = el('summary', 'uwp-editor-summary');
  const intro = el('div', 'uwp-intro');
  const title = el('h2', '', 'Odczytaj świat z kodu');
  title.id = 'uwp-editor-title';
  editorSummary.append(title);
  intro.append(el('p', 'uwp-muted', 'Wpisz UWP ręcznie lub wklej dane z Traveller Map. Rozszerzenia są opcjonalne — możesz je też odczytać osobno.'));
  const importBox = el('details', 'uwp-import');
  const importTitle = el('summary', '', 'Wklej dane z Traveller Map');
  const pasteLabel = el('label', 'uwp-label', 'Dane jednego świata');
  pasteLabel.htmlFor = 'uwp-paste';
  const paste = el('textarea');
  paste.id = 'uwp-paste';
  paste.rows = 5;
  paste.placeholder = EXAMPLE_PASTE;
  paste.spellcheck = false;
  const importButton = action('Wczytaj i dekoduj', 'refresh');
  const pasteHint = el('p', 'uwp-muted', 'Wklej sam kod, cztery wiersze z etykietami albo pełny wiersz danych sektora. Wczytanie zastąpi wszystkie pola poniżej.');
  pasteHint.id = 'uwp-paste-hint';
  paste.setAttribute('aria-describedby', pasteHint.id);
  importBox.append(importTitle, pasteLabel, paste, pasteHint, importButton);

  const form = el('form', 'uwp-form');
  form.noValidate = true;
  const fields = {};
  const grid = el('div', 'uwp-fields');
  const definitions = [
    ['uwp', 'Profil świata (UWP)', 'A593943-A', 'Port · wielkość · atmosfera · woda · populacja · ustrój · prawo – technologia'],
    ['importance', 'Znaczenie (Ix)', '{ 4 }', 'Liczba od -3 do 5'],
    ['economics', 'Ekonomia (Ex)', '(D8E+1)', 'Zasoby · siła robocza · infrastruktura · efektywność'],
    ['culture', 'Kultura (Cx)', '[6D27]', 'Różnorodność · akceptacja · odmienność · symbole'],
  ];
  for (const [key, labelText, placeholder, hint] of definitions) {
    const group = el('div', `uwp-field uwp-field-${key}`);
    const label = el('label', 'uwp-label', labelText);
    label.htmlFor = `uwp-input-${key}`;
    const input = el('input');
    input.id = label.htmlFor;
    input.name = key;
    input.type = 'text';
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocapitalize', 'characters');
    const help = el('small', 'uwp-muted', hint);
    help.id = `${input.id}-hint`;
    input.setAttribute('aria-describedby', help.id);
    group.append(label, input, help);
    grid.append(group);
    fields[key] = input;
  }
  const toolbar = el('div', 'uwp-actions');
  const decode = action('Dekoduj profil', 'world', 'button primary');
  decode.type = 'submit';
  const example = action('Wczytaj przykład', 'refresh', 'button subtle');
  const clear = action('Wyczyść', 'refresh', 'button subtle');
  toolbar.append(decode, example, clear);
  const errors = el('div', 'uwp-errors');
  errors.id = 'uwp-errors';
  errors.hidden = true;
  errors.setAttribute('role', 'alert');
  const status = el('p', 'sr-only');
  status.setAttribute('role', 'status');
  form.append(grid, errors, toolbar);
  editor.append(editorSummary, intro, importBox, form);

  const results = el('div', 'uwp-results');
  const resultBar = el('div', 'uwp-result-bar');
  const resultTitle = el('h2', '', 'Odczyt profilu');
  const copy = action('Kopiuj opis', 'copy', 'button subtle');
  copy.disabled = true;
  resultBar.append(resultTitle, copy);
  const output = el('div');
  const notes = el('p', 'uwp-muted uwp-reading-note', 'Opisy poziomów ekonomii i kultury oraz ich skutków są interpretacją MG opartą na skalach Second Survey (Traveller 5). Podgląd zmienia tylko opis na danej karcie; kopiowanie zachowuje wartości z profilu. Ceny paliwa i przykłady sprzętu: Mongoose Traveller SRD. TL nie gwarantuje dostępności każdego urządzenia.');
  const references = el('details', 'uwp-reference');
  references.append(el('summary', '', 'Jak czytać kody i źródła'));
  references.append(el('p', '', 'UWP ma postać A593943-A: port oraz sześć parametrów, a po myślniku poziom technologii. F/G/H/Y oznaczają porty na pozostałych światach układu. „?” to brak danych. Nie obliczamy Ix, Ex ani Cx z UWP — dekoder odczytuje wpisane wartości.'));
  references.append(el('p', '', 'eHex: 0–9, A=10, B=11, C=12, D=13, E=14, F=15, G=16, H=17, J=18, K=19, L=20. Litery I oraz O są pomijane. Ustrój i specjalne kody portów/prawa mają własne znaczenia.'));
  references.append(el('p', '', 'Paliwo: rafinowane 500 Cr/t, nierafinowane 100 Cr/t. Pobór z oceanu lub gazowego olbrzyma wymaga odpowiedniego statku; pozyskane paliwo jest nierafinowane. Sam UWP nie potwierdza obecności gazowego olbrzyma.'));
  references.append(el('p', '', 'Ustrój i prawo odczytujemy według podstawowej tabeli Second Survey. Światy Wi w Traveller: The New Era używają innej tabeli ustrojów — sam UWP nie pozwala rozpoznać tego wariantu.'));
  for (const [label, href] of [
    ['Traveller Map — Second Survey', 'https://travellermap.com/doc/secondsurvey'],
    ['Mongoose Traveller SRD — paliwo', 'https://www.traveller-srd.com/core-rules/spacecraft-operations/'],
    ['Mongoose Traveller SRD — wyposażenie i TL', 'https://www.traveller-srd.com/core-rules/equipment/'],
  ]) {
    const link = el('a', '', label);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    references.append(link);
  }
  results.append(resultBar, output);
  container.append(editor, status, results, notes, references);
  let current;

  function resetErrors() {
    errors.replaceChildren();
    errors.hidden = true;
    for (const input of [...Object.values(fields), paste]) {
      input.removeAttribute('aria-invalid');
      const described = input.getAttribute('aria-describedby')?.replace(/\s*uwp-errors/g, '');
      if (described) input.setAttribute('aria-describedby', described);
    }
  }
  function emptyOutput(message = 'Wpisz kody powyżej, aby zobaczyć ich znaczenie.') {
    current = null;
    copy.disabled = true;
    output.replaceChildren(el('p', 'uwp-empty', message));
  }
  function showErrors(items, fromPaste = false) {
    editor.open = true;
    if (fromPaste) importBox.open = true;
    resetErrors();
    const list = el('ul');
    for (const item of items) {
      const input = fromPaste ? paste : fields[item.field];
      input.setAttribute('aria-invalid', 'true');
      if (!input.getAttribute('aria-describedby').includes('uwp-errors')) input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby')} uwp-errors`);
      const li = el('li');
      const link = el('a', '', item.message);
      link.href = `#${input.id}`;
      // Nie zmieniamy hasha: steruje wyborem narzędzia w app.js.
      link.addEventListener('click', event => { event.preventDefault(); input.focus(); });
      li.append(link);
      list.append(li);
    }
    errors.append(list);
    errors.hidden = false;
    emptyOutput('Popraw wskazane dane i ponownie uruchom dekoder.');
    (fromPaste ? paste : fields[items[0].field]).focus();
  }
  function render(result) {
    resetErrors();
    current = result;
    copy.disabled = false;
    output.replaceChildren();
    if (result.warnings.length) {
      const warning = el('div', 'uwp-warning');
      for (const text of result.warnings) warning.append(el('p', '', text));
      output.append(warning);
    }
    for (const section of result.sections) {
      const block = el('section', 'uwp-section');
      const header = el('div', 'uwp-section-header');
      header.append(el('h3', '', section.title), el('code', 'uwp-profile-code', section.code));
      const cards = el('div', 'uwp-grid');
      for (const item of section.items) cards.append(createMetricCard(item));
      block.append(header, cards);
      output.append(block);
    }
    status.textContent = `Odczytano: ${result.sections.map(section => `${section.title} ${section.code}`).join(', ')}.`;
    editor.open = false;
    resultTitle.tabIndex = -1;
    resultTitle.focus({ preventScroll: true });
    results.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function readFields() { return Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])); }
  function useFields(values) { for (const [key, input] of Object.entries(fields)) input.value = values[key] || ''; }
  function run() {
    const result = decodeProfile(readFields());
    if (result.errors.length) { showErrors(result.errors); return; }
    useFields(result.fields);
    render(result);
  }
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  for (const input of Object.values(fields)) input.addEventListener('input', () => {
    resetErrors();
    emptyOutput('Dane zmienione. Kliknij „Dekoduj profil”, aby odświeżyć opis.');
  });
  importButton.addEventListener('click', () => {
    const extracted = extractMapData(paste.value);
    if (extracted.errors.length) { showErrors(extracted.errors, true); return; }
    const result = decodeProfile(extracted.fields);
    if (result.errors.length) { showErrors(result.errors, true); return; }
    useFields(result.fields);
    render(result);
  });
  example.addEventListener('click', () => { useFields(EXAMPLE); run(); });
  clear.addEventListener('click', () => {
    useFields({});
    paste.value = '';
    resetErrors();
    emptyOutput();
    status.textContent = 'Wyczyszczono profil.';
    fields.uwp.focus();
  });
  copy.addEventListener('click', async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(formatProfile(current)); notify('Opis świata skopiowany.'); }
    catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj opis.'); }
  });
  emptyOutput();
}
