const map = L.map('map').setView([49.083798038160786, 33.4204394941353], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const lights = [
  {
    coords: [49.082808980594464, 33.42592096675134],
    offset: 0
  },
  {
    coords: [49.084544079080636, 33.42673412556371],
    offset: 5
  }
];

function getLightPhase(time, offset = 0) {
  const cycle = 65; // green 30s, yellow 5s, red 30s
  const t = (time + offset) % cycle;
  if (t < 30) return { color: "green", remaining: 30 - t };
  if (t < 35) return { color: "yellow", remaining: 35 - t };
  return { color: "red", remaining: 65 - t };
}

function createLightIcon(color) {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="circle" style="background-color:${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function createLightMarker(light) {
  const marker = L.marker(light.coords, {
    icon: createLightIcon('gray') // начальный цвет (можно любой)
  }).addTo(map);
  light._marker = marker;
}

function updateLights() {
  const t = Math.floor(Date.now() / 1000);
  lights.forEach(light => {
    const { color } = getLightPhase(t, light.offset);
    light._marker.setIcon(createLightIcon(color));
  });
}

lights.forEach(createLightMarker);
setInterval(updateLights, 1000);
