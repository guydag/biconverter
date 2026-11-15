/* Receives push notifications while the site is closed. FCM shows the notification itself;
   this file also makes tapping it open the site. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyABd26IEKadfnCKTyVezfD4upQOLu8XxNE",
  authDomain: "mishuot.firebaseapp.com",
  projectId: "mishuot",
  storageBucket: "mishuot.firebasestorage.app",
  messagingSenderId: "771775436102",
  appId: "1:771775436102:web:e1c8ef6a1cea1b95fdc147"
});
/* Registered before the Firebase SDK's own click handler, so this one decides where a tap goes:
   an open window is focused and told which report to show, otherwise a new window opens on it. */
self.addEventListener("notificationclick", function (event) {
  var d = event.notification.data || {}, m = d.FCM_MSG || {};
  var url = (m.fcmOptions && m.fcmOptions.link) || (m.notification && m.notification.click_action) || d.url || self.registration.scope;
  event.notification.close();
  event.stopImmediatePropagation();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && "focus" in list[i]) {
        try { list[i].postMessage({ openReport: url }); } catch (e) {}
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});

firebase.messaging();
