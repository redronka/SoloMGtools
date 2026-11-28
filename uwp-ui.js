import { el, action, notify, headingPicker } from './ui.js?v=4';
import { sessionResults } from './session-results.js';
import { decodeProfile, extractMapData, formatProfile, getPreviewValues, getPreviewValue, previewMetric } from './uwp.js?v=8';
import { FULL_EXAMPLE_PASTE, extractAdditionalData } from './uwp-map.js?v=4';
import { renderAdditional, renderSummary, createSummaryButton } from './uwp-summary-ui.js?v=5';
import { readProfileLink } from './uwp-share.js';
import { locationQuery, fetchWorldProfile } from './uwp-api.js';

function codeLabel(item) {
  return item.code + (item.value !== null && item.code !== String(item.value) ? ` = ${item.value}` : '');
}

function renderMetricBody(body, view) {
  body.replaceChildren(el('p', 'uwp-value', view.title));
  if (view.interpretation) {
    for (const [label, text] of [['Świat', view.interpretation.world], ['Dla przybyszów', view.interpretation.visitors]]) {
      const paragraph = el('p', 'uwp-interpretation');
      paragraph.append(el('strong', '', `${label}: `), document.createTextNode(text));
      body.append(paragraph);
    }
  } else body.append(el('p', 'uwp-description', view.description));
  if (view.restrictions) {
    const list = el('ul', 'uwp-law-list');
    for (const entry of view.restrictions) {
      const line = el('li');
      line.append(el(entry.current ? 'strong' : 'span', '', `${entry.code}${entry.current ? ' — bieżący' : ''}: ${entry.description}`));
      list.append(line);
    }
    body.append(list);
  }
  if (view.extra && (!view.interpretation || view.guideKey === 'technology')) body.append(el('p', 'uwp-extra', view.extra));
}

function createMetricCard(item, hasSummary) {
  const values = getPreviewValues(item);
  const card = el('article', `uwp-card${values.length ? ' uwp-level-card' : ''}`);
  if (item.guideKey) card.dataset.guide = item.guideKey;
  if (item.previewKey) card.dataset.parameter = item.previewKey;
  const top = el('div', 'uwp-card-top');
  const code = el('span', 'uwp-code', codeLabel(item));
  const actions = el('div', 'uwp-card-actions');
  actions.append(code);
  if (hasSummary) actions.append(createSummaryButton());
  top.append(el('h4', '', item.label), actions);
  card.append(top);
  if (item.guideKey) {
    const explanation = el('details', 'uwp-explanation');
    explanation.append(el('summary', '', 'Definicja i skala'));
    if (item.originalName) explanation.append(el('p', 'uwp-muted', `Nazwa oryginalna: ${item.originalName}.`));
    explanation.append(el('p', '', item.description), el('p', '', item.scaleDescription));
    card.append(explanation);
  }
  const body = el('div', 'uwp-level-body');
  card.append(body);
  renderMetricBody(body, item);
  if (!values.length) return card;

  const toolbar = el('div', 'uwp-level-controls');
  const categorical = ['port', 'atmosphere', 'government'].includes(item.previewKey);
  const lower = el('button', 'button uwp-step', categorical ? '← Poprzedni' : '← Niżej');
  const higher = el('button', 'button uwp-step', categorical ? 'Następny →' : 'Wyżej →');
  const reset = el('button', 'button subtle uwp-reset', 'Reset');
  for (const button of [lower, higher, reset]) button.type = 'button';
  lower.setAttribute('aria-label', `${item.label}: pokaż ${categorical ? 'poprzedni kod' : 'niższy poziom'}`);
  higher.setAttribute('aria-label', `${item.label}: pokaż ${categorical ? 'następny kod' : 'wyższy poziom'}`);
  reset.setAttribute('aria-label', `${item.label}: wróć do wartości źródłowej ${item.code}`);
  const previewStatus = el('p', 'uwp-preview-status');
  previewStatus.setAttribute('role', 'status');
  toolbar.append(lower, higher, reset);
  card.append(toolbar, previewStatus);
  const originalIndex = values.indexOf(getPreviewValue(item));
  let shownIndex = originalIndex;

  function update() {
    const view = previewMetric(item, values[shownIndex]);
    code.textContent = codeLabel(view);
    renderMetricBody(body, view);
    lower.disabled = shownIndex === 0;
    higher.disabled = shownIndex === values.length - 1;
    reset.disabled = shownIndex === originalIndex;
    previewStatus.textContent = shownIndex === originalIndex ? `Wartość z profilu: ${codeLabel(item)}` : `Podgląd: ${codeLabel(view)} · W profilu: ${codeLabel(item)}`;
    card.classList.toggle('is-preview', shownIndex !== originalIndex);
  }
  lower.addEventListener('click', () => { shownIndex = Math.max(0, shownIndex - 1); update(); });
  higher.addEventListener('click', () => { shownIndex = Math.min(values.length - 1, shownIndex + 1); update(); });
  reset.addEventListener('click', () => { shownIndex = originalIndex; update(); });
  update();
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
  intro.append(el('p', 'uwp-muted', 'Pobierz świat po sektorze i heksie albo wklej pełny opis, także własny lub zmieniony przez MG. Możesz również wpisać same kody ręcznie.'));
  const lookupForm = el('form', 'uwp-lookup');
  lookupForm.noValidate = true;
  lookupForm.append(el('h3', '', '1. Pobierz świat z Traveller Map'));
  const locationLabel = el('label', 'uwp-label', 'Sektor i heks');
  locationLabel.htmlFor = 'uwp-location';
  const locationInput = el('input', 'uwp-location-input');
  locationInput.id = locationLabel.htmlFor;
  locationInput.type = 'text';
  locationInput.placeholder = 'Spinward Marches 1920';
  locationInput.autocomplete = 'off';
  locationInput.spellcheck = false;
  const lookupButton = action('Pobierz i dekoduj', 'world', 'button primary');
  lookupButton.type = 'submit';
  const lookupControls = el('div', 'uwp-lookup-controls');
  lookupControls.append(locationInput, lookupButton);
  const locationHint = el('p', 'uwp-muted', 'Wystarczy nazwa sektora i czterocyfrowy heks. Pobrany pełny opis pojawi się poniżej — możesz go zmienić i wczytać ponownie.');
  locationHint.id = 'uwp-location-hint';
  locationInput.setAttribute('aria-describedby', locationHint.id);
  const lookupStatus = el('p', 'uwp-muted');
  lookupStatus.setAttribute('role', 'status');
  lookupForm.append(locationLabel, lookupControls, locationHint, lookupStatus);
  const importBox = el('details', 'uwp-import');
  const importTitle = el('summary', '', '2. Wklej pełne dane lub własny świat');
  const pasteLabel = el('label', 'uwp-label', 'Dane jednego świata');
  pasteLabel.htmlFor = 'uwp-paste';
  const paste = el('textarea');
  paste.id = 'uwp-paste';
  paste.rows = 5;
  paste.maxLength = 60000;
  paste.placeholder = FULL_EXAMPLE_PASTE;
  paste.spellcheck = false;
  const importButton = action('Wczytaj i dekoduj', 'refresh');
  const pasteHint = el('p', 'uwp-muted', 'Pełny opis jest odczytywany lokalnie i zachowuje zmiany MG. Możesz wkleić także samo „Spinward Marches 1920”, aby pobrać dane z mapy. Lokalizacja jest potrzebna tylko do podsumowania i mapki.');
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
  const example = action('Wczytaj pełny przykład', 'refresh', 'button subtle');
  const clear = action('Wyczyść', 'refresh', 'button subtle');
  toolbar.append(decode, example, clear);
  const errors = el('div', 'uwp-errors');
  errors.id = 'uwp-errors';
  errors.hidden = true;
  errors.setAttribute('role', 'alert');
  const status = el('p', 'sr-only');
  status.setAttribute('role', 'status');
  form.append(grid, errors, toolbar);
  editor.append(editorSummary, intro, lookupForm, importBox, form);

  const results = el('div', 'uwp-results');
  const resultBar = el('div', 'uwp-result-bar');
  const resultTitle = el('h2', '', 'Odczyt profilu');
  const copy = action('Kopiuj opis', 'copy', 'button subtle');
  const markdown = headingPicker('uwp-markdown-level');
  const copyActions = el('div', 'markdown-actions');
  copyActions.append(markdown.label, copy);
  copy.disabled = true;
  resultBar.append(resultTitle, copyActions);
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
  const summaryOutput = el('div');
  const backToTop = el('button', 'button subtle uwp-back-top', 'Wróć na górę');
  backToTop.type = 'button';
  backToTop.hidden = true;
  backToTop.addEventListener('click', () => {
    const top = document.querySelector('.topbar');
    if (top) { top.tabIndex = -1; top.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  container.append(editor, status, results, notes, references, summaryOutput, backToTop);
  let current;
  let importedAdditional = null;
  let mediaController;
  let lookupController;
  let lookupRevision = 0;

  function cancelLookup() {
    lookupRevision++;
    lookupController?.abort();
    lookupController = null;
    lookupButton.disabled = false;
    lookupForm.removeAttribute('aria-busy');
    lookupStatus.textContent = '';
  }
  function useLocation(additional) {
    locationInput.value = additional?.location ? `${additional.location.sector} ${additional.location.hex}` : '';
  }

  function resetErrors() {
    errors.replaceChildren();
    errors.hidden = true;
    for (const input of [...Object.values(fields), paste, locationInput]) {
      input.removeAttribute('aria-invalid');
      const described = input.getAttribute('aria-describedby')?.replace(/\s*uwp-errors/g, '');
      if (described) input.setAttribute('aria-describedby', described);
    }
  }
  function emptyOutput(message = 'Wpisz kody powyżej, aby zobaczyć ich znaczenie.') {
    mediaController?.abort();
    current = null;
    copy.disabled = true;
    backToTop.hidden = true;
    summaryOutput.replaceChildren();
    output.replaceChildren(el('p', 'uwp-empty', message));
  }
  function showErrors(items, fromPaste = false, fromLocation = false) {
    editor.open = true;
    if (fromPaste) importBox.open = true;
    resetErrors();
    const list = el('ul');
    for (const item of items) {
      const input = fromLocation ? locationInput : fromPaste ? paste : fields[item.field];
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
    (fromLocation ? locationInput : fromPaste ? paste : fields[items[0].field]).focus();
  }
  function render(result) {
    resetErrors();
    current = result;
    const shareBaseUrl = location.href;
    sessionResults.add(level => formatProfile(result, level, shareBaseUrl));
    copy.disabled = false;
    output.replaceChildren();
    summaryOutput.replaceChildren();
    mediaController?.abort();
    mediaController = new AbortController();
    const targets = new Map();
    if (result.warnings.length) {
      const warning = el('div', 'uwp-warning');
      for (const text of result.warnings) warning.append(el('p', '', text));
      output.append(warning);
    }
    for (const [sectionIndex, section] of result.sections.entries()) {
      const block = el('section', 'uwp-section');
      block.id = `uwp-section-${sectionIndex}`;
      targets.set(`section-${sectionIndex}`, block);
      const header = el('div', 'uwp-section-header');
      header.append(el('h3', '', section.title), el('code', 'uwp-profile-code', section.code));
      if (result.summary) header.append(createSummaryButton({ showLabel: sectionIndex === 0 }));
      const cards = el('div', 'uwp-grid');
      for (const [itemIndex, item] of section.items.entries()) {
        const card = createMetricCard(item, Boolean(result.summary));
        card.id = `uwp-metric-${sectionIndex}-${itemIndex}`;
        targets.set(`metric-${sectionIndex}-${itemIndex}`, card);
        if (item.previewKey) targets.set(item.previewKey, card);
        cards.append(card);
      }
      block.append(header, cards);
      output.append(block);
    }
    const additional = renderAdditional(result, targets);
    if (additional) output.append(additional);
    if (result.summary) summaryOutput.append(renderSummary(result, targets, mediaController.signal));
    backToTop.hidden = false;
    status.textContent = `Odczytano: ${result.sections.map(section => `${section.title} ${section.code}`).join(', ')}.`;
    editor.open = false;
    resultTitle.tabIndex = -1;
    resultTitle.focus({ preventScroll: true });
    container.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function readFields() { return Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])); }
  function useFields(values) { for (const [key, input] of Object.entries(fields)) input.value = values[key] || ''; }
  function run() {
    cancelLookup();
    const result = decodeProfile(readFields(), importedAdditional);
    if (result.errors.length) { showErrors(result.errors); return; }
    useFields(result.fields);
    clearSharedHash();
    render(result);
  }
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  for (const input of Object.values(fields)) input.addEventListener('input', () => {
    cancelLookup();
    clearSharedHash();
    // Nowy UWP nie może odziedziczyć lokalizacji ani szczegółów poprzedniego świata.
    if (input === fields.uwp) importedAdditional = null;
    resetErrors();
    emptyOutput('Dane zmienione. Kliknij „Dekoduj profil”, aby odświeżyć opis.');
  });
  function importPaste() {
    if (locationQuery(paste.value)) return loadLocation(paste.value, true);
    cancelLookup();
    importedAdditional = null;
    const extracted = extractMapData(paste.value);
    if (extracted.errors.length) { showErrors(extracted.errors, true); return; }
    const result = decodeProfile(extracted.fields, extracted.additional);
    if (result.errors.length) { showErrors(result.errors, true); return; }
    importedAdditional = extracted.additional;
    useLocation(importedAdditional);
    useFields(result.fields);
    clearSharedHash();
    render(result);
    return true;
  }
  importButton.addEventListener('click', importPaste);
  lookupForm.addEventListener('submit', event => { event.preventDefault(); loadLocation(locationInput.value); });
  locationInput.addEventListener('input', () => { cancelLookup(); resetErrors(); });
  paste.addEventListener('input', () => {
    cancelLookup();
    importedAdditional = null;
    clearSharedHash();
    resetErrors();
    emptyOutput('Dane zmienione. Kliknij „Wczytaj i dekoduj”, aby odświeżyć opis.');
  });
  async function loadLocation(value, fromPaste = false) {
    cancelLookup();
    resetErrors();
    const query = locationQuery(value);
    if (!query) {
      showErrors([{ field: 'uwp', message: 'Podaj nazwę sektora i czterocyfrowy heks, np. Spinward Marches 1920 (kolumny 01–32, wiersze 01–40).' }], fromPaste, !fromPaste);
      return;
    }
    const revision = lookupRevision;
    const controller = new AbortController();
    lookupController = controller;
    lookupButton.disabled = true;
    lookupForm.setAttribute('aria-busy', 'true');
    lookupStatus.textContent = `Pobieranie danych: ${query.sector} ${query.hex}…`;
    emptyOutput('Pobieranie pełnego opisu świata z Traveller Map…');
    try {
      const { source, result } = await fetchWorldProfile(query, { signal: controller.signal });
      if (controller.signal.aborted || revision !== lookupRevision) return;
      paste.value = source;
      importedAdditional = result.additional;
      useLocation(importedAdditional);
      useFields(result.fields);
      clearSharedHash();
      render(result);
      notify('Pobrano pełny opis świata. Możesz zmienić dane w opcji 2 i wczytać je ponownie.');
    } catch (error) {
      if (controller.signal.aborted || revision !== lookupRevision) return;
      showErrors([{ field: 'uwp', message: error.message }], fromPaste, !fromPaste);
    } finally {
      if (revision === lookupRevision) {
        lookupController = null;
        lookupButton.disabled = false;
        lookupForm.removeAttribute('aria-busy');
        lookupStatus.textContent = '';
      }
    }
  }
  example.addEventListener('click', () => {
    paste.value = FULL_EXAMPLE_PASTE;
    if (importPaste()) notify('Wczytano pełny przykład Spinward Marches 1920: profil, dane dodatkowe i podsumowanie.');
  });
  clear.addEventListener('click', () => {
    cancelLookup();
    clearSharedHash();
    importedAdditional = null;
    locationInput.value = '';
    useFields({});
    paste.value = '';
    resetErrors();
    emptyOutput();
    status.textContent = 'Wyczyszczono profil.';
    fields.uwp.focus();
  });
  copy.addEventListener('click', async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(formatProfile(current, markdown.select.value, location.href)); notify('Opis świata z linkiem skopiowany jako Markdown.'); }
    catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj opis.'); }
  });
  function clearSharedHash() {
    if (location.hash.startsWith('#uwp?')) history.replaceState(null, '', `${location.pathname}${location.search}#uwp`);
  }
  function restoreLink() {
    let state;
    try { state = readProfileLink(location.hash); }
    catch (error) { showErrors([{ field: 'uwp', message: error.message }], true); return; }
    if (!state) return;
    cancelLookup();
    const additional = state.text ? extractAdditionalData(state.text) : null;
    const result = decodeProfile(state.fields, additional);
    if (result.errors.length) { showErrors(result.errors); return; }
    paste.value = state.text;
    importedAdditional = additional;
    useLocation(additional);
    useFields(result.fields);
    render(result);
  }
  emptyOutput();
  window.addEventListener('hashchange', restoreLink);
  restoreLink();
}
