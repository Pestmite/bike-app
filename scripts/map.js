import { MAP_API, ROUTE_KEY } from '../keys.js';
import { distanceRound, formatTime } from './utils.js';
import { generateChart } from './info-section.js';
import { savePath } from '../data/trails.js';

const atlasMap = `https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${MAP_API}`
const statusMessage = document.querySelector('.status-js');
const useLocation = document.querySelector('.use-location');
const searchIcon = document.querySelector('.search');
const searchBar = document.querySelector('.search-bar-js');
const searchResults = document.querySelector('.search-results');
const resultsBox = document.querySelector('.results-box');
const rightHeader = document.querySelector('.header-right');
const ride_info = document.querySelector('.ride-info-js');
const infoX = document.querySelector('.info-x');
const moreInfoButton = document.querySelector('.more-info');
const distanceStat = document.querySelector('.distance-js');
const timeStat = document.querySelector('.time-js');
const elevationSection = document.querySelector('.elevation-section');
const itinerarySection = document.querySelector('.itinerary-section');
const pathName = document.querySelector('.path-name');
const elevationButton = document.querySelector('.elevation-button-js');
const elevationMap = document.querySelector('.elevation-chart');
const loading = document.querySelector('.loading-done');
const lowerTags = document.querySelector('.lower-tag-section');

const kmToMi = 0.621371;
const appendToRouteMode = true;
let waypoints = [];

function showStatus(msg) {
  statusMessage.innerHTML = msg;
}

const map = L.map('map', {
  attributionControl: false,
  zoomControl: false,
}).setView([45.5019, -73.5674], 13);

let userCoords = [];
let locationMarker;
let userLocation = false;
if (locationMarker) { map.removeLayer(locationMarker) };
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords = [position.coords.latitude, position.coords.longitude]
      map.setView(userCoords, 16);

      locationMarker = L.circleMarker(userCoords, {
        radius: 8,
        color: 'rgb(0, 153, 255)',
        fillColor: 'rgba(0, 153, 255, 0.66)',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        pane: 'markerPane'
      }).addTo(map);

      statusMessage.classList.add('status-location');
      useLocation.classList.add('location-shown');
      userLocation = true;
    }
  );
};

L.tileLayer(atlasMap, {
  maxZoom: 20,
  minZoom: 2
}).addTo(map);

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

function updateElevationTags(e, elevationArray) {
  lowerTags.classList.remove('show-tags');
  lowerTags.innerHTML = '';
  let totalAscent = 0;
  let maxGrade = 0;
  let averageGrade = 0;
  let totalDescent = 0

  for (let i = 1; i < elevationArray.length; i++) {
    const deltaElev = elevationArray[i] - elevationArray[i - 1];
    const deltaDist = e.routes[0].summary.totalDistance / (elevationArray.length - 1);

    if (deltaElev > 0) totalAscent += deltaElev;
    if (deltaElev < 0) totalDescent += deltaElev;

    const grade = Math.abs(deltaElev / deltaDist) * 100;
    if (grade > maxGrade) maxGrade = grade;

    averageGrade += grade
  }

  averageGrade /= (elevationArray.length - 1);

  lowerTags.innerHTML += `<p class="route-tag">Total Ascent: ${Math.round(totalAscent)} m</p>`;
  lowerTags.innerHTML += `<p class="route-tag">Total Descent: ${Math.round(Math.abs(totalDescent))} m</p>`;
  lowerTags.innerHTML += `<p class="route-tag">Average Grade: ${averageGrade.toFixed(1)}%</p>`;
  lowerTags.classList.add('show-tags');
  
  if (e.routes[0].summary.totalDistance / 1000 > 50) {
    lowerTags.innerHTML += `<p class="route-tag">Max Grade: ${maxGrade.toFixed(1)}%</p>`;
  }
}

async function generateElevationSection(e) {
  const maxPoints = 300;
  let coordinates = e.routes[0].coordinates.map(coord => [coord[1], coord[0]]);

  // For performance on long paths
  if (coordinates.length > maxPoints) {
    const step = Math.floor(coordinates.length / maxPoints);
    coordinates = coordinates.filter((_, i) => i % step === 0);
  }
  const elevationData = await getElevationProfile(coordinates);
  if (!elevationData) {
    elevationMap.innerHTML = 'Could not load elevation data.';
    return;
  }
  const elevationArray = [];
  elevationData.geometry.coordinates.forEach(dataPoint => elevationArray.push(dataPoint[2]));

  updateElevationTags(e, elevationArray);

  generateChart(elevationArray, e.routes[0].summary.totalDistance);
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
  const locationName = destinationAddress.city || destinationAddress.town || destinationAddress.state || '';
  pathName.innerHTML += locationName + ' ';
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

let routingControl;
let start = null;
let startPoint;
let endPoint;
let pathData;

showStatus('Pick a first point');
map.on('click', function (e) {
  if (ride_info.contains(e.originalEvent.target)) return

  if (appendToRouteMode) {
    const newPoint = e.latlng;
    waypoints.push(newPoint);

    if (waypoints.length === 1) {
      startPoint = L.circleMarker(newPoint, {
        radius: 8,
        color: 'rgb(0, 153, 255)',
        fillColor: 'rgb(207, 207, 207)',
        weight: 4,
        opacity: 1,
        fillOpacity: 1,
        pane: 'markerPane'
      }).addTo(map);

      showStatus('Now click to add an endpoint');
    } else {
      L.marker(newPoint).addTo(map);

      if (routingControl) map.removeControl(routingControl);

      showStatus('Finding the best route...');

      routingControl = L.Routing.control({
        waypoints: waypoints,
        createMarker: (i, wp, nWps) => {
          if (i === 0 || i === nWps - 1) return null;
          return L.marker(wp.latLng, { draggable: true });
        },
        draggableWaypoints: true,
        addWaypoints: true,
        router: new L.Routing.OpenRouteServiceV2(ROUTE_KEY, {
          profile: 'cycling-regular',
        }),
        routeWhileDragging: true,
        lineOptions: {
          styles: [{ color: 'rgb(0, 153, 255)', opacity: 0.8, weight: 5 }]
        },
      })
        .on('routesfound', async function (e) {
          showStatus('Finding Info...');
          await generateBasicInfo(e, waypoints[waypoints.length - 1]);

          showStatus('Route found!');
          ride_info.classList.add('basic-info-shown');
          if (userLocation) {
            statusMessage.classList.add('status-up-location');
            useLocation.classList.add('location-up');
          } else {
            statusMessage.classList.add('status-up');
          }

          generateItinerary(e);
          elevationMap.classList.remove('loaded');
          elevationMap.classList.remove('elevation-map-shown');
          elevationButton.classList.remove('elevation-rotated');
          lowerTags.classList.remove('show-tags');
          pathData = e;

          savePath(e.routes[0]);
        })
        .on('routingerror', function () {
          showStatus('Sorry! Cannot find a route');
        })
        .addTo(map);
    }

    return; // Prevent default route-building flow
  } else {
    if (!start) {
    if (startPoint) map.removeLayer(startPoint);
    if (endPoint) map.removeLayer(endPoint);
    start = e.latlng;

    map.createPane('markerPane');
    map.getPane('markerPane').style.zIndex = 650;

    showStatus('Pick a Second point');
    startPoint = L.circleMarker(start, {
      radius: 8,
      color: 'rgb(0, 153, 255)',
      fillColor: 'rgb(207, 207, 207)',
      weight: 4,
      opacity: 1,
      fillOpacity: 1,
      pane: 'markerPane'
    }).addTo(map);

    if (routingControl) {
      map.removeControl(routingControl);
    }

  } else {
    const end = e.latlng;
    endPoint = L.marker(end).addTo(map);

    if (start === end) {
      showStatus('Please pick a different endpoint.');
      return;
    }

    showStatus('Finding the best route...');
    routingControl = L.Routing.control({
      waypoints: [start, end],
      createMarker: (i, wp, nWps) => {
        if (i === 0 || i === nWps - 1) return null;
        return L.marker(wp.latLng, {draggable: true});
      },
      draggableWaypoints: true,
      addWaypoints: true,
      router: new L.Routing.OpenRouteServiceV2(ROUTE_KEY, {
        profile: 'cycling-regular',
      }),

      routeWhileDragging: true,
      lineOptions: {
        styles: [{ color: 'rgb(0, 153, 255)', opacity: 0.8, weight: 5}]
      },
    })
      .on('routesfound', async function (e) {
        showStatus('Finding Info...');
        await generateBasicInfo(e, end);

        showStatus('Route found!');
        ride_info.classList.add('basic-info-shown');
        if (userLocation) {
          statusMessage.classList.add('status-up-location');
          useLocation.classList.add('location-up');
        } else {
          statusMessage.classList.add('status-up');
        }
        
        generateItinerary(e);
        elevationMap.classList.remove('loaded');
        elevationMap.classList.remove('elevation-map-shown');
        elevationButton.classList.remove('elevation-rotated');
        lowerTags.classList.remove('show-tags');
        pathData = e;

        savePath(e.routes[0]);
      })
      .on('routingerror', function () {
        showStatus('Sorry! Cannot find a route');
      })
      .addTo(map);
    
    start = null;
  }
  }
  
});

infoX.addEventListener('click', () => {
  ride_info.classList.remove('basic-info-shown');
  ride_info.classList.remove('full-info-shown');
  statusMessage.classList.remove('status-up');
  statusMessage.classList.remove('status-up-location');
  useLocation.classList.remove('location-up');
  elevationSection.classList.remove('elevation-section-show');
  lowerTags.classList.add('show-tags');
  moreInfoButton.innerHTML = 'View itinerary';
  
  map.dragging.enable();
  map.scrollWheelZoom.enable();
  map.doubleClickZoom.enable();
  map.touchZoom.enable();
  map.keyboard.enable();
});

moreInfoButton.addEventListener('click', () => {
  ride_info.classList.toggle('full-info-shown');
  elevationSection.classList.toggle('elevation-section-show');
  if (userLocation) {
    statusMessage.classList.toggle('status-up-location');
    useLocation.classList.toggle('location-up');
  } else {
    statusMessage.classList.toggle('status-up');

  }

  if (ride_info.classList.contains('full-info-shown')) {
    moreInfoButton.innerHTML = 'Hide itinerary';
    elevationSection.classList.add('elevation-section-show');

    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.keyboard.disable();
  } else {
    moreInfoButton.innerHTML = 'View itinerary';
    elevationSection.classList.remove('elevation-section-show');

    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.keyboard.enable();
  }
});

elevationButton.addEventListener('click', async () => {
  elevationMap.classList.toggle('elevation-map-shown');
  elevationButton.classList.toggle('elevation-rotated');
  lowerTags.classList.toggle('show-tags');

  if (!elevationMap.classList.contains('loaded')) {
    loading.classList.add('loading-elevation');
    await generateElevationSection(pathData);
    loading.classList.remove('loading-elevation');
    elevationMap.classList.add('loaded');
  }
  
  if (elevationButton.src.includes('minus-icon.png')) {
    elevationButton.src = 'images/plus-icon.png';
    elevationButton.alt = 'expand elevation';
  } else {
    elevationButton.src = 'images/minus-icon.png';
    elevationButton.alt = 'collapse elevation';
  }
});

['wheel', 'touchstart', 'touchmove'].forEach(event => {
  itinerarySection.addEventListener(event, e => e.stopPropagation(), { passive: false });
  searchResults.addEventListener(event, e => e.stopPropagation(), { passive: false });
});

['mousedown', 'click', 'dblclick', 'touchstart'].forEach(event => {
  rightHeader.addEventListener(event, e => e.stopPropagation());
  searchBar.addEventListener(event, e => e.stopPropagation());
  searchIcon.addEventListener(event, e => e.stopPropagation());
  searchResults.addEventListener(event, e => e.stopPropagation());
  useLocation.addEventListener(event, e => e.stopPropagation());
});

function enterSearch(feature) {
  const [lon, lat] = feature.geometry.coordinates;
  const latlng = L.latLng(lat, lon);

  map.setView(latlng, 15);
  map.fire('click', { latlng, originalEvent: new Event('click') });

  searchResults.innerHTML = '';
  searchBar.value = '';
  resultsBox.classList.remove('results-shown');
}

let debounceTimeout;
let highestPlaceName = null;

searchBar.addEventListener('input', () => {
  const query = searchBar.value.trim();
  if (!query) {
    searchResults.innerHTML = '';
    highestPlaceName = null;
    resultsBox.classList.remove('results-shown');
    return;
  } else {
    resultsBox.classList.add('results-shown');
  }

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`)
      .then(res => res.json())
      .then(data => {
        searchResults.innerHTML = '';
        highestPlaceName = null;

        data.features.forEach((feature, i) => {
          if (!i) highestPlaceName = feature;
          const li = document.createElement('li');
          const place = feature.properties;

          li.textContent += `${place.name || `${place.housenumber} ${place.street}` || 'Unnamed'}, `;
          li.textContent += place.city || place.town ? `${place.city || place.town}, ` : '';
          li.textContent += `${place.state || place.country}`;
          li.addEventListener('click', () => enterSearch(feature));
         
          searchResults.appendChild(li);
        });
      });
  }, 100);
});

searchIcon.addEventListener('click', () => { if (searchBar.value) enterSearch(highestPlaceName) });
searchBar.addEventListener('keypress', (e) => { if (e.key === 'Enter' && highestPlaceName && searchBar.value) { enterSearch(highestPlaceName) } });

useLocation.addEventListener('click', () => {
  if (userCoords.length) {
    const latlng = L.latLng(userCoords[0], userCoords[1]);
    map.fire('click', {
      latlng,
      originalEvent: new Event('click')
    });
  }
});
