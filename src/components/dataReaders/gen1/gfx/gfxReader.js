import GFXDecompress from './gfxDecompress.js';

export default class GFXReader {
  constructor(data) {
    this.rawData = data;
    this.decompressor = new GFXDecompress(data);
  }

  extractGraphics(pkmnList) {
    let gfx = {};
    gfx['pokemonSprites'] = this.extractPokemonGFX(pkmnList);

    return gfx;
  }

  extractPokemonGFX(pkmnList) {
    let pokemonGFX = [];
    for (let pkmn of pkmnList) {
      const dexId = pkmn.dexId;
      const frontWidth = pkmn.frontSpriteSize >> 4; // High nibble is width
      const frontHeight = pkmn.frontSpriteSize & 0b1111; // Low nibble is height
      const backWidth = 4; // Backsprite dimensions are hard coded in the game
      const backHeight = 4;
      const frontPointerRel = pkmn.frontSpritePointer; // Get offset in bank
      const backPointerRel = pkmn.backSpritePointer;

      // Figure out which bank to look in, depending on the internal ID
      let iId = pkmn.internalId;
      let bank;
      if (iId == 0x15) bank = 0x01;
      else if (iId == 0xB6) bank = 0x0B;
      else if (iId >= 0x00 && iId <= 0x1E) bank = 0x09;
      else if (iId >= 0x1F && iId <= 0x49) bank = 0x0A;
      else if (iId >= 0x4A && iId <= 0x73) bank = 0x0B;
      else if (iId >= 0x74 && iId <= 0x98) bank = 0x0C;
      else if (iId >= 0x99 && iId <= 0xFF) bank = 0x0D;

      // Combine relative and bank pointer
      const frontPointer = (bank * 0x4000) + (frontPointerRel % 0x4000);
      const backPointer = (bank * 0x4000) + (backPointerRel % 0x4000);

      // Extract graphics and create Blob from data for use in <img> elements
      const graphics = this.decompressor.extractGraphics(frontWidth,
          frontPointer, backPointer);
      const frontSprite = new Blob([graphics.frontSprite], {'type': 'image/bmp'});
      const backSprite = new Blob([graphics.backSprite], {'type': 'image/bmp'});

      let gfx = {
        'dexId': dexId,
        'internalId': iId,
        'frontSprite': frontSprite,
        'frontDimensions': {
          'width': frontWidth,
          'height': frontWidth, // Currently C Program only supports square images
        },
        'backSprite': backSprite,
        'backDimensions': {
          'width': backWidth,
          'height': backHeight,
        },
      };
      pokemonGFX.push(gfx);
    }

    return pokemonGFX;
  }
}
