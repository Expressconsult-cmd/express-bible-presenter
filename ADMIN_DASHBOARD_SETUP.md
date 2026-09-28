# Setting up the Admin Dashboard

This is a separate page (`admin.html`) — nothing in the presenter links to it, and it isn't
listed anywhere public. Only accounts you explicitly mark as administrators can open it.

## Files involved
- `admin.html` / `admin.js` — the dashboard itself.
- `firebase-config.js` — your Firebase project config, shared with `auth.js` (edit this ONE
  file; both the presenter and the dashboard read from it).
- `firestore.rules` — updated to add the `admins`, `users`, and `settings` collections the
  dashboard needs. **You must republish this in the Firebase Console — the older version
  you pasted in earlier only covered `sessions`, and won't let the dashboard read anything.**

## 1. Publish the updated Firestore rules
Firebase Console → **Firestore Database → Rules** → replace everything in the editor with
the contents of `firestore.rules` → **Publish**.

If you skip this step, opening `admin.html` and signing in will show:
> Couldn't verify administrator access — Missing or insufficient permissions.

That's exactly the error you ran into — it means the rules the dashboard needs haven't been
published yet.

## 2. Create your first administrator (do this once)
Nothing in the app can grant the very first admin — that has to be done by hand in the
Console, so a random visitor could never make themselves an admin.

1. Firebase Console → **Firestore Database → Data**.
2. Click **Start collection** → Collection ID: `admins`.
3. **Document ID**: your own email address, **all lower-case** (e.g. `pastor@gmail.com`,
   not `Pastor@Gmail.com`) — this must be the exact email you sign in with.
4. Add any one field to save it, e.g. `addedAt` (type: timestamp, value: now) — the
   document just needs to exist; its contents aren't checked.
5. **Save**.

Once you're signed in as an admin, you can add more admins the same way — there's no
in-app "make someone an admin" button, by design, so this stays a deliberate console-only
action.

## 3. Upload the files
Make sure `admin.html`, `admin.js`, and `firebase-config.js` are uploaded to your GitHub
repo alongside `index.html`, `auth.js`, `styles.css`, and `script.js`. `firebase-config.js`
already has your real config in it if you edited it for the presenter — no need to edit it
twice.

## 4. Open the dashboard
Go to `https://expressconsult-cmd.github.io/express-bible-presenter/admin.html` and sign in
with Google using the email you added in step 2.

## Notes
- The dashboard itself has no separate password — access is entirely controlled by who has
  a document under `admins/`. Removing that document removes their access immediately.
- The "Devices allowed per account" setting here replaces the fixed value that used to be
  hard-coded in `auth.js` — change it any time from the dashboard, no file edits needed.
- "Sign up everyone out" and "Block" both work immediately for anyone with the presenter
  open, since it's watching for changes live — no refresh needed on their end.
