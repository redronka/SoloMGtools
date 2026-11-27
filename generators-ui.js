import { createGeneratorLibrary, generateSet, updateChoice, rerollSet, rowText, rowDescription, plainText, formatName, formatNameEntry, formatGeneratorSet } from './generators.js?v=9';
import { el, action, notify, headingPicker } from './ui.js?v=4';
import { sessionResults } from './session-results.js';

function appendText(element, text) {
  // Only source emphasis is interpreted; source HTML is always rendered as text.
  const pattern = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    element.append(document.createTextNode(text.slice(offset, match.index)));
    if (match[2]) {
      const strong = el('strong');
      strong.append(el('em', '', match[2]));
      element.append(strong);
    } else element.append(el(match[3] ? 'strong' : 'em', '', match[3] || match[4]));
    offset = match.index + match[0].length;
  }
  element.append(document.createTextNode(text.slice(offset)));
}

function description(text) {
  const details = el('details', 'wn-description');
  details.append(el('summary', '', 'Opis'));
  const body = el('div');
  for (const paragraph of text.split(/\n\s*\n/)) {
    const p = el('p');
    appendText(p, paragraph);
    body.append(p);
  }
  details.append(body);
  return details;
}

function renderSet(library, result, output, change) {
  const focusedKey = document.activeElement?.dataset.wnKey;
  const openDescriptions = new Set([...output.querySelectorAll('details[open][data-wn-key]')].map(node => node.dataset.wnKey));
  output.replaceChildren();
  function render(node, parent, isRoot = false) {
    if (node.kind === 'generator') {
      const group = isRoot ? parent : el('section', 'wn-subset');
      if (!isRoot) {
        group.append(el('h4', '', library.generators.get(node.generatorId).name_pl));
        parent.append(group);
      }
      for (const child of node.children) render(child, group);
      return;
    }
    if (node.kind === 'toggle') {
      const label = el('label', 'wn-toggle');
      const input = el('input');
      input.type = 'checkbox';
      input.checked = node.value;
      input.dataset.wnKey = node.key;
      input.addEventListener('change', () => change(node.key, input.checked));
      label.append(input, document.createTextNode(node.label));
      parent.append(label);
      return;
    }
    if (node.kind === 'choice') {
      const label = el('label', 'wn-choice');
      label.append(el('span', '', node.label));
      const select = el('select');
      select.dataset.wnKey = node.key;
      node.options.forEach(option => select.append(new Option(option.label, option.value)));
      select.value = node.value;
      select.addEventListener('change', () => change(node.key, select.value));
      label.append(select);
      parent.append(label);
      return;
    }
    const table = library.tables.get(node.tableId);
    const row = table.rows.find(item => item.id === node.rowId);
    const field = el('div', 'wn-field');
    const label = el('label', 'wn-field-label', table.name_pl);
    const picker = el('div', 'entry-picker');
    const visible = el('span', 'entry-value');
    visible.setAttribute('aria-hidden', 'true');
    appendText(visible, rowText(table, row));
    const select = el('select', 'entry-select');
    select.id = `${output.id || 'wn'}-${encodeURIComponent(node.key)}`;
    select.dataset.wnKey = node.key;
    label.htmlFor = select.id;
    select.setAttribute('aria-label', table.name_pl);
    for (const option of table.rows) {
      const item = new Option(plainText(rowText(table, option)), option.id);
      item.disabled = node.excluded.includes(option.id);
      select.append(item);
    }
    select.value = row.id;
    select.addEventListener('change', () => change(node.key, select.value));
    picker.append(visible, select);
    const value = el('div', 'wn-field-value');
    value.append(picker);
    const text = rowDescription(library, row);
    if (text) {
      const details = description(text);
      details.dataset.wnKey = `${node.key}/${node.rowId}/description`;
      details.open = openDescriptions.has(details.dataset.wnKey);
      value.append(details);
    }
    field.append(label, value);
    parent.append(field);
    if (node.children.length) {
      const children = el('div', 'wn-followups');
      node.children.forEach(child => render(child, children));
      parent.append(children);
    }
  }
  render(result.tree, output, true);
  if (focusedKey) [...output.querySelectorAll('[data-wn-key]')].find(node => node.dataset.wnKey === focusedKey)?.focus({ preventScroll: true });
}

function createNamesCard(library, generator) {
  const card = el('section', 'wn-card');
  const heading = el('h3', '', generator.name_pl);
  heading.id = `wn-${generator.id}-title`;
  card.setAttribute('aria-labelledby', heading.id);
  const header = el('div', 'wn-card-header');
  header.append(heading);
  card.append(header);
  const buttons = el('div', 'wn-name-actions');
  const output = el('div', 'wn-name-results');
  const status = el('p', 'sr-only');
  status.setAttribute('role', 'status');
  const people = [];
  const toolbar = el('div', 'wn-toolbar');
  toolbar.hidden = true;
  const copy = action('Kopiuj zestaw', 'copy', 'button subtle');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(people.map(person => formatNameEntry(library, person.result)).join('\n'));
      notify('Imiona i nazwy skopiowane.');
    } catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj wyniki.'); }
  });
  toolbar.append(copy);
  for (const id of generator.table_ids) {
    // Given-name buttons generate a complete person; places and surnames can still be rolled separately.
    const paired = /-(male|female)$/.test(id);
    const label = `${library.tables.get(id).name_pl}${paired ? ' + nazwisko' : ''}`;
    const button = action(label, 'dice', 'button');
    button.setAttribute('aria-label', `Losuj — ${generator.name_pl}: ${label}`);
    button.addEventListener('click', () => {
      try {
        const tableIds = paired ? [id, `${generator.id}-surname`] : [id];
        const person = { result: generateSet(library, generator.id, { tableIds }) };
        const row = el('div', 'wn-results wn-name-row');
        const fields = el('div', paired ? 'wn-person' : 'wn-name-fields');
        fields.id = `${generator.id}-result-${people.length + 1}`;
        const copyRow = action('', 'copy', 'button subtle wn-name-copy');
        copyRow.title = paired ? 'Kopiuj imię i nazwisko' : 'Kopiuj wynik';
        copyRow.setAttribute('aria-label', `Kopiuj wiersz ${people.length + 1} — ${generator.name_pl}`);
        copyRow.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(formatName(library, person.result));
            notify('Wiersz skopiowany.');
          } catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj wynik.'); }
        });
        row.append(fields, copyRow);
        const updateSaved = sessionResults.add(() => formatNameEntry(library, person.result), { groupKey: generator.id, title: generator.name_pl });
        function refresh() {
          renderSet(library, person.result, fields, (key, value) => {
            try {
              person.result = updateChoice(library, person.result, key, value);
              updateSaved(() => formatNameEntry(library, person.result));
              refresh();
              status.textContent = 'Zmieniono wynik.';
            } catch (error) { notify(error.message); }
          });
        }
        people.push(person);
        refresh();
        output.append(row);
        toolbar.hidden = false;
        status.textContent = `Dodano: ${label}. Wyników: ${people.length}.`;
      } catch (error) { notify(error.message); }
    });
    buttons.append(button);
  }
  card.append(buttons, status, output, toolbar);
  return card;
}

function createCard(library, generator, getLevel) {
  if (generator.category_id === 'names') return createNamesCard(library, generator);
  let result;
  let updateSaved;
  const card = el('section', 'wn-card');
  card.setAttribute('aria-labelledby', `wn-${generator.id}-title`);
  const header = el('div', 'wn-card-header');
  const heading = el('h3');
  heading.id = `wn-${generator.id}-title`;
  const roll = action(generator.name_pl, 'dice', 'button wn-roll');
  roll.setAttribute('aria-label', `Losuj — ${generator.name_pl}`);
  heading.append(roll);
  header.append(heading);
  card.append(header);
  if (generator.instructions_pl) card.append(description(generator.instructions_pl));
  const output = el('div', 'wn-results');
  const status = el('p', 'sr-only');
  status.setAttribute('role', 'status');
  const toolbar = el('div', 'wn-toolbar');
  toolbar.hidden = true;
  const copy = action('Kopiuj zestaw', 'copy', 'button subtle');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(formatGeneratorSet(library, result, getLevel()));
      notify('Zestaw skopiowany jako Markdown.');
    } catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj wyniki.'); }
  });
  toolbar.append(copy);
  function refresh() {
    renderSet(library, result, output, (key, value) => {
      try {
        result = updateChoice(library, result, key, value);
        const saved = result;
        updateSaved(level => formatGeneratorSet(library, saved, level));
        refresh();
        status.textContent = 'Zmieniono wynik.';
      } catch (error) { notify(error.message); }
    });
    toolbar.hidden = false;
  }
  roll.addEventListener('click', () => {
    try {
      result = result ? rerollSet(library, result) : generateSet(library, generator.id);
      const saved = result;
      updateSaved = sessionResults.add(level => formatGeneratorSet(library, saved, level));
      refresh();
      status.textContent = `Wylosowano: ${generator.name_pl}.`;
    } catch (error) { notify(error.message); }
  });
  card.append(status, output, toolbar);
  return card;
}

export async function initGenerators(container) {
  async function read(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  const [data, tags] = await Promise.all([read('./data/WN_GENERATORS_PL.json?v=1'), read('./data/WN_TAGS_PL_v2.json')]);
  const library = createGeneratorLibrary(data, tags);
  const exportBar = document.querySelector('#wn-export-controls');
  const markdown = headingPicker('generators-markdown-level');
  markdown.select.setAttribute('aria-label', 'Poziom nagłówków Markdown');
  markdown.select.title = 'Poziom nagłówków Markdown';
  const copyAll = action('Kopiuj wszystkie wyniki', 'copy', 'button');
  const count = el('span', 'wn-session-count');
  count.setAttribute('role', 'status');
  sessionResults.subscribe(total => {
    copyAll.disabled = total === 0;
    count.textContent = `Wyniki w historii: ${total}`;
  });
  copyAll.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sessionResults.format(markdown.select.value));
      notify('Wszystkie wyniki skopiowane jako Markdown.');
    } catch { notify('Schowek jest niedostępny. Spróbuj ponownie.'); }
  });
  exportBar.replaceChildren(count, markdown.select, copyAll);
  const categoryPicker = el('details', 'wn-category-picker');
  categoryPicker.open = true;
  const categorySummary = el('summary', '', `Kategorie: ${library.categories[0].name_pl}`);
  const navigation = el('nav', 'wn-navigation');
  navigation.setAttribute('aria-label', 'Kategorie Generators');
  categoryPicker.append(categorySummary, navigation);
  const panels = [];
  for (const category of library.categories) {
    const button = el('button', 'button wn-category', category.name_pl);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(panels.length === 0));
    const panel = el('div', 'wn-category-panel');
    panel.id = `wn-category-${category.id}`;
    button.setAttribute('aria-controls', panel.id);
    panel.hidden = panels.length !== 0;
    const title = el('h2', 'wn-category-title', category.name_pl);
    panel.append(title);
    for (const id of category.generator_ids) panel.append(createCard(library, library.generators.get(id), () => markdown.select.value));
    button.addEventListener('click', () => {
      categorySummary.textContent = `Kategorie: ${category.name_pl}`;
      for (const item of panels) {
        item.panel.hidden = item.panel !== panel;
        item.button.setAttribute('aria-pressed', String(item.panel === panel));
      }
    });
    panels.push({ panel, button });
    navigation.append(button);
  }
  container.append(categoryPicker, ...panels.map(item => item.panel));
}
