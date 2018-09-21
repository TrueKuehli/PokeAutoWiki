import pointer from './pointer.js';

export default class PkmnReader {
  constructor(data, decoder) {
    this.rawData = data;
    this.decoder = decoder;
  }

  extractPkmnData(pointers) {
    let pkmnData = {};

    const statAddresses = this.getPokemonStatAddresses(
        pointers.pointerPointers.pkmnData.stats);
    const idAddresses = pointers.concretePointers.pkmnData.idMap;

    pkmnData['baseStats'] = this.extractPkmnStats(statAddresses);
    this.extractInternalIds(pkmnData['baseStats'], idAddresses);

    return pkmnData;
  }

  getPokemonStatAddresses(pointers) {
    // Get Memory Bank index
    const bank = this.rawData[pointers.bank];
    // Get pointer
    const statRelPointer = pointer.getPointer(
        this.rawData[pointers.pointer], this.rawData[pointers.pointer + 1]);
    // Calculate absolute pointer
    const statPointer = bank * 0x4000 + statRelPointer;
    const numPkmn = pointers.numPkmn;

    // If Mew has it's own pointer, continue, otherwise just return statPointer
    if (!pointers.mewBank) return [statPointer];

    const mewBank = this.rawData[pointers.mewBank];
    const statRelMew = pointer.getPointer(
        this.rawData[pointers.mewPointer],
        this.rawData[pointers.mewPointer + 1]);
    const mewPointer = mewBank * 0x4000 + statRelMew;

    return [{'num': numPkmn, 'pointer': statPointer},
        {'num': 1, 'pointer': mewPointer}];
  }

  extractPkmnStats(addressList) {
    let pkmnList = [];

    for (let addr of addressList) {
      let data = this.rawData.slice(addr.pointer, addr.pointer + addr.num * 28);
      for (let i = 0; i < addr.num; i++) {
        let pokemon = {
          'dexId': data[i * 28 + 0],
          'hp': data[i * 28 + 1],
          'atk': data[i * 28 + 2],
          'def': data[i * 28 + 3],
          'spd': data[i * 28 + 4],
          'spc': data[i * 28 + 5],
          'type1': data[i * 28 + 6],
          'type2': data[i * 28 + 7],
          'catchRate': data[i * 28 + 8],
          'xpYield': data[i * 28 + 9],
          'frontSpriteSize': data[i * 28 + 10],
          'frontSpritePointer': pointer.getPointer(data[i * 28 + 11],
              data[i * 28 + 12]),
          'backSpritePointer': pointer.getPointer(data[i * 28 + 13],
              data[i * 28 + 14]),
          'lvl1Attacks': [
            data[i * 28 + 15],
            data[i * 28 + 16],
            data[i * 28 + 17],
            data[i * 28 + 18],
          ],
          'growthRate': data[i * 28 + 19],
          'tmFlags': [
            data[i * 28 + 20],
            data[i * 28 + 21],
            data[i * 28 + 22],
            data[i * 28 + 23],
            data[i * 28 + 24],
            data[i * 28 + 25],
            data[i * 28 + 26],
          ],
        };

        pkmnList.push(pokemon);
      }
    }

    return pkmnList;
  }

  extractInternalIds(pokemonList, addresses) {
    const length = addresses.to - addresses.from;
    for (let i = 0; i < length; i++) {
      const dexId = this.rawData[addresses.from + i];
      if (dexId != 0) pokemonList[dexId - 1].internalId = i + 1;
    }
  }
}
