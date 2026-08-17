import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function inkqToken() {
  try {
    return readFileSync(path.join(__dirname, '.inkq-token'), 'utf8').trim();
  } catch {
    return '';
  }
}

function inkqTokenInject() {
  let token = '';
  return {
    name: 'inkq-token-inject',
    apply: 'serve',
    transformIndexHtml(html) {
      token = inkqToken();
      if (token && !html.includes('name="inkq-token"')) {
        return html.replace('<head>', `<head><meta name="inkq-token" content="${token}">`);
      }
      return html;
    },
  };
}

export default defineConfig({
  plugins: [react(), inkqTokenInject()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
