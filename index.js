// index.js - lista de notificaciones
function loadAll() {
  const raw = localStorage.getItem("notifs");
  return raw ? JSON.parse(raw) : [];
}

function renderList() {
  const list = loadAll();
  const container = document.getElementById("notifList");
  const emptyMsg = document.getElementById("emptyMsg");
  container.innerHTML = "";

  if (!list.length) {
    emptyMsg.classList.remove("hidden");
    return;
  } else {
    emptyMsg.classList.add("hidden");
  }

  list.forEach(n => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-xl p-3 shadow flex justify-between items-center";
    const days = (n.days || []).join(",");
    const times = (n.times || []).join(", ");
    card.innerHTML = `
      <div>
        <p class="font-semibold text-sm">${n.title || "(Sin nombre)"}</p>
        <p class="text-xs text-gray-500">${times || "-"} | Días: ${days || "-"}</p>
      </div>
      <span class="text-xs ${n.active ? "text-green-600" : "text-gray-400"}">
        ${n.active ? "ON" : "OFF"}
      </span>
    `;
    card.onclick = () => {
      localStorage.setItem("editId", n.id);
      window.location.href = "edit.html";
    };
    container.appendChild(card);
  });
}

function pushAllToSW() {
  if (!("serviceWorker" in navigator)) return;
  const list = loadAll();
  navigator.serviceWorker.ready.then(reg => {
    if (reg.active) {
      reg.active.postMessage({ type: "updateAll", notifications: list });
    } else if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "updateAll", notifications: list });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderList();

  document.getElementById("addNotificationBtn").onclick = () => {
    localStorage.setItem("editId", "new");
    window.location.href = "edit.html";
  };

  if ("serviceWorker" in navigator) {
    Notification.requestPermission().then(() => {
      navigator.serviceWorker.register("service-worker.js").then(() => {
        pushAllToSW();
      }).catch(console.error);
    });
  }
});
