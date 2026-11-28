const FIELDS = ['uwp', 'importance', 'economics', 'culture'];
const LINK_ERROR = 'Link do opisu świata jest niepełny lub uszkodzony. Wklej dane świata albo wczytaj przykład.';

export function createProfileLink(result, baseUrl) {
  const url = new URL(baseUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Nieprawidłowy adres strony.');
  const state = {
    v: 1,
    fields: Object.fromEntries(FIELDS.map(field => [field, result.fields[field] || ''])),
    text: result.additional?.sourceText || '',
  };
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  const token = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  url.search = '';
  url.hash = `uwp?world=${token}`;
  // Nawiasy w ścieżce hostingu nie mogą zamykać odnośnika Markdown.
  return url.href.replaceAll('(', '%28').replaceAll(')', '%29');
}

export function readProfileLink(hash) {
  if (hash.split('?')[0] !== '#uwp' || !hash.includes('?')) return null;
  const params = new URLSearchParams(hash.slice(hash.indexOf('?') + 1));
  if (!params.has('world')) return null;
  try {
    const token = params.get('world');
    if (params.getAll('world').length !== 1 || !token || token.length > 500_000 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new Error();
    const bytes = Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
    const state = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (state?.v !== 1 || !state.fields || typeof state.fields !== 'object' || Array.isArray(state.fields) ||
      typeof state.text !== 'string' || state.text.length > 60_000 ||
      !FIELDS.every(field => typeof state.fields[field] === 'string' && state.fields[field].length <= 64)) throw new Error();
    return { fields: Object.fromEntries(FIELDS.map(field => [field, state.fields[field]])), text: state.text };
  } catch { throw new Error(LINK_ERROR); }
}
