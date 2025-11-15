self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => { self.clients.claim(); });

let times = ["07:50","16:50"];
const TARGET_URL = "https://micronauta4.dnsalias.net/web/urbano/?conf=cbaciudad";
let lastNotified = null;

self.addEventListener("message", evt => {
  try {
    if (evt.data?.type === "updateTimes") {
      times = evt.data.times || times;
    }
    if (evt.data?.type === "showNow") {
      const p = evt.data;
      showNotification(p.title || "Notificación", { body: p.body || "", data: { url: p.url || TARGET_URL }});
    }
  } catch(e) { console.error(e); }
});

function showNotification(title, options) {
  const opts = Object.assign({
    vibrate: [200,100,200],
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png'
  }, options);
  return self.registration.showNotification(title, opts);
}

function check() {
  const now = new Date();
  const day = now.getDay();
  if (day < 1 || day > 5) return;
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const current = `${hh}:${mm}`;
  if (times.includes(current)) {
    const key = current;
    if (lastNotified === key) return;
    lastNotified = key;
    showNotification("Urbanos Córdoba", { body: "Tocá para abrir la página", data: { url: TARGET_URL }, vibrate: [200,100,200] });
  } else {
    lastNotified = null;
  }
}

setInterval(check, 60000);

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification?.data?.url || TARGET_URL;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
