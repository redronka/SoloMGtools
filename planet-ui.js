import { validatePlanetData, pickPlanetName, formatPlanetName } from './planets.js?v=3';
import { el, action, notify } from './ui.js?v=4';
import { heading } from './markdown.js';
import { sessionResults } from './session-results.js';

function createPlanetType(type) {
  let name;
  const card = el('section', 'planet-card');
  card.setAttribute('aria-labelledby', `planet-${type.id}-title`);
  const header = el('div', 'planet-card-header');
  const title = el('h3', '', type.label);
  title.id = `planet-${type.id}-title`;
  header.append(title, el('span', 'count', `${type.names.length} nazw`));
  const roll = action(type.name, 'dice', 'button planet-roll');
  roll.setAttribute('aria-label', `Losuj nazwę — ${type.name}`);
  roll.title = `Losuj nazwę: ${type.label}`;

  const result = el('div', 'planet-result');
  const output = el('p', 'planet-name empty', '—');
  output.setAttribute('role', 'status');
  output.setAttribute('aria-atomic', 'true');
  const copy = action('Kopiuj', 'copy', 'button subtle planet-copy');
  copy.disabled = true;
  copy.setAttribute('aria-label', `Kopiuj nazwę i typ — ${type.name}`);
  roll.addEventListener('click', () => {
    name = pickPlanetName(type, name);
    const saved = name;
    sessionResults.add(level => `${heading(Number(level), `Planeta: ${saved}`)}\n\nTyp: ${type.name} (${type.label})`);
    output.textContent = formatPlanetName(name, type);
    output.classList.remove('empty');
    copy.disabled = false;
  });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(formatPlanetName(name, type));
      notify('Nazwa z typem skopiowana.');
    } catch {
      notify('Schowek jest niedostępny. Zaznacz i skopiuj nazwę obok przycisku.');
    }
  });
  result.append(output, copy);
  card.append(header, roll, result);
  return card;
}

export async function initPlanets(container) {
  const response = await fetch('./data/PLANET_NAMES_PL.json?v=4');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = validatePlanetData(await response.json());
  const grid = el('div', 'planet-grid');
  data.types.forEach(type => grid.append(createPlanetType(type)));
  container.append(grid);
}
