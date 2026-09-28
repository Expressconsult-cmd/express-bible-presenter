// ===================== FIREBASE CONFIG (shared) =====================
// Paste your Firebase web-app config here ONCE. Both the presenter sign-in (auth.js) and the admin
// dashboard (admin.js) read it from this file, so future updates to those files never overwrite it.
//
// Where to find it: Firebase Console > Project settings > General > "Your apps" > SDK setup and configuration.
// (Use the SAME values you previously pasted into auth.js.)
//
// Note: this config is not a secret — every Firebase web app publishes it. What actually protects your
// data is the Firestore security rules (firestore.rules), not hiding these values.

export const firebaseConfig = {
    apiKey: "AIzaSyA_JxvHMsbdb4fmGlX4_s1CGim7O5hRMys",
    authDomain: "express-bible-presenter.firebaseapp.com",
    projectId: "express-bible-presenter",
    storageBucket: "express-bible-presenter.firebasestorage.app",
    messagingSenderId: "917707548685",
    appId: "1:917707548685:web:d8346e5dc13eca9a434d44"
};
