import { apiHeaders } from './api.js';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadDocument(file) {
  const data = await fileToBase64(file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name: file.name, type: file.type, data }),
  });

  if (!res.ok) {
    let msg = 'Upload failed';
    try {
      const j = await res.json();
      if (j && j.error) msg = j.error;
    } catch {
      /* keep default message */
    }
    throw new Error(msg);
  }

  const json = await res.json();
  return json.pages || [];
}