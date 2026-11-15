const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
const SITE = "https://guydag.github.io/biconverter/";
const NAME = "דוח לדוגמה";
(async () => {
  const ref = db.collection("factories").doc(NAME), snap = await ref.get();
  if (!snap.exists) { console.log("demo report missing"); return; }
  const d = snap.data(), fresh = ["נועה|כהן|ז׳", "דן|לוי|ו׳", "מיה|בר|ח׳"];
  const ts = admin.firestore.Timestamp.now();
  await ref.update({ fresh, updatedAt: ts });
  const m = db.collection("meta").doc("push"), cur = await m.get(), seen = cur.exists ? (cur.data().seen || {}) : {};
  seen[NAME] = ts.toMillis(); await m.set({ seen });
  const sub = await db.collection("subs").doc("guyda@masuot.app").get();
  const tokens = sub.exists ? (sub.data().tokens || []) : [];
  console.log("devices:", tokens.length);
  if (!tokens.length) return;
  const nNew = fresh.length;
  const body = (nNew === 0 ? "דוח חדש" : nNew === 1 ? "נרשם חדש אחד" : "נרשמו " + nNew + " חדשים") + " · " + d.rows + " רשומים בדוח";
  const res = await admin.messaging().sendEachForMulticast({ tokens, webpush: {
    notification: { title: NAME + " עודכן 🔔", body, icon: SITE + "icon-192.png?v=3", badge: SITE + "icon-192.png?v=3", dir: "rtl", lang: "he" },
    fcmOptions: { link: SITE + "#r=" + encodeURIComponent(NAME) } } });
  console.log("sent ok:", res.successCount, "failed:", res.failureCount);
})().catch((e) => { console.error(e); process.exit(1); });
