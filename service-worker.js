// ------------------------------------
// SERVICE WORKER - ASISTENTE (FINAL)
// Con tolerancia de ±1 minuto
// ------------------------------------

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Lista de notificaciones guardadas
let notifications = [];
let lastSent = {}; // clave: id@hh:mm

// ------------------------------------
// Mensajes desde la PWA
// ------------------------------------
self.addEventListener("message", (event) => {
  const data = event.data || {};

  // Actualizar todas
  if (data.type === "updateAll" && Array.isArray(data.notifications)) {
    notifications = data.notifications;
  }

  // Notificación de prueba
  if (data.type === "testOne" && data.notification) {
    const n = data.notification;
    showNotification(
      n.title || "Prueba",
      n.body || "",
      n.url || "https://google.com"
    );
  }
});

// ------------------------------------
// Mostrar notificación
// ------------------------------------
function showNotification(title, body, url) {
  return self.registration.showNotification(title || "Notificación", {
    body: body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url: url || "https://google.com" }
  });
}

// ------------------------------------
// Lógica de horarios (con tolerancia)
// ------------------------------------
function tick() {
  if (!notifications.length) return;

  const now = new Date();
  const day = now.getDay();

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const current = hh + ":" + mm;

  notifications.forEach((n) => {
    if (!n.active) return;

    const days = n.days || [];
    const times = n.times || [];

    // Día incorrecto → no suena
    if (!days.includes(day)) return;

    // ------------------------------------
    // TOLERANCIA DE ±1 MINUTO
    // ------------------------------------
    const nowValue = now.getHours() * 60 + now.getMinutes();

    const tolerated = times.some((t) => {
      const [th, tm] = t.split(":").map(Number);
      const target = th * 60 + tm;
      return Math.abs(nowValue - target) <= 1;  // ±1 min
    });

    if (!tolerated) return;

    // Evitar duplicados
    const key = n.id + "@" + current;
    if (lastSent[key]) return;

    lastSent[key] = true;

    // Disparar notificación
    showNotification(n.title, n.body, n.url);
  });
}

// Chequear cada 60 segundos
setInterval(tick, 60000);

// ------------------------------------
// Click en la notificación → abrir URL
// ------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url || "https://google.com";

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
