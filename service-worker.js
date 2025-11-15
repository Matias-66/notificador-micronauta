self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => {});

let times = ["07:50", "16:50"];

self.addEventListener("message", evt => {
  if (evt.data?.type === "updateTimes") times = evt.data.times;
});

function check() {
  const now = new Date();
  const day = now.getDay();
  if (day < 1 || day > 5) return;

  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const current = `${hh}:${mm}`;

  if (times.includes(current)) {
    self.registration.showNotification("Urbanos Córdoba", {
      body: "Tocá para abrir la página",
      icon: "icons/icon-192.png",
      data: { url: "https://micronauta4.dnsalias.net/web/urbano/?conf=cbaciudad" }
    });
  }
}

setInterval(check, 60000);

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
