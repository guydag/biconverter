/* Sends a push notification to phones when a report is published.
   Runs next to the Firestore database in Tel Aviv. */
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

const SITE = "https://guydag.github.io/biconverter/";

exports.notifyNewReport = onDocumentWritten({ document: "factories/{id}", region: "me-west1" }, async (event) => {
  const after = event.data && event.data.after && event.data.after.exists ? event.data.after.data() : null;
  if (!after) return; /* a deleted report sends nothing */
  const before = event.data.before && event.data.before.exists ? event.data.before.data() : null;
  /* Only a newly published file counts, not an edit of the name or other fields. */
  if (before && before.fileName === after.fileName && before.rows === after.rows && before.fileTime === after.fileTime) return;

  const name = after.name || event.params.id;
  const uploader = String(after.by || "").toLowerCase();
  const snap = await admin.firestore().collection("subs").get();
  const owners = {}; /* token -> subs doc id */
  snap.forEach((doc) => {
    if (doc.id === uploader) return; /* no need to notify whoever uploaded it */
    const d = doc.data();
    const wants = d.all !== false || (Array.isArray(d.follows) && d.follows.includes(name));
    if (!wants) return;
    (d.tokens || []).forEach((t) => { owners[t] = doc.id; });
  });
  const tokens = Object.keys(owners);
  if (!tokens.length) return;

  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    webpush: {
      notification: {
        title: "רשומי משואות",
        body: "עלה דוח חדש: " + name + " · " + after.rows + " רשומים",
        icon: SITE + "icon-192.png",
        badge: SITE + "icon-192.png",
        dir: "rtl",
        lang: "he"
      },
      fcmOptions: { link: SITE }
    }
  });

  /* Forget devices whose token is no longer valid. */
  const stale = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") stale.push(tokens[i]);
  });
  await Promise.all(stale.map((t) =>
    admin.firestore().collection("subs").doc(owners[t]).set({ tokens: admin.firestore.FieldValue.arrayRemove(t) }, { merge: true })
  ));
});
