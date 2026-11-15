/* Temporary: creates a throwaway account, exercises the live rules and password change, then deletes everything. */
const admin = require("firebase-admin");
const crypto = require("crypto");
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
const KEY = "AIzaSyABd26IEKadfnCKTyVezfD4upQOLu8XxNE";
const PROJ = "mishuot";
const email = "zztest" + Date.now() + "@masuot.app";
const pw1 = crypto.randomBytes(9).toString("base64url"), pw2 = crypto.randomBytes(9).toString("base64url");
const results = [];
const note = (n, ok, extra) => { results.push((ok ? "PASS " : "FAIL ") + n + (extra ? " (" + extra + ")" : "")); };
const idt = "https://identitytoolkit.googleapis.com/v1/";
const post = async (u, b) => { const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { s: r.status, j: await r.json().catch(() => ({})) }; };
const fs = (path) => "https://firestore.googleapis.com/v1/projects/" + PROJ + "/databases/(default)/documents/" + path;
const patch = async (path, fields, token) => {
  const mask = Object.keys(fields).map((k) => "updateMask.fieldPaths=" + k).join("&");
  const body = { fields: {} }; for (const k in fields) body.fields[k] = { stringValue: fields[k] };
  const r = await fetch(fs(path) + "?" + mask, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body) });
  return r.status;
};
(async () => {
  let uid;
  try {
    uid = (await admin.auth().createUser({ email, password: pw1 })).uid;
    await db.collection("users").doc(email).set({ name: "בדיקה", fullName: "בדיקה אוטומטית", idNumber: "", role: "מרכז" });
    let si = await post(idt + "accounts:signInWithPassword?key=" + KEY, { email, password: pw1, returnSecureToken: true });
    note("sign in with initial password", si.s === 200);
    const tok = si.j.idToken;
    const d = await fetch(fs("users/" + encodeURIComponent(email)), { headers: { Authorization: "Bearer " + tok } });
    note("read own profile", d.status === 200, d.status);
    note("edit own profile (allowed fields)", (await patch("users/" + encodeURIComponent(email), { fullName: "בדיקה שנערכה", role: "בוגר" }, tok)) === 200);
    note("add forbidden field to own profile is refused", (await patch("users/" + encodeURIComponent(email), { isAdmin: "yes" }, tok)) === 403);
    note("edit someone else's profile is refused", (await patch("users/guyda%40masuot.app", { fullName: "x" }, tok)) === 403);
    const other = await fetch(fs("users/guyda%40masuot.app"), { headers: { Authorization: "Bearer " + tok } });
    note("read someone else's profile is refused", other.status === 403, other.status);
    const day = new Date().toISOString().slice(0, 10);
    note("write own usage doc", (await patch("usage/" + encodeURIComponent(email + "_" + day), { email, day }, tok)) === 200);
    note("write usage doc under another name is refused", (await patch("usage/" + encodeURIComponent("guyda@masuot.app_" + day), { email, day }, tok)) === 403);
    const up = await post(idt + "accounts:update?key=" + KEY, { idToken: tok, password: pw2, returnSecureToken: true });
    note("change password", up.s === 200);
    const old = await post(idt + "accounts:signInWithPassword?key=" + KEY, { email, password: pw1, returnSecureToken: true });
    note("old password no longer works", old.s !== 200);
    const nw = await post(idt + "accounts:signInWithPassword?key=" + KEY, { email, password: pw2, returnSecureToken: true });
    note("new password works", nw.s === 200);
  } catch (e) { results.push("ERROR " + e.message); }
  finally {
    try { await db.collection("users").doc(email).delete(); } catch (e) {}
    try { const day = new Date().toISOString().slice(0, 10); await db.collection("usage").doc(email + "_" + day).delete(); } catch (e) {}
    try { if (uid) await admin.auth().deleteUser(uid); } catch (e) {}
    let gone = false; try { await admin.auth().getUserByEmail(email); } catch (e) { gone = true; }
    results.push((gone ? "PASS " : "FAIL ") + "test account deleted");
    console.log(results.join("\n"));
  }
})();
