export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function srcToDataURL(src) {
  if (src && src.startsWith('data:')) return src;
  const blob = await (await fetch(src)).blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Failed to read image'));
    fr.readAsDataURL(blob);
  });
}

export async function rotateImage(src, deg) {
  const img = await loadImage(src);
  const q = (Math.round(deg / 90) % 4 + 4) % 4;
  const swap = q % 2 === 1;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);
  ctx.rotate((q * Math.PI) / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function enhanceImage(src) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const contrast = 1.18;
  const sat = 1.15;
  const brightness = 6;
  const intercept = 128 * (1 - contrast) + brightness;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    let nr = gray + (r - gray) * sat;
    let ng = gray + (g - gray) * sat;
    let nb = gray + (b - gray) * sat;
    nr = nr * contrast + intercept;
    ng = ng * contrast + intercept;
    nb = nb * contrast + intercept;
    d[i] = nr < 0 ? 0 : nr > 255 ? 255 : nr;
    d[i + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng;
    d[i + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function cropImage(src, { x, y, w, h }) {
  const img = await loadImage(src);
  const sx = Math.max(0, Math.round(x));
  const sy = Math.max(0, Math.round(y));
  const sw = Math.min(img.naturalWidth - sx, Math.round(w));
  const sh = Math.min(img.naturalHeight - sy, Math.round(h));
  if (sw <= 0 || sh <= 0) return src;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/jpeg', 0.92);
}

async function composeImage(src, annSrc) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  if (annSrc) {
    const a = await loadImage(annSrc);
    ctx.drawImage(a, 0, 0);
  }
  return canvas.toDataURL('image/png');
}

export async function composeDataURL(page) {
  if (page?.ann) return composeImage(page.src, page.ann);
  return srcToDataURL(page.src);
}