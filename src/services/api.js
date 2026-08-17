export function apiHeaders(extra = {}) {
  if (typeof document === 'undefined') return extra;
  const token = document.querySelector('meta[name="inkq-token"]')?.content;
  return token ? { ...extra, 'X-Inkq-Token': token } : extra;
}
