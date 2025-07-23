import { MAP_API, ROUTE_KEY } from '../keys.js';
import { distanceRound, formatTime } from './utils.js';
import { generateChart } from './info-section.js';

const atlasMap = `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${MAP_API}`
const status_message = document.querySelector('.status-js');
const ride_info = document.querySelector('.ride-info-js');
const infoX = document.querySelector('.info-x');
const moreInfoButton = document.querySelector('.more-info');
const distanceStat = document.querySelector('.distance-js');
const timeStat = document.querySelector('.time-js');
const itinerarySection = document.querySelector('.itinerary-section');
const pathName = document.querySelector('.path-name');

const kmToMi = 0.621371;

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

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function getElevationProfile(coords) {
  const url = 'https://api.openrouteservice.org/elevation/line';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': ROUTE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format_in: 'geojson',
        format_out: 'geojson',
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      }),
    });

    if (!res.ok) {
      throw new Error('Elevation API error');
    }

    return await res.json();
  } catch (err) {
    console.error('Elevation error:', err);
    return null;
  }
}

async function generateElevationSection(e) {
  const coordinates = e.routes[0].coordinates.map(coord => [coord[1], coord[0]]);
  const elevationData = await getElevationProfile(coordinates);
  const elevationArray = [];
  elevationData.geometry.coordinates.forEach(dataPoint => elevationArray.push(dataPoint[2]));

  generateChart(elevationArray);
}

async function generateBasicInfo(e, end) {
  const route = e.routes[0].summary;
  const reverseData = await reverseGeocode(end.lat, end.lng);
  const destinationAddress = reverseData.address;

  pathName.innerHTML = '';
  if (destinationAddress.house) {
    pathName.innerHTML += destinationAddress.house + ' ';
  }
  if (destinationAddress.road) {
    pathName.innerHTML += destinationAddress.road + ', ';
  }
  if (destinationAddress.city) {
    pathName.innerHTML += destinationAddress.city + ' ';
  }
  if (destinationAddress.postcode) {
    pathName.innerHTML += `<span class="postal-code">${destinationAddress.postcode}</span>`;
  }

  distanceStat.innerHTML = `${distanceRound(route.totalDistance / 1000)}<span>${distanceRound((route.totalDistance / 1000 * kmToMi), false)}</span>`;
  timeStat.innerHTML = `${formatTime(route.totalTime / 60)}`;
}

function generateItinerary(e) {
  let totalTime = 0;
  itinerarySection.innerHTML = '';
  e.routes[0].instructions.forEach(instruction => {
    totalTime += instruction.time / 60;
    itinerarySection.innerHTML += `
    <div class="instruction-group">
      <p>${instruction.text}</p>
      <div class="right-instructions">
        <div class="instructions-distance">${distanceRound(instruction.distance / 1000)}</div>
        <div class="instructions-time"> Total: ${formatTime(totalTime)}</div>
      </div>
    </div>`
  });
}

showStatus('Pick a first point');
map.on('click', function (e) {
  if (ride_info.contains(e.originalEvent.target)) return
  if (!start) {
    start = e.latlng;

    showStatus('Pick a Second point');
    startPoint = L.marker(start).addTo(map);

    if (routingControl) {
      map.removeControl(routingControl);
    }

  } else {
    const end = e.latlng;

    if (start === end) {
      showStatus('Please pick a different endpoint.');
      return;
    }

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
      .on('routesfound', async function (e) {
        await generateBasicInfo(e, end);

        showStatus('Route found!');
        ride_info.classList.add('basic-info-shown');

        generateItinerary(e);
        generateElevationSection(e);
      })
      .on('routingerror', function () {
        showStatus('Sorry! Cannot find a route');
      })
    .addTo(map); 

    start = null;
    startPoint.remove();
  }
});

infoX.addEventListener('click', () => {
  ride_info.classList.remove('basic-info-shown');
  ride_info.classList.remove('full-info-shown');
  itinerarySection.classList.remove('itinerary-show');
  moreInfoButton.innerHTML = 'View itinerary';
});

moreInfoButton.addEventListener('click', () => {
  ride_info.classList.toggle('full-info-shown');
  if (moreInfoButton.innerHTML === 'View itinerary') {
    moreInfoButton.innerHTML = 'Hide itinerary';
    itinerarySection.classList.add('itinerary-show');
  } else {
    moreInfoButton.innerHTML = 'View itinerary';
    itinerarySection.classList.remove('itinerary-show');
  }
});

['wheel', 'touchstart', 'touchmove'].forEach(event => {
  itinerarySection.addEventListener(event, e => e.stopPropagation(), { passive: false });
});