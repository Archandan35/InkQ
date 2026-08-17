import React, { useEffect, useRef, useState } from 'react';
import { IconX, ScanRing } from '../icon.jsx';

function progressFromElapsed(elapsed, total) {
  if (total <= 0) return 4;
  const t = Math.min(1, elapsed / total);
  // warm-up: first 15% of the time -> 0-8%
  // transfer: 15-90% of the time -> 8-92%
  // processing tail: 90-100% -> 92-97% (final 100% only when the image arrives)
  let p;
  if (t < 0.15) {
    p = (t / 0.15) * 8;
  } else if (t < 0.9) {
    p = 8 + ((t - 0.15) / 0.75) * 84;
  } else {
    p = 92 + ((t - 0.9) / 0.1) * 5;
  }
  return Math.max(0, Math.min(97, p));
}

export default function ScanOverlay({ expectedMs = 18000, done = false, label = 'Scanning flatbed...', onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (done) {
      setElapsed(expectedMs);
      return;
    }
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 150);
    return () => clearInterval(t);
  }, [done, expectedMs]);

  const pct = done ? 100 : progressFromElapsed(elapsed, expectedMs);

  return (
    <div className="scan-overlay">
      <div className="scan-circle">
        <ScanRing pct={pct} />
        <div className="scan-center">
          <div className="scan-pct">{Math.round(pct)}%</div>
          <div className="scan-label">{done ? 'Scan complete' : label}</div>
          {!done && onCancel && (
            <button type="button" className="scan-cancel" onClick={onCancel}>
              <IconX size={13} strokeWidth={2.6} />
              Cancel Scan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}