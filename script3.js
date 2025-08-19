let lights = []; // массив светофоров из JSON

// Функция определения фазы светофора
function getLightPhase(currentMs, light) {
  const elapsedMs = currentMs - light._startUnixMs;
  if (elapsedMs < 0) {
    return { color: "off", remainingMs: -elapsedMs };
  }

  const { green, yellow, red } = light.phases;
  const totalCycleMs = (green + yellow + red) * 1000;
  const tMs = elapsedMs % totalCycleMs;

  if (tMs < green * 1000) {
    return { color: "green", remainingMs: green * 1000 - tMs };
  }
  if (tMs < (green + yellow) * 1000) {
    return { color: "yellow", remainingMs: (green + yellow) * 1000 - tMs };
  }
  return { color: "red", remainingMs: totalCycleMs - tMs };
}

// Расчет стартового времени с учетом dailyOffset
function parseStartTime(dateTimeStr, light) {
  const baseDate = new Date(dateTimeStr);
  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    baseDate.getMilliseconds()
  );

  const baseDateOnly = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysPassed = Math.floor((nowDateOnly - baseDateOnly) / 86400000);

  const dailyOffsetMs = daysPassed * light.dailyStartOffset * 1000;
  return todayStart.getTime() + dailyOffsetMs;
}

// Рендер таблицы
function updateLightsTable() {
  const nowMs = Date.now();
  let tableHtml = `
    <table border="1" cellspacing="0" cellpadding="6">
      <tr>
        <th>Перекресток</th>
        <th>Оставшееся время</th>
      </tr>
  `;

  lights.forEach(light => {
    const { color, remainingMs } = getLightPhase(nowMs, light);

    let text;
    if (color === "off") {
      text = `<span style="color:gray">Старт через ${(remainingMs / 1000).toFixed(1)}s</span>`;
    } else {
      text = `<span style="color:${color}">${Math.ceil(remainingMs / 1000)}s</span>`;
    }

    tableHtml += `
      <tr>
        <td>${light.description || "Без названия"}</td>
        <td>${text}</td>
      </tr>
    `;
  });

  tableHtml += "</table>";
  document.getElementById("lightsTable").innerHTML = tableHtml;
}

// Инициализация
function initializeLights() {
  lights.forEach(light => {
    light._startUnixMs = parseStartTime(light.startDateTime, light);
  });
  updateLightsTable();
  setInterval(updateLightsTable, 1000);
}

// Загружаем JSON
fetch("lights.json")
  .then(response => {
    if (!response.ok) throw new Error("Не удалось загрузить lights.json");
    return response.json();
  })
  .then(data => {
    lights = data;
    initializeLights();
  })
  .catch(err => console.error(err));

