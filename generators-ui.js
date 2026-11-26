import { createGeneratorLibrary, generateSet, updateChoice, rerollSet, rowText, rowDescription, plainText, formatGeneratorSet } from './generators.js?v=4';
import { el, action, notify } from './ui.js?v=3';

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
    select.id = `wn-${encodeURIComponent(node.key)}`;
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

function createCard(library, generator) {
  let result;
  const nameResults = new Map();
  const names = generator.category_id === 'names';
  const card = el('section', 'wn-card');
  card.setAttribute('aria-labelledby', `wn-${generator.id}-title`);
  const header = el('div', 'wn-card-header');
  const heading = el('h3');
  heading.id = `wn-${generator.id}-title`;
  const roll = action(generator.name_pl, 'dice', 'button wn-roll');
  roll.setAttribute('aria-label', `Losuj — ${generator.name_pl}`);
  if (names) heading.textContent = generator.name_pl;
  else heading.append(roll);
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
      await navigator.clipboard.writeText(formatGeneratorSet(library, result));
      notify('Zestaw skopiowany.');
    } catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj wyniki.'); }
  });
  toolbar.append(copy);
  function refresh() {
    renderSet(library, result, output, (key, value) => {
      try {
        if (names) {
          const entry = [...nameResults].find(([, single]) => single.tree.children[0].key === key);
          nameResults.set(entry[0], updateChoice(library, entry[1], key, value));
          mergeNames();
        } else result = updateChoice(library, result, key, value);
        refresh();
        status.textContent = 'Zmieniono wynik.';
      } catch (error) { notify(error.message); }
    });
    toolbar.hidden = false;
  }
  function mergeNames() {
    result = { generatorId: generator.id, tree: { kind: 'generator', generatorId: generator.id, children: generator.table_ids.flatMap(id => nameResults.get(id)?.tree.children || []) } };
  }
  if (names) {
    const buttons = el('div', 'wn-name-actions');
    for (const id of generator.table_ids) {
      const button = action(library.tables.get(id).name_pl, 'dice', 'button');
      button.setAttribute('aria-label', `Losuj — ${generator.name_pl}: ${library.tables.get(id).name_pl}`);
      button.addEventListener('click', () => {
        nameResults.set(id, generateSet(library, generator.id, { tableId: id }));
        mergeNames();
        refresh();
        status.textContent = `Wylosowano: ${library.tables.get(id).name_pl}.`;
      });
      buttons.append(button);
    }
    card.append(buttons);
  } else {
    roll.addEventListener('click', () => {
      try {
        result = result ? rerollSet(library, result) : generateSet(library, generator.id);
        refresh();
        status.textContent = `Wylosowano: ${generator.name_pl}.`;
      } catch (error) { notify(error.message); }
    });
  }
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
    for (const id of category.generator_ids) panel.append(createCard(library, library.generators.get(id)));
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
