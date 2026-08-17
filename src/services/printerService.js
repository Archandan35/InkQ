import { apiHeaders } from './api.js';

const STATUS_MAP = {
  online: 'online',
  offline: 'offline',
  busy: 'busy',
  'in-progress': 'in-progress',
  printing: 'in-progress',
  scanning: 'in-progress',
  error: 'offline',
  connecting: 'connecting',
};

function normalize(data) {
  const list = Array.isArray(data) ? data : data?.printers;
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({
    id: p.id ?? p.name ?? `p-${Math.random().toString(36).slice(2)}`,
    name: p.name ?? 'Unknown printer',
    type: p.type ?? 'printer',
    status: STATUS_MAP[p.status] ?? 'offline',
  }));
}

export async function listPrinters() {
  // 1. Prefer a native bridge (Electron/Tauri) exposed by the host app.
  if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.listPrinters === 'function') {
    try {
      const res = await window.electronAPI.listPrinters();
      return { printers: normalize(res), reachable: true };
    } catch {
      /* fall through to backend */
    }
  }

  // 2. Fallback: local backend endpoint.
  try {
    const res = await fetch('/api/printers', { headers: apiHeaders({ Accept: 'application/json' }) });
    if (res.ok) return { printers: normalize(await res.json()), reachable: true };
    return { printers: [], reachable: false };
  } catch {
    return { printers: [], reachable: false };
  }
}