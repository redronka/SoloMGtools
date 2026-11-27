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
export function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.dice}</svg>`; }
export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
export function action(label, iconName, className = 'button') {
  const button = el('button', className);
  button.type = 'button';
  button.innerHTML = icon(iconName);
  button.append(document.createTextNode(label));
  return button;
}
export function headingPicker(id) {
  const label = el('label', 'markdown-level', 'Poziom nagłówków Markdown');
  label.htmlFor = id;
  const select = el('select');
  select.id = id;
  for (let level = 1; level <= 4; level++) select.append(new Option('#'.repeat(level), String(level)));
  select.value = '2';
  label.append(select);
  return { label, select };
}
let toastTimer;
export function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}
