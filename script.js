// Координаты светофоров
const trafficLights = [
  {
    id: 1,
    name: "Светофор 1",
    lat: 49.08279958883839,
    lng: 33.4259231026286,
    cycle: [
      { color: "red", duration: 10000 },
      { color: "green", duration: 15000 },
      { color: "yellow", duration: 5000 },
    ]
  },
  {
    id: 2,
    name: "Светофор 2",
    lat: 49.08453649816416,
    lng: 33.42674846695316,
    cycle: [
      { color: "red", duration: 8000 },
      { color: "green", duration: 12000 },
      { color: "yellow", duration: 4000 },
    ]
  }
];

// Подготовка карты Leaflet
const map = L.map('map').setView([49.0837, 33.4263], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Функция для вычисления текущего цвета и оставшегося времени светофора
function getTrafficLightState(cycle, time) {
  let totalDuration = cycle.reduce((sum, c) => sum + c.duration, 0);
  let t = time % totalDuration;
  for (let i = 0; i < cycle.length; i++) {
    if (t < cycle[i].duration) {
      return {
        color: cycle[i].color,
        timeLeft: Math.ceil((cycle[i].duration - t) / 1000)
      };
    }
    t -= cycle[i].duration;
  }
}

// Создаем маркеры светофоров с кастомной подписью
trafficLights.forEach(light => {
  const marker = L.marker([light.lat, light.lng]).addTo(map);

  // Создаем div элемент для отображения цвета и времени
  const labelDiv = L.DomUtil.create('div', 'traffic-light-label');
  marker.bindPopup(labelDiv);

  // Поместим на карту сразу, без клика
  labelDiv.style.pointerEvents = 'none'; // чтобы не мешал кликам по маркеру
  labelDiv.style.whiteSpace = 'nowrap';

  // Прикрепим label к маркеру, используя DivIcon (чтобы был виден сразу на карте)
  const icon = L.divIcon({
    className: "",
    html: `<div class="traffic-light-label" style="pointer-events:none;">
            <span class="color-circle" style="background:${light.cycle[0].color}"></span>
            <span>${light.name}: <span class="time-left">0</span>s</span>
           </div>`,
    iconSize: null
  });

  const labelMarker = L.marker([light.lat, light.lng], { icon }).addTo(map);

  light.labelMarker = labelMarker;
});

// Обновление цвета и времени для каждого светофора каждую секунду
function update() {
  const now = Date.now();
  trafficLights.forEach(light => {
    const state = getTrafficLightState(light.cycle, now);
    const el = light.labelMarker.getElement();
    if (!el) return; // элемент еще не создан
    const circle = el.querySelector('.color-circle');
    const timeSpan = el.querySelector('.time-left');
    if (circle && timeSpan) {
      circle.style.backgroundColor = state.color;
      timeSpan.textContent = state.timeLeft;
    }
  });
}

update();
setInterval(update, 1000);
