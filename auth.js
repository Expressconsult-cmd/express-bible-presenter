// ===================== SIGN-IN: Google (one-click) + PASSWORDLESS MAGIC-LINK (Firebase) =====================
// This file is fully self-contained and does not modify or depend on script.js in any way — it only
// shows/hides a full-screen overlay (#authOverlay) that sits on top of the whole app until someone is
// signed in. The presenter itself is untouched: it initializes normally underneath the overlay.
//
// Sign-in:
//   • "Sign in with Google" — one click.
//   • Or by email -> brand-new emails see the "Create Login Account" confirmation first; known emails get
//     the link right away. Clicking the emailed link signs them in automatically.
//   • Firebase guarantees one account per email; Google + email-link accounts for the same email are linked.
//
// Access control (all managed from the admin dashboard, admin.html):
//   • Device limit per account (default 2) — an extra sign-in evicts the oldest device.
//   • Block / unblock people, and sign them out remotely.
//   • Maintenance lock (operators see a "temporarily unavailable" screen; admins are exempt).
//   • Broadcast message shown to everyone who is signed in.
//   • Open / close new sign-ups.
//   • Each signed-in person keeps a profile + a 60-second "last seen" heartbeat so the dashboard can show
//     who is active and when they last used the presenter.
//
// SETUP: put your Firebase config in firebase-config.js (see ADMIN_DASHBOARD_SETUP.md).
// ============================================================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, linkWithCredential,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
    fetchSignInMethodsForEmail, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc, runTransaction, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// The sign-in link brings people back to whatever address the app is running at (works locally and hosted).
const APP_URL = window.location.origin + window.location.pathname;

const DEFAULT_MAX_SESSIONS = 2;      // used until an admin changes it in the dashboard
const HEARTBEAT_MS = 60000;          // how often "last seen" is refreshed while the presenter is open
const LOCAL_EMAIL_KEY = 'ebp_auth_pending_email';
const LOCAL_SESSION_KEY = 'ebp_auth_session_id';
const BROADCAST_DISMISSED_KEY = 'ebp_broadcast_dismissed';

const $ = (id) => document.getElementById(id);
function showAuthOverlay() { const el = $('authOverlay'); if (el) el.style.display = 'flex'; }
function hideAuthOverlay() { const el = $('authOverlay'); if (el) el.style.display = 'none'; }
function setAuthStatus(message, isError) {
    const el = $('authStatusMsg');
    if (!el) return;
    el.innerText = message || '';
    el.style.color = isError ? '#f87171' : '';
}

// "Chrome on Windows" — shown to the admin so they can tell which device is which.
function describeDevice() {
    const ua = navigator.userAgent || '';
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
        : /Mac OS X/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'unknown OS';
    return `${browser} on ${os}`;
}

// The OBS/output URL (?mode=obs) is a passive capture source with no operator present — never gate it
// behind a login screen, or OBS capture would break entirely.
const isObsOutputPage = new URLSearchParams(window.location.search).get('mode') === 'obs';

if (isObsOutputPage) {
    const overlay = $('authOverlay');
    if (overlay) overlay.style.display = 'none';
    const modal = $('createAccountModal');
    if (modal) modal.style.display = 'none';
} else {
    startAuth();
}

async function startAuth() {
    let firebaseConfig;
    try {
        ({ firebaseConfig } = await import('./firebase-config.js'));
    } catch (err) {
        setAuthStatus("Setup incomplete: firebase-config.js could not be loaded. Upload it next to index.html.", true);
        return;
    }
    if (!firebaseConfig || JSON.stringify(firebaseConfig).includes('REPLACE_WITH')) {
        setAuthStatus('Setup incomplete: paste your Firebase config into firebase-config.js.', true);
        return;
    }
    runAuthModule(firebaseConfig);
}

function runAuthModule(firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();
    const actionCodeSettings = { url: APP_URL, handleCodeInApp: true };
    const PENDING_LINK_CRED_KEY = 'ebp_auth_pending_link_cred'; // holds a Google credential awaiting linking

    let watchers = [];          // live Firestore listeners, torn down on sign-out
    let heartbeatTimer = null;
    let currentIsAdmin = false; // admins are exempt from the maintenance lock
    let forcedOut = false;      // prevents double sign-out messages
    let shownBroadcastId = '';

    setAuthStatus('Checking sign-in…');

    function openCreateAccountModal(prefillEmail) {
        $('createAccountEmailInput').value = prefillEmail || '';
        $('createAccountModal').style.display = 'flex';
    }
    function closeCreateAccountModal() { $('createAccountModal').style.display = 'none'; }
    function isValidEmail(email) { return /^\S+@\S+\.\S+$/.test(email); }

    // ---------- Small UI pieces injected by this file (maintenance screen + broadcast message) ----------
    function ensureExtras() {
        if ($('ebpExtrasStyle')) return;
        const style = document.createElement('style');
        style.id = 'ebpExtrasStyle';
        style.textContent = `
            #ebpMaintenanceOverlay { display:none; position:fixed; inset:0; z-index:999998; align-items:center; justify-content:center;
                padding:1rem; background:radial-gradient(ellipse at center,#0c1424 0%,#01040a 100%); }
            #ebpMaintenanceOverlay .box { max-width:420px; text-align:center; background:#0f172a; border:1px solid rgba(255,255,255,.08);
                border-radius:14px; padding:2rem 1.75rem; color:#f8fafc; box-shadow:0 20px 60px rgba(0,0,0,.5); }
            #ebpMaintenanceOverlay .icon { font-size:2rem; margin-bottom:.4rem; }
            #ebpMaintenanceOverlay h2 { margin:.2rem 0 .6rem; font-size:1.15rem; }
            #ebpMaintenanceOverlay p { margin:0 0 1.2rem; color:#94a3b8; font-size:.88rem; line-height:1.5; white-space:pre-wrap; }
            #ebpMaintenanceOverlay button { background:#475569; border:1px solid #64748b; color:#fff; border-radius:8px; padding:.5rem 1.1rem; cursor:pointer; font-size:.85rem; }
            #ebpBroadcastBanner { display:none; position:fixed; right:16px; bottom:16px; z-index:999997; max-width:380px; gap:.7rem;
                align-items:flex-start; background:#0f172a; color:#f8fafc; border:1px solid #d97706; border-radius:12px;
                padding:.85rem 1rem; box-shadow:0 12px 40px rgba(0,0,0,.5); font-size:.85rem; line-height:1.45; }
            #ebpBroadcastBanner .text { flex:1; white-space:pre-wrap; }
            #ebpBroadcastBanner .label { display:block; font-size:.68rem; letter-spacing:.06em; text-transform:uppercase; color:#eab308; font-weight:700; margin-bottom:.2rem; }
            #ebpBroadcastBanner button { background:transparent; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem; line-height:1; padding:0 .2rem; }`;
        document.head.appendChild(style);

        const maint = document.createElement('div');
        maint.id = 'ebpMaintenanceOverlay';
        maint.innerHTML = `<div class="box"><div class="icon">🛠</div><h2>Bible Presenter is temporarily unavailable</h2>
            <p id="ebpMaintenanceMsg"></p><button id="ebpMaintenanceSignOut" type="button">Sign out</button></div>`;
        document.body.appendChild(maint);

        const banner = document.createElement('div');
        banner.id = 'ebpBroadcastBanner';
        banner.innerHTML = `<div class="text"><span class="label">📢 Message from your administrator</span><span id="ebpBroadcastText"></span></div>
            <button id="ebpBroadcastClose" type="button" title="Dismiss">✕</button>`;
        document.body.appendChild(banner);

        $('ebpMaintenanceSignOut').addEventListener('click', () => doSignOut());
        $('ebpBroadcastClose').addEventListener('click', () => {
            if (shownBroadcastId) window.localStorage.setItem(BROADCAST_DISMISSED_KEY, shownBroadcastId);
            $('ebpBroadcastBanner').style.display = 'none';
        });
    }

    // Applies the admin-controlled settings (maintenance lock + broadcast message).
    function applySettings(settings) {
        ensureExtras();
        const locked = settings.maintenanceMode === true && !currentIsAdmin;
        $('ebpMaintenanceMsg').textContent = settings.maintenanceMessage || 'The presenter is undergoing maintenance. Please try again shortly.';
        $('ebpMaintenanceOverlay').style.display = locked ? 'flex' : 'none';

        const b = settings.broadcast;
        const dismissed = window.localStorage.getItem(BROADCAST_DISMISSED_KEY);
        if (b && b.id && b.text && String(b.id) !== dismissed) {
            shownBroadcastId = String(b.id);
            $('ebpBroadcastText').textContent = b.text;
            $('ebpBroadcastBanner').style.display = 'flex';
        } else {
            shownBroadcastId = '';
            $('ebpBroadcastBanner').style.display = 'none';
        }
    }
    function hideExtras() {
        if ($('ebpMaintenanceOverlay')) $('ebpMaintenanceOverlay').style.display = 'none';
        if ($('ebpBroadcastBanner')) $('ebpBroadcastBanner').style.display = 'none';
    }

    // ---------- Sending the sign-in link ----------
    async function sendMagicLink(email) {
        setAuthStatus('Sending sign-in link…');
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem(LOCAL_EMAIL_KEY, email);
            setAuthStatus(`Check ${email} for a sign-in link, then open it on this device. You can close this tab.`);
        } catch (err) {
            setAuthStatus("Couldn't send the sign-in link — " + (err.message || err), true);
        }
    }

    // ---- Google sign-in: one click, no email round-trip. If this email already has an email-link
    // account and the Firebase project isn't set to auto-link same-email accounts, Firebase throws
    // 'auth/account-exists-with-different-credential' — we recover by sending that email a sign-in
    // link, then linking the pending Google credential once they complete it (see completeSignInFromLink).
    async function signInWithGoogle() {
        setAuthStatus('Opening Google sign-in…');
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            if (err.code === 'auth/account-exists-with-different-credential') {
                const email = err.customData && err.customData.email;
                const pendingCred = GoogleAuthProvider.credentialFromError(err);
                if (email && pendingCred) {
                    window.sessionStorage.setItem(PENDING_LINK_CRED_KEY, JSON.stringify(pendingCred.toJSON()));
                    setAuthStatus(`An account already exists for ${email}. Sending a sign-in link to link your Google account — click it to finish.`);
                    await sendMagicLink(email);
                } else {
                    setAuthStatus('An account already exists for that email with a different sign-in method.', true);
                }
            } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                setAuthStatus(''); // user simply closed the Google popup — no error needed
            } else if (err.code === 'auth/popup-blocked') {
                setAuthStatus('Your browser blocked the Google sign-in popup — allow popups for this site and try again.', true);
            } else {
                setAuthStatus("Couldn't sign in with Google — " + (err.message || err), true);
            }
        }
    }

    async function handleEmailSubmit(rawEmail) {
        const email = (rawEmail || '').trim().toLowerCase();
        if (!isValidEmail(email)) { setAuthStatus('Enter a valid email address.', true); return; }
        setAuthStatus('Checking…');
        try {
            // NOTE: if your Firebase project has "Email enumeration protection" turned on (Authentication >
            // Settings), this always returns empty and every email will be treated as new — turn that
            // setting off if you want returning users to skip the "Create Login Account" step.
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.length === 0) openCreateAccountModal(email);
            else await sendMagicLink(email);
        } catch (err) {
            setAuthStatus("Couldn't check that email — " + (err.message || err), true);
        }
    }

    async function completeSignInFromLink() {
        if (!isSignInWithEmailLink(auth, window.location.href)) return;
        let email = window.localStorage.getItem(LOCAL_EMAIL_KEY);
        if (!email) email = window.prompt('Confirm the email address you used to request this link:');
        if (!email) return;
        setAuthStatus('Signing you in…');
        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem(LOCAL_EMAIL_KEY);
            window.history.replaceState({}, document.title, window.location.pathname);

            // Finish linking a Google account that was started via signInWithGoogle() above, if any.
            const pendingJson = window.sessionStorage.getItem(PENDING_LINK_CRED_KEY);
            if (pendingJson) {
                window.sessionStorage.removeItem(PENDING_LINK_CRED_KEY);
                try {
                    const pendingCred = GoogleAuthProvider.credentialFromJSON(JSON.parse(pendingJson));
                    await linkWithCredential(result.user, pendingCred);
                    setAuthStatus('Your Google account is now linked — you can use either one to sign in next time.');
                } catch (linkErr) {
                    // Non-fatal: they're still signed in via email link either way.
                    console.warn('Could not link Google credential:', linkErr);
                }
            }
        } catch (err) {
            setAuthStatus('That sign-in link is invalid or has expired — request a new one below.', true);
        }
    }

    // ---------- Access checks + profile (what the admin dashboard lists) ----------
    async function checkIsAdmin(user) {
        if (!user.email) return false;
        try { return (await getDoc(doc(db, 'admins', user.email.toLowerCase()))).exists(); }
        catch (err) { return false; }
    }

    // Creates/refreshes this person's profile. Returns {ok:false, message} if they must not get in.
    async function syncProfileAndCheckAccess(user) {
        const userRef = doc(db, 'users', user.uid);
        const meta = user.metadata || {};
        const profile = {
            email: (user.email || '').toLowerCase(),
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            providers: (user.providerData || []).map(p => p.providerId),
            lastSignIn: Date.parse(meta.lastSignInTime) || Date.now(),
            lastSeen: serverTimestamp()
        };
        let snap;
        try {
            snap = await getDoc(userRef);
        } catch (err) {
            console.error('Reading users/' + user.uid + ' failed:', err);
            return { ok: false, message: `Couldn't read your profile — [${err.code || 'error'}] ${err.message || err}` };
        }
        if (snap.exists()) {
            if (snap.data().blocked === true) return { ok: false, message: 'This account has been blocked by the administrator.' };
            try {
                await updateDoc(userRef, profile);
            } catch (err) {
                console.error('Updating users/' + user.uid + ' failed:', err);
                return { ok: false, message: `Couldn't update your profile — [${err.code || 'error'}] ${err.message || err}` };
            }
        } else {
            try {
                await setDoc(userRef, { ...profile, createdAt: Date.parse(meta.creationTime) || Date.now(), blocked: false });
            } catch (err) {
                console.error('Creating users/' + user.uid + ' failed:', err);
                if (err.code === 'permission-denied') return { ok: false, message: 'New sign-ups are currently closed. Please contact the administrator.' };
                return { ok: false, message: `Couldn't create your profile — [${err.code || 'error'}] ${err.message || err}` };
            }
        }
        return { ok: true };
    }

    async function readMaxSessions() {
        try {
            const snap = await getDoc(doc(db, 'settings', 'app'));
            const n = parseInt(snap.exists() ? snap.data().maxSessions : DEFAULT_MAX_SESSIONS, 10);
            return Math.min(10, Math.max(1, n || DEFAULT_MAX_SESSIONS));
        } catch (err) { return DEFAULT_MAX_SESSIONS; }
    }

    // ---- Session-slot management: at most `maxSessions` devices signed in per account at once.
    // A new sign-in always keeps the newest N sessions and evicts anything older than that.
    async function registerSession(uid, maxSessions) {
        let sessionId = window.localStorage.getItem(LOCAL_SESSION_KEY);
        if (!sessionId) {
            sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
            window.localStorage.setItem(LOCAL_SESSION_KEY, sessionId);
        }
        const sessionRef = doc(db, 'sessions', uid);
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(sessionRef);
            let sessions = (snap.exists() && snap.data().activeSessions) || [];
            sessions = sessions.filter(s => s.sessionId !== sessionId);
            sessions.push({ sessionId, createdAt: Date.now(), device: describeDevice() });
            sessions.sort((a, b) => b.createdAt - a.createdAt); // newest first
            sessions = sessions.slice(0, maxSessions);          // evict anything older than the limit
            tx.set(sessionRef, { activeSessions: sessions, kickedReason: '' }, { merge: true });
        });
        return sessionId;
    }

    async function releaseSession(uid, sessionId) {
        if (!uid || !sessionId) return;
        try {
            const sessionRef = doc(db, 'sessions', uid);
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(sessionRef);
                if (!snap.exists()) return;
                const sessions = (snap.data().activeSessions || []).filter(s => s.sessionId !== sessionId);
                tx.set(sessionRef, { activeSessions: sessions }, { merge: true });
            });
        } catch (err) { /* best-effort cleanup only */ }
    }

    // ---------- Live listeners + heartbeat ----------
    async function forceSignOut(message) {
        if (forcedOut) return;
        forcedOut = true;
        setAuthStatus(message, true);
        showAuthOverlay();
        try { await signOut(auth); } catch (err) { /* ignore */ }
    }

    function stopWatchers() {
        watchers.forEach(unsub => { try { unsub(); } catch (err) { /* ignore */ } });
        watchers = [];
    }
    function stopHeartbeat() { if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; } }

    function startWatchers(user, sessionId) {
        stopWatchers();
        // 1) my device slot — removed when a newer device evicts me, or an admin signs me out
        watchers.push(onSnapshot(doc(db, 'sessions', user.uid), (snap) => {
            const data = snap.data() || {};
            const stillActive = (data.activeSessions || []).some(s => s.sessionId === sessionId);
            if (stillActive) return;
            if (data.kickedReason === 'admin') forceSignOut('You were signed out by an administrator.');
            else if (data.kickedReason === 'blocked') forceSignOut('This account has been blocked by the administrator.');
            else forceSignOut('You were signed out because this account signed in on another device (device limit reached).');
        }, (err) => console.warn('Session listener error:', err)));
        // 2) my profile — blocked flag
        watchers.push(onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (snap.exists() && snap.data().blocked === true) forceSignOut('This account has been blocked by the administrator.');
        }, (err) => console.warn('Profile listener error:', err)));
        // 3) admin-controlled settings (maintenance lock, broadcast message)
        watchers.push(onSnapshot(doc(db, 'settings', 'app'), (snap) => {
            applySettings(snap.data() || {});
        }, (err) => console.warn('Settings listener error:', err)));
    }

    function startHeartbeat(uid) {
        stopHeartbeat();
        const userRef = doc(db, 'users', uid);
        heartbeatTimer = setInterval(() => {
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => { /* offline or removed — ignore */ });
        }, HEARTBEAT_MS);
    }

    async function doSignOut() {
        const user = auth.currentUser;
        const sessionId = window.localStorage.getItem(LOCAL_SESSION_KEY);
        if (user) await releaseSession(user.uid, sessionId);
        window.localStorage.removeItem(LOCAL_SESSION_KEY);
        await signOut(auth);
    }

    onAuthStateChanged(auth, async (user) => {
        const signOutBtn = $('appSignOutBtn');
        if (!user) {
            stopWatchers();
            stopHeartbeat();
            currentIsAdmin = false;
            hideExtras();
            if (signOutBtn) signOutBtn.style.display = 'none';
            const statusEl = $('authStatusMsg');
            if (statusEl && statusEl.innerText === 'Checking sign-in…') setAuthStatus('');
            showAuthOverlay();
            return;
        }
        forcedOut = false;
        try {
            currentIsAdmin = await checkIsAdmin(user);
            const access = await syncProfileAndCheckAccess(user);
            if (!access.ok) { await forceSignOut(access.message); return; }
            const maxSessions = await readMaxSessions();
            const sessionId = await registerSession(user.uid, maxSessions);
            startWatchers(user, sessionId);
            startHeartbeat(user.uid);
            setAuthStatus('');
            hideAuthOverlay();
            if (signOutBtn) signOutBtn.style.display = '';
        } catch (err) {
            setAuthStatus(`Signed in, but couldn't finish setting up this session — [${err.code || 'error'}] ${err.message || err}`, true);
        }
    });

    completeSignInFromLink();

    $('authGoogleBtn').addEventListener('click', signInWithGoogle);
    $('authContinueBtn').addEventListener('click', () => handleEmailSubmit($('authEmailInput').value));
    $('authEmailInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('authContinueBtn').click(); });

    $('createAccountConfirmBtn').addEventListener('click', async () => {
        const email = ($('createAccountEmailInput').value || '').trim().toLowerCase();
        if (!isValidEmail(email)) return;
        closeCreateAccountModal();
        await sendMagicLink(email);
    });
    $('createAccountCancelBtn').addEventListener('click', closeCreateAccountModal);

    const signOutBtn = $('appSignOutBtn');
    if (signOutBtn) signOutBtn.addEventListener('click', () => doSignOut());
}
