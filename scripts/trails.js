import { trailData } from "../data/trails.js";
import { distanceRound, formatTime } from "./utils.js";

const searchIcon = document.querySelector('.search-icon-js');
const trailSection = document.querySelector('.trail-section');
const searchBar = document.querySelector('.search-bar');
const body = document.querySelector('main');

searchIcon.addEventListener('click', () => {
  searchBar.classList.toggle('search-bar-focus');
  if (searchBar.value) searchBar.classList.add('search-bar-focus');
});

searchBar.addEventListener('input', () => {
  if (searchBar.value) searchBar.classList.add('search-bar-focus');
});

document.addEventListener('click', (e) => {
  const searchClicked = searchBar.contains(e.target) || searchIcon.contains(e.target);
  if (!searchClicked && !searchBar.value) searchBar.classList.remove('search-bar-focus');
});

trailData.forEach(trail => {
  body.innerHTML += `
  <section class="trail-section" id="${trail.id}">
    <div class="trail-image-container">
      <img src="images/trail images/${trail.images}.jpg" alt="${trail.name} image">
    </div>
    <article class="trail-text">
      <div class="upper-trail">
        <div class="upper-trail-text">
          <h2>${trail.name}</h2>
          <p class="trail-location">Montreal, Quebec</p>
        </div>
        <div class="trail-menu-group">
          <img class="menu-icon-js" src="images/menu.png" alt="more option">
          <div class="trail-menu">
            <p><img src="images/save-icon.png" alt="save icon">Save</p>
            <p><img src="images/download.png" alt="download icon">Download</p>
            <p><img class="report" src="images/flag.png" alt="flag icon">Report</p>
          </div>
        </div> 
      </div>
        
      <div class="trail-info">
        <p>${formatTime(trail.estimated_time / 60)}</p>
        <p>${distanceRound(trail.length / 1000)}</p>
        <p><img src="images/star.png" alt="star-icon">${trail.rating}</p>
        <p>${trail.difficulty}</p>
      </div>
    </article>
    </section>`;
});