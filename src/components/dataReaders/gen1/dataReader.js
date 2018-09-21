import MapReader from './mapReader.js';
import PkmnReader from './pkmnReader.js';
import GFXReader from './gfxReader.js';
import ShopReader from './shopReader.js';
import TextReader from './textReader.js';

import defaultPointers from './_pointersDefault.js';

export default class DataReaderG1 {
  constructor(data, decoder) {
    this.rawData = data;
    this.decoder = decoder;
    this.processedData = {};

    this.defPointers = defaultPointers;

    this.mapReader = new MapReader(data);
    this.pkmnReader = new PkmnReader(data, decoder);
    this.gfxReader = new GFXReader(data);
    this.shopReader = new ShopReader(data);
    this.textReader = new TextReader(data, decoder);
  }

  extract(game = 'redBlue', customPointers = null) {
    // Set pointers
    let usedPointers = {};
    if (game == 'redBlue') usedPointers = this.defPointers['redBlue'];
    else if (game == 'yellow') usedPointers = this.defPointers['yellow'];

    // Add custom pointers if given as argument
    if (customPointers != null) {
      usedPointers = Object.assign(usedPointers, customPointers);
    }

    this.decoder.setGame(game);

    this.getRomName(usedPointers.concretePointers.basic.romName);
    this.getControlText(usedPointers.concretePointers.basic.ctrlText);

    this.processedData['map'] =
        this.mapReader.extractMaps(usedPointers);
    this.processedData['pokemon'] =
        this.pkmnReader.extractPkmnData(usedPointers);
    this.processedData['gfx'] =
        this.gfxReader.extractGraphics(this.processedData.pokemon.baseStats);

    this.debug();
  }

  debug() {
    console.log(this.processedData);
  }

  getRomName(pointer) {
    // Convert ROM Name from ASCII Codes, and remove NULL-characters
    this.processedData.romName =
        String.fromCharCode(...this.rawData.slice(pointer.from, pointer.to))
        .replace(/\0/g, '');
  }

  getControlText(pointer) {
    const controlStart = pointer.from;
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
