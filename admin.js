// ===================== ADMIN DASHBOARD (admin.html) =====================
// A separate page — nothing in the presenter links to it. Access is enforced by Firestore security rules
// (firestore.rules): only accounts that have a document in the "admins" collection can read the user list
// or change settings. Anyone else who finds this URL just sees "Access denied".
//
// It reads three live feeds:
//   users/{uid}     profile + "last seen" heartbeat written by the presenter (auth.js)
//   sessions/{uid}  the devices currently signed in for that person
//   settings/app    presenter-wide controls (maintenance lock, broadcast, device limit, sign-ups)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

// <helpers>
const ACTIVE_WINDOW_MS = 150000; // heartbeat is every 60s, so 2.5 min tolerates one missed beat

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
// status: blocked | active (signed in + open recently) | idle (signed in, not open recently) | offline
function computeRow(u, sessionDoc, now) {
    now = now || Date.now();
    const devices = Array.isArray(sessionDoc && sessionDoc.activeSessions) ? sessionDoc.activeSessions : [];
    const lastSeen = toMs(u.lastSeen);
    let status = 'offline';
    if (u.blocked === true) status = 'blocked';
    else if (devices.length) status = (now - lastSeen < ACTIVE_WINDOW_MS) ? 'active' : 'idle';
    return { u, devices, lastSeen, status };
}
function csvCell(value) {
    let s = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
    return '"' + s.replace(/"/g, '""') + '"';
}
// </helpers>

const STATUS_LABEL = { active: 'Active now', idle: 'Signed in · idle', offline: 'Offline', blocked: 'Blocked' };
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
if (firebaseConfig) startDashboard(firebaseConfig);

function startDashboard(config) {
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let adminUser = null;
    let unsubs = [];
    let refreshTimer = null;
    const usersById = new Map();
    const sessionsById = new Map();
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
        startListeners();
    });

    function teardown() {
        unsubs.forEach((u) => { try { u(); } catch (e) { /* ignore */ } });
        unsubs = [];
        if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
        usersById.clear(); sessionsById.clear(); settings = {}; adminUser = null;
    }

    function listenerError(err) {
        toast("Live data error — " + (err.message || err), true);
    }
    function startListeners() {
        unsubs.push(onSnapshot(collection(db, 'users'), (snap) => {
            usersById.clear();
            snap.forEach((d) => usersById.set(d.id, { id: d.id, ...d.data() }));
            renderUsers();
        }, listenerError));
        unsubs.push(onSnapshot(collection(db, 'sessions'), (snap) => {
            sessionsById.clear();
            snap.forEach((d) => sessionsById.set(d.id, d.data()));
            renderUsers();
        }, listenerError));
        unsubs.push(onSnapshot(doc(db, 'settings', 'app'), (snap) => {
            settings = snap.data() || {};
            renderSettings();
            renderUsers();
        }, listenerError));
        // keep "3 min ago" and Active/Idle fresh even when no data changes
        refreshTimer = setInterval(renderUsers, 20000);
    }

    // ---------- people table ----------
    function rowHtml(r, maxDevices) {
        const u = r.u;
        const isMe = adminUser && u.id === adminUser.uid;
        const name = u.displayName || (u.email || '').split('@')[0] || 'Unknown';
        const avatar = u.photoURL
            ? `<img class="avatar" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`
            : `<span class="avatar avatar-fallback">${esc(initials(u))}</span>`;
        const deviceTip = r.devices.map((d) => `${d.device || 'Device'} — signed in ${fullDate(d.createdAt)}`).join('\n');
        const uid = esc(u.id);
        const actions = [];
        if (r.devices.length) actions.push(`<button class="btn btn-sm" data-action="signout" data-uid="${uid}">Sign out</button>`);
        actions.push(u.blocked === true
            ? `<button class="btn btn-sm" data-action="unblock" data-uid="${uid}">Unblock</button>`
            : `<button class="btn btn-sm btn-danger" data-action="block" data-uid="${uid}" ${isMe ? 'disabled title="You cannot block yourself"' : ''}>Block</button>`);
        actions.push(`<button class="btn btn-sm" data-action="remove" data-uid="${uid}" ${isMe ? 'disabled title="You cannot remove yourself"' : ''}>Remove</button>`);
        return `<tr>
            <td><div class="user-cell">${avatar}<div><div class="uname">${esc(name)}${isMe ? '<span class="you">YOU</span>' : ''}</div><div class="uemail">${esc(u.email || '')}</div></div></div></td>
            <td><span class="pill pill-${r.status}">${STATUS_LABEL[r.status]}</span></td>
            <td title="${esc(deviceTip)}">${r.devices.length} / ${maxDevices}<div class="muted small">${esc(providerLabel(u.providers))}</div></td>
            <td title="${esc(fullDate(r.lastSeen))}">${esc(ago(r.lastSeen))}</td>
            <td title="${esc(fullDate(toMs(u.lastSignIn)))}">${esc(ago(toMs(u.lastSignIn)))}</td>
            <td title="${esc(fullDate(toMs(u.createdAt)))}">${esc(toMs(u.createdAt) ? new Date(toMs(u.createdAt)).toLocaleDateString() : '—')}</td>
            <td><div class="actions">${actions.join('')}</div></td>
        </tr>`;
    }

    function allRows() {
        const now = Date.now();
        return Array.from(usersById.values()).map((u) => computeRow(u, sessionsById.get(u.id), now));
    }

    function renderUsers() {
        if ($('screenApp').hidden) return;
        const rows = allRows();
        $('statTotal').textContent = rows.length;
        $('statActive').textContent = rows.filter((r) => r.status === 'active').length;
        $('statBlocked').textContent = rows.filter((r) => r.status === 'blocked').length;
        $('statDevices').textContent = rows.reduce((sum, r) => sum + r.devices.length, 0);

        const q = $('userSearch').value.trim().toLowerCase();
        const f = $('userFilter').value;
        const maxDevices = parseInt(settings.maxSessions, 10) || 2;
        const shown = rows
            .filter((r) => (f === 'all' || r.status === f))
            .filter((r) => !q || (r.u.email || '').toLowerCase().includes(q) || (r.u.displayName || '').toLowerCase().includes(q))
            .sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || (b.lastSeen - a.lastSeen));

        $('usersBody').innerHTML = shown.length
            ? shown.map((r) => rowHtml(r, maxDevices)).join('')
            : `<tr><td colspan="7"><div class="empty">${rows.length ? 'No one matches this search or filter.' : 'No users yet — people appear here after they open the presenter once.'}</div></td></tr>`;
    }
    $('userSearch').addEventListener('input', renderUsers);
    $('userFilter').addEventListener('change', renderUsers);

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
                toast(`${label} was signed out.`);
            } else if (action === 'block') {
                if (!confirm(`Block ${label}? They will be signed out now and can't sign back in until you unblock them.`)) return;
                await updateDoc(doc(db, 'users', uid), { blocked: true, blockedAt: serverTimestamp(), blockedBy: adminUser.email });
                await clearSessions(uid, 'blocked');
                toast(`${label} is blocked.`);
            } else if (action === 'unblock') {
                await updateDoc(doc(db, 'users', uid), { blocked: false });
                toast(`${label} is unblocked.`);
            } else if (action === 'remove') {
                if (!confirm(`Remove ${label} from this list and sign them out?\n\nTheir login account stays in Firebase Authentication. If sign-ups are open they can register again; if sign-ups are closed they cannot get back in.`)) return;
                await clearSessions(uid, 'admin');
                await deleteDoc(doc(db, 'users', uid));
                toast(`${label} was removed.`);
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
        $('settingsSummary').innerHTML =
            `<span class="chip ${maintenance ? 'on' : ''}">Maintenance: <b>${maintenance ? 'LOCKED' : 'off'}</b></span>` +
            `<span class="chip ${signups ? '' : 'on'}">Sign-ups: <b>${signups ? 'open' : 'CLOSED'}</b></span>` +
            `<span class="chip">Devices per account: <b>${maxDevices}</b></span>` +
            `<span class="chip">Message: <b>${b && b.text ? 'showing' : 'none'}</b></span>`;
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
    $('sendBroadcastBtn').addEventListener('click', async () => {
        const text = $('ctlBroadcast').value.trim();
        if (!text) { toast('Type a message first.', true); return; }
        await saveSettings({ broadcast: { id: String(Date.now()), text, sentAt: serverTimestamp(), sentBy: adminUser.email } }, 'Message sent to everyone signed in.');
        $('ctlBroadcast').value = '';
    });
    $('clearBroadcastBtn').addEventListener('click', () => saveSettings({ broadcast: null }, 'Message cleared.'));

    $('signOutAllBtn').addEventListener('click', async () => {
        if (!confirm('Sign EVERYONE out on every device?\n\nThis includes you if you have the presenter open. People can sign straight back in.')) return;
        try {
            const ids = Array.from(new Set([...usersById.keys(), ...sessionsById.keys()]));
            for (let i = 0; i < ids.length; i += 400) {
                const batch = writeBatch(db);
                ids.slice(i, i + 400).forEach((id) => batch.set(doc(db, 'sessions', id), { activeSessions: [], kickedReason: 'admin', kickedAt: Date.now() }, { merge: true }));
                await batch.commit();
            }
            toast(`Signed out ${ids.length} account${ids.length === 1 ? '' : 's'}.`);
        } catch (err) {
            toast("Couldn't sign everyone out — " + (err.message || err), true);
        }
    });

    // ---------- export ----------
    $('exportCsvBtn').addEventListener('click', () => {
        const rows = allRows().sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || (b.lastSeen - a.lastSeen));
        if (!rows.length) { toast('No users to export yet.', true); return; }
        const header = ['Name', 'Email', 'Sign-in method', 'Status', 'Devices signed in', 'Last usage', 'Last sign-in', 'Joined'];
        const lines = [header.map(csvCell).join(',')].concat(rows.map((r) => [
            r.u.displayName || '', r.u.email || '', providerLabel(r.u.providers), STATUS_LABEL[r.status], r.devices.length,
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
