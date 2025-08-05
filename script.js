const map = L.map('map').setView([49.0836, 33.4263], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
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
  const cycle = 65; // full cycle: green 30s, yellow 5s, red 30s
  const t = (time + offset) % cycle;
  if (t < 30) return { color: "green", remaining: 30 - t };
  if (t < 35) return { color: "yellow", remaining: 35 - t };
  return { color: "red", remaining: 65 - t };
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
  light._el = div;
  light._marker = marker;
}

function updateLights() {
  const t = Math.floor(Date.now() / 1000);
  lights.forEach(light => {
    const { color, remaining } = getLightPhase(t, light.offset);
    light._marker.setIcon(L.divIcon({
      className: 'custom-icon',
      html: `<div class="traffic-light" style="color:${color}">${color}<br>${remaining}s</div>`
    }));
  });
}

lights.forEach(createLightMarker);
setInterval(updateLights, 1000);
