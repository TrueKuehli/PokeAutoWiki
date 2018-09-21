import pointer from './pointer.js';

export default class TextReader {
  constructor(data) {
    this.rawData = data;
  }

  extractItemData(pointers) {
    let itemData = {};
    itemData['prices'] = this.extractItemPrices(pointers);

    return itemData;
  }

  extractItemPrices(pointers) {
    const pricePointer = pointers.concretePointers.itemData.itemPrices;
    let prices = [];

    for (let i = pricePointer.from; i < pricePointer.to; i += 3) {
      // Convert (ie. 0x200 becomes 200 etc.)

      prices.push(parseInt(this.rawData[i].toString(16) +
          this.rawData[i+1].toString(16) + this.rawData[i+2].toString(16)));
    }

    return prices;
  }
}
