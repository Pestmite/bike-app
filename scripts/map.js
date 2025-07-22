import { MAP_API, ROUTE_KEY } from '../keys.js';

const atlasMap = `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${MAP_API}`

const body = document.querySelector('.body');

/*body.innerHTML = `
  <div class="map-container">
      <div id="map" class="map">
        <div class="status status-js"></div>
        <div class="ride-info ride-info-js">
        <div class="upper">
          <div class="info-x">X</div>
        </div>
        <div>Distance</div>
        <div>Tags</div>
      </div>
      </div>
    </div>
`;*/

const status_message = document.querySelector('.status-js');
const ride_info = document.querySelector('.ride-info-js');
const infoX = document.querySelector('.info-x');
const moreInfoButton = document.querySelector('.more-info');

function showStatus(msg) {
  status_message.innerHTML = msg;
}

const map = L.map('map', {
  attributionControl: false,
  zoomControl: false,
}).setView([45.5019, -73.5674], 13); 

L.tileLayer(atlasMap, {
  maxZoom: 20,
  minZoom: 2
}).addTo(map);

let routingControl;
let start = null;
let startPoint;

showStatus('Pick a first point')
map.on('click', function (e) {
  if (ride_info.contains(e.originalEvent.target)) {
    return
  }
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
      router: new L.Routing.OpenRouteServiceV2(ROUTE_KEY, {
        profile: 'cycling-regular',
      }),

      routeWhileDragging: true,
      lineOptions: {
        styles: [{ color: 'rgb(0, 153, 255)', opacity: 0.8, weight: 5}]
      },
    })
      .on('routesfound', function () {
        showStatus('Route found!')
        ride_info.classList.add('basic-info-shown')
      })
      .on('routingerror', function () {
        showStatus('Cannot find a route');
      })
    .addTo(map); 

    start = null;
    startPoint.remove()
  }
});

infoX.addEventListener('click', () => {
  ride_info.classList.remove('basic-info-shown');
  ride_info.classList.remove('full-info-shown');
  moreInfoButton.innerHTML = 'Hide itinerary';
});

moreInfoButton.addEventListener('click', () => {
  ride_info.classList.toggle('full-info-shown');
  if (moreInfoButton.innerHTML === 'View itinerary') {
    moreInfoButton.innerHTML = 'Hide itinerary';
  } else {
    console.log('Yo');
    moreInfoButton.innerHTML = 'View itinerary';
  }
});