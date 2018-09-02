document.getElementById('show-menu').addEventListener('click', () => {
  let menuContainer = document.getElementById('menu');
  if (menuContainer.classList.contains('hidden')) menuContainer.classList.remove('hidden');
  else menuContainer.classList.add('hidden');

  let menuButton = document.getElementById('show-menu');
  if (menuButton.classList.contains('open')) menuButton.classList.remove('open');
  else menuButton.classList.add('open');
});

document.getElementById('front-layer').addEventListener('click', () => {
  let menuContainer = document.getElementById('menu');
  menuContainer.classList.add('hidden');

  let menuButton = document.getElementById('show-menu');
  menuButton.classList.remove('open');
});

// navigator.serviceWorker.register('service-worker.js', {
//   scope: './'
// })
