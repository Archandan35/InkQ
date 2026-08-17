import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import ScanOverlay from './components/ScanOverlay.jsx';
import StepWelcome from './steps/StepWelcome.jsx';
import StepScan from './steps/StepScan.jsx';
import StepReview from './steps/StepReview.jsx';
import { scanPage } from './services/scanService.js';
import { uploadDocument } from './services/uploadService.js';

const DESIGN_W = 1700;
const DESIGN_H = 796;

function useFitScale() {
  useEffect(() => {
    const apply = () => {
      const s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
      const clamped = Math.max(0.5, Math.min(1.5, s));
      document.documentElement.style.setProperty('--app-zoom', String(clamped));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
}

export default function App() {
  const [current, setCurrent] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  useFitScale();
  const [pages, setPages] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(() => {
    try {
      const raw = localStorage.getItem('inkq:lastPrinter');
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore corrupted storage */
    }
    return null;
  });
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [lastScanMs, setLastScanMs] = useState(18000);
  const [uploading, setUploading] = useState(false);
  const [dpi, setDpi] = useState(300);

  useEffect(() => {
    if (selectedPrinter) {
      localStorage.setItem('inkq:lastPrinter', JSON.stringify(selectedPrinter));
    }
  }, [selectedPrinter]);

  const maxReached = pages.length > 0 ? 3 : 2;
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const scanAbortRef = useRef(null);

  const go = (step) => {
    const target = Math.min(3, Math.max(1, step));
    const limit = pagesRef.current.length > 0 ? 3 : 2;
    if (target <= current || target <= limit) {
      setCurrent(target);
    }
  };

  const handleFinish = (startNew) => {
    if (startNew) {
      setPages([]);
      setScanDone(false);
      setSelectedPrinter(null);
    }
    setCurrent(1);
  };

  const addPage = (src) => setPages((prev) => [...prev, { id: `p-${Date.now()}-${Math.random().toString(36).slice(2)}`, src }]);

  const handleScan = async () => {
    if (scanning) return false;
    const ctrl = new AbortController();
    scanAbortRef.current = ctrl;
    setScanning(true);
    setScanDone(false);
    try {
      const { url, durationMs } = await scanPage(selectedPrinter?.name, dpi, { signal: ctrl.signal });
      addPage(url);
      if (durationMs) setLastScanMs(durationMs);
      setScanDone(true);
      await new Promise((r) => setTimeout(r, 900));
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      alert(e.message || 'Scan failed');
      return false;
    } finally {
      if (scanAbortRef.current === ctrl) scanAbortRef.current = null;
      setScanning(false);
    }
  };

  const handleScanAndReview = async () => {
    const ok = await handleScan();
    if (ok) go(3);
  };

  const cancelScan = async () => {
    if (scanAbortRef.current) {
      scanAbortRef.current.abort();
      scanAbortRef.current = null;
    }
    try {
      await fetch('/api/scan/cancel', { method: 'POST' });
    } catch {
      /* server may already be gone */
    }
    setScanning(false);
  };

  const handleReplace = async (index) => {
    if (scanning) return false;
    const ctrl = new AbortController();
    scanAbortRef.current = ctrl;
    setScanning(true);
    setScanDone(false);
    try {
      const { url, durationMs } = await scanPage(selectedPrinter?.name, dpi, { signal: ctrl.signal });
      setPages((prev) => prev.map((p, i) => (i === index ? { id: p.id, src: url } : p)));
      if (durationMs) setLastScanMs(durationMs);
      setScanDone(true);
      await new Promise((r) => setTimeout(r, 900));
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      alert(e.message || 'Scan failed');
      return false;
    } finally {
      if (scanAbortRef.current === ctrl) scanAbortRef.current = null;
      setScanning(false);
    }
  };

  const handleUpload = async (file) => {
    if (file.type.startsWith('image/')) {
      addPage(URL.createObjectURL(file));
      return { ok: true, count: 1 };
    }
    setUploading(true);
    try {
      const srcList = await uploadDocument(file);
      srcList.forEach((src) => addPage(src));
      return { ok: srcList.length > 0, count: srcList.length };
    } catch (e) {
      alert(e.message || 'Upload failed');
      return { ok: false, count: 0 };
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-stage">
      <div className="app-shell">
        <Sidebar currentStep={current} maxReached={maxReached} collapsed={collapsed} onSelect={go} />
        <div className="right">
          <Topbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
          {current === 1 && <StepWelcome onNext={() => go(2)} />}
          {current === 2 && (
            <StepScan
              selectedPrinter={selectedPrinter}
              onSelectPrinter={setSelectedPrinter}
              scanning={scanning}
              onScan={handleScanAndReview}
              uploading={uploading}
              onUpload={handleUpload}
              canContinue={pages.length > 0}
              dpi={dpi}
              onChangeDpi={setDpi}
              onBack={() => go(1)}
              onNext={() => go(3)}
            />
          )}
          {current === 3 && (
            <StepReview
              pages={pages}
              onUpdatePages={setPages}
              scanning={scanning}
              onScan={handleScan}
              onUpload={handleUpload}
              onReplace={handleReplace}
              onBack={() => go(2)}
              onFinish={handleFinish}
              collapsed={collapsed}
            />
          )}
        </div>
      </div>
      {scanning && <ScanOverlay expectedMs={lastScanMs} done={scanDone} onCancel={cancelScan} />}
    </div>
  );
}