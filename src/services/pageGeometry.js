// Single source of truth for "is this page portrait or landscape, and what are
// its physical A4 mm dimensions". Orientation MUST be decided from the
// scanned image's own natural pixel dimensions (naturalWidth/naturalHeight)
// everywhere in the app — never from a rendered/screen size (stage.w/stage.h,
// getBoundingClientRect, etc.), because rendered size depends on zoom,
// sidebar-collapse fit-scale, and CSS layout timing and can disagree with the
// image's real aspect ratio at the exact moment it's read. Previously the
// screen ruler decided orientation from rendered stage dimensions
// (stage.w >= stage.h) while the print pipeline decided it from the raw
// image (naturalHeight < naturalWidth) — two different inputs answering the
// same question, which could diverge and silently swap which physical axis
// (210mm vs 297mm) a page's height maps onto.

export const A4_W_MM = 210;
export const A4_H_MM = 297;

/**
 * @param {number} natW natural pixel width of the source scan
 * @param {number} natH natural pixel height of the source scan
 * @returns {boolean} true if the page should be treated as landscape
 */
export function isLandscape(natW, natH) {
  return natH < natW;
}

/**
 * Physical A4 sheet dimensions (mm) for a given source image, decided purely
 * from the image's natural pixel dimensions so screen and print always agree.
 * @param {number} natW
 * @param {number} natH
 */
export function physicalPageMm(natW, natH) {
  const landscape = isLandscape(natW, natH);
  return {
    landscape,
    wMm: landscape ? A4_H_MM : A4_W_MM,
    hMm: landscape ? A4_W_MM : A4_H_MM,
  };
}