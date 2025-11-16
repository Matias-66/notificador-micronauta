self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let config = {
  enabled: true,
  days: [1,2,3,4,5],
  times: ["07:50","16:50"],
  hourly: {
    enabled: false,
    url: "https://ejemplo.com"
  }
};

const MAIN_URL = "https://micronauta4.dnsalias.net/web/urbano/?conf=cbaciudad";

let lastMainMinute = null;
let lastHourlyHour = null;

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "updateConfig" && data.config) {
    config = data.config;
  }
  if (data.type === "testNotification") {
    showNotification("Notificación de prueba", "La PWA está funcionando correctamente.", MAIN_URL);
  }
});

function showNotification(title, body, url) {
  return self.registration.showNotification(title, {
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: { url }
  });
}

function tick() {
  if (!config.enabled) return;

  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const hh = String(hours).padStart(2,"0");
  const mm = String(minutes).padStart(2,"0");
  const current = hh + ":" + mm;

  if (config.days.includes(day) && config.times.includes(current)) {
    if (lastMainMinute !== current) {
      lastMainMinute = current;
      showNotification("Consultar Horarios del Colectivo", "Click para abrir TUBONDI", MAIN_URL);
    }
  } else {
    if (lastMainMinute === current) {
      lastMainMinute = null;
    }
  }

  if (config.hourly && config.hourly.enabled) {
    if (hours >= 9 && hours <= 22 && minutes === 0) {
      if (lastHourlyHour !== hours) {
        lastHourlyHour = hours;
        const url = config.hourly.url || "https://ejemplo.com";
        showNotification("Recordatorio cada hora", "Ingresá a la otra app/web.", url);
      }
    } else if (minutes !== 0) {
      lastHourlyHour = null;
    }
  }
}

setInterval(tick, 60000);

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || MAIN_URL;
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
