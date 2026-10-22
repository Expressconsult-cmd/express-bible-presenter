/* Express Bible Presenter — Slide Studio. Separate module: edits slides, draws them to pictures and puts them on the same screens as everything else. */
(function () {
'use strict';
if (/[?&]mode=obs\b/.test(location.search)) return;

const W = 1920, H = 1080;
const $ = (s, r) => (r || document).querySelector(s);
const uid = (p) => (p || 'i') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } };

// ---------- fonts ----------
const FONT_STACK = {
    'Montserrat': '"Montserrat","Segoe UI",system-ui,sans-serif',
    'Poppins': '"Poppins","Segoe UI",system-ui,sans-serif',
    'Oswald': '"Oswald","Arial Narrow",Impact,sans-serif',
    'Bebas Neue': '"Bebas Neue",Impact,"Arial Narrow",sans-serif',
    'Playfair Display': '"Playfair Display",Georgia,serif',
    'Lora': '"Lora",Georgia,serif',
    'Dancing Script': '"Dancing Script","Brush Script MT",cursive',
    'Georgia': 'Georgia,"Times New Roman",serif',
    'Arial': 'Arial,Helvetica,sans-serif'
};
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;0,800;1,400&family=Poppins:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Playfair+Display:ital,wght@0,700;0,800;1,500&family=Lora:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@700&display=swap';
let fontsLinked = false;
function linkFonts() {
    if (fontsLinked) return; fontsLinked = true;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONT_LINK; document.head.appendChild(l);
}
function fontsFor(slide) {
    const set = new Set(); (slide.objs || []).forEach(o => { if (o.t === 'text') set.add(o.font || 'Montserrat'); }); return Array.from(set);
}
async function ensureFonts(names) {
    if (!document.fonts || !document.fonts.load) return;
    const jobs = names.filter(n => n && n !== 'Georgia' && n !== 'Arial').map(n => document.fonts.load('700 40px "' + n + '"').catch(() => {}).then(() => document.fonts.load('400 40px "' + n + '"').catch(() => {})));
    await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(r, 2500))]);
}

// ---------- images (stored once per id, shared by every deck) ----------
const IMG = new Map();     // id -> data URL
const ELS = new Map();     // id -> HTMLImageElement
let redrawHook = () => {};
function imgEl(id) {
    if (!id || !IMG.has(id)) return null;
    let e = ELS.get(id);
    if (!e) { e = new Image(); e.onload = () => { e._ok = true; redrawHook(); }; e.src = IMG.get(id); ELS.set(id, e); }
    return e._ok ? e : null;
}
function loadImgEl(id) {
    return new Promise(res => {
        if (!id || !IMG.has(id)) return res(null);
        let e = ELS.get(id);
        if (e && e._ok) return res(e);
        if (!e) { e = new Image(); ELS.set(id, e); e.src = IMG.get(id); }
        if (e.complete && e.naturalWidth) { e._ok = true; return res(e); }
        e.onload = () => { e._ok = true; res(e); }; e.onerror = () => res(null);
    });
}
async function preloadSlideImages(slide) {
    const ids = []; if (slide.bg && slide.bg.img) ids.push(slide.bg.img);
    (slide.objs || []).forEach(o => { if (o.t === 'image' && o.src) ids.push(o.src); });
    await Promise.all(ids.map(loadImgEl));
}
function fileToImageId(file, maxW) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file); const im = new Image();
        im.onload = () => {
            const k = Math.min(1, (maxW || 1920) / Math.max(im.width, im.height));
            const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            const png = /png|gif|webp|svg/i.test(file.type);
            const id = uid('img'); IMG.set(id, c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.86));
            resolve({ id, w: c.width, h: c.height });
        };
        im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That picture could not be read.')); };
        im.src = url;
    });
}

// ---------- the drawing engine: one place draws every slide (editor, thumbnails and the live screen) ----------
const measureCtx = document.createElement('canvas').getContext('2d');
function setFont(ctx, o, size) {
    ctx.font = (o.italic ? 'italic ' : '') + (o.bold ? '700 ' : '400 ') + size + 'px ' + (FONT_STACK[o.font] || FONT_STACK.Montserrat);
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
}
function wrapLines(ctx, txt, maxW) {
    const out = [];
    String(txt).split('\n').forEach(par => {
        if (!par.trim()) { out.push(''); return; }
        let line = '';
        par.split(/\s+/).filter(Boolean).forEach(word => {
            let test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width <= maxW || !line) {
                if (!line && ctx.measureText(word).width > maxW) { // one very long word: break it by letters
                    let chunk = '';
                    for (const ch of word) { if (ctx.measureText(chunk + ch).width > maxW && chunk) { out.push(chunk); chunk = ch; } else chunk += ch; }
                    line = chunk;
                } else line = test;
            } else { out.push(line); line = word; }
        });
        out.push(line);
    });
    return out;
}
function textLayout(ctx, o) {
    const pad = o.pad == null ? 14 : o.pad;
    let size = o.size || 64;
    const txt = o.caps ? String(o.txt || '').toUpperCase() : String(o.txt || '');
    const maxW = Math.max(10, o.w - pad * 2), maxH = Math.max(10, o.h - pad * 2);
    let lines = [];
    for (let i = 0; i < 45; i++) {
        setFont(ctx, o, size); lines = wrapLines(ctx, txt, maxW);
        if (!o.fit || lines.length * size * (o.lh || 1.2) <= maxH || size <= 14) break;
        size = Math.max(14, Math.floor(size * 0.94));
    }
    return { lines, size, pad };
}
function shapePath(ctx, k, w, h) {
    ctx.beginPath();
    switch (k) {
        case 'round': { const r = Math.min(w, h) * 0.22; ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r); ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r); ctx.closePath(); break; }
        case 'pill': { const r = Math.min(w, h) / 2; ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r); ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r); ctx.closePath(); break; }
        case 'circle': ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); break;
        case 'tri': ctx.moveTo(w / 2, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); break;
        case 'diamond': ctx.moveTo(w / 2, 0); ctx.lineTo(w, h / 2); ctx.lineTo(w / 2, h); ctx.lineTo(0, h / 2); ctx.closePath(); break;
        case 'star': { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; const x = w / 2 + Math.cos(a) * r * w / 2, y = h / 2 + Math.sin(a) * r * h / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); break; }
        case 'arrow': ctx.moveTo(0, h * 0.3); ctx.lineTo(w * 0.6, h * 0.3); ctx.lineTo(w * 0.6, 0); ctx.lineTo(w, h / 2); ctx.lineTo(w * 0.6, h); ctx.lineTo(w * 0.6, h * 0.7); ctx.lineTo(0, h * 0.7); ctx.closePath(); break;
        case 'cross': { const t = w * 0.3, l = (w - t) / 2; ctx.moveTo(l, 0); ctx.lineTo(l + t, 0); ctx.lineTo(l + t, h * 0.28); ctx.lineTo(w, h * 0.28); ctx.lineTo(w, h * 0.28 + t * 0.95); ctx.lineTo(l + t, h * 0.28 + t * 0.95); ctx.lineTo(l + t, h); ctx.lineTo(l, h); ctx.lineTo(l, h * 0.28 + t * 0.95); ctx.lineTo(0, h * 0.28 + t * 0.95); ctx.lineTo(0, h * 0.28); ctx.lineTo(l, h * 0.28); ctx.closePath(); break; }
        case 'heart': ctx.moveTo(w / 2, h); ctx.bezierCurveTo(-w * 0.2, h * 0.55, w * 0.1, -h * 0.05, w / 2, h * 0.3); ctx.bezierCurveTo(w * 0.9, -h * 0.05, w * 1.2, h * 0.55, w / 2, h); ctx.closePath(); break;
        case 'line': ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); break;
        default: ctx.rect(0, 0, w, h);
    }
}
function fillStyleFor(ctx, o, w, h) {
    if (!o.fill) return null;
    if (o.fill2) { const a = ((o.ang == null ? 90 : o.ang) * Math.PI) / 180, dx = Math.cos(a) * w / 2, dy = Math.sin(a) * h / 2; const g = ctx.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy); g.addColorStop(0, o.fill); g.addColorStop(1, o.fill2); return g; }
    return o.fill;
}
function drawBg(ctx, bg) {
    bg = bg || { kind: 'solid', c1: '#0f172a' };
    if (bg.kind === 'grad') {
        const a = ((bg.ang == null ? 135 : bg.ang) * Math.PI) / 180, r = Math.hypot(W, H) / 2, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
        const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy); g.addColorStop(0, bg.c1 || '#1e3a8a'); g.addColorStop(1, bg.c2 || '#0f172a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else { ctx.fillStyle = bg.c1 || '#0f172a'; ctx.fillRect(0, 0, W, H); }
    if (bg.kind === 'image') {
        const e = imgEl(bg.img);
        if (e) { const k = Math.max(W / e.naturalWidth, H / e.naturalHeight); const dw = e.naturalWidth * k, dh = e.naturalHeight * k; ctx.drawImage(e, (W - dw) / 2, (H - dh) / 2, dw, dh); }
    }
    if (bg.dim) { ctx.fillStyle = 'rgba(0,0,0,' + clamp(bg.dim, 0, 0.9) + ')'; ctx.fillRect(0, 0, W, H); }
}
function dashArr(kind, sw) {
    sw = Math.max(1, sw || 1);
    if (kind === 'dash') return [sw * 3, sw * 2];
    if (kind === 'dot') return [0.01, sw * 2];
    if (kind === 'dashdot') return [sw * 4, sw * 2, 0.01, sw * 2];
    return [];
}
function drawLineArrows(ctx, o) { // a straight line with an arrow head at one or both ends
    const sw = o.sw, hs = Math.max(sw * 3, 30), y = o.h / 2, both = o.arrow === 'both';
    ctx.strokeStyle = o.stroke; ctx.fillStyle = o.stroke; ctx.lineWidth = sw; ctx.lineCap = o.dash === 'dot' ? 'round' : 'butt'; ctx.setLineDash(dashArr(o.dash, sw));
    ctx.beginPath(); ctx.moveTo(both ? hs * 0.8 : 0, y); ctx.lineTo(o.w - hs * 0.8, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(o.w, y); ctx.lineTo(o.w - hs, y - hs * 0.5); ctx.lineTo(o.w - hs, y + hs * 0.5); ctx.closePath(); ctx.fill();
    if (both) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(hs, y - hs * 0.5); ctx.lineTo(hs, y + hs * 0.5); ctx.closePath(); ctx.fill(); }
}
function drawObj(ctx, o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2); if (o.rot) ctx.rotate(o.rot * Math.PI / 180); ctx.translate(-o.w / 2, -o.h / 2);
    ctx.globalAlpha = o.op == null ? 1 : o.op;
    if (o.t === 'shape') {
        shapePath(ctx, o.k, o.w, o.h);
        const f = o.k === 'line' ? null : fillStyleFor(ctx, o, o.w, o.h);
        if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; }
        if (f) { ctx.fillStyle = f; ctx.fill(); }
        ctx.shadowColor = 'transparent';
        if (o.k === 'line' && o.sw && o.stroke && (o.arrow === 'end' || o.arrow === 'both')) drawLineArrows(ctx, o);
        else if (o.sw && o.stroke) { ctx.lineWidth = o.sw; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.lineCap = o.dash === 'dot' ? 'round' : (o.k === 'line' ? 'round' : 'butt'); ctx.setLineDash(dashArr(o.dash, o.sw)); ctx.stroke(); ctx.setLineDash([]); }
    } else if (o.t === 'text') {
        const L = textLayout(ctx, o), lh = L.size * (o.lh || 1.2), total = L.lines.length * lh;
        const y0 = o.va === 'top' ? L.pad : (o.va === 'bottom' ? o.h - L.pad - total : (o.h - total) / 2);
        const al = o.al || 'center'; ctx.textAlign = al; ctx.textBaseline = 'middle'; ctx.fillStyle = o.color || '#ffffff';
        if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = Math.max(8, L.size * 0.18); ctx.shadowOffsetY = Math.max(2, L.size * 0.05); }
        const x = al === 'left' ? L.pad : (al === 'right' ? o.w - L.pad : o.w / 2);
        L.lines.forEach((ln, i) => ctx.fillText(ln, x, y0 + i * lh + lh / 2));
    } else if (o.t === 'emoji') {
        const s = Math.min(o.w, o.h) * 0.82;
        ctx.font = s + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; }
        ctx.fillText(o.ch || '⭐', o.w / 2, o.h / 2 + s * 0.06);
    } else if (o.t === 'image') {
        const e = imgEl(o.src);
        if (e) {
            if (o.rad) { shapePath(ctx, 'round', o.w, o.h); ctx.save(); ctx.clip(); }
            const cover = o.fit === 'cover';
            const k = cover ? Math.max(o.w / e.naturalWidth, o.h / e.naturalHeight) : Math.min(o.w / e.naturalWidth, o.h / e.naturalHeight);
            const dw = e.naturalWidth * k, dh = e.naturalHeight * k;
            if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; }
            ctx.drawImage(e, (o.w - dw) / 2, (o.h - dh) / 2, dw, dh);
            if (o.rad) ctx.restore();
        } else { ctx.fillStyle = 'rgba(148,163,184,.25)'; ctx.fillRect(0, 0, o.w, o.h); }
    }
    ctx.restore();
}
function renderSlide(ctx, slide, w, skipId) {
    const k = w / W;
    ctx.save(); ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    drawBg(ctx, slide.bg);
    (slide.objs || []).forEach(o => { if (o.id !== skipId && !o.hidden) drawObj(ctx, o); });
    ctx.restore();
}
function slideToCanvas(slide, w) {
    const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * H / W);
    renderSlide(c.getContext('2d'), slide, w); return c;
}
function hitTest(slide, x, y) {
    const objs = slide.objs || [];
    for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i]; if (o.hidden || o.locked) continue;
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2, a = -(o.rot || 0) * Math.PI / 180;
        const dx = x - cx, dy = y - cy, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        const m = (o.t === 'shape' && o.k === 'line') ? 14 : 0;
        if (Math.abs(lx) <= o.w / 2 + m && Math.abs(ly) <= o.h / 2 + m) return o;
    }
    return null;
}

// ---------- building blocks for slides and templates ----------
const TXT = (x, y, w, h, txt, p) => Object.assign({ id: uid('o'), t: 'text', x, y, w, h, rot: 0, op: 1, txt, font: 'Montserrat', size: 64, bold: false, italic: false, color: '#ffffff', al: 'center', va: 'middle', lh: 1.2, shadow: false, caps: false, fit: false, ls: 0 }, p || {});
const SHP = (k, x, y, w, h, p) => Object.assign({ id: uid('o'), t: 'shape', k, x, y, w, h, rot: 0, op: 1, fill: '#38bdf8', fill2: '', ang: 90, stroke: '', sw: 0, shadow: false }, p || {});
const EMO = (ch, x, y, size, p) => Object.assign({ id: uid('o'), t: 'emoji', ch, x, y, w: size, h: size, rot: 0, op: 1, shadow: false }, p || {});
const newSlide = (bg, objs) => ({ id: uid('s'), bg: bg || { kind: 'grad', c1: '#1e3a8a', c2: '#0f172a', ang: 135, dim: 0 }, objs: objs || [], secs: 0, trans: '', v: 1 });
const newDeck = (name, slides) => ({ id: uid('d'), name: name || 'Untitled deck', slides: slides && slides.length ? slides : [newSlide()], imgs: {}, created: Date.now(), updated: Date.now() });
function deckImgs(deck) { // keep only the pictures this deck uses (so saved copies stay small)
    const used = {}; deck.slides.forEach(s => { if (s.bg && s.bg.img && IMG.has(s.bg.img)) used[s.bg.img] = IMG.get(s.bg.img); (s.objs || []).forEach(o => { if (o.t === 'image' && IMG.has(o.src)) used[o.src] = IMG.get(o.src); }); });
    return used;
}
function cloneSlide(s) { const c = clone(s); c.id = uid('s'); c.objs.forEach(o => { o.id = uid('o'); }); return c; }
function cloneDeck(d, name) { const c = clone(d); c.id = uid('d'); c.name = name || d.name; c.slides.forEach(s => { s.id = uid('s'); s.objs.forEach(o => { o.id = uid('o'); }); }); c.created = c.updated = Date.now(); return c; }

// ---------- saving (browser database, with a plain fallback) ----------
let dbPromise = null;
function idb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((res, rej) => {
        try {
            const r = indexedDB.open('ebpSlideStudio', 1);
            r.onupgradeneeded = () => { r.result.createObjectStore('decks', { keyPath: 'id' }); };
            r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
        } catch (e) { rej(e); }
    });
    return dbPromise;
}
async function dbAll() { const db = await idb(); return new Promise((res, rej) => { const q = db.transaction('decks').objectStore('decks').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); }); }
async function dbPut(d) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('decks', 'readwrite'); t.objectStore('decks').put(d); t.oncomplete = res; t.onerror = t.onabort = () => rej(t.error); }); }
async function dbDel(id) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('decks', 'readwrite'); t.objectStore('decks').delete(id); t.oncomplete = res; t.onerror = t.onabort = () => rej(t.error); }); }

// ---------- templates: every one is built from ordinary text boxes and shapes, so every part is editable ----------
const THEMES = {
    welcome:  { name: 'Welcome Home',   cat: 'Services',  dark: true,  bg: { kind: 'grad', c1: '#1e3a8a', c2: '#0b1226', ang: 135 }, c: '#ffffff', sub: '#bfdbfe', acc: '#fbbf24', acc2: '#38bdf8', f: 'Montserrat', vf: 'Playfair Display', decor: 'orbs' },
    service:  { name: 'Sunday Service', cat: 'Services',  dark: true,  bg: { kind: 'grad', c1: '#065f46', c2: '#022c22', ang: 150 }, c: '#ffffff', sub: '#a7f3d0', acc: '#34d399', acc2: '#fde68a', f: 'Poppins', vf: 'Lora', decor: 'bars' },
    series:   { name: 'Sermon Series',  cat: 'Sermons',   dark: true,  bg: { kind: 'grad', c1: '#1f2937', c2: '#030712', ang: 120 }, c: '#ffffff', sub: '#d1d5db', acc: '#fb923c', acc2: '#fbbf24', f: 'Oswald', vf: 'Lora', decor: 'sidebar', al: 'left' },
    scripture:{ name: 'Scripture Focus', cat: 'Sermons',  dark: false, bg: { kind: 'solid', c1: '#fdf6e3' }, c: '#1f2937', sub: '#6b7280', acc: '#b45309', acc2: '#d97706', f: 'Playfair Display', vf: 'Playfair Display', decor: 'frame' },
    lyrics:   { name: 'Worship Lyrics', cat: 'Worship',   dark: true,  bg: { kind: 'grad', c1: '#312e81', c2: '#030014', ang: 160 }, c: '#ffffff', sub: '#c4b5fd', acc: '#a78bfa', acc2: '#f0abfc', f: 'Montserrat', vf: 'Montserrat', decor: 'orbs' },
    news:     { name: 'Announcements',  cat: 'Info',      dark: false, bg: { kind: 'solid', c1: '#f1f5f9' }, c: '#0f172a', sub: '#475569', acc: '#2563eb', acc2: '#0ea5e9', f: 'Poppins', vf: 'Lora', decor: 'corner', al: 'left' },
    giving:   { name: 'Offering & Giving', cat: 'Services', dark: true, bg: { kind: 'grad', c1: '#92400e', c2: '#431407', ang: 135 }, c: '#ffffff', sub: '#fde68a', acc: '#fcd34d', acc2: '#fb923c', f: 'Montserrat', vf: 'Lora', decor: 'orbs' },
    prayer:   { name: 'Prayer & Altar Call', cat: 'Worship', dark: true, bg: { kind: 'grad', c1: '#3730a3', c2: '#0f0a2e', ang: 180 }, c: '#ffffff', sub: '#ddd6fe', acc: '#c4b5fd', acc2: '#fde68a', f: 'Playfair Display', vf: 'Playfair Display', decor: 'cross' },
    youth:    { name: 'Youth Night',    cat: 'Events',    dark: true,  bg: { kind: 'grad', c1: '#7c3aed', c2: '#db2777', ang: 135 }, c: '#ffffff', sub: '#fce7f3', acc: '#fde047', acc2: '#22d3ee', f: 'Bebas Neue', vf: 'Oswald', decor: 'confetti' },
    celebrate:{ name: 'Thanksgiving',   cat: 'Events',    dark: true,  bg: { kind: 'grad', c1: '#c2410c', c2: '#7c2d12', ang: 140 }, c: '#ffffff', sub: '#fed7aa', acc: '#fde68a', acc2: '#ffffff', f: 'Montserrat', vf: 'Lora', decor: 'stars' },
    christmas:{ name: 'Christmas',      cat: 'Seasons',   dark: true,  bg: { kind: 'grad', c1: '#14532d', c2: '#052e16', ang: 150 }, c: '#ffffff', sub: '#bbf7d0', acc: '#fca5a5', acc2: '#fde68a', f: 'Playfair Display', vf: 'Lora', decor: 'stars' },
    easter:   { name: 'Resurrection',   cat: 'Seasons',   dark: false, bg: { kind: 'grad', c1: '#fef9c3', c2: '#fdba74', ang: 170 }, c: '#3b1d08', sub: '#7c4a1d', acc: '#b45309', acc2: '#ea580c', f: 'Playfair Display', vf: 'Playfair Display', decor: 'cross' },
    minimal:  { name: 'Minimal Light',  cat: 'Clean',     dark: false, bg: { kind: 'solid', c1: '#ffffff' }, c: '#111827', sub: '#6b7280', acc: '#111827', acc2: '#9ca3af', f: 'Playfair Display', vf: 'Lora', decor: 'none', al: 'left' },
    visitors: { name: 'Welcome Visitors', cat: 'Info',    dark: true,  bg: { kind: 'grad', c1: '#0ea5e9', c2: '#075985', ang: 135 }, c: '#ffffff', sub: '#e0f2fe', acc: '#ffffff', acc2: '#fde047', f: 'Poppins', vf: 'Lora', decor: 'bars' },
    kids:     { name: 'Kids Church',    cat: 'Events',    dark: false, bg: { kind: 'grad', c1: '#fde047', c2: '#fb923c', ang: 135 }, c: '#1e1b4b', sub: '#4c1d95', acc: '#7c3aed', acc2: '#ef4444', f: 'Poppins', vf: 'Poppins', decor: 'confetti' }
};
const DECOR = {
    orbs: (t) => [SHP('circle', 1180, -380, 1000, 1000, { fill: t.acc, op: 0.15 }), SHP('circle', -380, 560, 860, 860, { fill: t.c, op: 0.05 }), SHP('circle', 1560, 720, 380, 380, { fill: t.acc2, op: 0.14 })],
    bars: (t) => [SHP('rect', 1240, -300, 340, 1700, { fill: t.acc, op: 0.12, rot: 18 }), SHP('rect', 1560, -300, 170, 1700, { fill: t.acc2, op: 0.2, rot: 18 }), SHP('rect', 1780, -300, 60, 1700, { fill: t.acc, op: 0.3, rot: 18 })],
    frame: (t) => [SHP('round', 60, 60, 1800, 960, { fill: '', stroke: t.acc, sw: 6, op: 0.75 }), SHP('round', 96, 96, 1728, 888, { fill: '', stroke: t.acc2, sw: 2, op: 0.6 })],
    sidebar: (t) => [SHP('rect', 0, 0, 44, 1080, { fill: t.acc }), SHP('rect', 44, 0, 8, 1080, { fill: t.acc2, op: 0.55 }), SHP('rect', 1500, 880, 420, 200, { fill: t.acc, op: 0.1 })],
    corner: (t) => [SHP('rect', -260, -260, 560, 560, { fill: t.acc, rot: 45 }), SHP('rect', 1640, 840, 520, 520, { fill: t.acc2, rot: 45, op: 0.9 })],
    cross: (t) => [SHP('cross', 1340, 150, 420, 760, { fill: t.acc, op: 0.14 }), SHP('circle', 1180, -300, 900, 900, { fill: t.acc2, op: 0.08 })],
    stars: (t) => [[200, 120, 70], [1500, 90, 110], [1760, 420, 60], [120, 820, 90], [1650, 860, 70], [900, 40, 50], [1200, 930, 50]].map((s, i) => SHP('star', s[0], s[1], s[2], s[2], { fill: i % 2 ? t.acc2 : t.acc, op: 0.7, rot: i * 14 })),
    confetti: (t) => { const cols = [t.acc, t.acc2, '#ffffff', '#fb7185']; const pts = [[120, 100], [420, 880], [1500, 140], [1740, 760], [860, 60], [60, 540], [1820, 380], [1100, 960], [300, 300], [1600, 560]]; return pts.map((p, i) => SHP(['circle', 'rect', 'tri', 'star'][i % 4], p[0], p[1], 46 + (i % 3) * 22, 46 + (i % 3) * 22, { fill: cols[i % 4], op: 0.85, rot: i * 23 })); },
    none: () => []
};
const dark = (t) => t.dark;
const decorOf = (t) => (DECOR[t.decor] || DECOR.none)(t);
const left = (t) => t.al === 'left';
const LAY = {
    title(t, c) {
        const L = left(t), x = L ? 180 : 180, w = L ? 1300 : 1560, al = L ? 'left' : 'center';
        return decorOf(t).concat([
            TXT(x, 300, w, 70, c.kicker || '', { size: 34, bold: true, color: t.acc, ls: 9, caps: true, al, font: t.f }),
            TXT(x, 380, w, 280, c.title || 'Title', { size: 150, bold: true, color: t.c, al, fit: true, font: t.f, lh: 1.05, shadow: dark(t) }),
            SHP('round', L ? 190 : 850, 690, 220, 10, { fill: t.acc }),
            TXT(x, 730, w, 150, c.sub || '', { size: 48, color: t.sub, al, fit: true, font: t.vf, lh: 1.25 })
        ]);
    },
    points(t, c) {
        const items = (c.items || []).slice(0, 5), step = Math.min(170, 600 / Math.max(1, items.length));
        const o = decorOf(t).concat([
            TXT(180, 100, 1560, 130, c.title || 'Title', { size: 88, bold: true, color: t.c, al: 'left', font: t.f, fit: true, shadow: dark(t) }),
            SHP('round', 190, 240, 170, 10, { fill: t.acc })
        ]);
        items.forEach((it, i) => {
            const y = 320 + i * step;
            o.push(SHP('circle', 180, y + 6, 96, 96, { fill: t.acc, shadow: true }));
            o.push(TXT(180, y + 6, 96, 96, String(i + 1), { size: 54, bold: true, color: dark(t) ? '#111827' : '#ffffff', font: t.f, pad: 0 }));
            o.push(TXT(320, y - 4, 1420, 116, it, { size: 58, color: t.c, al: 'left', fit: true, font: t.vf, lh: 1.15 }));
        });
        return o;
    },
    scripture(t, c) {
        return decorOf(t).concat([
            TXT(150, 70, 400, 400, '“', { size: 420, bold: true, color: t.acc, op: 0.55, font: 'Playfair Display', al: 'left', va: 'top', pad: 0 }),
            TXT(200, 230, 1520, 560, c.verse || 'For God so loved the world, that he gave his only begotten Son.', { size: 88, color: t.c, italic: t.vf === 'Lora' || t.vf === 'Playfair Display', fit: true, font: t.vf, lh: 1.22, shadow: dark(t) }),
            SHP('round', 850, 815, 220, 8, { fill: t.acc }),
            TXT(200, 840, 1520, 100, c.ref || 'John 3:16', { size: 52, bold: true, color: t.acc, font: t.f, ls: 3 })
        ]);
    },
    lyrics(t, c) {
        return decorOf(t).concat([TXT(140, 120, 1640, 840, c.text || 'Line one\nLine two', { size: 120, bold: true, color: t.c, fit: true, font: t.f, lh: 1.25, shadow: true })]);
    },
    announce(t, c) {
        const items = (c.items || []).slice(0, 3), n = Math.max(1, items.length), gap = 40, w = (1560 - gap * (n - 1)) / n;
        const o = decorOf(t).concat([
            TXT(180, 100, 1560, 130, c.title || 'Announcements', { size: 88, bold: true, color: t.c, al: left(t) ? 'left' : 'center', font: t.f, fit: true }),
            SHP('round', left(t) ? 190 : 850, 240, 220, 10, { fill: t.acc })
        ]);
        items.forEach((it, i) => {
            const x = 180 + i * (w + gap);
            o.push(SHP('round', x, 330, w, 620, { fill: dark(t) ? '#ffffff' : '#ffffff', op: dark(t) ? 0.1 : 1, stroke: dark(t) ? t.acc : '#e2e8f0', sw: dark(t) ? 3 : 2, shadow: !dark(t) }));
            if (it.e) o.push(EMO(it.e, x + w / 2 - 55, 370, 110));
            o.push(TXT(x + 20, 500, w - 40, 150, it.h || '', { size: 56, bold: true, color: dark(t) ? t.acc : t.acc, fit: true, font: t.f, lh: 1.1 }));
            o.push(TXT(x + 20, 650, w - 40, 280, it.t || '', { size: 40, color: dark(t) ? t.c : '#334155', fit: true, font: t.vf, lh: 1.3, va: 'top' }));
        });
        return o;
    },
    closing(t, c) {
        return decorOf(t).concat([
            c.e ? EMO(c.e, 810, 150, 300, { shadow: true }) : SHP('round', 850, 320, 220, 10, { fill: t.acc }),
            TXT(160, 470, 1600, 240, c.title || 'Thank you', { size: 130, bold: true, color: t.c, fit: true, font: t.f, lh: 1.05, shadow: dark(t) }),
            TXT(160, 730, 1600, 170, c.sub || '', { size: 50, color: t.sub, fit: true, font: t.vf, lh: 1.25 })
        ]);
    },
    section(t, c) {
        return decorOf(t).concat([
            TXT(180, 200, 1560, 420, c.num || '01', { size: 400, bold: true, color: t.acc, op: 0.9, font: t.f, al: left(t) ? 'left' : 'center', pad: 0 }),
            TXT(180, 640, 1560, 220, c.title || 'Section', { size: 120, bold: true, color: t.c, fit: true, font: t.f, al: left(t) ? 'left' : 'center' })
        ]);
    }
};
const bgOf = (t) => Object.assign({ dim: 0 }, clone(t.bg));
function layoutSlide(themeId, layout, c) {
    const t = THEMES[themeId] || THEMES.welcome;
    return newSlide(bgOf(t), (LAY[layout] || LAY.title)(t, c || {}));
}
const LAYOUT_NAMES = { title: 'Title', points: 'Title + points', scripture: 'Scripture', lyrics: 'Lyrics / big text', announce: 'Announcements (cards)', closing: 'Closing', section: 'Section number' };

const TEMPLATES = [
    { id: 'welcome',  th: 'welcome',  slides: [['title', { kicker: 'Sunday Service', title: 'Welcome Home', sub: 'We are so glad you are here' }], ['points', { title: 'Order of Service', items: ['Praise & Worship', 'The Word', 'Offering', 'Fellowship'] }], ['scripture', { verse: 'I was glad when they said unto me, Let us go into the house of the Lord.', ref: 'Psalm 122:1' }], ['closing', { title: 'God Bless You', sub: 'See you next Sunday', e: '✨' }]] },
    { id: 'service',  th: 'service',  slides: [['title', { kicker: 'This Sunday', title: 'Sunday Service', sub: 'Join us in worship' }], ['section', { num: '01', title: 'Praise & Worship' }], ['points', { title: 'Today', items: ['Opening Prayer', 'Worship', 'Message', 'Closing'] }], ['closing', { title: 'Go in Peace', sub: 'The Lord bless you and keep you', e: '🕊️' }]] },
    { id: 'series',   th: 'series',   slides: [['title', { kicker: 'New Sermon Series', title: 'Faith That Moves', sub: 'Week 1 · Pastor' }], ['points', { title: 'Three Key Points', items: ['Faith begins with hearing', 'Faith grows through trust', 'Faith is proved by action'] }], ['scripture', { verse: 'Now faith is the substance of things hoped for, the evidence of things not seen.', ref: 'Hebrews 11:1' }], ['closing', { title: 'Take Home', sub: 'Step out in faith this week', e: '🔥' }]] },
    { id: 'scripture',th: 'scripture',slides: [['scripture', { verse: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' }], ['scripture', { verse: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', ref: 'Proverbs 3:5' }], ['scripture', { verse: 'I can do all things through Christ which strengtheneth me.', ref: 'Philippians 4:13' }]] },
    { id: 'lyrics',   th: 'lyrics',   slides: [['title', { kicker: 'Worship', title: 'Song Title', sub: 'Artist / Writer' }], ['lyrics', { text: 'First line of the verse\nSecond line of the verse\nThird line of the verse' }], ['lyrics', { text: 'Chorus line one\nChorus line two\nChorus line three' }], ['lyrics', { text: 'Bridge line one\nBridge line two' }]] },
    { id: 'news',     th: 'news',     slides: [['title', { kicker: 'This Week', title: 'Announcements', sub: 'Please take note' }], ['announce', { title: 'Coming Up', items: [{ e: '📅', h: 'Midweek Service', t: 'Wednesday at 6:00 PM in the main auditorium.' }, { e: '🙏', h: 'Prayer Meeting', t: 'Friday at 5:30 AM. Come and pray with us.' }, { e: '🎉', h: 'Fellowship Lunch', t: 'After service next Sunday. Everyone is invited.' }] }], ['announce', { title: 'Get Involved', items: [{ e: '🎶', h: 'Join the Choir', t: 'Rehearsals every Thursday evening.' }, { e: '🤝', h: 'Volunteer', t: 'See the ushers to serve on a team.' }] }]] },
    { id: 'giving',   th: 'giving',   slides: [['title', { kicker: 'Worship with Giving', title: 'Offering', sub: 'Honour the Lord with your substance' }], ['scripture', { verse: 'God loveth a cheerful giver.', ref: '2 Corinthians 9:7' }], ['closing', { title: 'Thank You', sub: 'May God multiply your seed', e: '🌾' }]] },
    { id: 'prayer',   th: 'prayer',   slides: [['title', { kicker: 'Altar Call', title: 'Let Us Pray', sub: 'Come as you are' }], ['scripture', { verse: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', ref: 'Matthew 11:28' }], ['closing', { title: 'God Hears You', sub: 'He is faithful', e: '🙏' }]] },
    { id: 'youth',    th: 'youth',    slides: [['title', { kicker: 'Friday Night', title: 'Youth Night', sub: 'Bring a friend!' }], ['points', { title: 'Tonight', items: ['Worship', 'Games', 'Message', 'Prayer'] }], ['closing', { title: 'See You There', sub: 'Come ready to be on fire', e: '🔥' }]] },
    { id: 'celebrate',th: 'celebrate',slides: [['title', { kicker: 'Special Service', title: 'Thanksgiving', sub: 'Give thanks to the Lord' }], ['scripture', { verse: 'O give thanks unto the Lord; for he is good: for his mercy endureth for ever.', ref: 'Psalm 107:1' }], ['closing', { title: 'We Celebrate', sub: 'God has been faithful', e: '🎉' }]] },
    { id: 'christmas',th: 'christmas',slides: [['title', { kicker: 'Merry Christmas', title: 'Joy to the World', sub: 'The Lord is come' }], ['scripture', { verse: 'For unto you is born this day in the city of David a Saviour, which is Christ the Lord.', ref: 'Luke 2:11' }], ['closing', { title: 'Merry Christmas', sub: 'God bless you and your family', e: '🎄' }]] },
    { id: 'easter',   th: 'easter',   slides: [['title', { kicker: 'He Is Risen', title: 'Resurrection Sunday', sub: 'Christ is alive' }], ['scripture', { verse: 'He is not here, but is risen.', ref: 'Luke 24:6' }], ['closing', { title: 'Alleluia', sub: 'Death could not hold Him', e: '✝️' }]] },
    { id: 'minimal',  th: 'minimal',  slides: [['title', { kicker: 'Message', title: 'A Clean Start', sub: 'Simple, readable slides' }], ['points', { title: 'Main Ideas', items: ['One clear thought', 'One clear verse', 'One clear step'] }], ['scripture', { verse: 'Be still, and know that I am God.', ref: 'Psalm 46:10' }]] },
    { id: 'visitors', th: 'visitors', slides: [['title', { kicker: 'First time here?', title: 'Welcome, Friend', sub: 'We are glad you came' }], ['announce', { title: 'Connect With Us', items: [{ e: '📝', h: 'Fill a Card', t: 'Tell us about yourself at the welcome desk.' }, { e: '☕', h: 'Join Us After', t: 'Refreshments in the foyer after service.' }, { e: '📱', h: 'Stay In Touch', t: 'Follow us online and join our community.' }] }]] },
    { id: 'kids',     th: 'kids',     slides: [['title', { kicker: "Children's Church", title: 'Kids Church', sub: 'Let us have fun with Jesus!' }], ['points', { title: 'Today We Learn', items: ['God loves you', 'Jesus is your friend', 'We can pray anytime'] }], ['closing', { title: 'Great Job!', sub: 'See you next week', e: '🌟' }]] }
];
function buildTemplate(id) {
    const T = TEMPLATES.find(x => x.id === id); if (!T) return null;
    const d = newDeck(THEMES[T.th].name, T.slides.map(s => layoutSlide(T.th, s[0], s[1])));
    d.theme = T.th; return d;
}

// ---------- state ----------
const PREF_DEFAULTS = { layout: ['decks', 'tools', 'live'], transition: 'fade', auto: false, secs: 10, loop: true, fit: 'contain', safe: false, snap: true, ai: { provider: 'gemini', key: '', model: '' } };
const S = {
    decks: [], deckId: null, idx: 0, hi: new Set(), sel: null, undo: [], redo: [], clip: null,
    cue: lsGet('ebpStudioCue', []), live: null, multi: new Set(), deckSel: new Set(), pasteN: 0, open: false, filter: 'all', q: '', saveT: null, dirty: new Set(), ready: false,
    prefs: Object.assign(clone(PREF_DEFAULTS), lsGet('ebpStudioPrefs', {}))
};
S.prefs.ai = Object.assign({ provider: 'gemini', key: '', model: '' }, S.prefs.ai || {});
if (!Array.isArray(S.prefs.layout) || S.prefs.layout.length !== 3 || new Set(S.prefs.layout).size !== 3) S.prefs.layout = PREF_DEFAULTS.layout.slice();
const savePrefs = () => lsSet('ebpStudioPrefs', S.prefs);
const saveCue = () => lsSet('ebpStudioCue', S.cue);
const curDeck = () => S.decks.find(d => d.id === S.deckId) || null;
const curSlide = () => { const d = curDeck(); return d ? d.slides[S.idx] || null : null; };
const multiOn = () => S.multi.size > 1 && !!S.sel && S.multi.has(S.sel);
function selObjs() { const s = curSlide(); if (!s || !S.sel) return []; if (multiOn()) return s.objs.filter(o => S.multi.has(o.id)); const o = s.objs.find(x => x.id === S.sel); return o ? [o] : []; }
function setSel(ids) { ids = (ids || []).filter(Boolean); S.sel = ids.length ? ids[0] : null; S.multi = new Set(ids); }
const curObj = () => { const l = selObjs(); return l.length === 1 ? l[0] : null; };
function selBBox(list) { let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9; list.forEach(o => { x1 = Math.min(x1, o.x); y1 = Math.min(y1, o.y); x2 = Math.max(x2, o.x + o.w); y2 = Math.max(y2, o.y + o.h); }); return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }; }
const TRANSITIONS = [['cut', 'Instant cut'], ['fade', 'Fade'], ['left', 'Slide from right'], ['right', 'Slide from left'], ['up', 'Slide up'], ['zoomin', 'Zoom in'], ['zoomout', 'Zoom out'], ['blur', 'Blur in'], ['flip', 'Flip'], ['wipe', 'Wipe']];
const PANELS = { decks: 'Slide decks', tools: 'Scripture + AI', live: 'Live + Cue list' };
const SWATCH = ['#ffffff', '#f8fafc', '#fbbf24', '#f97316', '#ef4444', '#ec4899', '#a78bfa', '#38bdf8', '#34d399', '#111827'];
const BG_PRESETS = [['#1e3a8a', '#0b1226'], ['#065f46', '#022c22'], ['#7c3aed', '#db2777'], ['#92400e', '#431407'], ['#0ea5e9', '#075985'], ['#1f2937', '#030712'], ['#312e81', '#030014'], ['#c2410c', '#7c2d12'], ['#fde047', '#fb923c'], ['#fef9c3', '#fdba74']];
const EMOJIS = ['✝️', '🙏', '🕊️', '❤️', '🔥', '⭐', '✨', '🌟', '🎶', '🎵', '📖', '👑', '⛪', '🙌', '👏', '🌈', '☀️', '🌙', '💡', '🕯️', '🍞', '🍷', '🌾', '🌿', '🌳', '🌊', '🦁', '🐑', '🐟', '🔔', '🎺', '🎸', '🎤', '🎉', '🎁', '🏆', '💪', '🤝', '😊', '😇', '✅', '➡️', '❓', '❗', '💒', '🕎', '🎄', '🥇'];
const SHAPES = [['rect', 'Rectangle'], ['round', 'Rounded box'], ['pill', 'Pill'], ['circle', 'Circle'], ['tri', 'Triangle'], ['diamond', 'Diamond'], ['star', 'Star'], ['arrow', 'Arrow'], ['cross', 'Cross'], ['heart', 'Heart'], ['line', 'Line']];
const shapeSvg = (k) => { const p = { rect: '<rect x="3" y="5" width="18" height="14" fill="currentColor"/>', round: '<rect x="3" y="5" width="18" height="14" rx="5" fill="currentColor"/>', pill: '<rect x="2" y="7" width="20" height="10" rx="5" fill="currentColor"/>', circle: '<circle cx="12" cy="12" r="9" fill="currentColor"/>', tri: '<polygon points="12,3 22,20 2,20" fill="currentColor"/>', diamond: '<polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>', star: '<polygon points="12,1 15,9 23,9 17,14 19,22 12,17 5,22 7,14 1,9 9,9" fill="currentColor"/>', arrow: '<polygon points="2,8 13,8 13,3 22,12 13,21 13,16 2,16" fill="currentColor"/>', cross: '<polygon points="9,2 15,2 15,8 21,8 21,13 15,13 15,22 9,22 9,13 3,13 3,8 9,8" fill="currentColor"/>', heart: '<path d="M12 21C2 13 4 4 9 4c2 0 3 1 3 2 0-1 1-2 3-2 5 0 7 9-3 17z" fill="currentColor"/>', line: '<line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="3"/>' }; return '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">' + (p[k] || p.rect) + '</svg>'; };

// ---------- saving ----------
const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function setSaved(t) { const e = $('#ebsSaved'); if (e) e.textContent = t; }
function commitDraft(d) { // a template stays untouched until you change something; then your edited copy becomes one of your decks
    if (!d || !d.draft) return; d.draft = false; const T = THEMES[d.theme];
    if (T && d.name === T.name) d.name = T.name + ' (my copy)';
    const nm = $('#ebsDeckName'); if (nm && d.id === S.deckId) nm.value = d.name; renderDecks();
}
function touch(slide) { if (slide) slide.v = (slide.v || 0) + 1; const d = curDeck(); if (d) { commitDraft(d); d.updated = Date.now(); S.dirty.add(d.id); } schedSave(); }
function schedSave() { setSaved('Saving…'); clearTimeout(S.saveT); S.saveT = setTimeout(flush, 700); }
async function flush() {
    clearTimeout(S.saveT);
    const ids = Array.from(S.dirty); S.dirty.clear();
    for (const id of ids) {
        const d = S.decks.find(x => x.id === id); if (!d || d.draft) continue;
        d.imgs = deckImgs(d);
        try { await dbPut(d); } catch (e) { try { localStorage.setItem('ebpStudioFallback', JSON.stringify(S.decks)); setSaved('Saved in a backup spot ' + timeNow()); } catch (e2) { setSaved('Could not save: browser storage is blocked or full'); } return; }
    }
    setSaved('Saved ' + timeNow());
}
async function removeDeckStored(id) { try { await dbDel(id); } catch (e) { /* ignore */ } }
function toast(msg, bad) {
    let t = $('#ebsToast'); if (!t) return;
    t.textContent = msg; t.className = 'ebs-toast show' + (bad ? ' bad' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = 'ebs-toast'; }, bad ? 5200 : 2600);
}

// ---------- undo ----------
function updUndo() { const u = $('#ebsUndo'), r = $('#ebsRedo'); if (u) { u.disabled = !S.undo.length; r.disabled = !S.redo.length; } }
function snap() { const d = curDeck(); if (!d) return; S.undo.push(JSON.stringify({ slides: d.slides, idx: S.idx })); if (S.undo.length > 60) S.undo.shift(); S.redo = []; updUndo(); }
function undoRedo(fromStack, toStack) {
    const d = curDeck(); if (!d || !fromStack.length) return;
    toStack.push(JSON.stringify({ slides: d.slides, idx: S.idx }));
    const st = JSON.parse(fromStack.pop()); d.slides = st.slides; S.idx = clamp(st.idx, 0, d.slides.length - 1); S.sel = null; S.hi.clear();
    d.slides.forEach(s => { s.v = (s.v || 0) + 1; }); touch(); refreshAll();
}

// ---------- styles ----------
const CSS = `
.ebs{position:fixed;inset:0;z-index:8000;display:none;flex-direction:column;background:var(--b0);color:var(--tx);font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;--b0:#060a13;--b1:#0f1626;--b2:#1e293b;--b3:#0a1120;--bd:#334155;--tx:#f8fafc;--mu:#94a3b8;--ac:#38bdf8;--acx:#04121f;--cue:#fbbf24;--live:#ef4444}
:root[data-theme="light"] .ebs{--b0:#e8edf4;--b1:#ffffff;--b2:#eef2f7;--b3:#f6f8fb;--bd:#cbd5e1;--tx:#0f172a;--mu:#475569;--ac:#0369a1;--acx:#ffffff}
.ebs.open{display:flex}
.ebs *{box-sizing:border-box}
.ebs button,.ebs select,.ebs input,.ebs textarea{font:inherit;color:inherit}
.ebs button{cursor:pointer}
.ebs-head{flex:none;height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;background:var(--b1);border-bottom:1px solid var(--bd)}
.ebs-head h2{margin:0;font-size:15px;font-weight:800;white-space:nowrap}
.ebs-name{background:var(--b0);border:1px solid var(--bd);border-radius:8px;padding:6px 10px;min-width:180px;max-width:320px;flex:0 1 280px}
.ebs-grow{flex:1}
.ebs-saved{font-size:12px;color:var(--mu);white-space:nowrap}
.ebs-btn{background:var(--b2);border:1px solid var(--bd);border-radius:8px;padding:6px 11px;font-size:12.5px;white-space:nowrap}
.ebs-btn:hover{border-color:var(--ac)}
.ebs-btn.pri{background:var(--ac);color:var(--acx);border-color:var(--ac);font-weight:700}
.ebs-btn.cue{background:var(--cue);color:#1c1100;border-color:var(--cue);font-weight:700}
.ebs-btn.live{background:var(--live);color:#fff;border-color:var(--live);font-weight:700}
.ebs-btn.on{background:var(--ac);color:var(--acx);border-color:var(--ac)}
.ebs-btn.fz{background:#f59e0b;color:#1c1917;border-color:#fbbf24;font-weight:800}
.ebs-btn.ghost{background:transparent}
.ebs-btn[disabled]{opacity:.45;cursor:default}
.ebs-body{flex:1;min-height:0;display:grid;grid-template-columns:300px minmax(0,1fr) 340px;gap:12px;padding:12px}
.ebs-slot{min-height:0;min-width:0;display:flex;flex-direction:column;gap:12px}
.ebs-slot>.ebs-panel{flex:1;min-height:0}
.ebs-center{min-width:0;min-height:0;display:flex;flex-direction:column;gap:12px}
.ebs-panel{display:flex;flex-direction:column;gap:12px;overflow:auto;min-height:0}
.ebs-card{background:var(--b1);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:9px;min-width:0}
.ebs-card h3{margin:0;font-size:13.5px;font-weight:800;display:flex;justify-content:space-between;align-items:center;gap:8px}
.ebs-card h3 small{font-weight:400;color:var(--mu);font-size:11.5px}
.ebs-slot-under{flex:none;height:196px}
.ebs-slot-under>.ebs-panel{flex-direction:row;align-items:stretch;overflow:auto}
.ebs-slot-under>.ebs-panel>.ebs-card{flex:1 1 0;min-width:260px;overflow:auto}
.ebs input[type=text],.ebs input[type=number],.ebs input[type=password],.ebs textarea,.ebs select{background:var(--b0);border:1px solid var(--bd);border-radius:8px;padding:7px 9px;width:100%;min-width:0}
.ebs textarea{resize:vertical;min-height:62px}
.ebs input[type=color]{width:34px;height:30px;padding:0;border:1px solid var(--bd);border-radius:6px;background:var(--b0);cursor:pointer}
.ebs input[type=range]{width:90px}
.ebs-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ebs-row>.f1{flex:1;min-width:0}
.ebs-lab{font-size:11px;color:var(--mu);font-weight:700;letter-spacing:.8px;text-transform:uppercase}
.ebs-chips{display:flex;gap:6px;flex-wrap:wrap}
.ebs-chip{background:transparent;border:1px solid var(--bd);border-radius:999px;padding:4px 11px;font-size:12px;color:var(--mu)}
.ebs-chip.on{border-color:var(--ac);color:var(--ac);background:var(--b2)}
.ebs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ebs-slot-under .ebs-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
.ebs-deck{display:flex;flex-direction:column;gap:4px;cursor:pointer;position:relative}
.ebs-deck canvas{width:100%;aspect-ratio:16/9;border-radius:8px;display:block;background:#000}
.ebs-deck.sel canvas{outline:2px solid var(--ac);outline-offset:1px}
.ebs-deck .nm{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ebs-deck .nm small{color:var(--mu)}
.ebs-deck .tag{position:absolute;left:6px;top:6px;background:rgba(0,0,0,.6);color:#fff;border-radius:6px;font-size:10px;padding:2px 6px}
.ebs-deck .more{position:absolute;right:5px;top:5px;background:rgba(0,0,0,.6);color:#fff;border:0;border-radius:6px;padding:1px 7px;font-size:14px;display:none}
.ebs-deck:hover .more{display:block}
.ebs-tb{background:var(--b1);border:1px solid var(--bd);border-radius:12px;padding:8px 12px;display:flex;flex-direction:column;gap:8px;position:relative;flex:none}
.ebs-tb .ebs-row{gap:7px}
.ebs-sep{width:1px;height:22px;background:var(--bd)}
.ebs-pop{position:absolute;z-index:30;background:var(--b3);border:1px solid var(--ac);border-radius:12px;padding:12px;box-shadow:0 12px 34px rgba(0,0,0,.5);display:none;flex-direction:column;gap:10px;width:330px;max-height:70vh;overflow:auto}
.ebs-pop.show{display:flex}
.ebs-pgrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}
.ebs-pgrid button{height:38px;background:var(--b2);border:1px solid var(--bd);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--tx)}
.ebs-pgrid button:hover{border-color:var(--ac)}
.ebs-sw{display:flex;gap:6px;flex-wrap:wrap}
.ebs-sw button{width:22px;height:22px;border-radius:50%;border:2px solid var(--bd);padding:0}
.ebs-bgp{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.ebs-bgp button{height:34px;border-radius:8px;border:1px solid var(--bd)}
.ebs-stagebox{flex:1;min-height:0;background:var(--b1);border:1px solid var(--bd);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.ebs-stagewrap{flex:1;min-height:80px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ebs-stage{position:relative;background:#000;border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.4);touch-action:none;user-select:none}
.ebs-stage canvas{width:100%;height:100%;display:block;border-radius:6px}
.ebs-ov{position:absolute;inset:0;cursor:default;overflow:hidden;border-radius:6px}
.ebs-sel{position:absolute;outline:2px solid var(--ac);pointer-events:none}
.ebs-sel i{position:absolute;width:11px;height:11px;background:#fff;border:2px solid var(--ac);border-radius:2px;pointer-events:auto;margin:-6px 0 0 -6px}
.ebs-sel i[data-h=rot]{border-radius:50%;background:var(--ac);cursor:grab}
.ebs-sel .stem{position:absolute;left:50%;top:-26px;width:2px;height:26px;background:var(--ac);margin-left:-1px}
.ebs-guide{position:absolute;background:rgba(74,222,128,.45);pointer-events:none;z-index:6}.ebs-guide.hit{background:#22c55e;box-shadow:0 0 7px #22c55e}
.ebs-gbox{position:absolute;border:1px dashed rgba(74,222,128,.85);border-radius:3px;pointer-events:none;z-index:6}.ebs-gbox.hit{border:2px solid #22c55e;box-shadow:0 0 8px rgba(34,197,94,.7)}
.ebs-glab{position:absolute;transform:translate(-50%,-100%);background:#0b1324;color:#e5e7eb;border:1px solid #4ade80;border-radius:6px;padding:2px 7px;font-size:12px;font-weight:700;pointer-events:none;z-index:7;white-space:nowrap}.ebs-glab.hit{background:#16a34a;color:#fff;border-color:#22c55e}
.ebs-safe{position:absolute;inset:5%;border:1px dashed rgba(255,255,255,.4);pointer-events:none}
.ebs-edit{position:absolute;outline:2px solid var(--cue);background:rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;white-space:pre-wrap;word-break:break-word;cursor:text}
.ebs-edit:focus{outline:2px solid var(--cue)}
.ebs-film{display:flex;gap:10px;align-items:center;overflow-x:auto;padding:6px 8px 4px;flex:none}
.ebs-th{flex:none;position:relative;border-radius:6px;cursor:pointer}
.ebs-th canvas{width:128px;height:72px;display:block;border-radius:6px;background:#000}
.ebs-th.cur canvas{outline:2px solid var(--ac);outline-offset:1px}
.ebs-th.hi canvas{outline:2px solid var(--cue);outline-offset:1px}
.ebs-th.cur.hi canvas{outline:3px solid var(--cue);box-shadow:0 0 0 2px var(--ac)}
.ebs-th .no{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.65);color:#fff;border-radius:4px;font-size:10px;padding:1px 5px}
.ebs-th .bd{position:absolute;right:-6px;top:-6px;width:18px;height:18px;border-radius:50%;background:var(--cue);color:#1c1100;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center}
.ebs-th.hi .bd{display:flex}
.ebs-th .air{position:absolute;left:4px;top:4px;background:var(--live);color:#fff;border-radius:4px;font-size:9px;padding:1px 5px;font-weight:700}
.ebs-th.over canvas{outline:2px dashed var(--ac)}
.ebs-addth{width:56px;height:72px;border:1px dashed var(--ac);color:var(--ac);background:transparent;border-radius:6px;font-size:24px;flex:none}
.ebs-selbar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--mu)}
.ebs-selbar b{color:var(--cue)}
.ebs-live{position:relative;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff}
.ebs-live canvas{position:absolute;inset:0;width:100%;height:100%}
.ebs-live .nl{font-size:11.5px;color:#94a3b8;padding:6px}
.ebs-pill{font-size:11px;font-weight:800;letter-spacing:.8px;color:var(--mu)}
.ebs-pill.on{color:var(--live)}
.ebs-cue{display:flex;flex-direction:column;gap:6px;max-height:210px;overflow:auto}
.ebs-cuerow{display:flex;align-items:center;gap:8px;background:var(--b0);border:1px solid var(--bd);border-radius:8px;padding:5px 7px;cursor:pointer}
.ebs-cuerow.next{border-color:var(--cue)}
.ebs-cuerow.air{border-color:var(--live);box-shadow:0 0 0 1px var(--live) inset}
.ebs-cuerow .n{width:20px;height:20px;border-radius:50%;background:var(--bd);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.ebs-cuerow.next .n{background:var(--cue);color:#1c1100}
.ebs-cuerow canvas{width:56px;height:32px;border-radius:4px;flex:none;background:#000}
.ebs-cuerow .t{flex:1;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ebs-cuerow .x{background:transparent;border:0;color:var(--mu);font-size:15px}
.ebs-note{font-size:11.5px;color:var(--mu);line-height:1.5}
.ebs-verse{background:var(--b0);border:1px solid var(--bd);border-radius:8px;padding:8px 10px;font-size:12.5px;line-height:1.45;max-height:96px;overflow:auto;white-space:pre-wrap}
.ebs-verses{background:var(--b0);border:1px solid var(--bd);border-radius:8px;max-height:150px;overflow:auto;display:flex;flex-direction:column}
.ebs-vrow{display:flex;gap:8px;padding:5px 9px;cursor:pointer;font-size:12.5px;line-height:1.4;border-bottom:1px solid var(--bd);user-select:none}
.ebs-vrow b{min-width:22px;color:var(--mu)}
.ebs-vrow:hover{background:var(--b2)}
.ebs-vrow.on{background:var(--ac);color:var(--acx)}
.ebs-vrow.on b{color:var(--acx)}
.ebs-hits{display:flex;flex-direction:column;gap:5px;max-height:120px;overflow:auto}
.ebs-hits button{text-align:left;background:var(--b0);border:1px solid var(--bd);border-radius:8px;padding:5px 8px;font-size:12px}
.ebs-modal{position:absolute;inset:0;z-index:50;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:20px}
.ebs-modal.show{display:flex}
.ebs-mbox{background:var(--b1);border:1px solid var(--ac);border-radius:14px;width:640px;max-width:100%;max-height:92vh;overflow:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.ebs-mbox h3{margin:0;font-size:16px}
.ebs-sec{border:1px solid var(--bd);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:9px}
.ebs-sec h4{margin:0;font-size:13px}
.ebs-3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ebs-toast{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);background:#0b1324;color:#fff;border:1px solid var(--ac);border-radius:10px;padding:9px 16px;font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:60;max-width:80%}
.ebs-toast.show{opacity:1}.ebs-toast.bad{border-color:#ef4444}
.ebs-menu{position:absolute;z-index:40;background:var(--b3);border:1px solid var(--bd);border-radius:10px;padding:6px;display:none;flex-direction:column;min-width:170px;box-shadow:0 10px 28px rgba(0,0,0,.5)}
.ebs-menu.show{display:flex}
.ebs-menu button{background:transparent;border:0;text-align:left;padding:7px 10px;border-radius:6px;font-size:13px}
.ebs-menu button:hover{background:var(--b2)}
.ebs-menu button.dan{color:#f87171}
.ebs-selx{position:absolute;outline:1px dashed var(--ac);pointer-events:none}
.ebs-marq{position:absolute;border:1px solid var(--ac);background:rgba(56,189,248,.14);pointer-events:none}
.ebs-lay{display:flex;flex-direction:column;gap:4px;max-height:340px;overflow:auto}
.ebs-lrow{display:flex;align-items:center;gap:6px;background:var(--b0);border:1px solid var(--bd);border-radius:8px;padding:4px 6px;cursor:pointer}
.ebs-lrow.on{border-color:var(--ac);background:var(--b2)}.ebs-lrow.over{border-top:3px solid var(--cue)}
.ebs-lrow .ic{width:22px;text-align:center;font-weight:800;color:var(--mu)}.ebs-lrow .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px}
.ebs-lrow button{background:transparent;border:0;padding:2px 5px;border-radius:5px;font-size:12px}.ebs-lrow button:hover{background:var(--b3)}
.ebs-bulk{position:sticky;bottom:-4px;margin-top:auto;background:var(--b3);border:1px solid var(--cue);border-radius:10px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;box-shadow:0 8px 22px rgba(0,0,0,.5)}
.ebs-bulk b{flex:1 1 100%;font-size:12.5px;color:var(--cue)}
.ebs-deck.msel canvas{outline:3px solid var(--cue);outline-offset:1px}
.ebs-deck .ck{position:absolute;left:6px;top:6px;background:var(--cue);color:#1c1100;border-radius:50%;width:20px;height:20px;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}
.ebs-keys{position:absolute;z-index:45;top:54px;right:14px;width:460px;max-width:calc(100% - 28px);max-height:calc(100% - 80px);overflow:auto;background:var(--b3);border:1px solid var(--ac);border-radius:12px;padding:12px 14px;display:none;flex-direction:column;gap:8px;box-shadow:0 14px 36px rgba(0,0,0,.55)}
.ebs-keys.show{display:flex}.ebs-keys h4{margin:6px 0 2px;font-size:12px;color:var(--ac);letter-spacing:.8px;text-transform:uppercase}
.ebs-krow{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;padding:2px 0;border-bottom:1px solid var(--bd)}.ebs-krow kbd{background:var(--b2);border:1px solid var(--bd);border-radius:5px;padding:1px 6px;font:600 11.5px system-ui;white-space:nowrap;align-self:flex-start}
#ebpSlideStudioBtn{margin-left:4px}
@media (max-width:1100px){.ebs-body{grid-template-columns:240px minmax(0,1fr) 280px}}
`;
function injectCss() { if ($('#ebsCss')) return; const s = document.createElement('style'); s.id = 'ebsCss'; s.textContent = CSS; document.head.appendChild(s); }

// ---------- the screen ----------
let el = {}; // cached elements
function buildUI() {
    if (el.root) return;
    injectCss(); linkFonts();
    const root = document.createElement('div'); root.id = 'ebpStudio'; root.className = 'ebs'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Slide Studio');
    root.innerHTML = `
<div class="ebs-head">
  <h2>🎬 Slide Studio</h2>
  <input class="ebs-name" id="ebsDeckName" type="text" aria-label="Deck name" maxlength="80">
  <span class="ebs-saved" id="ebsSaved">Saved</span>
  <span class="ebs-grow"></span>
  <button class="ebs-btn" id="ebsUndo" title="Undo (Ctrl+Z)">↶ Undo</button>
  <button class="ebs-btn" id="ebsRedo" title="Redo (Ctrl+Y)">↷ Redo</button>
  <button class="ebs-btn" id="ebsKeysBtn" title="List of keyboard shortcuts (Ctrl+/)">⌨ Shortcuts ▾</button>
  <button class="ebs-btn" id="ebsFreeze" title="Freeze the screens (same as the main Freeze button — works from every dashboard)">❄ Freeze</button>
  <button class="ebs-btn" id="ebsSettingsBtn">⚙ Settings</button>
  <button class="ebs-btn pri" id="ebsClose">Close studio</button>
</div>
<div class="ebs-body" id="ebsBody">
  <div class="ebs-slot" id="ebsSlotLeft"></div>
  <div class="ebs-center">
    <div class="ebs-tb" id="ebsToolbar">
      <div class="ebs-row" id="ebsRow1">
        <span class="ebs-lab">Insert</span>
        <button class="ebs-btn" id="tbText">+ Text</button>
        <button class="ebs-btn" id="tbImage">+ Image</button>
        <button class="ebs-btn" id="tbShapes" data-pop="popShapes">Shapes ▾</button>
        <button class="ebs-btn" id="tbEmoji" data-pop="popEmoji">Emoji ▾</button>
        <button class="ebs-btn" id="tbLine" data-pop="popLines">Lines ▾</button>
        <span class="ebs-sep"></span>
        <button class="ebs-btn" id="tbBg" data-pop="popBg">Background ▾</button>
        <button class="ebs-btn" id="tbLayers" data-pop="popLayers">Layers ▾</button>
        <span class="ebs-sep"></span>
        <span class="ebs-lab">Slide</span>
        <button class="ebs-btn" id="tbNewSlide" data-pop="popLayouts">+ New slide ▾</button>
        <button class="ebs-btn" id="tbDupSlide">Duplicate</button>
        <button class="ebs-btn" id="tbDelSlide">Delete</button>
        <input type="file" id="ebsImgPick" accept="image/*" hidden>
        <input type="file" id="ebsBgPick" accept="image/*" hidden>
      </div>
      <div class="ebs-row" id="ebsRow2"></div>
      <div class="ebs-pop" id="popShapes" style="right:12px;top:48px"></div>
      <div class="ebs-pop" id="popEmoji" style="right:12px;top:48px"></div>
      <div class="ebs-pop" id="popLines" style="right:12px;top:48px"></div>
      <div class="ebs-pop" id="popLayers" style="right:12px;top:48px"></div>
      <div class="ebs-pop" id="popBg" style="right:12px;top:48px"></div>
      <div class="ebs-pop" id="popLayouts" style="right:12px;top:48px;width:260px"></div>
    </div>
    <div class="ebs-stagebox">
      <div class="ebs-stagewrap" id="ebsWrap"><div class="ebs-stage" id="ebsStage"><canvas id="ebsCanvas" width="1280" height="720"></canvas><div class="ebs-ov" id="ebsOv"></div></div></div>
      <div class="ebs-film" id="ebsFilm"></div>
      <div class="ebs-selbar" id="ebsSelbar"></div>
    </div>
    <div class="ebs-slot ebs-slot-under" id="ebsSlotUnder"></div>
  </div>
  <div class="ebs-slot" id="ebsSlotRight"></div>
</div>
<div class="ebs-modal" id="ebsModal"><div class="ebs-mbox" id="ebsMbox"></div></div>
<div class="ebs-menu" id="ebsMenu"></div>
<div class="ebs-keys" id="ebsKeys"></div>
<div class="ebs-toast" id="ebsToast"></div>`;
    document.body.appendChild(root);
    el.root = root; el.canvas = $('#ebsCanvas'); el.ov = $('#ebsOv'); el.stage = $('#ebsStage'); el.wrap = $('#ebsWrap'); el.film = $('#ebsFilm');
    buildPanels(); applyLayout(); bindStatic();
    redrawHook = () => { if (S.open) drawStage(); };
    if (window.ResizeObserver) new ResizeObserver(fitStage).observe(el.wrap);
    window.addEventListener('resize', fitStage);
}
function fitStage() {
    if (!el.wrap) return;
    const r = el.wrap.getBoundingClientRect(); const aw = Math.max(120, r.width - 4), ah = Math.max(70, r.height - 4);
    let w = Math.min(aw, ah * 16 / 9), h = w * 9 / 16;
    el.stage.style.width = Math.floor(w) + 'px'; el.stage.style.height = Math.floor(h) + 'px';
    drawSel();
}
const stageScale = () => el.stage.getBoundingClientRect().width / W;

// ---------- panels (three movable panels, one per slot) ----------
function buildPanels() {
    el.panels = {};
    ['decks', 'tools', 'live'].forEach(k => { const p = document.createElement('div'); p.className = 'ebs-panel'; p.dataset.panel = k; el.panels[k] = p; });
    el.panels.decks.innerHTML = `
<div class="ebs-card">
  <h3>Slide decks <small id="ebsDeckCount"></small></h3>
  <div class="ebs-row"><button class="ebs-btn pri f1" id="dkNew">+ New deck</button><button class="ebs-btn f1" id="dkImport">Import ▾</button></div>
  <input type="text" id="dkSearch" placeholder="Search decks and slide text" aria-label="Search decks">
  <div class="ebs-chips" id="dkChips"><button class="ebs-chip on" data-f="all">All</button><button class="ebs-chip" data-f="mine">My decks</button><button class="ebs-chip" data-f="tpl">Templates</button></div>
  <input type="file" id="dkPick" accept=".pptx,.pdf,.json,.ebpdeck,image/*" multiple hidden>
</div>
<div class="ebs-card" style="flex:1;min-height:120px;overflow:auto"><div class="ebs-grid" id="dkGrid"></div><div class="ebs-note" id="dkNote">Decks save by themselves in this browser. They are also included when you save your profile from the main screen. Hold Ctrl and click decks to select several.</div><div class="ebs-bulk" id="dkBulk" hidden></div></div>`;
    el.panels.tools.innerHTML = `
<div class="ebs-card">
  <h3>Add scripture <small id="scrVer"></small></h3>
  <input type="text" id="scrIn" placeholder="Type: gen 1:1, rom 8:28, john 3:16-18 or a word" aria-label="Verse or search words" autocomplete="off">
  <div class="ebs-hits" id="scrHits" hidden></div>
  <div class="ebs-verse" id="scrOut">Start typing a book and verse. Results appear straight away, then click the verses you want.</div>
  <div class="ebs-row"><button class="ebs-btn pri f1" id="scrAdd" disabled>Add to this slide</button><button class="ebs-btn f1" id="scrNew" disabled>New slide</button><button class="ebs-btn ghost" id="scrAll" disabled>All</button></div>
</div>
<div class="ebs-card">
  <h3>Create with AI <small>uses your own key</small></h3>
  <textarea id="aiPrompt" rows="3" placeholder="e.g. 5 slides for a Sunday sermon on faith: title, 3 main points, closing prayer" aria-label="Describe the slides"></textarea>
  <div class="ebs-row"><select id="aiTheme" class="f1" aria-label="Look"></select><input type="number" id="aiCount" min="2" max="14" value="6" style="width:62px" aria-label="Number of slides"></div>
  <div class="ebs-row"><button class="ebs-btn pri f1" id="aiGo">Generate slides</button></div>
  <div class="ebs-note" id="aiNote"></div>
</div>`;
    el.panels.live.innerHTML = `
<div class="ebs-card">
  <h3>Live display <span class="ebs-pill" id="lvPill">OFF AIR</span></h3>
  <div class="ebs-live" id="lvBox"><canvas id="lvCanvas" width="640" height="360" hidden></canvas><div class="nl" id="lvNone"><b>Nothing live</b><br>Send a slide or start the cue list</div></div>
  <div class="ebs-row"><button class="ebs-btn f1" id="lvClear">Clear screen</button></div>
</div>
<div class="ebs-card">
  <h3>Cue list <small id="cuCount"></small></h3>
  <div class="ebs-cue" id="cuList"></div>
  <div class="ebs-row"><button class="ebs-btn f1" id="cuPrev">◀ Prev</button><button class="ebs-btn cue f1" id="cuNext" style="flex:2">Next ▶</button><button class="ebs-btn ghost" id="cuClear">Clear</button></div>
  <div class="ebs-note" id="cuMode"></div>
  <div class="ebs-row"><label class="ebs-row" style="gap:5px"><input type="checkbox" id="tmAuto"> Auto-advance every</label><input type="number" id="tmSecs" min="1" max="600" style="width:64px" aria-label="Seconds per slide"> s <label class="ebs-row" style="gap:5px"><input type="checkbox" id="tmLoop"> Loop</label></div>
  <div class="ebs-row"><span class="ebs-lab">Transition</span><select id="tmTrans" class="f1" aria-label="Transition"></select></div>
  <div class="ebs-row"><span class="ebs-lab">Speed</span><select id="tmTransMs" class="f1" aria-label="Transition speed"><option value="0">Default</option><option value="150">Very fast (150 ms)</option><option value="300">Fast (300 ms)</option><option value="500">Medium (500 ms)</option><option value="800">Slow (800 ms)</option><option value="1200">Slower (1200 ms)</option><option value="2000">Very slow (2000 ms)</option></select></div>
  <div class="ebs-note" id="tmLeft"></div>
  <button class="ebs-btn f1" id="cuPause" hidden>⏸ Pause on this slide</button>
</div>
<div class="ebs-card">
  <h3>Live</h3>
  <button class="ebs-btn live" id="snLive">▶ Send live</button>
  <div class="ebs-note">Sends the slide you are editing to the screens. Double-click a slide in the strip to send it live straight away.</div>
</div>`;
}
function applyLayout() {
    const [l, u, r] = S.prefs.layout;
    $('#ebsSlotLeft').appendChild(el.panels[l]); $('#ebsSlotUnder').appendChild(el.panels[u]); $('#ebsSlotRight').appendChild(el.panels[r]);
    fitStage();
    renderDecks(); renderCue(); refreshLive();
}
function setSlot(slotIdx, panel) { // picking a panel that is already used swaps the two (same rule as the main screen)
    const L = S.prefs.layout, from = L.indexOf(panel); if (from === slotIdx) return;
    [L[slotIdx], L[from]] = [L[from], L[slotIdx]]; savePrefs(); applyLayout();
}

// ---------- decks panel ----------
const thumbCache = new Map();
function thumbCanvas(slide, key, w) {
    const k = key + ':' + (slide.v || 0), c = thumbCache.get(key);
    if (c && c.k === k) return c.c;
    const cv = slideToCanvas(slide, w || 320); thumbCache.set(key, { k, c: cv }); return cv;
}
function paintInto(target, slide, key, w) {
    const src = thumbCanvas(slide, key, w); target.width = src.width; target.height = src.height; target.getContext('2d').drawImage(src, 0, 0);
}
let tplCache = {};
function tplDeck(id) { return tplCache[id] || (tplCache[id] = buildTemplate(id)); }
function renderDecks() {
    const grid = $('#dkGrid'); if (!grid) return;
    const q = S.q.trim().toLowerCase(); const f = S.filter;
    const textOf = (d) => d.slides.map(s => (s.objs || []).filter(o => o.t === 'text').map(o => o.txt).join(' ')).join(' ').toLowerCase();
    let html = '';
    const cards = [];
    if (f !== 'tpl') S.decks.filter(d => !d.draft).slice().sort((a, b) => b.updated - a.updated).forEach(d => { if (!q || d.name.toLowerCase().includes(q) || textOf(d).includes(q)) cards.push({ kind: 'deck', d }); });
    if (f !== 'mine') TEMPLATES.forEach(T => { const th = THEMES[T.th]; if (!q || th.name.toLowerCase().includes(q) || th.cat.toLowerCase().includes(q)) cards.push({ kind: 'tpl', T, th, open: !!(curDeck() && curDeck().draft && curDeck().tplId === T.id) }); });
    $('#ebsDeckCount').textContent = '· ' + S.decks.filter(d => !d.draft).length + ' yours';
    grid.innerHTML = cards.map((c, i) => c.kind === 'deck'
        ? `<div class="ebs-deck${c.d.id === S.deckId ? ' sel' : ''}${S.deckSel.has(c.d.id) ? ' msel' : ''}" data-i="${i}" data-k="deck" data-id="${c.d.id}" tabindex="0"><canvas></canvas>${S.deckSel.has(c.d.id) ? '<span class="ck">✓</span>' : ''}<button class="more" data-more="${c.d.id}" aria-label="Deck actions">⋯</button><div class="nm">${esc(c.d.name)} <small>· ${c.d.slides.length}</small></div></div>`
        : `<div class="ebs-deck${c.open ? ' sel' : ''}" data-i="${i}" data-k="tpl" data-id="${c.T.id}" tabindex="0"><canvas></canvas><span class="tag">Template</span><div class="nm">${esc(c.th.name)} <small>· ${c.T.slides.length}</small></div></div>`).join('') || '<div class="ebs-note">Nothing found.</div>';
    grid.querySelectorAll('.ebs-deck').forEach(node => {
        const c = cards[+node.dataset.i], cv = node.querySelector('canvas');
        if (c.kind === 'deck') paintInto(cv, c.d.slides[0], 'd' + c.d.id, 320);
        else { const d = tplDeck(c.T.id); fontsReadyThen(d.slides[0], () => paintInto(cv, d.slides[0], 't' + c.T.id, 320)); }
    });
    renderBulk();
}
function renderBulk() {
    const b = $('#dkBulk'); if (!b) return; S.deckSel.forEach(id => { if (!S.decks.find(d => d.id === id)) S.deckSel.delete(id); });
    const n = S.deckSel.size; b.hidden = !n; if (!n) return;
    b.innerHTML = `<b>${n} deck${n > 1 ? 's' : ''} selected</b><button class="ebs-btn" data-bk="export">Export</button><button class="ebs-btn" data-bk="dup">Duplicate</button><button class="ebs-btn" data-bk="del" style="color:#f87171">Delete</button><button class="ebs-btn ghost" data-bk="clear">Clear</button>`;
}
function fontsReadyThen(slide, fn) { fn(); ensureFonts(fontsFor(slide)).then(() => { thumbCache.forEach((v, k) => { if (k[0] === 't') thumbCache.delete(k); }); fn(); }); }
function dropDrafts(keepId) { S.decks = S.decks.filter(x => !x.draft || x.id === keepId); }
function openDeck(id) {
    const d = S.decks.find(x => x.id === id); if (!d) return; dropDrafts(id);
    S.deckId = id; S.idx = 0; S.sel = null; S.hi.clear(); S.undo = []; S.redo = [];
    if (!d.draft) lsSet('ebpStudioLastDeck', id); refreshAll();
}
function addDeck(d, open) { dropDrafts(null); S.decks.push(d); S.dirty.add(d.id); schedSave(); if (open !== false) openDeck(d.id); else renderDecks(); }
function useTemplate(id) { // opens a fresh copy of the template; it is only added to My decks once you change something
    const t = buildTemplate(id); if (!t) return; t.draft = true; t.tplId = id; dropDrafts(null); S.decks.push(t); openDeck(t.id);
    toast('Template opened. Edit anything: your changes are saved as your own deck and the template stays as it is.');
}
function newBlankDeck() { const d = newDeck('Untitled deck', [layoutSlide('welcome', 'title', { kicker: 'Your message', title: 'Click to edit', sub: 'Double-click any text to change it' })]); d.theme = 'welcome'; addDeck(d); }
async function deleteDeck(id) {
    const d = S.decks.find(x => x.id === id); if (!d || !confirm('Delete "' + d.name + '"? This cannot be undone.')) return;
    S.decks = S.decks.filter(x => x.id !== id); S.cue = S.cue.filter(c => c.d !== id); saveCue(); await removeDeckStored(id);
    if (S.deckId === id) { S.deckId = S.decks.length ? S.decks[0].id : null; S.idx = 0; S.sel = null; if (!S.deckId) newBlankDeck(); }
    refreshAll();
}
function showMenu(anchor, items) {
    const m = $('#ebsMenu'), r = anchor.getBoundingClientRect(), rr = el.root.getBoundingClientRect();
    m.innerHTML = items.map((it, i) => `<button data-i="${i}" class="${it.dan ? 'dan' : ''}">${esc(it.t)}</button>`).join('');
    m.style.left = Math.min(rr.width - 190, Math.max(4, r.left - rr.left)) + 'px'; m.style.top = Math.min(rr.height - 200, r.bottom - rr.top + 4) + 'px';
    m.classList.add('show'); m._items = items;
}
function hideMenu() { const m = $('#ebsMenu'); if (m) m.classList.remove('show'); }
function deckMenu(btn, id) {
    const d = S.decks.find(x => x.id === id); if (!d) return;
    showMenu(btn, [
        { t: 'Rename', f: () => { const n = prompt('Deck name', d.name); if (n && n.trim()) { d.name = n.trim().slice(0, 80); S.dirty.add(d.id); schedSave(); refreshAll(); } } },
        { t: 'Duplicate', f: () => { const c = cloneDeck(d, d.name + ' copy'); addDeck(c); } },
        { t: 'Export to a file', f: () => exportDeck(d) },
        { t: 'Delete', dan: true, f: () => deleteDeck(id) }
    ]);
}

// ---------- editing helpers ----------
function mutate(fn, noSnap) { const s = curSlide(); if (!s) return; if (!noSnap) snap(); fn(s); touch(s); drawStage(); drawSel(); renderRow2(); refreshThumb(S.idx); const lp = $('#popLayers'); if (lp && lp.classList.contains('show')) renderPopLayers(); }
function addObj(o, select) { mutate(s => { s.objs.push(o); }); if (select !== false) { setSel([o.id]); drawSel(); renderRow2(); } }
function textColorForBg(s) { const bg = s.bg || {}, m = /^#([0-9a-f]{6})$/i.exec(bg.c1 || ''); if (!m || bg.kind === 'image') return '#ffffff'; const n = parseInt(m[1], 16), l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); return l > 160 ? '#111827' : '#ffffff'; }
function addText() { const s = curSlide(); if (!s) return; addObj(TXT(560, 440, 800, 200, 'New text', { size: 80, bold: true, color: textColorForBg(s), fit: true })); }
function addShape(k, st) { const s = curSlide(); if (!s) return; const line = k === 'line'; st = st || {}; const sw = st.sw || 8;
    addObj(SHP(k, line ? 460 : 760, line ? 520 : 390, line ? 1000 : 400, line ? Math.max(sw, st.arrow ? 40 : sw) : (k === 'cross' ? 520 : 300), { fill: line ? '' : '#38bdf8', stroke: line ? '#ffffff' : '', sw: line ? sw : 0, dash: st.dash || 'solid', arrow: st.arrow || 'none' })); }
function addEmoji(ch) { addObj(EMO(ch, 800, 340, 320, { shadow: true })); }
async function addImageFile(file) {
    if (!file || !/^image\//.test(file.type)) { toast('Please choose a picture file.', true); return; }
    try {
        const r = await fileToImageId(file, 1920); const k = Math.min(1, 1100 / r.w, 700 / r.h);
        const w = Math.round(r.w * k), h = Math.round(r.h * k);
        addObj({ id: uid('o'), t: 'image', src: r.id, x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h, rot: 0, op: 1, fit: 'contain', rad: 0, shadow: false });
    } catch (e) { toast(e.message || 'Could not add that picture.', true); }
}
async function setBgImage(file) {
    if (!file) return; try { const r = await fileToImageId(file, 1920); mutate(s => { s.bg = { kind: 'image', img: r.id, c1: (s.bg && s.bg.c1) || '#0f172a', dim: (s.bg && s.bg.dim) || 0.25 }; }); renderPopBg(); } catch (e) { toast(e.message, true); }
}
function delObj() { const l = selObjs(); if (!l.length) return; const ids = new Set(l.map(o => o.id)); mutate(s => { s.objs = s.objs.filter(x => !ids.has(x.id)); }); setSel([]); drawSel(); renderRow2(); }
function dupObj() { const l = selObjs(); if (!l.length) return; const gm = {}, ids = []; mutate(s => { l.forEach(o => { const c2 = clone(o); c2.id = uid('o'); c2.x += 40; c2.y += 40; if (c2.g) { gm[c2.g] = gm[c2.g] || uid('g'); c2.g = gm[c2.g]; } s.objs.push(c2); ids.push(c2.id); }); }); setSel(ids); drawSel(); renderRow2(); }
function reorder(how) { // front / back go all the way; up / down move one step
    const ids = new Set(selObjs().map(o => o.id)); if (!ids.size) return;
    mutate(s => {
        const objs = s.objs;
        if (how === 'front' || how === 'back') { const a = objs.filter(o => ids.has(o.id)), b = objs.filter(o => !ids.has(o.id)); s.objs = how === 'front' ? b.concat(a) : a.concat(b); }
        else if (how === 'up') { for (let i = objs.length - 2; i >= 0; i--) if (ids.has(objs[i].id) && !ids.has(objs[i + 1].id)) { const t = objs[i]; objs[i] = objs[i + 1]; objs[i + 1] = t; } }
        else { for (let i = 1; i < objs.length; i++) if (ids.has(objs[i].id) && !ids.has(objs[i - 1].id)) { const t = objs[i]; objs[i] = objs[i - 1]; objs[i - 1] = t; } }
    });
    toast(how === 'front' ? 'Brought to front.' : how === 'back' ? 'Sent to back.' : how === 'up' ? 'Moved forward one layer.' : 'Moved back one layer.');
}
function groupSel() { const l = selObjs(); if (l.length < 2) { toast('Select two or more items first: drag a box around them, or Shift+click.', true); return; } const g = uid('g'); mutate(() => { l.forEach(o => { o.g = g; }); }); toast('Grouped. They now move and resize together.'); }
function ungroupSel() { const l = selObjs().filter(o => o.g); if (!l.length) { toast('Nothing is grouped here.', true); return; } mutate(() => { l.forEach(o => { delete o.g; }); }); toast('Ungrouped.'); }
function alignSel(how) { const l = selObjs(); if (l.length < 2) return; const bb = selBBox(l); mutate(() => { l.forEach(o => { if (how === 'l') o.x = bb.x; if (how === 'c') o.x = Math.round(bb.x + bb.w / 2 - o.w / 2); if (how === 'r') o.x = bb.x + bb.w - o.w; if (how === 't') o.y = bb.y; if (how === 'm') o.y = Math.round(bb.y + bb.h / 2 - o.h / 2); if (how === 'b') o.y = bb.y + bb.h - o.h; }); }); }
function copySel() { const l = selObjs(); if (!l.length) return null; S.clip = clone(l); S.pasteN = 0; return S.clip; }
function pasteObjs(arr) {
    const s = curSlide(); if (!s || !arr || !arr.length) return; S.pasteN++; const gm = {}, ids = [], off = 30 * S.pasteN;
    mutate(sl => { arr.forEach(o => { const c2 = clone(o); c2.id = uid('o'); c2.x += off; c2.y += off; if (c2.g) { gm[c2.g] = gm[c2.g] || uid('g'); c2.g = gm[c2.g]; } sl.objs.push(c2); ids.push(c2.id); }); });
    setSel(ids); drawSel(); renderRow2();
}
function textTweak(fn) { const l = selObjs().filter(o => o.t === 'text'); if (!l.length) return false; mutate(() => { l.forEach(fn); }); return true; }
function addSlide(layout) {
    const d = curDeck(); if (!d) return; snap();
    const th = d.theme && THEMES[d.theme] ? d.theme : 'welcome';
    const demo = { title: { kicker: 'Kicker', title: 'Slide title', sub: 'Subtitle' }, points: { title: 'Main points', items: ['First point', 'Second point', 'Third point'] }, scripture: { verse: 'Type or insert a verse here.', ref: 'Book 1:1' }, lyrics: { text: 'Lyric line one\nLyric line two' }, announce: { title: 'Announcements', items: [{ e: '📅', h: 'Heading', t: 'Details here' }, { e: '🙏', h: 'Heading', t: 'Details here' }] }, closing: { title: 'Thank you', sub: 'God bless you', e: '✨' }, section: { num: '01', title: 'Section' } };
    const s = layout === 'blank' ? newSlide(bgOf(THEMES[th]), []) : layoutSlide(th, layout, demo[layout]);
    d.slides.splice(S.idx + 1, 0, s); S.idx++; S.sel = null; touch(s); refreshAll();
}

// ---------- stage drawing and selection ----------
let editing = null; // { id, node }
function drawStage() {
    const s = curSlide(); if (!el.canvas) return;
    const ctx = el.canvas.getContext('2d');
    if (!s) { ctx.clearRect(0, 0, el.canvas.width, el.canvas.height); return; }
    renderSlide(ctx, s, el.canvas.width, editing ? editing.id : null);
}
function drawSel() {
    if (!el.ov) return;
    el.ov.querySelectorAll('.ebs-sel,.ebs-safe,.ebs-selx').forEach(n => n.remove());
    if (S.prefs.safe) { const sf = document.createElement('div'); sf.className = 'ebs-safe'; el.ov.appendChild(sf); }
    const list = selObjs(); if (!list.length) return;
    const k = stageScale(), H8 = [['nw', 0, 0, 'nwse-resize'], ['n', 50, 0, 'ns-resize'], ['ne', 100, 0, 'nesw-resize'], ['e', 100, 50, 'ew-resize'], ['se', 100, 100, 'nwse-resize'], ['s', 50, 100, 'ns-resize'], ['sw', 0, 100, 'nesw-resize'], ['w', 0, 50, 'ew-resize']];
    const b = document.createElement('div'); b.className = 'ebs-sel';
    if (list.length > 1) {
        list.forEach(o => { const m = document.createElement('div'); m.className = 'ebs-selx'; m.style.cssText = `left:${o.x * k}px;top:${o.y * k}px;width:${o.w * k}px;height:${o.h * k}px;transform:rotate(${o.rot || 0}deg)`; el.ov.appendChild(m); });
        const bb = selBBox(list); b.style.cssText = `left:${bb.x * k}px;top:${bb.y * k}px;width:${bb.w * k}px;height:${bb.h * k}px`;
        b.innerHTML = H8.map(h => `<i data-h="${h[0]}" style="left:${h[1]}%;top:${h[2]}%;cursor:${h[3]}"></i>`).join('');
    } else {
        const o = list[0]; b.style.cssText = `left:${o.x * k}px;top:${o.y * k}px;width:${o.w * k}px;height:${o.h * k}px;transform:rotate(${o.rot || 0}deg);transform-origin:50% 50%`;
        b.innerHTML = '<div class="stem"></div><i data-h="rot" style="left:50%;top:-26px"></i>' + H8.map(h => `<i data-h="${h[0]}" style="left:${h[1]}%;top:${h[2]}%;cursor:${h[3]}"></i>`).join('');
    }
    el.ov.appendChild(b);
}
function showGuides(o) {   // green guides: thin = where the centre is, solid + glow = the object is on it; dashed box follows what you move
    el.ov.querySelectorAll('.ebs-guide,.ebs-gbox,.ebs-glab').forEach(n => n.remove()); if (!o) return; const k = stageScale();
    (o.x || []).forEach(g => { const d = document.createElement('div'); d.className = 'ebs-guide' + (g.hit ? ' hit' : ''); d.style.cssText = `left:${g.v * k}px;top:0;width:1px;height:100%`; el.ov.appendChild(d); });
    (o.y || []).forEach(g => { const d = document.createElement('div'); d.className = 'ebs-guide' + (g.hit ? ' hit' : ''); d.style.cssText = `top:${g.v * k}px;left:0;height:1px;width:100%`; el.ov.appendChild(d); });
    if (o.box) { const d = document.createElement('div'); d.className = 'ebs-gbox' + (o.box.hit ? ' hit' : ''); d.style.cssText = `left:${(o.box.x * k) - 3}px;top:${(o.box.y * k) - 3}px;width:${o.box.w * k + 6}px;height:${o.box.h * k + 6}px`; el.ov.appendChild(d); }
    if (o.label) { const d = document.createElement('div'); d.className = 'ebs-glab' + (o.label.hit ? ' hit' : ''); d.textContent = o.label.t; d.style.cssText = `left:${o.label.x * k}px;top:${Math.max(18, o.label.y * k - 12)}px`; el.ov.appendChild(d); }
}
function evPt(e) { const r = el.stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
let drag = null;
function bindStage() {
    const ov = el.ov;
    ov.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (editing) { if (editing.node.contains(e.target)) return; finishEdit(); }
        const s = curSlide(); if (!s) return; el.root.focus({ preventScroll: true });
        const p = evPt(e), h = e.target && e.target.dataset && e.target.dataset.h, list = selObjs();
        if (h && list.length) {
            snap(); ov.setPointerCapture(e.pointerId);
            if (list.length > 1) drag = { mode: 'msize', h, start: p, bb: selBBox(list), orig: list.map(o => ({ o, x: o.x, y: o.y, w: o.w, h: o.h, size: o.size })) };
            else { const o = list[0]; drag = { mode: h === 'rot' ? 'rot' : 'size', h, o, start: p, orig: { x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0 } }; }
            e.preventDefault(); return;
        }
        const hit = hitTest(s, p.x, p.y);
        if (hit) {
            const group = hit.g ? s.objs.filter(x => x.g === hit.g && !x.locked && !x.hidden).map(x => x.id) : [hit.id];
            if (e.shiftKey || e.ctrlKey || e.metaKey) { ov.setPointerCapture(e.pointerId); drag = { mode: 'marq', start: p, base: list.map(o => o.id), node: null, moved: false, toggle: group }; e.preventDefault(); return; } // click toggles the item; drag draws a selection box even over big shapes
            if (!list.some(o => o.id === hit.id)) setSel(group);
            renderRow2(); drawSel(); snap(); ov.setPointerCapture(e.pointerId);
            const mv = selObjs(); drag = { mode: 'move', list: mv, start: p, bb: selBBox(mv), orig: mv.map(o => ({ o, x: o.x, y: o.y })), moved: false }; e.preventDefault();
        } else {
            if (!e.shiftKey) setSel([]); drawSel(); renderRow2(); ov.setPointerCapture(e.pointerId);
            drag = { mode: 'marq', start: p, base: selObjs().map(o => o.id), node: null, moved: false }; e.preventDefault();
        }
    });
    ov.addEventListener('pointermove', (e) => {
        if (!drag) return; const p = evPt(e), dx = p.x - drag.start.x, dy = p.y - drag.start.y;
        if (drag.mode === 'move') {
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return; drag.moved = true;
            let mx = dx, my = dy; const bb = drag.bb, k = stageScale(), thr = Math.max(3, 9 / k), on = S.prefs.snap && !e.altKey;
            let hitX = [], hitY = [];
            if (on) {
                const moving = new Set(drag.orig.map(r => r.o.id)), s = curSlide();
                const tx = [W / 2], ty = [H / 2];   // the centre lines always; the slide edges and (if shown) the safe margin; other objects' edges and centres
                tx.push(0, W); ty.push(0, H);
                if (S.prefs.safe) { tx.push(W * 0.05, W * 0.95); ty.push(H * 0.05, H * 0.95); }
                s.objs.forEach(o => { if (moving.has(o.id) || o.hidden) return; tx.push(o.x, o.x + o.w / 2, o.x + o.w); ty.push(o.y, o.y + o.h / 2, o.y + o.h); });
                const best = (cur, targets) => { let bd = thr + 1, bv = null; targets.forEach(t => cur.forEach(c => { const d = t - c; if (Math.abs(d) < Math.abs(bd) && Math.abs(d) <= thr) { bd = d; bv = t; } })); return bv == null ? null : bd; };
                const cxs = [bb.x + dx, bb.x + bb.w / 2 + dx, bb.x + bb.w + dx], cys = [bb.y + dy, bb.y + bb.h / 2 + dy, bb.y + bb.h + dy];
                const ax = best(cxs, tx), ay = best(cys, ty); if (ax != null) mx += ax; if (ay != null) my += ay;
                const fxs = [bb.x + mx, bb.x + bb.w / 2 + mx, bb.x + bb.w + mx], fys = [bb.y + my, bb.y + bb.h / 2 + my, bb.y + bb.h + my];
                tx.forEach(t => { if (fxs.some(c => Math.abs(c - t) < 1.5) && !hitX.includes(t)) hitX.push(t); }); ty.forEach(t => { if (fys.some(c => Math.abs(c - t) < 1.5) && !hitY.includes(t)) hitY.push(t); });
            }
            drag.orig.forEach(r => { r.o.x = Math.round(r.x + mx); r.o.y = Math.round(r.y + my); });
            const cxHit = Math.abs(bb.x + bb.w / 2 + mx - W / 2) < 1.5, cyHit = Math.abs(bb.y + bb.h / 2 + my - H / 2) < 1.5;
            showGuides({ x: [{ v: W / 2, hit: cxHit }].concat(hitX.filter(v => v !== W / 2).map(v => ({ v, hit: true }))), y: [{ v: H / 2, hit: cyHit }].concat(hitY.filter(v => v !== H / 2).map(v => ({ v, hit: true }))), box: { x: bb.x + mx, y: bb.y + my, w: bb.w, h: bb.h, hit: cxHit || cyHit || hitX.length > 0 || hitY.length > 0 } });
        } else if (drag.mode === 'rot') {
            const o = drag.o, cx = drag.orig.x + drag.orig.w / 2, cy = drag.orig.y + drag.orig.h / 2;
            let a = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90; if (e.shiftKey || Math.abs(((a % 90) + 90) % 90) < 4 || Math.abs(((a % 90) + 90) % 90 - 90) < 4) a = Math.round(a / 15) * 15; o.rot = Math.round(((a % 360) + 360) % 360); showGuides({ label: { t: o.rot + '°', x: o.x + o.w / 2, y: o.y - 8, hit: o.rot % 15 === 0 } });
        } else if (drag.mode === 'msize') {
            const hh = drag.h, bb = drag.bb; let nx = bb.x, ny = bb.y, nw = bb.w, nh = bb.h;
            if (hh.includes('e')) nw = Math.max(40, bb.w + dx); if (hh.includes('s')) nh = Math.max(40, bb.h + dy);
            if (hh.includes('w')) nw = Math.max(40, bb.w - dx); if (hh.includes('n')) nh = Math.max(40, bb.h - dy);
            if (hh.length === 2) { const kk = Math.max(nw / bb.w, nh / bb.h); nw = bb.w * kk; nh = bb.h * kk; }
            if (hh.includes('w')) nx = bb.x + bb.w - nw; if (hh.includes('n')) ny = bb.y + bb.h - nh;
            const sx = nw / bb.w, sy = nh / bb.h;
            drag.orig.forEach(r => { const o = r.o; o.x = Math.round(nx + (r.x - bb.x) * sx); o.y = Math.round(ny + (r.y - bb.y) * sy); o.w = Math.max(8, Math.round(r.w * sx)); o.h = Math.max(o.k === 'line' ? 2 : 8, Math.round(r.h * sy)); if (o.t === 'text' && r.size) o.size = clamp(Math.round(r.size * Math.sqrt(sx * sy)), 10, 600); });
        } else if (drag.mode === 'marq') {
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return; drag.moved = true;
            if (!drag.node) { drag.node = document.createElement('div'); drag.node.className = 'ebs-marq'; ov.appendChild(drag.node); }
            const k = stageScale(), x1 = Math.min(p.x, drag.start.x), y1 = Math.min(p.y, drag.start.y), x2 = Math.max(p.x, drag.start.x), y2 = Math.max(p.y, drag.start.y);
            drag.node.style.cssText = `left:${x1 * k}px;top:${y1 * k}px;width:${(x2 - x1) * k}px;height:${(y2 - y1) * k}px`;
            const s = curSlide(), hit = s.objs.filter(o => { if (o.hidden || o.locked) return false; const inside = o.x >= x1 && o.y >= y1 && o.x + o.w <= x2 && o.y + o.h <= y2; if (inside) return true; const big = o.w * o.h > W * H * 0.5; return !big && o.x < x2 && o.x + o.w > x1 && o.y < y2 && o.y + o.h > y1; }).map(o => o.id);
            const ids = new Set(drag.base); hit.forEach(id => { ids.add(id); const o = s.objs.find(x => x.id === id); if (o && o.g) s.objs.forEach(z => { if (z.g === o.g) ids.add(z.id); }); });
            setSel(Array.from(ids)); drawSel(); return;
        } else {
            const o = drag.o, r = drag.orig.rot * Math.PI / 180, cos = Math.cos(-r), sin = Math.sin(-r);
            const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos, hh = drag.h;
            const sx = hh.includes('e') ? 1 : (hh.includes('w') ? -1 : 0), sy = hh.includes('s') ? 1 : (hh.includes('n') ? -1 : 0);
            let dw = sx * lx, dh = sy * ly;
            const keep = (sx && sy) && (e.shiftKey || o.t === 'image' || o.t === 'emoji');
            if (keep) { const ratio = drag.orig.w / drag.orig.h; if (Math.abs(dw) / ratio > Math.abs(dh)) dh = dw / ratio; else dw = dh * ratio; }
            let nw = Math.max(24, drag.orig.w + dw), nh = Math.max(o.k === 'line' ? 4 : 24, drag.orig.h + dh); dw = nw - drag.orig.w; dh = nh - drag.orig.h;
            const shx = sx * dw / 2, shy = sy * dh / 2, rr = drag.orig.rot * Math.PI / 180;
            const ccx = drag.orig.x + drag.orig.w / 2 + shx * Math.cos(rr) - shy * Math.sin(rr), ccy = drag.orig.y + drag.orig.h / 2 + shx * Math.sin(rr) + shy * Math.cos(rr);
            o.w = Math.round(nw); o.h = Math.round(nh); o.x = Math.round(ccx - nw / 2); o.y = Math.round(ccy - nh / 2);
        }
        drawStage(); drawSel();
    });
    const end = () => {
        if (!drag) return; const was = drag; drag = null; setTimeout(() => showGuides(), 300);
        if (was.mode === 'marq') { if (was.node) was.node.remove(); if (!was.moved && was.toggle) { const cur = new Set(was.base), allIn = was.toggle.every(id => cur.has(id)); was.toggle.forEach(id => { if (allIn) cur.delete(id); else cur.add(id); }); setSel(Array.from(cur)); } renderRow2(); drawSel(); return; }
        if (was.mode !== 'move' || was.moved) { touch(curSlide()); refreshThumb(S.idx); renderRow2(); } else { S.undo.pop(); updUndo(); }
    };
    ov.addEventListener('pointerup', end); ov.addEventListener('pointercancel', end);
    ov.addEventListener('dblclick', (e) => { const s = curSlide(); if (!s) return; const p = evPt(e), hit = hitTest(s, p.x, p.y); if (hit && hit.t === 'text') { setSel([hit.id]); drawSel(); renderRow2(); startEdit(hit); } });
}
function startEdit(o) {
    finishEdit(); snap(); const k = stageScale(), cv = el.canvas.getContext('2d'), L = textLayout(cv, o);
    const n = document.createElement('div'); n.className = 'ebs-edit'; n.contentEditable = 'true'; n.spellcheck = false; n.setAttribute('aria-label', 'Edit text');
    n.style.cssText = `left:${o.x * k}px;top:${o.y * k}px;width:${o.w * k}px;height:${o.h * k}px;transform:rotate(${o.rot || 0}deg);padding:${L.pad * k}px;font:${o.italic ? 'italic ' : ''}${o.bold ? '700' : '400'} ${L.size * k}px/${o.lh || 1.2} ${FONT_STACK[o.font] || FONT_STACK.Montserrat};color:${o.color};text-align:${o.al || 'center'};justify-content:${o.va === 'top' ? 'flex-start' : (o.va === 'bottom' ? 'flex-end' : 'center')};opacity:${o.op == null ? 1 : o.op};text-transform:${o.caps ? 'uppercase' : 'none'}`;
    n.textContent = o.txt || '';
    n.addEventListener('input', () => { o.txt = n.innerText.replace(/\n$/, ''); drawStage(); });
    n.addEventListener('paste', (e) => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
    n.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); finishEdit(); return; } if ((e.ctrlKey || e.metaKey) && !e.altKey) { const k2 = e.key.toLowerCase(); if (k2 === 'b') { e.preventDefault(); o.bold = !o.bold; n.style.fontWeight = o.bold ? '700' : '400'; drawStage(); } else if (k2 === 'i') { e.preventDefault(); o.italic = !o.italic; n.style.fontStyle = o.italic ? 'italic' : 'normal'; drawStage(); } else if (k2 === 's') { e.preventDefault(); flush(); } } });
    n.addEventListener('blur', () => { setTimeout(() => { if (editing && editing.node === n) finishEdit(); }, 0); });
    el.ov.appendChild(n); editing = { id: o.id, node: n }; drawStage(); n.focus();
    const rg = document.createRange(); rg.selectNodeContents(n); const sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(rg);
}
function finishEdit() {
    if (!editing) return; const { node, id } = editing; editing = null;
    const o = (curSlide() ? curSlide().objs : []).find(x => x.id === id); if (o) o.txt = node.innerText.replace(/\n$/, '');
    node.remove(); touch(curSlide()); drawStage(); drawSel(); refreshThumb(S.idx); renderRow2();
}

// ---------- toolbar row 2 (changes with what is selected) ----------
function colorBtn(id, val, label) { return `<label class="ebs-row" style="gap:4px"><span class="ebs-lab">${label}</span><input type="color" id="${id}" value="${/^#[0-9a-f]{6}$/i.test(val) ? val : '#ffffff'}"></label>`; }
function renderRow2() {
    const r = $('#ebsRow2'); if (!r) return; const o = curObj(), s = curSlide();
    if (!s) { r.innerHTML = ''; return; }
    const many = selObjs();
    if (many.length > 1) {
        const anyG = many.some(x => x.g);
        r.innerHTML = `<span class="ebs-lab">${many.length} items</span><button class="ebs-btn pri" id="mGroup">Group</button><button class="ebs-btn" id="mUngroup"${anyG ? '' : ' disabled'}>Ungroup</button><span class="ebs-sep"></span><span class="ebs-lab">Align</span>${[['l', '⇤', 'Left'], ['c', '↔', 'Centre'], ['r', '⇥', 'Right'], ['t', '⤒', 'Top'], ['m', '↕', 'Middle'], ['b', '⤓', 'Bottom']].map(a2 => `<button class="ebs-btn" data-al2="${a2[0]}" title="Align ${a2[2]}">${a2[1]}</button>`).join('')}<span class="ebs-sep"></span><label class="ebs-row" style="gap:4px">Opacity <input type="range" id="mOp" min="0.05" max="1" step="0.05" value="${many[0].op == null ? 1 : many[0].op}"></label><button class="ebs-btn" id="obBack" title="Send to the very back">⤓ Back</button><button class="ebs-btn" id="obFront" title="Bring to the very front">⤒ Front</button><button class="ebs-btn" id="obLayers" data-pop="popLayers">Layers ▾</button><button class="ebs-btn" id="obDup">Duplicate</button><button class="ebs-btn" id="obDel" style="color:#f87171">Delete</button>`;
        $('#mGroup').onclick = groupSel; $('#mUngroup').onclick = ungroupSel; r.querySelectorAll('[data-al2]').forEach(b2 => b2.onclick = () => alignSel(b2.dataset.al2));
        let sn = false; $('#mOp').oninput = (e) => { if (!sn) { snap(); sn = true; } mutate(() => { many.forEach(x => { x.op = parseFloat(e.target.value); }); }, true); };
        $('#obBack').onclick = () => reorder('back'); $('#obFront').onclick = () => reorder('front'); $('#obDup').onclick = dupObj; $('#obDel').onclick = delObj;
        $('#obLayers').onclick = (e) => { e.stopPropagation(); showPop('popLayers', e.currentTarget); };
        return;
    }
    if (!o) {
        r.innerHTML = `<span class="ebs-note">Click an item on the slide to edit it. Drag a box around several items to select them (hold Shift to draw the box over big shapes). Double-click text to type. Hold Ctrl and click slides below to select several, then press Delete to remove them.</span>`;
        return;
    }
    let h = '';
    if (o.t === 'text') {
        h += `<span class="ebs-lab">Text</span><select id="fnFont" aria-label="Font" style="width:140px">${Object.keys(FONT_STACK).map(f => `<option${o.font === f ? ' selected' : ''}>${f}</option>`).join('')}</select>
<input type="number" id="fnSize" min="10" max="600" value="${Math.round(o.size)}" style="width:64px" aria-label="Size">
<button class="ebs-btn${o.bold ? ' on' : ''}" id="fnB" style="font-weight:800">B</button><button class="ebs-btn${o.italic ? ' on' : ''}" id="fnI" style="font-style:italic">I</button><button class="ebs-btn${o.caps ? ' on' : ''}" id="fnCaps">AA</button>
<button class="ebs-btn${o.al === 'left' ? ' on' : ''}" data-al="left" title="Left">⇤</button><button class="ebs-btn${(o.al || 'center') === 'center' ? ' on' : ''}" data-al="center" title="Centre">↔</button><button class="ebs-btn${o.al === 'right' ? ' on' : ''}" data-al="right" title="Right">⇥</button>
<button class="ebs-btn${o.va === 'top' ? ' on' : ''}" data-va="top" title="Top">⤒</button><button class="ebs-btn${(o.va || 'middle') === 'middle' ? ' on' : ''}" data-va="middle" title="Middle">↕</button><button class="ebs-btn${o.va === 'bottom' ? ' on' : ''}" data-va="bottom" title="Bottom">⤓</button>
${colorBtn('fnColor', o.color, 'Colour')}<label class="ebs-row" style="gap:4px"><input type="checkbox" id="fnShadow"${o.shadow ? ' checked' : ''}> Shadow</label><label class="ebs-row" style="gap:4px"><input type="checkbox" id="fnFit"${o.fit ? ' checked' : ''}> Shrink to fit</label>
<label class="ebs-row" style="gap:4px">Spacing <input type="range" id="fnLh" min="0.9" max="2" step="0.05" value="${o.lh || 1.2}"></label>`;
    } else if (o.t === 'shape') {
        h += `<span class="ebs-lab">Shape</span>${o.k !== 'line' ? colorBtn('shFill', o.fill || '#38bdf8', 'Fill') + `<label class="ebs-row" style="gap:4px"><input type="checkbox" id="shGrad"${o.fill2 ? ' checked' : ''}> Gradient</label>` + (o.fill2 ? colorBtn('shFill2', o.fill2, 'To') : '') + `<label class="ebs-row" style="gap:4px"><input type="checkbox" id="shNone"${!o.fill ? ' checked' : ''}> No fill</label>` : ''}${colorBtn('shStroke', o.stroke || '#ffffff', o.k === 'line' ? 'Colour' : 'Outline')}<label class="ebs-row" style="gap:4px">Width <input type="number" id="shSw" min="0" max="80" value="${o.sw || 0}" style="width:58px"></label><label class="ebs-row" style="gap:4px">Style <select id="shDash"><option value="solid"${!o.dash || o.dash === 'solid' ? ' selected' : ''}>Solid</option><option value="dash"${o.dash === 'dash' ? ' selected' : ''}>Dashed</option><option value="dot"${o.dash === 'dot' ? ' selected' : ''}>Dotted</option><option value="dashdot"${o.dash === 'dashdot' ? ' selected' : ''}>Dash-dot</option></select></label>${o.k === 'line' ? `<label class="ebs-row" style="gap:4px">Ends <select id="shArrow"><option value="none"${!o.arrow || o.arrow === 'none' ? ' selected' : ''}>Plain</option><option value="end"${o.arrow === 'end' ? ' selected' : ''}>Arrow</option><option value="both"${o.arrow === 'both' ? ' selected' : ''}>Arrows both ends</option></select></label>` : ''}<label class="ebs-row" style="gap:4px"><input type="checkbox" id="fnShadow"${o.shadow ? ' checked' : ''}> Shadow</label>`;
    } else if (o.t === 'emoji') {
        h += `<span class="ebs-lab">Emoji</span><label class="ebs-row" style="gap:4px"><input type="checkbox" id="fnShadow"${o.shadow ? ' checked' : ''}> Shadow</label><span class="ebs-note">Drag the corners to make it bigger.</span>`;
    } else if (o.t === 'image') {
        h += `<span class="ebs-lab">Picture</span><label class="ebs-row" style="gap:4px">Fit <select id="imFit"><option value="contain"${o.fit !== 'cover' ? ' selected' : ''}>Show all</option><option value="cover"${o.fit === 'cover' ? ' selected' : ''}>Fill box</option></select></label><label class="ebs-row" style="gap:4px"><input type="checkbox" id="imRad"${o.rad ? ' checked' : ''}> Rounded</label><label class="ebs-row" style="gap:4px"><input type="checkbox" id="fnShadow"${o.shadow ? ' checked' : ''}> Shadow</label>`;
    }
    h += `<span class="ebs-sep"></span><label class="ebs-row" style="gap:4px">Opacity <input type="range" id="obOp" min="0.05" max="1" step="0.05" value="${o.op == null ? 1 : o.op}"></label><button class="ebs-btn" id="obBack" title="Send to the very back">⤓ Back</button><button class="ebs-btn" id="obFront" title="Bring to the very front">⤒ Front</button><button class="ebs-btn" id="obLayers" title="See all items on this slide and reorder them">Layers ▾</button>${o.g ? '<button class="ebs-btn" id="obUngroup">Ungroup</button>' : ''}<button class="ebs-btn" id="obDup">Duplicate</button><button class="ebs-btn" id="obDel" style="color:#f87171">Delete</button>`;
    r.innerHTML = h;
    const on = (id, ev, fn) => { const n = $('#' + id); if (n) n.addEventListener(ev, fn); };
    const set = (k, v, nosnap) => mutate(() => { o[k] = v; }, nosnap);
    let gestureSnapped = false; const gs = () => { if (!gestureSnapped) { snap(); gestureSnapped = true; } };
    on('fnFont', 'change', (e) => set('font', e.target.value)); on('fnSize', 'change', (e) => set('size', clamp(parseInt(e.target.value, 10) || 60, 10, 600)));
    on('fnB', 'click', () => { set('bold', !o.bold); }); on('fnI', 'click', () => set('italic', !o.italic)); on('fnCaps', 'click', () => set('caps', !o.caps));
    r.querySelectorAll('[data-al]').forEach(b => b.addEventListener('click', () => set('al', b.dataset.al))); r.querySelectorAll('[data-va]').forEach(b => b.addEventListener('click', () => set('va', b.dataset.va)));
    on('fnColor', 'input', (e) => { gs(); mutate(() => { o.color = e.target.value; }, true); });
    on('fnShadow', 'change', (e) => set('shadow', e.target.checked)); on('fnFit', 'change', (e) => set('fit', e.target.checked));
    on('fnLh', 'input', (e) => { gs(); mutate(() => { o.lh = parseFloat(e.target.value); }, true); });
    on('shFill', 'input', (e) => { gs(); mutate(() => { o.fill = e.target.value; }, true); }); on('shFill2', 'input', (e) => { gs(); mutate(() => { o.fill2 = e.target.value; }, true); });
    on('shGrad', 'change', (e) => { snap(); mutate(() => { o.fill2 = e.target.checked ? (o.fill2 || '#0f172a') : ''; }, true); });
    on('shNone', 'change', (e) => { snap(); mutate(() => { o.fill = e.target.checked ? '' : '#38bdf8'; if (e.target.checked) o.fill2 = ''; }, true); });
    on('shStroke', 'input', (e) => { gs(); mutate(() => { o.stroke = e.target.value; if (!o.sw) o.sw = 8; }, true); }); on('shSw', 'change', (e) => set('sw', clamp(parseInt(e.target.value, 10) || 0, 0, 80)));
    on('shDash', 'change', (e) => set('dash', e.target.value)); on('shArrow', 'change', (e) => set('arrow', e.target.value));
    on('imFit', 'change', (e) => set('fit', e.target.value)); on('imRad', 'change', (e) => set('rad', e.target.checked ? 1 : 0));
    on('obOp', 'input', (e) => { gs(); mutate(() => { o.op = parseFloat(e.target.value); }, true); });
    on('obBack', 'click', () => reorder('back')); on('obFront', 'click', () => reorder('front')); on('obUngroup', 'click', ungroupSel); on('obLayers', 'click', (e) => { e.stopPropagation(); showPop('popLayers', e.currentTarget); }); on('obDup', 'click', dupObj); on('obDel', 'click', delObj);
}

// ---------- popovers ----------
function showPop(id, anchor) {
    const wasOpen = $('#' + id).classList.contains('show'); hidePops(); hideMenu(); if (wasOpen) return;
    const p = $('#' + id); const tb = $('#ebsToolbar').getBoundingClientRect(), a = anchor.getBoundingClientRect();
    p.style.left = Math.max(4, Math.min(tb.width - 340, a.left - tb.left)) + 'px'; p.style.right = 'auto'; p.style.top = (a.bottom - tb.top + 6) + 'px';
    if (id === 'popLayers') renderPopLayers(); if (id === 'popLines') renderPopLines(); if (id === 'popShapes') renderPopShapes(); if (id === 'popEmoji') renderPopEmoji(); if (id === 'popBg') renderPopBg(); if (id === 'popLayouts') renderPopLayouts();
    p.classList.add('show');
}
function hidePops() { document.querySelectorAll('.ebs-pop.show').forEach(p => p.classList.remove('show')); }
function renderPopShapes() { const p = $('#popShapes'); p.innerHTML = '<div class="ebs-lab">Shapes</div><div class="ebs-pgrid">' + SHAPES.map(s => `<button data-shape="${s[0]}" title="${s[1]}" aria-label="${s[1]}">${shapeSvg(s[0])}</button>`).join('') + '</div>'; p.querySelectorAll('[data-shape]').forEach(b => b.onclick = () => { addShape(b.dataset.shape); hidePops(); }); }
function layerLabel(o) { if (o.t === 'text') return (o.txt || 'Text').replace(/\s+/g, ' ').slice(0, 26) || 'Text'; if (o.t === 'emoji') return 'Emoji ' + (o.ch || ''); if (o.t === 'image') return 'Picture'; const n = SHAPES.find(x => x[0] === o.k); return n ? n[1] : 'Shape'; }
function renderPopLayers() {
    const p = $('#popLayers'), s = curSlide(); if (!s) return; const sel = new Set(selObjs().map(o => o.id));
    const rows = s.objs.slice().reverse().map(o => `<div class="ebs-lrow${sel.has(o.id) ? ' on' : ''}" draggable="true" data-id="${o.id}"><span class="ic">${o.t === 'text' ? 'T' : o.t === 'image' ? '🖼' : o.t === 'emoji' ? (o.ch || '😀') : '◆'}</span><span class="nm">${o.g ? '⛓ ' : ''}${esc(layerLabel(o))}</span><button data-a="up" title="Bring forward one layer">▲</button><button data-a="down" title="Send back one layer">▼</button><button data-a="vis" title="Show or hide">${o.hidden ? '🚫' : '👁'}</button><button data-a="lock" title="Lock so it cannot be moved">${o.locked ? '🔒' : '🔓'}</button></div>`).join('');
    p.style.width = '360px';
    p.innerHTML = '<div class="ebs-lab">Layers · top of the slide first</div><div class="ebs-lay">' + (rows || '<div class="ebs-note">Nothing on this slide yet.</div>') + '</div><div class="ebs-note">Click to select (Ctrl+click for several). Drag a row up or down to reorder, like in Canva. Ctrl+] / Ctrl+[ also move the selected item.</div>';
    let dragId = null;
    p.querySelectorAll('.ebs-lrow').forEach(row => {
        const id = row.dataset.id;
        row.addEventListener('click', (e) => {
            const b2 = e.target.closest('button[data-a]'); const o = s.objs.find(x => x.id === id); if (!o) return;
            if (b2) { e.stopPropagation(); const a2 = b2.dataset.a; if (a2 === 'vis') mutate(() => { o.hidden = !o.hidden; }); else if (a2 === 'lock') mutate(() => { o.locked = !o.locked; }); else { setSel([id]); reorder(a2); } return; }
            if (e.ctrlKey || e.metaKey || e.shiftKey) { const cur = new Set(selObjs().map(x => x.id)); if (cur.has(id)) cur.delete(id); else cur.add(id); setSel(Array.from(cur)); } else setSel(o.g ? s.objs.filter(x => x.g === o.g).map(x => x.id) : [id]);
            drawSel(); renderRow2(); renderPopLayers();
        });
        row.addEventListener('dragstart', (e) => { dragId = id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch (x) { /* ignore */ } });
        row.addEventListener('dragover', (e) => { if (dragId) { e.preventDefault(); row.classList.add('over'); } });
        row.addEventListener('dragleave', () => row.classList.remove('over'));
        row.addEventListener('drop', (e) => { e.preventDefault(); if (!dragId || dragId === id) return; const from = dragId; dragId = null; mutate(sl => { const fi = sl.objs.findIndex(x => x.id === from), ti = sl.objs.findIndex(x => x.id === id); if (fi < 0 || ti < 0) return; const [m] = sl.objs.splice(fi, 1); sl.objs.splice(ti, 0, m); }); });
    });
}
const LINE_STYLES = [['solid', 'none', 'Solid line'], ['dash', 'none', 'Dashed line'], ['dot', 'none', 'Dotted line'], ['dashdot', 'none', 'Dash-dot line'], ['solid', 'end', 'Arrow'], ['dash', 'end', 'Dashed arrow'], ['solid', 'both', 'Double arrow'], ['dot', 'end', 'Dotted arrow']];
const LINE_SIZES = [['Thin', 3], ['Medium', 6], ['Thick', 12], ['Heavy', 22]];
function linePreview(d, a) { const dash = { solid: '', dash: 'stroke-dasharray="9 5"', dot: 'stroke-dasharray="0.1 6" stroke-linecap="round"', dashdot: 'stroke-dasharray="10 5 0.1 5" stroke-linecap="round"' }[d]; const x2 = a === 'none' ? 118 : 104; return `<svg width="124" height="18" viewBox="0 0 124 18" aria-hidden="true"><line x1="${a === 'both' ? 14 : 4}" y1="9" x2="${x2}" y2="9" stroke="currentColor" stroke-width="3" ${dash}/>${a !== 'none' ? '<polygon points="120,9 106,2 106,16" fill="currentColor"/>' : ''}${a === 'both' ? '<polygon points="4,9 18,2 18,16" fill="currentColor"/>' : ''}</svg>`; }
let lineSize = 6;
function renderPopLines() {
    const p = $('#popLines');
    p.innerHTML = '<div class="ebs-lab">Thickness</div><div class="ebs-chips">' + LINE_SIZES.map(z => `<button class="ebs-chip${z[1] === lineSize ? ' on' : ''}" data-sz="${z[1]}">${z[0]}</button>`).join('') + '</div><div class="ebs-lab">Line style</div><div style="display:flex;flex-direction:column;gap:6px">' + LINE_STYLES.map((l, i) => `<button class="ebs-btn" style="display:flex;justify-content:space-between;align-items:center;gap:10px" data-ls="${i}"><span>${l[2]}</span>${linePreview(l[0], l[1])}</button>`).join('') + '</div>';
    p.querySelectorAll('[data-sz]').forEach(b => b.onclick = () => { lineSize = +b.dataset.sz; renderPopLines(); });
    p.querySelectorAll('[data-ls]').forEach(b => b.onclick = () => { const l = LINE_STYLES[+b.dataset.ls]; addShape('line', { dash: l[0], arrow: l[1], sw: lineSize }); hidePops(); });
}
function renderPopEmoji() { const p = $('#popEmoji'); p.innerHTML = '<div class="ebs-lab">Emoji</div><div class="ebs-pgrid">' + EMOJIS.map(e => `<button data-e="${e}" aria-label="Emoji ${e}">${e}</button>`).join('') + '</div><div class="ebs-note">Tip: you can also paste any emoji into a text box.</div>'; p.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { addEmoji(b.dataset.e); hidePops(); }); }
function renderPopLayouts() { const p = $('#popLayouts'); p.innerHTML = '<div class="ebs-lab">New slide</div>' + [['blank', 'Blank slide']].concat(Object.entries(LAYOUT_NAMES)).map(l => `<button class="ebs-btn" style="text-align:left" data-lay="${l[0]}">${l[1]}</button>`).join(''); p.querySelectorAll('[data-lay]').forEach(b => b.onclick = () => { addSlide(b.dataset.lay); hidePops(); }); }
function renderPopBg() {
    const p = $('#popBg'), s = curSlide(); if (!s) return; const bg = s.bg || {};
    p.innerHTML = `<div class="ebs-lab">Ready-made</div><div class="ebs-bgp">${BG_PRESETS.map((g, i) => `<button data-bgp="${i}" style="background:linear-gradient(135deg,${g[0]},${g[1]})" aria-label="Background ${i + 1}"></button>`).join('')}</div>
<div class="ebs-row"><span class="ebs-lab">Solid</span><input type="color" id="bgC1" value="${/^#[0-9a-f]{6}$/i.test(bg.c1) ? bg.c1 : '#0f172a'}"><span class="ebs-lab">Gradient to</span><input type="color" id="bgC2" value="${/^#[0-9a-f]{6}$/i.test(bg.c2) ? bg.c2 : '#000000'}"><label class="ebs-row" style="gap:4px"><input type="checkbox" id="bgGrad"${bg.kind === 'grad' ? ' checked' : ''}> Use gradient</label></div>
<div class="ebs-row"><span class="ebs-lab">Angle</span><input type="range" id="bgAng" min="0" max="360" value="${bg.ang == null ? 135 : bg.ang}"></div>
<div class="ebs-row"><button class="ebs-btn f1" id="bgImg">Use a picture…</button>${bg.kind === 'image' ? '<button class="ebs-btn" id="bgImgOff">Remove picture</button>' : ''}</div>
<div class="ebs-row"><span class="ebs-lab">Darken</span><input type="range" id="bgDim" min="0" max="0.85" step="0.05" value="${bg.dim || 0}"></div>
<button class="ebs-btn" id="bgAll">Use this background on every slide in this deck</button>`;
    const setBg = (fn, nosnap) => mutate(sl => { sl.bg = sl.bg || {}; fn(sl.bg); }, nosnap);
    p.querySelectorAll('[data-bgp]').forEach(b => b.onclick = () => { const g = BG_PRESETS[+b.dataset.bgp]; setBg(bg2 => { bg2.kind = 'grad'; bg2.c1 = g[0]; bg2.c2 = g[1]; if (bg2.ang == null) bg2.ang = 135; }); renderPopBg(); });
    let snapped = false; const once = () => { if (!snapped) { snap(); snapped = true; } };
    $('#bgC1').oninput = (e) => { once(); setBg(b2 => { b2.c1 = e.target.value; if (b2.kind === 'image') b2.kind = b2.kind; }, true); }; $('#bgC2').oninput = (e) => { once(); setBg(b2 => { b2.c2 = e.target.value; }, true); };
    $('#bgGrad').onchange = (e) => { snap(); setBg(b2 => { b2.kind = e.target.checked ? 'grad' : 'solid'; if (!b2.c2) b2.c2 = '#000000'; }, true); };
    $('#bgAng').oninput = (e) => { once(); setBg(b2 => { b2.ang = +e.target.value; }, true); }; $('#bgDim').oninput = (e) => { once(); setBg(b2 => { b2.dim = +e.target.value; }, true); };
    $('#bgImg').onclick = () => $('#ebsBgPick').click(); if ($('#bgImgOff')) $('#bgImgOff').onclick = () => { setBg(b2 => { b2.kind = 'solid'; delete b2.img; }); renderPopBg(); };
    $('#bgAll').onclick = () => { const d = curDeck(); snap(); d.slides.forEach(sl => { sl.bg = clone(s.bg); sl.v = (sl.v || 0) + 1; }); touch(); refreshFilm(); toast('Background applied to every slide.'); };
}

// ---------- filmstrip ----------
function refreshThumb(i) {
    const d = curDeck(); if (!d) return; const s = d.slides[i], node = el.film.querySelector(`[data-i="${i}"] canvas`);
    if (s && node) paintInto(node, s, 's' + s.id, 256);
    const dn = $(`.ebs-deck[data-id="${d.id}"] canvas`); if (dn && i === 0) paintInto(dn, s, 'd' + d.id, 320);
    refreshLive();
}
function refreshFilm() {
    const d = curDeck(); if (!d) { el.film.innerHTML = ''; return; }
    const hiOrder = d.slides.filter(s => S.hi.has(s.id));
    const airKey = S.live && S.live.on ? S.live.key : '';
    el.film.innerHTML = d.slides.map((s, i) => `<div class="ebs-th${i === S.idx ? ' cur' : ''}${S.hi.has(s.id) ? ' hi' : ''}" data-i="${i}" draggable="true" title="Slide ${i + 1}. Click to edit. Ctrl/Shift + click to highlight several."><canvas width="256" height="144"></canvas><span class="no">${i + 1}</span><span class="bd">${hiOrder.indexOf(s) + 1}</span>${airKey === d.id + ':' + s.id ? '<span class="air">LIVE</span>' : ''}</div>`).join('') + '<button class="ebs-addth" id="ebsAddTh" aria-label="Add slide" title="Add a slide">+</button>';
    d.slides.forEach((s, i) => { const n = el.film.querySelector(`[data-i="${i}"] canvas`); if (n) paintInto(n, s, 's' + s.id, 256); });
    const sb = $('#ebsSelbar'), n = S.hi.size;
    sb.innerHTML = `<span>${n ? `<b>${n} slide${n > 1 ? 's' : ''} highlighted</b> · ` : ''}Slide ${S.idx + 1} of ${d.slides.length} · Ctrl/Shift + click to highlight several · Delete removes them · drag to reorder</span><span class="ebs-row"><button class="ebs-btn" id="fsAll">Select all</button><button class="ebs-btn cue" id="fsCue">Add ${n ? 'highlighted' : 'this slide'} to cue list</button><button class="ebs-btn" id="fsDel" style="color:#f87171"${n ? '' : ' disabled'}>Delete highlighted</button><button class="ebs-btn ghost" id="fsClear"${n ? '' : ' disabled'}>Clear</button></span>`;
    const cur = el.film.querySelector('.ebs-th.cur'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function selectSlide(i, ev) {
    const d = curDeck(); if (!d) return; i = clamp(i, 0, d.slides.length - 1);
    if (ev && (ev.ctrlKey || ev.metaKey)) { const id = d.slides[i].id; if (S.hi.has(id)) S.hi.delete(id); else S.hi.add(id); refreshFilm(); return; }
    if (ev && ev.shiftKey) { const a = Math.min(S.idx, i), b = Math.max(S.idx, i); S.hi.clear(); for (let k = a; k <= b; k++) S.hi.add(d.slides[k].id); refreshFilm(); return; }
    finishEdit(); S.idx = i; S.sel = null; S.hi.clear(); drawStage(); drawSel(); renderRow2(); refreshFilm(); hidePops();
}
function moveSlide(from, to) {
    const d = curDeck(); if (!d || from === to) return; snap(); const [s] = d.slides.splice(from, 1); d.slides.splice(to, 0, s); S.idx = to; touch(); refreshAll();
}
function bindFilm() {
    let dragFrom = -1;
        // Double-click = send live. Counted on the PRESS (the strip is redrawn after every click, so the browser's own dblclick never fires) and only when both presses are on the SAME card, close in time and position.
    el.film.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) { S.lastThClick = null; return; }
        const t = e.target.closest('.ebs-th'); if (!t) { S.lastThClick = null; return; }
        const k = +t.dataset.i, now = Date.now(), lc = S.lastThClick;
        if (lc && lc.i === k && now - lc.t < 450 && Math.abs(e.clientX - lc.x) < 8 && Math.abs(e.clientY - lc.y) < 8) {
            S.lastThClick = null; const d = curDeck(); if (!d) return;
            const i = clamp(k, 0, d.slides.length - 1); if (S.idx !== i) selectSlide(i); finishEdit(); startDeckRun(i, true); return;
        }
        S.lastThClick = { i: k, t: now, x: e.clientX, y: e.clientY };
    });
el.film.addEventListener('click', (e) => { const t = e.target.closest('.ebs-th'); if (t) selectSlide(+t.dataset.i, e); else if (e.target.id === 'ebsAddTh') addSlide('blank'); else if (e.target.id === 'fsAll') { const d = curDeck(); d.slides.forEach(s => S.hi.add(s.id)); refreshFilm(); } });
    $('#ebsSelbar').addEventListener('click', (e) => {
        const d = curDeck(); if (!d) return;
        if (e.target.id === 'fsAll') { d.slides.forEach(s => S.hi.add(s.id)); refreshFilm(); }
        else if (e.target.id === 'fsClear') { S.hi.clear(); refreshFilm(); }
        else if (e.target.id === 'fsDel') delSlides();
        else if (e.target.id === 'fsCue') { commitDraft(d); const list = S.hi.size ? d.slides.filter(s => S.hi.has(s.id)) : [d.slides[S.idx]]; list.forEach(s => S.cue.push({ d: d.id, s: s.id })); saveCue(); renderCue(); toast(list.length + ' slide' + (list.length > 1 ? 's' : '') + ' added to the cue list.'); }
    });
    el.film.addEventListener('dragstart', (e) => { const t = e.target.closest('.ebs-th'); if (!t) return; dragFrom = +t.dataset.i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (x) { /* ignore */ } });
    el.film.addEventListener('dragover', (e) => { const t = e.target.closest('.ebs-th'); if (t && dragFrom >= 0) { e.preventDefault(); el.film.querySelectorAll('.over').forEach(n => n.classList.remove('over')); t.classList.add('over'); } });
    el.film.addEventListener('drop', (e) => { const t = e.target.closest('.ebs-th'); if (t && dragFrom >= 0) { e.preventDefault(); const to = +t.dataset.i, from = dragFrom; dragFrom = -1; moveSlide(from, to); } });
    el.film.addEventListener('dragend', () => { dragFrom = -1; el.film.querySelectorAll('.over').forEach(n => n.classList.remove('over')); });
}

function refreshAll() {
    const d = curDeck(); const nm = $('#ebsDeckName'); if (nm) nm.value = d ? d.name : '';
    renderDecks(); refreshFilm(); drawStage(); fitStage(); renderRow2(); renderCue(); refreshLive();
    updUndo();
}

// ================= part D: live screen, cue list, auto-advance, scripture, AI, PowerPoint, settings, profile =================

// ---------- sending a slide to the main screen (it becomes a picture on the same screens as everything else) ----------
const blobCache = new Map(); // "deck:slide:v" -> Blob
let sentUrls = [];
const SEND_W = 1920;
function canvasBlob(c) { return new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.92)); }
async function slideBlob(deck, slide) {
    const key = deck.id + ':' + slide.id + ':' + (slide.v || 0);
    if (blobCache.has(key)) return blobCache.get(key);
    linkFonts(); await ensureFonts(fontsFor(slide)); await preloadSlideImages(slide);
    const b = await canvasBlob(slideToCanvas(slide, SEND_W));
    blobCache.set(key, b); if (blobCache.size > 14) blobCache.delete(blobCache.keys().next().value);
    return b;
}
function transFor(slide) { return slide.trans || S.prefs.transition || 'fade'; }
async function sendSlide(deck, slide, opts) {
    opts = opts || {};
    const blob = await slideBlob(deck, slide);
    const url = URL.createObjectURL(blob);
    const trans = opts.noTrans ? 'cut' : transFor(slide);
    S.selfSend = true;
    try {
        if (typeof slidesNoteExternalChange === 'function') slidesNoteExternalChange();   // stops the plain image slideshow if it was running
        const wasImage = previewState.displayMode === 'media' && previewState.mediaKind === 'image';
        const prevUrl = wasImage && trans !== 'cut' ? previewState.mediaUrl : '';
        if (typeof pauseAllMasterVideosExcept === 'function') pauseAllMasterVideosExcept(null);
        slides.seq++;
        Object.assign(previewState, { mediaUrl: url, mediaKind: 'image', mediaName: deck.name + ' · slide ' + (deck.slides.indexOf(slide) + 1), displayMode: 'media', mediaFit: previewState.mediaFit === 'cover' ? 'cover' : 'contain',
            mediaPdfId: '', mediaPdfPage: 1, mediaPdfPageCount: 0, slideTransition: trans === 'cut' ? '' : trans, slideSeq: slides.seq, slidePrevUrl: prevUrl });
        if (typeof updateMediaPanelStatus === 'function') updateMediaPanelStatus();
        renderPreview();
        const seq = slides.seq;
        if (prevUrl) setTimeout(() => { if (slides.seq === seq && previewState.mediaUrl === url) { previewState.slidePrevUrl = ''; renderPreview(); } }, 1100);
    } finally { S.selfSend = false; }
    sentUrls.push(url); while (sentUrls.length > 4) { const old = sentUrls.shift(); setTimeout(() => URL.revokeObjectURL(old), 8000); }
    const th = slideToCanvas(slide, 640);
    S.live = { on: true, key: deck.id + ':' + slide.id, deck: deck.id, slide: slide.id, v: slide.v || 0, thumb: th };
    refreshLive(); refreshFilm(); renderCue();
}
function stopRun(clearLive) {
    clearTimeout(S.timer); S.timer = null; clearInterval(S.tick); S.tick = null; S.timerEnd = 0; S.run = null; S.paused = false; S.remain = 0;
    if (clearLive && S.live) S.live.on = false;
    refreshLive(); renderCue(); if (el.film) refreshFilm(); updateTimerNote();
}
function findEntry(e) { const d = S.decks.find(x => x.id === e.d); const s = d && d.slides.find(x => x.id === e.s); return d && s ? { d, s } : null; }
async function runGo(i, opts) {
    const r = S.run; if (!r || !r.list.length) return;
    const n = r.list.length; r.i = ((i % n) + n) % n;
    let ent = findEntry(r.list[r.i]), guard = 0;
    while (!ent && guard++ < n) { r.i = (r.i + 1) % n; ent = findEntry(r.list[r.i]); }
    if (!ent) { stopRun(); return; }
    await sendSlide(ent.d, ent.s, opts);
    if (S.run === r) schedule();
}
function schedule(ms) {
    clearTimeout(S.timer); clearInterval(S.tick); S.timer = null; S.tick = null; S.timerEnd = 0;
    const r = S.run; if (!r || !S.prefs.auto) { updateTimerNote(); syncPause(); return; }
    if (S.paused) { updateTimerNote(); syncPause(); return; }
    const last = r.i >= r.list.length - 1;
    if (last && !S.prefs.loop) { updateTimerNote(); syncPause(); return; }
    const cur = findEntry(r.list[r.i]); const secs = Math.max(1, (cur && cur.s.secs > 0 ? cur.s.secs : S.prefs.secs) || 10);
    const wait = ms > 0 ? ms : secs * 1000; S.timerEnd = Date.now() + wait;
    S.timer = setTimeout(() => { if (S.run === r) runGo(r.i + 1); }, wait);
    S.tick = setInterval(updateTimerNote, 250); updateTimerNote(); syncPause();
    const nx = findEntry(r.list[(r.i + 1) % r.list.length]); if (nx) slideBlob(nx.d, nx.s).catch(() => {}); // warm up the next picture so the change is instant
}
function togglePause() { // hold on the current slide (for example when the preacher asks to stay), then carry on
    if (!S.prefs.auto) return;
    if (!S.paused) { S.paused = true; S.remain = S.timerEnd ? Math.max(1000, S.timerEnd - Date.now()) : 0; schedule(); toast('Paused on this slide. Press Resume to carry on.'); }
    else { S.paused = false; schedule(S.remain || 0); S.remain = 0; }
    syncPause();
}
function syncPause() {
    const b = $('#cuPause'); if (!b) return; b.hidden = !S.prefs.auto; b.textContent = S.paused ? '▶ Resume auto-advance' : '⏸ Pause on this slide'; b.classList.toggle('cue', !!S.paused);
}
function updateTimerNote() {
    const n = $('#tmLeft'); if (!n) return;
    if (S.paused && S.prefs.auto) { n.textContent = 'Paused. This slide stays up until you press Resume (Next and Prev still work).'; return; }
    if (!S.run) { n.textContent = S.prefs.auto ? 'Auto-advance is on. Start the cue list or send a slide and it will move on by itself.' : ''; return; }
    if (!S.prefs.auto) { n.textContent = ''; return; }
    const last = S.run.i >= S.run.list.length - 1;
    if (last && !S.prefs.loop) { n.textContent = 'Last slide reached. Auto-advance stopped.'; return; }
    if (!S.timerEnd) { n.textContent = ''; return; }
    n.textContent = 'Next slide in ' + Math.max(0, Math.ceil((S.timerEnd - Date.now()) / 1000)) + ' s';
}
function startCue(i) { if (!S.cue.length) { toast('The cue list is empty. Highlight slides and press "Add to cue list".', true); return; } S.run = { kind: 'cue', list: S.cue, i: i || 0 }; runGo(i || 0); }
function startDeckRun(from, onlyOne) {
    const d = curDeck(); if (!d) return;
    const list = d.slides.map(s => ({ d: d.id, s: s.id }));
    S.run = { kind: 'deck', list, i: from }; if (onlyOne && !S.prefs.auto) S.run.single = true;
    runGo(from);
}
function sendEditing() { const d = curDeck(); if (!d) return; finishEdit(); startDeckRun(S.idx, true); }
function nextSlide(dir) {
    if (!S.run) { if (S.cue.length && dir > 0) startCue(0); else if (curDeck()) startDeckRun(clamp(S.idx + (S.live && S.live.on ? dir : 0), 0, curDeck().slides.length - 1), true); return; }
    const r = S.run, to = r.i + dir;
    if (!S.prefs.loop && (to >= r.list.length || to < 0)) { toast(to < 0 ? 'This is the first slide.' : 'This is the last slide.'); return; }
    runGo(to);
}
function clearScreen() {
    stopRun(true);
    S.selfSend = true; try { if (typeof switchToTextDisplay === 'function') switchToTextDisplay(); renderPreview(); } finally { S.selfSend = false; }
    refreshLive(); refreshFilm();
}
async function updateLive() {
    if (!S.live || !S.live.on) return; const ent = findEntry({ d: S.live.deck, s: S.live.slide }); if (!ent) return;
    await sendSlide(ent.d, ent.s, { noTrans: true }); if (S.run) schedule();
}

// ---------- the live panel and cue list ----------
function refreshLive() {
    const cv = $('#lvCanvas'); if (!cv) return;
    const on = !!(S.live && S.live.on && previewState.displayMode === 'media');
    if (S.live && S.live.on && previewState.displayMode !== 'media') S.live.on = false;
    const pill = $('#lvPill'); pill.textContent = on ? '● ON AIR' : 'OFF AIR'; pill.classList.toggle('on', on);
    cv.hidden = !on; $('#lvNone').style.display = on ? 'none' : '';
    if (on) { cv.width = S.live.thumb.width; cv.height = S.live.thumb.height; cv.getContext('2d').drawImage(S.live.thumb, 0, 0); }
    let up = $('#lvUpdate');
    const ent = on ? findEntry({ d: S.live.deck, s: S.live.slide }) : null;
    const stale = !!(ent && (ent.s.v || 0) !== S.live.v);
    if (stale && !up) { up = document.createElement('button'); up.id = 'lvUpdate'; up.className = 'ebs-btn cue'; up.textContent = 'Edited. Update live screen'; up.onclick = updateLive; $('#lvClear').parentNode.parentNode.insertBefore(up, $('#lvClear').parentNode); }
    if (up) up.style.display = stale ? '' : 'none';
}
function renderCue() {
    const list = $('#cuList'); if (!list) return;
    $('#cuCount').textContent = S.cue.length ? '· ' + S.cue.length + ' slides' : '';
    const nextI = S.run && S.run.kind === 'cue' ? S.run.i + 1 : 0, airI = S.run && S.run.kind === 'cue' && S.live && S.live.on ? S.run.i : -1;
    list.innerHTML = S.cue.map((c, i) => { const e = findEntry(c); return `<div class="ebs-cuerow${i === airI ? ' air' : (i === nextI ? ' next' : '')}" data-i="${i}"><span class="n">${i + 1}</span><canvas width="112" height="64"></canvas><span class="t">${e ? esc(e.d.name) + ' · ' + (e.d.slides.indexOf(e.s) + 1) : 'Missing slide'}</span><button class="x" data-rm="${i}" aria-label="Remove from cue list">✕</button></div>`; }).join('') || '<div class="ebs-note">Empty. Highlight slides under the editor, then press "Add to cue list".</div>';
    list.querySelectorAll('.ebs-cuerow').forEach(row => { const e = findEntry(S.cue[+row.dataset.i]), cv = row.querySelector('canvas'); if (e && cv) paintInto(cv, e.s, 's' + e.s.id, 112); });
    $('#cuMode').textContent = S.run && S.run.kind === 'cue' ? 'Cue list is running. Next ▶ moves on.' : 'Click a row to show it, or press Next ▶ to start.';
    syncTimerUI();
}
function syncTimerUI() {
    const a = $('#tmAuto'), s = $('#tmSecs'), l = $('#tmLoop'), t = $('#tmTrans'); if (!a) return;
    syncPause(); a.checked = !!S.prefs.auto; s.value = S.prefs.secs; l.checked = !!S.prefs.loop;
    if (!t.options.length) t.innerHTML = TRANSITIONS.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('');
    t.value = S.prefs.transition;
    const ms = $('#tmTransMs'), mm = document.getElementById('displayTransitionMs'); if (ms && mm) ms.value = mm.value;
}

// ---------- scripture (results appear as you type; abbreviations like gen, rom, 1 co work like on the main screen) ----------
function verLabel() { const sel = document.getElementById('versionSelector'); return sel ? (typeof getVersionDisplayLabel === 'function' ? getVersionDisplayLabel(sel.value) : sel.value) : 'KJV'; }
function bookMatches(txt) {
    const t = txt.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim(); if (!t) return [];
    const out = [];
    for (const [full, id] of Object.entries(bookBollsIdMap)) { const ab = (bookAbbrevMap[full] || '').toLowerCase(); if (full === t || ab === t) return [id]; }
    for (const [full, id] of Object.entries(bookBollsIdMap)) { if (full.startsWith(t) || full.replace(/^(\d) /, '$1').startsWith(t.replace(/^(\d) /, '$1'))) out.push(id); }
    return out;
}
function resolveBook(txt) { const m = bookMatches(txt); return m.length ? m[0] : null; }
function bookTitle(id) { return typeof cleanBookNames !== 'undefined' && cleanBookNames[id] ? cleanBookNames[id] : (Object.keys(bookBollsIdMap).find(k => bookBollsIdMap[k] === id) || 'Book'); }
function parseRef(q) {
    const m = /^\s*([1-3]?\s*[a-z][a-z .]*?)\s*(?:(\d+)(?:\s*[:.\s]\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?)?\s*$/i.exec(q); if (!m) return null;
    const books = bookMatches(m[1]); if (!books.length) return null;
    return { books, book: books[0], ch: m[2] ? +m[2] : 0, from: m[3] ? +m[3] : 0, to: m[4] ? +m[4] : (m[3] ? +m[3] : 0) };
}
let scrSeq = 0, scrTimer = null, scrLast = -1;
function scrMsg(t) { const o = $('#scrOut'); o.className = 'ebs-verse'; o.textContent = t; }
function groupNums(nums) { const out = []; let a = null, b = null; nums.forEach(n => { if (a == null) { a = b = n; } else if (n === b + 1) b = n; else { out.push(a === b ? '' + a : a + '-' + b); a = b = n; } }); if (a != null) out.push(a === b ? '' + a : a + '-' + b); return out.join(', '); }
function scrSync() { const n = S.scr ? S.scr.sel.size : 0; $('#scrAdd').disabled = $('#scrNew').disabled = !n; $('#scrAll').disabled = !S.scr; document.querySelectorAll('#scrOut .ebs-vrow').forEach(r => r.classList.toggle('on', S.scr && S.scr.sel.has(+r.dataset.n))); }
function scrPick() { const sc = S.scr; if (!sc || !sc.sel.size) return null; const vs = sc.vs.filter(v => sc.sel.has(v.n)); return { vs, ref: bookTitle(sc.book) + ' ' + sc.ch + ':' + groupNums(vs.map(v => v.n)), ver: sc.ver, book: sc.book, ch: sc.ch }; }
function renderVerseList() {
    const sc = S.scr, o = $('#scrOut'); o.className = 'ebs-verses';
    o.innerHTML = sc.vs.map(v => `<div class="ebs-vrow" data-n="${v.n}" title="Click to select. Shift+click selects a range."><b>${v.n}</b><span>${esc(v.t)}</span></div>`).join('');
    scrSync(); const f = o.querySelector('.ebs-vrow.on'); if (f) o.scrollTop = Math.max(0, f.offsetTop - 6);
}
async function loadScripture() {
    const q = $('#scrIn').value.trim(), hits = $('#scrHits'), seq = ++scrSeq; hits.hidden = true;
    if (!q) { S.scr = null; scrMsg('Start typing a book and verse. Results appear straight away, then click the verses you want.'); scrSync(); return; }
    const ref = parseRef(q);
    if (!ref) { if (q.length >= 3) return searchWords(q, seq); S.scr = null; scrSync(); return; }
    if (!ref.ch) { // only a book so far: offer the matching books
        S.scr = null; scrSync(); scrMsg('Now add a chapter and verse, for example ' + bookTitle(ref.book) + ' 1:1');
        if (ref.books.length > 1 || bookTitle(ref.book).toLowerCase() !== q.toLowerCase()) { hits.hidden = false; hits.innerHTML = ref.books.slice(0, 12).map(id => `<button data-b="${id}">${esc(bookTitle(id))}</button>`).join(''); hits.querySelectorAll('button').forEach(b => b.onclick = () => { $('#scrIn').value = bookTitle(+b.dataset.b) + ' '; $('#scrIn').focus(); loadScripture(); }); }
        return;
    }
    const ver = document.getElementById('versionSelector').value;
    try {
        const data = await bollsChapterJson(ver, ref.book, ref.ch); if (seq !== scrSeq) return;
        const vs = (data || []).map(v => ({ n: v.verse, t: cleanBibleText(v.text) })).filter(v => v.t); if (!vs.length) throw new Error('empty');
        const sel = new Set(); if (ref.from) vs.forEach(v => { if (v.n >= ref.from && v.n <= (ref.to || ref.from)) sel.add(v.n); });
        S.scr = { vs, sel, ver: verLabel(), book: ref.book, ch: ref.ch }; scrLast = -1; renderVerseList();
    } catch (e) { if (seq !== scrSeq) return; S.scr = null; scrSync(); scrMsg(e && e.ebpNotice ? e.ebpNotice : 'Could not load that chapter. Check the spelling and your internet connection.'); }
}
async function searchWords(q, seq) {
    const hits = $('#scrHits'), ver = document.getElementById('versionSelector').value; S.scr = null; scrSync();
    if (typeof blibIsLocal === 'function' && blibIsLocal(ver)) { scrMsg('Word search needs an online English version. Type a reference like John 3:16 instead.'); return; }
    scrMsg('Searching…');
    try {
        const r = await fetch('https://bolls.life/v2/find/' + ver + '?search=' + encodeURIComponent(q) + '&match_case=false&match_whole=false&limit=12&page=1');
        const j = await r.json(); if (seq !== scrSeq) return; const list = (j && j.results) || [];
        if (!list.length) { scrMsg('No verses found for "' + q + '".'); return; }
        scrMsg('Pick a verse:'); hits.hidden = false;
        hits.innerHTML = list.map((x, i) => `<button data-i="${i}">${esc(bookTitle(x.book))} ${x.chapter}:${x.verse} <span style="color:var(--mu)">${esc(cleanBibleText(x.text).slice(0, 70))}…</span></button>`).join('');
        hits.querySelectorAll('button').forEach(b => b.onclick = () => { const x = list[+b.dataset.i]; $('#scrIn').value = bookTitle(x.book) + ' ' + x.chapter + ':' + x.verse; loadScripture(); });
    } catch (e) { if (seq === scrSeq) scrMsg('Search failed. Check your internet connection.'); }
}
function onScrInput() { clearTimeout(scrTimer); const q = $('#scrIn').value.trim(); scrTimer = setTimeout(loadScripture, parseRef(q) ? 160 : 550); }
function onVerseClick(e) {
    const row = e.target.closest('.ebs-vrow'); if (!row || !S.scr) return; const n = +row.dataset.n, sel = S.scr.sel;
    if (e.shiftKey && scrLast > 0) { const a = Math.min(scrLast, n), b = Math.max(scrLast, n); S.scr.vs.forEach(v => { if (v.n >= a && v.n <= b) sel.add(v.n); }); }
    else { if (sel.has(n)) sel.delete(n); else sel.add(n); scrLast = n; }
    scrSync();
}
function chunkVerses(p) { // keep slides readable: split long passages at verse boundaries
    const max = 330, chunks = []; let cur = [], len = 0;
    p.vs.forEach(v => { if (cur.length && len + v.t.length > max) { chunks.push(cur); cur = []; len = 0; } cur.push(v); len += v.t.length; });
    if (cur.length) chunks.push(cur);
    return chunks.map(c => ({ text: c.map(v => (p.vs.length > 1 ? v.n + ' ' : '') + v.t).join(' '), ref: bookTitle(p.book) + ' ' + p.ch + ':' + groupNums(c.map(v => v.n)) + ' (' + p.ver + ')' }));
}
function addScriptureToSlide() {
    const p = scrPick(), s = curSlide(); if (!p || !s) return; const col = textColorForBg(s);
    const text = p.vs.map(v => (p.vs.length > 1 ? v.n + ' ' : '') + v.t).join(' ');
    snap(); s.objs.push(TXT(160, 170, 1600, 620, text, { size: 72, color: col, fit: true, font: 'Playfair Display', lh: 1.3, shadow: col === '#ffffff' }));
    const rf = TXT(160, 820, 1600, 90, p.ref + ' (' + p.ver + ')', { size: 46, bold: true, color: '#fbbf24', font: 'Montserrat' }); s.objs.push(rf); S.sel = rf.id;
    touch(s); drawStage(); drawSel(); renderRow2(); refreshThumb(S.idx); toast('Scripture added. Click it to change the look.');
}
function newScriptureSlides() {
    const p = scrPick(), d = curDeck(); if (!p || !d) return; snap(); const th = d.theme && THEMES[d.theme] ? d.theme : 'scripture';
    const list = chunkVerses(p).map(c => layoutSlide(th, 'scripture', { verse: c.text, ref: c.ref }));
    d.slides.splice(S.idx + 1, 0, ...list); S.idx++; S.sel = null; S.hi.clear(); touch(); refreshAll(); toast(list.length + ' scripture slide' + (list.length > 1 ? 's' : '') + ' added.');
}

// ---------- AI slide maker (bring your own key; the key never leaves this browser except to the AI company you chose) ----------
const AI_SYSTEM = 'You make church presentation slides. Reply with ONLY valid JSON, no explanation, in this shape: {"title":"deck name","slides":[{"layout":"title","kicker":"","title":"","sub":""},{"layout":"points","title":"","items":["",""]},{"layout":"scripture","verse":"","ref":""},{"layout":"lyrics","text":"lines separated by \\n"},{"layout":"announce","title":"","items":[{"e":"emoji","h":"heading","t":"detail"}]},{"layout":"closing","title":"","sub":"","e":"emoji"},{"layout":"section","num":"01","title":""}]}. Keep text short and easy to read from the back of a hall: titles under 6 words, bullet points under 10 words, at most 5 bullets. Use the layouts that fit. Quote scripture accurately and give the reference.';
function aiCfg() { return S.prefs.ai; }
async function aiCall(prompt) {
    const c = aiCfg(); if (!c.key) { const e = new Error('nokey'); e.nokey = true; throw e; }
    if (c.provider === 'claude') {
        const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: JSON.stringify({ model: c.model || 'claude-haiku-4-5', max_tokens: 4096, system: AI_SYSTEM, messages: [{ role: 'user', content: prompt }] }) });
        const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error((j.error && j.error.message) || 'AI error'); e.status = r.status; throw e; }
        return (j.content || []).map(p => p.text || '').join('');
    }
    const body = JSON.stringify({ systemInstruction: { parts: [{ text: AI_SYSTEM }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } });
    const call = async (model) => {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': c.key }, body });
        const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error((j.error && j.error.message) || 'AI error'); e.status = r.status; throw e; }
        const p = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts; return (p || []).map(x => x.text || '').join('');
    };
    const retired = (e) => e.status === 404 || /no longer available|not found|not supported|deprecated/i.test(e.message || '');
    if (c.model) return call(c.model);                       // a model you typed yourself is used exactly
    let first = S.aiModelAuto || 'gemini-flash-latest';       // "latest" always points to the current Flash model
    try { return await call(first); } catch (e) {
        if (!retired(e)) throw e;
        const found = await geminiNewestFlash(c.key); if (!found || found === first) throw e; S.aiModelAuto = found; return call(found);
    }
}
async function geminiNewestFlash(key) { // asks Google which models this key can use and picks the newest Flash
    try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } }); const j = await r.json();
        const list = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /^models\/gemini-[\d.]+-flash$/.test(m.name)).map(m => ({ n: m.name.replace('models/', ''), v: parseFloat(m.name.match(/gemini-([\d.]+)-flash/)[1]) })).sort((a, b) => b.v - a.v);
        return list.length ? list[0].n : null;
    } catch (e) { return null; }
}
function parseAiJson(t) {
    t = String(t || '').replace(/```json|```/gi, ''); const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b < a) throw new Error('The AI did not return slides. Try again.');
    return JSON.parse(t.slice(a, b + 1));
}
const sx = (v, n) => String(v == null ? '' : v).slice(0, n || 400);
function buildAiDeck(j, themeId) {
    const slidesIn = Array.isArray(j.slides) ? j.slides.slice(0, 20) : []; if (!slidesIn.length) throw new Error('The AI returned no slides. Try again.');
    const th = THEMES[themeId] ? themeId : 'welcome';
    const list = slidesIn.map(x => {
        const lay = LAY[x.layout] ? x.layout : 'title';
        const items = Array.isArray(x.items) ? x.items.slice(0, 6) : [];
        const c = { kicker: sx(x.kicker, 60), title: sx(x.title, 90), sub: sx(x.sub, 140), verse: sx(x.verse, 600), ref: sx(x.ref, 60), text: sx(x.text, 700), num: sx(x.num, 4), e: sx(x.e, 8),
            items: lay === 'announce' ? items.map(i => ({ e: sx(i && i.e, 8), h: sx(i && i.h, 40), t: sx(i && i.t, 90) })) : items.map(i => sx(typeof i === 'string' ? i : (i && (i.t || i.h)), 100)) };
        return layoutSlide(th, lay, c);
    });
    const d = newDeck(sx(j.title, 70) || 'AI slides', list); d.theme = th; return d;
}
async function runAi() {
    const p = $('#aiPrompt').value.trim(), note = $('#aiNote'); if (!p) { note.textContent = 'Describe what the slides are for.'; return; }
    if (!aiCfg().key) { note.textContent = 'Add your AI key first (Settings → AI).'; openSettings('ai'); return; }
    const n = clamp(parseInt($('#aiCount').value, 10) || 6, 2, 14), themeId = $('#aiTheme').value === 'auto' ? 'welcome' : $('#aiTheme').value;
    const btn = $('#aiGo'); btn.disabled = true; note.textContent = 'Writing your slides…';
    try {
        const raw = await aiCall('Make about ' + n + ' slides for: ' + p);
        const d = buildAiDeck(parseAiJson(raw), themeId); addDeck(d); note.textContent = 'Done. Every part is editable: double-click any text.'; toast('AI slides created.');
    } catch (e) {
        note.textContent = e.nokey ? 'Add your AI key first (Settings → AI).' : e.status === 400 || e.status === 401 || e.status === 403 ? 'The AI company rejected your key. Check it in Settings → AI.' : e.status === 429 ? 'Your AI plan is out of quota right now. Try again later.' : (e instanceof TypeError ? 'Could not reach the AI service. Check your internet connection.' : (e.message || 'Something went wrong.'));
    } finally { btn.disabled = false; }
}

// ---------- export / import ----------
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
function exportDecks(list, name) { if (!list.length) return; download((name || 'decks').replace(/[^\w\- ]+/g, '') + '.ebpdeck', JSON.stringify({ generator: 'EBP SLIDE STUDIO', v: 1, decks: list.map(d => Object.assign(clone(d), { imgs: deckImgs(d) })) })); }
function exportDeck(d) { exportDecks([d], d.name || 'deck'); }
async function deleteDecks(ids) {
    const list = S.decks.filter(x => ids.includes(x.id)); if (!list.length) return;
    if (!confirm('Delete ' + (list.length > 1 ? list.length + ' decks' : '"' + list[0].name + '"') + '? This cannot be undone.')) return;
    S.decks = S.decks.filter(x => !ids.includes(x.id)); S.cue = S.cue.filter(c => !ids.includes(c.d)); saveCue(); S.deckSel.clear();
    for (const id of ids) await removeDeckStored(id);
    if (!S.decks.find(x => x.id === S.deckId)) { const first = S.decks.find(x => !x.draft); S.deckId = first ? first.id : null; S.idx = 0; S.sel = null; if (!S.deckId) newBlankDeck(); }
    refreshAll(); toast(list.length + ' deck' + (list.length > 1 ? 's' : '') + ' deleted.');
}
function adoptDeck(raw) {
    if (!raw || !Array.isArray(raw.slides) || !raw.slides.length) return null;
    Object.entries(raw.imgs || {}).forEach(([k, v]) => { if (typeof v === 'string' && v.startsWith('data:image/')) IMG.set(k, v); });
    const d = cloneDeck(raw, sx(raw.name, 80) || 'Imported deck'); d.imgs = {}; d.theme = raw.theme;
    d.slides.forEach(s => { s.v = 1; s.secs = s.secs || 0; s.trans = s.trans || ''; s.objs = Array.isArray(s.objs) ? s.objs : []; });
    return d;
}
const pictureSlide = (id) => newSlide({ kind: 'solid', c1: '#000000', dim: 0 }, [{ id: uid('o'), t: 'image', src: id, x: 0, y: 0, w: W, h: H, rot: 0, op: 1, fit: 'contain', rad: 0, shadow: false }]);
const isPic = (f) => /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name);
async function importPictures(files, name) {
    const list = []; for (let i = 0; i < files.length; i++) { toast('Adding picture ' + (i + 1) + ' of ' + files.length + '…'); try { const r = await fileToImageId(files[i], 1920); list.push(pictureSlide(r.id)); } catch (e) { /* skip unreadable picture */ } }
    if (!list.length) throw new Error('None of those pictures could be read.');
    const d = newDeck(name || (files.length === 1 ? files[0].name.replace(/\.[^.]+$/, '') : 'Picture slides'), list); d.theme = 'minimal'; addDeck(d); toast(list.length + ' picture slide' + (list.length > 1 ? 's' : '') + ' ready. Set the timer and transition in the Live panel.');
}
async function importPdf(file) {
    if (typeof pdfjsLib === 'undefined') throw new Error('The PDF reader did not load. Connect to the internet once and reload.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise, n = Math.min(doc.numPages, 120), list = [];
    for (let i = 1; i <= n; i++) {
        toast('Reading PDF page ' + i + ' of ' + n + '…'); const pg = await doc.getPage(i), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(W / v0.width, H / v0.height) });
        const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
        await pg.render({ canvasContext: cx, viewport: vp }).promise; const bl = await canvasBlob(cv); const r = await fileToImageId(new Blob([bl], { type: 'image/jpeg' }), 1920); list.push(pictureSlide(r.id));
    }
    const d = newDeck(file.name.replace(/\.pdf$/i, ''), list); d.theme = 'minimal'; return d;
}
async function importFile(file) {
    if (!file) return;
    try {
        if (/\.pptx$/i.test(file.name)) { const d = await importPptx(file); addDeck(d); toast('PowerPoint imported: ' + d.slides.length + ' slides. Text and pictures are editable.'); return; }
        if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') { const d = await importPdf(file); addDeck(d); toast('PDF imported: ' + d.slides.length + ' pages as slides.'); return; }
        if (isPic(file)) { await importPictures([file]); return; }
        const j = JSON.parse(await file.text()); const arr = Array.isArray(j.decks) ? j.decks : (j.deck ? [j.deck] : [j]);
        let last = null; arr.forEach(r => { const d = adoptDeck(r); if (d) { dropDrafts(null); S.decks.push(d); S.dirty.add(d.id); last = d; } });
        if (!last) throw new Error('That file has no slides in it.'); schedSave(); openDeck(last.id); toast('Imported ' + arr.length + ' deck' + (arr.length > 1 ? 's' : '') + '.');
    } catch (e) { toast('Could not import: ' + (e.message || 'unknown file'), true); }
}
async function importFiles(files) {
    files = Array.from(files || []); if (!files.length) return;
    if (files.every(isPic)) { try { await importPictures(files); } catch (e) { toast(e.message, true); } return; }
    for (const f of files) await importFile(f);
}
function openMediaImport() { // pictures already saved in the main screen's media library
    const pics = (typeof mediaLibrary !== 'undefined' ? mediaLibrary : []).filter(m => m.kind === 'image');
    if (!pics.length) { toast('No saved pictures yet. Use "Pictures, PDF, PowerPoint…" to add some.', true); return; }
    modal(`<h3>Add pictures from your saved media</h3><div class="ebs-note">Each picture you tick becomes one slide.</div><div class="ebs-lay" style="max-height:50vh">${pics.map((m, i) => `<label class="ebs-lrow"><input type="checkbox" data-i="${i}"><img src="${m.url}" alt="" style="width:64px;height:36px;object-fit:cover;border-radius:4px"><span class="nm">${esc(m.name)}</span></label>`).join('')}</div><div class="ebs-row"><button class="ebs-btn" id="mmAll">Tick all</button><span class="ebs-grow"></span><button class="ebs-btn ghost" id="mmCancel">Cancel</button><button class="ebs-btn pri" id="mmAdd">Add as slides</button></div>`);
    $('#mmAll').onclick = () => document.querySelectorAll('#ebsMbox [data-i]').forEach(c => { c.checked = true; }); $('#mmCancel').onclick = closeModal;
    $('#mmAdd').onclick = async () => { const files = []; for (const c of Array.from(document.querySelectorAll('#ebsMbox [data-i]:checked'))) { const m = pics[+c.dataset.i]; try { const bl = await (await fetch(m.url)).blob(); files.push(new File([bl], m.name, { type: bl.type || 'image/jpeg' })); } catch (e) { /* skip */ } } closeModal(); if (files.length) { try { await importPictures(files, 'Saved pictures'); } catch (e) { toast(e.message, true); } } };
}

// ---------- PowerPoint (.pptx) import: text, pictures, colours and positions become ordinary editable items ----------
const EMU = 12700;
async function importPptx(file) {
    if (typeof blibUnzip !== 'function') throw new Error('Importer not ready. Reload the page and try again.');
    const zip = await blibUnzip(await file.arrayBuffer());
    const get = async (name) => { const e = zip.list.find(x => x.name === name); return e ? zip.read(e) : null; };
    const getTxt = async (name) => { const u = await get(name); return u ? new TextDecoder().decode(u) : null; };
    const parse = (t) => t ? new DOMParser().parseFromString(t, 'application/xml') : null;
    const kids = (n, tag) => Array.from(n.children).filter(c => c.nodeName === tag);
    const first = (n, tag) => n ? n.getElementsByTagName(tag)[0] || null : null;
    const pres = parse(await getTxt('ppt/presentation.xml')); if (!pres) throw new Error('This does not look like a PowerPoint file.');
    const sz = first(pres, 'p:sldSz'), cx = sz ? +sz.getAttribute('cx') : 12192000, cy = sz ? +sz.getAttribute('cy') : 6858000;
    const k = Math.min(W / cx, H / cy), ox = (W - cx * k) / 2, oy = (H - cy * k) / 2;
    const rels = parse(await getTxt('ppt/_rels/presentation.xml.rels')), relMap = {}; if (rels) Array.from(rels.getElementsByTagName('Relationship')).forEach(r => { relMap[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const ids = Array.from(pres.getElementsByTagName('p:sldId')).map(n => relMap[n.getAttribute('r:id')]).filter(Boolean).map(t => 'ppt/' + t.replace(/^\/?(ppt\/)?/, ''));
    if (!ids.length) throw new Error('No slides found in that file.');
    const relsOf = async (path) => { const p = path.replace(/([^/]+)$/, '_rels/$1.rels'); const x = parse(await getTxt(p)), m = {}; if (x) Array.from(x.getElementsByTagName('Relationship')).forEach(r => { let t = r.getAttribute('Target'); const base = path.replace(/[^/]+$/, ''); if (t.startsWith('/')) t = t.slice(1); else { const parts = (base + t).split('/'), out = []; parts.forEach(s => { if (s === '..') out.pop(); else if (s !== '.') out.push(s); }); t = out.join('/'); } m[r.getAttribute('Id')] = { target: t, type: r.getAttribute('Type') }; }); return m; };
    const colorOf = (node) => { // solid colour inside a fill or run property node
        const sf = node && (node.nodeName === 'a:solidFill' ? node : kids(node, 'a:solidFill')[0]); if (!sf) return '';
        const rgb = first(sf, 'a:srgbClr'); if (rgb) return '#' + rgb.getAttribute('val');
        const sc = first(sf, 'a:schemeClr'); if (sc) { const v = sc.getAttribute('val'); return /^(tx1|dk1|tx2|dk2)$/.test(v) ? '#1f2937' : (/^(bg1|lt1|bg2|lt2)$/.test(v) ? '#ffffff' : '#2563eb'); }
        return '';
    };
    const lum = (c) => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return 255; const n = parseInt(m[1], 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
    const masterBg = async (slidePath, srels) => { // background from the slide, else its layout/master
        const tryBg = (x) => { const bg = x && first(x, 'p:bg'); const pr = bg && first(bg, 'p:bgPr'); return pr ? colorOf(kids(pr, 'a:solidFill')[0]) : ''; };
        let c = tryBg(slideXmlCache); if (c) return c;
        const lay = Object.values(srels).find(r => /slideLayout$/.test(r.type));
        if (lay) { const lx = parse(await getTxt(lay.target)); c = tryBg(lx); if (c) return c; const lr = await relsOf(lay.target); const ms = Object.values(lr).find(r => /slideMaster$/.test(r.type)); if (ms) { c = tryBg(parse(await getTxt(ms.target))); if (c) return c; } }
        return '#ffffff';
    };
    let slideXmlCache = null; const deckSlides = [];
    for (const path of ids) {
        const xml = parse(await getTxt(path)); if (!xml) continue; slideXmlCache = xml;
        const srels = await relsOf(path), bgc = await masterBg(path, srels), dark = lum(bgc) < 140, defCol = dark ? '#ffffff' : '#111827';
        const objs = [];
        const layoutXml = (() => { const lay = Object.values(srels).find(r => /slideLayout$/.test(r.type)); return lay ? lay.target : null; })();
        const layDoc = layoutXml ? parse(await getTxt(layoutXml)) : null;
        const xfOf = (spNode) => { const x = first(spNode, 'a:xfrm') || first(spNode, 'p:xfrm'); if (!x) return null; const off = first(x, 'a:off'), ext = first(x, 'a:ext'); if (!off || !ext) return null; return { x: +off.getAttribute('x'), y: +off.getAttribute('y'), w: +ext.getAttribute('cx'), h: +ext.getAttribute('cy'), rot: +(x.getAttribute('rot') || 0) / 60000 }; };
        const phXf = (sp) => { const ph = first(sp, 'p:ph'); if (!ph || !layDoc) return null; const idx = ph.getAttribute('idx'), ty = ph.getAttribute('type'); const cand = Array.from(layDoc.getElementsByTagName('p:sp')).find(s => { const p2 = first(s, 'p:ph'); return p2 && ((idx && p2.getAttribute('idx') === idx) || (!idx && ty && p2.getAttribute('type') === ty)); }); return cand ? xfOf(cand) : null; };
        const place = (xf) => ({ x: Math.round(ox + xf.x * k), y: Math.round(oy + xf.y * k), w: Math.max(24, Math.round(xf.w * k)), h: Math.max(24, Math.round(xf.h * k)), rot: Math.round(xf.rot || 0) });
        const tree = first(xml, 'p:spTree'); const all = [];
        const walk = (n) => { Array.from(n.children).forEach(c => { if (c.nodeName === 'p:sp' || c.nodeName === 'p:pic' || c.nodeName === 'p:graphicFrame' || c.nodeName === 'p:cxnSp') all.push(c); else if (c.nodeName === 'p:grpSp') walk(c); }); };
        if (tree) walk(tree);
        for (const n of all) {
            if (n.nodeName === 'p:pic') {
                const xf = xfOf(n), emb = first(n, 'a:blip'), rid = emb && emb.getAttribute('r:embed'), rel = rid && srels[rid]; if (!xf || !rel) continue;
                const data = await get(rel.target), ext = (rel.target.split('.').pop() || '').toLowerCase(), type = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }[ext];
                if (!data || !type) continue;
                try { const r = await fileToImageId(new Blob([data], { type }), 1920); objs.push(Object.assign({ id: uid('o'), t: 'image', src: r.id, rot: 0, op: 1, fit: 'cover', rad: 0, shadow: false }, place(xf))); } catch (e) { /* skip unreadable picture */ }
                continue;
            }
            if (n.nodeName === 'p:cxnSp') { const xf = xfOf(n); if (!xf) continue; const ln = first(n, 'a:ln'); const col = colorOf(ln && kids(ln, 'a:solidFill')[0]) || defCol; const pl = place(xf); objs.push(SHP('line', pl.x, pl.y, Math.max(pl.w, 8), Math.max(pl.h, 2), { fill: '', stroke: col, sw: 6 })); continue; }
            const xf = xfOf(n) || (n.nodeName === 'p:sp' ? phXf(n) : null);
            const paras = Array.from(n.getElementsByTagName('a:p'));
            const lines = paras.map(p => Array.from(p.getElementsByTagName('a:t')).map(t => t.textContent).join('')); const txt = lines.join('\n').replace(/\n+$/, '');
            const spPr = first(n, 'p:spPr'), fill = spPr ? colorOf(kids(spPr, 'a:solidFill')[0]) : '';
            const prst = spPr && first(spPr, 'a:prstGeom') ? first(spPr, 'a:prstGeom').getAttribute('prst') : '';
            const pos = xf ? place(xf) : (first(n, 'p:ph') && /title/i.test(first(n, 'p:ph').getAttribute('type') || '') ? { x: 120, y: 90, w: 1680, h: 220, rot: 0 } : { x: 160, y: 340, w: 1600, h: 600, rot: 0 });
            if (fill && n.nodeName === 'p:sp' && xf) { const map = { ellipse: 'circle', roundRect: 'round', triangle: 'tri', diamond: 'diamond', star5: 'star', rightArrow: 'arrow', heart: 'heart' }; objs.push(SHP(map[prst] || 'rect', pos.x, pos.y, pos.w, pos.h, { fill, rot: pos.rot })); }
            if (n.nodeName === 'p:graphicFrame' && first(n, 'a:tbl')) { const rows = Array.from(n.getElementsByTagName('a:tr')).map(tr => Array.from(tr.getElementsByTagName('a:tc')).map(tc => Array.from(tc.getElementsByTagName('a:t')).map(t => t.textContent).join('')).join('   ·   ')); objs.push(TXT(pos.x, pos.y, pos.w, pos.h, rows.join('\n'), { size: 44, color: defCol, al: 'left', va: 'top', fit: true })); continue; }
            if (!txt.trim()) continue;
            const rPr = first(n, 'a:rPr') || first(n, 'a:endParaRPr') || first(n, 'a:defRPr'), pPr = first(n, 'a:pPr');
            const szv = rPr && rPr.getAttribute('sz') ? +rPr.getAttribute('sz') / 100 : (first(n, 'p:ph') && /title/i.test(first(n, 'p:ph').getAttribute('type') || '') ? 40 : 24);
            const col = (rPr && colorOf(rPr)) || defCol, algn = pPr && pPr.getAttribute('algn'), bodyPr = first(n, 'a:bodyPr'), anchor = bodyPr && bodyPr.getAttribute('anchor');
            const fnt = rPr && first(rPr, 'a:latin') ? first(rPr, 'a:latin').getAttribute('typeface') : '';
            objs.push(TXT(pos.x, pos.y, pos.w, pos.h, txt, { size: clamp(Math.round(szv * EMU * k), 18, 400), bold: !!(rPr && rPr.getAttribute('b') === '1'), italic: !!(rPr && rPr.getAttribute('i') === '1'), color: col, al: algn === 'ctr' ? 'center' : (algn === 'r' ? 'right' : 'left'), va: anchor === 'ctr' ? 'middle' : (anchor === 'b' ? 'bottom' : 'top'), fit: true, rot: pos.rot,
                font: /georgia|times|serif|cambria|garamond/i.test(fnt) ? 'Georgia' : (/arial|calibri|helvetica|verdana|segoe/i.test(fnt) ? 'Arial' : 'Montserrat'), lh: 1.15 }));
        }
        deckSlides.push(newSlide({ kind: 'solid', c1: bgc, dim: 0 }, objs));
    }
    if (!deckSlides.length) throw new Error('No slides could be read from that file.');
    const d = newDeck(file.name.replace(/\.pptx$/i, ''), deckSlides); d.theme = 'minimal'; return d;
}

// ---------- settings ----------
function modal(html) { $('#ebsMbox').innerHTML = html; $('#ebsModal').classList.add('show'); }
function closeModal() { $('#ebsModal').classList.remove('show'); }
function openSettings(focus) {
    const P = S.prefs, L = P.layout, names = ['Left side', 'Under the slide', 'Right side'];
    const opts = (cur) => Object.entries(PANELS).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${v}</option>`).join('');
    modal(`<h3>Slide Studio settings</h3>
<div class="ebs-sec" id="stLayout"><h4>Panel layout</h4><div class="ebs-note">Choose which panel sits where. If you pick a panel that is already used, the two swap places (same as Workspace Panels on the main screen).</div>
<div class="ebs-3">${names.map((n, i) => `<label>${n}<select data-slot="${i}">${opts(L[i])}</select></label>`).join('')}</div><div class="ebs-row"><button class="ebs-btn" id="stReset">Reset layout</button></div></div>
<div class="ebs-sec"><h4>Slideshow</h4><div class="ebs-row"><label class="ebs-row" style="gap:6px"><input type="checkbox" id="stAuto"${P.auto ? ' checked' : ''}> Auto-advance</label><label class="ebs-row" style="gap:6px">every <input type="number" id="stSecs" min="1" max="600" value="${P.secs}" style="width:70px"> seconds</label><label class="ebs-row" style="gap:6px"><input type="checkbox" id="stLoop"${P.loop ? ' checked' : ''}> Loop back to the start</label></div>
<label>Transition (same list as the main screen)<select id="stTrans">${TRANSITIONS.map(t => `<option value="${t[0]}"${P.transition === t[0] ? ' selected' : ''}>${t[1]}</option>`).join('')}</select></label>
</div>
<div class="ebs-sec"><h4>Editor</h4><label class="ebs-row" style="gap:6px"><input type="checkbox" id="stSnap"${P.snap ? ' checked' : ''}> Snap to the centre while dragging</label><label class="ebs-row" style="gap:6px"><input type="checkbox" id="stSafe"${P.safe ? ' checked' : ''}> Show the safe-margin guide on the slide</label></div>
<div class="ebs-sec" id="stAi"><h4>AI slide maker</h4><div class="ebs-note">Use your own free or paid key. It is kept only in this browser and sent only to the AI company you choose.</div>
<div class="ebs-row"><label class="f1">Service<select id="stProv"><option value="gemini"${P.ai.provider === 'gemini' ? ' selected' : ''}>Google Gemini (aistudio.google.com/apikey)</option><option value="claude"${P.ai.provider === 'claude' ? ' selected' : ''}>Claude (console.anthropic.com)</option></select></label></div>
<label>Key<input type="password" id="stKey" value="${esc(P.ai.key)}" placeholder="Paste your key" autocomplete="off"></label><label>Model (optional)<input type="text" id="stModel" value="${esc(P.ai.model)}" placeholder="Leave empty for the default"></label></div>
<div class="ebs-sec"><h4>Saving</h4><div class="ebs-note">Everything saves by itself in this browser, and is also included whenever you save your profile on the main screen.</div><div class="ebs-note" id="stStore"></div>
<div class="ebs-row"><button class="ebs-btn" id="stPersist">Ask the browser to keep my slides safe</button><button class="ebs-btn" id="stBackup">Save all decks to a file</button><button class="ebs-btn" id="stRestore">Load decks from a file</button></div></div>
<div class="ebs-row"><span class="ebs-grow"></span><button class="ebs-btn pri" id="stDone">Done</button></div>`);
    const m = $('#ebsMbox');
    m.querySelectorAll('[data-slot]').forEach(sel => sel.onchange = () => { setSlot(+sel.dataset.slot, sel.value); openSettings(); });
    $('#stReset').onclick = () => { S.prefs.layout = PREF_DEFAULTS.layout.slice(); savePrefs(); applyLayout(); openSettings(); };
    const pf = (id, fn) => { $('#' + id).onchange = (e) => { fn(e.target); savePrefs(); syncTimerUI(); drawSel(); if (S.run) schedule(); }; };
    pf('stAuto', t => { S.prefs.auto = t.checked; }); pf('stSecs', t => { S.prefs.secs = clamp(parseInt(t.value, 10) || 10, 1, 600); }); pf('stLoop', t => { S.prefs.loop = t.checked; }); pf('stTrans', t => { S.prefs.transition = t.value; });
    pf('stSnap', t => { S.prefs.snap = t.checked; }); pf('stSafe', t => { S.prefs.safe = t.checked; });
    pf('stProv', t => { S.prefs.ai.provider = t.value; }); $('#stKey').onchange = (e) => { S.prefs.ai.key = e.target.value.trim(); savePrefs(); updateAiNote(); }; $('#stModel').onchange = (e) => { S.prefs.ai.model = e.target.value.trim(); savePrefs(); };
    $('#stDone').onclick = closeModal;
    $('#stBackup').onclick = () => { download('EBP-slide-decks-' + new Date().toISOString().slice(0, 10) + '.ebpdeck', JSON.stringify({ generator: 'EBP SLIDE STUDIO', v: 1, decks: S.decks.filter(d => !d.draft).map(d => Object.assign(clone(d), { imgs: deckImgs(d) })) })); };
    $('#stRestore').onclick = () => $('#dkPick').click();
    $('#stPersist').onclick = async () => { try { const ok = navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; toast(ok ? 'The browser will keep your slides.' : 'The browser did not agree. Your slides are still saved; keep a backup file too.', !ok); } catch (e) { toast('Not supported in this browser.', true); } };
    try { if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { const n = $('#stStore'); if (n) n.textContent = 'Using about ' + (e.usage / 1048576).toFixed(1) + ' MB of this browser\'s storage.'; }); } catch (e) { /* ignore */ }
    if (focus === 'ai') { const n = $('#stAi'); if (n) n.scrollIntoView({ block: 'center' }); const k = $('#stKey'); if (k) k.focus(); }
}
function updateAiNote() { const n = $('#aiNote'); if (n && !n.textContent) n.textContent = S.prefs.ai.key ? '' : 'Add your key in Settings → AI to use this.'; }

// ---------- wiring ----------
function bindStatic() {
    const on = (sel, ev, fn) => { const n = typeof sel === 'string' ? $(sel) : sel; if (n) n.addEventListener(ev, fn); };
    on('#ebsFreeze', 'click', () => { const b = document.getElementById('freezeLiveBtn'); if (b) b.click(); syncFreeze(); });
    (function () { const b = document.getElementById('freezeLiveBtn'); if (b && window.MutationObserver) new MutationObserver(syncFreeze).observe(b, { attributes: true, childList: true, subtree: true, characterData: true }); syncFreeze(); })();
    on('#ebsClose', 'click', closeStudio); on('#ebsUndo', 'click', () => undoRedo(S.undo, S.redo)); on('#ebsRedo', 'click', () => undoRedo(S.redo, S.undo));
    on('#ebsSettingsBtn', 'click', () => openSettings()); on('#ebsKeysBtn', 'click', (e) => { e.stopPropagation(); toggleKeys(); });
    on('#ebsModal', 'pointerdown', (e) => { if (e.target.id === 'ebsModal') closeModal(); });
    on('#ebsDeckName', 'input', (e) => { const d = curDeck(); if (d) { commitDraft(d); d.name = e.target.value.slice(0, 80); S.dirty.add(d.id); schedSave(); } });
    on('#ebsDeckName', 'change', () => renderDecks());
    // toolbar
    on('#tbText', 'click', addText); on('#tbImage', 'click', () => $('#ebsImgPick').click());
    document.querySelectorAll('#ebsRow1 [data-pop]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); showPop(b.dataset.pop, b); }));
    on('#ebsImgPick', 'change', (e) => { addImageFile(e.target.files[0]); e.target.value = ''; }); on('#ebsBgPick', 'change', (e) => { setBgImage(e.target.files[0]); e.target.value = ''; });
    on('#tbDupSlide', 'click', () => { const d = curDeck(), s = curSlide(); if (!d || !s) return; snap(); const c = cloneSlide(s); d.slides.splice(S.idx + 1, 0, c); S.idx++; S.sel = null; touch(c); refreshAll(); });
    on('#tbDelSlide', 'click', () => delSlides());
    document.addEventListener('pointerdown', (e) => { if (!S.open) return; if (!e.target.closest('#ebsKeys') && !e.target.closest('#ebsKeysBtn')) $('#ebsKeys').classList.remove('show'); if (!e.target.closest('.ebs-pop') && !e.target.closest('[data-pop]')) hidePops(); if (!e.target.closest('#ebsMenu') && !e.target.closest('.more')) hideMenu(); });
    bindStage(); bindFilm();
    // decks panel
    on('#dkNew', 'click', newBlankDeck); on('#dkImport', 'click', (e) => { e.stopPropagation(); showMenu(e.currentTarget, [{ t: 'Pictures, PDF, PowerPoint or a deck file…', f: () => $('#dkPick').click() }, { t: 'Pictures from my saved media…', f: openMediaImport }]); });
    on('#dkPick', 'change', (e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; importFiles(fs); });
    on('#dkSearch', 'input', (e) => { S.q = e.target.value; renderDecks(); });
    on('#dkChips', 'click', (e) => { const b = e.target.closest('.ebs-chip'); if (!b) return; S.filter = b.dataset.f; document.querySelectorAll('#dkChips .ebs-chip').forEach(x => x.classList.toggle('on', x === b)); renderDecks(); });
    on('#dkGrid', 'click', (e) => {
        const more = e.target.closest('[data-more]'); if (more) { e.stopPropagation(); deckMenu(more, more.dataset.more); return; }
        const n = e.target.closest('.ebs-deck'); if (!n) return;
        if (n.dataset.k === 'deck') {
            if (e.ctrlKey || e.metaKey || e.shiftKey) { const id = n.dataset.id; if (S.deckSel.has(id)) S.deckSel.delete(id); else S.deckSel.add(id); renderDecks(); return; }
            if (S.deckSel.size) { S.deckSel.clear(); renderDecks(); }
            openDeck(n.dataset.id);
        } else useTemplate(n.dataset.id);
    });
    on('#dkBulk', 'click', (e) => { const b = e.target.closest('[data-bk]'); if (!b) return; const ids = Array.from(S.deckSel), list = S.decks.filter(x => ids.includes(x.id) && !x.draft);
        if (b.dataset.bk === 'clear') { S.deckSel.clear(); renderDecks(); }
        else if (b.dataset.bk === 'export') exportDecks(list, list.length > 1 ? 'EBP-selected-decks' : list[0].name);
        else if (b.dataset.bk === 'dup') { list.forEach(x => { const c2 = cloneDeck(x, x.name + ' copy'); S.decks.push(c2); S.dirty.add(c2.id); }); S.deckSel.clear(); schedSave(); renderDecks(); toast(list.length + ' deck' + (list.length > 1 ? 's' : '') + ' duplicated.'); }
        else if (b.dataset.bk === 'del') deleteDecks(ids);
    });
    on('#dkGrid', 'keydown', (e) => { if (e.key === 'Enter') { const n = e.target.closest('.ebs-deck'); if (n) n.click(); } });
    on('#ebsMenu', 'click', (e) => { const b = e.target.closest('button'); if (!b) return; const it = $('#ebsMenu')._items[+b.dataset.i]; hideMenu(); if (it) it.f(); });
    // scripture + AI
    $('#scrVer').textContent = '· ' + verLabel();
    on('#scrIn', 'input', onScrInput); on('#scrIn', 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(scrTimer); loadScripture(); } });
    on('#scrOut', 'click', onVerseClick); on('#scrAll', 'click', () => { if (S.scr) { S.scr.vs.forEach(v => S.scr.sel.add(v.n)); scrSync(); } });
    on('#scrAdd', 'click', addScriptureToSlide); on('#scrNew', 'click', newScriptureSlides);
    $('#aiTheme').innerHTML = '<option value="auto">Look: Welcome Home</option>' + Object.entries(THEMES).map(([k, t]) => `<option value="${k}">${esc(t.name)}</option>`).join('');
    on('#aiGo', 'click', runAi); updateAiNote();
    // live + cue
    on('#lvClear', 'click', clearScreen); on('#cuPrev', 'click', () => nextSlide(-1)); on('#cuNext', 'click', () => nextSlide(1));
    on('#cuClear', 'click', () => { S.cue.length = 0; saveCue(); if (S.run && S.run.kind === 'cue') stopRun(false); renderCue(); });
    on('#cuList', 'click', (e) => { const rm = e.target.closest('[data-rm]'); if (rm) { e.stopPropagation(); S.cue.splice(+rm.dataset.rm, 1); saveCue(); if (S.run && S.run.kind === 'cue') S.run.i = Math.min(S.run.i, S.cue.length - 1); renderCue(); return; } const row = e.target.closest('.ebs-cuerow'); if (row) startCue(+row.dataset.i); });
    on('#cuPause', 'click', togglePause);
    on('#tmAuto', 'change', (e) => { S.prefs.auto = e.target.checked; if (!S.prefs.auto) { S.paused = false; } savePrefs(); syncTimerUI(); schedule(); });
    on('#tmSecs', 'change', (e) => { S.prefs.secs = clamp(parseInt(e.target.value, 10) || 10, 1, 600); savePrefs(); syncTimerUI(); if (S.run) schedule(); });
    on('#tmLoop', 'change', (e) => { S.prefs.loop = e.target.checked; savePrefs(); if (S.run) schedule(); });
    on('#tmTrans', 'change', (e) => { S.prefs.transition = e.target.value; savePrefs(); });
    on('#tmTransMs', 'change', (e) => { const m = document.getElementById('displayTransitionMs'); if (m) { m.value = e.target.value; m.dispatchEvent(new Event('change')); } });
    on('#snLive', 'click', sendEditing);
    // keyboard (stops the main screen's shortcuts from firing while the studio is open)
    ['keydown', 'keyup', 'keypress'].forEach(ev => el.root.addEventListener(ev, (e) => { e.stopPropagation(); if (ev === 'keydown') onKey(e); }));
    el.root.tabIndex = -1;
    ['keydown', 'keyup', 'keypress'].forEach(ev => window.addEventListener(ev, (e) => { if (!S.open || el.root.contains(e.target)) return; e.stopPropagation(); if (ev === 'keydown') onKey(e); }, true));
}
function delSlides() { // deletes the highlighted slides (Ctrl/Shift + click to pick several), or just the one you are on
    const d = curDeck(); if (!d) return; finishEdit();
    let ids = S.hi.size ? d.slides.filter(s => S.hi.has(s.id)).map(s => s.id) : [d.slides[S.idx].id];
    if (ids.length >= d.slides.length) { ids = ids.filter(id => id !== d.slides[0].id); toast('A deck needs at least one slide, so the first one was kept.'); }
    if (!ids.length) return; snap(); d.slides = d.slides.filter(s => !ids.includes(s.id)); S.hi.clear(); S.idx = Math.min(S.idx, d.slides.length - 1); S.sel = null;
    touch(); refreshAll(); toast(ids.length + ' slide' + (ids.length > 1 ? 's' : '') + ' deleted. Ctrl+Z brings them back.');
}
const SHORTCUTS = [
    ['Editing', [['Ctrl + Z', 'Undo'], ['Ctrl + Y  or  Ctrl + Shift + Z', 'Redo'], ['Ctrl + C', 'Copy the selected items'], ['Ctrl + X', 'Cut the selected items'], ['Ctrl + V', 'Paste (also pastes a picture or text from outside)'], ['Ctrl + D', 'Duplicate the selected items'], ['Ctrl + A', 'Select every item on the slide'], ['Delete', 'Delete the selected items (or the highlighted slides)'], ['Arrow keys', 'Nudge the selected item 1 step (hold Shift for 10)'], ['Enter', 'Start typing in the selected text'], ['Esc', 'Deselect / close a box'], ['Ctrl + S', 'Save now']]],
    ['Grouping and layers', [['Ctrl + G', 'Group the selected items'], ['Ctrl + Shift + G', 'Ungroup'], ['Ctrl + ]', 'Bring forward one layer'], ['Ctrl + [', 'Send back one layer'], ['Ctrl + Shift + ]', 'Bring to the very front'], ['Ctrl + Shift + [', 'Send to the very back']]],
    ['Text', [['Ctrl + B', 'Bold'], ['Ctrl + I', 'Italic'], ['Ctrl + L', 'Align text left'], ['Ctrl + E', 'Align text centre'], ['Ctrl + R', 'Align text right'], ['Ctrl + Shift + >', 'Bigger text'], ['Ctrl + Shift + <', 'Smaller text']]],
    ['Slides', [['Ctrl + M', 'New blank slide'], ['Ctrl + Shift + D', 'Duplicate this slide'], ['Ctrl + ← / →', 'Go to the previous / next slide'], ['Ctrl + Shift + ← / →', 'Move this slide earlier / later'], ['Ctrl + click a slide', 'Highlight several slides (Shift + click for a range)']]],
    ['Presenting', [['Ctrl + Enter', 'Send this slide to the main screen'], ['Page Down / Page Up', 'Next / previous live slide'], ['P', 'Pause or resume auto-advance'], ['Ctrl + K', 'Add the slide (or highlighted slides) to the cue list'], ['Ctrl + .', 'Clear the screen'], ['Ctrl + F', 'Jump to the scripture box'], ['Ctrl + /', 'Show this list']]]
];
function renderKeys() {
    $('#ebsKeys').innerHTML = '<div class="ebs-row" style="justify-content:space-between"><b>Keyboard shortcuts</b><button class="ebs-btn ghost" id="ebsKeysClose">Close</button></div><div class="ebs-note">On a Mac use the ⌘ key instead of Ctrl. They work while the studio is open and you are not typing in a box.</div>' + SHORTCUTS.map(g => `<h4>${g[0]}</h4>` + g[1].map(k => `<div class="ebs-krow"><span>${esc(k[1])}</span><kbd>${esc(k[0])}</kbd></div>`).join('')).join('');
    $('#ebsKeysClose').onclick = () => $('#ebsKeys').classList.remove('show');
}
function toggleKeys() { const k = $('#ebsKeys'); if (!k.classList.contains('show')) renderKeys(); k.classList.toggle('show'); }
const isTyping = (t) => !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
function onKey(e) {
    const typing = isTyping(e.target), mod = e.ctrlKey || e.metaKey, k = e.key, code = e.code, kl = k.length === 1 ? k.toLowerCase() : k;
    if (k === 'Escape') { if ($('#ebsKeys').classList.contains('show')) $('#ebsKeys').classList.remove('show'); else if ($('#ebsModal').classList.contains('show')) closeModal(); else if (editing) finishEdit(); else if ($('.ebs-pop.show')) hidePops(); else if (S.deckSel.size) { S.deckSel.clear(); renderDecks(); } else if (S.sel) { setSel([]); drawSel(); renderRow2(); } return; }
    if (mod && kl === 's') { e.preventDefault(); flush(); toast('Saved.'); return; }
    if (mod && k === '/') { e.preventDefault(); toggleKeys(); return; }
    if (typing) return;
    if (mod && !e.altKey) {
        const sh = e.shiftKey;
        if (kl === 'z') { e.preventDefault(); undoRedo(sh ? S.redo : S.undo, sh ? S.undo : S.redo); return; }
        if (kl === 'y') { e.preventDefault(); undoRedo(S.redo, S.undo); return; }
        if (kl === 'd') { e.preventDefault(); if (sh) $('#tbDupSlide').click(); else dupObj(); return; }
        if (kl === 'a') { e.preventDefault(); const s = curSlide(); if (s) { setSel(s.objs.filter(o => !o.hidden && !o.locked).map(o => o.id)); drawSel(); renderRow2(); } return; }
        if (kl === 'g') { e.preventDefault(); if (sh) ungroupSel(); else groupSel(); return; }
        if (code === 'BracketRight') { e.preventDefault(); reorder(sh ? 'front' : 'up'); return; }
        if (code === 'BracketLeft') { e.preventDefault(); reorder(sh ? 'back' : 'down'); return; }
        if (kl === 'b') { e.preventDefault(); const on = !(selObjs().find(o => o.t === 'text') || {}).bold; textTweak(o => { o.bold = on; }); return; }
        if (kl === 'i') { e.preventDefault(); const on = !(selObjs().find(o => o.t === 'text') || {}).italic; textTweak(o => { o.italic = on; }); return; }
        if (kl === 'l') { e.preventDefault(); textTweak(o => { o.al = 'left'; }); return; }
        if (kl === 'e') { e.preventDefault(); textTweak(o => { o.al = 'center'; }); return; }
        if (kl === 'r') { e.preventDefault(); textTweak(o => { o.al = 'right'; }); return; }
        if (sh && (code === 'Period' || k === '>')) { e.preventDefault(); textTweak(o => { o.size = clamp(Math.round((o.size || 60) * 1.1) + 1, 10, 600); }); return; }
        if (sh && (code === 'Comma' || k === '<')) { e.preventDefault(); textTweak(o => { o.size = clamp(Math.round((o.size || 60) / 1.1) - 1, 10, 600); }); return; }
        if (k === 'Enter') { e.preventDefault(); sendEditing(); return; }
        if (kl === 'm') { e.preventDefault(); addSlide('blank'); return; }
        if (kl === 'k') { e.preventDefault(); const f = $('#fsCue'); if (f) f.click(); return; }
        if (kl === 'f') { e.preventDefault(); const f = $('#scrIn'); if (f) { f.focus(); f.select(); } return; }
        if (k === '.') { e.preventDefault(); clearScreen(); return; }
        if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); const d = curDeck(); if (!d) return; const dir = k === 'ArrowLeft' ? -1 : 1; if (sh) { const to = S.idx + dir; if (to >= 0 && to < d.slides.length) moveSlide(S.idx, to); } else selectSlide(S.idx + dir); return; }
        return;
    }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); if (selObjs().length) delObj(); else delSlides(); return; }
    if (kl === 'p' && !e.altKey) { togglePause(); return; }
    if (k === 'Enter') { const o = curObj(); if (o && o.t === 'text') { e.preventDefault(); startEdit(o); } return; }
    if (k.startsWith('Arrow')) {
        const l = selObjs(), step = e.shiftKey ? 10 : 1;
        if (l.length) { e.preventDefault(); snap(); mutate(() => { l.forEach(o => { if (k === 'ArrowLeft') o.x -= step; if (k === 'ArrowRight') o.x += step; if (k === 'ArrowUp') o.y -= step; if (k === 'ArrowDown') o.y += step; }); }, true); return; }
        e.preventDefault(); if (k === 'ArrowLeft' || k === 'ArrowUp') selectSlide(S.idx - 1); else selectSlide(S.idx + 1);
        return;
    }
    if (k === 'PageDown') { e.preventDefault(); nextSlide(1); } else if (k === 'PageUp') { e.preventDefault(); nextSlide(-1); }
}
// copy / cut / paste go through the browser's own clipboard so a picture or text copied elsewhere can be pasted in too
document.addEventListener('copy', (e) => { if (!S.open || isTyping(e.target)) return; const l = copySel(); if (!l) return; e.clipboardData.setData('application/x-ebp-objs', JSON.stringify(l)); e.clipboardData.setData('text/plain', '[Slide items]'); e.preventDefault(); toast('Copied.'); });
document.addEventListener('cut', (e) => { if (!S.open || isTyping(e.target)) return; const l = copySel(); if (!l) return; e.clipboardData.setData('application/x-ebp-objs', JSON.stringify(l)); e.clipboardData.setData('text/plain', '[Slide items]'); e.preventDefault(); delObj(); toast('Cut.'); });
document.addEventListener('paste', (e) => {
    if (!S.open || isTyping(e.target) || !curSlide()) return; const cd = e.clipboardData; if (!cd) return;
    const json = cd.getData('application/x-ebp-objs'), txt = cd.getData('text/plain');
    const img = Array.from(cd.files || []).find(f => /^image\//.test(f.type));
    e.preventDefault();
    if (json) { try { pasteObjs(JSON.parse(json)); } catch (x) { /* ignore */ } }
    else if (img) addImageFile(img);
    else if (txt === '[Slide items]' && S.clip) pasteObjs(S.clip);
    else if (txt && txt.trim()) { const s = curSlide(); addObj(TXT(460, 400, 1000, 280, txt.trim().slice(0, 1200), { size: 64, bold: true, color: textColorForBg(s), fit: true })); }
});

// the studio must stop when the operator takes the screen over with something else
(function hookExternal() {
    const wrap = (name) => { const nat = window[name]; if (typeof nat !== 'function' || nat._ebs) return; const w = function () { if (!S.selfSend && S.run) stopRun(true); else if (!S.selfSend && S.live && S.live.on) { S.live.on = false; refreshLive(); refreshFilm(); } return nat.apply(this, arguments); }; w._ebs = true; try { window[name] = w; } catch (e) { /* ignore */ } };
    wrap('slidesNoteExternalChange'); wrap('slidesGo');
})();

// ---------- open / close ----------
function openStudio() {
    buildUI(); S.open = true; el.root.classList.add('open');
    if (!S.deckId || !curDeck()) { const last = lsGet('ebpStudioLastDeck', null); if (last && S.decks.find(d => d.id === last)) S.deckId = last; else if (S.decks.length) S.deckId = S.decks[0].id; else { const d = newDeck('My first deck', [layoutSlide('welcome', 'title', { kicker: 'Your message', title: 'Click to edit', sub: 'Double-click any text to change it' })]); d.theme = 'welcome'; S.decks.push(d); S.dirty.add(d.id); S.deckId = d.id; schedSave(); } }
    $('#scrVer').textContent = '· ' + verLabel();
    refreshAll(); el.root.focus();
    setTimeout(() => { fitStage(); drawStage(); }, 60);
}
function syncFreeze() {
    const f = document.getElementById('ebsFreeze'); if (!f) return;
    let on = false; try { on = typeof isLiveFrozen !== 'undefined' && !!isLiveFrozen; } catch (e) {}
    f.textContent = on ? '🔒 FROZEN — click to unfreeze' : '❄ Freeze'; f.classList.toggle('fz', on);
}
function closeStudio() { finishEdit(); hidePops(); hideMenu(); closeModal(); S.open = false; if (el.root) el.root.classList.remove('open'); flush(); }

// ---------- profile hooks (called from the main screen's Save / Load profile) ----------
window.ebpStudioExport = function () {
    try { const prefs = clone(S.prefs); prefs.ai = { provider: prefs.ai.provider, key: '', model: prefs.ai.model }; return { v: 1, decks: S.decks.filter(d => !d.draft).map(d => Object.assign(clone(d), { imgs: deckImgs(d) })), cue: S.cue, prefs }; } catch (e) { return undefined; }
};
window.ebpStudioImport = function (data) {
    try {
        if (!data || !Array.isArray(data.decks)) return;
        data.decks.forEach(r => {
            if (!r || !Array.isArray(r.slides)) return;
            Object.entries(r.imgs || {}).forEach(([k, v]) => { if (typeof v === 'string' && v.startsWith('data:image/')) IMG.set(k, v); });
            const have = S.decks.findIndex(d => d.id === r.id);
            if (have >= 0) { if ((r.updated || 0) <= (S.decks[have].updated || 0)) return; S.decks[have] = r; } else S.decks.push(r);
            r.slides.forEach(s => { s.v = (s.v || 0) + 1; }); S.dirty.add(r.id);
        });
        if (Array.isArray(data.cue)) { S.cue = data.cue; saveCue(); }
        if (data.prefs) { const p = data.prefs; ['layout', 'transition', 'auto', 'secs', 'loop', 'fit', 'safe', 'snap'].forEach(k => { if (p[k] != null) S.prefs[k] = p[k]; }); if (p.ai && !S.prefs.ai.key) S.prefs.ai.provider = p.ai.provider || S.prefs.ai.provider; savePrefs(); }
        flush(); if (el.root) { applyLayout(); if (S.open) refreshAll(); }
    } catch (e) { console.warn('Slide Studio import failed', e); }
};

// ---------- start ----------
async function boot() {
    const btn = document.getElementById('ebpSlideStudioBtn'); if (btn) btn.addEventListener('click', openStudio);
    try {
        const stored = await dbAll();
        stored.forEach(d => { Object.entries(d.imgs || {}).forEach(([k, v]) => IMG.set(k, v)); });
        S.decks = stored.filter(d => d && Array.isArray(d.slides) && d.slides.length);
    } catch (e) {
        const fb = lsGet('ebpStudioFallback', []); if (Array.isArray(fb)) { fb.forEach(d => Object.entries(d.imgs || {}).forEach(([k, v]) => IMG.set(k, v))); S.decks = fb; }
    }
    S.ready = true; window.addEventListener('beforeunload', () => { if (S.dirty.size) flush(); });
    window.ebpStudio = { open: openStudio, state: S };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
