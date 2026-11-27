import { heading, startLevel } from './markdown.js';

export function createSessionResults() {
  const entries = [];
  const listeners = new Set();
  const emit = () => listeners.forEach(listener => listener(entries.length));
  return {
    add(format, { groupKey, title } = {}) {
      const entry = { format, groupKey, title };
      entries.push(entry);
      emit();
      return updatedFormat => { entry.format = updatedFormat; emit(); };
    },
    format(level = 2) {
      level = startLevel(level);
      const groups = new Map();
      const blocks = [];
      for (const entry of entries) {
        if (!entry.groupKey) blocks.push([entry]);
        else {
          if (!groups.has(entry.groupKey)) {
            const group = [];
            groups.set(entry.groupKey, group);
            blocks.push(group);
          }
          groups.get(entry.groupKey).push(entry);
        }
      }
      return blocks.map(block => block[0].groupKey
        ? `${heading(level, block[0].title)}\n\n${block.map(entry => entry.format(level)).filter(Boolean).join('\n')}`
        : block[0].format(level)).filter(Boolean).join('\n\n');
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(entries.length);
      return () => listeners.delete(listener);
    },
  };
}

// Shared by all tools, in memory only: refreshing the page starts a new session.
export const sessionResults = createSessionResults();
