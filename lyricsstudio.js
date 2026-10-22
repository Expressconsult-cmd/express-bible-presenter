/* Express Bible Presenter — Lyrics Studio. Separate module: edit songs on a live-looking scene, split them into slide cards, click a card to project it. */
(function () {
'use strict';
if (/[?&]mode=obs\b/.test(location.search)) return;

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const uid = (p) => (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } };

// ---------- defaults ----------
const FONT_DEFAULT = "Georgia, 'Times New Roman', Times, serif";
const STYLE_DEF = { layout: 'mode-center', transparent: false, font: FONT_DEFAULT, size: 'large', bold: false, italic: false, color: '#ffffff',
    shadow: '0 4px 12px rgba(0,0,0,0.98)', bgColor: '#0b3a66', bgPreset: '', bgImg: '', dim: 0, ltPos: 'bottom', panel: false, ltTpl: 'none', nx: 0, ny: 0, refPos: 'below-center' };
const PREF_DEF = { swap: false, lines: '2', ref: 'title', auto: false, secs: 8, loop: true, defStyle: null };
const SEC_BTNS = ['Verse', 'Chorus', 'Bridge'];
const HEADER_RE = /^\[(.+?)\]:?$|^((?:verse|chorus|bridge|pre-?chorus|tag|intro|outro|ending|refrain|interlude|coda)\s*\d*)\s*:?$/i;
const SWATCH = ['#0b3a66', '#000000', '#1f2937', '#065f46', '#7c2d12', '#4c1d95', '#7f1d1d', '#ffffff'];
const SHORTCUTS = [
    ['← / →  or  PgUp / PgDn', 'Previous / next slide, straight to the screen'], ['1 … 9', 'Show slide number 1–9'], ['Enter  or  F2', 'Edit the text on the scene'],
    ['Esc', 'Stop editing / close a menu'], ['B', 'Blank the screen (press again to bring the slide back)'], ['Ctrl + Z / Ctrl + Y', 'Undo / redo'],
    ['Ctrl + D', 'Duplicate the selected slides'], ['Delete', 'Delete the selected slides'], ['Ctrl + A', 'Select every slide'], ['Ctrl + click a slide', 'Select several; then drag to reorder'],
    ['Ctrl + drag on the scene', 'Move the text (or turn on the ✥ button to drag without Ctrl)'], ['Ctrl + arrow keys', 'Nudge the text (Shift = bigger steps)'], ['Ctrl + 0', 'Put the text back in its place'],
    ['Ctrl + N', 'New song'], ['Ctrl + F', 'Search songs'], ['Ctrl + Enter', 'Send the current slide live']
];

// ---------- state ----------
const S = { open: false, songId: null, idx: 0, live: -1, sel: new Set(), songSel: new Set(), undo: [], redo: [], q: '', editing: false, blank: false,
    run: null, paused: false, saveT: null, dirty: false, dragIds: null, setlist: lsGet('ebpLyricsSetlist', { items: [] }), prefs: Object.assign(clone(PREF_DEF), lsGet('ebpLyricsPrefs', {})) };
if (!Array.isArray(S.setlist.items)) S.setlist = { items: [] };
const savePrefs = () => lsSet('ebpLyricsPrefs', S.prefs);
const saveSetlist = () => lsSet('ebpLyricsSetlist', S.setlist);
const lib = () => (typeof savedSongsLibrary !== 'undefined' && Array.isArray(savedSongsLibrary)) ? savedSongsLibrary : [];
const curSong = () => lib().find(s => s.id === S.songId) || null;
const curSlide = () => { const s = curSong(); return s && s.slides ? s.slides[S.idx] || null : null; };
const defStyle = () => Object.assign(clone(STYLE_DEF), S.prefs.defStyle || {});

// ---------- parsing / splitting ----------
function parseLyrics(raw) {  // -> groups [{sec, lines[]}]; blank line = new group; a header line labels the next group
    const groups = []; let cur = null, sec = '';
    String(raw || '').replace(/\r/g, '').split('\n').forEach(line => {
        const t = line.trim();
        if (!t) { cur = null; return; }
        const m = t.match(HEADER_RE);
        if (m) { sec = (m[1] || m[2]).trim(); cur = null; return; }
        if (!cur) { cur = { sec, lines: [] }; groups.push(cur); sec = ''; }
        cur.lines.push(t);
    });
    return groups;
}
function reflow(groups, mode) {  // mode '1' | '2' | '4' | 'all'
    const n = mode === 'all' ? 0 : (parseInt(mode, 10) || 2); const out = [];
    groups.forEach(g => {
        if (!n) { out.push({ id: uid('sl'), text: g.lines.join('\n'), sec: g.sec }); return; }
        for (let i = 0; i < g.lines.length; i += n) out.push({ id: uid('sl'), text: g.lines.slice(i, i + n).join('\n'), sec: i === 0 ? g.sec : '' });
    });
    return out;
}
function slidesToGroups(slides) { // consecutive unlabeled slides belong to the group of the slide before them
    const groups = []; let cur = null;
    slides.forEach(s => {
        if (!cur || s.sec) { cur = { sec: s.sec || '', lines: [] }; groups.push(cur); }
        String(s.text || '').split('\n').forEach(l => { if (l.trim()) cur.lines.push(l.trim()); });
    });
    return groups.filter(g => g.lines.length);
}
function slidesToLyrics(slides) { return slidesToGroups(slides).map(g => g.lines.join('\n')).join('\n\n'); }
function ensure(song) {
    if (!song) return song;
    if (!song.style) song.style = defStyle();
    song.style = Object.assign(clone(STYLE_DEF), song.style);
    if (song.style.transparent && song.style.layout !== 'mode-lowerthird') song.style.layout = 'mode-lowerthird'; // old "Transparent" is now a lower-third option
    if (!Array.isArray(song.slides) || song.lyricsStudio !== song.lyrics) {
        const mode = ['1', '2', '4'].includes(String(song.splitMode)) ? String(song.splitMode) : (song.splitMode === 'blank' ? 'all' : S.prefs.lines);
        song.slides = reflow(parseLyrics(song.lyrics), mode);
        if (!song.slides.length) song.slides = [{ id: uid('sl'), text: '', sec: '' }];
        song.lyricsStudio = song.lyrics;
    }
    return song;
}
const modeOf = (song) => (['1', '2', '4'].includes(String(song.splitMode)) ? String(song.splitMode) : (song.splitMode === 'blank' ? 'all' : S.prefs.lines));

// ---------- saving (songs live in the same library as the old Lyrics tab) ----------
const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function setSaved(t) { const e = $('#lsSaved'); if (e) e.textContent = t; }
function touch() { S.dirty = true; setSaved('Saving…'); clearTimeout(S.saveT); S.saveT = setTimeout(flush, 500); }
function flush() {
    clearTimeout(S.saveT); const song = curSong();
    if (song && S.dirty) {
        song.lyrics = slidesToLyrics(song.slides); song.lyricsStudio = song.lyrics; song.updated = Date.now();
        if (!['1', '2', '4', 'blank'].includes(String(song.splitMode))) song.splitMode = '2';
    }
    S.dirty = false;
    try { if (typeof persistSavedSongs === 'function') persistSavedSongs(); if (typeof refreshSavedSongsDropdown === 'function') refreshSavedSongsDropdown(); } catch (e) {}
    setSaved('Saved ' + timeNow());
}
function stripSlides(s) { return { slides: clone(s.slides), style: clone(s.style), title: s.title }; }
function snap() { const s = curSong(); if (!s) return; S.undo.push(JSON.stringify(stripSlides(s))); if (S.undo.length > 80) S.undo.shift(); S.redo = []; updUndo(); }
function restore(json) {
    const s = curSong(); if (!s) return; const o = JSON.parse(json); s.slides = o.slides; s.style = o.style; s.title = o.title;
    S.idx = clamp(S.idx, 0, s.slides.length - 1); S.sel = new Set(); touch(); refreshAll();
}
function undo() { const s = curSong(); if (!s || !S.undo.length) return; S.redo.push(JSON.stringify(stripSlides(s))); restore(S.undo.pop()); updUndo(); }
function redo() { const s = curSong(); if (!s || !S.redo.length) return; S.undo.push(JSON.stringify(stripSlides(s))); restore(S.redo.pop()); updUndo(); }
function updUndo() { const u = $('#lsUndo'), r = $('#lsRedo'); if (u) u.disabled = !S.undo.length; if (r) r.disabled = !S.redo.length; }

// ---------- background pictures (kept in their own IndexedDB so they survive a reload) ----------
let idb = null;
function openDb() {
    return new Promise((res, rej) => {
        if (idb) return res(idb); if (!window.indexedDB) return rej(new Error('no idb'));
        const q = indexedDB.open('ebpLyricsStudio', 1);
        q.onupgradeneeded = () => { q.result.createObjectStore('imgs', { keyPath: 'id' }); };
        q.onsuccess = () => { idb = q.result; res(idb); }; q.onerror = () => rej(q.error);
    });
}
async function imgPut(rec) { try { const d = await openDb(); d.transaction('imgs', 'readwrite').objectStore('imgs').put(rec); } catch (e) { /* ignore */ } }
async function imgAll() { try { const d = await openDb(); return await new Promise(r => { const q = d.transaction('imgs').objectStore('imgs').getAll(); q.onsuccess = () => r(q.result || []); q.onerror = () => r([]); }); } catch (e) { return []; } }
function registerAsset(rec) {
    if (typeof importedAssetsLibrary === 'undefined') return;
    if (!importedAssetsLibrary.find(a => a.id === rec.id)) { importedAssetsLibrary.push({ id: rec.id, name: rec.name, type: 'flier', dataUrl: rec.dataUrl }); try { repopulateAssetDropdownUI(); } catch (e) {} }
}
function shrinkImage(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onerror = () => rej(fr.error);
        fr.onload = () => {
            const im = new Image();
            im.onerror = () => rej(new Error('That file is not a picture the browser can open.'));
            im.onload = () => {
                const k = Math.min(1, 1920 / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
                c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.86));
            };
            im.src = fr.result;
        };
        fr.readAsDataURL(file);
    });
}
const assetUrl = (id) => { if (!id || typeof importedAssetsLibrary === 'undefined') return ''; const a = importedAssetsLibrary.find(x => x.id === id); return a ? a.dataUrl : ''; };

// ---------- the scene (drawn by the app's own renderer, so it looks exactly like the screen) ----------
function refText(song, slide) {
    const m = S.prefs.ref; if (m === 'none' || !song) return '';
    if (m === 'both' && slide && slide.sec) return song.title + ' · ' + slide.sec;
    return song.title || '';
}
function ltStyleFor(tpl, st) {
    if (tpl === 'plain' && st && typeof LTT !== 'undefined' && LTT.plain) {   // plain background bar: takes the song's own background colour / picture
        const o = { c1: st.bgColor, c3: st.color, c5: st.color, grad: false, opacity: 100 - clamp(st.dim || 0, 0, 90), font: st.font };
        if (st.bgImg && assetUrl(st.bgImg)) { o.img = assetUrl(st.bgImg); o.imgDim = st.dim || 0; o.opacity = 100; }
        else if (st.bgPreset && typeof buildPresetBackgroundCss === 'function') { o.opacity = 100; o.presetCss = buildPresetBackgroundCss(st.bgPreset, 100); }
        return Object.assign({}, LTT.plain.d, o);
    }
    if (!tpl || tpl === 'none' || typeof LTT === 'undefined' || !LTT[tpl]) return {};
    return Object.assign({}, LTT[tpl].d, (typeof lttCustom !== 'undefined' && lttCustom && lttCustom[tpl]) || {});
}
function styleFields(st) {
    const lower = st.layout === 'mode-lowerthird'; const tpl = lower && typeof LTT !== 'undefined' && LTT[st.ltTpl] ? st.ltTpl : 'none';
    return { ltTemplate: tpl, ltStyle: ltStyleFor(tpl, st), textNudgeX: st.nx || 0, textNudgeY: st.ny || 0, nudgeAny: true, layout: st.layout, bgTransparent: !!st.transparent, bgColor: st.bgColor, bgPreset: st.bgPreset || '', bgOpacity: 100 - clamp(st.dim || 0, 0, 90), fontSize: st.size,
        fontFamilyOverride: st.font, fontBold: !!st.bold, fontItalic: !!st.italic, textColor: st.color, textShadowStyle: st.shadow, lowerThirdPosition: st.ltPos || 'bottom', textBackingPanel: !!st.panel,
        textBgUrl: '', flierId: (!st.transparent && assetUrl(st.bgImg)) ? st.bgImg : '' };
}
function sceneState(song, slide) {
    const st = song.style;
    return Object.assign({}, previewState, styleFields(st), { text: slide ? slide.text : '', ref: refText(song, slide), displayMode: 'text', mediaUrl: '', mediaKind: '', isScrolling: false,
        timerVisible: false, timerSolo: false, announcementVisible: false, lowerThirdVisible: false, timeUpShown: false, logoPosition: '' });
}

// ---------- UI ----------
const CSS = `
.ls-root{position:fixed;inset:0;z-index:9000;background:#060a13;color:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:none;flex-direction:column;font-size:13px}
.ls-root.open{display:flex}
.ls-root *{box-sizing:border-box}
.ls-root button{white-space:nowrap;font-family:inherit;cursor:pointer;color:#f8fafc;background:#1e293b;border:0;border-radius:8px;padding:7px 12px;font-size:13px}
.ls-root button:hover:not(:disabled){background:#2b3a52}
.ls-root button:disabled{opacity:.4;cursor:default}
.ls-root button.pri{background:#38bdf8;color:#04121f;font-weight:700}
.ls-root button.pri:hover{background:#7dd3fc}
.ls-root button.on{background:#38bdf8;color:#04121f;font-weight:700}
.ls-root #lsFreeze.on{background:#f59e0b;color:#1c1917;font-weight:800}
.ls-root button.dng{background:#7f1d1d}
.ls-root input,.ls-root select,.ls-root textarea{font-family:inherit;background:#060a13;color:#f8fafc;border:1px solid #334155;border-radius:7px;padding:6px 8px;font-size:12px}
.ls-root input[type=color]{padding:0;width:30px;height:26px;border:1px solid #475569;background:none;cursor:pointer}
.ls-root input[type=range]{padding:0;width:100%;border:0}
.ls-top{height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#0f1626;border-bottom:1px solid #1e293b;position:relative}
.ls-top .l,.ls-top .r{display:flex;align-items:center;gap:8px}
.ls-top h1{margin:0;font-size:16px;font-weight:700}
.ls-saved{font-size:12px;color:#94a3b8}
.ls-body{flex:1;min-height:0;display:grid;gap:14px;padding:14px}
.ls-panel{background:#0f1626;border:1px solid #1e293b;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:0;overflow:auto}
.ls-panel h3{margin:0;font-size:15px}
.ls-panel h4{margin:6px 0 0;font-size:13px;border-top:1px solid #1e293b;padding-top:12px}
.ls-panel h4:first-child{border-top:0;padding-top:0;margin-top:0}
.ls-muted{color:#94a3b8;font-size:11px;line-height:1.4}
.ls-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.ls-row>*{flex:0 0 auto}.ls-row>.f{flex:1 1 0;min-width:0}
.ls-songs{display:flex;flex-direction:column;gap:5px;flex:1;min-height:80px;overflow:auto}
.ls-song{padding:9px 11px;border-radius:8px;background:#0a1120;border:1px solid transparent;cursor:pointer;font-size:13px;user-select:none}
.ls-song small{display:block;color:#94a3b8;font-size:11px;margin-top:2px}
.ls-song.cur{background:#12304d;border-color:#38bdf8;font-weight:700}
.ls-song.sel{outline:2px solid #fbbf24}
.ls-center{display:flex;flex-direction:column;gap:14px;min-height:0;min-width:0}
.ls-look{background:#0f1626;border:1px solid #1e293b;border-radius:12px;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:none}
.ls-look label{display:flex;align-items:center;gap:5px;color:#94a3b8;font-size:12px}
.ls-scenecard{background:#0f1626;border:1px solid #1e293b;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;flex:3 1 0;min-height:260px}
.ls-scenehead{display:flex;align-items:center;gap:10px;font-size:12px;color:#94a3b8}
.ls-scenehead input{width:150px}
.ls-scenebox{position:relative;flex:1;min-height:0;border-radius:8px;overflow:hidden;background:#0a1120;border:1px solid #1e293b}
.ls-scenebox .display-canvas.ls-chk{background-color:#2b2f3a!important;background-image:linear-gradient(45deg,#3a3f4d 25%,transparent 25%,transparent 75%,#3a3f4d 75%),linear-gradient(45deg,#3a3f4d 25%,transparent 25%,transparent 75%,#3a3f4d 75%)!important;background-size:24px 24px!important;background-position:0 0,12px 12px!important;background-repeat:repeat!important}
.ls-guides{position:absolute;inset:0;pointer-events:none;z-index:7;display:none}.ls-guides.show{display:block}
.ls-guides .gl{position:absolute;background:rgba(74,222,128,.4)}.ls-guides .gl.hit{background:#22c55e;box-shadow:0 0 7px #22c55e}
.ls-guides .gb{position:absolute;border:1px dashed rgba(74,222,128,.8);border-radius:4px}.ls-guides .gb.hit{border:2px solid #22c55e;box-shadow:0 0 8px rgba(34,197,94,.7)}
.ls-fit{position:absolute;left:0;top:0;width:1920px;height:1072px;transform-origin:0 0}
.ls-scenebox.ls-move .display-canvas{cursor:move!important}.ls-scenebox .display-canvas{cursor:text;box-shadow:none;border:1px solid #1e293b}
.ls-scenebox.ls-editing .text-out{color:transparent!important;text-shadow:none!important}
.ls-scenebox.ls-editing .text-out *{color:transparent!important}
.ls-edit{position:absolute;display:none;z-index:5;background:transparent;border:2px dashed #38bdf8;border-radius:6px;resize:none;outline:none;padding:0;margin:0;overflow:hidden;white-space:pre-wrap;text-align:center;caret-color:#38bdf8}
.ls-scenebox.ls-editing .ls-edit{display:block}
.ls-hint{position:absolute;left:10px;bottom:8px;z-index:6;font-size:11px;background:rgba(6,10,19,.72);color:#cbd5e1;padding:4px 9px;border-radius:6px;pointer-events:none}
.ls-cardsbox{background:#0f1626;border:1px solid #1e293b;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;flex:2 1 0;min-height:150px}
.ls-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;overflow:auto;align-content:start;padding:2px}
.ls-card{position:relative;height:92px;border-radius:8px;padding:8px 9px;overflow:hidden;border:2px solid #1e293b;cursor:pointer;user-select:none;background-size:cover;background-position:center}
.ls-card .cn{font-size:9px;letter-spacing:.5px;color:#7dd3fc;text-transform:uppercase;margin-bottom:3px;text-shadow:0 1px 2px #000}
.ls-card .ct{font-size:10.5px;line-height:1.3;white-space:pre-line;text-shadow:0 1px 2px rgba(0,0,0,.7);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ls-card.cur{border:2px dashed #38bdf8}
.ls-card.live{border:2px solid #ef4444}
.ls-card.sel{box-shadow:0 0 0 3px #fbbf24}
.ls-card.dropb{box-shadow:-5px 0 0 0 #38bdf8}.ls-card.dropa{box-shadow:5px 0 0 0 #38bdf8}
.ls-card .lv{position:absolute;top:5px;right:6px;background:#ef4444;color:#fff;font-size:8px;font-weight:700;padding:1px 5px;border-radius:4px}
.ls-card.add{display:flex;align-items:center;justify-content:center;border:2px dashed #334155;background:#0a1120;color:#94a3b8;font-size:12px}
.ls-selbar{display:flex;gap:6px;align-items:center;background:#2a2108;border:1px solid #b45309;border-radius:8px;padding:6px 10px;font-size:12px;color:#fde68a}
.ls-sw{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
.ls-sw span{height:30px;border-radius:6px;border:1px solid #334155;cursor:pointer}
.ls-sw span.on{outline:2px solid #38bdf8}
.ls-set{display:flex;flex-direction:column;gap:4px}
.ls-setitem{display:flex;gap:4px;align-items:center;padding:6px 8px;border-radius:8px;background:#0a1120;font-size:12px;cursor:pointer}
.ls-setitem.cur{background:#12304d}
.ls-setitem .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ls-setitem button{padding:1px 6px;font-size:11px;background:transparent}
.ls-menu{position:fixed;z-index:9100;background:#0f1626;border:1px solid #334155;border-radius:10px;padding:5px;min-width:190px;box-shadow:0 12px 30px rgba(0,0,0,.6);display:none}
.ls-menu.open{display:block}
.ls-menu button{display:block;width:100%;text-align:left;background:transparent;border-radius:6px;padding:7px 10px}
.ls-menu hr{border:0;border-top:1px solid #1e293b;margin:4px 0}
.ls-keys{position:absolute;top:50px;right:18px;z-index:9100;width:400px;background:#0f1626;border:1px solid #334155;border-radius:10px;padding:12px;display:none;box-shadow:0 12px 30px rgba(0,0,0,.6)}
.ls-keys.open{display:block}
.ls-keys div{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid #1e293b;font-size:12px}
.ls-keys b{color:#7dd3fc;white-space:nowrap}
.ls-modal{position:fixed;inset:0;z-index:9200;background:rgba(2,6,14,.7);display:none;align-items:center;justify-content:center}
.ls-modal.open{display:flex}
.ls-mbox{width:min(560px,94vw);max-height:90vh;overflow:auto;background:#0f1626;border:1px solid #334155;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px}
.ls-mbox h2{margin:0;font-size:16px}
.ls-mbox label{display:flex;flex-direction:column;gap:4px;color:#94a3b8;font-size:12px}
.ls-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0f1626;border:1px solid #38bdf8;border-radius:10px;padding:8px 16px;z-index:9300;display:none;font-size:13px}
.ls-toast.open{display:block}
.ls-link{display:block;padding:8px 10px;border-radius:8px;background:#0a1120;color:#7dd3fc;text-decoration:none;margin-top:4px}
@media (max-width:1100px){.ls-body{grid-template-columns:1fr!important;overflow:auto}}
`;
const el = {};
function buildUI() {
    if (el.root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const fonts = ($('#fontStyleOverrideSelector') || {}).innerHTML || '<option value="' + esc(FONT_DEFAULT) + '">Georgia</option>';
    const shadows = ($('#textShadowSelector') || {}).innerHTML || '<option value="0 4px 12px rgba(0,0,0,0.98)">High contrast</option><option value="none">Flat</option>';
    const root = document.createElement('div'); root.className = 'ls-root'; root.id = 'lsRoot'; root.tabIndex = -1;
    root.innerHTML = `
<div class="ls-top"><div class="l"><h1>🎵 Lyrics Studio</h1><span class="ls-saved" id="lsSongName"></span><span class="ls-saved" id="lsSaved"></span></div>
<div class="r"><button id="lsFreeze" data-act="freeze" title="Freeze: stops edits reaching the screens. Works together with the main dashboard">❄ Freeze</button><button id="lsProj" data-act="proj" style="background:#dc2626;border-color:#ef4444;font-weight:700" title="Send the slide you are editing to the live screens (same as clicking its card)">▶ Send Live</button><button id="lsUndo" data-act="undo" disabled>Undo</button><button id="lsRedo" data-act="redo" disabled>Redo</button><button data-act="keys">Shortcuts ▾</button><button data-act="settings">Settings ⚙</button><button data-act="close">✕ Close</button></div>
<div class="ls-keys" id="lsKeys">${SHORTCUTS.map(k => `<div><b>${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join('')}</div></div>
<div class="ls-body" id="lsBody">
 <div class="ls-panel" id="lsSongs">
  <h3>Songs <span class="ls-muted" id="lsCount"></span></h3>
  <input id="lsSearch" placeholder="Search songs…" autocomplete="off">
  <div class="ls-row"><button class="pri f" data-act="newsong">+ New</button><button class="f" data-act="importmenu">Import ▾</button><button class="f" data-act="web">Web</button></div>
  <div class="ls-songs" id="lsSongList"></div>
  <div class="ls-selbar" id="lsSongSel" style="display:none"><span id="lsSongSelN"></span><button data-act="songexport">Export</button><button class="dng" data-act="songdel">Delete</button></div>
  <div class="ls-muted">Ctrl+click to select several songs: export or delete.</div>
 </div>
 <div class="ls-center">
  <div class="ls-look" id="lsLook">
   <select data-sk="font" id="lsFont" style="max-width:170px">${fonts}</select>
   <select data-sk="size" id="lsSize"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xlarge">Extra large</option></select>
   <button data-act="bold" id="lsBold"><b>B</b></button><button data-act="italic" id="lsItalic"><i>I</i></button>
   <label>Text <input type="color" data-sk="color" id="lsColor"></label>
   <select data-sk="shadow" id="lsShadow" style="max-width:150px">${shadows}</select>
   <label>Split <select id="lsLines"><option value="1">1 line</option><option value="2">2 lines</option><option value="4">4 lines</option><option value="all">Whole verse</option></select></label>
   <label>Show <select id="lsRef"><option value="title">Song title</option><option value="both">Title · section</option><option value="none">Nothing</option></select></label>
   <button data-act="nudge" id="lsNudge" title="Move the text: drag it on the scene (or hold Ctrl and drag)">✥</button><button data-act="lookall" title="Use this song's look for every song">Look → all songs</button>
  </div>
  <div class="ls-scenecard">
   <div class="ls-scenehead"><b style="color:#f8fafc;font-size:14px">Edit scene</b><span id="lsSlideNo"></span><label style="display:flex;gap:5px;align-items:center">Label <input id="lsLabel" placeholder="Verse 1" list="lsSecs"></label><datalist id="lsSecs"></datalist><span style="margin-left:auto">Click the text on the scene to type · changes save by themselves</span></div>
   <div class="ls-scenebox" id="lsScenebox"><div class="ls-fit" id="lsWrap"><div id="lsCanvas" class="display-canvas mode-center size-large" style="width:1920px;height:1072px;max-width:none"></div></div><textarea class="ls-edit" id="lsEdit" spellcheck="false"></textarea><div class="ls-guides" id="lsGuides"><div class="gl" id="lsGv" style="width:1px"></div><div class="gl" id="lsGh" style="height:1px"></div><div class="gb" id="lsGb"></div></div><div class="ls-hint" id="lsHint">Click the text to edit</div></div>
  </div>
  <div class="ls-cardsbox">
   <div class="ls-row"><b style="font-size:14px">Slides</b><span class="ls-muted">Click a card to send it live · Ctrl+click to select, then drag to reorder · right-click for more</span>
    <span style="margin-left:auto" class="ls-row"><button data-act="addsec" data-v="Verse">+ Verse</button><button data-act="addsec" data-v="Chorus">+ Chorus</button><button data-act="addsec" data-v="Bridge">+ Bridge</button><button data-act="addsec" data-v="">+ Blank</button></span></div>
   <div class="ls-selbar" id="lsSel" style="display:none"><span id="lsSelN"></span><button data-act="dup">Duplicate</button><button class="dng" data-act="del">Delete</button><button data-act="selnone">Clear selection</button></div>
   <div class="ls-cards" id="lsCards"></div>
  </div>
 </div>
 <div class="ls-panel" id="lsSide">
  <h4>Display style</h4>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px"><button style="padding:8px 2px;font-size:12px" data-act="disp" data-v="full" id="lsDfull">Full screen</button><button style="padding:8px 2px;font-size:12px" data-act="disp" data-v="lower" id="lsDlower">Lower third</button></div>
  <div id="lsLtRow" style="display:none;flex-direction:column;gap:8px"><label class="ls-muted">Lower-third style<select data-sk="ltTpl" id="lsLtTpl" style="width:100%;margin-top:3px"></select></label><label class="ls-muted">Position<select data-sk="ltPos" id="lsLtPos" style="width:100%;margin-top:3px"><option value="bottom">Bottom</option><option value="center">Middle</option><option value="top">Top</option></select></label></div>
  <label class="ls-muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="lsPanel"> Dark box behind the text (easier to read over video)</label><div class="ls-muted">Lower third puts the words at the edge of the screen so it overlays video or OBS. Choose “Transparent text only”, “Plain background” (a bar in the Background colour, picture or gradient below) or a template. These belong to Lyrics only.</div>
  <h4>Background</h4>
  <div class="ls-sw" id="lsSw"></div>
  <div class="ls-row"><label class="ls-muted">Custom</label><input type="color" data-sk="bgColor" id="lsBgColor"><select id="lsPreset" class="f"><option value="">Gradient…</option></select></div>
  <div class="ls-row"><button class="f" data-act="bgimg">Import image</button><button data-act="bgclear" id="lsBgClear">Remove image</button><input type="file" id="lsBgFile" accept="image/*" style="display:none"></div>
  <label class="ls-muted">Dim picture <span id="lsDimV" style="float:right"></span><input type="range" id="lsDim" min="0" max="90" step="5"></label>
  <h4>Playback</h4>
  <div class="ls-row"><label class="ls-muted" style="display:flex;gap:5px;align-items:center"><input type="checkbox" id="lsAuto"> Auto-advance every</label><input id="lsSecsIn" type="number" min="1" max="600" style="width:56px"> <span class="ls-muted">s</span></div>
  <div class="ls-row"><button class="f" data-act="loop" id="lsLoop">Loop</button><button class="f" data-act="pause" id="lsPause">Pause</button><button class="f" data-act="blank" id="lsBlank">Blank</button></div>
  <div class="ls-row"><label class="ls-muted">Transition</label><select id="lsTrans" class="f"><option value="none">Instant cut</option><option value="fade">Fade</option><option value="slide">Slide</option><option value="zoom">Zoom</option></select></div>
  <div class="ls-row"><label class="ls-muted">Speed</label><select id="lsTransMs" class="f"><option value="0">Default</option><option value="150">Very fast (150 ms)</option><option value="300">Fast (300 ms)</option><option value="500">Medium (500 ms)</option><option value="800">Slow (800 ms)</option><option value="1200">Slower (1200 ms)</option><option value="2000">Very slow (2000 ms)</option></select></div>
  <div hidden style="display:none"><div class="ls-set" id="lsSet"></div></div>
 </div>
</div>
<div class="ls-menu" id="lsMenu"></div>
<div class="ls-modal" id="lsModal"><div class="ls-mbox" id="lsMbox"></div></div>
<div class="ls-toast" id="lsToast"></div>`;
    document.body.appendChild(root);
    el.root = root; el.canvas = $('#lsCanvas'); el.box = $('#lsScenebox'); el.edit = $('#lsEdit'); el.menu = $('#lsMenu');
    $('#lsSecs').innerHTML = ['Verse 1', 'Verse 2', 'Verse 3', 'Verse 4', 'Chorus', 'Pre-Chorus', 'Bridge', 'Tag', 'Intro', 'Outro', 'Ending'].map(v => `<option value="${v}">`).join('');
    { const lt = $('#lsLtTpl'); lt.innerHTML = '<option value="none">Transparent text only</option><option value="plain">Plain background</option>' + (typeof LTT_ORDER !== 'undefined' ? LTT_ORDER.map(id => `<option value="${id}">${esc(LTT[id].name)}</option>`).join('') : ''); }
    const ps = $('#lsPreset'); Object.keys(typeof DEFAULT_BG_PRESETS !== 'undefined' ? DEFAULT_BG_PRESETS : {}).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = DEFAULT_BG_PRESETS[k].label || (k.charAt(0).toUpperCase() + k.slice(1)); ps.appendChild(o); });
    $('#lsSw').innerHTML = SWATCH.map(c => `<span data-act="swatch" data-v="${c}" style="background:${c}"></span>`).join('');
    applyLayout(); bind(); watchTop();
    if (window.ResizeObserver) new ResizeObserver(() => { fitScene(); if (S.editing) positionEdit(); }).observe(el.box);
}
function applyLayout() {
    const b = $('#lsBody'); const songs = $('#lsSongs'), side = $('#lsSide'), center = $('.ls-center', el.root);
    b.style.gridTemplateColumns = S.prefs.swap ? '290px minmax(0,1fr) 250px' : '250px minmax(0,1fr) 290px';
    if (S.prefs.swap) { b.append(side, center, songs); b.style.gridTemplateColumns = '290px minmax(0,1fr) 250px'; } else { b.append(songs, center, side); }
}
function toast(t) { const e = $('#lsToast'); e.textContent = t; e.classList.add('open'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('open'), 2200); }
const hesc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- rendering ----------
function renderSongs() {
    const q = S.q.trim().toLowerCase(); const list = lib().slice().sort((a, b) => String(a.title).localeCompare(String(b.title)))
        .filter(s => !q || String(s.title).toLowerCase().includes(q) || String(s.lyrics || '').toLowerCase().includes(q));
    $('#lsCount').textContent = '· ' + lib().length;
    $('#lsSongList').innerHTML = list.length ? list.map(s => {
        const n = Array.isArray(s.slides) && s.lyricsStudio === s.lyrics ? s.slides.length : reflow(parseLyrics(s.lyrics), modeOf(s)).length;
        return `<div class="ls-song ${s.id === S.songId ? 'cur' : ''} ${S.songSel.has(s.id) ? 'sel' : ''}" data-song="${esc(s.id)}">${esc(s.title || 'Untitled')}<small>${n} slide${n === 1 ? '' : 's'}</small></div>`;
    }).join('') : '<div class="ls-muted" style="padding:10px">No songs yet. Use + New to paste lyrics, or Import a file.</div>';
    const n = S.songSel.size; $('#lsSongSel').style.display = n > 1 ? 'flex' : 'none'; $('#lsSongSelN').textContent = n + ' songs';
}
function thumbBg(st) {
    if (st.transparent || st.layout === 'mode-lowerthird') return 'background-color:#2b2f3a;background-image:linear-gradient(45deg,#3a3f4d 25%,transparent 25%,transparent 75%,#3a3f4d 75%),linear-gradient(45deg,#3a3f4d 25%,transparent 25%,transparent 75%,#3a3f4d 75%);background-size:14px 14px;background-position:0 0,7px 7px;';
    const u = assetUrl(st.bgImg);
    if (u) return `background-color:${st.bgColor};background-image:linear-gradient(rgba(0,0,0,${(st.dim || 0) / 100}),rgba(0,0,0,${(st.dim || 0) / 100})),url('${u}');`;
    if (st.bgPreset && typeof buildPresetBackgroundCss === 'function') return `background-color:${st.bgColor};background-image:${buildPresetBackgroundCss(st.bgPreset, 100)};`;
    return `background:${st.bgColor};`;
}
function renderCards() {
    const song = curSong(); const box = $('#lsCards'); if (!song) { box.innerHTML = '<div class="ls-muted">Pick or create a song.</div>'; return; }
    const bg = thumbBg(song.style);
    box.innerHTML = song.slides.map((sl, i) => `<div class="ls-card ${i === S.idx ? 'cur' : ''} ${i === S.live && !S.blank ? 'live' : ''} ${S.sel.has(sl.id) ? 'sel' : ''}" draggable="true" data-i="${i}" style="${bg}color:${esc(song.style.color)}">
<div class="cn">${esc(sl.sec || '')} ${sl.sec ? '·' : ''} ${i + 1}</div><div class="ct">${esc(sl.text) || '<i style="opacity:.6">blank</i>'}</div>${i === S.live && !S.blank ? '<span class="lv">LIVE</span>' : ''}</div>`).join('')
        + '<div class="ls-card add" data-act="addsec" data-v="">+ Slide</div>';
    const n = S.sel.size; $('#lsSel').style.display = n > 1 ? 'flex' : 'none'; $('#lsSelN').textContent = n + ' slides selected';
}
function fitScene() {   // the scene is drawn at the real 1920-wide size and scaled down, so it matches the screen exactly
    const w = el.box.clientWidth, h = el.box.clientHeight; if (!w || !h) return;
    const k = Math.min((w - 8) / 1920, (h - 8) / 1072); S.k = k;
    $('#lsWrap').style.transform = `translate(${Math.round((w - 1920 * k) / 2)}px,${Math.round((h - 1072 * k) / 2)}px) scale(${k})`;
}
function renderScene() {
    fitScene();
    const song = curSong(); if (!song) { el.canvas.innerHTML = '<div class="placeholder-text">Pick or create a song</div>'; return; }
    const sl = curSlide(); const s = sceneState(song, sl); s.text = hesc(s.text); s.ref = hesc(s.ref);
    try { buildCanvasDOM(el.canvas, s, importedAssetsLibrary, typeof cachedLogoDataUrl !== 'undefined' ? cachedLogoDataUrl : '', false); } catch (e) { console.warn('Lyrics scene', e); }
    el.canvas.classList.toggle('ls-chk', !!song.style.transparent || song.style.layout === 'mode-lowerthird');
    $('#lsSlideNo').textContent = `Slide ${S.idx + 1} of ${song.slides.length}`;
    const lab = $('#lsLabel'); if (document.activeElement !== lab) lab.value = sl ? sl.sec || '' : '';
    if (S.editing) positionEdit();
}
function syncLook() {
    const song = curSong(); if (!song) return; const st = song.style;
    $('#lsFont').value = st.font; if ($('#lsFont').value !== st.font) { const o = document.createElement('option'); o.value = st.font; o.textContent = 'Custom'; $('#lsFont').appendChild(o); $('#lsFont').value = st.font; }
    $('#lsSize').value = st.size; $('#lsColor').value = st.color; $('#lsShadow').value = st.shadow; $('#lsBold').classList.toggle('on', !!st.bold); $('#lsItalic').classList.toggle('on', !!st.italic);
    $('#lsLines').value = modeOf(song); $('#lsRef').value = S.prefs.ref;
    const disp = st.layout === 'mode-lowerthird' ? 'lower' : 'full'; $('#lsLtTpl').value = st.ltTpl || 'none'; $('#lsNudge').classList.toggle('on', !!S.nudge); $('#lsPanel').checked = !!st.panel;
    ['full', 'lower'].forEach(k => $('#lsD' + k).classList.toggle('on', k === disp));
    $('#lsLtRow').style.display = disp === 'lower' ? 'flex' : 'none'; $('#lsLtPos').value = st.ltPos || 'bottom';
    $$('#lsSw span').forEach(s => s.classList.toggle('on', s.dataset.v === st.bgColor && !st.bgPreset && !st.bgImg));
    $('#lsBgColor').value = /^#[0-9a-f]{6}$/i.test(st.bgColor) ? st.bgColor : '#0b3a66'; $('#lsPreset').value = st.bgPreset || '';
    $('#lsDim').value = st.dim || 0; $('#lsDimV').textContent = (st.dim || 0) + '%'; $('#lsBgClear').style.display = st.bgImg ? '' : 'none';
    $('#lsSongName').textContent = song.title ? '· ' + song.title : '';
}
function syncPlay() {
    $('#lsAuto').checked = !!S.prefs.auto; $('#lsSecsIn').value = S.prefs.secs; $('#lsLoop').classList.toggle('on', !!S.prefs.loop);
    const p = $('#lsPause'); p.textContent = S.paused ? 'Resume' : 'Pause'; p.classList.toggle('on', S.paused); $('#lsBlank').classList.toggle('on', S.blank);
    const t = $('#displayTransitionSelector'); if (t) $('#lsTrans').value = t.value; const tm = document.getElementById('displayTransitionMs'); if (tm && $('#lsTransMs')) $('#lsTransMs').value = tm.value;
}
function renderSetlist() {
    const box = $('#lsSet'); const items = S.setlist.items.filter(id => lib().some(s => s.id === id)); S.setlist.items = items;
    box.innerHTML = items.length ? items.map((id, i) => { const s = lib().find(x => x.id === id); return `<div class="ls-setitem ${id === S.songId ? 'cur' : ''}" data-set="${i}"><span class="t">${i + 1} · ${esc(s.title)}</span><button data-act="setup" data-i="${i}">▲</button><button data-act="setdown" data-i="${i}">▼</button><button data-act="setrm" data-i="${i}">✕</button></div>`; }).join('')
        : '<div class="ls-muted">Empty. Add songs in the order of service.</div>';
}
function refreshAll() { renderSongs(); renderScene(); renderCards(); syncLook(); syncPlay(); renderSetlist(); updUndo(); }

// ---------- editing on the scene ----------
function beginEdit() {
    const song = curSong(); const sl = curSlide(); if (!song || !sl || S.editing) return;
    snap(); S.editing = true; el.box.classList.add('ls-editing'); el.edit.value = sl.text;
    positionEdit(); el.edit.focus(); el.edit.setSelectionRange(el.edit.value.length, el.edit.value.length);
}
function positionEdit() {
    const sb = el.box.getBoundingClientRect(), cr = el.canvas.getBoundingClientRect(); const box = $('.text-display-box-container', el.canvas), out = $('.text-out', el.canvas);
    let r = box ? box.getBoundingClientRect() : null;
    if (!r || r.width < 40 || r.height < 24) r = { left: cr.left + cr.width * 0.12, top: cr.top + cr.height * 0.36, width: cr.width * 0.76, height: cr.height * 0.28 };
    const pad = 8, t = el.edit.style; t.left = (r.left - sb.left - pad) + 'px'; t.width = (r.width + pad * 2) + 'px'; t.top = (r.top - sb.top - pad) + 'px'; t.height = Math.max(r.height + pad * 2, 50) + 'px';
    if (out) { const c = getComputedStyle(out); const k = S.k || 1; t.fontFamily = c.fontFamily; t.fontSize = (parseFloat(c.fontSize) * k) + 'px'; t.fontWeight = c.fontWeight; t.fontStyle = c.fontStyle; t.lineHeight = (parseFloat(c.lineHeight) * k) + 'px'; t.color = song_color(); t.textShadow = c.textShadow; }
    t.padding = pad + 'px'; t.textAlign = 'center';
}
const song_color = () => { const s = curSong(); return s ? s.style.color : '#fff'; };
function finishEdit() {
    if (!S.editing) return; S.editing = false; el.box.classList.remove('ls-editing'); el.edit.blur();
    const sl = curSlide(); if (sl) { sl.text = el.edit.value.replace(/\s+$/g, ''); touch(); }
    renderScene(); renderCards(); renderSongs();
}

// ---------- Freeze + Send to Projector mirror the main dashboard's own buttons ----------
function syncTop() {
    const f = $('#lsFreeze'); if (f) { const on = typeof isLiveFrozen !== 'undefined' && isLiveFrozen; f.textContent = on ? '🔒 Frozen — click to unfreeze' : '❄ Freeze'; f.classList.toggle('on', on); }
}
function watchTop() {
    ['freezeLiveBtn', 'sendToProjectorBtn', 'projectorConnectionStatus'].forEach(id => { const n = document.getElementById(id); if (n && window.MutationObserver) new MutationObserver(syncTop).observe(n, { attributes: true, childList: true, subtree: true, characterData: true }); });
    syncTop();
}

// ---------- style / look ----------
let lastStyleKey = '', lastStyleAt = 0;
function setStyle(patch, key) {
    const song = curSong(); if (!song) return; const now = Date.now();
    if (!key || key !== lastStyleKey || now - lastStyleAt > 900) snap();
    lastStyleKey = key || ''; lastStyleAt = now;
    Object.assign(song.style, patch); touch(); renderScene(); renderCards(); syncLook(); pushLive();
}
function syncMainControls(st) {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    set('layoutSelector', st.layout); set('fontSizeInput', st.size); set('textColorPicker', st.color); set('bgColorPicker', st.bgColor); set('bgPresetSelector', st.bgPreset || '');
    set('fontStyleOverrideSelector', st.font); set('textShadowSelector', st.shadow);
    const t = document.getElementById('bgTransparentCheckbox'); if (t) t.checked = !!st.transparent;
    const bp = document.getElementById('textBackingPanelCheckbox'); if (bp) bp.checked = !!st.panel;
    const b = document.getElementById('fontBoldToggleBtn'); if (b) b.classList.toggle('toggle-active', !!st.bold);
    const i = document.getElementById('fontItalicToggleBtn'); if (i) i.classList.toggle('toggle-active', !!st.italic);
    try { if (typeof updateLowerThirdControlsVisibility === 'function') updateLowerThirdControlsVisibility(); } catch (e) {}
}

// ---------- sending to the screen ----------
function sendLive(i, keep) {
    const song = curSong(); const sl = song && song.slides[i]; if (!sl) return;
    S.live = i; S.blank = false;
    Object.assign(previewState, styleFields(song.style), { text: hesc(sl.text), ref: hesc(refText(song, sl)), isScrolling: false });
    try { switchToTextDisplay(); } catch (e) {}
    syncMainControls(song.style);
    renderPreview(); sendStagedToLiveView();
    renderCards(); syncPlay(); if (!keep) runSchedule();
}
function pushLive() { if (S.live >= 0 && S.live === S.idx && !S.blank && curSong() && curSong().slides[S.live]) sendLive(S.live, true); }
function setIdx(i) { const song = curSong(); if (!song) return; finishEdit(); S.idx = clamp(i, 0, song.slides.length - 1); renderScene(); renderCards(); }
function goSlide(i) { const song = curSong(); if (!song || !song.slides.length) return; S.sel = new Set(); setIdx(i); sendLive(S.idx); }
function step(d) {
    const song = curSong(); if (!song) return; const base = S.live >= 0 ? S.live : S.idx - d;
    const n = clamp(base + d, 0, song.slides.length - 1); goSlide(n);
}
function runStop() { clearTimeout(S.run); S.run = null; }
function runSchedule() {
    runStop(); if (!S.prefs.auto || S.paused || S.live < 0 || S.blank || !S.open && false) return;
    S.run = setTimeout(() => {
        const song = curSong(); if (!song) return; let n = S.live + 1;
        if (n >= song.slides.length) { if (S.prefs.loop) n = 0; else { syncPlay(); return; } }
        goSlide(n);
    }, clamp(parseFloat(S.prefs.secs) || 8, 1, 600) * 1000);
}
function toggleBlank() {
    const song = curSong(); if (!song) return;
    if (S.blank) { S.blank = false; if (S.live >= 0) sendLive(S.live); else { renderCards(); syncPlay(); } return; }
    S.blank = true; runStop(); previewState.text = ''; previewState.ref = ''; renderPreview(); sendStagedToLiveView(); renderCards(); syncPlay();
}

// ---------- slide operations ----------
const targets = () => { const s = curSong(); if (!s) return []; if (S.sel.size) return s.slides.filter(x => S.sel.has(x.id)); const c = curSlide(); return c ? [c] : []; };
function addSlide(sec) {
    const song = curSong(); if (!song) return; finishEdit(); snap();
    const n = (sec ? song.slides.filter(s => s.sec && s.sec.toLowerCase().startsWith(sec.toLowerCase())).length : 0);
    const label = sec ? (sec === 'Chorus' || sec === 'Bridge' ? (n ? sec + ' ' + (n + 1) : sec) : sec + ' ' + (n + 1)) : '';
    song.slides.splice(S.idx + 1, 0, { id: uid('sl'), text: '', sec: label }); S.idx++; S.sel = new Set(); touch(); refreshAll(); setTimeout(beginEdit, 30);
}
function dupSel() {
    const song = curSong(); const list = targets(); if (!song || !list.length) return; snap();
    const last = Math.max(...list.map(s => song.slides.indexOf(s))); const copies = list.slice().sort((a, b) => song.slides.indexOf(a) - song.slides.indexOf(b)).map(s => ({ id: uid('sl'), text: s.text, sec: s.sec }));
    song.slides.splice(last + 1, 0, ...copies); S.sel = new Set(copies.map(c => c.id)); S.idx = last + 1; touch(); refreshAll();
}
function delSel() {
    const song = curSong(); const list = targets(); if (!song || !list.length) return; finishEdit(); snap();
    const liveSlide = song.slides[S.live]; const ids = new Set(list.map(s => s.id)); song.slides = song.slides.filter(s => !ids.has(s.id));
    if (!song.slides.length) song.slides = [{ id: uid('sl'), text: '', sec: '' }];
    S.live = liveSlide && !ids.has(liveSlide.id) ? song.slides.indexOf(liveSlide) : -1; S.idx = clamp(S.idx, 0, song.slides.length - 1); S.sel = new Set(); touch(); refreshAll();
}
function moveSel(d) {
    const song = curSong(); const list = targets(); if (!song || !list.length) return; snap();
    const cur = curSlide(), liveSlide = song.slides[S.live]; const ids = new Set(list.map(s => s.id)); const arr = song.slides;
    if (d < 0) for (let i = 1; i < arr.length; i++) { if (ids.has(arr[i].id) && !ids.has(arr[i - 1].id)) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; }
    else for (let i = arr.length - 2; i >= 0; i--) { if (ids.has(arr[i].id) && !ids.has(arr[i + 1].id)) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; }
    S.idx = Math.max(0, arr.indexOf(cur)); S.live = liveSlide ? arr.indexOf(liveSlide) : -1; touch(); renderCards(); renderScene();
}
function reorder(ids, targetIdx, after) {
    const song = curSong(); if (!song) return; const idset = new Set(ids); const target = song.slides[targetIdx]; if (!target || idset.has(target.id)) return; snap();
    const cur = curSlide(), liveSlide = song.slides[S.live]; const moving = song.slides.filter(s => idset.has(s.id)); const rest = song.slides.filter(s => !idset.has(s.id));
    rest.splice(rest.indexOf(target) + (after ? 1 : 0), 0, ...moving); song.slides = rest; S.idx = Math.max(0, rest.indexOf(cur)); S.live = liveSlide ? rest.indexOf(liveSlide) : -1; touch(); renderCards(); renderScene();
}
function resplit(mode) {
    const song = curSong(); if (!song) return; finishEdit(); snap(); song.slides = reflow(slidesToGroups(song.slides), mode); if (!song.slides.length) song.slides = [{ id: uid('sl'), text: '', sec: '' }];
    song.splitMode = mode === 'all' ? 'blank' : mode; S.idx = 0; S.live = -1; S.sel = new Set(); touch(); refreshAll();
}

// ---------- songs ----------
function openSong(id) {
    const song = lib().find(s => s.id === id); if (!song) return; finishEdit(); if (S.dirty) flush(); runStop();
    S.songId = id; ensure(song); S.idx = 0; S.live = -1; S.blank = false; S.sel = new Set(); S.undo = []; S.redo = []; lsSet('ebpLyricsLast', id); refreshAll();
}
function createSong(title, raw, mode) {
    const song = { id: 'song_' + Date.now() + Math.random().toString(36).slice(2, 5), title: (title || '').trim() || 'Untitled song', lyrics: String(raw || '').trim(), splitMode: mode === 'all' ? 'blank' : mode, style: defStyle() };
    lib().push(song); ensure(song); S.dirty = true; flush(); openSong(song.id); toast('Song added'); return song;
}
function deleteSongs(ids) {
    const names = ids.map(id => (lib().find(s => s.id === id) || {}).title).filter(Boolean);
    if (!ids.length || !confirm(`Delete ${ids.length === 1 ? '"' + names[0] + '"' : ids.length + ' songs'} from your song library? This cannot be undone.`)) return;
    savedSongsLibrary = lib().filter(s => !ids.includes(s.id)); S.setlist.items = S.setlist.items.filter(id => !ids.includes(id)); saveSetlist(); S.songSel = new Set();
    if (ids.includes(S.songId)) { S.songId = null; const next = lib()[0]; if (next) openSong(next.id); else { S.idx = 0; S.live = -1; refreshAll(); } } else refreshAll();
    S.dirty = false; flush();
}
function mergeSongs(arr) {
    let n = 0; (arr || []).forEach(r => {
        if (!r || !r.title || typeof r.lyrics !== 'string') return; const have = lib().find(s => s.id === r.id);
        if (have) { if ((r.updated || 0) <= (have.updated || 0)) return; Object.assign(have, r); n++; } else { lib().push(Object.assign({}, r, { id: r.id || 'song_' + uid() })); n++; }
    });
    if (n) { try { persistSavedSongs(); refreshSavedSongsDropdown(); } catch (e) {} } return n;
}
async function readLyricsFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') return file.text();
    if (ext === 'docx' || ext === 'doc') { if (typeof mammoth === 'undefined') throw new Error('The Word reader did not load (no internet?).'); const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }); return r.value; }
    if (ext === 'pdf') {
        if (typeof pdfjsLib === 'undefined') throw new Error('The PDF reader did not load (no internet?).');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; const pages = [];
        for (let p = 1; p <= pdf.numPages; p++) { const c = await (await pdf.getPage(p)).getTextContent(); pages.push(c.items.map(i => i.str + (i.hasEOL ? '\n' : ' ')).join('')); }
        return pages.join('\n\n');
    }
    throw new Error('Please choose a .pdf, .docx or .txt file.');
}
function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

// ---------- setlist ----------
function setAdd(ids) { let n = 0; ids.forEach(id => { if (!S.setlist.items.includes(id)) { S.setlist.items.push(id); n++; } }); saveSetlist(); renderSetlist(); toast(n ? n + ' added to the setlist' : 'Already in the setlist'); }
function setMove(i, d) { const a = S.setlist.items; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; saveSetlist(); renderSetlist(); }

// ---------- menus, modals ----------
function showMenu(items, x, y) {
    el.menu.innerHTML = items.map(it => it === '-' ? '<hr>' : `<button data-m="${esc(it[0])}">${esc(it[1])}</button>`).join(''); el.menu.classList.add('open');
    const w = el.menu.offsetWidth, h = el.menu.offsetHeight; el.menu.style.left = Math.min(x, innerWidth - w - 8) + 'px'; el.menu.style.top = Math.min(y, innerHeight - h - 8) + 'px';
}
function hideMenu() { el.menu.classList.remove('open'); }
function openModal(html) { $('#lsMbox').innerHTML = html; $('#lsModal').classList.add('open'); const f = $('#lsMbox input,#lsMbox textarea'); if (f) setTimeout(() => f.focus(), 30); }
function closeModal() { $('#lsModal').classList.remove('open'); }
function newSongModal(title, text) {
    openModal(`<h2>New song</h2><label>Title<input id="lsNT" value="${esc(title || '')}" placeholder="e.g. Amazing Grace"></label>
<label>Lyrics (use a blank line between verses; lines like [Chorus] or Verse 2: become slide labels)<textarea id="lsNL" rows="11" placeholder="Paste the lyrics here…">${esc(text || '')}</textarea></label>
<label>Lines per slide<select id="lsNM"><option value="1">1 line</option><option value="2" ${S.prefs.lines === '2' ? 'selected' : ''}>2 lines</option><option value="4" ${S.prefs.lines === '4' ? 'selected' : ''}>4 lines</option><option value="all">Whole verse</option></select></label>
<div class="ls-row" style="justify-content:flex-end"><button data-act="mclose">Cancel</button><button class="pri" data-act="mcreate">Create song</button></div>`);
}
function webModal() {
    openModal(`<h2>Find lyrics on the web</h2><div class="ls-row"><input id="lsWQ" class="f" placeholder="Song title or first line" value="${esc((curSong() || {}).title || '')}"><button class="pri" data-act="wgo">Search</button></div><div id="lsWR" class="ls-muted">Pick a site, copy the lyrics, then use + New to paste them.</div><div class="ls-row" style="justify-content:flex-end"><button data-act="mclose">Close</button></div>`);
}
function webResults() {
    const q = $('#lsWQ').value.trim(); if (!q) return; const e = encodeURIComponent(q + ' lyrics');
    const src = [['Genius', 'https://genius.com/search?q=' + e], ['AZLyrics (via Google)', 'https://www.google.com/search?q=' + e + '+site:azlyrics.com'], ['Musixmatch', 'https://www.musixmatch.com/search/' + encodeURIComponent(q)], ['YouTube (lyric video)', 'https://www.youtube.com/results?search_query=' + e], ['Google', 'https://www.google.com/search?q=' + e]];
    $('#lsWR').innerHTML = src.map(s => `<a class="ls-link" target="_blank" rel="noopener noreferrer" href="${esc(s[1])}">🔗 ${esc(s[0])}</a>`).join('');
}
function settingsModal() {
    openModal(`<h2>Lyrics Studio settings</h2>
<label>Songs panel is on the<select id="lsSSwap"><option value="0" ${S.prefs.swap ? '' : 'selected'}>Left (display options on the right)</option><option value="1" ${S.prefs.swap ? 'selected' : ''}>Right (display options on the left)</option></select></label>
<label>Lines per slide for new songs<select id="lsSLines"><option value="1">1 line</option><option value="2">2 lines</option><option value="4">4 lines</option><option value="all">Whole verse</option></select></label>
<div class="ls-row"><button data-act="setdef">Use this song's look for new songs</button><button data-act="lookall">Apply this song's look to ALL songs</button><button data-act="lookreset">Reset this song's look</button></div>
<div class="ls-muted">Songs are saved in this browser, appear in the Lyrics tab, and are included when you save a profile.</div>
<div class="ls-row" style="justify-content:flex-end"><button class="pri" data-act="msave">Done</button></div>`);
    $('#lsSLines').value = S.prefs.lines;
}

// ---------- moving the text ----------
function nudgeBy(dx, dy) { const song = curSong(); if (!song) return; setStyle({ nx: clamp(+((song.style.nx || 0) + dx).toFixed(2), -48, 48), ny: clamp(+((song.style.ny || 0) + dy).toFixed(2), -48, 48) }, 'nudge'); }
function nudgeReset() { setStyle({ nx: 0, ny: 0 }, ''); }
function updMove(ctrl) { el.box.classList.toggle('ls-move', !!(ctrl || S.nudge)); }

// ---------- events ----------
function lookAll() {
    const song = curSong(); if (!song) return; if (!confirm('Give every song the same look as this one (font, colours, background, display style)?')) return;
    lib().forEach(s => { s.style = Object.assign(clone(STYLE_DEF), clone(song.style)); }); S.dirty = true; flush(); renderCards(); toast('Look applied to all songs');
}
function onAct(act, d, e) {
    const song = curSong();
    switch (act) {
        case 'close': closeStudio(); break;
        case 'freeze': { const b = document.getElementById('freezeLiveBtn'); if (b) b.click(); syncTop(); break; }
        case 'proj': { const song = curSong(); if (song && song.slides.length) { finishEdit(); goSlide(S.idx); } break; }
        case 'undo': undo(); break; case 'redo': redo(); break;
        case 'keys': $('#lsKeys').classList.toggle('open'); break;
        case 'settings': settingsModal(); break;
        case 'newsong': newSongModal(); break;
        case 'web': webModal(); break;
        case 'wgo': webResults(); break;
        case 'importmenu': { const r = e.target.getBoundingClientRect(); showMenu([['file', 'From a file (PDF, Word, txt)…'], ['paste', 'Paste lyrics…'], '-', ['json', 'Songs backup (.json)…']], r.left, r.bottom + 4); break; }
        case 'mclose': closeModal(); break;
        case 'mcreate': { const t = $('#lsNT').value, l = $('#lsNL').value; if (!l.trim()) { toast('Paste some lyrics first'); break; } closeModal(); createSong(t, l, $('#lsNM').value); break; }
        case 'msave': S.prefs.swap = $('#lsSSwap').value === '1'; S.prefs.lines = $('#lsSLines').value; savePrefs(); applyLayout(); closeModal(); syncLook(); break;
        case 'setdef': if (song) { S.prefs.defStyle = clone(song.style); savePrefs(); toast('New songs will start with this look'); } break;
        case 'lookall': lookAll(); break;
        case 'lookreset': if (song) setStyle(defStyle(), ''); break;
        case 'songdel': deleteSongs(Array.from(S.songSel)); break;
        case 'songsetlist': setAdd(Array.from(S.songSel)); break;
        case 'songexport': { const sel = lib().filter(s => S.songSel.has(s.id)); download('ebp-songs.json', JSON.stringify({ ebpSongs: 1, songs: sel }, null, 1)); break; }
        case 'bold': if (song) setStyle({ bold: !song.style.bold }, 'bold'); break;
        case 'italic': if (song) setStyle({ italic: !song.style.italic }, 'italic'); break;
        case 'lookall2': break;
        case 'disp': if (song) setStyle(d.v === 'lower' ? { layout: 'mode-lowerthird', transparent: true } : { layout: 'mode-center', transparent: false }, ''); break;
        case 'nudge': S.nudge = !S.nudge; updMove(false); syncLook(); toast(S.nudge ? 'Drag the text on the scene to move it. Ctrl+0 puts it back.' : 'Text moving is off (hold Ctrl and drag to move)'); break;
        case 'swatch': if (song) setStyle({ bgColor: d.v, bgPreset: '', bgImg: '' }, ''); break;
        case 'bgimg': $('#lsBgFile').click(); break;
        case 'bgclear': if (song) setStyle({ bgImg: '' }, ''); break;
        case 'loop': S.prefs.loop = !S.prefs.loop; savePrefs(); syncPlay(); break;
        case 'pause': S.paused = !S.paused; if (S.paused) runStop(); else runSchedule(); syncPlay(); break;
        case 'blank': toggleBlank(); break;
        case 'addsec': addSlide(d.v || ''); break;
        case 'dup': dupSel(); break; case 'del': delSel(); break; case 'selnone': S.sel = new Set(); renderCards(); break;
        case 'setadd': if (song) setAdd([song.id]); break;
        case 'setclear': S.setlist.items = []; saveSetlist(); renderSetlist(); break;
        case 'setnext': { const a = S.setlist.items; if (!a.length) { toast('The setlist is empty'); break; } const i = a.indexOf(S.songId); const n = a[(i + 1) % a.length]; openSong(n); break; }
        case 'setup': setMove(+d.i, -1); break; case 'setdown': setMove(+d.i, 1); break;
        case 'setrm': S.setlist.items.splice(+d.i, 1); saveSetlist(); renderSetlist(); break;
    }
}
function bind() {
    const root = el.root;
    root.addEventListener('click', (e) => {
        if (!e.target.closest('.ls-keys') && !e.target.closest('[data-act="keys"]')) $('#lsKeys').classList.remove('open');
        const m = e.target.closest('#lsMenu button');
        if (m) { menuPick(m.dataset.m); hideMenu(); return; }
        if (!e.target.closest('#lsMenu')) hideMenu();
        const card = e.target.closest('.ls-card[data-i]');
        if (card) { const song = curSong(); const i = +card.dataset.i; if (!song) return; const id = song.slides[i].id;
            if (e.ctrlKey || e.metaKey) { if (S.sel.has(id)) S.sel.delete(id); else S.sel.add(id); renderCards(); } else if (e.shiftKey && S.idx !== i) { S.sel = new Set(song.slides.slice(Math.min(S.idx, i), Math.max(S.idx, i) + 1).map(s => s.id)); renderCards(); } else goSlide(i);
            return; }
        const sg = e.target.closest('.ls-song[data-song]');
        if (sg) { const id = sg.dataset.song; if (e.ctrlKey || e.metaKey) { if (S.songSel.has(id)) S.songSel.delete(id); else S.songSel.add(id); renderSongs(); } else { S.songSel = new Set(); openSong(id); } return; }
        const si = e.target.closest('.ls-setitem[data-set]');
        if (si && !e.target.closest('button')) { openSong(S.setlist.items[+si.dataset.set]); return; }
        const a = e.target.closest('[data-act]'); if (a) onAct(a.dataset.act, a.dataset, e);
    });
    root.addEventListener('contextmenu', (e) => {
        const card = e.target.closest('.ls-card[data-i]'); const sg = e.target.closest('.ls-song[data-song]');
        if (card) { e.preventDefault(); const song = curSong(); const id = song.slides[+card.dataset.i].id; if (!S.sel.has(id)) { S.sel = new Set([id]); S.idx = +card.dataset.i; renderCards(); renderScene(); }
            showMenu([['dup', 'Duplicate'], ['left', 'Move earlier'], ['right', 'Move later'], '-', ['av', 'Add Verse after'], ['ac', 'Add Chorus after'], ['ab', 'Add Bridge after'], ['ab0', 'Add blank slide after'], '-', ['del', 'Delete']], e.clientX, e.clientY); }
        else if (sg) { e.preventDefault(); S.menuSong = sg.dataset.song; showMenu([['open', 'Open'], ['rename', 'Rename…'], ['dupsong', 'Duplicate song'], ['exp', 'Export'], '-', ['delsong', 'Delete song']], e.clientX, e.clientY); }
    });
    root.addEventListener('input', (e) => {
        const t = e.target; const song = curSong();
        if (t.id === 'lsSearch') { S.q = t.value; renderSongs(); }
        else if (t.id === 'lsEdit') { const sl = curSlide(); if (sl) { sl.text = t.value; touch(); renderScene(); renderCards(); pushLive(); } }
        else if (t.id === 'lsLabel') { const sl = curSlide(); if (sl) { if (!t._snapped) { snap(); t._snapped = true; } sl.sec = t.value; touch(); renderCards(); } }
        else if (t.id === 'lsDim') setStyle({ dim: +t.value }, 'dim');
        else if (t.id === 'lsPanel') setStyle({ panel: t.checked }, '');
        else if (t.id === 'lsSecsIn') { S.prefs.secs = clamp(parseFloat(t.value) || 8, 1, 600); savePrefs(); runSchedule(); }
        else if (t.dataset && t.dataset.sk && song && (t.type === 'color')) setStyle({ [t.dataset.sk]: t.value }, t.dataset.sk);
    });
    root.addEventListener('change', (e) => {
        const t = e.target; const song = curSong();
        if (t.id === 'lsLabel') { t._snapped = false; renderScene(); }
        else if (t.dataset && t.dataset.sk && song && t.type !== 'color') setStyle({ [t.dataset.sk]: t.value }, '');
        else if (t.id === 'lsPreset') setStyle({ bgPreset: t.value, bgImg: t.value ? '' : song && song.style.bgImg }, '');
        else if (t.id === 'lsLines') resplit(t.value);
        else if (t.id === 'lsRef') { S.prefs.ref = t.value; savePrefs(); renderScene(); pushLive(); }
        else if (t.id === 'lsAuto') { S.prefs.auto = t.checked; savePrefs(); if (S.prefs.auto) { S.paused = false; runSchedule(); } else runStop(); syncPlay(); }
        else if (t.id === 'lsTransMs') { const m = document.getElementById('displayTransitionMs'); if (m) { m.value = t.value; m.dispatchEvent(new Event('change')); } }
        else if (t.id === 'lsTrans') { const m = document.getElementById('displayTransitionSelector'); if (m) { m.value = t.value; m.dispatchEvent(new Event('change')); } }
        else if (t.id === 'lsBgFile') { const f = t.files[0]; t.value = ''; if (f && song) bgFromFile(f); }
    });
    root.addEventListener('keydown', (e) => {
        if (e.target.id === 'lsEdit' && e.key === 'Escape') { e.preventDefault(); finishEdit(); }
        if (e.target.id === 'lsNT' && e.key === 'Enter') { const l = $('#lsNL'); if (l) l.focus(); }
        if (e.target.id === 'lsWQ' && e.key === 'Enter') webResults();
    });
    function textBounds() {
        const out = $('.text-out', el.canvas), tpl = $('.ltt', el.canvas);
        if (tpl && tpl.getBoundingClientRect().width > 5) return tpl.getBoundingClientRect();
        if (!out || !out.textContent.trim() || out.offsetParent === null) return null;
        const r = document.createRange(); r.selectNodeContents(out); const b = r.getBoundingClientRect(); return b.width > 2 ? b : null;
    }
    function measure() {
        const b = textBounds(); if (!b) return null; const c = el.canvas.getBoundingClientRect();
        return { b, c, dx: (b.left + b.width / 2) - (c.left + c.width / 2), dy: (b.top + b.height / 2) - (c.top + c.height / 2) };
    }
    function drawGuides(m) {
        const g = $('#lsGuides'); if (!m) { g.classList.remove('show'); return; }
        const sb = el.box.getBoundingClientRect(), hx = Math.abs(m.dx) < 1.5, hy = Math.abs(m.dy) < 1.5;
        const v = $('#lsGv'), h = $('#lsGh'), x = $('#lsGb');
        v.style.left = (m.c.left - sb.left + m.c.width / 2) + 'px'; v.style.top = (m.c.top - sb.top) + 'px'; v.style.height = m.c.height + 'px'; v.classList.toggle('hit', hx);
        h.style.top = (m.c.top - sb.top + m.c.height / 2) + 'px'; h.style.left = (m.c.left - sb.left) + 'px'; h.style.width = m.c.width + 'px'; h.classList.toggle('hit', hy);
        x.style.left = (m.b.left - sb.left - 4) + 'px'; x.style.top = (m.b.top - sb.top - 4) + 'px'; x.style.width = (m.b.width + 8) + 'px'; x.style.height = (m.b.height + 8) + 'px'; x.classList.toggle('hit', hx || hy);
        g.classList.add('show');
    }
    function guides(snapIt) {   // green guides: lines turn solid when the text is centred; the box snaps to the centre when it gets close
        let m = measure(); const song = curSong(); if (!m || !song) { drawGuides(null); return; }
        { // keep the text inside the screen: it can never be pushed off the edge
            const mg = m.c.width * 0.01; let ch = false;
            if (m.b.width < m.c.width - 2 * mg) { if (m.b.left < m.c.left + mg) { song.style.nx = +((song.style.nx || 0) + (m.c.left + mg - m.b.left) / m.c.width * 100).toFixed(2); ch = true; } else if (m.b.right > m.c.right - mg) { song.style.nx = +((song.style.nx || 0) - (m.b.right - m.c.right + mg) / m.c.width * 100).toFixed(2); ch = true; } }
            if (m.b.height < m.c.height - 2 * mg) { if (m.b.top < m.c.top + mg) { song.style.ny = +((song.style.ny || 0) + (m.c.top + mg - m.b.top) / m.c.width * 100).toFixed(2); ch = true; } else if (m.b.bottom > m.c.bottom - mg) { song.style.ny = +((song.style.ny || 0) - (m.b.bottom - m.c.bottom + mg) / m.c.width * 100).toFixed(2); ch = true; } }
            if (ch) { renderScene(); m = measure() || m; }
        }
        if (snapIt) {
            let ch = false;
            if (Math.abs(m.dx) < 6) { song.style.nx = +((song.style.nx || 0) - m.dx / m.c.width * 100).toFixed(2); ch = true; }
            if (Math.abs(m.dy) < 6) { song.style.ny = +((song.style.ny || 0) - m.dy / m.c.width * 100).toFixed(2); ch = true; }
            if (ch) { renderScene(); m = measure(); }
        }
        drawGuides(m);
    }
    S.guides = (snapIt) => guides(snapIt);
    S.hideGuides = () => drawGuides(null);
    let drag = null, raf = 0;
    el.canvas.addEventListener('pointerdown', (e) => {
        if (!(e.ctrlKey || e.metaKey || S.nudge) || e.button !== 0) return; const song = curSong(); if (!song) return;
        drag = { x: e.clientX, y: e.clientY, nx: song.style.nx || 0, ny: song.style.ny || 0, w: el.canvas.getBoundingClientRect().width || 1, moved: false };
        try { el.canvas.setPointerCapture(e.pointerId); } catch (x) {}
    });
    el.canvas.addEventListener('pointermove', (e) => {
        if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved) { if (Math.hypot(dx, dy) < 4) return; drag.moved = true; finishEdit(); snap(); }
        const song = curSong(); if (!song) return; song.style.nx = clamp(+(drag.nx + dx / drag.w * 100).toFixed(2), -48, 48); song.style.ny = clamp(+(drag.ny + dy / drag.w * 100).toFixed(2), -48, 48);
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; touch(); renderScene(); guides(true); pushLive(); });
    });
    const endDrag = () => { if (drag && drag.moved) { setTimeout(S.hideGuides, 350); S.justDragged = true; setTimeout(() => { S.justDragged = false; }, 50); renderCards(); } drag = null; };
    el.canvas.addEventListener('pointerup', endDrag); el.canvas.addEventListener('pointercancel', endDrag);
    el.canvas.addEventListener('click', (e) => { if (S.justDragged) return; if ((e.ctrlKey || e.metaKey) && !S.nudge) return; if (!S.editing) beginEdit(); });
    window.addEventListener('keydown', (e) => { if (S.open && (e.key === 'Control' || e.key === 'Meta')) updMove(true); }, true);
    window.addEventListener('keyup', (e) => { if (S.open && (e.key === 'Control' || e.key === 'Meta')) updMove(false); }, true);
    el.edit.addEventListener('blur', () => { setTimeout(finishEdit, 0); });
    // drag cards (only when Ctrl is held when the drag starts)
    const cards = $('#lsCards');
    cards.addEventListener('dragstart', (e) => {
        const c = e.target.closest('.ls-card[data-i]'); const song = curSong();
        if (!c || !song || !(e.ctrlKey || e.metaKey)) { e.preventDefault(); return; }
        const id = song.slides[+c.dataset.i].id; if (!S.sel.has(id)) S.sel = new Set([id]);
        S.dragIds = song.slides.filter(s => S.sel.has(s.id)).map(s => s.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'ebp-lyrics');
    });
    const clearDrop = () => $$('.ls-card.dropb,.ls-card.dropa', cards).forEach(c => c.classList.remove('dropb', 'dropa'));
    cards.addEventListener('dragover', (e) => {
        if (!S.dragIds) return; const c = e.target.closest('.ls-card[data-i]'); if (!c) return; e.preventDefault(); clearDrop();
        const r = c.getBoundingClientRect(); const after = e.clientX > r.left + r.width / 2; c.classList.add(after ? 'dropa' : 'dropb'); S.dropTo = { i: +c.dataset.i, after };
    });
    cards.addEventListener('drop', (e) => { if (!S.dragIds || !S.dropTo) return; e.preventDefault(); const ids = S.dragIds, to = S.dropTo; S.dragIds = null; S.dropTo = null; clearDrop(); reorder(ids, to.i, to.after); });
    cards.addEventListener('dragend', () => { S.dragIds = null; S.dropTo = null; clearDrop(); });
    window.addEventListener('keydown', onKey, true);
}
async function bgFromFile(file) {
    try {
        const dataUrl = await shrinkImage(file); const rec = { id: 'lyr_' + uid(), name: '[LYRICS BG] ' + file.name, dataUrl };
        await imgPut(rec); registerAsset(rec); setStyle({ bgImg: rec.id, bgPreset: '' }, ''); toast('Background added');
    } catch (e) { toast(e.message || 'Could not use that picture'); }
}
function menuPick(m) {
    const song = curSong();
    if (m === 'file') { pickFile('.pdf,.docx,.doc,.txt', async (f) => { try { toast('Reading ' + f.name + '…'); const t = await readLyricsFile(f); newSongModal(f.name.replace(/\.[^.]+$/, ''), t); } catch (e) { toast(e.message); } }); }
    else if (m === 'paste') newSongModal();
    else if (m === 'json') pickFile('.json', async (f) => { try { const o = JSON.parse(await f.text()); const n = mergeSongs(o.songs || o); toast(n + ' song' + (n === 1 ? '' : 's') + ' imported'); renderSongs(); } catch (e) { toast('That file is not a songs backup'); } });
    else if (m === 'dup') dupSel(); else if (m === 'del') delSel(); else if (m === 'left') moveSel(-1); else if (m === 'right') moveSel(1);
    else if (m === 'av') addSlide('Verse'); else if (m === 'ac') addSlide('Chorus'); else if (m === 'ab') addSlide('Bridge'); else if (m === 'ab0') addSlide('');
    else if (m === 'open') openSong(S.menuSong);
    else if (m === 'rename') { const s = lib().find(x => x.id === S.menuSong); if (!s) return; const n = prompt('Song title', s.title); if (n && n.trim()) { s.title = n.trim(); S.dirty = true; flush(); refreshAll(); } }
    else if (m === 'dupsong') { const s = lib().find(x => x.id === S.menuSong); if (s) { const c = clone(s); c.id = 'song_' + Date.now(); c.title += ' (copy)'; delete c.slides; delete c.lyricsStudio; lib().push(c); S.dirty = true; flush(); openSong(c.id); } }
    else if (m === 'tosl') setAdd([S.menuSong]);
    else if (m === 'exp') { const s = lib().find(x => x.id === S.menuSong); if (s) download((s.title || 'song') + '.json', JSON.stringify({ ebpSongs: 1, songs: [s] }, null, 1)); }
    else if (m === 'delsong') deleteSongs([S.menuSong]);
}
function pickFile(accept, cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.style.display = 'none'; document.body.appendChild(i); i.onchange = () => { const f = i.files[0]; i.remove(); if (f) cb(f); }; i.click(); }

function onKey(e) {
    if (!S.open) return; const t = e.target; const typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName); const mod = e.ctrlKey || e.metaKey; const k = e.key;
    const stop = () => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    if (k === 'Escape') { if ($('#lsModal').classList.contains('open')) closeModal(); else if (el.menu.classList.contains('open')) hideMenu(); else if ($('#lsKeys').classList.contains('open')) $('#lsKeys').classList.remove('open'); else if (S.editing) finishEdit(); else return; stop(); return; }
    if ($('#lsModal').classList.contains('open')) { e.stopPropagation(); return; }
    if (S.editing || typing) { if (mod && k === 'Enter') { stop(); finishEdit(); sendLive(S.idx); } else if (k.length === 1 || k === 'Enter' || k === 'Backspace' || k === 'Delete' || k.startsWith('Arrow')) e.stopPropagation(); return; }
    const kl = k.toLowerCase();
    if (mod && kl === 'z') { stop(); e.shiftKey ? redo() : undo(); }
    else if (mod && kl === 'y') { stop(); redo(); }
    else if (mod && kl === 'd') { stop(); dupSel(); }
    else if (mod && kl === 'a') { stop(); const s = curSong(); if (s) { S.sel = new Set(s.slides.map(x => x.id)); renderCards(); } }
    else if (mod && kl === 'n') { stop(); newSongModal(); }
    else if (mod && kl === 'f') { stop(); $('#lsSearch').focus(); $('#lsSearch').select(); }
    else if (mod && k === 'Enter') { stop(); sendLive(S.idx); }
    else if (mod && k === '0') { stop(); nudgeReset(); S.guides(false); clearTimeout(S.gT); S.gT = setTimeout(S.hideGuides, 900); }
    else if (mod && k.startsWith('Arrow')) { stop(); const n = e.shiftKey ? 2 : 0.5; nudgeBy(k === 'ArrowLeft' ? -n : k === 'ArrowRight' ? n : 0, k === 'ArrowUp' ? -n : k === 'ArrowDown' ? n : 0); S.guides(false); clearTimeout(S.gT); S.gT = setTimeout(S.hideGuides, 900); }
    else if (mod) return;
    else if (k === 'ArrowRight' || k === 'PageDown' || k === 'ArrowDown') { stop(); step(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') { stop(); step(-1); }
    else if (k === 'Delete' || k === 'Backspace') { stop(); delSel(); }
    else if (k === 'Enter' || k === 'F2') { stop(); beginEdit(); }
    else if (kl === 'b') { stop(); toggleBlank(); }
    else if (/^[1-9]$/.test(k)) { const s = curSong(); if (s && s.slides[+k - 1]) { stop(); goSlide(+k - 1); } }
    else if (k === ' ') { stop(); }
}

// ---------- open / close ----------
function openStudio() {
    buildUI(); S.open = true; el.root.classList.add('open');
    let song = curSong(); if (!song) { const last = lsGet('ebpLyricsLast', null); song = lib().find(s => s.id === last) || lib()[0] || null; S.songId = song ? song.id : null; }
    if (song) ensure(song); S.idx = clamp(S.idx, 0, song ? song.slides.length - 1 : 0);
    refreshAll(); el.root.focus(); setSaved('');
    if (!song) newSongModal();
}
function closeStudio() { finishEdit(); hideMenu(); closeModal(); $('#lsKeys').classList.remove('open'); if (S.dirty) flush(); runStop(); S.open = false; if (el.root) el.root.classList.remove('open'); }

// ---------- profile hooks (main screen Save / Load profile) ----------
window.ebpLyricsExport = function () {
    try {
        const songs = clone(lib()); const used = new Set(songs.map(s => s.style && s.style.bgImg).filter(Boolean)); const imgs = {};
        used.forEach(id => { const u = assetUrl(id); if (u) imgs[id] = u; });
        return { v: 1, songs, setlist: clone(S.setlist), prefs: clone(S.prefs), imgs };
    } catch (e) { return undefined; }
};
window.ebpLyricsImport = function (d) {
    try {
        if (!d || !Array.isArray(d.songs)) return;
        Object.entries(d.imgs || {}).forEach(([id, u]) => { if (typeof u === 'string' && u.startsWith('data:image/')) { const rec = { id, name: '[LYRICS BG]', dataUrl: u }; imgPut(rec); registerAsset(rec); } });
        mergeSongs(d.songs);
        if (d.setlist && Array.isArray(d.setlist.items)) { S.setlist = { items: d.setlist.items.filter(x => typeof x === 'string') }; saveSetlist(); }
        if (d.prefs && typeof d.prefs === 'object') { ['swap', 'lines', 'ref', 'secs', 'loop'].forEach(k => { if (d.prefs[k] != null) S.prefs[k] = d.prefs[k]; }); if (d.prefs.defStyle) S.prefs.defStyle = d.prefs.defStyle; savePrefs(); }
        if (S.open) { applyLayout(); refreshAll(); }
    } catch (e) { console.warn('Lyrics Studio import failed', e); }
};

// ---------- start ----------
async function boot() {
    try { const i = document.getElementById('lyricsWebSearchInput'); const blk = i && i.parentElement && i.parentElement.parentElement; if (blk) blk.style.display = 'none'; } catch (e) {}
    ['ebpLyricsStudioBtn', 'ebpLyricsStudioBtn2'].forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', openStudio); });
    (await imgAll()).forEach(registerAsset);
    window.addEventListener('beforeunload', () => { if (S.dirty) flush(); });
    window.ebpLyrics = { open: openStudio, state: S };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
