// Why this exists
// -----------------
// Box/text positions are stored as a FRACTION (0..1) of the scanned image's
// own pixel height/width (see smartSpaceService.js: `y: r.top / h`). Every
// consumer of that fraction — the on-screen ruler, the on-screen box, and the
// print engine — has always agreed with each other perfectly, because they
// all apply the exact same formula (`fraction * 297mm`, or the CSS-percent
// equivalent). That is NOT the same thing as agreeing with the physical
// paper.
//
// The formula is only exact if the scanned image's top and bottom pixel rows
// are precisely the paper's physical 0mm and 297mm edges — no scanner
// border, no skew, no crop offset. In real scans that's never exactly true,
// and the resulting error is proportional to distance from the scan's own
// (arbitrary) reference point, which is exactly the pattern measured on
// physical printouts: ~0mm error near the middle of the page, growing to a
// few mm near the top/bottom.
//
// This module is the ONE place that error is corrected, so screen and print
// keep being identical to each other AND become correct relative to the
// physical page. It intentionally does NOT touch smartSpaceService.js's raw
// fraction — that stays a simple, honest "fraction of the scanned pixels".
// Calibration is applied only at the point a fraction is turned into a
// physical/visual position, in both printService.js and StepReview.jsx.
//
// How to calibrate
// -----------------
// 1. Print the calibration test page described in the print-position brief
//    (markers at 0/15/60/110/160/240/280/297mm etc.), at 100% scale, no
//    "fit to page", no headers/footers.
// 2. Measure two of those markers on the physical printout with a ruler —
//    ideally one near the top and one near the bottom of the page, e.g. the
//    15mm and 240mm marks.
// 3. Fill in MEASURED_TOP / MEASURED_BOTTOM below with what the ruler
//    actually showed, and set CALIBRATION.enabled = true.
//
// This is deliberately NOT auto-applied with a guessed value — per-printer
// offset compensation must be based on a real physical measurement, never
// assumed, or it just trades one silent error for another.

const INTENDED_TOP_MM = 15;
const INTENDED_BOTTOM_MM = 240;

// Fill these in from a physical ruler measurement of the calibration page,
// then flip `enabled` to true. Left as an untouched identity mapping
// (measured === intended) until someone has actually measured a printout.
const MEASURED_TOP_MM = INTENDED_TOP_MM;
const MEASURED_BOTTOM_MM = INTENDED_BOTTOM_MM;

const measuredScale = (MEASURED_BOTTOM_MM - MEASURED_TOP_MM) / (INTENDED_BOTTOM_MM - INTENDED_TOP_MM);

export const CALIBRATION = {
  enabled: false,
  scale: measuredScale,
  // mm-space offset such that: measuredMm = offsetMm + intendedMm * scale
  offsetMm: MEASURED_TOP_MM - INTENDED_TOP_MM * measuredScale,
};

/**
 * Correct a raw 0..1 fraction along an axis of length `axisMm`, returning the
 * corrected 0..1 fraction to actually render/print at. Identity when
 * calibration is disabled.
 * @param {number} fraction raw fraction from the stored box (s.x / s.y)
 * @param {number} axisMm physical length of that axis (hMm or wMm)
 */
export function calibrateFraction(fraction, axisMm) {
  if (!CALIBRATION.enabled || !axisMm) return fraction;
  const intendedMm = fraction * axisMm;
  const correctedMm = CALIBRATION.offsetMm + intendedMm * CALIBRATION.scale;
  return correctedMm / axisMm;
}

// --- Bottom-edge print shrinkage compensation --------------------------
// This is a SEPARATE bug from the position skew CALIBRATION above, found by
// comparing a 3-box calibration printout (top+bottom mark per box) across
// screen / print-preview / physical paper:
//   - Every box's TOP edge lands exactly right in all three places. No error.
//   - Every box's BOTTOM edge prints ~5-6mm short of what screen/print-preview
//     show, and that shortfall is roughly CONSTANT regardless of the box's
//     page position or height (measured: -7mm, -6mm, -3mm on a 3-sample
//     printout; modeling it as a flat -5.5mm fits all three within ~0.5mm,
//     far better than any position-proportional model).
// Because CALIBRATION.enabled above only ever corrects a box's TOP/LEFT
// (see calibrateFraction call sites), it can NEVER fix this even when
// enabled — the bottom edge / height is never run through it. This is why
// "measure and calibrate" alone does not make physical paper match the
// screen. This constant patches that gap by extending the box's rendered
// height (bottom edge only, top untouched) at PRINT time only, so the
// printer's own shrinkage cancels out and physical paper ends up matching
// what screen/print-preview already show.
//
// How to (re)calibrate this value for a different printer:
// 1. Print the calibration test page (boxes with a top mark + bottom mark).
// 2. Ruler-measure where each box's bottom mark actually lands on paper.
// 3. shortfallMm = screenBottomMm - physicalBottomMm, per box. Average them.
// 4. Set BOTTOM_SHRINK_MM to that average.Leave BOTTOM_SHRINK_ENABLED false
//    until you've done this measurement yourself — do not guess.
const BOTTOM_SHRINK_MM = 50;
const BOTTOM_SHRINK_ENABLED = true;

/**
 * Extend a box's mm height to compensate for the printer's own bottom-edge
 * shrinkage (see note above). Top edge / position is untouched — only the
 * bottom grows. Identity when disabled.
 * @param {number} heightMm the box's height in mm as computed from its
 *   stored fraction (top edge stays wherever it already is).
 */
export function compensateHeightMm(heightMm) {
  if (!BOTTOM_SHRINK_ENABLED || !Number.isFinite(heightMm)) return heightMm;
  return heightMm + BOTTOM_SHRINK_MM;
}