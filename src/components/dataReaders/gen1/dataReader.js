import MapReader from './mapReader.js';

export default class DataReaderG1 {
  constructor(data, decoder) {
    this.rawData = data;
    this.decoder = decoder;
    this.processedData = {};

    this.mapReader = new MapReader(data);
  }

  extract() {
    this.decoder.setGame('redBlue');
    this.getRomName();
    this.getControlText();
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

  getControlText() {
    const controlStart = 0x1A55;
    let offset = 0;
    let charList = [];
    let original = [
      '{tm}',
      '{trainer}',
      '{pc}',
      '{rocket}',
      '{poke}',
      '{six_dot}',
      '{target}',
      '{pkmn}',
    ];

    for (let i of original) {
      let char = {
        'original': i,
        'new': [],
      };
      while (this.rawData[controlStart + offset++] != 0x50) {
        char.new.push(this.rawData[controlStart + offset - 1]);
      }
      charList.push(char);
    }

    this.decoder.registerControlChars(charList);
  }
}
