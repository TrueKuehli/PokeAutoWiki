import pointer from '../pointer.js';
import Module from './WASMLoader.js';

export default class GFXDecompress {
  constructor(data) {
    this.rawData = data;
    this.convert = Module.cwrap('processFile', 'number', [
      'number',
      'number',
      'number',
    ]);

    window.Module = Module; // DEBUG
  }

  createFileWithData(name, data) {
    Module.FS.createFile('/', name);
    Module.FS.chmod(name, 511); // Set permissions to all allowed (0777 in decimal)

    // Write to file
    const stream = Module.FS.open(name, 'w+');
    Module.FS.write(stream, data, 0, data.length);
    Module.FS.close(stream);
  }

  extractGraphics(frontSize, frontPointer, backPointer) {
    // Extract graphics
    this.createFileWithData('data.bin',
        this.rawData.slice(frontPointer, frontPointer + 0x1000));
    this.convert(frontSize, 0, backPointer - frontPointer);

    let frontSprite = this.readFile('001.bmp');
    let backSprite = this.readFile('001b.bmp');

    // Cleanup
    try {
      Module.FS.unlink('data.bin');
      Module.FS.unlink('001.bmp');
      Module.FS.unlink('001b.bmp');
    } catch (err){
      console.log(err);
    }

    return {frontSprite, backSprite};
  }

  readFile(name) {
    return Module.FS.readFile(name, {'encoding': 'binary'});
  }
}
