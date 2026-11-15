/* On-demand usage report: node scripts/usage.js [days]. Reads the `usage` collection (one doc per person per day). */
const admin = require("firebase-admin");
if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.log("FIREBASE_SERVICE_ACCOUNT is not set."); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
const days = Number(process.argv[2]) || 30;
const short = (e) => String(e).replace(/@masuot\.app$/, "");
(async () => {
  const from = new Date(Date.now() - days * 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Jerusalem" });
  const snap = await db.collection("usage").where("day", ">=", from).get();
  const users = {}, reports = {}, perDay = {}, devices = { phone: new Set(), desktop: new Set() }, versions = {}, app = new Set();
  snap.forEach((d) => {
    const x = d.data(), u = short(x.email);
    const c = x.counts || {};
    const me = users[u] || (users[u] = { days: 0, open: 0, preview: 0, download: 0, share: 0, upload: 0, last: "" });
    me.days++; ["open", "preview", "download", "share", "upload"].forEach((k) => { me[k] += c[k] || 0; });
    if (x.day > me.last) me.last = x.day;
    const pd = perDay[x.day] || (perDay[x.day] = new Set()); pd.add(u);
    if (devices[x.device]) devices[x.device].add(u);
    if (x.app) app.add(u);
    if (x.version) versions[x.version] = (versions[x.version] || 0) + 1;
    Object.entries(x.reports || {}).forEach(([n, r]) => { const t = reports[n] || (reports[n] = { preview: 0, download: 0, share: 0 }); ["preview", "download", "share"].forEach((k) => { t[k] += r[k] || 0; }); });
  });
  console.log("=== USAGE since " + from + " (" + days + " days) ===");
  console.log("Active people: " + Object.keys(users).length);
  console.log("Phone: " + devices.phone.size + " | Desktop: " + devices.desktop.size + " | Installed app: " + app.size);
  console.log("\n-- Per person (days active, opens, previews, downloads, shares, uploads, last seen)");
  Object.entries(users).sort((a, b) => b[1].open - a[1].open).forEach(([u, m]) => console.log([u, m.days, m.open, m.preview, m.download, m.share, m.upload, m.last].join(" | ")));
  console.log("\n-- Per report (previews, downloads, shares)");
  Object.entries(reports).sort((a, b) => (b[1].preview + b[1].download) - (a[1].preview + a[1].download)).forEach(([n, r]) => console.log([n, r.preview, r.download, r.share].join(" | ")));
  console.log("\n-- Active people per day");
  Object.keys(perDay).sort().forEach((d) => console.log(d + ": " + perDay[d].size));
  console.log("\n-- Versions seen (person-days)");
  Object.entries(versions).forEach(([v, n]) => console.log(v + ": " + n));
})().catch((e) => { console.error(e); process.exit(1); });
