export default class Decoder {
  constructor(jsonDecoder, defaultGame) {
    this.dataLoaded = false;
    let dataRequest = new XMLHttpRequest();
    dataRequest.addEventListener('load', (e) => {
      this.data = e.target.response;
      this.dataLoaded = true;
      console.log('Data for decoder loaded.');
    });
    dataRequest.open('GET', jsonDecoder);
    dataRequest.responseType = 'json';
    dataRequest.send();

    this.game = defaultGame;
  }

  setGame(game) {
    this.game = game;
  }

  decodeText(bytes, tries=0) {
    if (!this.dataLoaded) {
      let timeOut = tries * tries * 20;
      console.log('Decoder not ready, retrying in:',
          timeOut.toString() + 'ms');
      window.setTimeout(this.decodeText.bind(this, bytes, tries+1), timeOut);
      return -1;
    }

    let charTable = this.data[this.game]['text-encoding'];
    let result = '';
    for (let byte of bytes) {
      result += charTable[byte];
    }
    return result; // TODO: Replace with callback function, b/c of retries
  }
}
