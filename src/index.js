import Backdrop from './components/backdrop.js';
import FileImporter from './components/file-importer.js';
import MultiSelect from './components/multi-select.js';

let backdrop = new Backdrop('menu', 'front-layer', 'show-menu');
backdrop.register();

let multiSelect = new MultiSelect('multi-item');
multiSelect.register();

let fileImporter = new FileImporter('rom-select', 'submit-btn', 'upload-label');
fileImporter.register();

// navigator.serviceWorker.register('serviceWorker.js', {
//   scope: './'
// })
