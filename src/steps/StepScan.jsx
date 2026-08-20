import React, { useEffect, useRef, useState } from 'react';
import Button from '../components/Button.jsx';
import { listScanners } from '../services/scanService.js';
import {
  IconCheck,
  IconScanner,
  IconPrinter,
  IconUpload,
  IconInfo,
  IconChevronDown,
  IconRefresh,
  IconArrowLeft,
  IconArrowRight,
  IconSparkle,
  IconSparkleStar,
  IconFile,
  ScanArt,
} from '../icon.jsx';

export default function StepScan({ selectedPrinter, onSelectPrinter, scanning, onScan, uploading, onUpload, onNext, onBack, canContinue, dpi, onChangeDpi }) {
  const [source, setSource] = useState('scanner');
  const [files, setFiles] = useState([]);
  const [scanners, setScanners] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dpiOpen, setDpiOpen] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [printerError, setPrinterError] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileInputRef = useRef(null);
  const workspaceRef = useRef(null);

  const DPI_OPTIONS = [100, 150, 300, 600, 900, 1200];

  const onlineCount = scanners.filter((s) => s.scannable !== false && s.status === 'online').length;

  useEffect(() => {
    let cancelled = false;

    const load = async (attempt = 0) => {
      const { scanners, reachable } = await listScanners();
      if (cancelled) return;
      setScanners(scanners);
      setPrinterError(!reachable);
      setLoadingDevices(false);
      if (!reachable && attempt < 5) {
        setTimeout(() => load(attempt + 1), 1500);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const onBackdropWheel = (e) => {
      e.preventDefault();
      ws.scrollTop += e.deltaY;
    };
    const backdrops = Array.from(document.querySelectorAll('.dropdown-backdrop'));
    backdrops.forEach((b) => b.addEventListener('wheel', onBackdropWheel, { passive: false }));
    return () => {
      backdrops.forEach((b) => b.removeEventListener('wheel', onBackdropWheel));
    };
  }, [dropdownOpen, dpiOpen]);

  const handleFiles = async (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setUploadMsg(null);
    let total = 0;
    for (const f of list) {
      const r = await onUpload(f);
      if (r.ok) total += r.count;
    }
    if (total > 0) {
      setUploadMsg(`Upload successful — ${total} page${total === 1 ? '' : 's'} added`);
      setTimeout(() => onNext(), 1600);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const handleMenuWheel = (e) => {
    const menu = e.currentTarget;
    const scrollable = menu.scrollHeight > menu.clientHeight + 1;
    if (!scrollable) return;
    const atTop = menu.scrollTop <= 0;
    const atBottom = menu.scrollHeight - menu.clientHeight - menu.scrollTop < 1;
    if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) return;
    e.preventDefault();
  };

  const handleRefresh = async () => {
    setLoadingDevices(true);
    setPrinterError(false);
    const { scanners, reachable } = await listScanners(true);
    setScanners(scanners);
    setPrinterError(!reachable);
    setLoadingDevices(false);
  };

  const handleRetry = async (id) => {
    setScanners((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'connecting' } : s))
    );
    const { scanners } = await listScanners(true);
    setScanners((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const fresh = scanners.find((f) => f.id === id);
        return { ...s, status: fresh ? fresh.status : 'offline' };
      })
    );
  };

  return (
    <div className="workspace" ref={workspaceRef}>
      <div className="hero">
        <div>
          <h1>Scan &amp; Detect</h1>
          <p>Choose a source, select your scanner and start scanning pages.</p>
        </div>
        <div className="hero-art">
          <div className="blob" />
          <IconSparkleStar className="sparkle sp1" size={14} />
          <IconSparkleStar className="sparkle sp2" size={9} />
          <IconSparkleStar className="sparkle sp3" size={11} />
          <ScanArt className="hero-doc" />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="num-badge">1</div>
          <h2>Source</h2>
        </div>
        <div className="options-row">
          <div
            className={`option ${source === 'scanner' ? 'selected' : ''}`}
            onClick={() => setSource('scanner')}
          >
            {source === 'scanner' && (
              <div className="check-badge">
                <IconCheck size={11} strokeWidth={3} />
              </div>
            )}
            <div className="option-icon">
              <IconScanner size={22} strokeWidth={1.8} />
            </div>
            <div>
              <div className="option-title">Scanner</div>
              <div className="option-desc link">Scan using connected scanner</div>
            </div>
          </div>
          <div
            className={`option ${source === 'upload' ? 'selected' : ''}`}
            onClick={() => setSource('upload')}
          >
            {source === 'upload' && (
              <div className="check-badge">
                <IconCheck size={11} strokeWidth={3} />
              </div>
            )}
            <div className="option-icon upload">
              <IconUpload size={22} strokeWidth={1.8} />
            </div>
            <div>
              <div className="option-title">Upload</div>
              <div className="option-desc">Upload PDF or images</div>
            </div>
          </div>
        </div>
      </div>

      {source === 'upload' ? (
        <div className="card">
          <div className="card-head">
            <div className="num-badge">2</div>
            <h2>Upload Files</h2>
          </div>
          <div className="card-sub">
            Upload PDF, Word or image files. Supported formats: PDF, JPG, PNG, DOC, DOCX.
          </div>

          <div className="upload-zone" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              hidden
              onChange={handleFiles}
            />
            <div className="upload-zone-icon">
              <IconUpload size={26} strokeWidth={1.6} />
            </div>
            <div className="upload-zone-title">Choose files to upload</div>
            <div className="upload-zone-sub">or drag and drop PDF, Word or images here</div>
            <Button variant="outline" size="md" icon={<IconFile size={16} />} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Browse Files'}
            </Button>
          </div>

          {uploadMsg && (
            <div className="status-banner upload-ok">
              <div className="status-dot">
                <IconCheck size={11} strokeWidth={3} />
              </div>
              {uploadMsg}
            </div>
          )}

          {files.length > 0 && (
            <div className="upload-list">
              {files.map((f, i) => (
                <div className="upload-item" key={i}>
                  <IconFile size={15} />
                  <span className="upload-name">{f.name}</span>
                  <span className="upload-size">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <div className="num-badge">2</div>
            <h2>Connected Scanner</h2>
            <div className="badge-pill">
              <IconInfo size={13} />
              about
            </div>
          </div>
          <div className="card-sub">
            Detects your scanner (or all-in-one printer) and verifies it is online before scanning.
          </div>

          <div className="status-banner">
            <div className="status-dot">
              <IconCheck size={11} strokeWidth={3} />
            </div>
            {onlineCount} scanners online — ready to scan
          </div>

          <label className="field-label">Select Scanner</label>
          <div className="field-row">
            <div className="select-wrap">
              <button
                type="button"
                className="scanner-trigger"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                <IconPrinter size={16} />
                <span className={selectedPrinter ? '' : 'placeholder'}>
                  {selectedPrinter ? selectedPrinter.name : 'Select a scanner...'}
                </span>
                <IconChevronDown size={15} className={`chevron ${dropdownOpen ? 'rotated' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
                  <div className="scanner-dropdown-menu" onWheel={handleMenuWheel}>
                    {loadingDevices && (
                      <div className="printer-row empty">
                        <IconPrinter size={15} />
                        <span className="printer-name">Detecting devices...</span>
                      </div>
                    )}
                    {!loadingDevices && printerError && (
                      <div className="printer-row empty">
                        <IconPrinter size={15} />
                        <span className="printer-name">Scanner service unreachable — run npm run app</span>
                        <button
                          type="button"
                          className="retry-btn"
                          title="Retry detection"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefresh();
                          }}
                        >
                          <IconRefresh size={13} />
                        </button>
                      </div>
                    )}
                    {!loadingDevices && !printerError && scanners.length === 0 && (
                      <div className="printer-row empty">
                        <IconPrinter size={15} />
                        <span className="printer-name">No scanners detected</span>
                        <button
                          type="button"
                          className="retry-btn"
                          title="Retry detection"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefresh();
                          }}
                        >
                          <IconRefresh size={13} />
                        </button>
                      </div>
                    )}
                    {scanners.map((s) => (
                      <div
                        key={s.id}
                        className={`printer-row ${selectedPrinter?.id === s.id ? 'selected' : ''} ${s.scannable === false ? 'noscan' : ''}`}
                        onClick={() => {
                          if (s.scannable === false) return;
                          onSelectPrinter(s);
                          setDropdownOpen(false);
                        }}
                      >
                        <div className="printer-icon-box">
                          <IconRefresh size={14} />
                        </div>
                        <div className="printer-info">
                          <div className="printer-name">{s.name}</div>
                          <div className="printer-type">{s.scannable === false ? 'printer — no scanner' : s.type}</div>
                        </div>
                        <div className="printer-status">
                          <span className={`status-pill ${s.scannable === false ? 'status-noscan' : `status-${s.status}`}`}>
                            <span className="status-dot-blink" />
                            {s.scannable === false ? 'No scanner' : s.status === 'connecting' ? 'Checking...' : s.status}
                          </span>
                          {s.scannable !== false && (
                            <button
                              type="button"
                              className="retry-btn"
                              title="Retry connection"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(s.id);
                              }}
                            >
                              <IconRefresh size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="dpi-wrap select-wrap">
              <button
                type="button"
                className="scanner-trigger dpi-trigger"
                onClick={() => setDpiOpen((o) => !o)}
              >
                <IconSparkle size={16} />
                <span>{dpi} DPI</span>
                <IconChevronDown size={15} className={`chevron ${dpiOpen ? 'rotated' : ''}`} />
              </button>
              {dpiOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setDpiOpen(false)} />
                  <div className="scanner-dropdown-menu dpi-menu" onWheel={handleMenuWheel}>
                    {DPI_OPTIONS.map((d) => (
                      <div
                        key={d}
                        className={`printer-row ${dpi === d ? 'selected' : ''}`}
                        onClick={() => {
                          onChangeDpi(d);
                          setDpiOpen(false);
                        }}
                      >
                        <span className="dpi-option">{d} DPI</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<IconScanner size={16} strokeWidth={1.8} />}
              disabled={scanning || !selectedPrinter || selectedPrinter.scannable === false}
              onClick={onScan}
            >
              {scanning ? 'Scanning...' : 'Scan Pages'}
            </Button>
            <Button variant="outline" size="md" icon={<IconRefresh size={16} />} onClick={handleRefresh}>
              Refresh Devices
            </Button>
          </div>
        </div>
      )}

      <div className="footer-card">
        <div className="footer-left">
          <div className="footer-step">Step 2 of 3</div>
          <div className="progress-track">
            <div className="progress-fill p66" />
          </div>
        </div>
        <div className="footer-actions">
          <Button variant="outline" size="sm" icon={<IconArrowLeft size={15} />} onClick={onBack}>
            Back
          </Button>
          <Button variant="primary" size="sm" iconRight={<IconArrowRight size={15} />} disabled={!canContinue} onClick={onNext}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}