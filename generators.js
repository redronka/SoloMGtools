import { FIELD_LABELS, FIELDS } from './generator.js?v=2';
import { heading, startLevel } from './markdown.js';

export function plainText(text) {
  return String(text).replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
}

export function rowText(table, row) {
  return table.columns.filter(column => column.id !== 'description')
    .map(column => row.cells[column.id]).filter(Boolean).join(' · ');
}

export function rowDescription(library, row) {
  return row.cells.description || library.records.get(row.record_id)?.description_pl || '';
}

export function rollTable(table, rng = Math.random, notation = table.dice.notation) {
  const die = sides => 1 + Math.floor(rng() * sides);
  if (table.dice.method === 'nested') {
    const rolls = table.dice.components.map(component => die(Number(component.notation.slice(1))));
    const row = table.rows.find(item => item.first_roll === rolls[0] && item.second_roll === rolls[1]);
    if (!row) throw new Error(`Brak wyniku: ${table.id}.`);
    return { rowId: row.id, roll: rolls };
  }
  const match = /^(?:(\d+))?d(\d+)$/.exec(notation);
  if (!match) throw new Error(`Nieprawidłowa kość: ${notation}.`);
  let roll = 0;
  for (let i = 0; i < Number(match[1] || 1); i++) roll += die(Number(match[2]));
  const row = table.rows.find(item => item.roll.min <= roll && roll <= item.roll.max);
  if (!row) throw new Error(`Brak wyniku: ${table.id}.`);
  return { rowId: row.id, roll };
}

export function createGeneratorLibrary(data, tagsData) {
  const index = (items, kind) => {
    if (!Array.isArray(items) || !items.length) throw new Error(`Brak danych: ${kind}.`);
    const map = new Map();
    for (const item of items) {
      if (!item.id || map.has(item.id)) throw new Error(`Nieprawidłowy identyfikator: ${kind}.`);
      map.set(item.id, item);
    }
    return map;
  };
  const library = {
    categories: [],
    generators: index(data.generators, 'generators'),
    tables: index(data.tables, 'tables'),
    records: index(data.records, 'records'),
  };
  index(data.categories, 'categories');
  const categoryGroups = [
    { id: 'missions', name_pl: 'Misje', source_ids: ['cyberpunk-missions', 'missions'] },
    { id: 'people', name_pl: 'Postacie', source_ids: ['one-roll-characters', 'people'] },
  ];
  for (const category of data.categories) {
    const group = categoryGroups.find(item => item.source_ids.includes(category.id));
    if (!group) library.categories.push(category);
    else if (!library.categories.some(item => item.id === group.id)) {
      library.categories.push({
        id: group.id,
        name_pl: group.name_pl,
        generator_ids: [...new Set(data.categories.filter(item => group.source_ids.includes(item.id)).flatMap(item => item.generator_ids))],
      });
    }
  }
  for (const table of data.tables) {
    const rows = index(table.rows, table.id);
    if (!table.name_pl || !table.columns?.length) throw new Error(`Niepełna tabela: ${table.id}.`);
    for (const row of rows.values()) {
      if (table.columns.some(column => typeof row.cells?.[column.id] !== 'string' || !row.cells[column.id].trim())) throw new Error(`Pusty wynik: ${row.id}.`);
      if (row.record_id && !library.records.has(row.record_id)) throw new Error(`Brak opisu: ${row.id}.`);
      for (const action of row.actions || []) {
        if (action.table_id && !library.tables.has(action.table_id)) throw new Error(`Brak tabeli: ${action.table_id}.`);
        if (action.generator_id && !library.generators.has(action.generator_id)) throw new Error(`Brak generatora: ${action.generator_id}.`);
      }
    }
    // Every possible die result must resolve to exactly one source row.
    if (table.dice.method === 'nested') {
      for (let first = 1; first <= 6; first++) for (let second = 1; second <= 6; second++) {
        if (table.rows.filter(row => row.first_roll === first && row.second_roll === second).length !== 1) throw new Error(`Niepełna tabela: ${table.id}.`);
      }
    } else {
      for (let roll = table.dice.min; roll <= table.dice.max; roll++) {
        if (table.rows.filter(row => row.roll?.min <= roll && roll <= row.roll?.max).length !== 1) throw new Error(`Niepełna tabela: ${table.id}.`);
      }
    }
  }
  for (const category of data.categories) {
    for (const id of category.generator_ids) if (!library.generators.has(id)) throw new Error(`Brak generatora: ${id}.`);
  }
  for (const generator of data.generators) {
    for (const id of generator.table_ids) if (!library.tables.has(id)) throw new Error(`Brak tabeli: ${id}.`);
    for (const step of generator.steps) {
      if (step.table_id && !library.tables.has(step.table_id)) throw new Error(`Brak tabeli: ${step.table_id}.`);
      if (step.generator_id && !library.generators.has(step.generator_id)) throw new Error(`Brak generatora: ${step.generator_id}.`);
      if (step.condition?.table_id && !library.tables.has(step.condition.table_id)) throw new Error(`Brak warunku: ${step.id}.`);
    }
  }
  const missionTags = tagsData?.categories.find(category => category.id_code === 'mission');
  if (missionTags) {
    library.missionTags = missionTags;
    const id = 'wn-tags-mission';
    library.tables.set(id, {
      id, name_pl: missionTags.name, columns: [{ id: 'result', name_pl: missionTags.name }],
      dice: { notation: `d${missionTags.tag_table.length}`, method: 'single' },
      rows: missionTags.tag_table.map((tag, i) => ({
        id: tag.id_code, roll: { min: i + 1, max: i + 1 },
        cells: { result: tag.name, description: missionTags.tags[tag.id_code].description },
      })),
    });
    for (const tag of missionTags.tag_table) for (const field of FIELDS) {
      const options = missionTags.tags[tag.id_code][field].options;
      const tableId = `${tag.id_code}-${field}`;
      library.tables.set(tableId, {
        id: tableId, name_pl: FIELD_LABELS[field], columns: [{ id: 'result', name_pl: FIELD_LABELS[field] }],
        dice: { notation: `d${options.length}`, method: 'single' },
        rows: options.map((text, i) => ({ id: `${tableId}-${i}`, roll: { min: i + 1, max: i + 1 }, cells: { result: text } })),
      });
    }
  }
  return library;
}

// Replaying with the saved choices preserves independent fields. Keys of dependent
// fields include their parent result, so changing a selector rebuilds only its branch.
export function generateSet(library, generatorId, { previous, rng = Math.random, tableId, tableIds } = {}) {
  const saved = previous?.choices || {};
  const choices = {};
  let nodeCount = 0;
  function keep(key, create) {
    choices[key] = Object.hasOwn(saved, key) ? saved[key] : create();
    return choices[key];
  }
  function choice(key, label, options, defaultValue) {
    let value = keep(key, () => defaultValue ?? options[0].value);
    if (!options.some(option => option.value === value)) value = choices[key] = options[0].value;
    return { kind: 'choice', key, label, options, value };
  }
  function tableNode(id, key, context, notation, excluded = []) {
    if (++nodeCount > 2000) throw new Error('Zbyt wiele dodatkowych rzutów. Wylosuj zestaw ponownie.');
    const table = library.tables.get(id);
    if (!table) throw new Error(`Brak tabeli: ${id}.`);
    let selection = keep(key, () => {
      if (!excluded.length) return rollTable(table, rng, notation);
      const rows = table.rows.filter(row => !excluded.includes(row.id));
      const row = rows[Math.floor(rng() * rows.length)];
      return { rowId: row.id, roll: row.roll.min };
    });
    let row = table.rows.find(item => item.id === selection.rowId && !excluded.includes(item.id));
    if (!row) {
      row = table.rows.find(item => !excluded.includes(item.id));
      selection = choices[key] = { rowId: row.id, roll: row.roll?.min };
    }
    const node = { kind: 'table', key, tableId: id, ...selection, children: [], excluded };
    context.results.set(id, { row, roll: selection.roll });
    if (id === 'wn-tags-mission') {
      for (const field of FIELDS) node.children.push(tableNode(`${row.id}-${field}`, `${key}/${row.id}/${field}`, context));
    }
    for (const [i, action] of (row.actions || []).entries()) {
      const path = `${key}/${row.id}/action-${i}`;
      if (action.probability !== undefined && !keep(`${path}/chance`, () => rng() < action.probability)) continue;
      for (let j = 0; j < (action.count || 1); j++) {
        if (action.type === 'generate') node.children.push(generatorNode(action.generator_id, `${path}/${j}`));
        if (action.type === 'roll_again') node.children.push(tableNode(action.table_id, `${path}/${j}`, context, action.dice_override));
      }
    }
    return node;
  }
  function matches(condition, context) {
    if (!condition) return true;
    if (condition.campaign && condition.campaign !== context.campaign) return false;
    if (condition.input) {
      const input = context.inputs[condition.input];
      if (condition.contains && !input?.includes(condition.contains)) return false;
      if (condition.equals && input !== condition.equals) return false;
    }
    if (condition.table_id) {
      const result = context.results.get(condition.table_id);
      if (!result) return false;
      if (condition.roll && !(result.roll >= condition.roll.min && result.roll <= condition.roll.max)) return false;
      if (condition.results && !condition.results.includes(result.roll)) return false;
    }
    return true;
  }
  function generatorNode(id, path) {
    const generator = library.generators.get(id);
    if (!generator) throw new Error(`Brak generatora: ${id}.`);
    const node = { kind: 'generator', key: path, generatorId: id, children: [] };
    const context = { results: new Map(), inputs: Object.fromEntries((generator.inputs || []).map(input => [input.id, input.default])) };
    const campaigns = generator.steps.filter(step => step.condition?.campaign);
    if (campaigns.length) {
      const selector = choice(`${path}/campaign`, generator.name_pl, campaigns.map(step => ({
        value: step.condition.campaign, label: library.tables.get(step.table_id).name_pl,
      })));
      node.children.push(selector);
      context.campaign = selector.value;
    }
    function repeatCount(repeat, key, label) {
      if (typeof repeat === 'number') return repeat;
      if (repeat?.from_table_id) return context.results.get(repeat.from_table_id)?.row[repeat.field] || 0;
      if (repeat?.min !== undefined) {
        const selector = choice(`${key}/count`, label, Array.from({ length: repeat.max - repeat.min + 1 }, (_, i) => ({ value: String(repeat.min + i), label: String(repeat.min + i) })));
        node.children.push(selector);
        return Number(selector.value);
      }
      return 1;
    }
    for (const step of generator.steps) {
      if (step.group_id || !matches(step.condition, context)) continue;
      let key = `${path}/${step.id}`;
      if (step.condition?.table_id) key += `/${context.results.get(step.condition.table_id).row.id}`;
      if (step.condition?.campaign) key += `/${context.campaign}`;
      // Optional cross-generator links are explicit controls, not extra automatic results.
      if (step.generator_id && step.optional) {
        const label = library.generators.get(step.generator_id).name_pl;
        const selector = { kind: 'toggle', key: `${key}/enabled`, label, value: keep(`${key}/enabled`, () => false) };
        node.children.push(selector);
        if (!selector.value) continue;
      }
      const label = step.generator_id ? library.generators.get(step.generator_id).name_pl : generator.name_pl;
      const count = repeatCount(step.repeat, key, label);
      const selectedTags = [];
      for (let i = 0; i < count; i++) {
        if (step.external_reference_id === 'mission-tags-external') {
          if (!library.missionTags) throw new Error('Brak biblioteki tagów misji.');
          const tag = tableNode('wn-tags-mission', `${key}/${i}`, context, undefined, selectedTags);
          selectedTags.push(tag.rowId);
          node.children.push(tag);
        } else if (step.table_id) node.children.push(tableNode(step.table_id, `${key}/${i}`, context));
        else if (step.generator_id) node.children.push(generatorNode(step.generator_id, `${key}/${i}`));
        // Row actions are resolved by tableNode, including mission-details.
      }
    }
    for (const group of generator.execution_groups || []) {
      const count = repeatCount(group.repeat, `${path}/${group.id}`, generator.name_pl);
      const countRow = context.results.get(group.repeat.from_table_id)?.row.id;
      for (let i = 0; i < count; i++) {
        const key = `${path}/${group.id}/${countRow}/${i}`;
        const selector = choice(`${key}/type`, generator.name_pl, group.step_ids.map(stepId => {
          const step = generator.steps.find(item => item.id === stepId);
          return { value: step.table_id, label: library.tables.get(step.table_id).name_pl };
        }));
        node.children.push(selector, tableNode(selector.value, `${key}/${selector.value}`, context));
      }
    }
    return node;
  }
  const selectedTables = tableIds || (tableId ? [tableId] : null);
  const tree = selectedTables
    ? { kind: 'generator', key: generatorId, generatorId, children: selectedTables.map(id => tableNode(id, `${generatorId}/${id}`, { results: new Map() })) }
    : generatorNode(generatorId, generatorId);
  return { generatorId, tableId, tableIds, choices, tree };
}

export function updateChoice(library, result, key, value, rng = Math.random) {
  const nodes = flattenNodes(result.tree);
  const node = nodes.find(item => item.key === key);
  if (!node) throw new Error('Nie znaleziono pola.');
  let selection = value;
  if (node.kind === 'table') {
    const row = library.tables.get(node.tableId).rows.find(item => item.id === value && !node.excluded.includes(item.id));
    if (!row) throw new Error('Nieprawidłowy wybór.');
    selection = { rowId: row.id, roll: row.roll?.min ?? [row.first_roll, row.second_roll] };
  } else if (node.kind === 'choice' && !node.options.some(option => option.value === value)) throw new Error('Nieprawidłowy wybór.');
  else if (node.kind === 'toggle' && typeof value !== 'boolean') throw new Error('Nieprawidłowy wybór.');
  return generateSet(library, result.generatorId, { previous: { choices: { ...result.choices, [key]: selection } }, tableId: result.tableId, tableIds: result.tableIds, rng });
}

export function rerollSet(library, result, rng = Math.random) {
  const choices = Object.fromEntries(flattenNodes(result.tree)
    .filter(node => node.kind === 'choice' || node.kind === 'toggle')
    .map(node => [node.key, result.choices[node.key]]));
  return generateSet(library, result.generatorId, { previous: { choices }, tableId: result.tableId, tableIds: result.tableIds, rng });
}

export function flattenNodes(tree) {
  return [tree, ...(tree.children || []).flatMap(flattenNodes)];
}

export function formatName(library, result) {
  return result.tree.children.filter(node => node.kind === 'table').map(node => {
    const table = library.tables.get(node.tableId);
    const row = table.rows.find(item => item.id === node.rowId);
    return plainText(rowText(table, row));
  }).join(' ');
}

export function formatNameEntry(library, result) {
  const type = result.tree.children.find(node => node.kind === 'table').tableId.split('-').at(-1);
  const labels = { male: 'Mężczyzna', female: 'Kobieta', surname: 'Nazwisko', place: 'Miejsce' };
  return `${labels[type]}: ${formatName(library, result)}`;
}

export function formatGeneratorSet(library, result, level = 2) {
  level = startLevel(level);
  function format(node, depth) {
    if (node.kind === 'generator') {
      const title = heading(level + depth, library.generators.get(node.generatorId).name_pl);
      if (library.generators.get(node.generatorId).category_id === 'names') {
        return [title, formatName(library, { tree: node })];
      }
      return [title, ...node.children.flatMap(child => format(child, depth + 1))];
    }
    if (node.kind !== 'table') return [];
    const table = library.tables.get(node.tableId);
    const row = table.rows.find(item => item.id === node.rowId);
    const description = rowDescription(library, row);
    return [heading(level + depth, table.name_pl), rowText(table, row), ...(description ? [description] : []), ...node.children.flatMap(child => format(child, depth + 1))];
  }
  return format(result.tree, 0).join('\n\n');
}
