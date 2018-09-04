import Backdrop from './components/backdrop.js';
import FileImporter from './components/file-importer.js';

let backdrop = new Backdrop('menu', 'front-layer', 'show-menu');
backdrop.register();

let fileImporter = new FileImporter('rom-select', 'submit-btn');
fileImporter.register();

// navigator.serviceWorker.register('serviceWorker.js', {
//   scope: './'
// })
