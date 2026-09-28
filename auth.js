// ===================== SIGN-IN: Google (one-click) + PASSWORDLESS MAGIC-LINK (Firebase) =====================
// This file is fully self-contained and does not modify or depend on script.js in any way — it only
// shows/hides a full-screen overlay (#authOverlay) that sits on top of the whole app until someone is
// signed in. The presenter itself is untouched: it initializes normally underneath the overlay.
//
// Flow:
//   1a. "Sign in with Google" — one click, instant, for anyone with a Google account.
//   1b. Or by email -> if it's a brand-new email, show the "Create Login Account" confirmation (with
//       your exact description text) before sending the link; if it's a known email, send the link
//       right away. Clicking the emailed link brings them back here and signs them in automatically.
//   2. Firebase itself guarantees one account per email address — if someone signs in with Google using
//      an email that already has an email-link account (or vice versa), the two are linked into one
//      account rather than creating a duplicate.
//   3. Concurrency limit: at most 2 devices/browsers may be signed in at once on the SAME account — a
//      3rd sign-in evicts the oldest session automatically (that device gets signed out with a message).
//
// ==================== REQUIRED SETUP (see PASSWORDLESS_AUTH_SETUP.md for full steps) ====================
//   1. Paste your real Firebase project config into firebaseConfig below (Project Settings > General > Your apps).
//   2. Set APP_URL below to the exact URL this app is hosted at (must be in Firebase Auth > Authorized domains).
//   3. In Firebase Console > Authentication > Sign-in method, enable "Google" AND "Email link (passwordless sign-in)".
//   4. In Firebase Console > Firestore, create a database, then paste firestore.rules (provided) into
//      Firestore > Rules — this is required for the 2-device session limit to work.
// ============================================================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, linkWithCredential,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
    fetchSignInMethodsForEmail, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    getFirestore, doc, runTransaction, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ---- 1) REPLACE with your real Firebase project config ----
const firebaseConfig = {
    apiKey: "AIzaSyA_JxvHMsbdb4fmGlX4_s1CGim7O5hRMys",
    authDomain: "express-bible-presenter.firebaseapp.com",
    projectId: "express-bible-presenter",
    storageBucket: "express-bible-presenter.firebasestorage.app",
    messagingSenderId: "917707548685",
    appId: "1:917707548685:web:d8346e5dc13eca9a434d44"
};

// ---- 2) REPLACE with the exact URL this app is hosted at (the sign-in link brings people back here) ----
const APP_URL = "expressconsult-cmd.github.io/express-bible-presenter/";

const MAX_CONCURRENT_SESSIONS = 2; // per account — a 3rd sign-in evicts the oldest device
const LOCAL_EMAIL_KEY = 'ebp_auth_pending_email';
const LOCAL_SESSION_KEY = 'ebp_auth_session_id';

// The OBS/output URL (?mode=obs) is a passive capture source with no operator present — never gate it
// behind a login screen, or OBS capture would break entirely.
const isObsOutputPage = new URLSearchParams(window.location.search).get('mode') === 'obs';

if (isObsOutputPage) {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.style.display = 'none';
    const modal = document.getElementById('createAccountModal');
    if (modal) modal.style.display = 'none';
} else {
    runAuthModule();
}

function runAuthModule() {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();
    const actionCodeSettings = { url: APP_URL, handleCodeInApp: true };
    const PENDING_LINK_CRED_KEY = 'ebp_auth_pending_link_cred'; // holds a Google credential awaiting linking

    let evictionUnsub = null;

    const $ = (id) => document.getElementById(id);

    function showAuthOverlay() { $('authOverlay').style.display = 'flex'; }
    function hideAuthOverlay() { $('authOverlay').style.display = 'none'; }
    function setAuthStatus(message, isError) {
        const el = $('authStatusMsg');
        if (!el) return;
        el.innerText = message || '';
        el.style.color = isError ? '#f87171' : '';
    }
    function openCreateAccountModal(prefillEmail) {
        $('createAccountEmailInput').value = prefillEmail || '';
        $('createAccountModal').style.display = 'flex';
    }
    function closeCreateAccountModal() { $('createAccountModal').style.display = 'none'; }
    function isValidEmail(email) { return /^\S+@\S+\.\S+$/.test(email); }

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

    // ---- Session-slot management: max MAX_CONCURRENT_SESSIONS devices signed in per account at once.
    // A new sign-in always keeps the newest N sessions and evicts anything older than that.
    async function registerSession(uid) {
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
            sessions.push({ sessionId, createdAt: Date.now() });
            sessions.sort((a, b) => b.createdAt - a.createdAt); // newest first
            sessions = sessions.slice(0, MAX_CONCURRENT_SESSIONS); // evict anything older than the limit
            tx.set(sessionRef, { activeSessions: sessions }, { merge: true });
        });
        return sessionId;
    }

    function listenForEviction(uid, mySessionId) {
        if (evictionUnsub) evictionUnsub();
        evictionUnsub = onSnapshot(doc(db, 'sessions', uid), (snap) => {
            const sessions = (snap.data() || {}).activeSessions || [];
            const stillActive = sessions.some(s => s.sessionId === mySessionId);
            if (!stillActive) {
                showAuthOverlay();
                setAuthStatus('You were signed out because this account signed in on another device (2-device limit).', true);
                signOut(auth);
            }
        });
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

    onAuthStateChanged(auth, async (user) => {
        const signOutBtn = $('appSignOutBtn');
        if (user) {
            try {
                const sessionId = await registerSession(user.uid);
                listenForEviction(user.uid, sessionId);
                hideAuthOverlay();
                if (signOutBtn) signOutBtn.style.display = '';
            } catch (err) {
                setAuthStatus("Signed in, but couldn't register this device session — " + (err.message || err), true);
            }
        } else {
            if (evictionUnsub) { evictionUnsub(); evictionUnsub = null; }
            if (signOutBtn) signOutBtn.style.display = 'none';
            showAuthOverlay();
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
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            const sessionId = window.localStorage.getItem(LOCAL_SESSION_KEY);
            if (user) await releaseSession(user.uid, sessionId);
            window.localStorage.removeItem(LOCAL_SESSION_KEY);
            await signOut(auth);
        });
    }
}