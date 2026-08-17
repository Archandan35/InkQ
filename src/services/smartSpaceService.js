import { loadImage } from './imageOps.js';

const PAGE_SIZES = {
  A4: { wCm: 21, hCm: 29.7 },
  Letter: { wCm: 21.59, hCm: 27.94 },
};

const DEFAULT_PAGE_SIZE = 'A4';
const DEFAULT_MIN_HEIGHT_CM = 4;
const INK_BG_MARGIN = 40;
const INK_THRESHOLD_MIN = 120;
const INK_THRESHOLD_MAX = 245;
const CONTENT_COL_FRACTION = 0.005;
const BOX_CONTENT_REJECT = 0.08;
const MIN_WIDTH_FRACTION = 0.4;
const MAX_BOXES_PER_PAGE = 4;
const WORK_WIDTH = 700;
const MIN_CONTENT_BLOB_AREA = 40;

const FRAME = {
  HCOV: 0.18,
  HCOV_PEAK: 0.25,
  HMIN_ROWS: 6,
  HWIDTH: 0.5,
  EDGE_FRACTION: 0.015,
  MIN_BAND_HEIGHT_CM: 2,
  MIN_BAND_WIDTH_CM: 5,
  INTERIOR_DENSITY_MAX: 0.1,
  BLANK_COL_TOL: 0.05,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function luminance(data, idx) {
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
}

function estimateBackgroundLuminance(data) {
  const hist = new Float32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    hist[Math.round(luminance(data, i))]++;
  }
  let mode = 0;
  let modeCount = 0;
  let acc = 0;
  const p90Target = (data.length / 4) * 0.9;
  let p90 = 255;
  for (let v = 255; v >= 0; v--) {
    if (hist[v] > modeCount) {
      modeCount = hist[v];
      mode = v;
    }
    acc += hist[v];
    if (acc >= p90Target) {
      p90 = v;
      break;
    }
  }
  return mode < 140 ? p90 : mode;
}

function buildContentMask(data, workW, workH, inkThreshold) {
  const mask = new Uint8Array(workW * workH);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = luminance(data, i * 4) < inkThreshold ? 1 : 0;
  }
  return mask;
}

function morphologicalOpen(mask, workW, workH) {
  const tmp = new Uint8Array(mask.length);
  for (let y = 0; y < workH; y++) {
    for (let x = 0; x < workW; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= workW || ny >= workH) continue;
          c += mask[ny * workW + nx];
        }
      }
      tmp[y * workW + x] = c >= 5 ? 1 : 0;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < workH; y++) {
    for (let x = 0; x < workW; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= workW || ny >= workH) continue;
          c += tmp[ny * workW + nx];
        }
      }
      out[y * workW + x] = c > 0 ? 1 : 0;
    }
  }
  return out;
}

function removeSmallContentBlobs(mask, workW, workH) {
  const out = new Uint8Array(mask);
  const seen = new Uint8Array(mask.length);
  const stack = [];
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== 1 || seen[i]) continue;
    seen[i] = 1;
    stack.length = 0;
    stack.push(i);
    const blob = [i];
    while (stack.length) {
      const cur = stack.pop();
      for (const n of [cur - 1, cur + 1, cur - workW, cur + workW]) {
        if (n < 0 || n >= mask.length) continue;
        if (mask[n] === 1 && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
          blob.push(n);
        }
      }
    }
    if (blob.length < MIN_CONTENT_BLOB_AREA) {
      for (const b of blob) out[b] = 0;
    }
  }
  return out;
}

function usableBand(mask, workW, workH) {
  const colContent = new Float32Array(workW);
  for (let x = 0; x < workW; x++) {
    let count = 0;
    for (let y = 0; y < workH; y++) count += mask[y * workW + x];
    colContent[x] = count / workH;
  }
  let first = -1;
  let last = -1;
  for (let x = 0; x < workW; x++) {
    if (colContent[x] > CONTENT_COL_FRACTION) {
      if (first === -1) first = x;
      last = x;
    }
  }
  if (first === -1) {
    return {
      left: Math.max(0, Math.floor(workW * 0.05)),
      right: Math.min(workW - 1, Math.ceil(workW * 0.95)),
      width: Math.max(1, Math.ceil(workW * 0.9)),
    };
  }
  const left = Math.max(0, first - 1);
  const right = Math.min(workW - 1, last + 1);
  return { left, right, width: Math.max(1, right - left + 1) };
}

function largestEmptyRects(mask, workW, workH, band, minHeightPx, minWidthPx) {
  const heights = new Uint16Array(workW);
  const rects = [];
  for (let y = 0; y < workH; y++) {
    const base = y * workW;
    for (let x = 0; x < workW; x++) {
      if (x < band.left || x > band.right) {
        heights[x] = 0;
        continue;
      }
      heights[x] = mask[base + x] === 0 ? heights[x] + 1 : 0;
    }
    const stack = [];
    for (let x = band.left; x <= band.right + 1; x++) {
      const h = x <= band.right ? heights[x] : 0;
      let start = x;
      while (stack.length && stack[stack.length - 1].h >= h) {
        const t = stack.pop();
        if (t.h >= minHeightPx && x - t.idx >= minWidthPx) {
          rects.push({ top: y - t.h + 1, bottom: y, left: t.idx, right: x - 1, height: t.h, width: x - t.idx });
        }
        start = t.idx;
      }
      stack.push({ h, idx: start });
    }
  }
  const seen = new Set();
  const unique = [];
  for (const r of rects) {
    const key = `${r.top},${r.bottom},${r.left},${r.right}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }
  return unique;
}

function overlaps(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
}

function detectDrawnFrames(mask, workW, workH, size) {
  const edge = Math.max(12, Math.round(Math.min(workW, workH) * FRAME.EDGE_FRACTION));
  const bandW = workW - 2 * edge;

  const rowCov = new Float32Array(workH);
  for (let y = 0; y < workH; y++) {
    const base = y * workW;
    let cnt = 0;
    for (let x = edge; x < workW - edge; x++) cnt += mask[base + x];
    rowCov[y] = cnt / bandW;
  }

  const hStrokes = [];
  for (let i = 0; i < workH; ) {
    if (rowCov[i] < FRAME.HCOV || i < edge) {
      i++;
      continue;
    }
    let j = i;
    let peak = rowCov[i];
    while (j + 1 < workH && rowCov[j + 1] >= FRAME.HCOV) {
      j++;
      if (rowCov[j] > peak) peak = rowCov[j];
    }
    if (j - i + 1 >= FRAME.HMIN_ROWS && peak >= FRAME.HCOV_PEAK && i >= edge && j <= workH - edge) {
      const firsts = [];
      const lasts = [];
      for (let y = i; y <= j; y++) {
        const base = y * workW;
        let lx = -1;
        let rx = -1;
        for (let x = edge; x < workW - edge; x++) {
          if (mask[base + x]) {
            lx = x;
            break;
          }
        }
        for (let x = workW - edge - 1; x >= edge; x--) {
          if (mask[base + x]) {
            rx = x;
            break;
          }
        }
        if (lx >= 0) {
          firsts.push(lx);
          lasts.push(rx);
        }
      }
      firsts.sort((a, b) => a - b);
      lasts.sort((a, b) => a - b);
      const x1 = firsts[(firsts.length / 2) | 0];
      const x2 = lasts[(lasts.length / 2) | 0];
      if (x2 - x1 + 1 >= workW * FRAME.HWIDTH) {
        hStrokes.push({ y1: i, y2: j, x1, x2 });
      }
    }
    i = j + 1;
  }

  const minBandH = Math.round((FRAME.MIN_BAND_HEIGHT_CM / size.hCm) * workH);
  const minBandW = Math.round((FRAME.MIN_BAND_WIDTH_CM / size.wCm) * workW);
  const frames = [];
  for (let k = 0; k < hStrokes.length - 1; k++) {
    const top = hStrokes[k];
    const bottom = hStrokes[k + 1];
    const y0 = top.y2 + 1;
    const y1 = bottom.y1 - 1;
    const bandH = y1 - y0 + 1;
    if (bandH < minBandH) continue;
    const m = Math.max(2, Math.round(bandH * 0.06));

    let content = 0;
    let total = 0;
    const colContent = new Float32Array(workW);
    for (let y = y0 + m; y <= y1 - m; y++) {
      const base = y * workW;
      for (let x = edge; x < workW - edge; x++) {
        total++;
        if (mask[base + x]) {
          content++;
          colContent[x]++;
        }
      }
    }
    const density = total ? content / total : 1;
    if (density > FRAME.INTERIOR_DENSITY_MAX) continue;

    const nRows = Math.max(1, y1 - m - (y0 + m) + 1);
    const blankCols = new Uint8Array(workW);
    for (let x = edge; x < workW - edge; x++) {
      blankCols[x] = colContent[x] / nRows <= FRAME.BLANK_COL_TOL ? 1 : 0;
    }
    let best = 0;
    let bestStart = edge;
    let runStart = edge;
    for (let x = edge; x < workW - edge; x++) {
      if (blankCols[x]) {
        if (x === edge || !blankCols[x - 1]) runStart = x;
        if (x - runStart + 1 > best) {
          best = x - runStart + 1;
          bestStart = runStart;
        }
      }
    }
    if (best < minBandW) continue;

    const mx = Math.max(2, Math.round(best * 0.02));
    const my = Math.max(2, Math.round(bandH * 0.02));
    frames.push({
      left: bestStart + mx,
      top: y0 + my,
      width: best - 2 * mx,
      height: bandH - 2 * my,
      density,
    });
  }
  return frames;
}

function analyzePage(src, { size, minHeightCm }) {
  return loadImage(src).then((img) => {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const dpi = Math.round(natW / (size.wCm / 2.54));

    const workW = Math.min(natW, WORK_WIDTH);
    const workH = Math.max(1, Math.round(workW * (natH / natW)));
    const canvas = document.createElement('canvas');
    canvas.width = workW;
    canvas.height = workH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, workW, workH);
    const data = ctx.getImageData(0, 0, workW, workH).data;

    const bg = estimateBackgroundLuminance(data);
    const inkThreshold = clamp(bg - INK_BG_MARGIN, INK_THRESHOLD_MIN, INK_THRESHOLD_MAX);

    const contentMask = buildContentMask(data, workW, workH, inkThreshold);
    const mask = removeSmallContentBlobs(morphologicalOpen(contentMask, workW, workH), workW, workH);
    const band = usableBand(mask, workW, workH);

    const minHeightPx = (minHeightCm / size.hCm) * workH;
    const minWidthPx = band.width * MIN_WIDTH_FRACTION;

    const rects = largestEmptyRects(mask, workW, workH, band, minHeightPx, minWidthPx);
    const candidates = rects
      .map((r) => {
        let content = 0;
        for (let y = r.top; y <= r.bottom; y++) {
          const base = y * workW;
          for (let x = r.left; x <= r.right; x++) content += mask[base + x];
        }
        r.density = content / (r.width * r.height);
        return r;
      })
      .filter((r) => r.density <= BOX_CONTENT_REJECT)
      .sort((a, b) => b.height * b.width - a.height * a.width);

    const picked = [];
    for (const r of candidates) {
      if (picked.some((p) => overlaps(p, r))) continue;
      picked.push(r);
      if (picked.length >= MAX_BOXES_PER_PAGE) break;
    }

    const toSpace = (r, w, h, isFrame) => {
      const physW = (r.width / w) * size.wCm;
      const physH = (r.height / h) * size.hCm;
      const confidence = isFrame
        ? clamp(0.85 + (1 - r.density) * 0.12, 0.85, 0.99)
        : clamp(0.55 + (r.height / h) * 0.45 + (1 - r.density) * 0.25, 0.55, 0.99);
      return {
        x: +(r.left / w).toFixed(4),
        y: +(r.top / h).toFixed(4),
        width: +(r.width / w).toFixed(4),
        height: +(r.height / h).toFixed(4),
        physicalWidth: +physW.toFixed(2),
        physicalHeight: +physH.toFixed(2),
        physicalAreaCm2: +(physW * physH).toFixed(1),
        confidence: +confidence.toFixed(2),
        drawnFrame: isFrame || undefined,
      };
    };

    const frameCandidates = [];
    {
      const natCanvas = document.createElement('canvas');
      natCanvas.width = natW;
      natCanvas.height = natH;
      const natCtx = natCanvas.getContext('2d', { willReadFrequently: true });
      natCtx.drawImage(img, 0, 0);
      const natData = natCtx.getImageData(0, 0, natW, natH).data;
      const natMask = buildContentMask(natData, natW, natH, inkThreshold);
      const frames = detectDrawnFrames(natMask, natW, natH, size);
      for (const f of frames) frameCandidates.push(toSpace(f, natW, natH, true));
    }

    const rectCandidates = picked.map((r) => toSpace(r, workW, workH, false));

    const spaceOverlaps = (a, b) =>
      a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;

    const merged = [];
    for (const s of [...frameCandidates, ...rectCandidates].sort((a, b) => b.confidence - a.confidence)) {
      if (merged.some((p) => spaceOverlaps(p, s))) continue;
      merged.push(s);
      if (merged.length >= MAX_BOXES_PER_PAGE) break;
    }

    return {
      pageIndex: 0,
      dpi,
      widthCm: size.wCm,
      heightCm: size.hCm,
      minHeightCm,
      backgroundLuminance: bg,
      inkThreshold,
      sourceImageDimensions: { width: natW, height: natH },
      analysisDimensions: { width: workW, height: workH },
      spaces: merged,
    };
  });
}

export async function analyzeSmartSpaces(pageSrcs, options = {}) {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const minHeightCm = options.minHeightCm || DEFAULT_MIN_HEIGHT_CM;
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES[DEFAULT_PAGE_SIZE];

  const results = [];
  for (let i = 0; i < pageSrcs.length; i++) {
    const page = await analyzePage(pageSrcs[i], { size, minHeightCm });
    page.pageIndex = i;
    results.push(page);
  }
  return results;
}