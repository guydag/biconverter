const admin = require("firebase-admin");
const name = process.env.FACTORY_NAME;
if (!name) { console.error("No FACTORY_NAME"); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
(async () => {
  const ref = admin.firestore().collection("factories").doc(name);
  const snap = await ref.get();
  if (!snap.exists) { console.log("Not found:", name); return; }
  await ref.delete();
  console.log("Deleted:", name);
})().catch((e) => { console.error(e); process.exit(1); });
