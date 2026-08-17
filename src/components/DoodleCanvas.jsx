import React, { useEffect, useRef, useState } from 'react';

const ALPHAS = { ink: 1, pen: 1, marker: 0.6, highlight: 0.35, eraser: 1 };

export default function DoodleCanvas({ src, ann, tool, size, color, active, onSave, pos }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!active) return;
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctxRef.current = ctx;
      if (ann) {
        const a = new Image();
        a.onload = () => ctx.drawImage(a, 0, 0);
        a.src = ann;
      }
    };
    img.src = src;
  }, [src, active]);

  useEffect(() => {
    if (!active) return;
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (c && ctx && ann == null) {
      ctx.clearRect(0, 0, c.width, c.height);
    }
  }, [ann, active]);

  if (!active) return null;

  const point = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * c.width,
      y: ((e.clientY - rect.top) / rect.height) * c.height,
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
      k: rect.width / c.width,
    };
  };

  const start = (e) => {
    e.preventDefault();
    const c = canvasRef.current;
    const ctx = ctxRef.current;
    if (!c || !ctx) return;
    try { if (c.setPointerCapture) c.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    drawing.current = true;
    setPreview(null);
    const p = point(e);
    last.current = p;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = ALPHAS[tool] ?? 1;
    ctx.strokeStyle = tool === 'eraser' ? '#000' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
  };

  const move = (e) => {
    if (drawing.current) {
      const c = canvasRef.current;
      const ctx = ctxRef.current;
      if (!c || !ctx) return;
      const p = point(e);
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = ALPHAS[tool] ?? 1;
      ctx.strokeStyle = tool === 'eraser' ? '#000' : color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
    } else {
      const p = point(e);
      setPreview({ x: p.sx, y: p.sy, d: size * p.k });
    }
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const c = canvasRef.current;
    if (c) onSave(c.toDataURL('image/png'));
    setPreview(null);
  };

  const eraser = tool === 'eraser';

  return (
    <div className="doodle-layer" style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h }}>
      <canvas
        ref={canvasRef}
        className="doodle-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      {preview && (
        <div
          className={`doodle-cursor ${eraser ? 'eraser' : ''}`}
          style={{
            left: preview.x,
            top: preview.y,
            width: preview.d,
            height: preview.d,
            background: eraser ? 'rgba(255,255,255,0.45)' : color,
            borderColor: eraser ? '#111' : 'rgba(0,0,0,0.25)',
          }}
        />
      )}
    </div>
  );
}