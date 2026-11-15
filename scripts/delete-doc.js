const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
(async () => {
  const ref = admin.firestore().collection("users").doc("_dictionary");
  const snap = await ref.get();
  if (!snap.exists) { console.log("Not found"); return; }
  await ref.delete();
  console.log("Deleted users/_dictionary");
})().catch((e) => { console.error(e); process.exit(1); });
