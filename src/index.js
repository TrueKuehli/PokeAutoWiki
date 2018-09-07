import Backdrop from './components/backdrop.js';
import FileImporter from './components/file-importer.js';
import MultiSelect from './components/multi-select.js';
import Decoder from './components/decoder.js';
import DataReaderG1 from './components/dataReader_g1.js';
import BannerController from './components/notification-banner.js';
import UIManager from './components/ui-manager.js';

// Initializing UI Elements
let backdrop = new Backdrop('menu', 'front-layer', 'show-menu');
backdrop.register();

let multiSelect = new MultiSelect('multi-item');
multiSelect.register();

let notifications = new BannerController('notifications',
    'banner-info', 'dismiss-banner');
notifications.register();

// Initialize UI Manager (to disable UI Elements during an operation)
window.uiManager = new UIManager('multi-item', 'file-input', 'file-options',
    'submit-btn', 'upload-text');

// Loading decoder data
let decoder = new Decoder('./ressources/encoding.json', 'redBlue');

// Setting up file importer
let fileImporter = new FileImporter('rom-select', 'submit-btn',
    'upload-label', notifications, uiManager);

// Registering submit pipeline
fileImporter.register((data) => {
  let game = multiSelect.getSelection();
  let dataReader;
  decoder.setGame(game);

  switch (game) {
    case 'redBlue':
      dataReader = new DataReaderG1(data, decoder);
      break;
    default:
      return 1;
  }

  dataReader.extract();

  // Reenable UI
  uiManager.enable();
});

// navigator.serviceWorker.register('serviceWorker.js', {
//   scope: './'
// })
