const searchIcon = document.querySelector('.search-icon-js');
const searchBar = document.querySelector('.search-bar');

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