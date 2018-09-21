import pointer from './pointer.js';

export default class TextReader {
  constructor(data, decoder) {
    this.rawData = data;
    this.decoder = decoder;
  }

  extractText(pointers) {
    let text = {};
    text['pkmnNames'] = this.extractPkmnNames(pointers);

    return text;
  }

  extractPkmnNames(pointers) {
    const pointerPos = pointers.pointerPointers.text.pkmnNames.pointerPos;
    const namesPointer = pointer.getPointer(this.rawData[pointerPos],
        this.rawData[pointerPos + 1]);
    const bank = pointers.concretePointers.text.pkmnNames.bank;
    const numPkmnIds = pointers.concretePointers.text.pkmnNames.numPkmn;
    const absolutePointer = bank * 0x4000 + namesPointer;

    // ID 0 is null, since internal ids are 1-based
    let pkmnNames = [null];
    for (let i = 0; i < numPkmnIds; i++) {
      pkmnNames.push(this.decoder.decodeText(this.rawData.slice(
          absolutePointer + i*10, absolutePointer + i*10 + 10))
          .replace(/{end}/g, ''));
    }

    return pkmnNames;
  }
}
