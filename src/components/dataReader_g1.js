export default class DataReaderG1 {
  constructor(data, decoder) {
    this.rawData = data;
    this.decoder = decoder;
    this.processedData = {};
  }

  extract() {
    this.getRomName();
    this.getMapHeaders(this.getMapHeaderAddresses());
    this.getMapData();
    // this.getMapObjectData();

    this.debug();
  }

  debug() {
    console.log(this.processedData);
  }

  getPointer(lower, upper) {
    return parseInt(upper.toString(16) + lower.toString(16), 16) % 0x4000;
  }

  getRomName() {
    // Convert ROM Name from ASCII Codes, and remove NULL-characters
    this.processedData.romName =
        String.fromCharCode(...this.rawData.slice(308, 324))
        .replace(/\0/g, '');
  }

  getMapHeaderAddresses() {
    // Get Memory Bank indexes
    const banks = Array.from(this.rawData.slice(49725, 49973));
    const bankAddresses = banks.map((val) => val * 16384);

    // Get offset values
    const headerOffsetsRaw = this.rawData.slice(430, 926);
    let headerOffsets = [];
    let headerAddresses = [];

    // Calculate offset (put bytes in correct order and
    // modulo 4000 to stay in correct bank)
    for (let i = 0; i < headerOffsetsRaw.length; i+=2) {
      headerOffsets.push(
          this.getPointer(headerOffsetsRaw[i], headerOffsetsRaw[i+1]));
    }

    // Add offset to bank starting index
    for (let i = 0; i < headerOffsets.length; i++) {
      headerAddresses.push(bankAddresses[i] + headerOffsets[i]);
    }

    return headerAddresses;
  }

  getMapHeaders(headerAddresses) {
    this.processedData.map = [];

    for (let address of headerAddresses) {
      let map = {
        'memoryBank': Math.floor(address / 0x4000),
        'tilesetId': this.rawData[address],
        'height': this.rawData[address + 1],
        'width': this.rawData[address + 2],
        'connection': null,
        'connections': {},
        'pointers': {
          'mapData': this.getPointer(this.rawData[address + 3],
              this.rawData[address + 4]),
          'textPointers': this.getPointer(this.rawData[address + 5],
              this.rawData[address + 6]),
          'script': this.getPointer(this.rawData[address + 7],
              this.rawData[address + 8]),
        },
      };

      let offset = 9;

      // Get map connections
      map.connection = this.rawData[address + offset++];

      // Go through cardinal directions, if connected add to connections list
      for (let i = 3; i >= 0; i--) {
        let direction = '';
        switch (i) {
          case 3: direction = 'north'; break;
          case 2: direction = 'south'; break;
          case 1: direction = 'west'; break;
          case 0: direction = 'east'; break;
        }
        if (map.connection & (1 << i)) {
          map.connections[direction] = {
            'mapId': this.rawData[address + offset++],
            'pointers': {
              'connectBlock': this.getPointer(this.rawData[address + offset++],
                  this.rawData[address + offset++]),
              'currentBlock': this.getPointer(this.rawData[address + offset++],
                  this.rawData[address + offset++]),
            },
            'biggness': this.rawData[address + offset++],
            'mapWidth': this.rawData[address + offset++],
            'yPos': this.rawData[address + offset++],
            'xPos': this.rawData[address + offset++],
            'window': 256 * this.rawData[address + offset++] +
                this.rawData[address + offset++],
          };
        }
      }

      map.pointers['objectData'] =
          this.getPointer(this.rawData[address + offset++],
          this.rawData[address + offset++]);

      this.processedData.map.push(map);
    }
  }

  getMapData() {
    for (let map of this.processedData.map) {
      const dataPointer = map.pointers.mapData;
      const fullPointer = map.memoryBank * 0x4000 + dataPointer;
      const width = map.width;
      const height = map.height;

      let tiles = [];

      for (let h = 0; h < height; h++) {
        tiles[h] = [];
        for (let w = 0; w < width; w++) {
          const offset = h * width + w;
          tiles[h][w] = this.rawData[fullPointer + offset];
        }
      }

      map.tiles = tiles;
    }
  }
}
