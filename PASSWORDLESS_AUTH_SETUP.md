# Setting up Passwordless Sign-In (Firebase)

The app code (`auth.js`, plus small additions to `index.html` and `styles.css`) is ready.
Five things need to happen on your Firebase project before it will work — none of these
can be done from the code itself, since they require your own Firebase account.

## 1. Enable sign-in methods
Firebase Console → **Authentication** → **Sign-in method** → enable:
- **Google**
- **Email link (passwordless sign-in)**

## 2. Turn off Email enumeration protection (recommended)
Firebase Console → **Authentication** → **Settings** → **User account linking** section.
If "Email enumeration protection" is ON, the app can't tell a new email from an existing
one, so it will always show the "Create Login Account" step, even for returning users.
Turning it OFF restores the exact flow you described (new email → confirmation popup,
existing email → link sent immediately).

## 3. Add your domain to Authorized domains
Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add the
exact domain this app is hosted on (e.g. `yourchurch.org`, or your hosting provider's
domain). If you test locally, `localhost` is usually already included by default.

## 4. Create a Firestore database
Firebase Console → **Firestore Database** → **Create database** (Production mode is fine).
Then go to the **Rules** tab and paste in the contents of `firestore.rules` (provided) —
this is what makes the 2-device session limit work. Without this, sign-in will still
work, but the "kick the oldest device" behavior won't.

## 5. Paste in your real config
Firebase Console → **Project settings** → **General** → scroll to **Your apps** → copy the
`firebaseConfig` object shown there. Open `auth.js` and replace the placeholder values
near the top:

```js
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};
```

Also update `APP_URL` just below it to the exact URL where this app will be opened from
(this is the address the sign-in link brings people back to) — it must match a domain
you added in step 3, e.g.:

```js
const APP_URL = "https://yourchurch.org/index.html";
```

## How it behaves once set up
- **OBS output page** (`?mode=obs`): sign-in is skipped entirely — that page is a passive
  capture source with no operator present, so it's untouched by any of this.
- **Main app**: nothing is visible or usable until sign-in succeeds.
- **"Sign in with Google"**: one click — instant if the browser is already signed into a
  Google account.
- **New email** (via the email option): shows the "Create Login Account" confirmation with
  your exact wording, then sends the link.
- **Returning email**: sends the link right away, no confirmation step.
- **Same email, both methods**: if someone signs in with Google using an email that
  already has an email-link account (or vice versa), Firebase links them into a single
  account rather than creating a duplicate — either method then works for that person.
- **A 3rd device signs in on the same account**: the oldest of the other two is signed
  out automatically, with an on-screen explanation.