// Code used in testing to draw 2bpp image data to canvas
// Now replaced by calling rbgfx over WASM, which returns bitmaps

let canvas = document.createElement('canvas');
document.getElementById('front-layer').appendChild(canvas);
canvas.width = 24;
canvas.height = 48;
canvas.style.width = '400px';
canvas.style.height = '400px';
let ctx = canvas.getContext('2d');

let tiles = [];
for (let tileNum = 0; tileNum < decompressor.output.length - 15; tileNum += 16) {
  let tile = [];
  for (let byteGroup = 0; byteGroup < 8; byteGroup++) {
    let byte1 = decompressor.output[tileNum + byteGroup * 2  + 0];
    let byte2 = decompressor.output[tileNum + byteGroup * 2  + 1];

    for (let bitOffset = 0; bitOffset < 8; bitOffset ++) {
      let bitMask = 0b1 << (7 - bitOffset);
      let bit1 = (byte1 & bitMask) >> (7 - bitOffset) << 1;
      let bit2 = (byte2 & bitMask) >> (7 - bitOffset);
      let color = bit1 + bit2;

      tile.push(255 - color * 63) //RED
      tile.push(255 - color * 63) //GREEN
      tile.push(255 - color * 63) //BLUE
      tile.push(255) //ALPHA
    }
  }
  tiles.push(tile);
}

let tileID = 0;
for (let y = 0; y < canvas.height; y += 8) {
  for (let x = 0; x < canvas.width; x += 8) {
    let currentTile = tiles[tileID++];
    let imageData = new ImageData(8,8);
    // Copy image data:
    for (let i = 0; i < currentTile.length; i++) {
      imageData.data[i] = currentTile[i];
    }

    ctx.putImageData(imageData, x, y);
  }
}
