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
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`,
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

app.get('/api/printers', (_req, res) => {
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
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
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

app.post('/api/scan', (req, res) => {
  const printer = req.body?.printer || null;
  const dpi = Number(req.body?.dpi) || 0;
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
        : `Scan failed: ${e.message || e}`;
      console.error('[scan] error:', e.message || e);
      res.status(500).json({ error: msg });
    });
});

app.post('/api/scan/cancel', (_req, res) => {
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

  const data = new Uint8Array(readFileSync(pdfPath));
  const task = pdfjs.getDocument({ data, standardFontDataUrl: fontsDir });
  const doc = await task.promise;
  const pages = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(Math.floor(vp.width), Math.floor(vp.height));
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
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { timeout: 120000, windowsHide: true },
      (err) => {
        if (err) return reject(new Error('Could not convert the Word document (is Microsoft Word installed?)'));
        resolve(outPath);
      }
    );
  });
}

app.post('/api/upload', async (req, res) => {
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
      return res.json({ pages: [`data:${type || 'image/png'};base64,${data}`] });
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
    return res.status(500).json({ error: e.message || 'Upload failed' });
  } finally {
    await rm(tmp, { force: true });
    if (converted !== tmp) await rm(converted, { force: true });
  }
});

const dist = path.join(__dirname, 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`InkQ API server running at http://localhost:${PORT}`);
});