import Backdrop from './components/ui/backdrop.js';
import FileImporter from './components/ui/file-importer.js';
import MultiSelect from './components/ui/multi-select.js';
import DataReaderG1 from './components/dataReaders/gen1/dataReader.js';
import BannerController from './components/ui/notification-banner.js';
import UIManager from './components/ui/ui-manager.js';
import Decoder from './components/dataReaders/decoder.js';

// Initializing UI Elements and UI Manager
let backdrop = new Backdrop('menu', 'front-layer', 'show-menu');
let multiSelect = new MultiSelect('multi-item');
let notifications = new BannerController('notifications',
    'banner-info', 'dismiss-banner');
let uiManager = new UIManager('multi-item', 'file-input', 'file-options',
    'submit-btn', 'upload-text');

backdrop.register();
multiSelect.register();
notifications.register();


// Setting up file processing pipeline
let decoder = new Decoder('./ressources/encoding.json', 'redBlue',
    uiManager, notifications);
let fileImporter = new FileImporter('rom-select', 'submit-btn',
    'upload-label', notifications, uiManager);


// Registering processing start
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

// Registering service worker. Disabled during dev, due to frequent file changes
// navigator.serviceWorker.register('serviceWorker.js', {
//   scope: './'
// })
