import React from 'react';
import Button from './Button.jsx';
import {
  IconFile,
  IconSparkle,
  IconPanelLeft,
  IconX,
} from '../icon.jsx';

const OPTIONS = [
  {
    id: 'scanned',
    icon: IconFile,
    title: 'Print Scanned Image Only',
    desc: 'Clean copy of the raw scanned page. No smart blocks, overlays or annotations.',
  },
  {
    id: 'whole',
    icon: IconPanelLeft,
    title: 'Print Whole Page',
    sub: 'with Smart Blocks',
    desc: 'Full page exactly as previewed, including all Smart Space boxes at their exact positions.',
  },
  {
    id: 'blocks',
    icon: IconSparkle,
    title: 'Print Smart Blocks Only',
    desc: 'Each detected Smart Space printed independently at its exact size and coordinates.',
  },
];

export default function PrintOptionsModal({
  open,
  onClose,
  onPick,
  busy,
  title = 'Print Options',
  hint = 'Each option produces a different print output. Choose the layout that matches what you need.',
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal print-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">
            <IconSparkle size={15} className="modal-title-icon" />
            {title}
          </span>
          <button type="button" className="modal-close" onClick={onClose}>
            <IconX size={16} />
          </button>
        </div>
        <div className="print-modal-body">
          <div className="print-modal-hint">{hint}</div>
          <div className="print-options">
            {OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className="print-option"
                disabled={busy}
                onClick={() => onPick(o.id)}
              >
                <span className="print-option-icon">
                  <o.icon size={22} strokeWidth={1.8} />
                </span>
                <span className="print-option-title">
                  {o.title}
                  {o.sub && <span className="print-option-sub">{o.sub}</span>}
                </span>
                <span className="print-option-desc">{o.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}