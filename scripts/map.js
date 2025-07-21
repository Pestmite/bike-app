import { MAP_API, ROUTE_KEY } from '../keys.js';

const atlasMap = `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${MAP_API}`

const body = document.querySelector('.body');
body.innerHTML = `
  <div class="map-container">
    <div id="map" class="map"></div>
  </div>
`;

const map = L.map('map', { attributionControl:false }).setView([45.5019, -73.5674], 13); 
console.log(L.Routing.OpenRouteServiceV2)
L.tileLayer(atlasMap, {
  maxZoom: 20,
  minZoom: 2
}).addTo(map);

const start = L.latLng(45.5019, -73.5674);

let routingControl;

map.on('click', function (e) {
  const end = e.latlng;

  if (routingControl) {
    map.removeControl(routingControl);
  } 

  routingControl = L.Routing.control({
    waypoints: [start, end],
    showAlternatives: true,
    routeWhileDragging: true,
    router: new L.Routing.OpenRouteServiceV2(ROUTE_KEY, {
      profile: 'cycling-regular',
    }),
  }).addTo(map);
});