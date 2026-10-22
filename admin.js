// ===================== ADMIN DASHBOARD (admin.html) =====================
// A separate page — nothing in the presenter links to it. Access is enforced by Firestore security rules
// (firestore.rules): only accounts that have a document in the "admins" collection can read the user list
// or change settings. Anyone else who finds this URL just sees "Access denied".
//
// What it reads (kept small on purpose, to protect the free Firebase daily limit):
//   COUNTS         total / active / new / blocked / devices are counted by the database (about 1 read per 1,000 people)
//   users/{uid}    the people list is loaded 50 at a time (default: only people active now)
//   stats/{day}    one small progress record per day, saved when an admin opens this page
//   settings/app   presenter-wide controls (maintenance lock, broadcast, device limit, sign-ups)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, writeBatch,
    query, where, orderBy, limit, startAfter, getCountFromServer, getAggregateFromServer, sum, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

// <helpers>
const ACTIVE_WINDOW_MS = 2400000; // the presenter reports in every 30 min while in use, so 40 min counts as "active"

function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toMs(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (typeof v.toMillis === 'function') return v.toMillis();
    return 0;
}
function ago(ms, now) {
    now = now || Date.now();
    if (!ms) return 'Never';
    const s = Math.max(0, Math.round((now - ms) / 1000));
    if (s < 45) return 'Just now';
    const m = Math.round(s / 60);
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' hr ago';
    const d = Math.round(h / 24);
    if (d < 30) return d + ' day' + (d > 1 ? 's' : '') + ' ago';
    return new Date(ms).toLocaleDateString();
}
function fullDate(ms) { return ms ? new Date(ms).toLocaleString() : '—'; }
function providerLabel(list) {
    const names = (list || []).map((p) => p === 'google.com' ? 'Google' : p === 'password' ? 'Email link' : p);
    return names.length ? Array.from(new Set(names)).join(' + ') : '—';
}
function initials(u) {
    const base = (u.displayName || u.email || '?').trim();
    const parts = base.split(/[\s@._-]+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
// status (from last usage only): blocked | active (used in the last 40 min) | idle (used earlier today) | offline
function startOfDay(ms) { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
function computeRow(u, now) {
    now = now || Date.now();
    const lastSeen = toMs(u.lastSeen);
    let status = 'offline';
    if (u.blocked === true) status = 'blocked';
    else if (lastSeen && now - lastSeen < ACTIVE_WINDOW_MS) status = 'active';
    else if (lastSeen && lastSeen >= startOfDay(now)) status = 'idle';
    return { u, lastSeen, status };
}
function csvCell(value) {
    let s = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
}
// </helpers>

const STATUS_LABEL = { active: 'Active now', idle: 'Seen today', offline: 'Offline', blocked: 'Blocked' };
const STATUS_ORDER = { active: 0, idle: 1, offline: 2, blocked: 3 };

function showScreen(name) {
    $('screenLogin').hidden = name !== 'login';
    $('screenDenied').hidden = name !== 'denied';
    $('screenApp').hidden = name !== 'app';
}
let toastTimer = null;
function toast(message, isError) {
    const el = $('toast');
    el.textContent = message;
    el.className = 'show' + (isError ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, isError ? 5000 : 2600);
}

let firebaseConfig = null;
try {
    ({ firebaseConfig } = await import('./firebase-config.js'));
} catch (err) {
    $('loginMsg').textContent = 'Setup incomplete: firebase-config.js could not be loaded. Upload it next to admin.html.';
}
if (firebaseConfig && JSON.stringify(firebaseConfig).includes('REPLACE_WITH')) {
    $('loginMsg').textContent = 'Setup incomplete: paste your Firebase config into firebase-config.js.';
    firebaseConfig = null;
}
if (firebaseConfig) {
    try { await enableAppCheck(initializeApp(firebaseConfig)); } catch (err) { /* App Check is optional */ }
    startDashboard(firebaseConfig);
}

// ---- Firebase App Check (optional): proves requests come from the real site, not a copy or a script. Does nothing until a site key is set in firebase-config.js.
async function enableAppCheck(app) {
    try {
        const mod = await import('./firebase-config.js');
        const siteKey = mod.appCheckSiteKey;
        if (!siteKey) return;
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; // local testing only: prints a debug token in the console
        const ac = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js');
        ac.initializeAppCheck(app, { provider: new ac.ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
    } catch (err) { console.warn('App Check could not start:', err); }
}


function startDashboard(config) {
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let adminUser = null;
    let unsubs = [];
    let refreshTimer = null;
    const usersById = new Map();
    const PAGE = 50;
    let settings = {};

    // ---------- sign-in ----------
    $('adminGoogleBtn').addEventListener('click', async () => {
        $('loginMsg').textContent = '';
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
            if (code === 'auth/popup-blocked') $('loginMsg').textContent = 'Your browser blocked the sign-in popup — allow popups for this site and try again.';
            else if (code === 'auth/unauthorized-domain') $('loginMsg').textContent = 'This address is not in Firebase Authentication > Settings > Authorized domains.';
            else if (code === 'auth/account-exists-with-different-credential') $('loginMsg').textContent = 'That email already has an account using a different sign-in method. In Firebase Console > Authentication > Settings > User account linking, choose "Link accounts that use the same email", then try again.';
            else $('loginMsg').textContent = "Couldn't sign in — " + (err.message || err);
        }
    });
    const doSignOut = () => signOut(auth);
    $('adminSignOutBtn').addEventListener('click', doSignOut);
    $('deniedSignOutBtn').addEventListener('click', doSignOut);

    async function checkAdmin(user) {
        if (!user.email) return { ok: false, message: 'This account has no email address, so it cannot be an administrator.' };
        try {
            const snap = await getDoc(doc(db, 'admins', user.email.toLowerCase()));
            if (snap.exists()) return { ok: true };
            return { ok: false, message: `${user.email} is not an administrator. Ask an existing admin to add this email to the "admins" collection.` };
        } catch (err) {
            return { ok: false, message: "Couldn't verify administrator access — " + (err.message || err) + ' (Have you published the updated firestore.rules?)' };
        }
    }

    onAuthStateChanged(auth, async (user) => {
        teardown();
        if (!user) { showScreen('login'); return; }
        const result = await checkAdmin(user);
        if (!result.ok) { $('deniedMsg').textContent = result.message; showScreen('denied'); return; }
        adminUser = user;
        $('adminEmail').textContent = user.email;
        showScreen('app');
        setDiag('you', 'ok', `Signed in as ${user.email} (uid ${user.uid}) — confirmed administrator.`);
        startListeners();
    });

    function teardown() {
        unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } });
        unsubs = [];
        if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
        if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
        activeAt = 0;
        usersById.clear(); settings = {}; adminUser = null; loadedAt = 0; readsUsed = 0; counts = null; listState = { cursor: null, hasMore: false, mode: 'filter' };
        diagState = {};
        renderDiag();
    }

    // ---------- diagnostics: shows exactly what each live data source is doing, so nothing fails silently ----------
    let diagState = {};
    const DIAG_LABEL = { you: 'Your admin session', counts: 'Totals (counted)', users: 'People list', progress: 'Daily progress', settings: 'settings/app document' };
    function setDiag(key, status, details) {
        diagState[key] = { status, details: details || '' };
        renderDiag();
    }
    function renderDiag() {
        const order = ['you', 'counts', 'users', 'progress', 'settings'];
        $('diagBody').innerHTML = order.map((key) => {
            const d = diagState[key] || { status: 'pending', details: 'Waiting…' };
            const cls = d.status === 'ok' ? 'diag-ok' : d.status === 'error' ? 'diag-err' : 'diag-pending';
            const label = d.status === 'ok' ? 'OK' : d.status === 'error' ? 'ERROR' : 'Waiting…';
            return `<tr><td>${esc(DIAG_LABEL[key] || key)}</td><td class="${cls}">${label}</td><td class="details">${esc(d.details)}</td></tr>`;
        }).join('');
    }
    renderDiag();

    function listenerError(sourceKey) {
        return (err) => {
            setDiag(sourceKey, 'error', `[${err.code || 'unknown'}] ${err.message || err}`);
            toast(`Couldn't load ${DIAG_LABEL[sourceKey] || sourceKey} — ${err.message || err}`, true);
        };
    }
    // ---------- loading data (every step is counted so you can see what the page costs) ----------
    let readsUsed = 0;
    let counts = null;
    let listState = { cursor: null, hasMore: false, mode: 'filter' };
    let loadedAt = 0;
    const costOf = (n) => Math.max(1, Math.ceil((n || 0) / 1000));
    function addReads(n) {
        readsUsed += n;
        const el = $('readsMeter'); if (el) el.innerHTML = 'This page has used about <b>' + readsUsed + ' reads</b> so far';
    }
    const usersCol = () => collection(db, 'users');
    const ts = (ms) => Timestamp.fromMillis(ms);

    function startListeners() {
        // Nothing here listens live all day: a live list re-reads a record every time anyone's "last seen" changes,
        // which would use up the free Firebase read limit. Totals, the list and progress load once, and again on Refresh.
        refreshAll();
        unsubs.push(onSnapshot(doc(db, 'settings', 'app'), (snap) => {
            settings = snap.data() || {};
            setDiag('settings', 'ok', snap.exists() ? 'Loaded.' : 'No document yet — using defaults (this is normal until you save a setting).');
            renderSettings();
            renderUsers();
        }, listenerError('settings')));
        // keep "3 min ago" and Active/Idle fresh even when no data changes
        refreshTimer = setInterval(() => { renderUsers(); renderLoaded(); renderActiveAgo(); }, 20000);
        // "Active now" re-counts itself every minute (one cheap count, ~1 read) while this tab is open and visible
        activeTimer = setInterval(refreshActive, 60000);
    }

    let activeTimer = null, activeAt = 0, activeBusy = false;
    async function refreshActive() {
        if (document.hidden || !counts || activeBusy) return;
        activeBusy = true;
        try {
            const r = await getCountFromServer(query(usersCol(), where('lastSeen', '>', ts(Date.now() - ACTIVE_WINDOW_MS))));
            addReads(1);
            counts.activeNow = r.data().count;
            activeAt = Date.now();
            $('statActive').textContent = counts.activeNow;
            $('capDevices').textContent = counts.signedIn + (counts.signedIn === 1 ? ' person' : ' people') + ' signed in · active now: ' + counts.activeNow;
            renderActiveAgo();
        } catch (e) { /* keep the last number; the next minute tries again */ }
        activeBusy = false;
    }
    function renderActiveAgo() {
        const el = $('activeAgo'); if (!el) return;
        if (!activeAt) { el.textContent = 'live'; return; }
        const s = Math.round((Date.now() - activeAt) / 1000);
        el.textContent = 'updated ' + (s < 10 ? 'just now' : s < 60 ? s + 's ago' : Math.floor(s / 60) + ' min ago');
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && activeTimer && activeAt && Date.now() - activeAt > 60000) refreshActive(); });

    function renderLoaded() {
        const el = $('loadedAt'); if (!el) return;
        if (!loadedAt) { el.textContent = 'Not loaded yet'; return; }
        const mins = Math.floor((Date.now() - loadedAt) / 60000);
        el.textContent = 'Loaded ' + new Date(loadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (mins >= 1 ? ' (' + mins + ' min ago)' : '');
    }

    // ----- totals: counted by the database, not by downloading people -----
    async function loadCounts() {
        const now = Date.now(), sod = startOfDay(now), week = now - 7 * 86400000;
        try {
            const r = await Promise.all([
                getCountFromServer(usersCol()),
                getCountFromServer(query(usersCol(), where('blocked', '==', true))),
                getCountFromServer(query(usersCol(), where('lastSeen', '>', ts(now - ACTIVE_WINDOW_MS)))),
                getCountFromServer(query(usersCol(), where('lastSeen', '>=', ts(sod)))),
                getCountFromServer(query(usersCol(), where('lastSeen', '>=', ts(week)))),
                getCountFromServer(query(usersCol(), where('createdAt', '>=', sod))),
                getCountFromServer(query(usersCol(), where('createdAt', '>=', week))),
                getAggregateFromServer(usersCol(), { devices: sum('deviceCount') }),
                getCountFromServer(query(usersCol(), where('deviceCount', '>', 0)))
            ]);
            const c = r.slice(0, 7).map((x) => x.data().count);
            counts = { total: c[0], blocked: c[1], activeNow: c[2], activeToday: c[3], active7: c[4], newToday: c[5], newWeek: c[6], devices: Number(r[7].data().devices) || 0, signedIn: r[8].data().count };
            const cost = c.reduce((sum2, n) => sum2 + costOf(n), 0) + costOf(counts.total) + costOf(counts.signedIn);
            addReads(cost);
            setDiag('counts', 'ok', `Counted: ${counts.total} users, ${counts.activeNow} active now, ${counts.signedIn} signed in on ${counts.devices} device${counts.devices === 1 ? '' : 's'} (about ${cost} reads).`);
            activeAt = Date.now();
            renderCounts();
            renderActiveAgo();
            return true;
        } catch (err) { listenerError('counts')(err); return false; }
    }
    function renderCounts() {
        if (!counts) return;
        $('statTotal').textContent = counts.total;
        $('statActive').textContent = counts.activeNow;
        $('statToday').textContent = counts.activeToday;
        $('statNewWeek').textContent = counts.newWeek;
        $('statDevices').textContent = counts.devices;
        $('capDevices').textContent = counts.signedIn + (counts.signedIn === 1 ? ' person' : ' people') + ' signed in · active now: ' + counts.activeNow;
        $('statBlocked').textContent = counts.blocked;
        $('capToday').textContent = 'last 7 days: ' + counts.active7;
        $('capNewWeek').textContent = 'new today: ' + counts.newToday;
        renderPager();
    }

    // ----- people list: 50 at a time -----
    function listQuery(filter, cursor, now) {
        const c = [];
        if (filter === 'active') c.push(where('lastSeen', '>', ts(now - ACTIVE_WINDOW_MS)), orderBy('lastSeen', 'desc'));
        else if (filter === 'today') c.push(where('lastSeen', '>=', ts(startOfDay(now))), orderBy('lastSeen', 'desc'));
        else if (filter === 'blocked') c.push(where('blocked', '==', true));
        else c.push(orderBy('lastSeen', 'desc'));
        if (cursor) c.push(startAfter(cursor));
        c.push(limit(PAGE));
        return query(usersCol(), ...c);
    }
    async function loadList(reset) {
        const q = $('userSearch').value.trim();
        if (q.length >= 2) return runSearch(q);
        const btn = $('loadMoreBtn'); if (btn) btn.disabled = true;
        try {
            if (reset) { usersById.clear(); listState = { cursor: null, hasMore: false, mode: 'filter' }; }
            const snap = await getDocs(listQuery($('userFilter').value, listState.cursor, Date.now()));
            addReads(Math.max(1, snap.size));
            snap.forEach((d) => usersById.set(d.id, { id: d.id, ...d.data() }));
            listState.mode = 'filter';
            listState.cursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : listState.cursor;
            listState.hasMore = snap.size === PAGE;
            setDiag('users', 'ok', `${usersById.size} ${usersById.size === 1 ? 'person' : 'people'} shown (50 at a time).`);
            renderUsers();
        } catch (err) { listenerError('users')(err); }
        finally { if (btn) btn.disabled = false; }
    }
    // search: starts-with on email (lower case) or on the name as typed — at most 25 per query
    async function runSearch(q) {
        try {
            const lower = q.toLowerCase(), title = q.charAt(0).toUpperCase() + q.slice(1);
            const mk = (field, val) => query(usersCol(), where(field, '>=', val), where(field, '<=', val + ''), orderBy(field), limit(25));
            const qs = [mk('email', lower), mk('displayName', q)];
            if (title !== q) qs.push(mk('displayName', title));
            const res = await Promise.all(qs.map((x) => getDocs(x)));
            usersById.clear();
            res.forEach((snap) => { addReads(Math.max(1, snap.size)); snap.forEach((d) => usersById.set(d.id, { id: d.id, ...d.data() })); });
            listState = { cursor: null, hasMore: false, mode: 'search' };
            setDiag('users', 'ok', `Search "${q}": ${usersById.size} found.`);
            renderUsers();
        } catch (err) { listenerError('users')(err); }
    }

    // ----- progress: one small record per day -----
    const dayKey = (ms) => new Date(ms).toLocaleDateString('en-CA'); // YYYY-MM-DD in your own time zone
    async function saveProgress() {
        if (!counts) return;
        const key = dayKey(Date.now()), ref = doc(db, 'stats', key);
        const snap = await getDoc(ref); addReads(1);
        const prev = snap.exists() ? snap.data() : {};
        const next = { date: key, total: counts.total, newToday: counts.newToday, activeToday: counts.activeToday, peakActive: Math.max(Number(prev.peakActive) || 0, counts.activeNow) };
        const changed = !snap.exists() || ['total', 'newToday', 'activeToday', 'peakActive'].some((k) => prev[k] !== next[k]);
        if (changed) await setDoc(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });
    }
    async function loadProgress() {
        try {
            await saveProgress();
            const snap = await getDocs(query(collection(db, 'stats'), orderBy('date', 'desc'), limit(30)));
            addReads(Math.max(1, snap.size));
            const rows = snap.docs.map((d) => d.data());
            $('progressBody').innerHTML = rows.length ? rows.map((r) =>
                `<tr><td>${esc(r.date)}</td><td>${esc(r.total)}</td><td>${esc(r.newToday)}</td><td>${esc(r.activeToday)}</td><td>${esc(r.peakActive)}</td></tr>`).join('')
                : '<tr><td colspan="5"><div class="empty">The first day is saved when you open this page.</div></td></tr>';
            setDiag('progress', 'ok', `${rows.length} day${rows.length === 1 ? '' : 's'} of history shown.`);
        } catch (err) { listenerError('progress')(err); }
    }

    async function refreshAll() {
        const btn = $('refreshUsersBtn'); if (btn) btn.disabled = true;
        try {
            await loadCounts();
            await Promise.all([loadList(true), loadProgress()]);
            loadedAt = Date.now(); renderLoaded();
        } finally { if (btn) btn.disabled = false; }
    }
    // after an admin action, re-read just that one person (1 read) and the totals (a few reads)
    async function refreshOne(uid) {
        try {
            const u = await getDoc(doc(db, 'users', uid)); addReads(1);
            if (u.exists()) usersById.set(uid, { id: uid, ...u.data() }); else usersById.delete(uid);
            renderUsers();
            loadCounts();
        } catch (err) { /* the Refresh button still works */ }
    }

    // ---------- people table ----------
    function rowHtml(r, maxDevices) {
        const u = r.u;
        const isMe = adminUser && u.id === adminUser.uid;
        const name = u.displayName || (u.email || '').split('@')[0] || 'Unknown';
        const avatar = u.photoURL
            ? `<img class="avatar" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`
            : `<span class="avatar avatar-fallback">${esc(initials(u))}</span>`;
        const dc = Number.isInteger(u.deviceCount) ? u.deviceCount : null; // null = this person hasn't signed in since the device count was added
        const uid = esc(u.id);
        const actions = [];
        if (dc === null || dc > 0) actions.push(`<button class="btn btn-sm" data-action="signout" data-uid="${uid}">Sign out</button>`);
        actions.push(u.blocked === true
            ? `<button class="btn btn-sm" data-action="unblock" data-uid="${uid}">Unblock</button>`
            : `<button class="btn btn-sm btn-danger" data-action="block" data-uid="${uid}" ${isMe ? 'disabled title="You cannot block yourself"' : ''}>Block</button>`);
        actions.push(`<button class="btn btn-sm" data-action="remove" data-uid="${uid}" ${isMe ? 'disabled title="You cannot remove yourself"' : ''}>Remove</button>`);
        return `<tr>
            <td><div class="user-cell">${avatar}<div><div class="uname">${esc(name)}${isMe ? '<span class="you">YOU</span>' : ''}</div><div class="uemail">${esc(u.email || '')}</div></div></div></td>
            <td><span class="pill pill-${r.status}">${STATUS_LABEL[r.status]}</span></td>
            <td title="${dc === null ? 'Shown after this person next signs in' : ''}">${dc === null ? '—' : dc} / ${maxDevices}<div class="muted small">${esc(providerLabel(u.providers))}</div></td>
            <td title="${esc(fullDate(r.lastSeen))}">${esc(ago(r.lastSeen))}</td>
            <td title="${esc(fullDate(toMs(u.lastSignIn)))}">${esc(ago(toMs(u.lastSignIn)))}</td>
            <td title="${esc(fullDate(toMs(u.createdAt)))}">${esc(toMs(u.createdAt) ? new Date(toMs(u.createdAt)).toLocaleDateString() : '—')}</td>
            <td><div class="actions">${actions.join('')}</div></td>
        </tr>`;
    }

    function allRows() {
        const now = Date.now();
        return Array.from(usersById.values()).map((u) => computeRow(u, now));
    }

    const FILTER_WORD = { active: 'active people', today: 'people seen today', all: 'people', blocked: 'blocked people' };
    function renderPager() {
        const info = $('pagerInfo'), more = $('loadMoreBtn'); if (!info || !more) return;
        const n = usersById.size;
        if (listState.mode === 'search') {
            info.textContent = `${n} match${n === 1 ? '' : 'es'} for "${$('userSearch').value.trim()}" (email or name starts with these letters)`;
            more.hidden = true; return;
        }
        const f = $('userFilter').value;
        const total = counts ? ({ active: counts.activeNow, today: counts.activeToday, all: counts.total, blocked: counts.blocked })[f] : null;
        info.textContent = `Showing ${n}${total != null ? ' of ' + total : ''} ${FILTER_WORD[f] || 'people'}`;
        more.hidden = !listState.hasMore;
    }

    function renderUsers() {
        if ($('screenApp').hidden) return;
        const maxDevices = parseInt(settings.maxSessions, 10) || 2;
        let rows = allRows();
        if (listState.mode === 'search') rows = rows.sort((a, b) => b.lastSeen - a.lastSeen);
        $('usersBody').innerHTML = rows.length
            ? rows.map((r) => rowHtml(r, maxDevices)).join('')
            : `<tr><td colspan="7"><div class="empty">${listState.mode === 'search' ? 'No one found. Search matches the START of an email or name.' : ($('userFilter').value === 'active' ? 'Nobody has used the presenter in the last 40 minutes. Choose "All people" to see everyone.' : 'Nobody here yet.')}</div></td></tr>`;
        renderPager();
    }
    $('refreshUsersBtn').addEventListener('click', refreshAll);
    $('loadMoreBtn').addEventListener('click', () => loadList(false));
    $('userFilter').addEventListener('change', () => { $('userSearch').value = ''; loadList(true); });
    let searchTimer = null;
    $('userSearch').addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadList(true), 600);
    });

    // ---------- per-person actions ----------
    async function clearSessions(uid, reason) {
        await setDoc(doc(db, 'sessions', uid), { activeSessions: [], kickedReason: reason, kickedAt: Date.now() }, { merge: true });
    }
    async function runAction(action, uid) {
        const u = usersById.get(uid);
        if (!u) return;
        const label = u.displayName || u.email || 'this user';
        try {
            if (action === 'signout') {
                if (!confirm(`Sign ${label} out of all their devices?`)) return;
                await clearSessions(uid, 'admin');
                await updateDoc(doc(db, 'users', uid), { deviceCount: 0 });
                toast(`${label} was signed out.`); await refreshOne(uid);
            } else if (action === 'block') {
                if (!confirm(`Block ${label}? They will be signed out now and can't sign back in until you unblock them.`)) return;
                await updateDoc(doc(db, 'users', uid), { blocked: true, blockedAt: serverTimestamp(), blockedBy: adminUser.email, deviceCount: 0 });
                await clearSessions(uid, 'blocked');
                toast(`${label} is blocked.`); await refreshOne(uid);
            } else if (action === 'unblock') {
                await updateDoc(doc(db, 'users', uid), { blocked: false });
                toast(`${label} is unblocked.`); await refreshOne(uid);
            } else if (action === 'remove') {
                if (!confirm(`Remove ${label} from this list and sign them out?\n\nTheir login account stays in Firebase Authentication. If sign-ups are open they can register again; if sign-ups are closed they cannot get back in.`)) return;
                await clearSessions(uid, 'admin');
                await deleteDoc(doc(db, 'users', uid));
                toast(`${label} was removed.`); await refreshOne(uid);
            }
        } catch (err) {
            toast("Couldn't do that — " + (err.message || err), true);
        }
    }
    $('usersBody').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (btn && !btn.disabled) runAction(btn.dataset.action, btn.dataset.uid);
    });

    // ---------- presenter controls ----------
    async function saveSettings(patch, okMessage) {
        try {
            await setDoc(doc(db, 'settings', 'app'), { ...patch, updatedAt: serverTimestamp(), updatedBy: adminUser.email }, { merge: true });
            if (okMessage) toast(okMessage);
        } catch (err) {
            toast("Couldn't save — " + (err.message || err), true);
            renderSettings(); // put the switches back to what is really saved
        }
    }
    function setIfIdle(el, value) { if (document.activeElement !== el) el.value = value; }

    function renderSettings() {
        const maxDevices = parseInt(settings.maxSessions, 10) || 2;
        const maintenance = settings.maintenanceMode === true;
        const signups = settings.signupsOpen !== false;
        const b = settings.broadcast;
        $('ctlSignups').checked = signups;
        $('ctlMaintenance').checked = maintenance;
        setIfIdle($('ctlMaxDevices'), maxDevices);
        setIfIdle($('ctlMaintenanceMsg'), settings.maintenanceMessage || '');
        setIfIdle($('ctlTelegramUrl'), settings.telegramUrl || '');
        $('settingsSummary').innerHTML =
            `<span class="chip ${maintenance ? 'on' : ''}">Maintenance: <b>${maintenance ? 'LOCKED' : 'off'}</b></span>` +
            `<span class="chip ${signups ? '' : 'on'}">Sign-ups: <b>${signups ? 'open' : 'CLOSED'}</b></span>` +
            `<span class="chip">Devices per account: <b>${maxDevices}</b></span>` +
            `<span class="chip">Message: <b>${b && b.text ? 'showing' : 'none'}</b></span>` +
            `<span class="chip ${settings.telegramUrl ? '' : 'on'}">Telegram button: <b>${settings.telegramUrl ? 'showing' : 'hidden'}</b></span>`;
        const now = $('broadcastNow');
        if (b && b.text) { now.hidden = false; now.textContent = 'Currently showing: ' + b.text; } else { now.hidden = true; now.textContent = ''; }
    }

    $('ctlSignups').addEventListener('change', (e) => saveSettings({ signupsOpen: e.target.checked }, e.target.checked ? 'New sign-ups are open.' : 'New sign-ups are closed.'));
    $('ctlMaintenance').addEventListener('change', (e) => saveSettings({ maintenanceMode: e.target.checked }, e.target.checked ? 'Presenter locked for everyone except admins.' : 'Presenter unlocked.'));
    $('saveMaintenanceMsgBtn').addEventListener('click', () => saveSettings({ maintenanceMessage: $('ctlMaintenanceMsg').value.trim() }, 'Maintenance message saved.'));
    $('saveMaxDevicesBtn').addEventListener('click', () => {
        const n = parseInt($('ctlMaxDevices').value, 10);
        if (!(n >= 1 && n <= 10)) { toast('Enter a number from 1 to 10.', true); return; }
        saveSettings({ maxSessions: n }, `Each account can now be signed in on ${n} device${n > 1 ? 's' : ''}. Applies from each person's next sign-in.`);
    });
    const tgOk = (u) => /^https:\/\/(t\.me|telegram\.me)\/\S+$/i.test(u);
    $('saveTelegramBtn').addEventListener('click', () => {
        const u = $('ctlTelegramUrl').value.trim();
        if (!u) { saveSettings({ telegramUrl: '' }, 'Telegram button hidden.'); return; }
        if (!tgOk(u)) { toast('Use a Telegram link that starts with https://t.me/ or https://telegram.me/', true); return; }
        saveSettings({ telegramUrl: u }, 'Telegram link saved. It shows in the presenter for everyone signed in.');
    });
    $('clearTelegramBtn').addEventListener('click', () => { $('ctlTelegramUrl').value = ''; saveSettings({ telegramUrl: '' }, 'Telegram button hidden.'); });
    $('testTelegramBtn').addEventListener('click', () => { const u = $('ctlTelegramUrl').value.trim(); if (!tgOk(u)) { toast('Type a valid https://t.me/… link first.', true); return; } window.open(u, '_blank', 'noopener'); });
    $('sendBroadcastBtn').addEventListener('click', async () => {
        const text = $('ctlBroadcast').value.trim();
        if (!text) { toast('Type a message first.', true); return; }
        await saveSettings({ broadcast: { id: String(Date.now()), text, sentAt: serverTimestamp(), sentBy: adminUser.email } }, 'Message sent to everyone signed in.');
        $('ctlBroadcast').value = '';
    });
    $('clearBroadcastBtn').addEventListener('click', () => saveSettings({ broadcast: null }, 'Message cleared.'));

    $('signOutAllBtn').addEventListener('click', async () => {
        if (!confirm('Sign EVERYONE out on every device?\n\nThis includes you if you have the presenter open. People can sign straight back in. It reads and writes one record per person who has ever signed in.')) return;
        try {
            const ss = await getDocs(collection(db, 'sessions')); addReads(Math.max(1, ss.size));
            const ids = ss.docs.map((d) => d.id);
            for (let i = 0; i < ids.length; i += 400) {
                const batch = writeBatch(db);
                ids.slice(i, i + 400).forEach((id) => batch.set(doc(db, 'sessions', id), { activeSessions: [], kickedReason: 'admin', kickedAt: Date.now() }, { merge: true }));
                await batch.commit();
            }
            toast(`Signed out ${ids.length} account${ids.length === 1 ? '' : 's'}.`); await recountDevices(true);
        } catch (err) {
            toast("Couldn't sign everyone out — " + (err.message || err), true);
        }
    });

    // ---------- recount devices: fills in / corrects each person's device count from the sessions list ----------
    // Reads every person and every session once, writes only the people whose stored count is different. Run it once after the update,
    // and again after "Sign out everyone" (or whenever the Devices total looks off).
    async function recountDevices(silent) {
        if (!silent && !confirm(`Recount devices?\n\nThis reads every person and every session once (about ${counts ? counts.total * 2 : 'two reads per person, '} reads) and writes only the people whose device count is out of date.\nRun it once after the update, not repeatedly.`)) return;
        const btn = $('recountBtn'); if (btn) btn.disabled = true;
        try {
            const [us, ss] = await Promise.all([getDocs(usersCol()), getDocs(collection(db, 'sessions'))]);
            addReads(Math.max(1, us.size) + Math.max(1, ss.size));
            const sessionCount = new Map();
            ss.forEach((d) => { const a = d.data().activeSessions; sessionCount.set(d.id, Array.isArray(a) ? a.length : 0); });
            const changes = [];
            us.forEach((d) => { const n = sessionCount.get(d.id) || 0; if (d.data().deviceCount !== n) changes.push([d.id, n]); });
            for (let i = 0; i < changes.length; i += 400) {
                const batch = writeBatch(db);
                changes.slice(i, i + 400).forEach(([id, n]) => batch.update(doc(db, 'users', id), { deviceCount: n }));
                await batch.commit();
            }
            toast(changes.length ? `Device counts updated for ${changes.length} ${changes.length === 1 ? 'person' : 'people'}.` : 'Device counts were already correct.');
            await refreshAll();
        } catch (err) {
            toast("Couldn't recount — " + (err.message || err), true);
        } finally { if (btn) btn.disabled = false; }
    }
    $('recountBtn').addEventListener('click', () => recountDevices(false));

    // ---------- export (reads every person once) ----------
    $('exportCsvBtn').addEventListener('click', async () => {
        const approx = counts ? counts.total : 'every';
        if (!confirm(`Export reads every person once (about ${approx} reads of your free daily limit). Continue?`)) return;
        let all;
        try { const snap = await getDocs(usersCol()); addReads(Math.max(1, snap.size)); all = snap.docs.map((d) => ({ id: d.id, ...d.data() })); }
        catch (err) { toast("Couldn't export — " + (err.message || err), true); return; }
        const now = Date.now();
        const rows = all.map((u) => computeRow(u, now)).sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || (b.lastSeen - a.lastSeen));
        if (!rows.length) { toast('No users to export yet.', true); return; }
        const header = ['Name', 'Email', 'Sign-in method', 'Status', 'Devices signed in', 'Last usage', 'Last sign-in', 'Joined'];
        const lines = [header.map(csvCell).join(',')].concat(rows.map((r) => [
            r.u.displayName || '', r.u.email || '', providerLabel(r.u.providers), STATUS_LABEL[r.status], Number.isInteger(r.u.deviceCount) ? r.u.deviceCount : '',
            r.lastSeen ? new Date(r.lastSeen).toISOString() : '', toMs(r.u.lastSignIn) ? new Date(toMs(r.u.lastSignIn)).toISOString() : '',
            toMs(r.u.createdAt) ? new Date(toMs(r.u.createdAt)).toISOString() : ''
        ].map(csvCell).join(',')));
        const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bible-presenter-users-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
}
