import { el, icon } from './ui.js?v=5';
import { worldPlanetUrl } from './uwp-map.js?v=4';

export function createSummaryButton({ showLabel = false } = {}) {
  const button = el('button', `uwp-summary-jump${showLabel ? ' has-label' : ''}`);
  button.type = 'button';
  button.innerHTML = icon('summary');
  if (showLabel) button.append(el('span', '', 'Podsumowanie'));
  button.title = 'Przejdź do podsumowania świata';
  button.setAttribute('aria-label', 'Podsumowanie');
  button.setAttribute('aria-controls', 'uwp-summary');
  button.addEventListener('click', () => scrollToDetail(document.getElementById('uwp-summary')));
  return button;
}

export function scrollToDetail(target) {
  if (!target) return;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function detailButton(text, target, className) {
  const button = el('button', className, text);
  button.type = 'button';
  button.setAttribute('aria-label', `${text}. Przejdź do szczegółowego opisu`);
  button.addEventListener('click', () => scrollToDetail(target));
  return button;
}

export function renderAdditional(result, targets) {
  const data = result.additional;
  if (!data || (!data.items.length && !data.remarks.length && !data.rawRemarks)) return null;
  const section = el('section', 'uwp-section uwp-additional');
  section.append(el('h3', '', 'Dane dodatkowe'));
  const list = el('dl', 'uwp-facts');
  for (const item of data.items) {
    const row = el('div', 'uwp-fact');
    row.id = `uwp-additional-${item.key}`;
    const label = el('dt');
    label.append(el('span', '', item.label));
    if (result.summary) label.append(createSummaryButton());
    row.append(label, el('dd', '', item.value));
    targets.set(`additional-${item.key}`, row);
    list.append(row);
  }
  section.append(list);
  if (data.remarks.length) {
    section.append(el('h4', '', 'Oznaczenia świata'));
    const tags = el('div', 'uwp-remark-details');
    for (const item of data.remarks) {
      const card = el('article', 'uwp-card');
      card.id = `uwp-remark-${item.code}`;
      const top = el('div', 'uwp-card-top');
      const actions = el('div', 'uwp-card-actions');
      actions.append(el('span', 'uwp-code', item.code));
      if (result.summary) actions.append(createSummaryButton());
      top.append(el('h4', '', item.title), actions);
      card.append(top, el('p', '', item.description));
      if (item.parameter && targets.has(item.parameter)) card.append(detailButton('Zobacz parametr UWP', targets.get(item.parameter), 'uwp-text-link'));
      targets.set(`remark-${item.code}`, card);
      tags.append(card);
    }
    section.append(tags);
  } else if (data.rawRemarks) section.append(el('p', '', `Uwagi źródłowe: ${data.rawRemarks}`));
  return section;
}

export function renderSummary(result, targets, signal) {
  const { location } = result.summary;
  const section = el('section', 'uwp-summary');
  section.id = 'uwp-summary';
  section.setAttribute('aria-labelledby', 'uwp-summary-title');
  const header = el('header', 'uwp-summary-header');
  const identity = el('div');
  identity.append(el('p', 'uwp-eyebrow', 'Podsumowanie świata'));
  const title = el('h2', '', location.name || `${location.sector} ${location.hex}`);
  title.id = 'uwp-summary-title';
  identity.append(title, el('p', 'uwp-summary-location', `${location.subsector ? `Podsektor ${location.subsector} · ` : ''}${location.sector} · heks ${location.hex}`));
  header.append(identity);
  if (result.fields.uwp) header.append(detailButton(result.fields.uwp, targets.get('section-0'), 'uwp-profile-code uwp-summary-code'));
  section.append(header, el('p', 'uwp-summary-hint', 'Kliknij parametr lub oznaczenie, aby przejść do pełnego opisu powyżej.'));
  const content = el('div', 'uwp-summary-content');
  const planet = el('figure', 'uwp-planet-image');
  const image = el('img');
  image.alt = 'Poglądowy obraz świata według UWP';
  image.width = 240;
  image.height = 240;
  image.referrerPolicy = 'no-referrer';
  const caption = el('figcaption', '', 'Grafika poglądowa według UWP — nie przedstawia potwierdzonego wyglądu świata.');
  image.addEventListener('error', () => { image.hidden = true; caption.textContent = 'Obraz świata jest obecnie niedostępny.'; });
  image.addEventListener('load', () => { image.hidden = false; });
  if (result.summary.planetImage) image.src = result.summary.planetImage;
  else { image.hidden = true; caption.textContent = 'Brak danych do dobrania obrazu świata.'; }
  planet.append(image, caption);
  content.append(planet);
  const facts = el('div', 'uwp-summary-facts');
  for (const item of result.additional.items) {
    const button = detailButton(`${item.label}: ${item.value}`, targets.get(`additional-${item.key}`), 'uwp-summary-fact');
    button.replaceChildren(el('span', '', item.label), el('strong', '', item.value));
    facts.append(button);
  }
  content.append(facts);
  section.append(content);
  const groups = el('div', 'uwp-summary-groups');
  result.sections.forEach((group, index) => {
    const block = el('section', 'uwp-summary-group');
    const heading = el('h3');
    heading.append(detailButton(`${group.title} · ${group.code}`, targets.get(`section-${index}`), 'uwp-text-link'));
    block.append(heading);
    const grid = el('div', 'uwp-summary-metrics');
    group.items.forEach((item, itemIndex) => {
      const button = detailButton(`${item.label}: ${item.title}`, targets.get(`metric-${index}-${itemIndex}`), 'uwp-summary-metric');
      button.replaceChildren(el('span', '', item.label), el('strong', '', item.code), el('span', 'uwp-summary-metric-title', item.title));
      grid.append(button);
    });
    block.append(grid);
    groups.append(block);
  });
  section.append(groups);
  if (result.additional.remarks.length) {
    const tags = el('div', 'uwp-summary-tags');
    tags.setAttribute('aria-label', 'Oznaczenia świata — przejdź do opisu');
    for (const item of result.additional.remarks) tags.append(detailButton(`${item.code} · ${item.title}`, targets.get(`remark-${item.code}`), 'uwp-summary-tag'));
    section.append(tags);
  }
  // Mapa pozostaje ostatnim elementem merytorycznym widoku.
  const map = el('figure', 'uwp-summary-map');
  map.append(el('figcaption', '', 'Mapa okolicy · zasięg J-2 (2 parseki)'));
  const mapImage = el('img');
  mapImage.src = result.summary.mapImage;
  mapImage.alt = `Mapa okolicy ${location.sector} ${location.hex}, zasięg dwóch parseków`;
  mapImage.loading = 'lazy';
  mapImage.referrerPolicy = 'no-referrer';
  const failure = el('p', 'uwp-muted', 'Nie udało się wczytać mapy. Sprawdź połączenie z internetem lub otwórz obraz mapy.');
  failure.hidden = true;
  mapImage.addEventListener('error', () => { mapImage.hidden = true; failure.hidden = false; });
  const mapLink = el('a', 'uwp-text-link', 'Otwórz obraz mapy');
  mapLink.href = result.summary.mapImage;
  mapLink.target = '_blank';
  mapLink.rel = 'noopener noreferrer';
  map.append(mapImage, failure, mapLink, el('p', 'uwp-muted', 'Mapa i obrazy: Traveller Map. Wymagają połączenia z internetem.'));
  section.append(map);
  loadWorldImage(result, image, caption, signal);
  return section;
}

async function loadWorldImage(result, image, caption, signal) {
  const { location } = result.summary;
  const query = new URLSearchParams({ sector: location.sector, hex: location.hex, jump: '0' });
  try {
    const response = await fetch(`https://travellermap.com/api/jumpworlds?${query}`, { signal, referrerPolicy: 'no-referrer' });
    if (!response.ok) return;
    const data = await response.json();
    const world = data.Worlds?.find(world => world.Hex === location.hex && world.UWP === result.fields.uwp);
    if (!world?.SectorAbbreviation || signal.aborted) return;
    const url = worldPlanetUrl(world.SectorAbbreviation, location.hex);
    const candidate = new Image();
    candidate.referrerPolicy = 'no-referrer';
    candidate.onload = () => {
      if (signal.aborted) return;
      result.summary.planetImage = url;
      result.summary.planetIsGeneric = false;
      image.src = url;
      image.alt = 'Obraz świata z Traveller Map';
      image.hidden = false;
      caption.textContent = 'Obraz świata: Traveller Map.';
    };
    candidate.onerror = () => {}; // Nie wszystkie światy mają dedykowaną grafikę.
    candidate.src = url;
  } catch { /* Wklejone dane i grafika poglądowa pozostają niezależne od API. */ }
}
