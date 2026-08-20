import { apiHeaders } from './api.js';

export async function listScanners(refresh) {
  const url = refresh ? '/api/scanners?refresh=1' : '/api/scanners';
  const res = await fetch(url, { headers: apiHeaders({ Accept: 'application/json' }) });
  if (!res.ok) return { scanners: [], reachable: false };
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.scanners;
  return { scanners: Array.isArray(list) ? list : [], reachable: true };
}

export async function scanPage(printerName, dpi, { signal } = {}) {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ printer: printerName || null, dpi: dpi || null }),
    signal,
  });

  if (!res.ok) {
    let msg = 'Scan failed';
    try {
      const j = await res.json();
      if (j && j.error) msg = j.error;
    } catch {
      /* keep default message */
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const durationMs = Number(res.headers.get('X-Scan-Ms') || 0);
  return { url: URL.createObjectURL(blob), durationMs };
}