import React from 'react';
import {
  IconImport,
  IconExport,
  IconUndo,
  IconRedo,
  IconPrinter,
  IconSliders,
  IconCalibrate,
  IconMenu,
  IconPanelLeft,
} from '../icon.jsx';

const DEFAULT_ACTIONS = [
  { key: 'import', label: 'Import', icon: IconImport, disabled: false },
  { key: 'export', label: 'Export', icon: IconExport, disabled: false },
  { key: 'undo', label: 'Undo', icon: IconUndo, disabled: false },
  { key: 'redo', label: 'Redo', icon: IconRedo, disabled: true },
  { divider: true },
  { key: 'printers', label: 'Printers', icon: IconPrinter, disabled: false },
  { key: 'settings', label: 'Settings', icon: IconSliders, disabled: false },
  { key: 'calibrate', label: 'Calibrate', icon: IconCalibrate, disabled: false },
];

export default function Topbar({ actions = DEFAULT_ACTIONS, onAction, onToggleSidebar, collapsed = false }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="hamburger"
          onClick={onToggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <IconMenu size={20} /> : <IconPanelLeft size={20} />}
        </button>
      </div>
      <div className="topbar-right">
        {actions.map((a, i) =>
          a.divider ? (
            <div className="divider" key={`div-${i}`} />
          ) : (
            <button
              key={a.key}
              className={`action ${a.disabled ? 'disabled' : ''}`}
              disabled={a.disabled}
              onClick={() => !a.disabled && onAction && onAction(a.key)}
            >
              <a.icon size={17} strokeWidth={2} />
              {a.label}
            </button>
          )
        )}
      </div>
    </header>
  );
}