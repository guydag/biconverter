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
firebase.messaging();

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var d = event.notification.data || {}, m = d.FCM_MSG || {};
  var url = (m.fcmOptions && m.fcmOptions.link) || (m.notification && m.notification.click_action) || d.url || self.registration.scope;
  var hash = url.indexOf("#") !== -1 ? url.slice(url.indexOf("#")) : "";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && "focus" in list[i]) {
        try { list[i].postMessage({ firebaseMessaging: { payload: { fcmOptions: { link: url } } } }); } catch (e) {}
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
