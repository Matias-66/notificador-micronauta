self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let notifications = [];
let lastSent = {}; // clave: id@hh:mm

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "updateAll" && Array.isArray(data.notifications)) {
    notifications = data.notifications;
  }
  if (data.type === "testOne" && data.notification) {
    const n = data.notification;
    showNotification(n.title || "Prueba", n.body || "", n.url || "https://google.com");
  }
});

function showNotification(title, body, url) {
  return self.registration.showNotification(title || "Notificación", {
    body: body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: url || "https://google.com" }
  });
}

function tick() {
  if (!notifications.length) return;
  const now = new Date();
  const day = now.getDay();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const current = hh + ":" + mm;

  notifications.forEach(n => {
    if (!n.active) return;
    const days = n.days || [];
    const times = n.times || [];
    if (!days.includes(day)) return;
    if (!times.includes(current)) return;

    const key = n.id + "@" + current;
    if (lastSent[key]) return;
    lastSent[key] = true;
    showNotification(n.title, n.body, n.url);
  });
}

setInterval(tick, 60000);

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "https://google.com";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
