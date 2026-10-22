/* Express Bible Presenter — Message dashboard (banner / name tag / timer).
   A full-screen workspace like the Lyrics and Slide dashboards. It drives the SAME controls and overlay channels the old Message tab used
   (those controls stay in the page, hidden), so the projector, OBS, output windows and the phone remote behave exactly as before. */
(function () {
'use strict';
if (/[?&]mode=obs\b/.test(location.search)) return;

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const clone = (o) => JSON.parse(JSON.stringify(o));
const g = (id) => document.getElementById(id);
const call = (fn, ...a) => { try { return typeof window[fn] === 'function' ? window[fn](...a) : undefined; } catch (e) { console.warn(fn, e); } };

const COLORS = ['#b45309', '#ea580c', '#dc2626', '#d97706', '#2563eb', '#16a34a', '#7c3aed', '#0f172a'];
const EFFECTS = { none: 'No effect', slide: 'Slide in', bounce: 'Bounce in', flash: 'Flash', fade: 'Fade in / out', breathing: 'Breathing (pulse)', scroll: 'Scrolling text' };
const MODES = [['overlay', 'Overlay only'], ['ontop', 'On top of feed'], ['scene', 'With the scene']];
const ANN_DEF = [
    { id: 'a1', text: 'Service starts in 5 minutes', eff: 'slide', pos: 'bottom', color: '#ea580c', secs: 20 },
    { id: 'a2', text: 'Please silence your phones', eff: 'breathing', pos: 'bottom', color: '#dc2626', secs: 0 },
    { id: 'a3', text: 'Offering time — God bless you', eff: 'fade', pos: 'bottom', color: '#b45309', secs: 0 },
    { id: 'a4', text: 'Children, please go to Sunday School', eff: 'scroll', pos: 'bottom', color: '#2563eb', secs: 30 },
    { id: 'a5', text: 'Please move your car — it is blocking the gate', eff: 'flash', pos: 'top', color: '#dc2626', secs: 15 }
];
const TEMPLATES = [['Welcome', 'Welcome to church — we are glad you are here', '#16a34a'], ['Offering', 'Offering time — God bless you', '#b45309'], ['Silence phones', 'Please silence your phones', '#dc2626'],
    ['Parking', 'Please park carefully and keep the gate clear', '#d97706'], ['Children', 'Children, please go to Sunday School', '#2563eb'], ['Prayer', 'Let us pray', '#7c3aed']];
const TIMER_DEF = [{ id: 't1', min: 1, sec: 0 }, { id: 't2', min: 5, sec: 0 }, { id: 't3', min: 10, sec: 0 }, { id: 't4', min: 15, sec: 0 }, { id: 't5', min: 30, sec: 0 }];
const SAMPLE = { text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', ref: 'John 3:16 (KJV)' };
const DRAFT_A = { id: null, text: '', eff: 'slide', pos: 'bottom', color: '#ea580c', secs: 20 };
const DRAFT_N = { id: null, role: '', name: '', secs: 0 };

const S = { open: false, tab: 'ann', ann: lsGet('ebpMsgAnn', null) || clone(ANN_DEF), names: [], timers: lsGet('ebpMsgTimers', null) || clone(TIMER_DEF),
    d: clone(DRAFT_A), n: clone(DRAFT_N), draft: false, peekT: 0, annT: 0, tagT: 0, poll: 0, sig: '', soloAuto: false, k: 1, root: null };
const saveAnn = () => lsSet('ebpMsgAnn', S.ann), saveNames = () => lsSet('ebpMsgNames', S.names), saveTimers = () => lsSet('ebpMsgTimers', S.timers);

// ============ talking to the main page ============
function setV(id, v, ev) { const e = g(id); if (!e) return; e.value = v; e.dispatchEvent(new Event(ev || 'change', { bubbles: true })); }
function setChk(id, v) { const e = g(id); if (!e || e.checked === !!v) return; e.checked = !!v; e.dispatchEvent(new Event('change', { bubbles: true })); }
const annOn = () => { try { return !!ovAnnActive() || !!previewState.announcementVisible; } catch (e) { return false; } };
const tagOn = () => { try { return !!ntAnyActive(); } catch (e) { return false; } };
const timerRun = () => { const b = g('timerToggleStartBtn'); return !!b && /pause/i.test(b.textContent); };
const timerShown = () => { const c = g('timerVisibilityCheck'); return !!c && c.checked; };
const isFrozen = () => { try { if (typeof isLiveFrozen !== 'undefined') return !!isLiveFrozen; } catch (e) {} return document.body.classList.contains('live-is-frozen'); };
const timerText = () => previewState.timerText || '00:00';
function loadNames() {
    let own = lsGet('ebpMsgNames', null); const mainList = lsGet('ebp_saved_names', []) || [];
    if (!Array.isArray(own)) own = [];
    mainList.forEach(m => { if (m && m.name && !own.some(o => (o.role || '').toLowerCase() === (m.role || '').toLowerCase() && o.name.toLowerCase() === m.name.toLowerCase())) own.push({ id: 'n_' + (m.id || uid('')), role: m.role || '', name: m.name, secs: 0 }); });
    if (!own.length) own = [{ id: 'n1', role: 'Ministering', name: 'Pastor Ade', secs: 0 }];
    S.names = own; saveNames();
}
let toastT = 0;
function toast(t, bad) { const e = $('#msToast'); if (!e) return;
    if (isFrozen() && /live|hidden|on screen|cleared/i.test(t) && !/frozen/i.test(t)) { t += ' FROZEN is on — the projector and OBS keep their current picture until you unfreeze.'; bad = true; } e.textContent = t; e.className = 'show' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => { e.className = ''; }, 2600); }

// which screens will actually receive an overlay right now
function reach(name) {
    const ch = ovCh[name], out = [];
    try {
        if (ch.mode === 'scene') return ['every screen showing the verse'];
        if (ch.t.projector && projectorWindowRef && !projectorWindowRef.closed) out.push('Projector');
        outputSlots.forEach(sl => { if (ch.t.slots[sl.id] && sl.windowRef && !sl.windowRef.closed) out.push(sl.name || 'Output'); });
        if (ch.t.obs) out.push('OBS');
    } catch (e) {}
    return out;
}
function liveToast(label, name) {
    const r = reach(name);
    if (r.length) toast(label + ' is live on: ' + r.join(', ') + '.');
    else toast(label + ' is live on the dashboard. No screen is open yet — open the Projector from the top bar, or pick a screen under "Where it appears".', true);
}
// ---- banner ----
function annApply() { const d = S.d; setV('announcementInput', d.text, 'input'); setV('announcementEffectSelector', d.eff, 'change'); setV('announcementPositionSelector', d.pos, 'change'); setV('announcementColorPicker', d.color, 'input'); }
function annSend() {
    if (!S.d.text.trim()) { toast('Type the announcement text first.', true); return false; }
    annApply(); clearTimeout(S.annT); call('ovReplay');
    if (!(typeof ovAnnActive === 'function' && ovAnnActive())) ovDefaultSend('ann'); else ovRefreshAll();
    if (S.d.secs > 0) S.annT = setTimeout(() => { annHide(true); }, S.d.secs * 1000);
    sync(true); liveToast('Banner', 'ann'); return true;
}
function annHide(quiet) {
    clearTimeout(S.annT); call('ovHide', 'ann');
    if (previewState.announcementVisible) { previewState.announcementVisible = false; call('renderPreview'); }     // a "Stage Alert" drawn inside the scene
    const eye = g('announcementEyeToggleBtn'); if (eye) eye.classList.remove('toggle-active');
    call('transmitStatePacketToRemoteClients'); sync(true); if (!quiet) toast('Banner hidden.');
}
// ---- name tag ----
function tagApply() { const n = S.n; setV('lowerThirdRoleInput', n.role, 'input'); setV('lowerThirdNameInput', n.name, 'input'); previewState.lowerThirdRole = n.role; previewState.lowerThirdName = n.name; }
function tagSend() {
    if (!S.n.role.trim() && !S.n.name.trim()) { toast('Type a role or a name first.', true); return false; }
    tagApply(); clearTimeout(S.tagT); call('ovReplay');
    if (!tagOn()) ovDefaultSend('nt'); else ovRefreshAll();
    if (S.n.secs > 0) S.tagT = setTimeout(() => { tagHide(true); }, S.n.secs * 1000);
    sync(true); liveToast('Name tag', 'nt'); return true;
}
function tagHide(quiet) { clearTimeout(S.tagT); call('ovHide', 'nt'); sync(true); if (!quiet) toast('Name tag hidden.'); }
function ntSet(k, v) {
    if (k === 'motion' || k === 'speed') call('ovReplay');
    ntState[k] = v; call('ntSaveAll'); call('ntRefreshAll'); drawInsp(); renderScene(true); if ((k === 'motion' || k === 'speed') && !tagOn()) peek();
}
// ---- timer ----
function timerSet(min, sec) { setV('timerMinInput', min, 'input'); setV('timerSecInput', sec, 'input'); g('timerResetBtn').click(); }
function timerPos(v) {
    setV('timerPosSelector', v);
    if (v === 'timer-center') { if (!g('timerSoloCheck').checked) { S.soloAuto = true; setChk('timerSoloCheck', true); } }                  // the centre-of-screen timer never shares the screen with text
    else if (S.soloAuto) { S.soloAuto = false; setChk('timerSoloCheck', false); }
}
function timerSend() {
    if (g('timerPosSelector').value === 'timer-center' && !g('timerSoloCheck').checked) { S.soloAuto = true; setChk('timerSoloCheck', true); }
    setChk('timerVisibilityCheck', true); call('transmitStatePacketToRemoteClients'); sync(true);
}
function timerHide() { setChk('timerVisibilityCheck', false); call('transmitStatePacketToRemoteClients'); sync(true); toast('Timer hidden.'); }

// ============ CSS ============
const CSS = `
.ms-root{--ms-bg:#050a14;--ms-bar:#0b1324;--ms-col:#0a1120;--ms-stage:#02050c;--ms-card:#101a2e;--ms-sel:#13223f;--ms-livebg:#1c1220;--ms-line:#1d2b49;--ms-in:#0f1a30;--ms-inb:#23355c;--ms-tab:#111b30;--ms-chip:#13213b;--ms-tplbg:#0b1424;--ms-where:#0d1629;--ms-btn:#1f2a44;--ms-btnh:#2b3a5c;--ms-tx:#e5ecf6;--ms-btx:#f1f5f9;--ms-mu:#7f93b5;--ms-tabtx:#9fb2d3;--ms-hov:#34508a;--ms-green:#4ade80;position:fixed;inset:0;z-index:9000;background:var(--ms-bg);color:var(--ms-tx);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:none;flex-direction:column;font-size:13px}
.ms-root.open{display:flex}.ms-root *{box-sizing:border-box}
.ms-root button{white-space:nowrap;font-family:inherit;cursor:pointer;color:var(--ms-btx);background:var(--ms-btn);border:0;border-radius:8px;padding:7px 12px;font-size:12.5px}
.ms-root button:hover:not(:disabled){background:var(--ms-btnh)}.ms-root button:disabled{opacity:.45;cursor:default}
.ms-root button.p{background:#1d4ed8}.ms-root button.p:hover{background:#2563eb}.ms-root button.d{background:#b91c1c}.ms-root button.d:hover{background:#dc2626}.ms-root button.ok{background:#0f766e}.ms-root button.ok:hover{background:#0d9488}
.ms-root input,.ms-root select{font-family:inherit;font-size:12.5px;background:var(--ms-in);color:var(--ms-tx);border:1px solid var(--ms-inb);border-radius:7px;padding:7px 9px;min-width:0}
.ms-root input:focus,.ms-root select:focus{outline:2px solid #2563eb;outline-offset:0;border-color:#2563eb}
.ms-root input[type=color]{padding:2px;width:34px;height:28px;cursor:pointer;border-radius:8px;background:var(--ms-in)}
.ms-top{display:flex;align-items:center;gap:10px;padding:9px 14px;background:var(--ms-bar);border-bottom:1px solid var(--ms-line)}.ms-top b{font-size:15px;letter-spacing:.5px}.ms-sp{flex:1}
.ms-onair{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--ms-mu)}
.ms-pill{padding:3px 10px;border-radius:12px;background:var(--ms-chip);color:var(--ms-mu);font-size:11.5px;font-weight:600}.ms-pill.on{background:#b91c1c;color:#fff;box-shadow:0 0 10px #ef444488}
.ms-main{flex:1;min-height:0;display:grid;grid-template-columns:320px minmax(0,1fr) 340px}
.ms-col{padding:12px;background:var(--ms-col);overflow:auto;border-right:1px solid var(--ms-line)}.ms-col.r{border-right:0;border-left:1px solid var(--ms-line)}
.ms-tabs{display:flex;gap:4px;margin-bottom:10px}.ms-tabs button{flex:1;padding:8px 4px;background:var(--ms-tab);color:var(--ms-tabtx);position:relative}.ms-tabs button.on{background:#1d4ed8;color:#fff}
.ms-tabs i{position:absolute;top:5px;right:6px;width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px #ef4444;display:none}.ms-tabs i.on{display:block}
.ms-h{font-size:10px;letter-spacing:1.2px;color:var(--ms-mu);margin:12px 0 7px;font-weight:700;text-transform:uppercase}.ms-h:first-child{margin-top:2px}
.ms-card{background:var(--ms-card);border:1px solid var(--ms-line);border-radius:9px;padding:8px 9px;margin-bottom:6px;display:flex;align-items:center;gap:8px;cursor:pointer}
.ms-card:hover{border-color:var(--ms-hov)}.ms-card.sel{border-color:#3b82f6;background:var(--ms-sel)}.ms-card.live{border-color:#dc2626;background:var(--ms-livebg)}
.ms-card .t{flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ms-card small{display:block;color:var(--ms-mu);font-size:10.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis}
.ms-dot{width:9px;height:9px;border-radius:50%;flex:none}
.ms-go{flex:none;width:28px;height:28px;padding:0!important;border-radius:50%!important;background:#1d4ed8!important;display:grid;place-items:center}.ms-go.on{background:#dc2626!important;box-shadow:0 0 10px #dc2626}
.ms-x{flex:none;padding:2px 7px!important;background:none!important;color:var(--ms-mu)!important}.ms-x:hover{color:#f87171!important}
.ms-new{justify-content:center;color:#60a5fa;border-style:dashed}
.ms-chips{display:flex;gap:5px;flex-wrap:wrap}.ms-root button.ms-chip{padding:5px 10px;border-radius:14px;background:var(--ms-chip);color:var(--ms-tabtx);font-size:11.5px}.ms-root button.ms-chip.on{background:#1d4ed8;color:#fff}
.ms-stage{display:flex;flex-direction:column;gap:10px;padding:12px;min-width:0;background:var(--ms-stage)}
.ms-box{position:relative;flex:1;min-height:200px;border-radius:10px;overflow:hidden;background:var(--ms-col);border:1px solid var(--ms-line)}
.ms-fit{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0}
.ms-fit .display-canvas{cursor:default;border:0;box-shadow:none}
.ms-fit .ms-draft{opacity:.5;outline:4px dashed #7dd3fc;outline-offset:-4px}
.ms-fit .ms-draft::after{content:'DRAFT — not on screen';position:absolute;right:10px;top:-34px;background:#0369a1;color:#fff;font:700 22px system-ui;padding:3px 12px;border-radius:5px;white-space:nowrap;text-shadow:none;letter-spacing:0;animation:none;translate:none}
.ms-fit .ov-ann.ms-draft::after{top:auto;bottom:calc(100% + 6px)}
.ms-fit .ov-ann-top.ms-draft::after{top:calc(100% + 6px);bottom:auto}
.ms-bar{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:1px;color:var(--ms-mu)}.ms-bar b{font-size:10.5px}
#msFrozenTag{display:none;background:#f59e0b;color:#1c1917;padding:3px 10px;border-radius:12px;font-weight:800;letter-spacing:.3px}#msFrozenTag.on{display:inline-block}
.ms-root button.fz{background:#f59e0b;color:#1c1917;font-weight:800;box-shadow:0 0 0 2px #fbbf2466}.ms-root button.fz:hover{background:#fbbf24}
.ms-root button.pv.on{background:#0369a1}
.ms-dock{background:var(--ms-col);border:1px solid var(--ms-line);border-radius:10px;padding:10px 12px}
.ms-dock .ms-row{margin-bottom:8px}.ms-dock .ms-row:last-child{margin-bottom:0}
.ms-dock .ms-row>label.l{width:66px}
.ms-dock .ms-two{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}
.ms-dock .ms-two .ms-row{margin:0}
.ms-dock .ms-act{display:flex;gap:10px;align-items:center;margin-top:10px}.ms-dock .ms-act .ms-primary{flex:1;width:auto}
.ms-dock .ms-act .ms-note{flex:none;min-width:150px}
.ms-row{display:flex;align-items:center;gap:7px;margin-bottom:9px;flex-wrap:wrap}.ms-row>label.l{width:66px;flex:none;color:var(--ms-mu);font-size:11.5px}.ms-row .f{flex:1;min-width:0}
.ms-sw{width:22px;height:22px;border-radius:50%;border:2px solid #fff2;padding:0!important;flex:none}.ms-root button.ms-sw.on{border-color:#fff}
.ms-big{font:800 44px ui-monospace,Consolas,monospace;color:var(--ms-green);text-align:center;padding:2px 0;letter-spacing:2px}.ms-big.zero{color:#f87171}
.ms-state{text-align:center;font-size:11px;color:var(--ms-mu);margin-bottom:8px}
.ms-tpl{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;max-height:230px;overflow:auto;margin-bottom:8px}
.ms-tpl>div{position:relative;aspect-ratio:16/6;border-radius:7px;background:var(--ms-tplbg);border:1px solid var(--ms-line);cursor:pointer;overflow:hidden;container-type:inline-size;--canvas-font-size:11cqw;--nt-s:.8;display:flex;align-items:center;padding-left:8px}
.ms-tpl>div.on{border-color:#3b82f6;box-shadow:0 0 0 1px #3b82f6}
.ms-cols{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin-bottom:8px}.ms-cols label{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ms-mu)}
.ms-primary{width:100%;padding:10px 12px!important;font-size:13.5px!important;font-weight:700}
.ms-note{font-size:11px;color:var(--ms-mu);line-height:1.45}
.ms-where{background:var(--ms-where);border:1px solid var(--ms-line);border-radius:9px;padding:9px;margin-bottom:10px}
#msToast{position:absolute;left:50%;bottom:120px;max-width:560px;text-align:center;transform:translateX(-50%) translateY(8px);background:#0f766e;color:#fff;padding:8px 16px;border-radius:8px;font-weight:600;opacity:0;pointer-events:none;transition:.2s;z-index:5;box-shadow:0 6px 24px #0008}
#msToast.show{opacity:1;transform:translateX(-50%) translateY(0)}#msToast.bad{background:#b45309}
@media(max-width:1150px){.ms-main{grid-template-columns:260px minmax(0,1fr) 300px}}

html[data-theme="light"] .ms-root{--ms-bg:#eef2f7;--ms-bar:#ffffff;--ms-col:#f8fafc;--ms-stage:#dde4ee;--ms-card:#ffffff;--ms-sel:#e3edff;--ms-livebg:#fff1f1;--ms-line:#cbd5e1;--ms-in:#ffffff;--ms-inb:#aebbd0;--ms-tab:#e2e8f0;--ms-chip:#e2e8f0;--ms-tplbg:#f1f5f9;--ms-where:#f1f5f9;--ms-btn:#e2e8f0;--ms-btnh:#cfd8e6;--ms-tx:#0f172a;--ms-btx:#0f172a;--ms-mu:#52617a;--ms-tabtx:#334155;--ms-hov:#7c9bd0;--ms-green:#15803d;}
.ms-root button.p,.ms-root button.d,.ms-root button.ok,.ms-root button.ms-go,.ms-root button.ms-chip.on,.ms-root button.pv.on,.ms-root .ms-tabs button.on,.ms-root .ms-pill.on{color:#fff}
.ms-root button.ms-x{color:var(--ms-mu)}.ms-root button.ms-x:hover{color:#ef4444}
.ms-root .ms-fit .display-canvas{color-scheme:dark}
`;

// ============ build ============
function build() {
    if (S.root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const r = document.createElement('div'); r.className = 'ms-root'; r.id = 'msRoot'; r.tabIndex = -1;
    r.innerHTML = `
<div class="ms-top"><b>💬 MESSAGE</b><span class="ms-sp"></span>
  <button id="msFreeze" title="Freeze the live verse / lyrics. Banner, name tag and timer are not affected.">❄ Freeze</button>
  <button class="d" id="msClear" title="Hide the banner, name tag and timer from every screen">■ Clear everything</button><button id="msClose">✕ Close</button></div>
<div id="msToast"></div>
<div class="ms-main">
  <div class="ms-col"><div class="ms-tabs"><button data-t="ann">Announcements<i></i></button><button data-t="tag">Name tags<i></i></button><button data-t="tim">Timer<i></i></button></div><div id="msList"></div></div>
  <div class="ms-stage"><div class="ms-bar"><b>LIVE MONITOR</b><span id="msFrozenTag"></span><span class="ms-sp"></span><button id="msDraft" title="Show a faint preview of what you are editing (it is NOT on any screen)">👁 Preview my draft</button></div><div class="ms-box" id="msBox"><div class="ms-fit" id="msFit"><div id="msCanvas" class="display-canvas mode-center size-large" style="width:1920px;height:1080px;max-width:none"></div></div></div>
    <div class="ms-dock" id="msDock"></div>
    <div class="ms-note">This monitor shows only what is really on air. Use <b>Preview my draft</b> to see what you are editing — it appears faint with a dashed outline and is never sent to a screen. Banner, name tag and timer never replace the verse, lyrics or slides.</div></div>
  <div class="ms-col r" id="msInsp"></div>
</div>`;
    document.body.appendChild(r); S.root = r;
    $$('.ms-tabs button', r).forEach(b => b.addEventListener('click', () => { S.tab = b.dataset.t; drawAll(); }));
    $('#msClose', r).addEventListener('click', close);
    $('#msClear', r).addEventListener('click', () => { annHide(true); tagHide(true); timerHide(); toast('Everything cleared.'); });
    $('#msFreeze', r).addEventListener('click', () => { const b = g('freezeLiveBtn'); if (b) b.click(); sync(true); setTimeout(() => sync(true), 120); toast(isFrozen() ? 'Verse / lyrics output FROZEN — screens keep showing what they show now.' : 'Unfrozen — screens follow the dashboard again.'); });
    $('#msDraft', r).addEventListener('click', () => { S.draft = !S.draft; $('#msDraft', r).classList.toggle('on', S.draft); renderScene(true); });
    r.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { const t = e.target; if (t && /^(INPUT|SELECT)$/.test(t.tagName)) { t.blur(); e.stopPropagation(); return; } close(); }
        if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); const p = $('#msPrimary'); if (p && !p.dataset.on) p.click(); }
        e.stopPropagation();
    });
    window.addEventListener('resize', () => { if (S.open) fitScene(); });
}
function fitScene() {
    const b = $('#msBox'); if (!b) return; const w = b.clientWidth, h = b.clientHeight; if (!w || !h) return;
    const k = Math.min(w / 1920, h / 1080); S.k = k;
    $('#msFit').style.transform = `translate(${Math.round((w - 1920 * k) / 2)}px,${Math.round((h - 1080 * k) / 2)}px) scale(${k})`;
}

// show the draft for a few seconds (used by Replay) without leaving the draft view on
function peek() { clearTimeout(S.peekT); S.peekT = setTimeout(() => { S.peekT = 0; renderScene(true); }, 4000); renderScene(true); }
// ============ scene preview ============
function tagPart(role, name) {
    const mo = (typeof NT_MOTIONS !== 'undefined' && ntState.motion && ntState.motion !== 'none' && NT_MOTIONS[ntState.motion]) ? ' ntm-' + ntState.motion : '';
    const md = { slow: 1.3, normal: 0.75, fast: 0.4 }[ntState.speed] || 0.75;
    return `<div class="ntl-pos ntl-${ntState.pos}${mo}" style="--ntm-d:${md}s">${ntTagHtml(ntState.tpl, ntStyle(), esc(role), esc(name))}</div>`;
}
function annPart(d, draft) {
    if (!d.text.trim()) return '';
    const inner = d.eff === 'scroll' ? `<span class="ov-tick">${esc(d.text)}</span>` : esc(d.text);
    const eff = ['breathing', 'fade', 'slide', 'flash', 'bounce'].includes(d.eff) ? ' ov-eff-' + d.eff : '';
    return `<div class="ov-ann ov-ann-${d.pos}${eff}${draft ? ' ms-draft' : ''}" style="background:${d.color}">${inner}</div>`;
}
let sceneSig = '';
function renderScene(force) {
    fitScene();
    const c = $('#msCanvas'); if (!c) return;
    const aLive = annOn(), tLive = tagOn(), mLive = timerShown();
    // what to draw: what is really live (its live values) — and, on the tab being edited, the draft (dashed) if it is not live yet
    const aD = aLive ? { text: g('announcementInput').value, eff: g('announcementEffectSelector').value, pos: g('announcementPositionSelector').value, color: g('announcementColorPicker').value } : S.d;
    const peek = S.draft || S.peekT;
    const showA = aLive || (peek && S.tab === 'ann');
    const tRole = tLive ? (previewState.lowerThirdRole || '') : S.n.role, tName = tLive ? (previewState.lowerThirdName || '') : S.n.name;
    const showT = (tLive || (peek && S.tab === 'tag')) && (tRole.trim() || tName.trim());
    const showM = mLive || (peek && S.tab === 'tim');
    const st = Object.assign({}, previewState, { text: previewState.text || SAMPLE.text, ref: previewState.text ? previewState.ref : SAMPLE.ref,
        displayMode: previewState.displayMode === 'media' ? 'text' : previewState.displayMode, timerVisible: showM, timerSolo: mLive ? previewState.timerSolo : false,
        announcementVisible: false, ovScene: showT ? `<div class="ntl ntw ov-scene"><div class="ntl-frame" style="--nt-s:${ntState.scale / 100}">${tagPart(tRole, tName)}</div></div>` : '' });
    const sig = JSON.stringify([S.tab, !!peek, aLive, tLive, mLive, showA && aD, tRole, tName, st.text, st.ref, st.layout, st.bgColor, st.bgPreset, st.bgOpacity, st.fontSize, st.mediaUrl, st.timerPosition, st.timerSize, st.timerScale, st.timerSolo, st.textColor, st.flierId, st.textBgUrl, ntState, ntCustom && ntCustom[ntState.tpl]]);
    if (!force && sig === sceneSig) return; sceneSig = sig;
    try { lttEnsureStyle(document); buildCanvasDOM(c, st, importedAssetsLibrary, typeof cachedLogoDataUrl !== 'undefined' ? cachedLogoDataUrl : '', false); } catch (e) { console.warn('Message preview', e); }
    // a LIVE banner stays attached across re-renders (so a scrolling banner never restarts); a draft one is simply redrawn
    const oldA = c.querySelector(':scope > .ms-ann');
    if (showA && aLive) {
        const part = annPart(aD, false), html = part ? ovWrap(part, 'ov-monitor ms-ann') : '';
        if (!(oldA && html && oldA.__sig === html)) {
            if (oldA) oldA.remove();
            if (html) { const t = document.createElement('div'); t.innerHTML = html; const el = t.firstElementChild; if (el) { el.__sig = html; c.appendChild(el); } }
        }
    } else {
        if (oldA) oldA.remove();
        if (showA) { const a = annPart(aD, true); if (a) c.insertAdjacentHTML('beforeend', a); }
    }
    if (showT && !tLive) { const n = c.querySelector('.ov-scene'); if (n) n.classList.add('ms-draft'); }
    if (showM && !mLive) { const n = c.querySelector('.canvas-timer-node'); if (n) { n.classList.add('ms-draft'); n.style.opacity = '.5'; n.style.outline = '4px dashed #7dd3fc'; } }
}

// ============ live status (cards, tabs, top bar) ============
function sigNow() {
    let ov = ''; try { ov = JSON.stringify([ovCh.nt.mode, ovCh.nt.scene, ovCh.nt.t, ovCh.ann.mode, ovCh.ann.scene, ovCh.ann.t]); } catch (e) {}
    return [annOn(), tagOn(), timerShown(), timerRun(), isFrozen(), previewState.lowerThirdName, previewState.lowerThirdRole, g('announcementInput').value, g('timerPosSelector').value, g('timerSoloCheck').checked, ov].join('|');
}
function syncLive() {
    const A = annOn(), T = tagOn(), M = timerShown();
    const info = {
        ann: [A, A ? (g('announcementInput').value || 'Showing') : 'Not on screen'],
        tag: [T, T ? [previewState.lowerThirdRole, previewState.lowerThirdName].filter(Boolean).join(' · ') : 'Not on screen'],
        tim: [M, M ? timerText() + (timerRun() ? ' · running' : ' · paused') + (g('timerSoloCheck').checked ? ' · timer only' : '') : 'Not on screen']
    };
    $$('.ms-tabs i').forEach((i, n) => i.classList.toggle('on', [A, T, M][n]));
    const fz = isFrozen(), fb = $('#msFreeze'); if (fb) { fb.textContent = fz ? '🔒 FROZEN — click to unfreeze' : '❄ Freeze'; fb.className = fz ? 'fz' : ''; }
    const ft = $('#msFrozenTag'); if (ft) { ft.textContent = '🔒 Verse output frozen'; ft.className = fz ? 'on' : ''; }
    const dv = $('#msDraft'); if (dv) dv.className = 'pv' + (S.draft ? ' on' : '');
}
function sync(force) {
    if (!S.open) return;
    const s = sigNow();
    if (force || s !== S.sig) { const changed = s !== S.sig; S.sig = s; syncLive(); if (changed) { drawList(); syncInsp(); } }
    renderScene();
    const big = $('#msBig'); if (big) { big.textContent = timerText(); big.classList.toggle('zero', timerText() === '00:00'); }
    const tn = $('#msCanvas .canvas-timer-node'); if (tn && !tn.classList.contains('ms-draft') && previewState.timerText) tn.textContent = previewState.timerText;
    const ts = $('#msTimerState'); if (ts) ts.textContent = timerRun() ? 'Running' : (timerText() === '00:00' ? 'Finished' : 'Paused');
}

// ============ small DOM helpers ============
const AUTO = { 0: 'Never', 5: '5 seconds', 10: '10 seconds', 15: '15 seconds', 20: '20 seconds', 30: '30 seconds', 45: '45 seconds', 60: '1 minute', 120: '2 minutes', 300: '5 minutes' };
const chip = (label, on, fn) => { const b = document.createElement('button'); b.className = 'ms-chip' + (on ? ' on' : ''); b.textContent = label; b.addEventListener('click', fn); return b; };
function row(label, ...els) { const d = document.createElement('div'); d.className = 'ms-row'; if (label) { const l = document.createElement('label'); l.className = 'l'; l.textContent = label; d.appendChild(l); } els.forEach(e => d.appendChild(e)); return d; }
const H = (t) => { const d = document.createElement('div'); d.className = 'ms-h'; d.textContent = t; return d; };
function inp(val, ph, fn) { const i = document.createElement('input'); i.type = 'text'; i.value = val; i.placeholder = ph || ''; i.className = 'f'; i.addEventListener('input', () => fn(i.value)); return i; }
function sel(opts, val, fn) { const s = document.createElement('select'); s.className = 'f'; Object.keys(opts).forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = opts[k]; s.appendChild(o); }); s.value = val; s.addEventListener('change', () => fn(s.value)); return s; }
function btn(label, cls, fn) { const b = document.createElement('button'); b.className = cls || ''; b.textContent = label; b.addEventListener('click', fn); return b; }
function seg(items, cur, fn) { const w = document.createElement('div'); w.className = 'ms-chips f'; items.forEach(([v, l]) => w.appendChild(chip(l, String(cur) === String(v), () => fn(v)))); return w; }
function txt(t, cls) { const d = document.createElement('div'); d.className = cls || 'ms-note'; d.innerHTML = t; return d; }
function mapOpts(s) { const o = {}; Array.from(s.options).forEach(x => o[x.value] = x.textContent.replace(/ \(Solo-Compatible\)/, '')); return o; }
function newCard(label, fn) { const c = document.createElement('div'); c.className = 'ms-card ms-new'; c.textContent = label; c.addEventListener('click', fn); return c; }
function focusFirst() { setTimeout(() => { const i = $('#msInsp input[type=text]'); if (i) i.focus(); }, 40); }

// primary toggle button (Send live <-> Hide) — kept in sync by syncInsp()
function primary(kind) {
    const b = document.createElement('button'); b.id = 'msPrimary'; b.className = 'ms-primary'; b.dataset.kind = kind;
    b.addEventListener('click', () => {
        const on = kind === 'ann' ? annOn() : kind === 'tag' ? tagOn() : timerShown();
        if (on) { if (kind === 'ann') annHide(); else if (kind === 'tag') tagHide(); else timerHide(); }
        else if (kind === 'ann') annSend(); else if (kind === 'tag') tagSend(); else { timerSend(); toast('Timer is on screen — every screen showing the verse will show it.'); }
        drawList(); syncInsp();
    });
    return b;
}
function syncInsp() {
    const b = $('#msPrimary'); if (!b) return; const k = b.dataset.kind;
    const on = k === 'ann' ? annOn() : k === 'tag' ? tagOn() : timerShown();
    b.dataset.on = on ? '1' : ''; b.className = 'ms-primary ' + (on ? 'd' : 'p');
    b.textContent = on ? '■ Hide from screens' : (k === 'tim' ? '▶ Show timer on screen' : '▶ Send live');
    const st = $('#msLiveHint'); if (st) st.textContent = on ? 'On air — changes below update the screen live.' : 'Not on screen yet.';
    const rs = $('#msBtnTimer'); if (rs) rs.textContent = timerRun() ? '⏸ Pause' : '▶ Start';
}
// "Where it appears" (mode + screens), the same choices the old ▾ menu had
function whereBox(name) {
    const ch = ovCh[name], box = document.createElement('div'); box.className = 'ms-where';
    box.appendChild(H('Where it appears'));
    box.appendChild(seg(MODES, ch.mode, v => {
        if (ch.mode === v) return; if (ch.mode === 'scene') ch.scene = false; ch.mode = v;
        try { lttSave('ebpOvModes', { nt: ovCh.nt.mode, ann: ovCh.ann.mode }); } catch (e) {} ovRefreshAll(); sync(true); drawInsp();
    }));
    if (ch.mode === 'scene') { box.appendChild(txt('Drawn inside the verse scene, so it goes to every screen the verse goes to.')); return box; }
    const sub = document.createElement('div'); sub.className = 'ms-chips'; sub.style.marginTop = '8px';
    const isOpen = (w) => { try { return !!w && !w.closed; } catch (e) { return false; } };
    const keys = [['projector', 'Projector' + (isOpen(projectorWindowRef) ? '' : ' (not open)')]].concat(outputSlots.map(sl => ['s:' + sl.id, (sl.name || 'Output') + (isOpen(sl.windowRef) ? '' : ' (not open)')])).concat([['obs', 'OBS source']]);
    keys.forEach(([k, l]) => sub.appendChild(chip(l, ovOn(ch, k), () => {
        if (ovOn(ch, k)) { ovSet(ch, k, false); ovRefreshAll(); } else { if (!ovTurnOn(ch, k, name)) { toast('Type the text first.', true); return; } ovRefreshAll(); }
        sync(true); drawInsp();
    })));
    box.appendChild(sub);
    box.appendChild(txt(ch.mode === 'overlay' ? 'Only the overlay is sent — no verse or background. Highlighted screens show it; "Send live" turns on OBS plus any screen already open.' : 'Shown over whatever each screen is already displaying.'));
    return box;
}


// ============ dock under the monitor: the fields you type into most ============
function drawDock() {
    const D = $('#msDock'); if (!D) return; D.innerHTML = '';
    const act = document.createElement('div'); act.className = 'ms-act';
    if (S.tab === 'ann') {
        D.appendChild(row('Text', inp(S.d.text, 'Type the announcement…', v => { S.d.text = v; liveAnn(); renderScene(); })));
        const two = document.createElement('div'); two.className = 'ms-two';
        two.appendChild(row('Effect', sel(EFFECTS, S.d.eff, v => { S.d.eff = v; call('ovReplay'); liveAnn(true); renderScene(true); })));
        two.appendChild(row('Auto-hide', sel(AUTO, S.d.secs, v => { S.d.secs = parseInt(v, 10) || 0; })));
        D.appendChild(two);
        act.appendChild(primary('ann'));
    } else if (S.tab === 'tag') {
        let tagLT = 0; const liveTag = () => { if (!tagOn() || !(S.n.role.trim() || S.n.name.trim())) return; clearTimeout(tagLT); tagLT = setTimeout(() => { tagApply(); ovRefreshAll(); }, 350); };
        const two = document.createElement('div'); two.className = 'ms-two';
        two.appendChild(row('Role', inp(S.n.role, 'e.g. Ministering', v => { S.n.role = v; liveTag(); renderScene(); })));
        two.appendChild(row('Name', inp(S.n.name, 'e.g. Pastor Ade', v => { S.n.name = v; liveTag(); renderScene(); })));
        D.appendChild(two);
        D.appendChild(row('Auto-hide', sel(AUTO, S.n.secs, v => { S.n.secs = parseInt(v, 10) || 0; })));
        act.appendChild(primary('tag'));
    } else {
        const mi = document.createElement('input'), si = document.createElement('input');
        [mi, si].forEach(x => { x.type = 'number'; x.min = 0; x.style.width = '70px'; x.style.textAlign = 'center'; }); mi.value = g('timerMinInput').value; si.value = g('timerSecInput').value; mi.max = 99; si.max = 59;
        const setT = () => { timerSet(Math.max(0, parseInt(mi.value) || 0), Math.max(0, Math.min(59, parseInt(si.value) || 0))); sync(true); };
        mi.addEventListener('change', setT); si.addEventListener('change', setT);
        const r1 = row('Time', mi, Object.assign(document.createElement('span'), { textContent: ':' }), si, Object.assign(document.createElement('span'), { className: 'ms-note', textContent: 'min : sec' }));
        const st = btn('▶ Start', 'ok', () => { g('timerToggleStartBtn').click(); setTimeout(() => { syncInsp(); sync(true); }, 40); }); st.id = 'msBtnTimer';
        r1.appendChild(st); r1.appendChild(btn('↺ Reset', '', () => { g('timerResetBtn').click(); setTimeout(() => sync(true), 40); }));
        D.appendChild(r1);
        act.appendChild(primary('tim'));
    }
    const hint = txt('', 'ms-note'); hint.id = 'msLiveHint'; act.appendChild(hint);
    D.appendChild(act);
}

// ============ left list + inspector ============
function drawAll() { $$('.ms-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === S.tab)); drawList(); drawDock(); drawInsp(); renderScene(true); syncLive(); }
function drawList() {
    const L = $('#msList'); if (!L) return; L.innerHTML = '';
    if (S.tab === 'ann') listAnn(L); else if (S.tab === 'tag') listTag(L); else listTim(L);
}
function drawInsp() {
    const I = $('#msInsp'); if (!I) return; const y = I.scrollTop; I.innerHTML = '';
    if (S.tab === 'ann') inspAnn(I); else if (S.tab === 'tag') inspTag(I); else inspTim(I);
    I.scrollTop = y; syncInsp(); renderScene();
}
function liveAnn(now) { if (!annOn() || !S.d.text.trim()) return; clearTimeout(liveAnn.t); const go = () => { annApply(); ovRefreshAll(); }; if (now) go(); else liveAnn.t = setTimeout(go, 350); }

function listAnn(L) {
    L.appendChild(H('Saved announcements'));
    const liveTxt = g('announcementInput').value;
    S.ann.forEach(a => {
        const on = annOn() && liveTxt === a.text;
        const c = document.createElement('div'); c.className = 'ms-card' + (S.d.id === a.id ? ' sel' : '') + (on ? ' live' : '');
        c.innerHTML = `<span class="ms-dot" style="background:${a.color}"></span><div class="t">${esc(a.text)}<small>${EFFECTS[a.eff] || a.eff} · ${a.pos}${a.secs ? ' · hides after ' + a.secs + 's' : ''}</small></div><button class="ms-go ${on ? 'on' : ''}" title="${on ? 'Hide' : 'Send live'}">${on ? '■' : '▶'}</button><button class="ms-x" title="Delete">✕</button>`;
        c.addEventListener('click', () => { S.d = Object.assign({}, a); drawAll(); });
        $('.ms-go', c).addEventListener('click', (e) => { e.stopPropagation(); S.d = Object.assign({}, a); if (on) annHide(); else annSend(); drawAll(); });
        $('.ms-x', c).addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete this announcement?')) { S.ann = S.ann.filter(x => x.id !== a.id); saveAnn(); if (S.d.id === a.id) S.d.id = null; drawAll(); } });
        L.appendChild(c);
    });
    L.appendChild(newCard('＋ New announcement', () => { S.d = clone(DRAFT_A); drawAll(); focusFirst(); }));
    L.appendChild(H('Quick templates'));
    const ch = document.createElement('div'); ch.className = 'ms-chips';
    TEMPLATES.forEach(([n, t, c]) => ch.appendChild(chip(n, false, () => { S.d = { id: null, text: t, eff: 'slide', pos: 'bottom', color: c, secs: 20 }; drawAll(); })));
    L.appendChild(ch);
}
function inspAnn(I) {
    I.appendChild(H('Banner'));
    I.appendChild(row('Position', seg([['top', 'Top'], ['center', 'Middle'], ['bottom', 'Bottom']], S.d.pos, v => { S.d.pos = v; liveAnn(true); drawInsp(); renderScene(true); })));
    const sw = document.createElement('div'); sw.className = 'ms-chips f'; sw.style.alignItems = 'center';
    COLORS.forEach(c => { const b = document.createElement('button'); b.className = 'ms-sw' + (S.d.color === c ? ' on' : ''); b.style.background = c; b.title = c; b.addEventListener('click', () => { S.d.color = c; liveAnn(true); drawInsp(); renderScene(true); }); sw.appendChild(b); });
    const cp = document.createElement('input'); cp.type = 'color'; cp.value = /^#[0-9a-f]{6}$/i.test(S.d.color) ? S.d.color : '#b45309'; cp.addEventListener('input', () => { S.d.color = cp.value; liveAnn(true); renderScene(true); }); sw.appendChild(cp);
    I.appendChild(row('Colour', sw));
    I.appendChild(whereBox('ann'));
    I.appendChild(btn(S.d.id ? '💾 Save changes to this announcement' : '💾 Save to my list', 'ok ms-primary', () => {
        if (!S.d.text.trim()) { toast('Type the text first.', true); return; }
        if (S.d.id && S.ann.some(x => x.id === S.d.id)) S.ann[S.ann.findIndex(x => x.id === S.d.id)] = Object.assign({}, S.d); else { S.d.id = uid('a'); S.ann.push(Object.assign({}, S.d)); }
        saveAnn(); toast('Saved.'); drawAll();
    }));
}

function listTag(L) {
    L.appendChild(H('Saved name tags'));
    S.names.forEach(n => {
        const on = tagOn() && previewState.lowerThirdName === n.name && previewState.lowerThirdRole === n.role;
        const c = document.createElement('div'); c.className = 'ms-card' + (S.n.id === n.id ? ' sel' : '') + (on ? ' live' : '');
        c.innerHTML = `<span class="ms-dot" style="background:#14b8a6"></span><div class="t">${esc(n.name)}<small>${esc(n.role || 'No role')}${n.secs ? ' · hides after ' + n.secs + 's' : ''}</small></div><button class="ms-go ${on ? 'on' : ''}" title="${on ? 'Hide' : 'Send live'}">${on ? '■' : '▶'}</button><button class="ms-x" title="Delete">✕</button>`;
        c.addEventListener('click', () => { S.n = Object.assign({}, n); drawAll(); });
        $('.ms-go', c).addEventListener('click', (e) => { e.stopPropagation(); S.n = Object.assign({}, n); if (on) tagHide(); else tagSend(); drawAll(); });
        $('.ms-x', c).addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete this name tag?')) { S.names = S.names.filter(x => x.id !== n.id); saveNames(); if (S.n.id === n.id) S.n.id = null; drawAll(); } });
        L.appendChild(c);
    });
    L.appendChild(newCard('＋ New name tag', () => { S.n = clone(DRAFT_N); drawAll(); focusFirst(); }));
}
function inspTag(I) {
    let tagLT = 0; const liveTag = () => { if (!tagOn() || !(S.n.role.trim() || S.n.name.trim())) return; clearTimeout(tagLT); tagLT = setTimeout(() => { tagApply(); ovRefreshAll(); }, 350); };
    I.appendChild(H('Name tag'));
    I.appendChild(whereBox('nt'));
    I.appendChild(H('Look'));
    const grid = document.createElement('div'); grid.className = 'ms-tpl';
    try { LTT_ORDER.forEach(id => { const d = document.createElement('div'); d.className = 'ntw' + (ntState.tpl === id ? ' on' : ''); d.title = LTT[id].name; d.innerHTML = ntTagHtml(id, Object.assign({}, LTT[id].d, ntCustom[id] || {}), 'Role', 'Name'); d.addEventListener('click', () => ntSet('tpl', id)); grid.appendChild(d); }); } catch (e) {}
    I.appendChild(grid);
    // colours: the same inputs the old style panel used, so every existing rule (gradient, per-template colour slots) still applies
    try {
        call('ntSyncPanel'); const cols = document.createElement('div'); cols.className = 'ms-cols';
        NT_ROWS.forEach(([k, label]) => {
            const src = g('ntIn_' + k), rw = g('ntRow_' + k); if (!src || (rw && rw.style.display === 'none') || src.disabled) return;
            const l = document.createElement('label'), ci = document.createElement('input'); ci.type = 'color'; ci.value = /^#[0-9a-f]{6}$/i.test(src.value) ? src.value : '#000000';
            ci.addEventListener('input', () => { src.value = ci.value; src.dispatchEvent(new Event('input', { bubbles: true })); renderScene(true); });
            l.appendChild(ci); l.appendChild(document.createTextNode(label.replace(/ colour$/, ''))); cols.appendChild(l);
        });
        if (cols.children.length) { I.appendChild(cols); I.appendChild(row('', btn('↺ Reset colours of this look', '', () => { const b = g('ntResetBtn'); if (b) b.click(); drawInsp(); renderScene(true); }))); }
    } catch (e) {}
    I.appendChild(row('Position', seg([['top', 'Top'], ['center', 'Middle'], ['bottom', 'Bottom']], ntState.pos, v => ntSet('pos', v))));
    I.appendChild(row('Size', btn('−', '', () => { g('ntSizeDec').click(); drawInsp(); renderScene(true); }), Object.assign(document.createElement('b'), { textContent: ntState.scale + '%' }), btn('+', '', () => { g('ntSizeInc').click(); drawInsp(); renderScene(true); })));
    I.appendChild(H('Motion'));
    I.appendChild(row('Appear', sel(NT_MOTIONS, NT_MOTIONS[ntState.motion] ? ntState.motion : 'none', v => ntSet('motion', v))));
    I.appendChild(row('Speed', seg([['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']], ntState.speed || 'normal', v => ntSet('speed', v)), btn('▶ Replay', '', () => { call('ovReplay'); if (tagOn()) { tagApply(); ovRefreshAll(); renderScene(true); } else peek(); })));
    I.appendChild(btn(S.n.id ? '💾 Save changes to this name tag' : '💾 Save to my list', 'ok ms-primary', () => {
        if (!S.n.name.trim() && !S.n.role.trim()) { toast('Type a role or name first.', true); return; }
        if (S.n.id && S.names.some(x => x.id === S.n.id)) S.names[S.names.findIndex(x => x.id === S.n.id)] = Object.assign({}, S.n); else { S.n.id = uid('n'); S.names.push(Object.assign({}, S.n)); }
        saveNames(); toast('Saved.'); drawAll();
    }));
}

function listTim(L) {
    L.appendChild(H('Timer presets — click to load'));
    S.timers.forEach(t => {
        const c = document.createElement('div'); c.className = 'ms-card';
        c.innerHTML = `<span class="ms-dot" style="background:#22c55e"></span><div class="t">${String(t.min).padStart(2, '0')}:${String(t.sec).padStart(2, '0')}<small>${t.min ? t.min + ' min' : ''}${t.sec ? ' ' + t.sec + ' s' : ''}</small></div><button class="ms-go" title="Load, show on screen and start">▶</button><button class="ms-x" title="Delete">✕</button>`;
        c.addEventListener('click', () => { timerSet(t.min, t.sec); drawInsp(); sync(true); });
        $('.ms-go', c).addEventListener('click', (e) => { e.stopPropagation(); timerSet(t.min, t.sec); timerSend(); if (!timerRun()) g('timerToggleStartBtn').click(); drawInsp(); sync(true); toast('Timer started on screen.'); });
        $('.ms-x', c).addEventListener('click', (e) => { e.stopPropagation(); S.timers = S.timers.filter(x => x.id !== t.id); saveTimers(); drawList(); });
        L.appendChild(c);
    });
    L.appendChild(newCard('＋ Save the current time as a preset', () => { const m = parseInt(g('timerMinInput').value) || 0, s = parseInt(g('timerSecInput').value) || 0; if (!m && !s) { toast('Set a time first.', true); return; } if (S.timers.some(t => t.min === m && t.sec === s)) { toast('That preset already exists.', true); return; } S.timers.push({ id: uid('t'), min: m, sec: s }); saveTimers(); drawList(); }));
}
function inspTim(I) {
    I.appendChild(H('Broadcast timer'));
    const big = document.createElement('div'); big.className = 'ms-big'; big.id = 'msBig'; big.textContent = timerText(); I.appendChild(big);
    const stt = document.createElement('div'); stt.className = 'ms-state'; stt.id = 'msTimerState'; I.appendChild(stt);
    const pos = g('timerPosSelector'), siz = g('timerSizeSelector');
    I.appendChild(H('Look'));
    I.appendChild(row('Position', sel(mapOpts(pos), pos.value, v => { timerPos(v); drawInsp(); sync(true); renderScene(true); })));
    I.appendChild(row('Size', sel(mapOpts(siz), siz.value, v => { setV('timerSizeSelector', v); renderScene(true); })));
    I.appendChild(row('Scale', btn('−', '', () => { g('timerScaleDecBtn').click(); drawInsp(); renderScene(true); }), Object.assign(document.createElement('b'), { textContent: g('timerScaleValue').textContent }), btn('+', '', () => { g('timerScaleIncBtn').click(); drawInsp(); renderScene(true); })));
    const centre = pos.value === 'timer-center';
    const lab = document.createElement('label'); lab.style.cssText = 'display:flex;gap:7px;align-items:center;font-size:12px'; lab.innerHTML = '<input type="checkbox" id="msSolo"> Hide the verse / lyrics while the timer is on screen';
    const solo = $('input', lab); solo.checked = g('timerSoloCheck').checked || centre; solo.disabled = centre;
    solo.addEventListener('change', () => { S.soloAuto = false; setChk('timerSoloCheck', solo.checked); sync(true); renderScene(true); });
    I.appendChild(lab);
    if (centre) I.appendChild(txt('The centre-of-screen timer is shown <b>alone</b> — no verse text on screen.'));
    I.appendChild(H("Time's up screen"));
    const tl = document.createElement('label'); tl.style.cssText = 'display:flex;gap:7px;align-items:center;font-size:12px;margin-bottom:9px'; tl.innerHTML = '<input type="checkbox" id="msTu"> Show a full-screen message at 00:00';
    const tu = $('input', tl); tu.checked = g('timeUpOnCheck').checked; tu.addEventListener('change', () => setChk('timeUpOnCheck', tu.checked)); I.appendChild(tl);
    I.appendChild(row('Message', inp(g('timeUpTextInput').value, "TIME'S UP", v => setV('timeUpTextInput', v, 'input'))));
    const bg = g('timeUpBgPreset'), bgc = g('timeUpBgColor');
    const bgs = sel(mapOpts(bg), bg.value, v => { setV('timeUpBgPreset', v); drawInsp(); }); I.appendChild(row('Colour', bgs));
    if (!bg.value) { const ci = document.createElement('input'); ci.type = 'color'; ci.value = bgc.value; ci.addEventListener('input', () => setV('timeUpBgColor', ci.value, 'input')); I.appendChild(row('', ci)); }
    I.appendChild(row('', btn('Test the Time\'s Up screen', '', () => g('timeUpTestBtn').click())));
}

// ============ lifecycle ============
function open() {
    build(); loadNames(); S.open = true; S.root.classList.add('open');
    if (!S.n.name && !S.n.role) { const n = g('lowerThirdNameInput'), r = g('lowerThirdRoleInput'); S.n.name = n ? n.value || '' : ''; S.n.role = r ? r.value || '' : ''; }
    const a = g('announcementInput'); if (a && a.value && !S.d.text) { S.d.text = a.value; S.d.eff = g('announcementEffectSelector').value; S.d.pos = g('announcementPositionSelector').value; S.d.color = g('announcementColorPicker').value; }
    S.sig = ''; drawAll(); fitScene(); sync(true); S.root.focus();
    clearInterval(S.poll); S.poll = setInterval(() => sync(), 400);
}
function close() { S.open = false; if (S.root) S.root.classList.remove('open'); clearInterval(S.poll); }
function boot() { const b = g('ebpMessageStudioBtn'); if (b) b.addEventListener('click', open); window.ebpMessageStudioOpen = open; }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
