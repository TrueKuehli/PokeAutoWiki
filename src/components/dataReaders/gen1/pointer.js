export default {
  'getPointer': function(lower, upper) {
    return (upper * 0x100 + lower) % 0x4000;
  },
};
