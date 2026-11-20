import { FIELDS, pickPair, generateResult, validateData } from './generator.js';

const icons = {
  world: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  mission: '<path d="m14 3 7 7-11 11H3v-7L14 3Z"/><path d="m13 4 7 7M6 15l3 3"/>',
  enclave: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
  'encounter-site': '<path d="m3 4 6 2 6-2 6 2v15l-6-2-6 2-6-2V4ZM9 6v15M15 4v15"/>',
  community: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6M21 21v-4a6 6 0 0 0-4-5"/>',
  court: '<path d="m3 6 5 5 4-7 4 7 5-5-2 13H5L3 6ZM5 22h14"/>',
  ruin: '<path d="M4 21V7l5-3v8h6V4l5 3v14M2 21h20M9 21v-5h6v5"/>',
  wilderness: '<path d="m12 2-7 9h4l-6 8h7v3h4v-3h7l-6-8h4L12 2Z"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 3M4 16l2 3a8 8 0 0 0 13-2"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.dice}</svg>`; }
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function action(label, iconName, className = 'button') {
  const button = el('button', className);
  button.type = 'button';
  button.innerHTML = icon(iconName);
  button.append(document.createTextNode(label));
  return button;
}
let toastTimer;
function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function createCategory(category, labels) {
  let result;
  const section = el('section', 'category');
  section.id = category.id;
  section.setAttribute('aria-labelledby', `${category.id}-title`);
  const header = el('div', 'category-header');
  const emblem = el('span', 'category-icon');
  emblem.innerHTML = icon(category.id);
  const titleGroup = el('div', 'category-title');
  const titleLine = el('div', 'title-line');
  const title = el('h2', '', category.name);
  title.id = `${category.id}-title`;
  titleLine.append(title, el('span', 'count', `${category.tags.length} tagów`));
  titleGroup.append(titleLine);
  const rollButton = action('Losuj dwa tagi', 'dice', 'button primary');
  rollButton.setAttribute('aria-label', `Losuj dwa tagi — ${category.name}`);
  header.append(emblem, titleGroup, rollButton);

  const controls = el('div', 'controls');
  const selects = [0, 1].map(index => {
    const group = el('div', 'select-group');
    const label = el('label', `tag-label tag-${index + 1}`, `TAG ${index + 1}`);
    const select = el('select');
    select.id = `${category.id}-tag-${index + 1}`;
    label.htmlFor = select.id;
    select.append(new Option('Wybierz tag…', ''));
    category.tags.forEach((tag, i) => select.append(new Option(`${i + 1}. ${tag.name}`, tag.id)));
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
      summary.append(el('span', 'tag-label', `TAG ${index + 1} · ${category.tags.indexOf(tag) + 1}`), el('span', 'tag-name', tag.name));
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
        result.tags[i][field].forEach(item => select.append(new Option(item, item)));
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
      result = generateResult(category, result.tags.map(tag => tag.id));
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
  if (category.id === 'world') usePair(['world-abandoned-colony', 'world-minimal-contact']);
  return section;
}

async function init() {
  const loading = document.querySelector('#loading');
  try {
    const response = await fetch('./data/WN_TAGS_PL.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = validateData(await response.json());
    const nav = document.querySelector('#category-nav');
    const container = document.querySelector('#categories');
    for (const category of data.categories) {
      const link = el('a', 'nav-link');
      link.href = `#${category.id}`;
      link.innerHTML = icon(category.id);
      link.append(el('span', '', category.name.replace('Tagi ', '')), el('small', '', category.tags.length));
      nav.append(link);
      container.append(createCategory(category, data.field_labels));
    }
    loading.remove();
    const links = [...nav.querySelectorAll('a')];
    function activate(id) {
      links.forEach(link => {
        if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    activate(data.categories[0].id);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length) activate(visible[0].target.id);
    }, { rootMargin: '-10% 0px -60% 0px' });
    container.querySelectorAll('section').forEach(section => observer.observe(section));
  } catch (error) {
    loading.classList.add('load-error');
    loading.textContent = 'Nie udało się wczytać biblioteki. Odśwież stronę lub sprawdź połączenie.';
    loading.append(action('Spróbuj ponownie', 'refresh'));
    loading.querySelector('button').addEventListener('click', () => location.reload());
    console.error('Błąd biblioteki tagów:', error);
  }
}
init();
