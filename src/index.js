import Backdrop from './components/backdrop.js';

let backdrop = new Backdrop('menu', 'front-layer', 'show-menu');
backdrop.register();

// navigator.serviceWorker.register('serviceWorker.js', {
//   scope: './'
// })
