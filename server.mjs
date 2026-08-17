import express from 'express';
import { exec } from 'node:child_process';
import { existsSync, unlink } from 'node:fs';
import { writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '100mb' }));

function isLoopbackHostname(hostname) {
  const h = String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0' || /^127\./.test(h);
}

function isTrustedRequest(req) {
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    return false;
  }
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const u = new URL(origin);
    if (u.protocol === 'file:' || u.protocol === 'app:') return true;
    if (isLoopbackHostname(u.hostname)) return true;
    if (u.host === req.headers.host) return true;
  } catch {
    return false;
  }
  return false;
}

app.use('/api', (req, res, next) => {
  if (isTrustedRequest(req)) return next();
  return res.status(403).json({ error: 'Forbidden' });
});

const CSP =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "font-src 'self' data:; " +
  "connect-src 'self' data: blob:; " +
  "worker-src 'self' blob:; " +
  "frame-src 'self' data: blob: about:; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-ancestors 'none'";

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=(), serial=(), payment=(), magnetometer=(), gyroscope=()');
  next();
});

app.use('/api', (req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`[api] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - started}ms)`);
  });
  next();
});

const rateBuckets = new Map();

function rateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${name}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of rateBuckets) {
    if (now >= b.resetAt) rateBuckets.delete(k);
  }
}, 60000).unref();

function mapStatus(p) {
  if (p.WorkOffline) return 'offline';
  switch (p.PrinterStatus) {
    case 3:
      return 'online';
    case 4:
      return 'busy';
    default:
      return 'offline';
  }
}

function getPrinters() {
  return new Promise((resolve, reject) => {
    const ps =
      'Get-CimInstance Win32_Printer | ' +
      'Select-Object Name, PrinterStatus, WorkOffline, DriverName, Default | ' +
      'ConvertTo-Json -Compress';
    exec(
      `powershell -NoProfile -Command "${ps}"`,
      { maxBuffer: 1024 * 1024, windowsHide: true },
      (err, stdout) => {
        if (err) return reject(err);
        if (!stdout || !stdout.trim()) return resolve([]);
        try {
          const data = JSON.parse(stdout.trim());
          const list = Array.isArray(data) ? data : [data];
          resolve(
            list.map((p) => ({
              id: `printer-${p.Name}`,
              name: p.Name,
              type: 'printer',
              status: mapStatus(p),
              default: !!p.Default,
              driver: p.DriverName || '',
            }))
          );
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

app.get('/api/printers', rateLimit({ windowMs: 60000, max: 30, name: 'printers' }), (_req, res) => {
  getPrinters()
    .then((printers) => res.json(printers))
    .catch(() => res.status(500).json({ error: 'Failed to enumerate printers' }));
});

const NO_SCANNER = '__INKQ_NO_SCANNER__';

const SCAN_SCRIPT = `
$ErrorActionPreference = 'Stop'
$printer = $env:INKQ_PRINTER
$dm = New-Object -ComObject WIA.DeviceManager
$info = $null
if ($printer) {
  try {
    $info = $dm.DeviceInfos | Where-Object { $_.Type -eq 1 -and $_.Properties.Item('Name').Value -like "*$printer*" } | Select-Object -First 1
  } catch {}
}
if (-not $info) {
  $info = $dm.DeviceInfos | Where-Object { $_.Type -eq 1 } | Select-Object -First 1
}
if (-not $info) {
  Write-Output '${NO_SCANNER}'
  exit 2
}
$device = $info.Connect()
$item = $device.Items(1)
$dpi = $env:INKQ_DPI
if ($dpi) {
  try { $item.Properties.Item(6146).Value = [int]$dpi } catch {}
  try { $item.Properties.Item(6147).Value = [int]$dpi } catch {}
}
$img = $item.Transfer('{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}')
$tmp = Join-Path $env:TEMP ('inkq_scan_' + [guid]::NewGuid().ToString('N') + '.jpg')
$img.SaveFile($tmp)
Write-Output $tmp
`;

function scanOnce(printerName, dpi) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(SCAN_SCRIPT, 'utf16le').toString('base64');
    exec(
      `powershell -NoProfile -EncodedCommand ${encoded}`,
      { maxBuffer: 1024 * 1024, timeout: 120000, windowsHide: true, env: { ...process.env, INKQ_PRINTER: printerName || '', INKQ_DPI: dpi || '' } },
      (err, stdout) => {
        if (err) return reject(err);
        const out = (stdout || '').trim();
        if (!out || out.includes(NO_SCANNER)) {
          const e = new Error('No scanner device found on this device');
          e.noScanner = true;
          return reject(e);
        }
        const line = out.split(/\r?\n/).pop().trim();
        resolve(line);
      }
    );
  });
}

function scanWithRetry(printerName, dpi, attempts = 3) {
  return scanOnce(printerName, dpi).catch((e) => {
    if (e.noScanner || attempts <= 1) throw e;
    return new Promise((resolve) => setTimeout(resolve, 3000)).then(() => scanWithRetry(printerName, dpi, attempts - 1));
  });
}

let scanAborted = false;

app.post('/api/scan', rateLimit({ windowMs: 60000, max: 5, name: 'scan' }), (req, res) => {
  const printer = typeof req.body?.printer === 'string' ? req.body.printer.trim() : null;
  if (printer && (printer.length > 200 || /[\r\n]/.test(printer))) {
    return res.status(400).json({ error: 'Invalid printer name' });
  }
  const rawDpi = req.body?.dpi;
  const dpi = rawDpi === undefined || rawDpi === null || rawDpi === '' ? 0 : Number(rawDpi);
  if (dpi !== 0 && (Number.isNaN(dpi) || dpi < 50 || dpi > 2400)) {
    return res.status(400).json({ error: 'Invalid DPI value (50–2400)' });
  }
  const started = Date.now();
  scanAborted = false;
  scanWithRetry(printer, dpi)
    .then((tmpPath) => {
      if (scanAborted) {
        unlink(tmpPath, () => {});
        return res.status(499).json({ error: 'Scan cancelled' });
      }
      res.set('X-Scan-Ms', String(Date.now() - started));
      res.sendFile(tmpPath, (err) => {
        if (err) return;
        unlink(tmpPath, () => {});
      });
    })
    .catch((e) => {
      const msg = e.noScanner
        ? 'No scanner device found. Connect a scanner (or all-in-one printer) and try again.'
        : 'Scan failed. Please check the scanner connection and try again.';
      console.error('[scan] error:', e.message || e);
      res.status(500).json({ error: msg });
    });
});

app.post('/api/scan/cancel', rateLimit({ windowMs: 60000, max: 20, name: 'cancel' }), (_req, res) => {
  scanAborted = true;
  res.json({ ok: true });
});

async function renderPdfPages(pdfPath) {
  const { readFileSync } = await import('node:fs');
  const { createCanvas } = await import('@napi-rs/canvas');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerSrc = import.meta.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const fontsFile = import.meta.resolve('pdfjs-dist/standard_fonts/FoxitSerif.pfb');
  const fontsDir = fontsFile.slice(0, fontsFile.lastIndexOf('/') + 1);
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const MAX_PDF_PAGES = 200;
  const MAX_CANVAS_PIXELS = 50_000_000;
  const data = new Uint8Array(readFileSync(pdfPath));
  const task = pdfjs.getDocument({ data, standardFontDataUrl: fontsDir });
  const doc = await task.promise;
  if (doc.numPages > MAX_PDF_PAGES) {
    await task.destroy();
    const e = new Error(`PDF has ${doc.numPages} pages; maximum supported is ${MAX_PDF_PAGES}`);
    e.maxPages = true;
    throw e;
  }
  const pages = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1.5 });
      const w = Math.floor(vp.width);
      const h = Math.floor(vp.height);
      if (w <= 0 || h <= 0 || w * h > MAX_CANVAS_PIXELS) {
        await task.destroy();
        const e = new Error(`Page ${i} is too large to render (${w}x${h}px). Maximum allowed is ${MAX_CANVAS_PIXELS} pixels.`);
        e.maxPages = true;
        throw e;
      }
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      pages.push(`data:image/png;base64,${canvas.toBuffer('image/png').toString('base64')}`);
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  return pages;
}

function convertWordToPdf(srcPath) {
  return new Promise((resolve, reject) => {
    const outPath = srcPath.replace(/\.(doc|docx)$/i, '') + '_converted.pdf';
    const esc = (s) => s.replace(/'/g, "''");
    const ps = `
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open('${esc(srcPath)}')
  $doc.SaveAs2('${esc(outPath)}', 17)
  $doc.Close(0)
} finally {
  $word.Quit()
}
Write-Output 'OK'
`;
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    exec(
      `powershell -NoProfile -EncodedCommand ${encoded}`,
      { timeout: 120000, windowsHide: true },
      (err) => {
        if (err) return reject(new Error('Could not convert the Word document (is Microsoft Word installed?)'));
        resolve(outPath);
      }
    );
  });
}

function sniffImageMime(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  if (buf.length > 2 && buf[0] === 0x42 && buf[1] === 0x4d) return 'image/bmp';
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

app.post('/api/upload', rateLimit({ windowMs: 60000, max: 10, name: 'upload' }), async (req, res) => {
  const { name = '', type = '', data } = req.body || {};
  if (!data) return res.status(400).json({ error: 'No file data received' });

  let buf;
  try {
    buf = Buffer.from(data, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid file data' });
  }

  const ext = path.extname(name) || '.bin';
  const tmp = path.join(tmpdir(), `inkq_upload_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  await writeFile(tmp, buf);

  let converted = tmp;
  try {
    if (type.startsWith('image/')) {
      const mime = sniffImageMime(buf);
      if (!mime) return res.status(400).json({ error: 'Unsupported or invalid image file' });
      return res.json({ pages: [`data:${mime};base64,${buf.toString('base64')}`] });
    }
    if (/\.(doc|docx)$/i.test(name)) {
      converted = await convertWordToPdf(tmp);
    }
    if (/\.pdf$/i.test(name) || converted !== tmp) {
      const pages = await renderPdfPages(converted);
      return res.json({ pages });
    }
    return res.status(400).json({ error: `Unsupported file type: ${name}` });
  } catch (e) {
    console.error('[upload] error:', e.message || e);
    const msg = e.maxPages ? e.message : 'Failed to process the uploaded file. Please try a different file or format.';
    return res.status(500).json({ error: msg });
  } finally {
    await rm(tmp, { force: true });
    if (converted !== tmp) await rm(converted, { force: true });
  }
});

const dist = path.join(__dirname, 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (err && err.type && err.type.startsWith('entity.')) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (err) {
    console.error('[server] error:', err.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const HOST = process.env.INKQ_HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`InkQ API server running at http://${HOST}:${PORT}`);
});