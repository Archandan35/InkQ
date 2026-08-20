import { sanitizeHtml } from './sanitizeHtml.js';
import { loadImage, composeDataURL } from './imageOps.js';
import { physicalPageMm } from './pageGeometry.js';
import { calibrateFraction, compensateHeightMm } from './pageCalibration.js';

// Text sizing is defined in PHYSICAL millimeters (document units), not screen
// pixels, so the printed result never depends on the browser window width at
// print time. The font size is FIXED in millimeters and independent of the box,
// so resizing a space box never scales or alters the printed text.
const FONT_MM = 5.0;
const PAD_MM = 3.15;

const esc = (s) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Orientation/physical-size decision now lives in pageGeometry.js so it can
// never diverge from what the screen ruler uses.
const sheetInfo = (natW, natH) => physicalPageMm(natW, natH);

function marginMm(margin) {
  const m = margin || {};
  const mm = m.unit === 'cm' ? (Number(m.size) || 0) * 10 : Number(m.size) || 0;
  return {
    mL: m.side === 'left' ? mm : 0,
    mR: m.side === 'right' ? mm : 0,
  };
}

function printScale(ref, page, wMm, natW) {
  if (ref && ref.widths && ref.widths[page.id]) return wMm / ref.widths[page.id];
  if (ref && ref.displayW) return wMm / ref.displayW;
  return wMm / natW;
}

function openWin(title) {
  const frame = document.createElement('iframe');
  frame.title = title;
  frame.setAttribute('aria-hidden', 'true');
  frame.className = 'print-frame';
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  win.document.title = title;
  return { frame, win };
}

function sanitizeSpaces(spaces, pageId) {
  return (spaces || []).filter(
    (s) =>
      s.pageId === pageId &&
      Number.isFinite(s.x) &&
      Number.isFinite(s.y) &&
      Number.isFinite(s.width) &&
      Number.isFinite(s.height) &&
      s.width > 0 &&
      s.height > 0 &&
      s.x >= -0.001 &&
      s.y >= -0.001 &&
      s.x + s.width <= 1.001 &&
      s.y + s.height <= 1.001
  );
}

function scaleContentHtml(html, scale) {
  const d = document.createElement('div');
  d.innerHTML = sanitizeHtml(html);
  const walker = document.createTreeWalker(d, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (el.style && el.style.fontSize && /px$/i.test(el.style.fontSize)) {
      const mm = parseFloat(el.style.fontSize) * scale;
      el.style.fontSize = `${mm.toFixed(2)}mm`;
    }
  }
  return d.innerHTML;
}

function contentInline() {
  return `font-size: ${FONT_MM.toFixed(2)}mm; padding: ${PAD_MM.toFixed(2)}mm 0;`;
}

function contentWidthMm(s, layerW, ref) {
  const w = s.width * layerW;
  const m = ref && ref.spaceWmm ? ref.spaceWmm[s.id] : undefined;
  return Number.isFinite(m) && m > 0 && m < w ? m : w;
}

const BASE_CSS = `
@page { margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet {
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background: #fff;
  margin: 0 auto;
}
.sheet:last-child { page-break-after: auto; }
.sheet img.bg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: none;
  object-fit: fill;
}
.space-layer {
  position: absolute;
}
.space {
  position: absolute;
  border: none;
  background: transparent;
  border-radius: 6px;
  overflow: hidden;
}
.space .space-tag {
  position: absolute;
  top: 0; left: 0;
  font-weight: 700;
  color: #fff;
  background: #6a32f0;
  border-radius: 0 0 5px 0;
  padding: 1px 6px;
  line-height: 1.4;
  z-index: 2;
}
.space-content {
  width: 100%;
  height: 100%;
  font-size: 12px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.5;
  text-align: justify;
  color: #161620;
  overflow: hidden;
  word-wrap: break-word;
}
`;

function writeBase(win, css) {
  win.document.write(
    `<html><head><title>${esc(win.document.title)}</title><style>${BASE_CSS}${css}</style></head><body>`
  );
}

async function waitImages(win) {
  await new Promise((r) => setTimeout(r, 120));
  const imgs = win.document.querySelectorAll('img');
  await Promise.all(
    [...imgs].map(
      (img) =>
        img.complete ||
        new Promise((res) => {
          img.onload = img.onerror = res;
        })
    )
  );
}

function finish(win, frame, after) {
  win.document.write('</body></html>');
  win.document.close();
  const print = () => {
    const chain = after ? Promise.resolve().then(after) : Promise.resolve();
    chain.then(() => {
      win.print();
      const cleanup = () => {
        if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
      };
      win.onafterprint = cleanup;
      setTimeout(cleanup, 60000);
    });
  };
  setTimeout(print, 400);
}

function cutPad(scale, margin) {
  const side = (margin || {}).side || 'off';
  if (side === 'off') return 0;
  return 10 * scale;
}

export async function printScannedOnly(pages) {
  const { frame, win } = openWin('InkQ — Print Scanned Image Only');
  const css = [];
  for (let i = 0; i < pages.length; i++) {
    const img = await loadImage(pages[i].src);
    const { wMm, hMm } = sheetInfo(img.naturalWidth, img.naturalHeight);
    const physWmm = wMm;
    css.push(`@page print-raw-${i} { size: ${physWmm.toFixed(2)}mm ${hMm.toFixed(2)}mm; margin: 0; }`);
  }
  writeBase(win, css.join(''));
  for (let i = 0; i < pages.length; i++) {
    const img = await loadImage(pages[i].src);
    const { wMm, hMm } = sheetInfo(img.naturalWidth, img.naturalHeight);
    const physWmm = wMm;
    win.document.write(
      `<div class="sheet" style="page: print-raw-${i}; width: ${physWmm.toFixed(2)}mm; height: ${hMm.toFixed(2)}mm;">` +
      `<img class="bg" src="${pages[i].src}" style="width: ${physWmm.toFixed(2)}mm; height: ${hMm.toFixed(2)}mm;" />` +
      `</div>`
    );
  }
  finish(win, frame, () => waitImages(win));
}

export async function printWholePage(pages, spaces, ref, margin) {
  const { frame, win } = openWin('InkQ — Print Whole Page (with Smart Blocks)');
  const { mL, mR } = marginMm(margin);
  const side = (margin || {}).side || 'off';
  const css = [];
  for (let i = 0; i < pages.length; i++) {
    const img = await loadImage(pages[i].src);
    const { wMm, hMm } = sheetInfo(img.naturalWidth, img.naturalHeight);
    const physWmm = wMm;
    css.push(`@page print-page-${i} { size: ${physWmm.toFixed(2)}mm ${hMm.toFixed(2)}mm; margin: 0; }`);
  }
  writeBase(win, css.join(''));
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const img = await loadImage(page.src);
    const { wMm, hMm } = sheetInfo(img.naturalWidth, img.naturalHeight);
    const scale = printScale(ref, page, wMm, img.naturalWidth);
    const physWmm = wMm;
    const composed = await composeDataURL(page);
    const pageSpaces = sanitizeSpaces(spaces, page.id);
    const insetWmm = physWmm - mL - mR;
    win.document.write(
      `<div class="sheet" style="page: print-page-${i}; width: ${physWmm.toFixed(2)}mm; height: ${hMm.toFixed(2)}mm;">` +
      `<img class="bg" src="${composed}" style="width: ${physWmm.toFixed(2)}mm; height: ${hMm.toFixed(2)}mm;" />`
    );
    if (pageSpaces.length) {
      const padMm = cutPad(scale, margin);
      const layerLeft = side === 'right' ? mL + padMm : mL;
      const layerW = Math.max(0, insetWmm - padMm);
      const fontScale = scale * (insetWmm > 0 ? layerW / insetWmm : 1);
      win.document.write(
        `<div class="space-layer" style="left: ${layerLeft.toFixed(2)}mm; top: 0; width: ${layerW.toFixed(2)}mm; height: ${hMm.toFixed(2)}mm;">`
      );
      for (const s of pageSpaces) {
        const snap = side !== 'off' && s.pinned !== false;
        const effLeft = snap ? (side === 'left' ? 0 : 1 - s.width) : s.x;
        const calLeft = calibrateFraction(effLeft, wMm);
        const calTop = calibrateFraction(s.y, hMm);
        const heightMm = compensateHeightMm(s.height * hMm);
        const text = scaleContentHtml(s.text, fontScale);
        win.document.write(
          `<div class="space" style="left: ${(calLeft * 100).toFixed(4)}%; top: ${(calTop * 100).toFixed(4)}%; width: ${(s.width * 100).toFixed(4)}%; height: ${heightMm.toFixed(2)}mm;">` +
          `<div class="space-content" style="width: ${contentWidthMm(s, layerW, ref).toFixed(2)}mm; ${contentInline()}">${text}</div>` +
          `</div>`
        );
      }
      win.document.write('</div>');
    }
    win.document.write('</div>');
  }
  finish(win, frame, () => waitImages(win));
}

export async function printSmartBlocks(pages, spaces, ref, margin) {
  const { frame, win } = openWin('InkQ — Print Smart Blocks Only');
  const { mL, mR } = marginMm(margin);
  const side = (margin || {}).side || 'off';
  const css = [];
  const sheets = [];
  for (let i = 0; i < pages.length; i++) {
    const img = await loadImage(pages[i].src);
    const { wMm, hMm } = sheetInfo(img.naturalWidth, img.naturalHeight);
    const scale = printScale(ref, pages[i], wMm, img.naturalWidth);
    const blocks = sanitizeSpaces(spaces, pages[i].id)
      .map((s) => ({ s, plain: stripHtml(s.text) }))
      .filter((b) => b.plain);
    if (!blocks.length) continue;
    css.push(`@page print-block-${i} { size: ${wMm}mm ${hMm}mm; margin: 0; }`);
    const insetWmm = wMm - mL - mR;
    const padMm = cutPad(scale, margin);
    const layerLeft = side === 'right' ? mL + padMm : mL;
    const layerW = Math.max(0, insetWmm - padMm);
    const fontScale = scale * (insetWmm > 0 ? layerW / insetWmm : 1);
    const content = blocks
      .map(({ s }) => {
        const snap = side !== 'off' && s.pinned !== false;
        const effLeft = snap ? (side === 'left' ? 0 : 1 - s.width) : s.x;
        const calLeft = calibrateFraction(effLeft, wMm);
        const calTop = calibrateFraction(s.y, hMm);
        const mmX = layerLeft + calLeft * layerW;
        const mmY = calTop * hMm;
        const mmW = s.width * layerW;
        const mmH = compensateHeightMm(s.height * hMm);
        const text = scaleContentHtml(s.text, fontScale);
        return `<div class="space-content" style="position: absolute; left: ${mmX.toFixed(2)}mm; top: ${mmY.toFixed(2)}mm; width: ${contentWidthMm(s, layerW, ref).toFixed(2)}mm; height: ${mmH.toFixed(2)}mm; ${contentInline()}">${text}</div>`;
      })
      .join('');
    sheets.push(`<div class="sheet" style="page: print-block-${i}; width: ${wMm}mm; height: ${hMm}mm;">${content}</div>`);
  }
  writeBase(win, css.join(''));
  sheets.forEach((s) => win.document.write(s));
  finish(win, frame);
}