let defaultPointers = {
  'redBlue': {
    'pointerPointers': {
      'map': {
        'headers': {
          'banks': {
            'from': 0xC23D,
            'to': 0xC335,
          },
          'pointers': {
            'from': 0x1AE,
            'to': 0x39E,
          },
        },
      },
      'pkmnData': {
        'stats': {
          'bank': 0x153B,
          'mewBank': 0x159C,
          'pointer': 0x1578,
          'mewPointer': 0x1593,
          'numPkmn': 150,
        },
      },
      'text': {
        'pkmnNames': {
          'pointerPos': 0x2FAE,
        },
      },
    },
    'concretePointers': {
      'basic': {
        'romName': {
          'from': 0x134,
          'to': 0x144,
        },
        'ctrlText': {
          'from': 0x1A55,
        },
      },
      'shop': {
        'from': 0x2442,
      },
      'itemData': {
        'itemPrices': {
          'from': 0x4608,
          'to': 0x472A,
        },
      },
      'text': {
        'pkmnNames': {
          'bank': 7,
          'numPkmn': 190,
        },
        'itemNames': {
          'from': 0x472B,
          'to': 0x4A91,
        },
      },
      'titleScreen': {
        'firstPkmn': 0x4399,
        'pkmnList': {
          'from': 0x4588,
          'to': 0x4597,
        },
      },
      'pkmnData': {
        'idMap': {
          'from': 0x41024,
          'to': 0x410E2,
        }
      }
    },
  },
};

export default defaultPointers;
