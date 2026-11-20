import { readFile, writeFile } from 'node:fs/promises';
import { FIELDS, validateData } from '../generator.js';

const source = new URL('../data/WN_TAGS_PL.json', import.meta.url);
const target = new URL('../data/WN_TAGS_PL_v2.json', import.meta.url);
const original = JSON.parse(await readFile(source, 'utf8'));
const data = {
  schema_version: 2,
  categories: original.categories.map(category => ({
    id_code: category.id,
    name: category.name,
    tag_table: category.tags.map((tag, index) => ({
      number: index + 1,
      id_code: tag.id,
      name: tag.name,
    })),
    tags: Object.fromEntries(category.tags.map(tag => [tag.id, {
      description: tag.description,
      ...Object.fromEntries(FIELDS.map(field => [field, { options: tag[field] }])),
    }])),
  })),
};

validateData(data);
await writeFile(target, JSON.stringify(data, null, 2) + '\n');
console.log('Utworzono data/WN_TAGS_PL_v2.json');
