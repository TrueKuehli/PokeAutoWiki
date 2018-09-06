import Backdrop from './components/backdrop.js';
import FileImporter from './components/file-importer.js';
import MultiSelect from './components/multi-select.js';
import Decoder from './components/decoder.js';
import DataReaderG1 from './components/dataReader_g1.js';

// Initializing UI Elements
let backdrop = new Backdrop('menu', 'front-layer', 'show-menu');
backdrop.register();

let multiSelect = new MultiSelect('multi-item');
multiSelect.register();

// Loading decoder data
let decoder = new Decoder('./ressources/encoding.json', 'redBlue');

// Setting up file uploader with callback to decoder
let fileImporter = new FileImporter('rom-select', 'submit-btn', 'upload-label');
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
});

// decoder, multiSelect.getSelection.bind(multiSelect));

// navigator.serviceWorker.register('serviceWorker.js', {
//   scope: './'
// })
