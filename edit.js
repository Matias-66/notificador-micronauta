function loadAll() {
  const raw = localStorage.getItem("notifs");
  return raw ? JSON.parse(raw) : [];
}

function saveAll(list) {
  localStorage.setItem("notifs", JSON.stringify(list));
}

function uuid() {
  return "n_" + Math.random().toString(36).slice(2, 10);
}

function addTimeRow(value="") {
  const timesList = document.getElementById("timesList");
  const row = document.createElement("div");
  row.className = "flex gap-2";
  row.innerHTML = `
    <input type="time" class="timeInput flex-1 border rounded px-2 py-1 text-sm" value="${value}">
    <button class="removeTime bg-red-500 text-white px-3 rounded">−</button>
  `;
  row.querySelector(".removeTime").onclick = () => row.remove();
  timesList.appendChild(row);
}

function fillForm(n) {
  document.getElementById("notifTitle").value = n.title || "";
  document.getElementById("notifBody").value = n.body || "";
  document.getElementById("notifUrl").value = n.url || "";
  document.getElementById("toggleActive").checked = !!n.active;

  const dayChecks = document.querySelectorAll(".day");
  dayChecks.forEach(cb => {
    const d = parseInt(cb.dataset.day, 10);
    cb.checked = (n.days || []).includes(d);
  });

  const timesList = document.getElementById("timesList");
  timesList.innerHTML = "";
  (n.times && n.times.length ? n.times : []).forEach(t => addTimeRow(t));
}

async function pushConfigToSW() {
  if (!("serviceWorker" in navigator)) return;
  const list = loadAll();
  const reg = await navigator.serviceWorker.ready;
  if (reg.active) {
    reg.active.postMessage({ type: "updateAll", notifications: list });
  } else if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "updateAll", notifications: list });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("backBtn").onclick = () => {
    window.location.href = "index.html";
  };

  const editId = localStorage.getItem("editId") || "new";
  const list = loadAll();
  let current = null;

  if (editId === "new") {
    current = { id: uuid(), title: "", body: "", url: "", active: false, days: [], times: [] };
  } else {
    current = list.find(n => n.id === editId) || { id: editId, title: "", body: "", url: "", active: false, days: [], times: [] };
  }

  fillForm(current);

  document.getElementById("addTime").onclick = () => addTimeRow();

  document.getElementById("saveBtn").onclick = async () => {
    const title = document.getElementById("notifTitle").value;
    const body = document.getElementById("notifBody").value;
    const url = document.getElementById("notifUrl").value;
    const active = document.getElementById("toggleActive").checked;

    const days = [...document.querySelectorAll(".day")]
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.dataset.day, 10));

    const times = [...document.querySelectorAll(".timeInput")]
      .map(i => i.value)
      .filter(Boolean);

    current.title = title;
    current.body = body;
    current.url = url;
    current.active = active;
    current.days = days;
    current.times = times;

    const existingIndex = list.findIndex(n => n.id === current.id);
    if (existingIndex >= 0) {
      list[existingIndex] = current;
    } else {
      list.push(current);
    }

    saveAll(list);
    await pushConfigToSW();

    document.getElementById("status").innerText = "Guardado ✔";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  };

  document.getElementById("testBtn").onclick = async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Service Worker no soportado");
      return;
    }
    const testNotif = {
      title: document.getElementById("notifTitle").value || "(Prueba)",
      body: document.getElementById("notifBody").value || "Test",
      url: document.getElementById("notifUrl").value || "https://google.com"
    };
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: "testOne", notification: testNotif });
    } else if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "testOne", notification: testNotif });
    }
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then(() => {
        try {
          pushConfigToSW();
        } catch (e) {
          console.error(e);
        }
      })
      .catch(console.error);
  }
});
