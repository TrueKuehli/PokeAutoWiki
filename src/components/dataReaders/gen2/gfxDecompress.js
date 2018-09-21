// Code translated from python written by group pret on github(https://github.com/pret)
// Original code found at https://github.com/pret/pokemon-reverse-engineering-tools/blob/master/pokemontools/lz.py

const LZ_END = 0xFF;

// Create Array for flipping bits
let bitFlipped = new Array(0x100);
for (let i = 0; i < 0x100; i++) {
  bitFlipped[i] = 0xFF - i;
}

function reverseDict(dict) {
  let newDict = {};
  for (let key in dict) {
    newDict[dict[key]] = key;
  }
  return newDict;
}


export default class Decompressed {
  /**
   * Interpret and decompress lz-compressed data, usually 2bpp
   * Usage:
   *    data = new Decompressed(lz).output
   * or
   *    data = new Decompressed().decompress(lz)
   * or
   *    d = new Decompressed()
   *    d.lz = lz
   *    data = d.decompress()
   *
   * To decompress from offset 0x80000 in a rom:
   *    data = Decompressed(rom, {'start': 0x80000})
   * -----------------
   * @param {object} args Available arguments: lz, start, commands, debug
   *    lz {Array}: Define raw data
   *    start {number}: define starting index in data
   *    commands {object}: define custom compression commands
   *    debug {boolean}: enable debug output
   */
  constructor(args = {}) {
    this.lz = null;
    this.start = 0;
    this.commands = {
      'literal': 0,
      'iterate': 1,
      'alternate': 2,
      'blank': 3,
      'repeat': 4,
      'flip': 5,
      'reverse': 6,
      'long': 7
    };
    this.debug = false;

    if (typeof args.lz != 'undefined') this.lz = args.lz;
    if (typeof args.start != 'undefined') this.start = args.start;
    if (typeof args.commands != 'undefined') this.commands = args.commands;
    if (typeof args.debug != 'undefined') this.debug = args.debug;

    this.commandNames = reverseDict(this.commands);
    this.address = this.start;

    if (this.lz != null) {
      this.decompress();
    }

    if (this.debug) {
      console.log(this.commandList());
    }
  }

  /**
   * Print a list of commands that were used.
   * Useful for debugging.
   */
  commandList(){
    let text = '';

    let outputAddress = 0;
    for (let elt of this.usedCommands) {
      const name = elt.name;
      const length = elt.length;
      const address = elt.address;
      const cmdLength = elt.cmdLength;
      const offset = elt.offset;
      const direction = elt.direction;

      text += `${outputAddress.toString(16).padStart(3, '0')} ${name}: ${length}`;
      for (let byte of this.lz.slice(address, address + cmdLength)) {
        text += '\t ' + byte.toString(16).padStart(2, '0');
      }

      if (offset != null) {
        let repeatedData = this.output.slice(
            offset, offset + length * direction);
        if (name == 'flip') {
          repeatedData = repeatedData.map(val => bitFlipped[val]);
        }
        text += ' [' + repeatedData.map(
            val => val.toString(16).padStart(2, '0')).join(' ') + ']';
      }

      text += '\n';
      outputAddress += length;
    }

    return text;
  }

  decompress(lz = null) {
    if (lz != null) this.lz = lz;

    this.usedCommands = [];
    this.output = [];

    while (true) {
      const cmdAddress = this.address;
      this.offset = null;
      this.direction = null;

      if (this.byte == LZ_END) {
        this.next();
        break;
      }
      if (this.address > this.lz.length) break;

      this.cmd = (this.byte & 0b11100000) >> 5

      if (this.cmdName == 'long') {
        // 10-bit length
        this.cmd = (this.byte & 0b00011100) >> 2;
        this.len = (this.next() & 0b00000011) * 0x100;
        this.len += this.next() + 1;
      } else {
        // 5-bit length
        this.len = (this.next() & 0b00011111) + 1;
      }


      try {
        this[this.cmdName]();
      } catch(e) {
        console.log("Tried executing: " + this.cmdName);
        continue;
      }

      this.usedCommands.push({
        'name': this.cmdName,
        'length': this.len,
        'address': cmdAddress,
        'offset': this.offset,
        'cmdLength': this.address - cmdAddress,
        'direction': this.direction,
      });
    }

    this.compressedData = this.lz.slice(this.start, this.address);
  }

  get byte() {
    return this.lz[this.address];
  }

  next() {
    const byte = this.byte;
    this.address += 1;
    return byte;
  }

  get cmdName() {
    return this.commandNames[this.cmd];
  }

  getOffset() {
    let offset;
    if (this.byte >= 0x80) {
      // Negative
      offset = this.next() & 0x7f;
      offset = this.output.length - offset - 1;
    } else {
      // Positive
      offset = this.next() * 0x100;
      offset += this.next();
    }

    this.offset = offset;
  }

  /**
   * Copy data directly
   */
  literal() {
    this.output.push(...this.lz.slice(this.address, this.address + this.len));
    this.address += this.len;
  }

  /**
   * Write one byte repeatedly
   */
  iterate() {
    const repByte = this.next()
    for (let i = 0; i < this.len; i++) {
      this.output.push(repByte);
    }
  }

  /**
   * Write alternating bytes
   */
  alternate() {
    const alts = [this.next(), this.next()];
    for (let i = 0; i < this.len; i++) {
      this.output.push(alts[i & 1]);
    }
  }

  /**
   * Write zeros
   */
  blank() {
    for (let i = 0; i < this.len; i++) {
      this.output.push(0);
    }
  }

  /**
   * Repeat flipped bytes from output.
   *
   * Example: 11100100 -> 00100111
   */
  flip() {
    this._repeat(1, bitFlipped);
  }

  /**
   * Repeat reversed bytes from output
   */
  reverse() {
    this._repeat(-1);
  }

  /**
   * Repeat bytes from output
   */
  repeat() {
    this._repeat();
  }

  _repeat(direction = 1, table = null) {
    this.getOffset();
    this.direction = direction;

    // Notes: appends must be one at a time
    // (this way, repeats can draw from themselves if required)
    for (let i = 0; i < this.len; i++) {
      const byte = this.output[this.offset + i * direction];
      this.output.push((table) ? table[byte] : byte);
    }
  }
}
