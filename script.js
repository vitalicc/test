const map = L.map('map').setView([49.08401102859107, 33.419590537719245], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Светофоры с координатами, сдвигом и полной датой старта
const lights = [
  {
    coords: [49.082808980594464, 33.42592096675134],
    startDateTime: '2025-08-07T11:58:04',
    cycle: 71, // 20s green, 5s yellow, 35s red
    phases: { green: 25, yellow: 0, red: 46}
  },
  {
    coords: [49.084544079080636, 33.42673412556371],
    startDateTime: '2025-08-06T08:01:00',
    cycle: 90, // 40s green, 10s yellow, 40s red
    phases: { green: 40, yellow: 10, red: 40 }
  }
];


function getLightPhase(currentUnixTime, light) {
  const elapsed = currentUnixTime - light._startUnix;
  if (elapsed < 0) return { color: "off", remaining: -elapsed }; // еще не начал работать

  const { green, yellow, red } = light.phases;
  const totalCycle = green + yellow + red;
  const t = elapsed % totalCycle;

  if (t < green) return { color: "green", remaining: green - t };
  if (t < green + yellow) return { color: "yellow", remaining: green + yellow - t };
  return { color: "red", remaining: totalCycle - t };
}

function parseStartTime(dateTimeStr) {
  return Math.floor(new Date(dateTimeStr).getTime() / 1000);
}

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
  light._startUnix = parseStartTime(light.startDateTime);
}

function updateLights() {
  const nowUnix = Math.floor(Date.now() / 1000);

  lights.forEach(light => {
    const { color, remaining } = getLightPhase(nowUnix, light);

    let htmlContent;
    if (color === 'off') {
      htmlContent = `<div class="traffic-light" style="background:gray">
        <div class="timer">Старт через ${remaining}s</div>
      </div>`;
    } else {
      htmlContent = `<div class="traffic-light" style="background:${color}">
        <div class="timer">${Math.ceil(remaining)}s</div>
      </div>`;
    }

    light._marker.setIcon(L.divIcon({
      className: 'custom-icon',
      html: htmlContent
    }));
  });
}

lights.forEach(createLightMarker);
setInterval(updateLights, 1000);

//Добавляем меня по координатам

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

// Запрашиваем позицию и следим за изменениями
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


