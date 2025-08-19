let lights = [];

function getLightPhase(currentMs, light) {
  const elapsedMs = currentMs - light._startUnixMs;
  if (elapsedMs < 0) return { color: "off", remainingMs: -elapsedMs };

  const { green, yellow, red } = light.phases;
  const totalCycleMs = (green + yellow + red) * 1000;
  const tMs = elapsedMs % totalCycleMs;

  if (tMs < green * 1000) return { color: "green", remainingMs: green * 1000 - tMs };
  if (tMs < (green + yellow) * 1000) return { color: "yellow", remainingMs: (green + yellow) * 1000 - tMs };
  return { color: "red", remainingMs: totalCycleMs - tMs };
}

function parseStartTime(dateTimeStr, light) {
  const baseDate = new Date(dateTimeStr);
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    baseDate.getHours(), baseDate.getMinutes(), baseDate.getSeconds(), baseDate.getMilliseconds()
  );

  const daysPassed = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - 
                                 new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())) / 86400000);

  return todayStart.getTime() + daysPassed * light.dailyStartOffset * 1000;
}

function updateLights() {
  const tbody = document.querySelector("#lightsTable tbody");
  tbody.innerHTML = "";
  const nowMs = Date.now();

  lights.forEach(light => {
    const { color, remainingMs } = getLightPhase(nowMs, light);

    const tr = document.createElement("tr");
    const tdDesc = document.createElement("td");
    tdDesc.textContent = light.description || "Без назви";

    const tdTimer = document.createElement("td");
    tdTimer.innerHTML = `<span class="timer ${color}">${color === "off" ? "Старт " + (remainingMs/1000).toFixed(1) + "s" : Math.ceil(remainingMs/1000)+"s"}</span>`;

    tr.appendChild(tdDesc);
    tr.appendChild(tdTimer);
    tbody.appendChild(tr);
  });
}

function initializeLights() {
  lights.forEach(light => light._startUnixMs = parseStartTime(light.startDateTime, light));
  updateLights();
  setInterval(updateLights, 500);
}

fetch("lights.json")
  .then(r => r.json())
  .then(data => { lights = data; initializeLights(); })
  .catch(err => console.error(err));
