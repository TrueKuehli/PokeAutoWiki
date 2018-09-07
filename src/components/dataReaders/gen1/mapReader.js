import pointer from './pointer.js';

export default class MapReader {
  constructor(data) {
    this.rawData = data;
  }

  extractMaps() {
    let map = this.getMapHeaders(this.getMapHeaderAddresses());
    this.getMapData(map);
    this.getMapObjectData(map);

    return map;
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
          pointer.getPointer(headerOffsetsRaw[i], headerOffsetsRaw[i+1]));
    }

    // Add offset to bank starting index
    for (let i = 0; i < headerOffsets.length; i++) {
      headerAddresses.push(bankAddresses[i] + headerOffsets[i]);
    }

    return headerAddresses;
  }

  getMapHeaders(headerAddresses) {
    let maps = [];

    for (let address of headerAddresses) {
      let map = {
        'memoryBank': Math.floor(address / 0x4000),
        'tilesetId': this.rawData[address],
        'height': this.rawData[address + 1],
        'width': this.rawData[address + 2],
        'connection': null,
        'connections': {},
        'pointers': {
          'mapData': pointer.getPointer(this.rawData[address + 3],
              this.rawData[address + 4]),
          'textPointers': pointer.getPointer(this.rawData[address + 5],
              this.rawData[address + 6]),
          'script': pointer.getPointer(this.rawData[address + 7],
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
              'connectBlock': pointer.getPointer(
                  this.rawData[address + offset++],
                  this.rawData[address + offset++]),
              'currentBlock': pointer.getPointer(
                  this.rawData[address + offset++],
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
          pointer.getPointer(this.rawData[address + offset++],
          this.rawData[address + offset++]);

      maps.push(map);
    }

    return maps;
  }

  getMapData(maps) {
    for (let map of maps) {
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

  getMapObjectData(maps) {
    for (let map of maps) {
      const objectPointer = map.pointers.objectData;
      const fullPointer = map.memoryBank * 0x4000 + objectPointer;

      let offset = 0;

      let objectData = {};
      objectData['borderBlock'] = this.rawData[fullPointer + offset++];

      // Get warp data
      objectData['numWarps'] = this.rawData[fullPointer + offset++];
      objectData['warps'] = [];
      for (let i = 0; i < objectData.numWarps; i++) {
        objectData.warps.push({
          'xPos': this.rawData[fullPointer + offset++],
          'yPos': this.rawData[fullPointer + offset++],
          'warpInId': this.rawData[fullPointer + offset++],
          'destMap': this.rawData[fullPointer + offset++],
        });
      }

      // Get sign data
      objectData['numSigns'] = this.rawData[fullPointer + offset++];
      objectData['signs'] = [];
      for (let i = 0; i < objectData.numSigns; i++) {
        objectData.signs.push({
          'xPos': this.rawData[fullPointer + offset++],
          'yPos': this.rawData[fullPointer + offset++],
          'textId': this.rawData[fullPointer + offset++],
        });
      }

      // Get NPC data
      objectData['numNPCs'] = this.rawData[fullPointer + offset++];
      objectData['npcs'] = [];
      for (let i = 0; i < objectData.numNPCs; i++) {
        let npcData = {
          'picId': this.rawData[fullPointer + offset++],
          'xPos': this.rawData[fullPointer + offset++],
          'yPos': this.rawData[fullPointer + offset++],
          'mov1': this.rawData[fullPointer + offset++],
          'mov2': this.rawData[fullPointer + offset++],
          'typeFlag': this.rawData[fullPointer + offset] & 0b11000000,
          'textId': this.rawData[fullPointer + offset++] & 0b00111111,
        };
        if (npcData.typeFlag & (1 << 7)) {
          // NPC is an item
          npcData['type'] = 'item';
          npcData['itemId'] = this.rawData[fullPointer + offset++];
        } else if (npcData.typeFlag & (1 << 6)) {
          // NPC is a trainer / static Pokémon
          let id = this.rawData[fullPointer + offset++];
          let level = this.rawData[fullPointer + offset++];
          if (id < 200) {
            npcData['type'] = 'pkmnStatic';
            npcData['trainerClass'] = id;
            npcData['rosterId'] = level;
          } else {
            npcData['type'] = 'trainer';
            npcData['trainerClass'] = id;
            npcData['rosterId'] = level;
          }
        } else {
          // NPC is a regular person
          npcData['type'] = 'person';
        }

        objectData.npcs.push(npcData);
      }

      // Warp-in data
      objectData['warpIns'] = [];
      for (let i = 0; i < objectData.numWarps; i++) {
        objectData.warpIns.push({
          'windowPointer': pointer.getPointer(
              this.rawData[fullPointer + offset++],
              this.rawData[fullPointer + offset++]),
          'yPos': this.rawData[fullPointer + offset++],
          'xPos': this.rawData[fullPointer + offset++],
        });
      }

      // Save data
      map.objectData = objectData;
    }
  }
}
