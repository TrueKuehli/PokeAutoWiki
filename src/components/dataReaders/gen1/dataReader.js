import MapReader from './mapReader.js';

export default class DataReaderG1 {
  constructor(data, decoder) {
    this.rawData = data;
    this.decoder = decoder;
    this.processedData = {};

    this.mapReader = new MapReader(data);
  }

  extract() {
    this.getRomName();
    this.processedData['map'] = this.mapReader.extractMaps();

    this.debug();
  }

  debug() {
    console.log(this.processedData);
  }

  getRomName() {
    // Convert ROM Name from ASCII Codes, and remove NULL-characters
    this.processedData.romName =
        String.fromCharCode(...this.rawData.slice(308, 324))
        .replace(/\0/g, '');
  }
}
