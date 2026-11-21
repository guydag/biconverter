/* Pause or resume every account with a given role: node scripts/pause.js <pause|resume|sync|list> "<role>".
   Pausing disables the Firebase sign-in, revokes open sessions and flags users/<email> with paused:true so the site hides them; admins are never touched.
   The paused emails are remembered in meta/paused so "resume" restores exactly them. */
const admin = require("firebase-admin");
if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.log("FIREBASE_SERVICE_ACCOUNT is not set."); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore(), auth = admin.auth();
const [action, role] = [process.argv[2] || "list", process.argv[3] || "מדריך קורס"];
const short = (e) => String(e).replace(/@masuot\.app$/, "");
(async () => {
  const ref = db.collection("meta").doc("paused");
  const flag = (e, on) => db.collection("users").doc(e).set({ paused: on ? true : admin.firestore.FieldValue.delete() }, { merge: true });
  if (action === "sync") {
    const cur = (await ref.get()).data() || {};
    for (const e of cur.emails || []) { await flag(e, true); console.log("flagged: " + short(e)); }
    console.log("Flagged " + (cur.emails || []).length + " account(s).");
    return;
  }
  if (action === "resume") {
    const cur = (await ref.get()).data() || {};
    const emails = (cur.emails || []).filter((e) => !cur.role || cur.role === role);
    for (const e of emails) { try { const u = await auth.getUserByEmail(e); await auth.updateUser(u.uid, { disabled: false }); await flag(e, false); console.log("resumed: " + short(e)); } catch (x) { console.log("failed: " + short(e) + " " + x.code); } }
    await ref.set({ emails: [], role: "", at: admin.firestore.FieldValue.serverTimestamp() });
    console.log("Resumed " + emails.length + " account(s).");
    return;
  }
  const admins = new Set((await db.collection("admins").get()).docs.map((d) => d.id.toLowerCase()));
  const users = (await db.collection("users").get()).docs.map((d) => ({ email: d.id.toLowerCase(), ...d.data() }));
  const hit = users.filter((u) => u.role === role), skipped = hit.filter((u) => admins.has(u.email)), todo = hit.filter((u) => !admins.has(u.email));
  console.log("Role \"" + role + "\": " + hit.length + " account(s); admins skipped: " + (skipped.map((u) => short(u.email)).join(", ") || "none"));
  if (action === "list") { todo.forEach((u) => console.log("would pause: " + short(u.email) + " | " + (u.fullName || u.name))); return; }
  const done = [];
  for (const u of todo) {
    try { const a = await auth.getUserByEmail(u.email); await auth.updateUser(a.uid, { disabled: true }); await auth.revokeRefreshTokens(a.uid); await flag(u.email, true); done.push(u.email); console.log("paused: " + short(u.email) + " | " + (u.fullName || u.name)); }
    catch (x) { console.log("failed: " + short(u.email) + " " + x.code); }
  }
  const prev = (await ref.get()).data() || {};
  await ref.set({ emails: Array.from(new Set([...(prev.role === role ? prev.emails || [] : []), ...done])), role, at: admin.firestore.FieldValue.serverTimestamp() });
  console.log("Paused " + done.length + " account(s).");
})().catch((e) => { console.log("ERROR " + e.message); process.exit(1); });
