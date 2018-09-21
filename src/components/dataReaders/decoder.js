export default class Decoder {
  constructor(jsonDecoder, defaultGame, uiMan, notificationMan) {
    uiMan.disable();
    notificationMan.show('decoderInit', 'Initializing Decoder...');
    this.dataLoaded = false;
    let dataRequest = new XMLHttpRequest();
    dataRequest.addEventListener('load', (e) => {
      this.data = e.target.response;
      this.dataLoaded = true;
      uiMan.enable();
      notificationMan.hide('decoderInit')
    });
    dataRequest.open('GET', jsonDecoder);
    dataRequest.responseType = 'json';
    dataRequest.send();

    this.game = defaultGame;
  }

  setGame(game) {
    this.game = game;
  }

  decodeText(bytes) {
    let charTable = this.data[this.game]['text-encoding'];
    let result = '';
    for (let byte of bytes) {
      result += charTable[byte];
    }
    return result;
  }

  registerControlChars(charList) {
    let charTable = this.data[this.game]['text-encoding'];
    for (let char of charList) {
      if (charTable.includes(char.original)) {
        const index = charTable.indexOf(char.original);
        charTable[index] = this.decodeText(char.new);
      }
    }
  }
}
