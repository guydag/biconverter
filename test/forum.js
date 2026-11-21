/* פורום מוביל: the areas around the existing reports page.
   Calendar (two-way with the Excel schedule), area bookings, equipment requests and useful links.
   Uses the globals of index.html: db, auth, firebase, $, closePreview. */
(function () {
  "use strict";
  var F = window.Forum = {};

  /* ---------- roles ---------- */
  var BOGER = ["מרכז בוגר", "דרג מתנדב", "מלווה ט", "מדריכת שכבה"];
  F.ROLES = ["מדריך קורס", "ראשג״ד", "ראש״צ", "מרכז צעיר"].concat(BOGER);
  F.BOGER = BOGER;
  var me = { id: "", name: "", fullName: "", role: "", admin: false };
  function isBoger() { return BOGER.indexOf(me.role) !== -1; }
  function isYoung() { return me.role === "מרכז צעיר"; }
  var can = F.can = {
    editCal: function () { return me.admin || isYoung() || isBoger(); },
    approveGear: function () { return me.admin || isYoung(); },
    seeAllGear: function () { return me.admin || isYoung() || isBoger(); },
    manageBookings: function () { return me.admin || isYoung() || isBoger(); },
    unlimitedBooking: function () { return me.role === "מדריך קורס" || me.admin; },
    manageLinks: function () { return me.admin; }
  };

  /* ---------- small helpers ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var IC = {
    cal: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    prev: '<path d="M9 6l6 6-6 6"/>', next: '<path d="M15 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    sync: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12A8 8 0 0 1 18.3 7.1"/><path d="M18 3v4.5h-4.5M6 21v-4.5h4.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    fire: '<path d="M12 22c4 0 7-2.7 7-6.6 0-3.8-3-6.4-4.4-9.4-.6 2.3-1.8 3.6-3 4.2C11.5 7.4 10 4.5 7.6 2.6 7.9 7 5 9.4 5 14.2 5 18.8 8 22 12 22z"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/>',
    tree: '<path d="M12 2l6 9h-4l4 6H6l4-6H6z"/><path d="M12 17v5"/>',
    proj: '<rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M14 11h5M14 14h3"/>',
    share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    google: '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3A9 9 0 0 0 21 12.2z"/><path d="M12 21c2.4 0 4.5-.8 6-2.2l-3-2.3a5.4 5.4 0 0 1-8-2.8H4v2.4A9 9 0 0 0 12 21z"/><path d="M7 13.7a5.4 5.4 0 0 1 0-3.4V7.9H4a9 9 0 0 0 0 8.2z"/><path d="M12 6.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 4 7.9l3 2.4a5.4 5.4 0 0 1 5-3.7z"/>',
    apple: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 12.5v5M9.5 15h5"/>'
  };
  function svg(name, w) { return '<svg width="' + (w || 20) + '" height="' + (w || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || "") + "</svg>"; }
  function iconBtn(name, label, fn, cls) { var b = el("button", cls || "cv-ib"); b.type = "button"; b.innerHTML = svg(name); b.setAttribute("aria-label", label); b.title = label; if (fn) b.addEventListener("click", fn); return b; }
  function btn(label, cls, fn, icon) { var b = el("button", "btn " + (cls || "ghost small")); b.type = "button"; b.innerHTML = icon ? svg(icon, 17) : ""; b.appendChild(document.createTextNode(label)); if (fn) b.addEventListener("click", fn); return b; }
  function toast(t) { var o = document.querySelector(".toast-f"); if (o) o.remove(); var d = el("div", "toast-f", t); d.setAttribute("role", "status"); document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }
  function myName() { return me.fullName || me.name || me.id.replace(/@.*/, ""); }
  function ts() { return firebase.firestore.FieldValue.serverTimestamp(); }

  /* Dates are handled as local "YYYY-MM-DD" strings. */
  var DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  var DAYS_S = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  var MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function addMonths(s, n) { var d = parse(s), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); }
  function today() { return iso(new Date()); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); }
  function longDate(s) { var d = parse(s); return "יום " + DAYS[d.getDay()] + ", " + d.getDate() + " ב" + MONTHS[d.getMonth()]; }
  function shortDate(s) { var d = parse(s); return d.getDate() + "." + (d.getMonth() + 1); }
  function inDays(s) { var n = diffDays(today(), s); return n === 0 ? "היום" : n === 1 ? "מחר" : n === -1 ? "אתמול" : n > 0 ? "בעוד " + n + " ימים" : "לפני " + (-n) + " ימים"; }

  function inkFor(hex) {
    hex = String(hex || "").replace("#", "");
    if (hex.length !== 6) return "#1b1b1b";
    var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#24180f" : "#ffffff";
  }
  function paint(node, hex) { hex = hex || "C9CED6"; node.style.setProperty("--cc", "#" + hex.replace("#", "")); node.style.setProperty("--ci", inkFor(hex)); return node; }

  /* ---------- modal (same look as the rest of the site) ---------- */
  function openModal(o) {
    closePreview(true);
    var ov = el("div", "pv-overlay"); ov.id = "pvOverlay";
    var box = el("div", "pv-box " + (o.cls || "")); box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", o.label || o.title || "");
    if (o.title) {
      var head = el("div", "pv-head"), tt = el("div", "pv-title"), h = el("strong", "", o.title); tt.appendChild(h);
      if (o.sub) tt.appendChild(el("span", "", o.sub));
      var x = el("button", "close-x pv-x"); x.type = "button"; x.setAttribute("aria-label", "סגירה"); x.innerHTML = svg("x", 16);
      x.addEventListener("click", function () { closePreview(); });
      head.appendChild(tt); head.appendChild(x); box.appendChild(head);
    }
    box.appendChild(o.body);
    if (o.foot && o.foot.length) { var f = el("div", "pv-foot eu-foot wrap"); o.foot.forEach(function (n) { f.appendChild(n); }); box.appendChild(f); }
    ov.appendChild(box);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) closePreview(); });
    document.body.appendChild(ov);
    document.documentElement.classList.add("pv-open");
    void ov.offsetWidth; ov.classList.add("in");
    box.tabIndex = -1; try { box.focus({ preventScroll: true }); } catch (e) {}
    return box;
  }
  function field(label, input, hint) {
    var w = el("div", "eu-f"), l = el("label", "", label);
    if (!input.id) input.id = "f" + Math.random().toString(36).slice(2, 8);
    l.htmlFor = input.id; w.appendChild(l); w.appendChild(input);
    if (hint) { var h = el("p", "eu-hint", hint); h.style.cssText = "margin:0;color:var(--muted);font-size:13px"; w.appendChild(h); }
    return w;
  }
  function input(type, val, ph) { var i = el(type === "textarea" ? "textarea" : "input", "field sm"); if (type !== "textarea") i.type = type || "text"; else i.rows = 3; if (val != null) i.value = val; if (ph) i.placeholder = ph; return i; }

  /* ---------- views and tab bar ---------- */
  var AREAS = [
    { key: "cal", label: "יומן", icon: "cal" },
    { key: "book", label: "שריון מתחמים", short: "שריונים", icon: "flag" },
    { key: "gear", label: "ציוד", icon: "box" },
    { key: "reg", label: "רשומים", icon: "file" },
    { key: "links", label: "קישורים", icon: "link" }
  ];
  function buildTabbar() {
    var nav = el("nav", "tabbar"); nav.setAttribute("aria-label", "אזורים");
    var brand = el("div", "tab-brand"); brand.innerHTML = '<img src="logo.png?v=1" alt="" width="40" height="40"><div><b>פורום מוביל</b><small>שבט משואות</small></div>';
    nav.appendChild(brand);
    AREAS.forEach(function (a) {
      var t = el("a", "tab"); t.href = "#" + a.key; t.dataset.area = a.key;
      t.innerHTML = svg(a.icon, 25) + '<span class="tl"></span><span class="bdg" hidden></span>';
      t.querySelector(".tl").textContent = window.innerWidth >= 900 ? a.label : (a.short || a.label);
      nav.appendChild(t);
    });
    document.body.appendChild(nav);
  }
  function badge(area, n) { var b = document.querySelector('.tab[data-area="' + area + '"] .bdg'); if (b) { b.hidden = !n; b.textContent = n > 9 ? "9+" : n; } }
  function head(view, title, sub) {
    var h = el("header", "fv-head");
    var logo = el("img", "fv-logo"); logo.src = "logo.png?v=1"; logo.alt = ""; h.appendChild(logo);
    var t = el("h1", "", title); if (sub) t.appendChild(el("small", "", sub)); h.appendChild(t);
    var gear = document.querySelector('#viewMain a.iconbtn[href="#settings"]');
    var a = el("a", "iconbtn"); a.href = "#settings"; a.setAttribute("aria-label", "הגדרות"); a.title = "הגדרות";
    a.innerHTML = gear ? gear.innerHTML : svg("info", 22);
    h.appendChild(a);
    view.appendChild(h);
    return h;
  }
  function makeView(id) {
    var v = el("div", "view fv"); v.id = id; v.hidden = true;
    $("app").insertBefore(v, $("viewSettings"));
    return v;
  }
  F.init = function () {
    buildTabbar();
    Cal.view = makeView("viewCal");
    Book.view = makeView("viewBook");
    Gear.view = makeView("viewGear");
    Links.view = makeView("viewLinks");
    window.addEventListener("resize", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) { var a = AREAS.filter(function (x) { return x.key === t.dataset.area; })[0]; t.querySelector(".tl").textContent = window.innerWidth >= 900 ? a.label : (a.short || a.label); });
      if (F.area === "cal" && Cal.loaded) Cal.render(true);
    });
  };
  F.viewFor = { cal: "viewCal", book: "viewBook", gear: "viewGear", links: "viewLinks", reg: "viewMain", settings: "viewSettings" };
  F.area = "";
  F.show = function (area) {
    F.area = area;
    document.body.dataset.area = area;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) { t.classList.toggle("on", t.dataset.area === area); if (t.dataset.area === area) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
    $("calFab") && ($("calFab").hidden = area !== "cal" || !can.editCal());
    if (!me.id) return;
    if (area === "cal") Cal.open();
    if (area === "book") Book.open();
    if (area === "gear") Gear.open();
    if (area === "links") Links.open();
  };
  F.onUser = function (user, isAdmin, profile) {
    document.body.classList.toggle("signed", !!user);
    if (!user) { me = { id: "", name: "", fullName: "", role: "", admin: false }; return; }
    profile = profile || {};
    me = { id: (user.email || "").toLowerCase(), name: profile.name || "", fullName: profile.fullName || "", role: profile.role || "", admin: !!isAdmin };
    Cal.loaded = Book.loaded = Gear.loaded = Links.loaded = false;
    F.show(F.area || "cal");
    Gear.count();
  };
  F.refresh = function () {
    if (F.area === "cal") return Cal.load(true);
    if (F.area === "book") return Book.load();
    if (F.area === "gear") return Gear.load();
    if (F.area === "links") return Links.load();
    return Promise.resolve();
  };

  /* ======================================================================
     Calendar
     ====================================================================== */
  var Cal = F.Cal = { events: [], cats: [], ops: [], mode: "month", loaded: false };
  Cal.open = function () {
    if (!Cal.built) Cal.build();
    if (!Cal.loaded) Cal.load();
  };
  Cal.build = function () {
    Cal.built = true;
    var v = Cal.view;
    head(v, "יומן", "הלו״ז השבטי");
    var top = el("div", "cv-top");
    var nav = el("div", "cv-nav");
    nav.appendChild(Object.assign(el("button", "cv-today", "היום"), { type: "button", onclick: function () { Cal.cur = firstOfMonth(today()); Cal.agFrom = today(); Cal.render(); } }));
    nav.appendChild(iconBtn("prev", "החודש הקודם", function () { Cal.step(-1); }));
    nav.appendChild(iconBtn("next", "החודש הבא", function () { Cal.step(1); }));
    Cal.titleEl = el("h2", "cv-title"); nav.appendChild(Cal.titleEl);
    var seg = el("div", "cv-seg"); seg.setAttribute("role", "tablist");
    [["month", "חודש"], ["agenda", "לו״ז"]].forEach(function (m) {
      var b = el("button", m[0] === Cal.mode ? "on" : "", m[1]); b.type = "button"; b.dataset.m = m[0];
      b.addEventListener("click", function () { Cal.mode = m[0]; Array.prototype.forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); }); Cal.render(); });
      seg.appendChild(b);
    });
    top.appendChild(nav); top.appendChild(seg); v.appendChild(top);
    Cal.subEl = el("div", "cv-sub"); v.appendChild(Cal.subEl);
    Cal.note = el("div", "cal-note"); Cal.note.hidden = true; v.appendChild(Cal.note);
    Cal.body = el("div", "cv-body"); v.appendChild(Cal.body);
    Cal.cur = firstOfMonth(today());
    var fab = el("button", "cal-fab"); fab.id = "calFab"; fab.type = "button"; fab.innerHTML = svg("plus", 24) + "<span>אירוע חדש</span>"; fab.hidden = !can.editCal();
    fab.addEventListener("click", function () { Cal.form(null, F.area === "cal" && Cal.mode === "month" && Cal.cur.slice(0, 7) !== today().slice(0, 7) ? Cal.cur : today()); });
    document.body.appendChild(fab);
    /* Swipe sideways to change month (RTL: swiping right goes forward). */
    var x0 = null, y0 = 0;
    Cal.body.addEventListener("touchstart", function (e) { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    Cal.body.addEventListener("touchend", function (e) {
      if (x0 === null || Cal.mode !== "month") return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) Cal.step(dx > 0 ? 1 : -1);
    }, { passive: true });
  };
  function firstOfMonth(s) { return s.slice(0, 8) + "01"; }
  Cal.step = function (n) {
    if (Cal.mode === "agenda") { Cal.agFrom = addDays(Cal.agFrom || today(), n * 30); }
    else Cal.cur = addMonths(Cal.cur, n);
    Cal.render();
  };
  Cal.load = function (force) {
    if (Cal.unsub && !force) return Promise.resolve();
    Cal.body.innerHTML = '<p class="fv-empty">טוען את הלו״ז…</p>';
    return new Promise(function (resolve) {
      var got = 0, done = function () { if (++got === 2) { Cal.loaded = true; Cal.render(); resolve(); } };
      if (Cal.unsub) Cal.unsub.forEach(function (u) { u(); });
      Cal.unsub = [
        db.collection("cal").doc("all").onSnapshot(function (s) {
          var d = s.exists ? s.data() : {};
          try { Cal.events = d.events ? JSON.parse(d.events) : []; } catch (e) { Cal.events = []; }
          Cal.cats = d.cats || [];
          Cal.syncedAt = d.at && d.at.toDate ? d.at.toDate() : null;
          Cal.empty = !s.exists;
          if (got < 2) done(); else Cal.render(true);
        }, function () { Cal.error = true; if (got < 2) done(); }),
        db.collection("cal_ops").where("state", "in", ["pending", "failed"]).onSnapshot(function (s) {
          var list = []; s.forEach(function (d) { var o = d.data(); o.id = d.id; list.push(o); });
          Cal.ops = list;
          if (got < 2) done(); else Cal.render(true);
        }, function () { Cal.ops = []; if (got < 2) done(); })
      ];
    });
  };
  /* The events as shown: the Excel's events, with changes that are still on their way to the Excel. */
  Cal.list = function () {
    var byId = {}, out = Cal.events.map(function (e) { var c = Object.assign({}, e); byId[c.id] = c; return c; });
    var dayAgo = Date.now() - 864e5;
    Cal.ops.slice().sort(function (a, b) { return (a.atMs || 0) - (b.atMs || 0); }).forEach(function (o) {
      if (o.state === "failed") {
        if (o.uid === me.id && (o.atMs || 0) > dayAgo) Cal.failed = o;
        return;
      }
      if (o.kind === "add") {
        out.push({ id: "op:" + o.id, opId: o.id, pend: "add", title: o.title, time: o.time || "", timeEnd: o.timeEnd || "", date: o.date, end: o.end || o.date, cat: o.cat || "", color: o.color || "" });
        return;
      }
      var e = byId[o.target];
      if (!e) return;
      if (o.kind === "delete") { e.hide = true; return; }
      ["title", "time", "timeEnd", "cat", "color"].forEach(function (k) { if (o[k] != null) e[k] = o[k]; });
      if (o.kind === "move") { e.date = o.date; e.end = o.end || o.date; }
      e.pend = o.kind; e.opId = o.id;
    });
    return out.filter(function (e) { return !e.hide; });
  };
  Cal.catColor = function (name) { var c = Cal.cats.filter(function (x) { return x.name === name; })[0]; return c ? c.color : ""; };
  F.isActivity = function (e) { return e.cat === "פעולה" || /^פעול/.test(String(e.title || "").trim()); };
  /* Dates of regular activities (פעולות) from the schedule. */
  F.activityDates = function () {
    var set = {};
    (Cal.loaded ? Cal.list() : Cal.events).forEach(function (e) { if (F.isActivity(e)) set[e.date] = true; });
    return Object.keys(set).sort();
  };
  F.needCal = function () { if (!Cal.built) Cal.build(); return Cal.loaded ? Promise.resolve() : Cal.load(); };

  Cal.render = function (still) {
    if (!Cal.built) return;
    Cal.failed = null;
    var list = Cal.list();
    Cal.body.classList.toggle("still", !!still);
    if (!still) { Cal.body.style.animation = "none"; void Cal.body.offsetWidth; Cal.body.style.animation = ""; }
    // Subtitle: sync state + legend
    Cal.subEl.textContent = "";
    var src = el("span", "", Cal.syncedAt ? "מסונכרן עם האקסל של הלו״ז · עודכן " + timeAgo(Cal.syncedAt) : "מסונכרן עם האקסל של הלו״ז");
    Cal.subEl.appendChild(src);
    var lg = el("span", "cv-legend");
    Cal.cats.forEach(function (c) { var s = el("span"); var i = el("i"); paint(i, c.color); s.appendChild(i); s.appendChild(document.createTextNode(c.name)); lg.appendChild(s); });
    Cal.subEl.appendChild(lg);
    // Notes: pending changes, failures, not set up yet
    var pend = Cal.ops.filter(function (o) { return o.state === "pending"; }).length;
    Cal.note.hidden = true; Cal.note.className = "cal-note";
    if (Cal.error) { Cal.note.innerHTML = svg("info", 18); Cal.note.appendChild(document.createTextNode("אין הרשאה לקרוא את הלו״ז. צריך לעדכן את חוקי Firebase (ראו ההוראות)."));  Cal.note.hidden = false; }
    else if (Cal.empty) { Cal.note.innerHTML = svg("sync", 18); Cal.note.appendChild(document.createTextNode("הלו״ז עוד לא נטען מהאקסל. הסנכרון הראשון רץ אוטומטית כל כמה דקות.")); Cal.note.hidden = false; }
    else if (Cal.failed) { Cal.note.innerHTML = svg("info", 18); Cal.note.appendChild(document.createTextNode("שינוי ששלחת לא נכנס לאקסל: " + (Cal.failed.error || "שגיאה") + " (" + (Cal.failed.title || "") + ")")); Cal.note.hidden = false; Cal.note.style.borderColor = "var(--err)"; Cal.note.style.color = "var(--err)"; }
    else if (pend) { Cal.note.innerHTML = svg("sync", 18); Cal.note.appendChild(document.createTextNode(pend === 1 ? "שינוי אחד ממתין להיכנס לאקסל (עד כמה דקות). הוא כבר מופיע ביומן עם פסים." : pend + " שינויים ממתינים להיכנס לאקסל (עד כמה דקות). הם כבר מופיעים ביומן עם פסים.")); Cal.note.hidden = false; }
    if (Cal.note.hidden) { Cal.note.style.borderColor = ""; Cal.note.style.color = ""; }
    if (Cal.mode === "agenda") Cal.renderAgenda(list); else Cal.renderMonth(list);
  };
  function timeAgo(d) { var m = Math.round((Date.now() - d.getTime()) / 60000); return m < 1 ? "עכשיו" : m < 60 ? "לפני " + m + " דק׳" : m < 1440 ? "לפני " + Math.round(m / 60) + " שע׳" : "לפני " + Math.round(m / 1440) + " ימים"; }
  function sortEv(a, b) { return (a.time || "99:99").localeCompare(b.time || "99:99") || String(a.title).localeCompare(String(b.title), "he"); }

  Cal.renderMonth = function (list) {
    var cur = parse(Cal.cur);
    Cal.titleEl.textContent = MONTHS[cur.getMonth()] + " " + cur.getFullYear();
    var start = iso(new Date(cur.getFullYear(), cur.getMonth(), 1 - cur.getDay()));
    var last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    var end = iso(new Date(last.getFullYear(), last.getMonth(), last.getDate() + (6 - last.getDay())));
    var weeks = (diffDays(start, end) + 1) / 7;
    var phone = window.matchMedia("(max-width: 600px)").matches;
    var CELL = phone ? 96 : 110, BT = phone ? 25 : 29, BL = phone ? 18 : 22, STEP = phone ? 18 : 22;
    var acts = {}; list.forEach(function (e) { if (F.isActivity(e)) acts[e.date] = true; });
    var t = today();

    var month = el("div", "cv-month");
    var wd = el("div", "cv-wd"); DAYS_S.forEach(function (d) { wd.appendChild(el("span", "", d)); }); month.appendChild(wd);
    var grid = el("div", "cv-grid"); grid.style.setProperty("--rows", weeks); month.appendChild(grid);
    for (var w = 0; w < weeks; w++) {
      var ws = addDays(start, w * 7), we = addDays(ws, 6);
      var wk = el("div", "cv-wk");
      // Multi-day events become bars, in lanes.
      var bars = list.filter(function (e) { return e.end && e.end !== e.date && e.date <= we && e.end >= ws; })
        .sort(function (a, b) { return a.date.localeCompare(b.date) || diffDays(b.date, b.end) - diffDays(a.date, a.end); });
      var lanes = [], used = [0, 0, 0, 0, 0, 0, 0];
      bars.forEach(function (e) {
        var c0 = Math.max(0, diffDays(ws, e.date)), c1 = Math.min(6, diffDays(ws, e.end));
        var ln = 0; while (lanes[ln] && lanes[ln].some(function (r) { return !(c1 < r[0] || c0 > r[1]); })) ln++;
        (lanes[ln] = lanes[ln] || []).push([c0, c1]);
        e._b = { c0: c0, sp: c1 - c0 + 1, ln: ln, cl: e.date < ws, cr: e.end > we };
        for (var k = c0; k <= c1; k++) used[k] = Math.max(used[k], ln + 1);
      });
      var barBox = el("div", "cv-bars");
      for (var c = 0; c < 7; c++) {
        var day = addDays(ws, c), dt = parse(day);
        var cell = el("div", "cv-cell" + (dt.getMonth() !== cur.getMonth() ? " out" : "") + (day === t ? " today" : "") + (acts[day] ? " act" : ""));
        cell.dataset.d = day;
        var num = el("span", "cv-num", String(dt.getDate())); cell.appendChild(num);
        var items = el("div", "cv-items");
        if (used[c]) { var sp = el("i", "cv-sp"); sp.style.setProperty("--n", used[c]); items.appendChild(sp); }
        var singles = list.filter(function (e) { return (!e.end || e.end === e.date) && e.date === day; }).sort(sortEv);
        var room = Math.max(0, Math.floor((CELL - BT - used[c] * BL + 2) / STEP));
        var show = singles.length > room ? Math.max(0, room - 1) : singles.length;
        singles.slice(0, show).forEach(function (e) { items.appendChild(chip(e)); });
        if (singles.length > show) {
          var more = el("button", "cv-more", "+" + (singles.length - show) + " עוד"); more.type = "button";
          more.addEventListener("click", function (d) { return function (ev) { ev.stopPropagation(); Cal.day(d); }; }(day));
          items.appendChild(more);
        }
        cell.appendChild(items);
        cell.addEventListener("click", function (d) { return function () { Cal.day(d); }; }(day));
        wk.appendChild(cell);
      }
      bars.forEach(function (e) {
        var b = chip(e); b.classList.add("cv-bar"); if (e._b.cl) b.classList.add("cl"); if (e._b.cr) b.classList.add("cr");
        b.style.setProperty("--c0", e._b.c0); b.style.setProperty("--sp", e._b.sp); b.style.setProperty("--ln", e._b.ln);
        barBox.appendChild(b);
      });
      wk.appendChild(barBox);
      grid.appendChild(wk);
    }
    Cal.body.textContent = ""; Cal.body.appendChild(month);
  };
  function chip(e) {
    var b = el("button", "cv-chip" + (e.pend ? " pend" : "")); b.type = "button";
    paint(b, e.color || Cal.catColor(e.cat));
    if (e.time) b.appendChild(el("span", "ct", e.time));
    b.appendChild(el("span", "", e.title));
    b.title = (e.time ? e.time + " " : "") + e.title;
    b.addEventListener("click", function (ev) { ev.stopPropagation(); Cal.show(e); });
    return b;
  }
  function evRow(e, past) {
    var b = el("button", "cal-ev" + (past ? " past" : "") + (e.pend ? " pend" : "")); b.type = "button";
    paint(b, e.color || Cal.catColor(e.cat));
    var t = el("span", "cal-t", e.time ? e.time + (e.timeEnd ? "–" + e.timeEnd : "") : (e.end && e.end !== e.date ? shortDate(e.date) + "–" + shortDate(e.end) : "כל היום"));
    var body = el("span", "cal-b"); body.appendChild(el("b", "", e.title));
    var sm = [e.cat, e.pend ? "ממתין לאקסל" : ""].filter(Boolean).join(" · "); if (sm) body.appendChild(el("small", "", sm));
    b.appendChild(t); b.appendChild(body);
    b.addEventListener("click", function () { Cal.show(e); });
    return b;
  }
  Cal.renderAgenda = function (list) {
    var from = Cal.agFrom || today(), to = addDays(from, 29), t = today();
    Cal.titleEl.textContent = shortDate(from) + " – " + shortDate(to);
    var box = el("div", "cal-agenda"), any = false;
    for (var d = from; d <= to; d = addDays(d, 1)) {
      var evs = list.filter(function (e) { return e.date <= d && (e.end || e.date) >= d; }).sort(sortEv);
      if (!evs.length) continue;
      any = true;
      var card = el("section", "cal-day");
      var dh = el("div", "cal-dh" + (d === t ? " today" : "")); dh.appendChild(el("b", "", longDate(d))); dh.appendChild(el("span", "", inDays(d)));
      card.appendChild(dh);
      var items = el("div", "cal-items");
      evs.forEach(function (e) { items.appendChild(evRow(e, d < t)); });
      card.appendChild(items); box.appendChild(card);
    }
    if (!any) box.appendChild(el("p", "fv-empty", "אין אירועים ב-30 הימים האלה."));
    var more = btn("30 הימים הבאים", "ghost small cal-more-btn", function () { Cal.step(1); });
    box.appendChild(more);
    Cal.body.textContent = ""; Cal.body.appendChild(box);
  };
  Cal.day = function (d) {
    var list = Cal.list().filter(function (e) { return e.date <= d && (e.end || e.date) >= d; }).sort(sortEv);
    var body = el("div", "daylist");
    if (!list.length) body.appendChild(el("p", "fv-empty", "אין אירועים ביום הזה."));
    var items = el("div", "cal-items"); list.forEach(function (e) { items.appendChild(evRow(e, false)); }); body.appendChild(items);
    var foot = [];
    if (can.editCal()) foot.push(btn("אירוע חדש ביום הזה", "primary small", function () { Cal.form(null, d); }, "plus"));
    foot.push(btn("סגירה", "ghost small", function () { closePreview(); }));
    openModal({ title: longDate(d), sub: inDays(d), body: body, foot: foot });
  };

  /* Event details: add to my own calendar, and edit/delete for those allowed. */
  Cal.show = function (e) {
    var body = el("div", "evd"); paint(body, e.color || Cal.catColor(e.cat));
    var h = el("div", "evd-head"); h.appendChild(el("i")); h.appendChild(el("h3", "", e.title));
    var acts = el("div", "evd-acts");
    if (can.editCal()) {
      acts.appendChild(iconBtn("pen", "עריכה", function () { Cal.form(e); }));
      acts.appendChild(iconBtn("trash", "מחיקה", function () { confirmDel(); }));
    }
    acts.appendChild(iconBtn("x", "סגירה", function () { closePreview(); }));
    h.appendChild(acts); body.appendChild(h);
    function row(icon, text, cls) { var r = el("div", "evd-row " + (cls || "")); r.innerHTML = svg(icon, 18); var s = el("span"); if (typeof text === "string") s.textContent = text; else s.appendChild(text); r.appendChild(s); body.appendChild(r); return r; }
    var when = longDate(e.date) + (e.end && e.end !== e.date ? " – " + longDate(e.end) : "");
    if (e.time) when += " · " + e.time + (e.timeEnd ? "–" + e.timeEnd : "");
    row("clock", when);
    if (e.cat) { var c = el("span", "evd-catbtn"); c.appendChild(el("i")); c.appendChild(document.createTextNode(e.cat)); row("tag", c); }
    if (e.sheet) row("sheet", "באקסל: גיליון " + e.sheet + " · תא " + e.ref, "muted");
    if (e.pend) { var p = el("div", "evd-pend"); p.innerHTML = svg("sync", 18); p.appendChild(document.createTextNode(e.pend === "add" ? "האירוע נשמר ויתווסף לאקסל בדקות הקרובות." : "השינוי נשמר ויעודכן באקסל בדקות הקרובות.")); body.appendChild(p); }
    var open = el("div", "evd-open");
    var g = el("a", "btn ghost small"); g.href = gcalLink(e); g.target = "_blank"; g.rel = "noopener"; g.innerHTML = svg("google", 17); g.appendChild(document.createTextNode("הוספה ליומן Google"));
    open.appendChild(g);
    open.appendChild(btn("הוספה ליומן בטלפון", "ghost small", function () { downloadIcs(e); }, "apple"));
    body.appendChild(open);
    function confirmDel() {
      if (body.querySelector(".evd-confirm")) return;
      var c = el("div", "evd-confirm"); c.appendChild(el("span", "", "למחוק את האירוע מהיומן ומהאקסל?"));
      c.appendChild(btn("מחיקה", "primary tiny", async function () {
        try {
          if (e.pend && e.opId && e.pend !== "delete") await db.collection("cal_ops").doc(e.opId).delete();
          if (e.sheet) await Cal.op({ kind: "delete", target: e.id, sheet: e.sheet, ref: e.ref, raw: e.raw, title: e.title });
          closePreview(); toast("האירוע נמחק");
        } catch (er) { toast("המחיקה לא הצליחה"); }
      }));
      c.appendChild(btn("ביטול", "ghost tiny", function () { c.remove(); }));
      body.appendChild(c);
    }
    openModal({ label: e.title, body: body, cls: "evd-box" });
  };
  Cal.op = function (o) {
    o.state = "pending"; o.uid = me.id; o.byName = myName(); o.at = ts(); o.atMs = Date.now();
    return db.collection("cal_ops").add(o);
  };

  /* New / edit event form */
  Cal.form = function (e, date) {
    if (!can.editCal()) return;
    var editing = !!e;
    var base = e ? (Cal.events.filter(function (x) { return x.id === e.id; })[0] || e) : null;
    var body = el("form", "evc"); body.noValidate = true;
    var top = el("div", "evc-top"); top.appendChild(el("b", "", editing ? "עריכת אירוע" : "אירוע חדש"));
    var save = el("button", "btn primary tiny", "שמירה"); save.type = "submit";
    top.appendChild(save); top.appendChild(iconBtn("x", "סגירה", function () { closePreview(); }));
    body.appendChild(top);
    var title = el("input", "evc-title"); title.placeholder = "שם האירוע"; title.value = e ? e.title : ""; title.setAttribute("aria-label", "שם האירוע");
    body.appendChild(title);
    function row(icon) { var r = el("div", "evc-row"); r.innerHTML = svg(icon, 20); var c = el("div", "evc-col"); r.appendChild(c); body.appendChild(r); return c; }
    // Date(s)
    var dc = row("cal");
    var multi = el("label", "evc-sw"); multi.appendChild(el("span", "", "כמה ימים")); var mi = el("input"); mi.type = "checkbox"; multi.appendChild(mi); multi.appendChild(el("i"));
    var dl = el("div", "evc-line");
    var d1 = el("input", "evc-pick"); d1.type = "date"; d1.value = e ? e.date : (date || today());
    var dash = el("em", "", "עד"); var d2 = el("input", "evc-pick"); d2.type = "date"; d2.value = e && e.end ? e.end : d1.value;
    var endWrap = el("span", "evc-end"); endWrap.style.display = "contents"; endWrap.appendChild(dash); endWrap.appendChild(d2);
    dl.appendChild(d1); dl.appendChild(endWrap);
    mi.checked = !!(e && e.end && e.end !== e.date);
    function syncEnd() { dash.hidden = d2.hidden = !mi.checked; if (!mi.checked) d2.value = d1.value; else if (d2.value < d1.value) d2.value = d1.value; }
    mi.addEventListener("change", syncEnd); d1.addEventListener("change", function () { if (!mi.checked || d2.value < d1.value) d2.value = d1.value; }); syncEnd();
    dc.appendChild(multi); dc.appendChild(dl);
    // Time
    var tc = row("clock");
    var allDay = el("label", "evc-sw"); allDay.appendChild(el("span", "", "שעה")); var ai = el("input"); ai.type = "checkbox"; allDay.appendChild(ai); allDay.appendChild(el("i"));
    var tl = el("div", "evc-line evc-times");
    var t1 = el("input", "evc-pick"); t1.type = "time"; t1.value = e && e.time ? pad5(e.time) : "16:30";
    var t2 = el("input", "evc-pick"); t2.type = "time"; t2.value = e && e.timeEnd ? pad5(e.timeEnd) : "";
    tl.appendChild(t1); tl.appendChild(el("em", "", "עד")); tl.appendChild(t2);
    ai.checked = !!(e && e.time);
    function syncTime() { tl.hidden = !ai.checked; } ai.addEventListener("change", syncTime); syncTime();
    tc.appendChild(allDay); tc.appendChild(tl);
    // Category
    var cc = row("tag");
    var pick = el("div", "catpick"), cat = e ? e.cat || "" : "";
    var cats = Cal.cats.length ? Cal.cats : [{ name: "פעולה", color: "FFE598" }];
    cats.forEach(function (c) {
      var b = el("button", c.name === cat ? "on" : ""); b.type = "button"; paint(b, c.color); b.appendChild(el("i")); b.appendChild(document.createTextNode(c.name));
      b.addEventListener("click", function () { cat = cat === c.name ? "" : c.name; Array.prototype.forEach.call(pick.children, function (x) { x.classList.toggle("on", x === b && !!cat); }); });
      pick.appendChild(b);
    });
    cc.appendChild(pick);
    var err = el("p", "evc-err"); body.appendChild(err);
    var note = el("div", "evc-note"); note.innerHTML = svg("sync", 15); note.appendChild(document.createTextNode("השינוי יירשם גם באקסל של הלו״ז תוך כמה דקות.")); body.appendChild(note);
    body.addEventListener("submit", async function (ev) {
      ev.preventDefault(); err.textContent = "";
      var tt = title.value.replace(/\s+/g, " ").trim();
      if (!tt) { title.classList.remove("shake"); void title.offsetWidth; title.classList.add("shake"); title.focus(); return; }
      if (!d1.value) { err.textContent = "יש לבחור תאריך."; return; }
      var o = { title: tt, date: d1.value, end: mi.checked && d2.value > d1.value ? d2.value : d1.value, time: ai.checked ? t1.value : "", timeEnd: ai.checked ? t2.value : "", cat: cat, color: cat ? Cal.catColor(cat) : "" };
      save.disabled = true;
      try {
        if (!editing) await Cal.op(Object.assign({ kind: "add" }, o));
        else if (e.pend === "add" && e.opId) await db.collection("cal_ops").doc(e.opId).set(o, { merge: true });
        else {
          var moved = o.date !== base.date || o.end !== (base.end || base.date);
          if (e.pend && e.opId) await db.collection("cal_ops").doc(e.opId).delete();
          await Cal.op(Object.assign({ kind: moved ? "move" : "edit", target: base.id, sheet: base.sheet, ref: base.ref, raw: base.raw }, o));
        }
        closePreview(); toast(editing ? "השינוי נשמר" : "האירוע נוסף");
      } catch (er) { err.textContent = "השמירה לא הצליחה. ייתכן שחסרה הרשאה."; save.disabled = false; }
    });
    openModal({ label: editing ? "עריכת אירוע" : "אירוע חדש", body: body, cls: "evc-box" });
    if (!editing && !("ontouchstart" in window)) title.focus();
  };
  function pad5(t) { var m = /^(\d{1,2}):(\d{2})/.exec(t || ""); return m ? pad(+m[1]) + ":" + m[2] : ""; }

  /* Adding an event to the person's own calendar */
  function stamp(d, t) { return d.replace(/-/g, "") + (t ? "T" + pad5(t).replace(":", "") + "00" : ""); }
  function endOf(e) {
    if (!e.time) return { d: addDays(e.end || e.date, 1), t: "" };
    if (e.timeEnd) return { d: e.end || e.date, t: e.timeEnd };
    var m = /^(\d{1,2}):(\d{2})/.exec(e.time), h = +m[1] + 1;
    return h >= 24 ? { d: addDays(e.date, 1), t: pad(h - 24) + ":" + m[2] } : { d: e.end || e.date, t: pad(h) + ":" + m[2] };
  }
  function gcalLink(e) {
    var en = endOf(e);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(e.title) +
      "&dates=" + stamp(e.date, e.time) + "/" + stamp(en.d, en.t) + "&ctz=Asia/Jerusalem&details=" + encodeURIComponent("מהלו״ז של שבט משואות" + (e.cat ? " · " + e.cat : ""));
  }
  function downloadIcs(e) {
    var en = endOf(e), esc = function (s) { return String(s).replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n"); };
    var dt = function (d, t) { return t ? ";TZID=Asia/Jerusalem:" + stamp(d, t) : ";VALUE=DATE:" + stamp(d, ""); };
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//masuot//forum//HE", "BEGIN:VEVENT",
      "UID:" + (e.id || Date.now()).toString().replace(/[^\w]/g, "") + "@masuot.app",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""),
      "DTSTART" + dt(e.date, e.time), "DTEND" + dt(en.d, en.t), "SUMMARY:" + esc(e.title),
      "DESCRIPTION:" + esc("מהלו״ז של שבט משואות"), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (e.title || "event").replace(/[\\\/:*?"<>|]/g, "") + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  /* ======================================================================
     Area bookings (שריון מתחמים)
     ====================================================================== */
  var PLACES = [
    { key: "fire", name: "שטח אש", icon: "fire", hint: "יש לתאם עם בוגר בהודעה, ולכתוב אותו לאחר התיאום.", extra: [{ k: "boger", label: "הבוגר שתואם איתו" }] },
    { key: "home", name: "פעילות בשבט", icon: "home", hint: "כמה חניכים נמצאים בבית." },
    { key: "out", name: "פעילות מחוץ לשבט", icon: "bus", hint: "צריך אישור הורים בוואטסאפ או בכתב.", extra: [{ k: "where", label: "לאן יוצאים" }, { k: "groups", label: "כמות קבוצות", type: "number" }] },
    { key: "meah", name: "גן המאה", icon: "tree", extra: [{ k: "boger", label: "שם הבוגר בשטח" }] },
    { key: "zuck", name: "גן צוקרמן", icon: "tree", extra: [{ k: "boger", label: "שם הבוגר בשטח" }] },
    { key: "proj", name: "מקרן", icon: "proj", noCount: true, extra: [{ k: "hours", label: "שעות", ph: "15:00-16:30" }] }
  ];
  F.PLACES = PLACES;
  var Book = F.Book = { list: [], tab: "next", loaded: false };
  Book.open = function () { if (!Book.built) Book.build(); if (!Book.loaded) Book.load(); };
  Book.build = function () {
    Book.built = true;
    var v = Book.view;
    head(v, "שריון מתחמים", "לפי תאריכי הפעולות בלו״ז");
    var r = el("div", "bk-rules");
    r.innerHTML = "<span>אפשר לשריין עד <b>חודשיים קדימה</b></span><span>שריון אחד <b>בכל חודשיים</b></span><span>מדריכי קורס – בלי הגבלה</span>";
    v.appendChild(r);
    var seg = el("div", "fseg");
    [["next", "פעולות קרובות"], ["mine", "השריונים שלי"]].forEach(function (s) {
      var b = el("button", s[0] === Book.tab ? "on" : "", s[1]); b.type = "button";
      b.addEventListener("click", function () { Book.tab = s[0]; Array.prototype.forEach.call(seg.children, function (x) { x.classList.toggle("on", x === b); }); Book.render(); });
      seg.appendChild(b);
    });
    v.appendChild(seg);
    Book.err = el("div", "fv-err"); Book.err.hidden = true; v.appendChild(Book.err);
    Book.body = el("div", "bk-list"); v.appendChild(Book.body);
  };
  Book.load = async function () {
    Book.body.innerHTML = '<p class="fv-empty">טוען…</p>';
    Book.err.hidden = true;
    try {
      await F.needCal();
      var snap = await db.collection("bookings").where("date", ">=", addDays(today(), -60)).get();
      Book.list = []; snap.forEach(function (d) { var x = d.data(); x.id = d.id; Book.list.push(x); });
      Book.loaded = true;
    } catch (e) { Book.err.textContent = "לא הצלחנו לטעון את השריונים (ייתכן שחסרה הרשאה ב-Firebase)."; Book.err.hidden = false; Book.list = []; }
    Book.render();
  };
  Book.limit = function () { return addMonths(today(), 2); };
  Book.mineNear = function (date, exceptId) {
    return Book.list.filter(function (b) { return b.uid === me.id && b.id !== exceptId && Math.abs(diffDays(b.date, date)) < 61; });
  };
  Book.render = function () {
    var box = Book.body; box.textContent = "";
    var t = today(), lim = Book.limit();
    if (Book.tab === "mine") {
      var mine = Book.list.filter(function (b) { return b.uid === me.id && b.date >= t; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      if (!mine.length) box.appendChild(el("p", "fv-empty", "אין לך שריונים קרובים."));
      mine.forEach(function (b) {
        var card = el("section", "bk-day"); card.appendChild(dayHead(b.date, ""));
        var areas = el("div", "bk-areas"); areas.appendChild(areaCell(b.date, PLACES.filter(function (p) { return p.key === b.area; })[0] || { key: b.area, name: b.area, icon: "flag" }, b)); card.appendChild(areas); box.appendChild(card);
      });
      return;
    }
    var set = {};
    F.activityDates().forEach(function (d) { if (d >= t && d <= addMonths(t, 4)) set[d] = true; });
    Book.list.forEach(function (b) { if (b.date >= t) set[b.date] = true; });
    var dates = Object.keys(set).sort();
    if (!dates.length) box.appendChild(el("p", "fv-empty", Cal.empty ? "תאריכי הפעולות יופיעו כאן אחרי שהלו״ז ייטען מהאקסל." : "לא נמצאו פעולות קרובות בלו״ז."));
    dates.forEach(function (d) {
      var locked = d > lim;
      var card = el("section", "bk-day" + (locked ? " locked" : ""));
      card.appendChild(dayHead(d, locked ? "ייפתח לשריון ב-" + shortDate(addMonths(d, -2)) : ""));
      var areas = el("div", "bk-areas");
      PLACES.forEach(function (p) {
        var b = Book.list.filter(function (x) { return x.date === d && x.area === p.key; })[0];
        areas.appendChild(areaCell(d, p, b, locked));
      });
      card.appendChild(areas); box.appendChild(card);
    });
  };
  function dayHead(d, extra) {
    var h = el("div", "bk-dh"), dd = parse(d);
    var bx = el("div", "bk-d"); bx.appendChild(el("b", "", String(dd.getDate()))); bx.appendChild(el("small", "", MONTHS[dd.getMonth()].slice(0, 3)));
    var tx = el("div", "bk-t"); tx.appendChild(el("strong", "", longDate(d)));
    var evs = (Cal.loaded ? Cal.list() : []).filter(function (e) { return e.date === d && F.isActivity(e); });
    tx.appendChild(el("span", "", [inDays(d), evs.map(function (e) { return e.title + (e.time ? " " + e.time : ""); }).join(", "), extra].filter(Boolean).join(" · ")));
    h.appendChild(bx); h.appendChild(tx); return h;
  }
  function areaCell(d, p, b, locked) {
    var mine = b && b.uid === me.id;
    var c = el("div", "bk-a " + (b ? (mine ? "mine taken" : "taken") : "free"));
    var ic = el("span", "ic"); ic.innerHTML = svg(p.icon, 19); c.appendChild(ic);
    var tx = el("div", "tx"); tx.appendChild(el("b", "", p.name));
    if (b) { tx.appendChild(el("span", "", b.text || "")); var who = b.byName ? "שוריין ע״י " + b.byName : (b.imported ? "מהטבלה הקודמת" : ""); if (who) tx.appendChild(el("em", "", who)); }
    else tx.appendChild(el("span", "", locked ? "עוד לא פתוח לשריון" : "פנוי"));
    c.appendChild(tx);
    var acts = el("div", "acts");
    if (!b && !locked && d >= today()) acts.appendChild(btn("שריון", "primary tiny", function () { Book.form(d, p); }));
    if (b && (mine || can.manageBookings())) {
      if (mine) acts.appendChild(iconBtn("pen", "עריכה", function () { Book.form(d, p, b); }));
      acts.appendChild(iconBtn("trash", "ביטול השריון", function () { Book.cancel(b, c); }));
    }
    c.appendChild(acts);
    return c;
  }
  Book.cancel = function (b, cell) {
    var acts = cell.querySelector(".acts"); acts.textContent = "";
    acts.appendChild(btn("לבטל?", "primary tiny", async function () {
      try { await db.collection("bookings").doc(b.id).delete(); Book.list = Book.list.filter(function (x) { return x.id !== b.id; }); Book.render(); toast("השריון בוטל"); }
      catch (e) { toast("הביטול לא הצליח"); }
    }));
    acts.appendChild(iconBtn("x", "לא", function () { Book.render(); }));
  };
  Book.form = function (d, p, b) {
    var editing = !!b, vals = (b && b.fields) || {};
    var body = el("form", "eu-body"); body.noValidate = true;
    if (p.hint) { var i = el("div", "fv-info", p.hint); body.appendChild(i); }
    var unit = input("text", vals.unit || "", "למשל: גדוד אביב"), count = input("number", vals.count || "", "כמה חניכים");
    count.inputMode = "numeric"; count.min = "1";
    var row = el("div", "frow"); row.appendChild(field("שם הגדוד / הקבוצה", unit)); if (!p.noCount) row.appendChild(field("כמות חניכים", count)); body.appendChild(row);
    var extras = {};
    (p.extra || []).forEach(function (x) { var inp = input(x.type || "text", vals[x.k] || "", x.ph || ""); extras[x.k] = inp; body.appendChild(field(x.label, inp)); });
    var note = input("textarea", vals.note || "", "הערות (לא חובה)"); body.appendChild(field("הערות", note));
    var err = el("p", "eu-msg eu-err"); body.appendChild(err);
    var save = el("button", "btn primary small", editing ? "שמירה" : "שריון"); save.type = "submit";
    body.addEventListener("submit", async function (ev) {
      ev.preventDefault(); err.textContent = "";
      var f = { unit: unit.value.trim(), count: p.noCount ? "" : count.value.trim(), note: note.value.trim() };
      Object.keys(extras).forEach(function (k) { f[k] = extras[k].value.trim(); });
      if (!f.unit) { err.textContent = "יש לכתוב שם גדוד או קבוצה."; return; }
      if (d > Book.limit()) { err.textContent = "אפשר לשריין רק עד חודשיים קדימה."; return; }
      if (!editing && !can.unlimitedBooking()) {
        var near = Book.mineNear(d);
        if (near.length) { err.textContent = "כבר יש לך שריון ב-" + shortDate(near[0].date) + ". אפשר לשריין פעם אחת בכל חודשיים."; return; }
      }
      var text = [f.unit, f.count ? f.count + " חניכים" : "", f.where, f.groups ? f.groups + " קבוצות" : "", f.hours, f.boger ? "בוגר: " + f.boger : "", f.note].filter(Boolean).join(" · ");
      var id = d + "_" + p.key, ref = db.collection("bookings").doc(id);
      save.disabled = true;
      try {
        await db.runTransaction(async function (tx) {
          var cur = await tx.get(ref);
          if (cur.exists && !(editing && cur.data().uid === me.id)) throw new Error("taken");
          var doc = { date: d, area: p.key, areaName: p.name, text: text, fields: f, uid: me.id, byName: myName(), role: me.role, at: ts() };
          if (editing) doc.at = (b.at || ts());
          tx.set(ref, doc);
        });
        closePreview(); toast(editing ? "השריון עודכן" : "שוריין " + p.name + " ל-" + shortDate(d));
        Book.load();
      } catch (e) {
        err.textContent = e && e.message === "taken" ? "מישהו כבר שריין את " + p.name + " בתאריך הזה." : "השריון לא הצליח. נסו שוב.";
        save.disabled = false; if (e && e.message === "taken") Book.load();
      }
    });
    var foot = el("div", "pv-foot eu-foot"); foot.appendChild(save); foot.appendChild(btn("ביטול", "ghost small", function () { closePreview(); })); body.appendChild(foot);
    openModal({ title: (editing ? "עריכת שריון · " : "שריון ") + p.name, sub: longDate(d), body: body });
  };

  /* ======================================================================
     Equipment requests (בקשת ציוד מרכז)
     ====================================================================== */
  var Gear = F.Gear = { list: [], tab: "mine", loaded: false };
  var ST = { pending: "ממתין לאישור", approved: "אושר", changes: "הוחזר לתיקון" };
  Gear.open = function () { if (!Gear.built) Gear.build(); if (!Gear.loaded) Gear.load(); else Gear.render(); };
  Gear.build = function () {
    Gear.built = true;
    var v = Gear.view;
    var h = head(v, "בקשת ציוד", "לתאריכי פעולות בלבד");
    Gear.newBtn = btn("בקשה חדשה", "primary small", function () { Gear.form(); }, "plus");
    h.insertBefore(Gear.newBtn, h.lastChild);
    Gear.seg = el("div", "fseg"); v.appendChild(Gear.seg);
    Gear.err = el("div", "fv-err"); Gear.err.hidden = true; v.appendChild(Gear.err);
    Gear.body = el("div", "gr-list"); v.appendChild(Gear.body);
  };
  Gear.tabs = function () {
    var t = [["mine", "הבקשות שלי"]];
    if (can.approveGear()) t.push(["review", "לאישור"]);
    if (can.seeAllGear()) { t.push(["shop", "רשימת קניות"]); t.push(["all", "כל הבקשות"]); }
    return t;
  };
  Gear.load = async function () {
    Gear.body.innerHTML = '<p class="fv-empty">טוען…</p>'; Gear.err.hidden = true;
    try {
      F.needCal();
      var q = can.seeAllGear() ? db.collection("gear").where("date", ">=", addDays(today(), -30)) : db.collection("gear").where("uid", "==", me.id);
      var snap = await q.get();
      Gear.list = []; snap.forEach(function (d) { var x = d.data(); x.id = d.id; Gear.list.push(x); });
      Gear.list.sort(function (a, b) { return a.date.localeCompare(b.date); });
      Gear.loaded = true;
    } catch (e) { Gear.err.textContent = "לא הצלחנו לטעון את הבקשות (ייתכן שחסרה הרשאה ב-Firebase)."; Gear.err.hidden = false; Gear.list = []; }
    Gear.badge(); Gear.render();
  };
  Gear.count = async function () {
    try {
      if (can.approveGear()) { var s = await db.collection("gear").where("status", "==", "pending").get(); badge("gear", s.size); }
      else { var m = await db.collection("gear").where("uid", "==", me.id).get(); var n = 0; m.forEach(function (d) { if (d.data().status === "changes") n++; }); badge("gear", n); }
    } catch (e) {}
  };
  Gear.badge = function () {
    var n = can.approveGear() ? Gear.list.filter(function (g) { return g.status === "pending"; }).length : Gear.list.filter(function (g) { return g.uid === me.id && g.status === "changes"; }).length;
    badge("gear", n);
  };
  Gear.render = function () {
    var tabs = Gear.tabs();
    if (!tabs.some(function (t) { return t[0] === Gear.tab; })) Gear.tab = "mine";
    Gear.seg.textContent = ""; Gear.seg.hidden = tabs.length < 2;
    tabs.forEach(function (t) {
      var b = el("button", t[0] === Gear.tab ? "on" : "", t[1]); b.type = "button";
      if (t[0] === "review") { var n = Gear.list.filter(function (g) { return g.status === "pending"; }).length; if (n) b.appendChild(el("span", "cnt", String(n))); }
      b.addEventListener("click", function () { Gear.tab = t[0]; Gear.render(); });
      Gear.seg.appendChild(b);
    });
    var box = Gear.body; box.textContent = "";
    var t = today();
    if (Gear.tab === "shop") return Gear.shop(box);
    var list = Gear.list.filter(function (g) {
      if (Gear.tab === "mine") return g.uid === me.id;
      if (Gear.tab === "review") return g.status === "pending";
      return true;
    });
    if (Gear.tab === "mine") list = list.filter(function (g) { return g.date >= addDays(t, -14); });
    if (!list.length) box.appendChild(el("p", "fv-empty", Gear.tab === "mine" ? "עוד לא ביקשת ציוד. לחצו על ״בקשה חדשה״." : Gear.tab === "review" ? "אין בקשות שמחכות לאישור." : "אין בקשות."));
    list.forEach(function (g) { box.appendChild(Gear.card(g)); });
  };
  Gear.card = function (g) {
    var c = el("article", "gr");
    var h = el("div", "gr-h"), t = el("div", "gr-t");
    t.appendChild(el("strong", "", (g.unit || "בקשת ציוד") + " · " + longDate(g.date)));
    t.appendChild(el("small", "", [g.uid === me.id ? "" : g.byName, g.role, inDays(g.date)].filter(Boolean).join(" · ")));
    h.appendChild(t); h.appendChild(el("span", "st " + g.status, ST[g.status] || g.status)); c.appendChild(h);
    var ul = el("ul", "gr-items");
    (g.items || []).forEach(function (it) { var li = el("li"); li.appendChild(el("span", "q", String(it.qty || 1))); var n = el("span", "n", it.name); if (it.note) { n.appendChild(document.createTextNode(" ")); n.appendChild(el("small", "", it.note)); } li.appendChild(n); ul.appendChild(li); });
    c.appendChild(ul);
    if (g.note) c.appendChild(el("small", "", "הערות: " + g.note));
    if (g.review && g.review.note && g.status === "changes") { var rn = el("div", "gr-note"); rn.appendChild(el("b", "", "תיקונים מ" + (g.review.byName || "המרכז הצעיר") + ":")); rn.appendChild(document.createTextNode(g.review.note)); c.appendChild(rn); }
    if (g.status === "approved" && g.review && g.review.byName) c.appendChild(el("small", "", "אושר ע״י " + g.review.byName));
    var acts = el("div", "gr-acts");
    if (g.uid === me.id && g.status !== "approved") {
      acts.appendChild(btn(g.status === "changes" ? "תיקון ושליחה מחדש" : "עריכה", g.status === "changes" ? "primary tiny" : "ghost tiny", function () { Gear.form(g); }, "pen"));
      acts.appendChild(btn("מחיקה", "ghost tiny", async function () { try { await db.collection("gear").doc(g.id).delete(); Gear.list = Gear.list.filter(function (x) { return x.id !== g.id; }); Gear.badge(); Gear.render(); } catch (e) { toast("המחיקה לא הצליחה"); } }, "trash"));
    }
    if (can.approveGear() && g.status === "pending") {
      acts.appendChild(btn("אישור", "primary tiny", function () { Gear.review(g, "approved", ""); }, "check"));
      acts.appendChild(btn("החזרה לתיקון", "ghost tiny", function () { Gear.askChanges(g, c); }, "undo"));
    }
    if (can.approveGear() && g.status === "approved") acts.appendChild(btn("ביטול האישור", "ghost tiny", function () { Gear.review(g, "pending", ""); }, "undo"));
    if (acts.children.length) c.appendChild(acts);
    return c;
  };
  Gear.askChanges = function (g, card) {
    if (card.querySelector(".gr-ask")) return;
    var w = el("div", "gr-ask"); w.style.cssText = "display:flex;flex-direction:column;gap:8px";
    var ta = input("textarea", "", "מה צריך לתקן?"); w.appendChild(ta);
    var a = el("div", "gr-acts");
    a.appendChild(btn("שליחה", "primary tiny", function () { if (!ta.value.trim()) { ta.focus(); return; } Gear.review(g, "changes", ta.value.trim()); }));
    a.appendChild(btn("ביטול", "ghost tiny", function () { w.remove(); }));
    w.appendChild(a); card.appendChild(w); ta.focus();
  };
  Gear.review = async function (g, status, note) {
    try {
      var rv = { by: me.id, byName: myName(), note: note, at: Date.now() };
      await db.collection("gear").doc(g.id).set({ status: status, review: rv, updatedAt: ts() }, { merge: true });
      g.status = status; g.review = rv; Gear.badge(); Gear.render();
      toast(status === "approved" ? "הבקשה אושרה ונוספה לרשימת הקניות" : status === "changes" ? "הבקשה הוחזרה לתיקון" : "האישור בוטל");
    } catch (e) { toast("העדכון לא הצליח"); }
  };
  Gear.form = async function (g) {
    await F.needCal();
    var editing = !!g;
    var body = el("form", "eu-body"); body.noValidate = true;
    var t = today();
    var dates = F.activityDates().filter(function (d) { return d >= t; }).slice(0, 40);
    if (g && dates.indexOf(g.date) === -1) dates.unshift(g.date);
    var sel = el("select", "field sm");
    if (!dates.length) { var o0 = el("option", "", "אין פעולות קרובות בלו״ז"); o0.value = ""; sel.appendChild(o0); }
    dates.forEach(function (d) {
      var ev = Cal.list().filter(function (e) { return e.date === d && F.isActivity(e); })[0];
      var o = el("option", "", longDate(d) + (ev && ev.time ? " · " + ev.time : "")); o.value = d; if (g && g.date === d) o.selected = true; sel.appendChild(o);
    });
    body.appendChild(field("תאריך הפעולה", sel, "אפשר לבקש ציוד רק לתאריכים של פעולות מהלו״ז."));
    var unit = input("text", g ? g.unit : "", "למשל: גדוד אביב / שכבת ט׳"); body.appendChild(field("בשביל מי", unit));
    var wrap = el("div", "eu-f"); wrap.appendChild(el("span", "eu-lab", "פריטים"));
    var items = el("div", "items-ed"); wrap.appendChild(items);
    function addRow(it) {
      var r = el("div", "item-row");
      var n = input("text", it ? it.name : "", "שם הפריט"), q = input("number", it ? it.qty : "1", "כמות"); q.min = "1"; q.inputMode = "numeric";
      var x = el("button", "x"); x.type = "button"; x.innerHTML = svg("x", 16); x.setAttribute("aria-label", "הסרת פריט");
      x.addEventListener("click", function () { if (items.children.length > 1) r.remove(); else { n.value = ""; q.value = "1"; } });
      n.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addRow(); items.lastChild.querySelector("input").focus(); } });
      r.appendChild(n); r.appendChild(q); r.appendChild(x); items.appendChild(r);
    }
    ((g && g.items) || [null, null, null]).forEach(addRow);
    var add = btn("פריט נוסף", "ghost tiny add-item", function () { addRow(); items.lastChild.querySelector("input").focus(); }, "plus");
    wrap.appendChild(add); body.appendChild(wrap);
    var note = input("textarea", g ? g.note || "" : "", "הערות למרכז הצעיר (לא חובה)"); body.appendChild(field("הערות", note));
    if (g && g.status === "changes" && g.review) { var rn = el("div", "gr-note"); rn.appendChild(el("b", "", "מה ביקשו לתקן:")); rn.appendChild(document.createTextNode(g.review.note || "")); body.insertBefore(rn, body.firstChild); }
    var err = el("p", "eu-msg eu-err"); body.appendChild(err);
    var save = el("button", "btn primary small", editing && g.status === "changes" ? "שליחה מחדש" : editing ? "שמירה" : "שליחה לאישור"); save.type = "submit";
    body.addEventListener("submit", async function (ev) {
      ev.preventDefault(); err.textContent = "";
      var list = [];
      Array.prototype.forEach.call(items.children, function (r) { var ins = r.querySelectorAll("input"); var n = ins[0].value.trim(), q = parseInt(ins[1].value, 10) || 1; if (n) list.push({ name: n, qty: q, bought: false }); });
      if (!sel.value) { err.textContent = "יש לבחור תאריך של פעולה."; return; }
      if (!unit.value.trim()) { err.textContent = "יש לכתוב בשביל מי הציוד."; return; }
      if (!list.length) { err.textContent = "יש להוסיף לפחות פריט אחד."; return; }
      var doc = { date: sel.value, unit: unit.value.trim(), items: list, note: note.value.trim(), status: "pending", updatedAt: ts() };
      save.disabled = true;
      try {
        if (editing) await db.collection("gear").doc(g.id).set(doc, { merge: true });
        else { doc.uid = me.id; doc.byName = myName(); doc.role = me.role; doc.at = ts(); await db.collection("gear").add(doc); }
        closePreview(); toast(editing ? "הבקשה נשלחה שוב לאישור" : "הבקשה נשלחה לאישור"); Gear.tab = "mine"; Gear.load();
      } catch (e) { err.textContent = "השליחה לא הצליחה. נסו שוב."; save.disabled = false; }
    });
    var foot = el("div", "pv-foot eu-foot"); foot.appendChild(save); foot.appendChild(btn("ביטול", "ghost small", function () { closePreview(); })); body.appendChild(foot);
    openModal({ title: editing ? "עריכת בקשת ציוד" : "בקשת ציוד חדשה", body: body });
  };
  /* The big shopping list: everything approved for upcoming activities, by date, with tick boxes. */
  Gear.shop = function (box) {
    var t = today();
    var appr = Gear.list.filter(function (g) { return g.status === "approved" && g.date >= t; });
    if (!appr.length) { box.appendChild(el("p", "fv-empty", "אין ציוד מאושר לפעולות הקרובות.")); return; }
    var byDate = {};
    appr.forEach(function (g) { (byDate[g.date] = byDate[g.date] || []).push(g); });
    // Totals across everything not yet bought
    var tot = {};
    appr.forEach(function (g) { (g.items || []).forEach(function (it) { if (it.bought) return; var k = it.name.trim(); tot[k] = (tot[k] || 0) + (+it.qty || 1); }); });
    var keys = Object.keys(tot).sort(function (a, b) { return a.localeCompare(b, "he"); });
    var sum = el("section", "shop");
    var sh = el("div", "shop-h"); sh.appendChild(el("strong", "", "סה״כ לקנות")); sh.appendChild(el("small", "", keys.length + " פריטים"));
    sh.appendChild(btn("שיתוף", "ghost tiny", function () { shareText(shopText(byDate)); }, "share"));
    sum.appendChild(sh);
    if (!keys.length) sum.appendChild(el("p", "fv-empty", "הכל נקנה 🎉"));
    keys.forEach(function (k) { var r = el("div", "shop-row"); r.style.cursor = "default"; var n = el("span", "n", k); r.appendChild(n); r.appendChild(el("span", "q", "×" + tot[k])); sum.appendChild(r); });
    box.appendChild(sum);
    Object.keys(byDate).sort().forEach(function (d) {
      var s = el("section", "shop");
      var h = el("div", "shop-h"); h.appendChild(el("strong", "", longDate(d))); h.appendChild(el("small", "", inDays(d))); s.appendChild(h);
      byDate[d].forEach(function (g) {
        (g.items || []).forEach(function (it, i) {
          var r = el("div", "shop-row" + (it.bought ? " done" : ""));
          var ck = el("span", "ck"); ck.innerHTML = svg("check", 15); r.appendChild(ck);
          var n = el("span", "n", it.name); n.appendChild(el("small", "", g.unit + (g.byName ? " · " + g.byName : ""))); r.appendChild(n);
          r.appendChild(el("span", "q", "×" + (it.qty || 1)));
          r.setAttribute("role", "checkbox"); r.setAttribute("aria-checked", String(!!it.bought)); r.tabIndex = 0;
          r.addEventListener("click", async function () {
            if (!can.approveGear()) { toast("רק מרכזים צעירים מסמנים קניות"); return; }
            it.bought = !it.bought; r.classList.toggle("done", it.bought); r.setAttribute("aria-checked", String(it.bought));
            try { await db.collection("gear").doc(g.id).set({ items: g.items }, { merge: true }); Gear.render(); }
            catch (e) { it.bought = !it.bought; r.classList.toggle("done", it.bought); toast("העדכון לא הצליח"); }
          });
          s.appendChild(r);
        });
      });
      box.appendChild(s);
    });
  };
  function shopText(byDate) {
    var lines = ["🛒 רשימת קניות – פורום מוביל"];
    Object.keys(byDate).sort().forEach(function (d) {
      var its = []; byDate[d].forEach(function (g) { (g.items || []).forEach(function (it) { if (!it.bought) its.push("• " + it.name + " ×" + (it.qty || 1) + " (" + g.unit + ")"); }); });
      if (its.length) { lines.push(""); lines.push(longDate(d) + ":"); lines = lines.concat(its); }
    });
    return lines.join("\n");
  }
  async function shareText(t) {
    if (navigator.share) { try { await navigator.share({ text: t }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(t); toast("הרשימה הועתקה"); } catch (e) { window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank"); }
  }

  /* ======================================================================
     Useful links
     ====================================================================== */
  var Links = F.Links = { list: [], loaded: false };
  Links.open = function () { if (!Links.built) Links.build(); if (!Links.loaded) Links.load(); };
  Links.build = function () {
    Links.built = true;
    var v = Links.view;
    var h = head(v, "קישורים שימושיים");
    Links.addBtn = btn("קישור חדש", "primary small", function () { Links.form(); }, "plus");
    h.insertBefore(Links.addBtn, h.lastChild);
    Links.err = el("div", "fv-err"); Links.err.hidden = true; v.appendChild(Links.err);
    Links.body = el("div", "lk-list"); v.appendChild(Links.body);
  };
  Links.load = async function () {
    Links.addBtn.hidden = !can.manageLinks();
    Links.body.innerHTML = '<p class="fv-empty">טוען…</p>'; Links.err.hidden = true;
    try {
      var s = await db.collection("links").get();
      Links.list = []; s.forEach(function (d) { var x = d.data(); x.id = d.id; Links.list.push(x); });
      Links.list.sort(function (a, b) { return (a.cat || "").localeCompare(b.cat || "", "he") || (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title), "he"); });
      Links.loaded = true;
    } catch (e) { Links.err.textContent = "לא הצלחנו לטעון את הקישורים (ייתכן שחסרה הרשאה ב-Firebase)."; Links.err.hidden = false; }
    Links.render();
  };
  Links.render = function () {
    var box = Links.body; box.textContent = "";
    if (!Links.list.length) { box.appendChild(el("p", "fv-empty", can.manageLinks() ? "עוד אין קישורים. לחצו על ״קישור חדש״ כדי להוסיף." : "עוד אין קישורים.")); return; }
    var lastCat = null;
    Links.list.forEach(function (l) {
      if ((l.cat || "") !== lastCat) { lastCat = l.cat || ""; if (lastCat) box.appendChild(el("div", "lk-cat", lastCat)); }
      var a = el("a", "lk"); a.href = l.url; a.target = "_blank"; a.rel = "noopener";
      var fav = el("span", "fav"); var host = ""; try { host = new URL(l.url).hostname; } catch (e) {}
      if (host) { var im = el("img"); im.alt = ""; im.src = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=64"; im.onerror = function () { fav.textContent = (l.title || "?").charAt(0); }; fav.appendChild(im); } else fav.textContent = (l.title || "?").charAt(0);
      a.appendChild(fav);
      var tx = el("span", "tx"); tx.appendChild(el("b", "", l.title)); tx.appendChild(el("small", "", l.desc || host)); a.appendChild(tx);
      if (can.manageLinks()) { var e = iconBtn("pen", "עריכה", function (ev) { ev.preventDefault(); ev.stopPropagation(); Links.form(l); }, "ed"); a.appendChild(e); }
      box.appendChild(a);
    });
  };
  Links.form = function (l) {
    var editing = !!l;
    var body = el("form", "eu-body"); body.noValidate = true;
    var t = input("text", l ? l.title : "", "למשל: טופס אישור הורים"), u = input("url", l ? l.url : "", "https://…"); u.dir = "ltr";
    var d = input("text", l ? l.desc || "" : "", "תיאור קצר (לא חובה)"), c = input("text", l ? l.cat || "" : "", "למשל: טפסים");
    var cats = {}; Links.list.forEach(function (x) { if (x.cat) cats[x.cat] = 1; });
    if (Object.keys(cats).length) { var dl = el("datalist"); dl.id = "lkCats"; Object.keys(cats).forEach(function (k) { var o = el("option"); o.value = k; dl.appendChild(o); }); body.appendChild(dl); c.setAttribute("list", "lkCats"); }
    body.appendChild(field("שם", t)); body.appendChild(field("קישור", u)); body.appendChild(field("תיאור", d)); body.appendChild(field("קטגוריה", c));
    var err = el("p", "eu-msg eu-err"); body.appendChild(err);
    var save = el("button", "btn primary small", "שמירה"); save.type = "submit";
    body.addEventListener("submit", async function (ev) {
      ev.preventDefault(); err.textContent = "";
      var url = u.value.trim(); if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
      if (!t.value.trim()) { err.textContent = "יש לכתוב שם."; return; }
      try { new URL(url); } catch (e) { err.textContent = "הקישור לא תקין."; return; }
      var doc = { title: t.value.trim(), url: url, desc: d.value.trim(), cat: c.value.trim(), by: me.id, at: ts() };
      if (!editing) doc.order = Date.now();
      save.disabled = true;
      try { if (editing) await db.collection("links").doc(l.id).set(doc, { merge: true }); else await db.collection("links").add(doc); closePreview(); Links.load(); }
      catch (e) { err.textContent = "השמירה לא הצליחה (רק מנהלים יכולים להוסיף קישורים)."; save.disabled = false; }
    });
    var foot = el("div", "pv-foot eu-foot"); foot.appendChild(save);
    if (editing) foot.appendChild(btn("מחיקה", "ghost small", async function () { try { await db.collection("links").doc(l.id).delete(); closePreview(); Links.load(); } catch (e) { err.textContent = "המחיקה לא הצליחה."; } }, "trash"));
    foot.appendChild(btn("ביטול", "ghost small", function () { closePreview(); }));
    body.appendChild(foot);
    openModal({ title: editing ? "עריכת קישור" : "קישור חדש", body: body });
  };
})();
