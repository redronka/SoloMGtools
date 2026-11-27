export function heading(level, text) {
  // Markdown supports six heading levels; deeper branches remain readable.
  return level <= 6 ? `${'#'.repeat(level)} ${text}` : `**${text}**`;
}

export function startLevel(value = 2) {
  const level = Number(value);
  return [1, 2, 3, 4].includes(level) ? level : 2;
}
