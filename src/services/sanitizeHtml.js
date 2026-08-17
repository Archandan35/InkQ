import DOMPurify from 'dompurify';

const SCRIPTABLE_DATA_PREFIXES = [
  'data:image/svg+xml',
  'data:image/svg',
  'data:text/html',
  'data:application/xhtml',
  'data:application/xml',
];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (!node.getAttribute) return;
  for (const attr of ['src', 'href', 'xlink:href', 'poster', 'background']) {
    const value = node.getAttribute(attr);
    if (value && SCRIPTABLE_DATA_PREFIXES.some((p) => value.trim().toLowerCase().startsWith(p))) {
      node.removeAttribute(attr);
    }
  }
});

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(String(html || ''), { USE_PROFILES: { html: true } });
}
