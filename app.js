import { FIELD_LABELS, FIELDS, pickPair, generateResult, validateData } from './generator.js?v=2';
import { icon, el, action, notify } from './ui.js?v=3';
import { initPlanets } from './planet-ui.js?v=4';
import { initUwp } from './uwp-ui.js?v=3';
import { initGenerators } from './generators-ui.js?v=4';

function createCategory(category, labels) {
  let result;
  const section = el('section', 'category');
  section.id = category.id_code;
  section.setAttribute('aria-labelledby', `${category.id_code}-title`);
  const header = el('div', 'category-header');
  const emblem = el('span', 'category-icon');
  emblem.innerHTML = icon(category.id_code);
  const titleGroup = el('div', 'category-title');
  const titleLine = el('div', 'title-line');
  const title = el('h2', '', category.name);
  title.id = `${category.id_code}-title`;
  titleLine.append(title, el('span', 'count', `${category.tag_table.length} tagów`));
  titleGroup.append(titleLine);
  const rollButton = action('Losuj dwa tagi', 'dice', 'button primary');
  rollButton.setAttribute('aria-label', `Losuj dwa tagi — ${category.name}`);
  header.append(emblem, titleGroup, rollButton);

  const controls = el('div', 'controls');
  const selects = [0, 1].map(index => {
    const group = el('div', 'select-group');
    const label = el('label', `tag-label tag-${index + 1}`, `TAG ${index + 1}`);
    const select = el('select');
    select.id = `${category.id_code}-tag-${index + 1}`;
    label.htmlFor = select.id;
    select.append(new Option('Wybierz tag…', ''));
    category.tag_table.forEach(tag => select.append(new Option(`${tag.number}. ${tag.name}`, tag.id_code)));
    group.append(label, select);
    return { group, select };
  });
  controls.append(selects[0].group, el('span', 'pair-plus', '+'), selects[1].group);
  const output = el('div', 'output');
  const status = el('p', 'sr-only');
  status.setAttribute('role', 'status');
  section.append(header, controls, status, output);

  function syncOptions() {
    selects.forEach(({ select }, i) => {
      for (const option of select.options) option.disabled = Boolean(option.value && option.value === selects[1 - i].select.value);
    });
  }
  function render() {
    output.replaceChildren();
    const descriptions = el('div', 'descriptions');
    result.tags.forEach((tag, index) => {
      const card = el('details', `tag-card tag-${index + 1}`);
      card.open = window.matchMedia('(min-width: 701px)').matches;
      const summary = el('summary');
      summary.append(el('span', 'tag-label', `TAG ${index + 1} · ${tag.number}`), el('span', 'tag-name', tag.name));
      card.append(summary, el('p', '', tag.description));
      descriptions.append(card);
    });
    const table = el('div', 'result-table');
    table.setAttribute('role', 'table');
    table.setAttribute('aria-label', `Inspiracje — ${category.name}`);
    const tableHeader = el('div', 'result-row result-header');
    tableHeader.setAttribute('role', 'row');
    ['INSPIRACJE', ...result.tags.map(tag => tag.name)].forEach((label, i) => {
      const cell = el('div', i ? `tag-${i}` : '', label);
      cell.setAttribute('role', 'columnheader');
      tableHeader.append(cell);
    });
    table.append(tableHeader);
    for (const field of FIELDS) {
      const row = el('div', 'result-row');
      row.setAttribute('role', 'row');
      const name = el('div', 'field-name', labels[field]);
      name.setAttribute('role', 'rowheader');
      name.append(el('small', '', field));
      row.append(name);
      result.entries[field].forEach((entry, i) => {
        const cell = el('div', `entry entry-${i + 1}`);
        cell.setAttribute('role', 'cell');
        cell.dataset.tag = `Tag ${i + 1}`;
        const picker = el('div', 'entry-picker');
        const value = el('span', 'entry-value', entry);
        value.setAttribute('aria-hidden', 'true');
        const select = el('select', 'entry-select');
        select.setAttribute('aria-label', `${labels[field]} — Tag ${i + 1}: ${result.tags[i].name}`);
        result.tags[i][field].options.forEach(item => select.append(new Option(item, item)));
        select.value = entry;
        select.addEventListener('change', () => {
          result.entries[field][i] = select.value;
          value.textContent = select.value;
          status.textContent = `${labels[field]}, tag ${i + 1}: ${select.value}`;
        });
        picker.append(value, select);
        cell.append(picker);
        row.append(cell);
      });
      table.append(row);
    }
    const toolbar = el('div', 'result-toolbar');
    const actions = el('div', 'result-actions');
    const reroll = action('Losuj inspiracje', 'refresh', 'button subtle');
    reroll.title = 'Zachowaj tagi i ponownie wylosuj ich propozycje';
    reroll.addEventListener('click', () => {
      result = generateResult(category, result.tags.map(tag => tag.id_code));
      render();
      status.textContent = 'Wylosowano nowe inspiracje dla wybranych tagów.';
    });
    const copy = action('Kopiuj zestaw', 'copy', 'button subtle');
    copy.addEventListener('click', async () => {
      const text = [category.name, '', ...result.tags.map((tag, i) => `TAG ${i + 1}: ${tag.name}\n${tag.description}`), '', ...FIELDS.map(field => `${labels[field]}:\n1. ${result.entries[field][0]}\n2. ${result.entries[field][1]}`)].join('\n\n');
      try { await navigator.clipboard.writeText(text); notify('Zestaw skopiowany.'); }
      catch { notify('Schowek jest niedostępny. Zaznacz i skopiuj tekst zestawu.'); }
    });
    actions.append(reroll, copy);
    toolbar.append(actions);
    output.append(descriptions, table, toolbar);
  }
  function usePair(ids) {
    selects.forEach(({ select }, i) => { select.value = ids[i]; });
    syncOptions();
    result = generateResult(category, ids);
    render();
    status.textContent = `Wybrane tagi: ${result.tags.map(tag => tag.name).join(' i ')}. Wylosowano po dwie propozycje dla każdej podkategorii.`;
  }
  rollButton.addEventListener('click', () => usePair(pickPair(category)));
  selects.forEach(({ select }) => select.addEventListener('change', () => {
    syncOptions();
    const ids = selects.map(item => item.select.value);
    if (ids.every(Boolean)) usePair(ids);
    else {
      result = undefined;
      output.replaceChildren();
      status.textContent = 'Wybierz dwa tagi, aby wygenerować zestaw.';
    }
  }));
  return section;
}

async function initTags(container) {
  const response = await fetch('./data/WN_TAGS_PL_v2.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = validateData(await response.json());
  const nav = document.querySelector('#category-nav');
  nav.replaceChildren();
  for (const category of data.categories) {
    const link = el('a', 'nav-link');
    link.href = `#${category.id_code}`;
    link.innerHTML = icon(category.id_code);
    link.append(el('span', '', category.name.replace('Tagi ', '')), el('small', '', category.tag_table.length));
    nav.append(link);
    container.append(createCategory(category, FIELD_LABELS));
  }
  const links = [...nav.querySelectorAll('a')];
  function activate(id) {
    links.forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  activate(data.categories[0].id_code);
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    if (visible.length) activate(visible[0].target.id);
  }, { rootMargin: '-10% 0px -60% 0px' });
  container.querySelectorAll('section').forEach(section => observer.observe(section));
  const target = [...container.querySelectorAll('section')].find(section => `#${section.id}` === location.hash);
  if (target && !container.hidden) target.scrollIntoView();
}

// Nowe generatory dodajemy jako kolejne pozycje rejestru z własną funkcją init.
const generators = [
  { id: 'tags', label: 'Tagi', title: 'Generator tagów', edition: 'WN-TAGS · PL', icon: 'dice', init: initTags },
  { id: 'planets', label: 'Nazwy planet', title: 'Generator nazw planet', edition: 'TRAVELLER', icon: 'world', init: initPlanets },
  { id: 'uwp', label: 'Dekoder UWP', title: 'Dekoder UWP', edition: 'TRAVELLER · PL', icon: 'world', init: initUwp },
  { id: 'wn-generators', label: 'Generators', title: 'Generators', edition: '', icon: 'dice', init: initGenerators },
];
const generatorNav = document.querySelector('#generator-nav');
let activeGenerator;

async function loadGenerator(generator) {
  const loading = el('p', 'loading', 'Wczytywanie biblioteki…');
  loading.setAttribute('role', 'status');
  generator.panel.replaceChildren(loading);
  try {
    await generator.init(generator.panel);
    loading.remove();
  } catch (error) {
    loading.classList.add('load-error');
    loading.textContent = 'Nie udało się wczytać biblioteki. Sprawdź połączenie i spróbuj ponownie.';
    const retry = action('Spróbuj ponownie', 'refresh');
    retry.addEventListener('click', () => { generator.ready = loadGenerator(generator); });
    loading.append(retry);
    console.error(`Błąd generatora ${generator.id}:`, error);
  }
}

function selectGenerator() {
  const generator = (location.hash === '#generators' && activeGenerator) ||
    generators.find(item => `#${item.id}` === location.hash) || generators[0];
  const changed = activeGenerator && activeGenerator !== generator;
  activeGenerator = generator;
  for (const item of generators) {
    item.panel.hidden = item !== generator;
    if (item === generator) item.link.setAttribute('aria-current', 'page');
    else item.link.removeAttribute('aria-current');
  }
  document.querySelector('#tag-navigation').hidden = generator.id !== 'tags';
  document.querySelector('#generator-title').textContent = generator.title;
  document.querySelector('#generator-edition').textContent = generator.edition;
  document.querySelector('#generator-credit').textContent = 'Dane: WN-TAGS · PL';
  document.querySelector('#generator-credit').hidden = generator.id !== 'tags';
  if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
  generator.ready ??= loadGenerator(generator);
}

for (const generator of generators) {
  generator.panel = document.querySelector(`#${generator.id}-panel`);
  generator.link = el('a', 'nav-link generator-link');
  generator.link.href = `#${generator.id}`;
  generator.link.innerHTML = icon(generator.icon);
  generator.link.append(el('span', '', generator.label));
  generatorNav.append(generator.link);
}
window.addEventListener('hashchange', selectGenerator);
selectGenerator();
