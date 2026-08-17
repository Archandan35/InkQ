import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { loadImage } from './imageOps.js';

const saveBlob = (blob, name) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
};

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function marginInfo(margin, imgW) {
  const m = margin || {};
  const mm = m.unit === 'cm' ? (Number(m.size) || 0) * 10 : Number(m.size) || 0;
  const landscape = false;
  const physWmm = landscape ? 297 : 210;
  const pxPerMm = imgW / physWmm;
  return {
    side: m.side || 'off',
    mL: m.side === 'left' ? mm * pxPerMm : 0,
    mR: m.side === 'right' ? mm * pxPerMm : 0,
  };
}

async function drawSpacesOnCanvas(ctx, imgW, imgH, spaces, margin) {
  const list = (spaces || []).filter(
    (s) =>
      Number.isFinite(s.x) &&
      Number.isFinite(s.y) &&
      Number.isFinite(s.width) &&
      Number.isFinite(s.height) &&
      s.width > 0 &&
      s.height > 0
  );
  const { side, mL, mR } = marginInfo(margin, imgW);
  const insetW = Math.max(1, imgW - mL - mR);
  for (const s of list) {
    const snap = side !== 'off' && s.pinned !== false;
    const effLeft = snap ? (side === 'left' ? 0 : 1 - s.width) : s.x;
    const x = mL + effLeft * insetW;
    const y = s.y * imgH;
    const w = s.width * insetW;
    const h = s.height * imgH;
    const color = s.manual ? '#22c55e' : '#6a32f0';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, Math.round(imgW / 500));
    ctx.strokeRect(x, y, w, h);
    const text = stripHtml(s.text);
    if (text) {
      const pad = Math.max(6, Math.round(h * 0.05));
      const fontPx = Math.max(10, Math.round(Math.min(h * 0.18, w * 0.07)));
      ctx.font = `${fontPx}px Calibri, Arial, sans-serif`;
      ctx.fillStyle = '#161620';
      ctx.textBaseline = 'top';
      const maxW = w;
      const lines = wrapText(ctx, text, maxW);
      const lh = fontPx * 1.35;
      let ty = y + pad;
      for (const line of lines) {
        if (ty + lh > y + h - pad) break;
        ctx.fillText(line, x, ty);
        ty += lh;
      }
    }
    ctx.restore();
  }
}

async function composePageURL(page, spaces, margin) {
  const img = await loadImage(page.src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  if (page?.ann) {
    const a = await loadImage(page.ann);
    ctx.drawImage(a, 0, 0);
  }
  await drawSpacesOnCanvas(ctx, canvas.width, canvas.height, (spaces || []).filter((s) => s.pageId === page.id), margin);
  return canvas.toDataURL('image/png');
}

async function composeBlockURL(page, s) {
  const img = await loadImage(page.src);
  const x = Math.round(s.x * img.naturalWidth);
  const y = Math.round(s.y * img.naturalHeight);
  const w = Math.round(s.width * img.naturalWidth);
  const h = Math.round(s.height * img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  if (page?.ann) {
    const a = await loadImage(page.ann);
    ctx.drawImage(a, x, y, w, h, 0, 0, w, h);
  }
  const color = s.manual ? '#22c55e' : '#6a32f0';
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, Math.round(w / 400));
  ctx.strokeRect(0, 0, w, h);
  const text = stripHtml(s.text);
  if (text) {
    const pad = Math.max(4, Math.round(h * 0.05));
    const fontPx = Math.max(9, Math.round(Math.min(h * 0.18, w * 0.07)));
    ctx.font = `${fontPx}px Calibri, Arial, sans-serif`;
    ctx.fillStyle = '#161620';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, text, w - pad * 2);
    const lh = fontPx * 1.35;
    let ty = pad;
    for (const line of lines) {
      if (ty + lh > h - pad) break;
      ctx.fillText(line, pad, ty);
      ty += lh;
    }
  }
  ctx.restore();
  return canvas.toDataURL('image/png');
}

function pageURLs(pages, spaces, mode, margin) {
  return Promise.all(
    pages.map((p) => (mode === 'scanned' ? Promise.resolve(p.src) : composePageURL(p, spaces, margin)))
  );
}

function blockURLs(pages, spaces) {
  const urls = [];
  for (const p of pages) {
    const list = (spaces || []).filter((s) => s.pageId === p.id && stripHtml(s.text));
    for (const s of list) {
      urls.push(composeBlockURL(p, s));
    }
  }
  return Promise.all(urls);
}

export async function exportPDF(pages, spaces, mode = 'whole', margin, name = `inkq-export-${stamp()}.pdf`) {
  const urls = mode === 'blocks' ? await blockURLs(pages, spaces) : await pageURLs(pages, spaces, mode, margin);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  for (let i = 0; i < urls.length; i++) {
    if (i > 0) pdf.addPage();
    const u = urls[i];
    const fmt = u.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    const img = await loadImage(u);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const physWmm = 210;
    const physHmm = (h / w) * physWmm;
    const scale = Math.min(PW / physWmm, PH / physHmm);
    const sw = physWmm * scale;
    const sh = physHmm * scale;
    pdf.addImage(u, fmt, (PW - sw) / 2, (PH - sh) / 2, sw, sh);
  }
  pdf.save(name);
}

export async function exportImages(pages, spaces, format = 'png', mode = 'whole', margin, name = 'inkq') {
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const isBlocks = mode === 'blocks';
  const urls = isBlocks
    ? await blockURLs(pages, spaces)
    : await Promise.all(pages.map((p) => (mode === 'scanned' ? Promise.resolve(p.src) : composePageURL(p, spaces, margin))));
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const isJpeg = u.startsWith('data:image/jpeg');
    const needsConvert = format === 'jpeg' ? !isJpeg : isJpeg;
    let blob;
    if (needsConvert) {
      const img = await loadImage(u);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const out = canvas.toDataURL(mime, 0.92);
      blob = await (await fetch(out)).blob();
    } else {
      blob = await (await fetch(u)).blob();
    }
    const label = isBlocks ? `block-${i + 1}` : `page-${i + 1}`;
    saveBlob(blob, `${name}-${label}.${ext}`);
  }
}

export async function exportDoc(pages, spaces, mode = 'whole', margin, name = `inkq-export-${stamp()}.doc`) {
  const urls = mode === 'blocks' ? await blockURLs(pages, spaces) : await pageURLs(pages, spaces, mode, margin);
  const imgs = urls.map((u) => `<img src="${u}" style="max-width:100%;" />`).join('<br />');
  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">` +
    `<head><meta charset="utf-8"><title>InkQ Export</title></head><body>${imgs}</body></html>`;
  saveBlob(new Blob([html], { type: 'application/msword' }), name);
}

const TARGET_EMU_W = 5600000;

async function dataURLToBytes(u) {
  const res = await fetch(u);
  return new Uint8Array(await res.arrayBuffer());
}

export async function exportDocx(pages, spaces, mode = 'whole', margin, name = `inkq-export-${stamp()}.docx`) {
  const urls = mode === 'blocks' ? await blockURLs(pages, spaces) : await pageURLs(pages, spaces, mode, margin);
  const zip = new JSZip();
  const media = zip.folder('word/media');
  const rels = [];
  const parags = [];

  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const ext = u.startsWith('data:image/png') ? 'png' : 'jpeg';
    const fileName = `image${i + 1}.${ext}`;
    media.file(fileName, await dataURLToBytes(u));
    const rId = `rId${i + 1}`;
    rels.push(
      `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${fileName}"/>`
    );
    const img = await loadImage(u);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const cx = TARGET_EMU_W;
    const cy = Math.round(TARGET_EMU_W * (h / w));
    parags.push(
      `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
        `<wp:extent cx="${cx}" cy="${cy}"/>` +
        `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
        `<wp:docPr id="${i + 1}" name="Picture ${i + 1}"/>` +
        `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `<pic:pic><pic:nvPicPr><pic:cNvPr id="${i + 1}" name="Picture ${i + 1}"/><pic:cNvPicPr/></pic:nvPicPr>` +
        `<pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
        `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
        `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
        `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
    );
  }

  const docXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
    `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
    `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<w:body>${parags.join('')}</w:body></w:document>`;

  const relsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    rels.join('') + `</Relationships>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Default Extension="png" ContentType="image/png"/>` +
    `<Default Extension="jpeg" ContentType="image/jpeg"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`;

  const stylesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults>` +
    `<w:rPrDefault><w:rPr><w:sz w:val="22"/></w:rPr></w:rPrDefault>` +
    `</w:docDefaults></w:styles>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rootRels);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', relsXml);
  zip.file('word/styles.xml', stylesXml);

  const out = await zip.generateAsync({ type: 'blob' });
  saveBlob(out, name);
}

export async function exportZip(pages, spaces, mode = 'whole', margin, name = `inkq-pages-${stamp()}.zip`) {
  const zip = new JSZip();
  const isBlocks = mode === 'blocks';
  const urls = isBlocks
    ? await blockURLs(pages, spaces)
    : await Promise.all(pages.map((p) => (mode === 'scanned' ? Promise.resolve(p.src) : composePageURL(p, spaces, margin))));
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const blob = await (await fetch(u)).blob();
    const ext = u.startsWith('data:image/png') ? 'png' : 'jpg';
    const label = isBlocks ? `block-${i + 1}` : `page-${i + 1}`;
    zip.file(`inkq-${label}.${ext}`, blob);
  }
  const out = await zip.generateAsync({ type: 'blob' });
  saveBlob(out, name);
}