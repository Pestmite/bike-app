import { MAP_API, ROUTE_KEY } from '../keys.js';

const atlasMap = `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${MAP_API}`

const body = document.querySelector('.body');

body.innerHTML = `
  <div class="map-container">
    <div id="map" class="map">
      <div id="status-message" class="status"></div>
    </div>
  </div>
`;

const status_message = document.getElementById('status-message');

function showStatus(msg) {
  status_message.innerHTML = msg;
}

const map = L.map('map', { attributionControl:false }).setView([45.5019, -73.5674], 13); 

L.tileLayer(atlasMap, {
  maxZoom: 20,
  minZoom: 2
}).addTo(map);

let routingControl;
let start = null;
let startPoint;

showStatus('Pick a first point')
map.on('click', function (e) {
  if (!start) {
    start = e.latlng;
    showStatus('Pick a Second point');
    startPoint = L.marker(start).addTo(map);

    if (routingControl) {
      map.removeControl(routingControl);
    }

  } else {
    const end = e.latlng;

    showStatus('Finding the best route...');
    routingControl = L.Routing.control({
      waypoints: [start, end],
      showAlternatives: true,
      routeWhileDragging: true,
    
      router: new L.Routing.OpenRouteServiceV2(ROUTE_KEY, {
        profile: 'cycling-regular',
      }),
    })
      .on('routesfound', function () {
        showStatus('Route found!')
      })
      .on('routingerror', function () {
        showStatus('Cannot find a route');
      })
    .addTo(map); 

    start = null;
    startPoint.remove()
  }
});