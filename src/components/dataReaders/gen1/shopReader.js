import pointer from './pointer.js';

export default class ShopReader {
  constructor(data) {
    this.rawData = data;
  }

  extractShopData(pointers) {
    const shopDataStart = pointers.concretePointers.shop.from;
    let offset = 0;
    let shops = [];

    while (this.rawData[shopDataStart + offset] != 0x50) {
      let shop = {'items': []};
      while (this.rawData[shopDataStart + offset] != 0xFF) {
        if (this.rawData[shopDataStart + offset] == 0xFE) {
          // Starting byte of shop
          offset++;
          // Followed by item amount
          shop['itemAmt'] = this.rawData[shopDataStart + offset++];
        } else {
          // Push new item to shop
          shop.items.push(this.rawData[shopDataStart + offset++]);
        }
      }
      shops.push(shop);
      offset++;
    }

    return shops;
  }
}
