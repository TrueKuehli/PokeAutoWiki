export default {
  'getPointer': function(lower, upper) {
    return parseInt(upper.toString(16) + lower.toString(16), 16) % 0x4000;
  },
};
