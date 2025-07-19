import { MAP_API } from '../keys.js';

const cycleMap = `https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${MAP_API}`

const body = document.querySelector('.body');
body.innerHTML = `
  <div class="map-container">
    <div id="map" class="map"></div>
  </div>
`;

const map = L.map('map').setView([45.5019, -73.5674], 13); 

L.tileLayer(cycleMap, {
  maxZoom: 22,
  attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, OpenStreetMap contributors',
}).addTo(map);