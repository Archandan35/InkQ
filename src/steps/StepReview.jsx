import React, { useEffect, useRef, useState } from 'react';
import { sanitizeHtml } from '../services/sanitizeHtml.js';

import Button from '../components/Button.jsx';
import {
    IconCheck,
    IconPlus,
    IconMinus,
    IconExpand,
    IconRotateLeft,
    IconRotateRight,
    IconCrop,
    IconReorder,
    IconEnhance,
    IconTrash,
    IconReplace,
    IconPrint,
    IconRuler,
    IconFile,
    IconInfo,
    IconChevronDown,
    IconDownloadAll,
    IconDownload,
    IconArrowLeft,
    IconArrowRight,
    IconSparkle,
    IconScanner,
    IconBold,
    IconItalic,
    IconUnderline,
    IconAlignLeft,
    IconAlignCenter,
    IconAlignRight,
    IconAlignJustify,
    IconPalette,
    IconHighlighter,
    IconInk,
    IconPen,
    IconMarker,
    IconHighlight,
    IconEraser,
    IconUpload,
    IconPages,
    IconFileOff,
    IconMenu,
    IconX,
} from '../icon.jsx';
import { rotateImage, enhanceImage, cropImage, loadImage } from '../services/imageOps.js';
import { uploadDocument } from '../services/uploadService.js';
import { analyzeSmartSpaces } from '../services/smartSpaceService.js';
import DoodleCanvas from '../components/DoodleCanvas.jsx';
import PrintOptionsModal from '../components/PrintOptionsModal.jsx';

let expandedHolderWidth = null;
let baselineFrame = 0;


const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// The whole app is scaled inside `.app-stage` (transform: scale(--app-zoom)).
// `position: fixed` descendants are scoped to that transformed ancestor, so their
// left/top style coords are in "design px" relative to the stage's screen origin:
//   screenPos = stageRect.topLeft + stylePx * appZoom
const stageViewportPx = (screenX, screenY) => {
    const stage = document.querySelector('.app-stage');
    const appZoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1;
    const sr = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
    return {
        x: (screenX - sr.left) / appZoom,
        y: (screenY - sr.top) / appZoom,
        maxX: Math.max(8, window.innerWidth - sr.left) / appZoom,
        maxY: Math.max(8, window.innerHeight - sr.top) / appZoom,
    };
};

const RTE_TOOLS = [
    { icon: IconBold, title: 'Bold', cmd: 'bold' },
    { icon: IconItalic, title: 'Italic', cmd: 'italic' },
    { icon: IconUnderline, title: 'Underline', cmd: 'underline' },
    { sep: true },
    { icon: IconAlignLeft, title: 'Align left', cmd: 'justifyLeft' },
    { icon: IconAlignCenter, title: 'Align center', cmd: 'justifyCenter' },
    { icon: IconAlignRight, title: 'Align right', cmd: 'justifyRight' },
    { icon: IconAlignJustify, title: 'Justify', cmd: 'justifyFull' },
];

const FONT_FAMILIES = [
    { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
    { value: 'Calibri, sans-serif', label: 'Calibri' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Tahoma, sans-serif', label: 'Tahoma' },
    { value: '"Courier New", monospace', label: 'Courier New' },
];

const SIZE_PRESETS = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 30];
const MARGIN_SIDES = ['off', 'left', 'right'];
const MARGIN_PRESETS = Array.from({ length: 21 }, (_, i) => i + 5);

const TEXT_COLORS = ['#161620', '#ff0000', '#ffffff', '#eab308', '#84cc16', '#22c55e', '#0ea5e9', '#a855f7'];
const HILITE_COLORS = ['#fff176', '#fecaca', '#fde68a', '#bbf7d0', '#bfdbfe', '#f5d0fe', '#e5e7eb'];
const EXTRA_COLORS = [
    '#000000', '#1f2937', '#4b5563', '#9ca3af', '#e5e7eb',
    '#ef4444', '#dc2626', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e', '#f8fafc',
];

function SwatchRow({ colors, value, onPick, label }) {
    const [customOpen, setCustomOpen] = useState(false);
    const [hex, setHex] = useState('');

    const applyHex = () => {
        const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
        if (!m) return;
        onPick(`#${m[1].toLowerCase()}`);
        setCustomOpen(false);
    };

    return (
        <div className="rte-swatches-wrap">
            <div className="rte-swatches">
                {label && <span className="rte-label">{label}</span>}
                {colors.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`rte-swatch ${String(value).toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                        style={{ background: c }}
                        title={c}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onPick(c)}
                    />
                ))}
                <button
                    type="button"
                    className={`rte-swatch custom ${customOpen ? 'open' : ''}`}
                    title="Custom colour"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setCustomOpen((v) => !v)}
                >
                    <IconPlus size={11} strokeWidth={3} />
                </button>
            </div>
            {customOpen && (
                <div className="rte-custom">
                    <div className="rte-custom-grid">
                        {EXTRA_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`rte-swatch ${String(value).toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                                style={{ background: c }}
                                title={c}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onPick(c);
                                    setCustomOpen(false);
                                }}
                            />
                        ))}
                    </div>
                    <div className="rte-custom-row">
                        <label className="rte-custom-well" title="Pick any colour">
                            <IconPalette size={14} />
                            <input type="color" value={value || '#000000'} onChange={(e) => onPick(e.target.value)} />
                        </label>
                        <input
                            type="text"
                            className="rte-hex"
                            placeholder="#rrggbb"
                            value={hex}
                            onChange={(e) => setHex(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applyHex();
                            }}
                        />
                        <button type="button" className="rte-apply" onClick={applyHex}>
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function RichTextToolbar({ targetRef, onChange, disabled, boxId }) {
    const [textColor, setTextColor] = useState('#161620');
    const [hlColor, setHlColor] = useState('');
    const [selFont, setSelFont] = useState('Helvetica, Arial, sans-serif');
    const [selSize, setSelSize] = useState('');
    const [fmtState, setFmtState] = useState({});
    const [sizeOpen, setSizeOpen] = useState(false);
    const [colorMenu, setColorMenu] = useState(null);
    const savedRange = useRef(null);
    const toolbarRef = useRef(null);
    const sizeRef = useRef(null);
    const sizeInputRef = useRef(null);
    const fontSelectRef = useRef(null);
    const sizeAppliedRef = useRef(false);

    useEffect(() => {
        const onDoc = (e) => {
            if (colorMenu && toolbarRef.current && !toolbarRef.current.contains(e.target)) {
                setColorMenu(null);
            }
            if (sizeOpen && sizeRef.current && !sizeRef.current.contains(e.target)) {
                setSizeOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [colorMenu, sizeOpen]);

    const el = () => (!disabled ? targetRef.current : null);
    const afterChange = () => {
        if (onChange) onChange();
    };

    const rgbToHex = (c) => {
        if (!c) return '';
        const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(c);
        if (!m) return c.toLowerCase();
        const to = (n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0');
        return `#${to(m[1])}${to(m[2])}${to(m[3])}`;
    };

    const FMT_CMDS = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];

    const firstTextEl = (node) => {
        if (!node) return null;
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const t = walker.currentNode;
            if (t.nodeValue && t.nodeValue.trim()) {
                let p = t.parentElement;
                while (p && p !== node) {
                    if (p.style && (p.style.fontSize || p.style.fontFamily || p.style.color || p.style.backgroundColor)) return p;
                    p = p.parentElement;
                }
                return t.parentElement || node;
            }
        }
        return node;
    };

    const readFormat = (eNode) => {
        const computed = (elx, prop) => (elx ? getComputedStyle(elx)[prop] : '');
        const inlineVal = (elx, prop) => {
            let w = elx;
            while (w && w !== targetRef.current) {
                if (w.style && w.style[prop]) return w.style[prop];
                w = w.parentElement;
            }
            return null;
        };
        const fontSize = inlineVal(eNode, 'fontSize') || '';
        const fontFamily = inlineVal(eNode, 'fontFamily') || computed(eNode, 'fontFamily');
        const color = rgbToHex(inlineVal(eNode, 'color') || computed(eNode, 'color'));
        const bg = rgbToHex(inlineVal(eNode, 'backgroundColor') || computed(eNode, 'backgroundColor'));
        const fw = computed(eNode, 'fontWeight');
        const fs = computed(eNode, 'fontStyle');
        const td = computed(eNode, 'textDecorationLine') || computed(eNode, 'textDecoration');
        const bold = fw === 'bold' || Number(fw) >= 600 || Boolean(inlineVal(eNode, 'fontWeight'));
        const italic = fs === 'italic' || fs === 'oblique' || Boolean(inlineVal(eNode, 'fontStyle'));
        const underline = /underline/.test(td) || Boolean(inlineVal(eNode, 'textDecorationLine') || inlineVal(eNode, 'textDecoration'));
        const align = (inlineVal(eNode, 'textAlign') || computed(eNode, 'textAlign') || 'justify').toLowerCase();
        return {
            fontSize: Number.isNaN(parseFloat(fontSize)) ? null : String(parseFloat(fontSize)),
            fontFamily: fontFamily || 'Helvetica, Arial, sans-serif',
            color: color && color !== '#000000' ? color : '#161620',
            bg: bg && bg !== '#000000' ? bg : '',
            bold,
            italic,
            underline,
            align,
        };
    };

    useEffect(() => {
        const sync = () => {
            const node = el();
            if (!node) return;
            const sel = node.ownerDocument.getSelection();
            let eNode = null;
            if (sel && sel.rangeCount > 0) {
                const anchor = sel.anchorNode;
                if (anchor && node.contains(anchor.nodeType === 1 ? anchor : anchor.parentElement)) {
                    eNode = anchor.nodeType === 1 ? anchor : anchor.parentElement;
                    if (anchor.nodeType === 1) {
                        eNode = firstTextEl(eNode) || eNode;
                    }
                }
            }
            if (!eNode) return;
            const fmt = readFormat(eNode);
            const ae = node.ownerDocument.activeElement;
            const editingSize = ae === sizeInputRef.current;
            const editingFont = ae === fontSelectRef.current;
            if (!editingSize) setSelSize(fmt.fontSize != null ? fmt.fontSize : selSize);
            if (!editingFont) setSelFont(fmt.fontFamily);
            setTextColor(fmt.color);
            setHlColor(fmt.bg);
            const states = {};
            FMT_CMDS.forEach((c) => {
                if (c.startsWith('justify')) {
                    const map = {
                        justifyLeft: 'left',
                        justifyCenter: 'center',
                        justifyRight: 'right',
                        justifyFull: 'justify',
                    };
                    states[c] = fmt.align === map[c];
                } else {
                    try {
                        states[c] = Boolean(document.queryCommandState(c));
                    } catch (e) {
                        states[c] = false;
                    }
                }
            });
            states.bold = fmt.bold;
            states.italic = fmt.italic;
            states.underline = fmt.underline;
            setFmtState(states);
        };
        document.addEventListener('selectionchange', sync);
        window.addEventListener('resize', sync);
        const id = window.setTimeout(sync, 0);
        return () => {
            document.removeEventListener('selectionchange', sync);
            window.removeEventListener('resize', sync);
            window.clearTimeout(id);
        };
    }, [disabled, targetRef, boxId]);

    const cmd = (c, v) => {
        const node = el();
        if (!node) return;
        node.focus();
        document.execCommand(c, false, v);
        afterChange();
    };

    const applyInline = (style, useRange) => {
        const node = el();
        if (!node) return;
        node.focus();
        const sel = node.ownerDocument.getSelection();
        let range;
        if (useRange) {
            range = useRange;
        } else {
            if (!sel || sel.rangeCount === 0) return;
            range = sel.getRangeAt(0);
        }
        if (range.collapsed) return;
        const prop = Object.keys(style)[0];
        const span = document.createElement('span');
        Object.assign(span.style, style);
        let keptNodes = [];
        try {
            range.surroundContents(span);
            keptNodes = [span];
        } catch (e) {
            const nodes = [];
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                if (range.intersectsNode(walker.currentNode)) nodes.push(walker.currentNode);
            }
            const created = [];
            nodes.forEach((n) => {
                const s = document.createElement('span');
                Object.assign(s.style, style);
                n.parentNode.insertBefore(s, n);
                s.appendChild(n);
                created.push(s);
            });
            keptNodes = created;
        }
        keptNodes.forEach((k) => {
            const descendants = k.querySelectorAll('*');
            for (const d of descendants) {
                if (d.style) d.style[prop] = '';
            }
        });
        if (keptNodes.length) {
            const r = document.createRange();
            if (keptNodes.length > 1) {
                r.setStartBefore(keptNodes[0]);
                r.setEndAfter(keptNodes[keptNodes.length - 1]);
            } else {
                r.selectNodeContents(keptNodes[0]);
            }
            sel.removeAllRanges();
            sel.addRange(r);
        }
        afterChange();
    };

    const transformCase = (mode) => {
        const node = el();
        if (!node) return;
        node.focus();
        const sel = node.ownerDocument.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (range.collapsed) return;
        const frag = range.cloneContents();
        const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT);
        const targets = [];
        let n;
        while ((n = walker.nextNode())) targets.push(n);
        if (!targets.length) return;
        targets.forEach((t) => {
            t.nodeValue = mode === 'upper' ? t.nodeValue.toUpperCase() : t.nodeValue.toLowerCase();
        });
        range.deleteContents();
        range.insertNode(frag);
        afterChange();
    };

    const pickTextColor = (c) => {
        setTextColor(c);
        cmd('foreColor', c);
    };

    const pickHlColor = (c) => {
        setHlColor(c);
        cmd('hiliteColor', c);
    };

    const saveRange = () => {
        const node = el();
        if (!node) return;
        const sel = node.ownerDocument.getSelection();
        if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
    };

    const restoreRange = () => {
        const node = el();
        if (!node) return;
        node.focus();
        const sel = node.ownerDocument.getSelection();
        if (savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };

    const applySizeVal = (n) => {
        const clamped = Math.min(30, Math.max(1, n));
        setSelSize(String(clamped));
        const node = el();
        if (!node) return;
        const saved = savedRange.current && !savedRange.current.collapsed ? savedRange.current : null;
        if (saved) {
            applyInline({ fontSize: `${clamped}px` }, saved);
        } else {
            restoreRange();
            applyInline({ fontSize: `${clamped}px` });
        }
    };

    const applySize = () => {
        const n = parseFloat(String(selSize).trim());
        if (Number.isNaN(n)) return;
        applySizeVal(n);
    };

    if (disabled) {
        return (
            <div className="rte-toolbar rte-sidebar rte-empty">
                <span>Select a smart box on the page, then pick text inside it to format (colour, size, font...).</span>
            </div>
        );
    }

    return (
        <div ref={toolbarRef} className="rte-toolbar rte-sidebar">
            <div className="rte-row">
                {RTE_TOOLS.map((t, i) =>
                    t.sep ? (
                        <span key={i} className="rte-sep" />
                    ) : (
                        <button
                            key={i}
                            type="button"
                            className={`rte-btn ${fmtState[t.cmd] ? 'active' : ''}`}
                            title={t.title}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => cmd(t.cmd)}
                        >
                            <t.icon size={15} />
                        </button>
                    )
                )}
                <select
                    ref={fontSelectRef}
                    className="rte-size"
                    title="Font family"
                    value={selFont}
                    onMouseDown={saveRange}
                    onChange={(e) => {
                        if (!e.target.value) return;
                        setSelFont(e.target.value);
                        restoreRange();
                        applyInline({ fontFamily: e.target.value });
                    }}
                >
                    <option value="" disabled>
                        Font
                    </option>
                    {FONT_FAMILIES.map((f) => (
                        <option key={f.label} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>
                <div className="rte-size-wrap" ref={sizeRef}>
                    <input
                        ref={sizeInputRef}
                        type="number"
                        className="rte-size-input"
                        title="Font size (px)"
                        min="1"
                        max="30"
                        step="0.1"
                        value={selSize}
                        placeholder="12"
                        onMouseDown={saveRange}
                        onChange={(e) => setSelSize(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                sizeAppliedRef.current = true;
                                applySize();
                                e.target.blur();
                            }
                        }}
                        onBlur={() => {
                            const node = el();
                            const saved = savedRange.current;
                            if (sizeAppliedRef.current) {
                                sizeAppliedRef.current = false;
                            } else {
                                applySize();
                            }
                            if (node && saved && !saved.collapsed) {
                                requestAnimationFrame(() => {
                                    const sel = node.ownerDocument.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(saved);
                                    node.focus();
                                });
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="rte-size-caret"
                        title="Presets"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            saveRange();
                        }}
                        onClick={() => {
                            saveRange();
                            setSizeOpen((v) => !v);
                        }}
                    >
                        <IconChevronDown size={13} />
                    </button>
                    {sizeOpen && (
                        <div
                            className="rte-size-menu"
                            onMouseDown={(e) => e.preventDefault()}
                            onPointerDown={(e) => e.preventDefault()}
                        >
                            {SIZE_PRESETS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`rte-size-option ${String(Number(selSize)) === String(s) ? 'active' : ''}`}
                                    title={`${s} px`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        setSelSize(String(s));
                                        setSizeOpen(false);
                                        applySizeVal(s);
                                    }}
                                >
                                    {s} px
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="rte-btn"
                    title="Convert to UPPERCASE"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => transformCase('upper')}
                >
                    <span className="rte-case">Aa</span>
                </button>
                <button
                    type="button"
                    className="rte-btn"
                    title="Convert to lowercase"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => transformCase('lower')}
                >
                    <span className="rte-case lower">aa</span>
                </button>
            </div>
            <div className="rte-row">
                <button
                    type="button"
                    className={`rte-color-menu ${colorMenu === 'text' ? 'open' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setColorMenu(colorMenu === 'text' ? null : 'text')}
                >
                    <IconPalette size={14} />
                    Text colour
                </button>
                <button
                    type="button"
                    className={`rte-color-menu ${colorMenu === 'highlight' ? 'open' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setColorMenu(colorMenu === 'highlight' ? null : 'highlight')}
                >
                    <IconHighlighter size={14} />
                    Highlight
                </button>
            </div>
            {colorMenu && (
                <div className="rte-row rte-color-panel">
                    {colorMenu === 'text' ? (
                        <SwatchRow
                            label="Text colour"
                            colors={TEXT_COLORS}
                            value={textColor}
                            onPick={pickTextColor}
                        />
                    ) : (
                        <SwatchRow
                            label="Highlight"
                            colors={HILITE_COLORS}
                            value={hlColor}
                            onPick={pickHlColor}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function SpaceContent({ space, onChange, contentRef, editorOpen }) {
    const ref = useRef(null);
    const pointerRef = useRef(null);

    useEffect(() => {
        const clean = (space.text || '').replace(/font-size\s*:\s*12(?:\.0+)?px/gi, '');
        const node = ref.current;
        if (!node || node.innerHTML === clean) return;
        const sel = node.ownerDocument.getSelection();
        const editing = node === node.ownerDocument.activeElement || (sel && sel.rangeCount > 0 && node.contains(sel.anchorNode));
        if (editing) return;
        node.innerHTML = sanitizeHtml(clean);
    }, [space.text]);

    const stripPasteBackgrounds = (html) => {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const el of nodes) {
            if (el.style) {
                el.style.removeProperty('background-color');
                el.style.removeProperty('background');
                el.style.removeProperty('background-image');
            }
            if (el.tagName === 'MARK') {
                const parent = el.parentNode;
                if (parent) {
                    while (el.firstChild) parent.insertBefore(el.firstChild, el);
                    parent.removeChild(el);
                }
            }
        }
        for (const el of nodes) {
            if (!el.isConnected) continue;
            if (el.style && el.getAttribute('style') === '') el.removeAttribute('style');
            if (!el.hasAttributes() && !el.childNodes.length) el.remove();
        }
        return tpl.innerHTML;
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData;
        const html = data ? data.getData('text/html') : '';
        const text = data ? data.getData('text/plain') : '';
        const node = ref.current;
        if (!node) return;
        node.focus();
        if (html && html.trim()) {
            const safe = sanitizeHtml(stripPasteBackgrounds(html));
            document.execCommand('insertHTML', false, safe);
            onChange(space.id, { text: sanitizeHtml(node.innerHTML), dirty: true });
            return;
        }
        if (!text) return;
        const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        document.execCommand('insertHTML', false, `<span style="color:#84cc16">${safeText}</span>`);
        onChange(space.id, { text: sanitizeHtml(node.innerHTML), dirty: true });
    };

    return (
        <div
            ref={(node) => {
                ref.current = node;
                if (contentRef) contentRef.current = node;
            }}
            className="space-content"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange(space.id, { text: sanitizeHtml(e.currentTarget.innerHTML), dirty: true })}
            onPaste={handlePaste}
            onPointerDown={(e) => {
                e.stopPropagation();
                pointerRef.current = { x: e.clientX, y: e.clientY, dragged: false };
            }}
            onPointerUp={(e) => {
                const p = pointerRef.current;
                if (p) {
                    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 4) p.dragged = true;
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                const p = pointerRef.current;
                const dragged = p ? p.dragged : false;
                pointerRef.current = null;
                const sel = e.currentTarget.ownerDocument.getSelection();
                if (editorOpen) {
                    if (!dragged && sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) e.preventDefault();
                } else if (!dragged && sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed && ref.current.contains(sel.anchorNode)) {
                    sel.removeAllRanges();
                }
            }}
            onMouseUp={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                e.stopPropagation();
                if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
                    e.preventDefault();
                    const node = ref.current;
                    if (node) {
                        const r = document.createRange();
                        r.selectNodeContents(node);
                        const sel = node.ownerDocument.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(r);
                    }
                }
            }}
        />
    );
}

export default function StepReview({ pages, onUpdatePages, scanning, onScan, onUpload, onReplace, onBack, onFinish, collapsed }) {
    const [selected, setSelected] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [busy, setBusy] = useState(false);
    const [cropMode, setCropMode] = useState(false);
    const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
    const [manualMode, setManualMode] = useState(false);
    const [manualBox, setManualBox] = useState({ x: 10, y: 10, w: 80, h: 20 });
    const [reorderMode, setReorderMode] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [replaceMenuOpen, setReplaceMenuOpen] = useState(false);
    const [marginSize, setMarginSize] = useState(15);
    const [marginUnit, setMarginUnit] = useState('mm');
    const [marginSide, setMarginSide] = useState('left');
    const [applyAll, setApplyAll] = useState(true);
    const [pageMargins, setPageMargins] = useState({});
    const [marginMenuOpen, setMarginMenuOpen] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const addMenuRef = useRef(null);
    const addInputRef = useRef(null);
    const marginFieldRef = useRef(null);
    const docWidthsRef = useRef({});
    const replaceMenuRef = useRef(null);
    const replaceInputRef = useRef(null);

    const [spaces, setSpaces] = useState([]);
    const [detecting, setDetecting] = useState(false);
    const [detectStatus, setDetectStatus] = useState('Not started');
    const [minHeight, setMinHeight] = useState(4);
    const [activeSpaceId, setActiveSpaceId] = useState(null);
    const [spaceEditor, setSpaceEditor] = useState(null);
    const [stage, setStage] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [fitScale, setFitScale] = useState(1);
    const [doodleTool, setDoodleTool] = useState(null);
    const [doodleSize, setDoodleSize] = useState(3);
    const [doodleColor, setDoodleColor] = useState('#161620');
    const [scaleMode, setScaleMode] = useState(false);
    const [printOpen, setPrintOpen] = useState(false);
    const [exportAsk, setExportAsk] = useState(null);
    const [finishOpen, setFinishOpen] = useState(false);

    const prevLen = useRef(pages.length);
    const [bannerVisible, setBannerVisible] = useState(true);
    const dragRef = useRef(null);
    const manualDragRef = useRef(null);
    const spaceDragRef = useRef(null);
    const editorDragRef = useRef(null);
    const holderRef = useRef(null);
    const imgRef = useRef(null);
    const exportRef = useRef(null);
    // expandedHolderWidth stored in module scope to survive unmount/remount
    const activeSpaceRef = useRef(null);
    const selectionGuardRef = useRef(null);
    const lastGoodRef = useRef(null);
    const pointerStartRef = useRef(null);
    const pendingRestoreRef = useRef(null);
    const pendingTimerRef = useRef(null);
    const spaceEditorRef = useRef(spaceEditor);
    spaceEditorRef.current = spaceEditor;

    const total = pages.length;
    const safeSelected = total ? Math.min(selected, total) : 1;
    const idx = safeSelected - 1;
    const currentSpaces = spaces
      .filter((s) => s.pageId === pages[idx]?.id)
      .sort((a, b) => a.y - b.y);
    const spaceEditorBox = spaceEditor ? currentSpaces.find((s) => s.id === spaceEditor.id) : null;
    const pageMargin = pageMargins[pages[idx]?.id];
    const side = applyAll ? marginSide : (pageMargin?.side ?? marginSide);
    const unit = applyAll ? marginUnit : (pageMargin?.unit ?? marginUnit);
    const size = applyAll ? marginSize : (pageMargin?.size ?? marginSize);
    const physWcm = stage.w >= stage.h ? 29.7 : 21;
    const pxPerCm = stage.w > 0 ? stage.w / physWcm : 0;
    const scaleCm = pxPerCm;
    const scaleMm = pxPerCm / 10;
    const scaleXTicks = scaleCm > 0 ? Array.from({ length: Math.round(stage.w / scaleCm) + 1 }, (_, i) => i * scaleCm) : [];
    const scaleYTicks = scaleCm > 0 ? Array.from({ length: Math.round(stage.h / scaleCm) + 1 }, (_, i) => i * scaleCm) : [];
    const scaleXHalves = scaleCm > 0 && scaleXTicks.length > 1 ? Array.from({ length: scaleXTicks.length - 1 }, (_, i) => scaleXTicks[i] + scaleCm / 2) : [];
    const scaleYHalves = scaleCm > 0 && scaleYTicks.length > 1 ? Array.from({ length: scaleYTicks.length - 1 }, (_, i) => scaleYTicks[i] + scaleCm / 2) : [];
    const sizePx = unit === 'mm' ? size * 0.1 * pxPerCm : size * pxPerCm;
    const mL = side === 'left' ? sizePx : 0;
    const mR = side === 'right' ? sizePx : 0;

    const setMarginForCurrent = (nextSide, nextSize, nextUnit) => {
        const id = pages[idx]?.id;
        const u = nextUnit ?? unit;
        if (applyAll) {
            setMarginSide(nextSide);
            setMarginSize(nextSize);
            setMarginUnit(u);
        } else if (id) {
            setPageMargins((prev) => ({ ...prev, [id]: { side: nextSide, size: nextSize, unit: u } }));
        }
    };

    const closeSpaceEditor = () => {
        setSpaceEditor(null);
    };

    const startEditorDrag = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        if (!spaceEditor) return;
        editorDragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: spaceEditor.x,
            origY: spaceEditor.y,
        };
    };

    useEffect(() => {
        if (!spaceEditor) return;
        const isControl = (ae) => ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT');
        const focusAndRestore = (node, range) => {
            node.focus();
            const s2 = node.ownerDocument.getSelection();
            s2.removeAllRanges();
            s2.addRange(range);
        };
        const pointInside = (node, range, x, y) => {
            const doc = node.ownerDocument;
            const caret = doc.caretRangeFromPoint ? doc.caretRangeFromPoint(x, y) : null;
            if (!caret || !range) return false;
            return range.comparePoint(caret.startContainer, caret.startOffset) === 0;
        };
        const clearPending = () => {
            if (pendingTimerRef.current) {
                clearTimeout(pendingTimerRef.current);
                pendingTimerRef.current = null;
            }
            pendingRestoreRef.current = null;
        };
        const onPointerDown = (e) => {
            pointerStartRef.current = { x: e.clientX, y: e.clientY };
            clearPending();
            let range = null;
            const node = activeSpaceRef.current;
            if (node) {
                const sel = node.ownerDocument.getSelection();
                if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
                    range = sel.getRangeAt(0).cloneRange();
                }
            }
            selectionGuardRef.current = { inContent: !!(e.target && e.target.closest && e.target.closest('.space-content')), range };
        };
        const onPointerUp = (e) => {
            const start = pointerStartRef.current;
            pointerStartRef.current = null;
            if (!start) return;
            const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4;
            if (moved) return;
            const node = activeSpaceRef.current;
            const good = lastGoodRef.current;
            if (!node || !spaceEditorRef.current) return;
            const doc = node.ownerDocument;
            if (isControl(doc.activeElement)) return;
            if (good && !good.collapsed && pointInside(node, good, e.clientX, e.clientY)) {
                pendingRestoreRef.current = { x: e.clientX, y: e.clientY };
                pendingTimerRef.current = setTimeout(clearPending, 500);
            }
        };
        const onSelectionChange = () => {
            const node = activeSpaceRef.current;
            if (!node || !spaceEditorRef.current) return;
            const doc = node.ownerDocument;
            const sel = doc.getSelection();
            const hasSel = !!(sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed);
            if (hasSel && node.contains(sel.anchorNode)) {
                lastGoodRef.current = sel.getRangeAt(0).cloneRange();
            }
            const pending = pendingRestoreRef.current;
            if (pending) {
                pendingRestoreRef.current = null;
                if (pendingTimerRef.current) {
                    clearTimeout(pendingTimerRef.current);
                    pendingTimerRef.current = null;
                }
                if (!hasSel && !isControl(doc.activeElement)) {
                    const good = lastGoodRef.current;
                    if (good && !good.collapsed && pointInside(node, good, pending.x, pending.y)) {
                        const r = good;
                        requestAnimationFrame(() => {
                            if (!spaceEditorRef.current) return;
                            focusAndRestore(node, r);
                        });
                        return;
                    }
                }
            }
            const g = selectionGuardRef.current;
            if (!g || !g.range || g.inContent) return;
            if (hasSel) return;
            if (isControl(doc.activeElement)) return;
            requestAnimationFrame(() => {
                if (!spaceEditorRef.current) return;
                focusAndRestore(node, g.range);
            });
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('pointerup', onPointerUp, true);
        document.addEventListener('selectionchange', onSelectionChange);
        return () => {
            clearPending();
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('pointerup', onPointerUp, true);
            document.removeEventListener('selectionchange', onSelectionChange);
        };
    }, [spaceEditor]);

    useEffect(() => {
        if (pages.length > prevLen.current && pages.length > 0) {
            setSelected(pages.length);
        }
        prevLen.current = pages.length;
    }, [pages.length]);

    useEffect(() => {
        setBannerVisible(true);
        const t = setTimeout(() => setBannerVisible(false), 5000);
        return () => clearTimeout(t);
    }, [pages.length]);

    useEffect(() => {
        const ids = new Set(pages.map((p) => p.id));
        setSpaces((prev) => prev.filter((s) => ids.has(s.pageId)));
    }, [pages]);

    useEffect(() => {
        setActiveSpaceId(spaces.find((s) => s.pageId === pages[idx]?.id)?.id || null);
        setSpaceEditor(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    useEffect(() => {
        const onDoc = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
            if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setAddOpen(false);
            if (marginFieldRef.current && !marginFieldRef.current.contains(e.target)) setMarginMenuOpen(false);
            if (replaceMenuRef.current && !replaceMenuRef.current.contains(e.target)) setReplaceMenuOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    useEffect(() => {
        if (!dragRef.current) return;
        const move = (e) => {
            const d = dragRef.current;
            const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
            const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
            let { x, y, w, h } = d.orig;
            if (d.type === 'move') {
                x = clamp(d.orig.x + dx, 0, 100 - d.orig.w);
                y = clamp(d.orig.y + dy, 0, 100 - d.orig.h);
            } else {
                w = clamp(d.orig.w + dx, 5, 100 - d.orig.x);
                h = clamp(d.orig.h + dy, 5, 100 - d.orig.y);
            }
            setCropBox({ x, y, w, h });
        };
        const up = () => {
            dragRef.current = null;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [cropMode, selected, zoom]);

    useEffect(() => {
        if (!manualMode) return;
        const move = (e) => {
            const d = manualDragRef.current;
            if (!d) return;
            const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
            const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
            let { x, y, w, h } = d.orig;
            if (d.type === 'move') {
                x = clamp(d.orig.x + dx, 0, 100 - d.orig.w);
                y = clamp(d.orig.y + dy, 0, 100 - d.orig.h);
            } else {
                w = clamp(d.orig.w + dx, 5, 100 - d.orig.x);
                h = clamp(d.orig.h + dy, 5, 100 - d.orig.y);
            }
            setManualBox({ x, y, w, h });
        };
        const up = () => {
            manualDragRef.current = null;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [manualMode, selected, zoom]);

    useEffect(() => {
        const measure = () => {
            const holder = holderRef.current;
            const img = imgRef.current;
            if (!holder || !img) {
                setStage({ x: 0, y: 0, w: 0, h: 0 });
                return;
            }
            const s = (zoom / 100) * fitScale * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1);
            const hr = holder.getBoundingClientRect();
            const ir = img.getBoundingClientRect();
            const w = ir.width / s;
            const h = ir.height / s;
            const pageId = pages[idx]?.id;
            if (pageId && w > 0) docWidthsRef.current[pageId] = w;
            setStage({
                x: (ir.left - hr.left) / s,
                y: (ir.top - hr.top) / s,
                w,
                h,
            });
        };
        measure();
        const holder = holderRef.current;
        if (!holder) return;
        const ro = new ResizeObserver(measure);
        ro.observe(holder);
        return () => ro.disconnect();
    }, [pages[idx]?.src, selected, zoom, cropMode, fitScale]);

    // Document coordinate freeze. Sidebar collapse must not resize the Space-Box:
    // the holder's layout width is pinned to the stable expanded width so the
    // page image/stage/boxes keep identical document dimensions (the real font
    // size and document formatting are never touched). This is NOT the viewer
    // presentation: the page is visually scaled to fill the extra space by the
    // fitScale transform below, so collapsing never leaves empty area around
    // the page while the document coordinate system stays invariant.
    // Width stored in module scope to survive component unmount/remount on collapse.
    // The baseline is captured only once the layout is genuinely expanded and
    // stable (rAF until the width stays continuously equal for 250ms) — never
    // mid-transition: during the collapse->expand transition the container
    // briefly stays at the wide collapsed width (observed: transiently 881px,
    // settles to 602px) and capturing that would corrupt the baseline for every
    // later collapse cycle. A plain "two equal readings" check is insufficient
    // because the pre-reflow value can be stationary long enough to satisfy it.
    useEffect(() => {
        const h = holderRef.current;
        if (!h) return;
        if (collapsed) {
            cancelAnimationFrame(baselineFrame);
            if (expandedHolderWidth != null) {
                h.style.setProperty('max-width', `${expandedHolderWidth}px`, 'important');
            }
            return;
        }
        h.style.removeProperty('max-width');
        cancelAnimationFrame(baselineFrame);
        let last = null;
        let stableSince = null;
        const tick = () => {
            const el = holderRef.current;
            const cols = document.querySelector('.columns');
            if (!el || (cols && cols.classList.contains('collapsed'))) return;
            const w = el.offsetWidth;
            const now = performance.now();
            if (w === last) {
                if (stableSince == null) stableSince = now;
                if (now - stableSince >= 250) {
                    expandedHolderWidth = w;
                    return;
                }
            } else {
                last = w;
                stableSince = null;
            }
            baselineFrame = requestAnimationFrame(tick);
        };
        baselineFrame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(baselineFrame);
    }, [collapsed, pages[idx]?.src, selected, zoom]);

    // Presentation-only zoom-to-fit. The document layout is frozen (see above),
    // so when the sidebar collapses and the viewer canvas gets wider/taller, the
    // page preview is uniformly scaled (with the Space-Box overlay and text) to
    // use the newly available space without leaving a large empty area. This is
    // a pure viewer transform: stage/document coordinates, box percentages, font
    // size, wrapping, capacity and print scale are all untouched (stage.w is
    // invariant because the measure effect divides by fitScale too).
    useEffect(() => {
        const compute = () => {
            const canvas = document.querySelector('.viewer-canvas');
            const h = holderRef.current;
            if (!canvas || !h || h.offsetWidth <= 0 || h.offsetHeight <= 0) return;
            const cs = getComputedStyle(canvas);
            const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
            const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
            const availW = canvas.clientWidth - padX;
            const availH = canvas.clientHeight - padY;
            if (availW <= 0 || availH <= 0) return;
            const scale = Math.max(1, Math.min(availW / h.offsetWidth, availH / h.offsetHeight));
            setFitScale((prev) => (Math.abs(prev - scale) < 0.001 ? prev : scale));
        };
        compute();
        const canvas = document.querySelector('.viewer-canvas');
        if (!canvas) return;
        const ro = new ResizeObserver(compute);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [collapsed, pages[idx]?.src]);

    useEffect(() => {
        const move = (e) => {
            const d = spaceDragRef.current;
            if (!d) return;
            const lw = d.rect.width / d.scale;
            const lh = d.rect.height / d.scale;
            const dx = (e.clientX - d.startX) / lw;
            const dy = (e.clientY - d.startY) / lh;
            let { x, y, w, h } = d.orig;
            if (d.type === 'move') {
                x = clamp(d.orig.x + dx, 0, 1 - d.orig.w);
                y = clamp(d.orig.y + dy, 0, 1 - d.orig.h);
            } else {
                if (d.snapSide === 'left') {
                    w = clamp(d.orig.w + dx, 0.05, 1);
                    x = 0;
                } else if (d.snapSide === 'right') {
                    w = clamp(d.orig.w + dx, 0.05, 1);
                    x = 1 - w;
                } else {
                    w = clamp(d.orig.w + dx, 0.05, 1 - d.orig.x);
                }
                h = clamp(d.orig.h + dy, 0.05, 1 - d.orig.y);
            }
            setSpaces((prev) => prev.map((s) => (s.id === d.id ? { ...s, x, y, width: w, height: h } : s)));
        };
        const up = () => {
            spaceDragRef.current = null;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, []);

    useEffect(() => {
        const move = (e) => {
            const d = editorDragRef.current;
            if (!d) return;
            const appZoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1;
            const ed = document.querySelector('.space-editor');
            const edW = ed ? ed.offsetWidth : 340;
            const edH = ed ? ed.offsetHeight : 120;
            const p = stageViewportPx(e.clientX, e.clientY);
            const x = clamp(d.origX + (e.clientX - d.startX) / appZoom, 8, Math.max(8, p.maxX - edW));
            const y = clamp(d.origY + (e.clientY - d.startY) / appZoom, 8, Math.max(8, p.maxY - edH));
            setSpaceEditor((prev) => (prev ? { ...prev, x, y } : prev));
        };
        const up = () => {
            editorDragRef.current = null;
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, []);

    const SUMMARY = [
        { icon: IconFile, cls: 'purple', num: total, label: 'Total Pages' },
        { icon: IconFile, cls: 'grey', num: total, label: 'Detected Pages' },
        { icon: IconFile, cls: 'orange', num: 0, label: 'Blank Pages' },
        { icon: IconSparkle, cls: 'red', num: 0, label: 'Low Quality Pages' },
    ];

    const updateSpace = (id, patch) => setSpaces((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

    const deleteSpace = (id) => {
        setSpaces((prev) => prev.filter((s) => s.id !== id));
        if (activeSpaceId === id) setActiveSpaceId(null);
    };

    const applyFormat = () => {
        const node = activeSpaceRef.current;
        if (!node || !activeSpaceId) return;
        updateSpace(activeSpaceId, { text: sanitizeHtml(node.innerHTML), dirty: true });
    };

    const startSpaceDrag = (type, id, e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const space = spaces.find((s) => s.id === id);
        if (!space || !holderRef.current) return;
        if (type === 'move') setSpaces((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: false } : s)));
        const rect = holderRef.current.getBoundingClientRect();
        const appZoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1;
        const snapSide = side !== 'off' && space.pinned !== false ? side : null;
        spaceDragRef.current = {
            type,
            id,
            startX: e.clientX,
            startY: e.clientY,
            orig: { x: space.x, y: space.y, w: space.width, h: space.height },
            rect,
            scale: (zoom / 100) * appZoom,
            snapSide,
        };
    };

    const handleDetect = async () => {
        if (!total || detecting || busy) return;
        setDetecting(true);
        setDetectStatus(`Analyzing ${total} page${total === 1 ? '' : 's'} in the background...`);
        try {
            const results = await analyzeSmartSpaces(pages.map((p) => p.src), { minHeightCm: minHeight });
            const boxes = [];
            results.forEach((page) => {
                page.spaces.forEach((sp, i) => {
                    boxes.push({
                        id: `sp-${page.pageIndex}-${i + 1}`,
                        pageId: pages[page.pageIndex].id,
                        label: `Box ${i + 1}`,
                        x: sp.x,
                        y: sp.y,
                        width: sp.width,
                        height: sp.height,
                        physicalWidth: sp.physicalWidth,
                        physicalHeight: sp.physicalHeight,
                        confidence: sp.confidence,
                        dpi: page.dpi,
                        sourceImageDimensions: page.sourceImageDimensions,
                        analysisDimensions: page.analysisDimensions,
                        text: '',
                        dirty: false,
                    });
                });
            });
            setSpaces(boxes);
            if (boxes.length === 0) {
                setDetectStatus(`No qualifying smart spaces found (min ${minHeight} cm).`);
            } else {
                const pagesWith = results.filter((r) => r.spaces.length).length;
                setDetectStatus(`${boxes.length} smart space${boxes.length === 1 ? '' : 's'} detected across ${pagesWith} page${pagesWith === 1 ? '' : 's'}.`);
            }
        } catch (e) {
            setDetectStatus('Detection failed — please try again.');
        } finally {
            setDetecting(false);
        }
    };

    const updatePageAt = (index, newSrc) => {
        onUpdatePages((prev) => prev.map((p, i) => (i === index ? { ...p, src: newSrc } : p)));
    };

    const startCropDrag = (type, e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = holderRef.current.getBoundingClientRect();
        dragRef.current = { type, startX: e.clientX, startY: e.clientY, orig: { ...cropBox }, rect };
    };

    const enterCrop = () => {
        if (!total) return;
        setZoom(100);
        setCropBox({ x: 10, y: 10, w: 80, h: 80 });
        setDoodleTool(null);
        setScaleMode(false);
        setCropMode(true);
    };

    const applyCrop = async () => {
        if (!total) return;
        setBusy(true);
        try {
            const img = await loadImage(pages[idx].src);
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            const box = {
                x: (cropBox.x / 100) * natW,
                y: (cropBox.y / 100) * natH,
                w: (cropBox.w / 100) * natW,
                h: (cropBox.h / 100) * natH,
            };
            const newSrc = await cropImage(pages[idx].src, box);
            updatePageAt(idx, newSrc);
            setCropMode(false);
            setCropBox({ x: 10, y: 10, w: 80, h: 80 });
        } catch (e) {
            alert('Crop failed');
        } finally {
            setBusy(false);
        }
    };

    const cancelCrop = () => {
        setCropMode(false);
        setCropBox({ x: 10, y: 10, w: 80, h: 80 });
    };

    const enterManual = () => {
        if (!total) return;
        setZoom(100);
        setCropMode(false);
        setDoodleTool(null);
        setScaleMode(false);
        setManualBox({ x: 10, y: 10, w: 80, h: 20 });
        setManualMode(true);
    };

    const cancelManual = () => {
        setManualMode(false);
    };

    const toggleScale = () => {
        const next = !scaleMode;
        setScaleMode(next);
        if (next) {
            setCropMode(false);
            setManualMode(false);
            setDoodleTool(null);
        }
    };

    const startManualDrag = (type, e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = holderRef.current.getBoundingClientRect();
        manualDragRef.current = { type, startX: e.clientX, startY: e.clientY, orig: { ...manualBox }, rect };
    };

    const applyManual = () => {
        if (!total) return;
        const count = spaces.filter((s) => s.pageId === pages[idx].id).length + 1;
        const mbox = {
            id: `manual-${Date.now()}`,
            pageId: pages[idx].id,
            label: `Box ${count}`,
            x: manualBox.x / 100,
            y: manualBox.y / 100,
            width: manualBox.w / 100,
            height: manualBox.h / 100,
            physicalWidth: +((manualBox.w / 100) * 21).toFixed(2),
            physicalHeight: +((manualBox.h / 100) * 29.7).toFixed(2),
            confidence: 1,
            manual: true,
            text: '',
            dirty: false,
        };
        setSpaces((prev) => [...prev, mbox]);
        setActiveSpaceId(mbox.id);
        setManualMode(false);
        setDetectStatus(`Manual smart space added (${mbox.physicalWidth} × ${mbox.physicalHeight} cm).`);
    };

    const handleRotate = async (deg) => {
        if (!total || busy) return;
        setBusy(true);
        try {
            const newSrc = await rotateImage(pages[idx].src, deg);
            updatePageAt(idx, newSrc);
        } catch (e) {
            alert('Rotate failed');
        } finally {
            setBusy(false);
        }
    };

    const handleEnhance = async () => {
        if (!total || busy) return;
        setBusy(true);
        try {
            const newSrc = await enhanceImage(pages[idx].src);
            updatePageAt(idx, newSrc);
        } catch (e) {
            alert('Enhance failed');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = () => handleDeleteAt(idx);

    const handleDeleteAt = (i) => {
        if (!total) return;
        const newPages = pages.filter((_, j) => j !== i);
        onUpdatePages(newPages);
        setSelected((s) => {
            const shifted = s - (i < s - 1 ? 0 : 1);
            return Math.min(Math.max(1, shifted), Math.max(1, newPages.length));
        });
    };

    const handleReorder = (from, to) => {
        if (from === to) return;
        onUpdatePages((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
        setSelected(to + 1);
    };

    const moveSelected = (dir) => {
        const to = idx + dir;
        if (to < 0 || to >= total) return;
        handleReorder(idx, to);
    };

    const runExportMode = async (mode) => {
        const kind = exportAsk;
        setExportAsk(null);
        if (!kind || !total) return;
        setBusy(true);
        setExportOpen(false);
        try {
            const svc = await import('../services/exportService.js');
            const margin = { side, size, unit };
            if (kind === 'pdf') await svc.exportPDF(pages, spaces, mode, margin);
            else if (kind === 'png' || kind === 'jpeg') await svc.exportImages(pages, spaces, kind, mode, margin);
            else if (kind === 'doc') await svc.exportDoc(pages, spaces, mode, margin);
            else if (kind === 'docx') await svc.exportDocx(pages, spaces, mode, margin);
            else if (kind === 'zip') await svc.exportZip(pages, spaces, mode, margin);
        } catch (e) {
            alert('Export failed');
        } finally {
            setBusy(false);
        }
    };

    const runPrint = async (mode) => {
        if (!total) return;
        setBusy(true);
        setPrintOpen(false);
        try {
            const svc = await import('../services/printService.js');
            const appZoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1;
            const ref = { widths: docWidthsRef.current, displayW: stage.w || 0, appZoom };
            const margin = { side, size, unit };
            if (mode === 'scanned') await svc.printScannedOnly(pages);
            else if (mode === 'whole') await svc.printWholePage(pages, spaces, ref, margin);
            else if (mode === 'blocks') await svc.printSmartBlocks(pages, spaces, ref, margin);
        } catch (e) {
            alert('Print failed');
        } finally {
            setBusy(false);
        }
    };

    const PAGE_OPTIONS = [
        { label: 'Rescan', icon: IconScanner, onClick: () => onReplace(idx), disabled: scanning },
        { label: 'Rotate Left', icon: IconRotateLeft, onClick: () => handleRotate(-90) },
        { label: 'Rotate Right', icon: IconRotateRight, onClick: () => handleRotate(90) },
        { label: 'Crop', icon: IconCrop, onClick: enterCrop, active: cropMode },
        { label: 'Reorder', icon: IconReorder, onClick: () => setReorderMode((v) => !v), active: reorderMode },
        { label: 'Enhance', icon: IconEnhance, onClick: handleEnhance },
        { label: 'Delete', icon: IconTrash, onClick: handleDelete },
        { label: 'Replace', icon: IconReplace, replace: true, disabled: scanning },
    ];

    const DOODLE_TOOLS = [
        { id: 'ink', label: 'Ink', icon: IconInk },
        { id: 'pen', label: 'Pen', icon: IconPen },
        { id: 'marker', label: 'Marker', icon: IconMarker },
        { id: 'highlight', label: 'Highlight', icon: IconHighlight },
        { id: 'eraser', label: 'Eraser', icon: IconEraser },
    ];
    const DOODLE_DEFAULTS = { ink: 3, pen: 2, marker: 14, highlight: 26, eraser: 40 };
    const DOODLE_RANGES = { ink: [1, 200], pen: [1, 200], marker: [4, 200], highlight: [6, 200], eraser: [10, 200] };

    const toggleDoodle = (id) => {
        if (doodleTool === id) {
            setDoodleTool(null);
            return;
        }
        setCropMode(false);
        setScaleMode(false);
        setDoodleTool(id);
        setDoodleSize(DOODLE_DEFAULTS[id]);
        if (id === 'highlight' && !HILITE_COLORS.includes(doodleColor)) {
            setDoodleColor('#fff176');
        }
    };

    const saveDoodle = (annDataUrl) => {
        onUpdatePages((prev) => prev.map((p, i) => (i === idx ? { ...p, ann: annDataUrl } : p)));
    };

    const clearDoodle = () => {
        onUpdatePages((prev) => prev.map((p, i) => (i === idx ? { ...p, ann: null } : p)));
    };

    const handleAddFiles = async (e) => {
        const list = Array.from(e.target.files || []);
        e.target.value = '';
        setAddOpen(false);
        if (!onUpload) return;
        for (const f of list) {
            await onUpload(f);
        }
    };

    const handleReplaceUpload = async (e) => {
        const list = Array.from(e.target.files || []);
        e.target.value = '';
        setReplaceMenuOpen(false);
        if (!list.length || !total) return;
        const file = list[0];
        if (file.type.startsWith('image/')) {
            onUpdatePages((prev) => prev.map((p, i) => (i === idx ? { ...p, src: URL.createObjectURL(file) } : p)));
            return;
        }
        try {
            const srcList = await uploadDocument(file);
            if (srcList.length) {
                onUpdatePages((prev) => prev.map((p, i) => (i === idx ? { ...p, src: srcList[0] } : p)));
            }
        } catch (err) {
            alert(err.message || 'Upload failed');
        }
    };

    const EXPORT_ITEMS = [
        { label: 'Export as PNG', icon: IconDownload, kind: 'png' },
        { label: 'Export as JPEG', icon: IconDownload, kind: 'jpeg' },
        { label: 'Export as DOC', icon: IconFile, kind: 'doc' },
        { label: 'Export as DOCX', icon: IconFile, kind: 'docx' },
        { label: 'Download All (ZIP)', icon: IconDownloadAll, kind: 'zip' },
    ];

    return (
        <div className="workspace">
            <div className="body-wrap">
                <div className="page-head">
                    <div className="page-head-c1">
                        <h1>Review &amp; Print</h1>
                        <p>Review scanned pages and finalize before printing or exporting.</p>
                    </div>
                    <div className="page-head-c2">
                        {bannerVisible && (
                            <div className="status-banner stacked">
                                <div className="status-check">
                                    <IconCheck size={13} strokeWidth={3} />
                                </div>
                                <div>
                                    <div className="status-title">{total ? 'Scan Complete' : 'No Pages Yet'}</div>
                                    <div className="status-sub">
                                        {total
                                            ? `${total} page${total === 1 ? '' : 's'} scanned — ready for review.`
                                            : 'Scan or upload pages to start reviewing.'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`columns ${collapsed ? 'collapsed' : ''}`}>
                    <div className="main-col">
                        <div className="card pages-card">
                        <div className="pages-title">
                            {reorderMode ? (
                                <div className="reorder-bar">
                                    <span>Reorder Pages</span>
                                    <button type="button" className="mini-btn" disabled={safeSelected <= 1} onClick={() => moveSelected(-1)}>
                                        <IconArrowLeft size={14} />
                                        Move Top
                                    </button>
                                    <button type="button" className="mini-btn" disabled={safeSelected >= total} onClick={() => moveSelected(1)}>
                                        Move Bottom
                                        <IconArrowRight size={14} />
                                    </button>
                                    <button type="button" className="mini-btn strong" onClick={() => setReorderMode(false)}>
                                        <IconCheck size={13} strokeWidth={3} />
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>Pages ({total})</>
                            )}
                        </div>
                        <div className="pages-scroll">
                            {total === 0 && (
                                <div className="pages-empty">
                                    No pages yet. Go to Scan &amp; Detect to scan your flatbed, or use Add Pages to scan more.
                                </div>
                            )}
                            {pages.map((p, i) => (
                                <div
                                    key={p.id}
                                    className={`thumb ${safeSelected === i + 1 ? 'selected' : ''} ${dragIndex === i ? 'dragging' : ''} ${overIndex === i && dragIndex !== null && dragIndex !== i ? 'over' : ''}`}
                                    onClick={() => setSelected(i + 1)}
                                    draggable
                                    onDragStart={(e) => {
                                        setDragIndex(i);
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setOverIndex(i);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (dragIndex !== null) handleReorder(dragIndex, i);
                                        setDragIndex(null);
                                        setOverIndex(null);
                                    }}
                                    onDragEnd={() => {
                                        setDragIndex(null);
                                        setOverIndex(null);
                                    }}
                                >
                                    <div className="thumb-badge">{i + 1}</div>
                                    <button
                                        type="button"
                                        className="thumb-delete"
                                        title="Delete page"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAt(i);
                                        }}
                                    >
                                        <IconTrash size={12} />
                                    </button>
                                    <img className="thumb-img" src={p.src} alt={`Page ${i + 1}`} draggable={false} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card viewer-card">
                        <div className="viewer-toolbar">
                            <div className="viewer-label">Page {safeSelected} of {total}</div>
                            <div className="toolbar-btns">
                                {cropMode || manualMode ? (
                                    <>
                                        {manualMode ? (
                                            <button type="button" className="tbtn strong" onClick={applyManual}>
                                                <IconPlus size={15} />
                                                Add Space
                                            </button>
                                        ) : (
                                            <button type="button" className="tbtn strong" onClick={applyCrop} disabled={busy}>
                                                <IconCheck size={15} strokeWidth={3} />
                                                Apply Crop
                                            </button>
                                        )}
                                        <button type="button" className="tbtn-cancel" onClick={manualMode ? cancelManual : cancelCrop}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className={`tbtn ${scaleMode ? 'active' : ''}`}
                                            title={scaleMode ? 'Hide scale ruler' : 'Show true-scale ruler (cm/mm grid) over the page'}
                                            onClick={toggleScale}
                                        >
                                            <IconRuler size={16} />
                                        </button>
                                        <div className="margin-controls">
                                            <button
                                                type="button"
                                                className={`apply-switch ${applyAll ? 'on' : ''}`}
                                                title={applyAll ? 'Applied to all pages' : 'Applied per page'}
                                                onClick={() => setApplyAll((v) => !v)}
                                            >
                                                {applyAll ? <IconPages size={16} /> : <IconFileOff size={16} />}
                                            </button>
                                            <div className="margin-toggle" title="off / left / right">
                                                    <span
                                                        className="margin-toggle-thumb"
                                                        style={{ transform: `translateX(${MARGIN_SIDES.indexOf(side) * 100}%)` }}
                                                    />
                                                    {MARGIN_SIDES.map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            className={`margin-toggle-seg ${side === s ? 'active' : ''}`}
                                                            onClick={() => setMarginForCurrent(s, size)}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="margin-field" ref={marginFieldRef}>
                                                    <div className="margin-input-wrap">
                                                        <input
                                                            type="number"
                                                            className="margin-size-input"
                                                            title={`Margin width (${unit})`}
                                                            min="0"
                                                            max="100"
                                                            step="1"
                                                            value={size}
                                                            onChange={(e) => {
                                                                const v = parseInt(e.target.value, 10);
                                                                if (!Number.isNaN(v)) setMarginForCurrent(side, Math.max(0, Math.min(100, v)));
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="margin-unit"
                                                            title={unit === 'mm' ? 'Value in millimetres - click to switch to cm' : 'Value in centimetres - click to switch to mm'}
                                                            onClick={() => setMarginForCurrent(side, size, unit === 'mm' ? 'cm' : 'mm')}
                                                        >
                                                            {unit}
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="margin-caret"
                                                        title="Choose margin"
                                                        onClick={() => setMarginMenuOpen((v) => !v)}
                                                    >
                                                        <IconChevronDown size={12} />
                                                    </button>
                                                    {marginMenuOpen && (
                                                        <div className="margin-presets">
                                                            {MARGIN_PRESETS.map((sz) => (
                                                                <button
                                                                    key={sz}
                                                                    type="button"
                                                                    className={`margin-opt ${size === sz ? 'active' : ''}`}
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => {
                                                                        setMarginForCurrent(side, sz);
                                                                        setMarginMenuOpen(false);
                                                                    }}
                                                                >
                                                                    {sz}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                        </div>
                                        <button type="button" className="tbtn text" onClick={() => setAddOpen((v) => !v)} disabled={scanning}>
                                            {scanning ? <IconScanner size={15} /> : <IconPlus size={15} />}
                                            {scanning ? 'Scanning...' : 'Add Pages'}
                                        </button>
                                        {addOpen && (
                                            <div className="add-menu" ref={addMenuRef}>
                                                <button
                                                    type="button"
                                                    className="add-menu-item"
                                                    onClick={() => {
                                                        setAddOpen(false);
                                                        onScan();
                                                    }}
                                                >
                                                    <IconScanner size={16} />
                                                    <span>
                                                        Scan
                                                        <small>Scan a page from your scanner</small>
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="add-menu-item"
                                                    onClick={() => addInputRef.current && addInputRef.current.click()}
                                                >
                                                    <IconUpload size={16} />
                                                    <span>
                                                        Upload
                                                        <small>Upload PDF or image files</small>
                                                    </span>
                                                </button>
                                                <input
                                                    ref={addInputRef}
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                    multiple
                                                    hidden
                                                    onChange={handleAddFiles}
                                                />
                                            </div>
                                        )}
                                        <div className="tbtn" onClick={() => setZoom((z) => Math.min(200, z + 10))}><IconPlus size={16} /></div>
                                        <div className="tbtn" onClick={() => setZoom((z) => Math.max(50, z - 10))}><IconMinus size={16} /></div>
                                        <div className="tbtn" onClick={() => setZoom(100)}><IconExpand size={16} /></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={`viewer-canvas ${total ? 'has-img' : ''}`}>
                            {total ? (
                                <div className="viewer-img-holder" ref={holderRef} style={{ transform: `scale(${(zoom / 100) * fitScale})` }} onPointerDown={() => setSpaceEditor(null)}>
                                    <img
                                        ref={imgRef}
                                        className="viewer-img"
                                        src={pages[idx].src}
                                        alt={`Page ${safeSelected}`}
                                    />
                                    {doodleTool && stage.w > 0 && (
                                        <DoodleCanvas
                                            src={pages[idx].src}
                                            ann={pages[idx].ann}
                                            tool={doodleTool}
                                            size={doodleSize}
                                            color={doodleColor}
                                            active
                                            onSave={saveDoodle}
                                            pos={stage}
                                        />
                                    )}
                                    {cropMode && (
                                        <div className="crop-layer">
                                            <div
                                                className="crop-box"
                                                style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.w}%`, height: `${cropBox.h}%` }}
                                                onPointerDown={(e) => startCropDrag('move', e)}
                                            >
                                                <div className="crop-handle" onPointerDown={(e) => startCropDrag('resize', e)} />
                                            </div>
                                        </div>
                                    )}
                                    {manualMode && (
                                        <div className="crop-layer">
                                            <div
                                                className="crop-box manual"
                                                style={{ left: `${manualBox.x}%`, top: `${manualBox.y}%`, width: `${manualBox.w}%`, height: `${manualBox.h}%` }}
                                                onPointerDown={(e) => startManualDrag('move', e)}
                                            >
                                                <span className="manual-hint">Drag &amp; resize, then press Add Space</span>
                                                <div className="crop-handle" onPointerDown={(e) => startManualDrag('resize', e)} />
                                            </div>
                                        </div>
                                    )}
                                    {!cropMode && !doodleTool && !manualMode && stage.w > 0 && currentSpaces.length > 0 && (
                                        <div
                                            className="space-layer"
                                            style={{
                                                left: stage.x + mL,
                                                top: stage.y,
                                                width: stage.w - mL - mR,
                                                height: stage.h,
                                            }}
                                        >
                                            {currentSpaces.map((s, boxIdx) => {
                                                const snap = side !== 'off' && s.pinned !== false;
                                                const effLeft = snap ? (side === 'left' ? 0 : 1 - s.width) : s.x;
                                                return (
                                                <div
                                                    key={s.id}
                                                    className={`space-box ${activeSpaceId === s.id ? 'active' : ''}`}
                                                    style={{ left: `${effLeft * 100}%`, top: `${s.y * 100}%`, width: `${s.width * 100}%`, height: `${s.height * 100}%` }}
                                                    onPointerDown={(e) => startSpaceDrag('move', s.id, e)}
                                                    onClick={() => {
                                                        const wasOpen = !!spaceEditor;
                                                        setActiveSpaceId(s.id);
                                                        if (!wasOpen) {
                                                            const sel = document.getSelection();
                                                            if (sel && sel.rangeCount > 0) sel.removeAllRanges();
                                                        }
                                                        closeSpaceEditor();
                                                    }}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setActiveSpaceId(s.id);
                                                        const p = stageViewportPx(e.clientX, e.clientY);
                                                        const x = clamp(p.x, 8, Math.max(8, p.maxX - 340));
                                                        const y = clamp(p.y, 8, Math.max(8, p.maxY - 120));
                                                        setSpaceEditor({ id: s.id, x, y });
                                                    }}
                                                >
                                                    <span className="space-tag">{boxIdx + 1}</span>
                                                    <SpaceContent
                                                        space={s}
                                                        onChange={updateSpace}
                                                        editorOpen={!!spaceEditor}
                                                        contentRef={activeSpaceId === s.id ? activeSpaceRef : undefined}
                                                    />
                                                    <div className="space-tools">
                                                        <button
                                                            type="button"
                                                            className={`space-tool apply ${s.dirty ? 'show' : ''}`}
                                                            title="Apply changes"
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onClick={() => updateSpace(s.id, { dirty: false })}
                                                        >
                                                            <IconCheck size={12} strokeWidth={3} />
                                                            Apply
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="space-tool del"
                                                            title="Delete box"
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onClick={() => deleteSpace(s.id)}
                                                        >
                                                            <IconTrash size={13} />
                                                        </button>
                                                    </div>
                                                    <div
                                                        className="space-resize"
                                                        title="Resize box"
                                                        onPointerDown={(e) => startSpaceDrag('resize', s.id, e)}
                                                    />
                                                    <div
                                                        className="space-drag"
                                                        title="Drag to move box"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
                                                            startSpaceDrag('move', s.id, e);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {!cropMode && !doodleTool && !manualMode && stage.w > 0 && side !== 'off' && sizePx > 0 && (
                                        <div
                                            className="margin-line"
                                            style={{
                                                left: `${side === 'left' ? stage.x + sizePx : stage.x + stage.w - sizePx}px`,
                                                top: stage.y,
                                                height: stage.h,
                                            }}
                                        />
                                    )}
                                    {!cropMode && !doodleTool && !manualMode && scaleMode && stage.w > 0 && scaleCm > 0 && (
                                        <div
                                            className="scale-overlay"
                                            style={{ left: stage.x, top: stage.y, width: stage.w, height: stage.h }}
                                        >
                                            <div
                                                className="scale-grid"
                                                style={{
                                                    backgroundImage: [
                                                        `repeating-linear-gradient(to right, rgba(106,50,240,0.05) 0px, rgba(106,50,240,0.05) 1px, transparent 1px, transparent ${scaleMm}px)`,
                                                        `repeating-linear-gradient(to bottom, rgba(106,50,240,0.05) 0px, rgba(106,50,240,0.05) 1px, transparent 1px, transparent ${scaleMm}px)`,
                                                        `repeating-linear-gradient(to right, rgba(106,50,240,0.15) 0px, rgba(106,50,240,0.15) 1px, transparent 1px, transparent ${scaleCm}px)`,
                                                        `repeating-linear-gradient(to bottom, rgba(106,50,240,0.15) 0px, rgba(106,50,240,0.15) 1px, transparent 1px, transparent ${scaleCm}px)`,
                                                    ].join(', '),
                                                }}
                                            />
                                            <div
                                                className="scale-axis-x"
                                                style={{
                                                    backgroundImage: [
                                                        `repeating-linear-gradient(to right, rgba(59,42,138,0.08) 0px, rgba(59,42,138,0.08) 1px, transparent 1px, transparent ${scaleMm}px)`,
                                                        `repeating-linear-gradient(to right, rgba(59,42,138,0.4) 0px, rgba(59,42,138,0.4) 1px, transparent 1px, transparent ${scaleCm}px)`,
                                                    ].join(', '),
                                                }}
                                            >
                                                {scaleXTicks.map((left, i) => (
                                                    <span key={i} className="scale-tick-x" style={{ left }}>
                                                        <b style={left > stage.w - 26 ? { left: 'auto', right: 0 } : undefined}>{i}</b>
                                                    </span>
                                                ))}
                                                {scaleXHalves.map((left, i) => (
                                                    <span key={`h${i}`} className="scale-tick-h x" style={{ left }} />
                                                ))}
                                            </div>
                                            <div
                                                className="scale-axis-y"
                                                style={{
                                                    backgroundImage: [
                                                        `repeating-linear-gradient(to bottom, rgba(59,42,138,0.08) 0px, rgba(59,42,138,0.08) 1px, transparent 1px, transparent ${scaleMm}px)`,
                                                        `repeating-linear-gradient(to bottom, rgba(59,42,138,0.4) 0px, rgba(59,42,138,0.4) 1px, transparent 1px, transparent ${scaleCm}px)`,
                                                    ].join(', '),
                                                }}
                                            >
                                                {scaleYTicks.map((top, i) => (
                                                    <span key={i} className="scale-tick-y" style={{ top }}>
                                                        <b style={top > stage.h - 26 ? { top: 'auto', bottom: 0 } : undefined}>{i}</b>
                                                    </span>
                                                ))}
                                                {scaleYHalves.map((top, i) => (
                                                    <span key={`h${i}`} className="scale-tick-h y" style={{ top }} />
                                                ))}
                                            </div>
                                            <span className="scale-note">1 cm grid · true scale · {(stage.w / scaleCm).toFixed(1)} × {(stage.h / scaleCm).toFixed(1)} cm</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="viewer-empty">
                                    <div className="hand-line">
                                        If &nbsp;
                                        <span className="hand-frac"><span className="num">x</span><span className="bar"></span><span className="den">y</span></span>
                                        = <span className="hand-frac"><span className="num">b</span><span className="bar"></span><span className="den">y</span></span>
                                        = <span className="hand-frac"><span className="num">c</span><span className="bar"></span><span className="den">2</span></span>
                                        , then,
                                    </div>
                                    <div className="hand-line">&nbsp;&nbsp;(a + b + c) ( 1/x + 1/y + 1/z ) = 0</div>
                                    <div className="hand-line"><span className="underline">Sol</span>&nbsp; Let &nbsp;a/x = b/y = c/z = k</div>
                                    <div className="hand-line">&nbsp;&nbsp;&nbsp;a = kx,&nbsp; b = ky,&nbsp; c = kz</div>
                                    <div className="hand-line">LHS = (a + b + c) ( 1/x + 1/y + 1/z )</div>
                                    <div className="hand-line">&nbsp;&nbsp;&nbsp;= k (x + y + z) ( (yz+zx+xy) / xyz )</div>
                                    <div className="hand-line">&nbsp;&nbsp;&nbsp;= k (x + y + z) ( (xy+yz+zx) / xyz )</div>
                                    <div className="hand-line">&nbsp;&nbsp;&nbsp;= k (x + y + z) ( (x+y+z) / xyz )</div>
                                    <div className="hand-line">&nbsp;&nbsp;&nbsp;= k (x + y + z)&sup2; / xyz</div>
                                    <div className="hand-line">&nbsp;&nbsp;&nbsp;= 0 &nbsp; ( since a/x = b/y = c/z = k = 0 )</div>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>

                    <div className="right-col">
                        <div className="card panel-card">
                            <div className="panel-title">Scan Summary</div>
                            {SUMMARY.map((s, i) => (
                                <div className="summary-row" key={i}>
                                    <div className={`summary-icon ${s.cls}`}>
                                        <s.icon size={17} />
                                    </div>
                                    <div className="summary-num">{s.num}</div>
                                    <div className="summary-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="card smart-card">
                            <div className="qblock-title">Smart Space Detection</div>
                            <div className="smart-desc">
                                Auto-detects usable blank areas on scanned pages to add questions, answers or notes. Set the minimum blank height, or add a space manually.
                            </div>
                            <div className="smart-field">
                                <span className="smart-field-label">Detection</span>
                                <span className={`smart-field-value ${detectStatus.startsWith('No') || detectStatus.includes('failed') ? 'warn' : ''}`}>
                                    {detectStatus}
                                </span>
                            </div>
                            <label className="smart-min">
                                <span className="smart-min-label">Minimum blank height</span>
                                <div className="smart-min-row">
                                    <input
                                        type="range"
                                        min="4"
                                        max="25"
                                        step="1"
                                        value={minHeight}
                                        onChange={(e) => setMinHeight(Number(e.target.value))}
                                    />
                                    <span className="smart-min-value">{minHeight} cm</span>
                                </div>
                            </label>
                            <Button
                                variant="strong"
                                block
                                icon={<IconSparkle size={15} strokeWidth={2.2} />}
                                disabled={!total || detecting || busy}
                                onClick={handleDetect}
                            >
                                {detecting ? 'Detecting...' : 'Smart Space Detection'}
                            </Button>
                            <div className="smart-actions">
                                <Button variant="outline" block icon={<IconPlus size={15} />} disabled={!total || detecting || busy} onClick={enterManual}>
                                    Add Manually
                                </Button>
                            </div>
                        </div>

                        <div className="card panel-card">
                            <div className="panel-title">Text Editor</div>
                            <RichTextToolbar
                                targetRef={activeSpaceRef}
                                onChange={applyFormat}
                                disabled={!activeSpaceId}
                            />
                        </div>

                        <div className="card panel-card">
                            <div className="panel-title">Page Options</div>
                            <div className="options-grid">
                                {PAGE_OPTIONS.map((o, i) => (
                                    <div
                                        className={`opt-item ${!total || busy || o.disabled ? 'disabled' : ''} ${o.active ? 'active' : ''} ${o.replace ? 'has-menu' : ''}`}
                                        key={i}
                                        onClick={() => {
                                            if (busy || o.disabled || !total) return;
                                            if (o.replace) {
                                                setReplaceMenuOpen((v) => !v);
                                            } else if (o.onClick) {
                                                o.onClick();
                                            }
                                        }}
                                    >
                                        <o.icon size={19} />
                                        {o.label}
                                        {o.replace && (
                                            <>
                                                {replaceMenuOpen && (
                                                    <div className="replace-menu" ref={replaceMenuRef} onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="replace-menu-item"
                                                            onClick={() => {
                                                                setReplaceMenuOpen(false);
                                                                onReplace(idx);
                                                            }}
                                                        >
                                                            <IconScanner size={15} />
                                                            <span>
                                                                Scan
                                                                <small>Scan a replacement page</small>
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="replace-menu-item"
                                                            onClick={() => replaceInputRef.current && replaceInputRef.current.click()}
                                                        >
                                                            <IconUpload size={15} />
                                                            <span>
                                                                Upload
                                                                <small>Upload PDF or image files</small>
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                                <input
                                                    ref={replaceInputRef}
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                    hidden
                                                    onChange={handleReplaceUpload}
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card panel-card">
                            <div className="panel-title">Annotate</div>
                            <div className="doodle-tools">
                                {DOODLE_TOOLS.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`doodle-tool ${doodleTool === t.id ? 'active' : ''}`}
                                        onClick={() => toggleDoodle(t.id)}
                                        title={t.label}
                                    >
                                        <t.icon size={17} />
                                        <span>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                            {doodleTool && (
                                <div className="doodle-controls">
                                    <div className="doodle-row">
                                        <span className="doodle-label">{doodleTool === 'eraser' ? 'Eraser Size' : 'Size'}</span>
                                        <input
                                            type="range"
                                            className="doodle-range"
                                            min={DOODLE_RANGES[doodleTool][0]}
                                            max={DOODLE_RANGES[doodleTool][1]}
                                            value={doodleSize}
                                            onChange={(e) => setDoodleSize(Number(e.target.value))}
                                        />
                                        <span className="doodle-size">{doodleSize}px</span>
                                    </div>
                                    {doodleTool !== 'eraser' && (
                                        <div className="doodle-colors">
                                            <SwatchRow
                                                colors={doodleTool === 'highlight' ? HILITE_COLORS : TEXT_COLORS}
                                                value={doodleColor}
                                                onPick={setDoodleColor}
                                            />
                                        </div>
                                    )}
                                    <button type="button" className="doodle-clear" onClick={clearDoodle} disabled={!total || busy}>
                                        <IconTrash size={14} />
                                        Clear Drawing
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card panel-card">
                            <div className="export-title">Export / Print</div>
                            <div className="export-stack">
                                <button className="btn-print" onClick={() => setPrintOpen(true)} disabled={!total || busy}>
                                    <IconPrint size={16} />
                                    Print
                                </button>
                                <div className="export-wrap" ref={exportRef}>
                                    <div className="row-with-caret">
                                        <button className="btn-outline stretch" onClick={() => setExportAsk('pdf')} disabled={!total || busy}>
                                            <IconFile size={16} />
                                            Export PDF
                                        </button>
                                        <button
                                            className={`btn-caret ${exportOpen ? 'open' : ''}`}
                                            onClick={() => setExportOpen((v) => !v)}
                                            title="More export options"
                                        >
                                            <IconChevronDown size={14} />
                                        </button>
                                    </div>
                                    {exportOpen && (
                                        <div className="export-menu">
                                            {EXPORT_ITEMS.map((item, i) => (
                                                <button
                                                    type="button"
                                                    className="export-menu-item"
                                                    key={i}
                                                    onClick={() => {
                                                        setExportOpen(false);
                                                        setExportAsk(item.kind);
                                                    }}
                                                >
                                                    <item.icon size={15} />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card tip-card">
                            <div className="tip-title">
                                <IconInfo size={15} />
                                Tip
                            </div>
                            <div className="tip-body">
                                Review all pages carefully before printing or exporting for the best results.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-card">
                <div className="footer-left">
                    <div className="footer-step">Step 3 of 3</div>
                    <div className="progress-track">
                        <div className="progress-fill p100" />
                    </div>
                </div>
                <div className="footer-actions">
                    <Button variant="outline" size="sm" icon={<IconArrowLeft size={15} />} onClick={onBack}>
                        Back
                    </Button>
                    <Button variant="primary" size="sm" iconRight={<IconCheck size={15} strokeWidth={2.4} />} onClick={() => setFinishOpen(true)}>
                        Finish
                    </Button>
                </div>
            </div>

            {(printOpen || exportAsk) && (
                <PrintOptionsModal
                    open={printOpen || !!exportAsk}
                    onClose={() => {
                        setPrintOpen(false);
                        setExportAsk(null);
                    }}
                    onPick={printOpen ? runPrint : runExportMode}
                    busy={busy}
                    title={printOpen ? 'Print Options' : 'Export Options'}
                    hint={
                        printOpen
                            ? 'Each option produces a different print output. Choose the layout that matches what you need.'
                            : 'Each option produces a different export. Choose the content that matches what you need.'
                    }
                />
            )}

            {finishOpen && (
                <div className="modal-backdrop" onClick={() => setFinishOpen(false)}>
                    <div className="modal finish-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <span className="modal-title">
                                <IconCheck size={15} className="modal-title-icon" />
                                Finish
                            </span>
                            <button type="button" className="modal-close" onClick={() => setFinishOpen(false)}>
                                <IconX size={16} />
                            </button>
                        </div>
                        <div className="finish-modal-body">
                            <div className="finish-question">Are your current printing job(s) completed?</div>
                            <div className="finish-hint">
                                {total} page{total === 1 ? '' : 's'} reviewed. Create a new job to start over.
                            </div>
                        </div>
                        <div className="modal-foot">
                            <Button variant="outline" size="sm" onClick={() => onFinish(false)}>
                                Continue
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => onFinish(true)}>
                                Create new job
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {spaceEditorBox && !cropMode && !doodleTool && !manualMode && stage.w > 0 && (
                <div
                    className="space-editor"
                    style={{ left: spaceEditor.x, top: spaceEditor.y }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="space-editor-grip" onPointerDown={startEditorDrag} title="Drag to move">
                        <IconMenu size={14} />
                        <span>{spaceEditorBox?.label || 'Space editor'}</span>
                    </div>
                    <button type="button" className="space-editor-close" title="Close" onClick={closeSpaceEditor}>
                        <IconX size={14} strokeWidth={2.6} />
                    </button>
                    <RichTextToolbar targetRef={activeSpaceRef} onChange={applyFormat} disabled={false} boxId={spaceEditorBox?.id} />
                </div>
            )}
        </div>
    );
}
