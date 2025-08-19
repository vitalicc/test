const savedLat = parseFloat(localStorage.getItem('mapLat'));
const savedLng = parseFloat(localStorage.getItem('mapLng'));
const savedZoom = parseInt(localStorage.getItem('mapZoom'), 10);

// Якщо значення валідні — беремо їх, інакше дефолтні
const initialLat = !isNaN(savedLat) ? savedLat : 49.082808980594464;
const initialLng = !isNaN(savedLng) ? savedLng : 33.42592096675134;
const initialZoom = !isNaN(savedZoom) ? savedZoom : 20;

const map = L.map('map').setView([initialLat, initialLng], initialZoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// При зміні позиції або масштабу карти зберігаємо нові значення в localStorage
map.on('moveend', () => {
  const center = map.getCenter();
  localStorage.setItem('mapLat', center.lat);
  localStorage.setItem('mapLng', center.lng);
  localStorage.setItem('mapZoom', map.getZoom());
});








let lights = []; // масив світлофорів, завантажиться з JSON

// Функція визначення фази світлофора
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



// Отримуємо дату та час старту, повертаємо кількість Unix мс дати та часу старту + добові зсуви 
function parseStartTime(dateTimeStr, light) {
  const baseDate = new Date(dateTimeStr);
  const now = new Date();

   // Сегодняшняя дата + стартовое время
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds(),
    baseDate.getMilliseconds()
  );

  // Сколько календарных суток прошло (без учёта времени)
  const baseDateOnly = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const daysPassed = Math.floor((nowDateOnly - baseDateOnly) / 86400000);

  // Сдвиг в мс: каждые сутки + ежедневный сдвиг
  const dailyOffsetMs = daysPassed * light.dailyStartOffset  * 1000;

  return todayStart.getTime() + dailyOffsetMs;
}




// Створення маркера світлофора на карті
function createLightMarker(light) {
  const div = document.createElement('div');
  div.className = 'traffic-light';
  const marker = L.marker(light.coords, {
    icon: L.divIcon({
      className: 'custom-icon',
      html: div.outerHTML
    })
  }).addTo(map);
  light._marker = marker;
  light._startUnixMs = parseStartTime(light.startDateTime, light);
}









// Оновлення стану світлофорів на карті ()
function updateLights() {
    const nowMs = Date.now();
    lights.forEach(light => {
      const { color, remainingMs } = getLightPhase(nowMs, light);

      let htmlContent;
      if (color === 'off') {
        htmlContent = `<div class="traffic-light" style="background:gray">
          <div class="timer">Старт через ${(remainingMs / 1000).toFixed(1)}s</div>
        </div>`;
      } else {
        htmlContent = `<div class="traffic-light" style="background:${color}">
          <div class="timer">${Math.ceil(remainingMs / 1000)}s</div>
        </div>`;
      }

      light._marker.setIcon(L.divIcon({
        className: 'custom-icon',
        html: htmlContent
      }));
    });
}

// Ініціалізація світлофорів після завантаження даних
/*function loopLights() {
  updateLights();
  setInterval(loopLights, 100);
}
*/

// 1 функция - инициализация! Вызываются ф-ии createLightMarker и в них передаются объекты свет
function initializeLights() {
  lights.forEach(createLightMarker);
  updateLights(); // первый вызов сразу
  setInterval(updateLights, 100);   // дальше — синхронно с секундами
}

// Завантаження даних світлофорів з JSON
fetch('lights.json')
  .then(response => {
    if (!response.ok) throw new Error('Не вдалося завантажити lights.json');
    return response.json();
  })
  .then(data => {
    lights = data;
    initializeLights();
  })
  .catch(err => console.error(err));

// --- Користувач на карті ---
let userMarker = null;

function updateUserLocation(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (!userMarker) {
    userMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.8
    }).addTo(map).bindPopup("Ти тут 👤");
  } else {
    userMarker.setLatLng([lat, lng]);
  }
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(updateUserLocation, (err) => {
    console.warn("Геолокація не доступна:", err.message);
  }, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000
  });
} else {
  alert("Геолокація не підтримується в цьому браузері.");
}
